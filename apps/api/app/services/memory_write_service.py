from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
import re

from sqlalchemy.orm import Session

from app.models.memory import Memory
from app.models.workspace import Workspace
from app.repos.memory_repo import MemoryRepo
from app.repos.memory_suggestion_repo import MemorySuggestionRepo
from app.schemas.memory_enums import MemoryScope, MemorySuggestionStatus, MemoryType
from app.schemas.memory_suggestion import MemorySuggestionCreate

MAX_SUGGESTIONS_PER_MESSAGE = 2
MIN_MESSAGE_LENGTH = 18
REJECTED_COOLDOWN_DAYS = 7


@dataclass
class ExtractedCandidate:
    content: str
    memory_type: MemoryType
    reason: str
    confidence: float
    category: str


class MemoryWriteService:
    def __init__(
        self,
        memory_repo: MemoryRepo | None = None,
        suggestion_repo: MemorySuggestionRepo | None = None,
    ) -> None:
        self.memory_repo = memory_repo or MemoryRepo()
        self.suggestion_repo = suggestion_repo or MemorySuggestionRepo()

    def generate_suggestions_for_chat_turn(
        self,
        db: Session,
        *,
        workspace: Workspace,
        conversation_id: str,
        message_id: str,
        user_message: str,
        gem_id: str | None,
    ) -> list[str]:
        if not self._should_process_message(user_message):
            return []

        scope, scope_id = self._choose_scope(
            workspace_id=workspace.id,
            gem_id=gem_id,
            user_message=user_message,
        )
        candidates = self._extract_candidates(user_message)
        if not candidates:
            return []

        existing_memories = self.memory_repo.list(
            db,
            scope=scope,
            scope_id=scope_id,
            enabled=True,
        )
        pending_suggestions = self.suggestion_repo.list(
            db,
            status=MemorySuggestionStatus.PENDING,
            scope=scope,
            scope_id=scope_id,
        )
        rejected_suggestions = self.suggestion_repo.list(
            db,
            status=MemorySuggestionStatus.REJECTED,
            scope=scope,
            scope_id=scope_id,
        )

        existing_norm = [self._normalize_for_compare(memory.content) for memory in existing_memories]
        pending_norm = [self._normalize_for_compare(s.proposed_content) for s in pending_suggestions]
        recent_rejected_norm = [
            self._normalize_for_compare(s.proposed_content)
            for s in rejected_suggestions
            if self._in_rejected_cooldown(s.updated_at or s.created_at)
        ]
        seen_norm: set[str] = set(existing_norm + pending_norm)

        created_ids: list[str] = []
        for candidate in candidates:
            if len(created_ids) >= MAX_SUGGESTIONS_PER_MESSAGE:
                break

            normalized = self._normalize_for_compare(candidate.content)
            if not normalized:
                continue
            if self._is_duplicate_like(normalized, seen_norm):
                continue
            if self._is_duplicate_like(normalized, recent_rejected_norm):
                continue
            if self._has_obvious_contradiction(normalized, existing_norm):
                continue

            payload = MemorySuggestionCreate(
                source_conversation_id=conversation_id,
                source_message_id=message_id,
                scope=scope,
                scope_id=scope_id,
                type=candidate.memory_type,
                proposed_content=self._normalize_for_store(candidate.content),
                confidence=candidate.confidence,
                reason=candidate.reason,
                candidate_signals_json={
                    "category": candidate.category,
                    "normalized": normalized,
                    "source": "deterministic_v1",
                },
            )
            created = self.suggestion_repo.create(db, payload)
            created_ids.append(created.id)
            seen_norm.add(normalized)

        return created_ids

    def _should_process_message(self, message: str) -> bool:
        text = (message or "").strip()
        if len(text) < MIN_MESSAGE_LENGTH:
            return False
        lower = text.lower()
        transient_markers = (
            "for this message",
            "for now",
            "right now",
            "today",
            "today i need",
            "this time",
            "just once",
            "for this chat",
            "for this conversation",
            "היום",
            "עכשיו",
            "בהודעה הזאת",
            "בהודעה הזו",
            "לצורך השיחה הזאת",
            "לצורך השיחה הזו",
        )
        durable_markers = (
            "i prefer",
            "i don't want",
            "i do not want",
            "i want",
            "always",
            "never",
            "use english",
            "use hebrew",
            "default to",
            "i study",
            "i work as",
            "i live in",
            "my goal is",
            "keep answers",
            "אני מעדיף",
            "אני מעדיפה",
            "אני רוצה",
            "אני לא רוצה",
            "תמיד",
            "אף פעם אל",
            "אל ת",
            "ברירת מחדל",
            "אני לומד",
            "אני לומדת",
            "אני עובד כ",
            "אני עובדת כ",
            "אני גר ב",
            "אני גרה ב",
            "המטרה שלי היא",
            "תענה באנגלית",
            "תענה בעברית",
            "תשמור על תשובות",
            "שלב שלב",
        )
        if any(marker in lower for marker in transient_markers) and not any(
            marker in lower for marker in durable_markers
        ):
            return False
        return True

    def _extract_candidates(self, message: str) -> list[ExtractedCandidate]:
        segments = [segment.strip() for segment in re.split(r"[.\n;]+", message) if segment.strip()]
        extracted: list[ExtractedCandidate] = []
        for segment in segments:
            lower = segment.lower()
            if re.search(
                r"\bi prefer\b|\bi (?:don't|do not) want\b|\bi want\b|אני (?:מעדיף|מעדיפה|מעדיפים|מעדיפות)|אני לא רוצה|אני רוצה",
                lower,
            ):
                extracted.append(
                    ExtractedCandidate(
                        content=segment,
                        memory_type=MemoryType.PREFERENCE,
                        reason="pattern:durable_preference",
                        confidence=0.78,
                        category="durable_preference",
                    )
                )
                continue
            if re.search(
                r"\bi (?:study|am studying|work as|live in)\b|\bmy goal is\b|אני לומד(?:ת)?|אני עובד(?:ת)? כ|אני גר(?:ה)? ב|המטרה שלי היא",
                lower,
            ):
                extracted.append(
                    ExtractedCandidate(
                        content=segment,
                        memory_type=MemoryType.FACT,
                        reason="pattern:profile_fact",
                        confidence=0.74,
                        category="profile_fact",
                    )
                )
                continue
            if re.search(
                r"\b(?:always|never)\b|\bdefault to\b|\buse (?:english|hebrew)\b|\bkeep answers?\b|\bask .*step by step\b|תמיד|אף פעם אל|אל ת|תענה (?:באנגלית|בעברית)|תשמור על תשובות(?: קצרות)?|שלב שלב|ברירת מחדל",
                lower,
            ):
                extracted.append(
                    ExtractedCandidate(
                        content=segment,
                        memory_type=MemoryType.INSTRUCTION,
                        reason="pattern:interaction_instruction",
                        confidence=0.76,
                        category="interaction_instruction",
                    )
                )
                continue
        return extracted

    def _choose_scope(
        self,
        *,
        workspace_id: str,
        gem_id: str | None,
        user_message: str,
    ) -> tuple[MemoryScope, str | None]:
        if gem_id and self._looks_gem_specific(user_message):
            return MemoryScope.GEM, gem_id
        return MemoryScope.WORKSPACE, workspace_id

    @staticmethod
    def _looks_gem_specific(message: str) -> bool:
        lower = message.lower()
        gem_markers = (
            "for this gem",
            "when using this gem",
            "this gem should",
            "in this gem",
        )
        return any(marker in lower for marker in gem_markers)

    @staticmethod
    def _normalize_for_store(text: str) -> str:
        return re.sub(r"\s+", " ", text.strip())

    @staticmethod
    def _normalize_for_compare(text: str) -> str:
        lowered = text.strip().lower()
        lowered = re.sub(r"[^\w\s]", " ", lowered)
        lowered = re.sub(r"\s+", " ", lowered)
        return lowered.strip()

    @staticmethod
    def _is_duplicate_like(normalized: str, existing: list[str] | set[str]) -> bool:
        if normalized in existing:
            return True
        for item in existing:
            if not item:
                continue
            if normalized in item or item in normalized:
                if abs(len(item) - len(normalized)) <= 10:
                    return True
        return False

    @staticmethod
    def _in_rejected_cooldown(rejected_time: datetime | None) -> bool:
        if rejected_time is None:
            return False
        now = datetime.now(UTC)
        if rejected_time.tzinfo is None:
            rejected_time = rejected_time.replace(tzinfo=UTC)
        return rejected_time >= now - timedelta(days=REJECTED_COOLDOWN_DAYS)

    def _has_obvious_contradiction(self, normalized: str, existing_norm: list[str]) -> bool:
        polarity_topic = self._polarity_signature(normalized)
        if polarity_topic is None:
            return False
        polarity, topic = polarity_topic
        for existing in existing_norm:
            existing_sig = self._polarity_signature(existing)
            if existing_sig is None:
                continue
            existing_polarity, existing_topic = existing_sig
            if topic == existing_topic and polarity != existing_polarity:
                return True
        return False

    @staticmethod
    def _polarity_signature(normalized: str) -> tuple[int, str] | None:
        patterns: list[tuple[str, int]] = [
            (r"^always (.+)$", 1),
            (r"^never (.+)$", -1),
            (r"^i prefer (.+)$", 1),
            (r"^i want (.+)$", 1),
            (r"^i do not want (.+)$", -1),
            (r"^i don t want (.+)$", -1),
            (r"^do not (.+)$", -1),
            (r"^don t (.+)$", -1),
            (r"^תמיד (.+)$", 1),
            (r"^אני (?:מעדיף|מעדיפה|מעדיפים|מעדיפות) (.+)$", 1),
            (r"^אני רוצה (.+)$", 1),
            (r"^אני לא רוצה (.+)$", -1),
            (r"^אל ת(.+)$", -1),
            (r"^אף פעם אל (.+)$", -1),
        ]
        for pattern, polarity in patterns:
            match = re.match(pattern, normalized)
            if not match:
                continue
            topic = re.sub(r"\s+", " ", match.group(1)).strip()
            if topic:
                return (polarity, topic)
        return None
