from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.gem import Gem
from app.schemas.gem import GemCreate, GemUpdate
from app.utils.json_codec import dump_json_text


class GemRepo:
    def list(self, db: Session, workspace_id: str | None = None, include_global: bool = True) -> list[Gem]:
        stmt = select(Gem).order_by(Gem.created_at.desc())
        if workspace_id:
            if include_global:
                stmt = stmt.where(or_(Gem.workspace_id == workspace_id, Gem.is_global.is_(True)))
            else:
                stmt = stmt.where(Gem.workspace_id == workspace_id)
        elif not include_global:
            stmt = stmt.where(Gem.is_global.is_(False))
        return list(db.scalars(stmt).all())

    def get(self, db: Session, gem_id: str) -> Gem | None:
        return db.get(Gem, gem_id)

    def create(self, db: Session, payload: GemCreate) -> Gem:
        values = payload.model_dump()
        values["style_rules_json"] = dump_json_text(payload.style_rules_json)
        values["allowed_models_json"] = dump_json_text(payload.allowed_models_json)
        gem = Gem(**values)
        db.add(gem)
        db.commit()
        db.refresh(gem)
        return gem

    def update(self, db: Session, gem: Gem, payload: GemUpdate) -> Gem:
        incoming = payload.model_dump(exclude_unset=True)
        if "style_rules_json" in incoming:
            incoming["style_rules_json"] = dump_json_text(payload.style_rules_json)
        if "allowed_models_json" in incoming:
            incoming["allowed_models_json"] = dump_json_text(payload.allowed_models_json)
        for field, value in incoming.items():
            setattr(gem, field, value)
        db.add(gem)
        db.commit()
        db.refresh(gem)
        return gem

    def delete(self, db: Session, gem: Gem) -> None:
        db.delete(gem)
        db.commit()
