from fastapi.testclient import TestClient


def create_workspace(client: TestClient) -> str:
    response = client.post(
        "/api/workspaces",
        json={
            "name": "Memory Workspace",
            "description": "Workspace for memory tests",
            "default_chat_model": "qwen3.5:9b",
            "default_language": "en",
            "use_global_memory": False,
            "global_memory_mode": "all",
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_create_valid_memory(client: TestClient) -> None:
    workspace_id = create_workspace(client)

    response = client.post(
        "/api/memories",
        json={
            "scope": "workspace",
            "scope_id": workspace_id,
            "type": "fact",
            "content": "User prefers short answers.",
            "pinned": True,
            "enabled": True,
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["scope"] == "workspace"
    assert body["scope_id"] == workspace_id
    assert body["type"] == "fact"
    assert body["content"] == "User prefers short answers."
    assert body["pinned"] is True
    assert body["enabled"] is True
    assert body["always_include"] is False
    assert body["importance"] == 0.5
    assert body["confidence"] == 1.0
    assert body["source"] is None
    assert body["tags_json"] is None
    assert body["last_used_at"] is None
    assert body["times_used"] == 0
    assert "id" in body


def test_create_memory_with_explicit_new_fields(client: TestClient) -> None:
    workspace_id = create_workspace(client)
    response = client.post(
        "/api/memories",
        json={
            "scope": "workspace",
            "scope_id": workspace_id,
            "type": "fact",
            "content": "Remember this with metadata.",
            "always_include": True,
            "importance": 0.9,
            "confidence": 0.8,
            "source": "manual:test",
            "tags_json": ["profile", "style"],
            "last_used_at": "2026-01-02T03:04:05",
            "times_used": 4,
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["always_include"] is True
    assert body["importance"] == 0.9
    assert body["confidence"] == 0.8
    assert body["source"] == "manual:test"
    assert body["tags_json"] == ["profile", "style"]
    assert body["last_used_at"].startswith("2026-01-02T03:04:05")
    assert body["times_used"] == 4


def test_memory_scope_scope_id_validation(client: TestClient) -> None:
    global_with_scope_id = client.post(
        "/api/memories",
        json={
            "scope": "global",
            "scope_id": "workspace-123",
            "type": "fact",
            "content": "This should fail",
        },
    )
    assert global_with_scope_id.status_code in (400, 422)

    workspace_without_scope_id = client.post(
        "/api/memories",
        json={
            "scope": "workspace",
            "type": "fact",
            "content": "This should also fail",
        },
    )
    assert workspace_without_scope_id.status_code in (400, 422)


def test_update_memory_fields(client: TestClient) -> None:
    workspace_id = create_workspace(client)
    create_response = client.post(
        "/api/memories",
        json={
            "scope": "workspace",
            "scope_id": workspace_id,
            "type": "preference",
            "content": "Initial content",
            "pinned": False,
            "enabled": True,
        },
    )
    memory_id = create_response.json()["id"]

    update_response = client.patch(
        f"/api/memories/{memory_id}",
        json={
            "content": "Updated content",
            "type": "instruction",
            "always_include": True,
            "importance": 0.2,
            "confidence": 0.7,
            "tags_json": ["updated", "tag"],
            "pinned": True,
            "enabled": False,
        },
    )
    assert update_response.status_code == 200
    body = update_response.json()
    assert body["content"] == "Updated content"
    assert body["type"] == "instruction"
    assert body["always_include"] is True
    assert body["importance"] == 0.2
    assert body["confidence"] == 0.7
    assert body["tags_json"] == ["updated", "tag"]
    assert body["pinned"] is True
    assert body["enabled"] is False


def test_delete_memory(client: TestClient) -> None:
    response = client.post(
        "/api/memories",
        json={
            "scope": "global",
            "type": "fact",
            "content": "Temporary memory",
        },
    )
    memory_id = response.json()["id"]

    delete_response = client.delete(f"/api/memories/{memory_id}")
    assert delete_response.status_code == 204

    get_after_delete = client.patch(f"/api/memories/{memory_id}", json={"content": "nope"})
    assert get_after_delete.status_code == 404


def test_create_pending_memory_suggestion(client: TestClient) -> None:
    response = client.post(
        "/api/memory/suggestions",
        json={
            "scope": "global",
            "type": "fact",
            "proposed_content": "User likes concise bullet points.",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "pending"
    assert body["scope"] == "global"
    assert body["scope_id"] is None
    assert body["source_message_id"] is None
    assert body["confidence"] is None
    assert body["reason"] is None
    assert body["candidate_signals_json"] is None


def test_create_pending_memory_suggestion_with_metadata(client: TestClient) -> None:
    response = client.post(
        "/api/memory/suggestions",
        json={
            "source_conversation_id": "conv-123",
            "source_message_id": "msg-123",
            "scope": "global",
            "type": "fact",
            "proposed_content": "User likes summaries.",
            "confidence": 0.66,
            "reason": "Explicit user statement",
            "candidate_signals_json": {"signal": "explicit_statement", "weight": 0.9},
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["source_conversation_id"] == "conv-123"
    assert body["source_message_id"] == "msg-123"
    assert body["confidence"] == 0.66
    assert body["reason"] == "Explicit user statement"
    assert body["candidate_signals_json"] == {"signal": "explicit_statement", "weight": 0.9}


def test_approve_suggestion_creates_memory(client: TestClient) -> None:
    workspace_id = create_workspace(client)
    suggestion_response = client.post(
        "/api/memory/suggestions",
        json={
            "scope": "workspace",
            "scope_id": workspace_id,
            "type": "instruction",
            "proposed_content": "Always answer in Hebrew.",
        },
    )
    suggestion_id = suggestion_response.json()["id"]

    approve_response = client.post(
        f"/api/memory/suggestions/{suggestion_id}/approve",
        json={"content": "Always answer in English unless asked otherwise."},
    )
    assert approve_response.status_code == 200
    body = approve_response.json()
    assert body["suggestion"]["status"] == "approved"
    assert body["memory"]["content"] == "Always answer in English unless asked otherwise."
    assert body["memory"]["scope"] == "workspace"
    assert body["memory"]["scope_id"] == workspace_id
    assert body["memory"]["type"] == "instruction"

    memories = client.get("/api/memories", params={"scope": "workspace", "scope_id": workspace_id})
    assert memories.status_code == 200
    assert any(item["id"] == body["memory"]["id"] for item in memories.json())


def test_reject_suggestion_changes_status(client: TestClient) -> None:
    suggestion_response = client.post(
        "/api/memory/suggestions",
        json={
            "scope": "global",
            "type": "preference",
            "proposed_content": "Use markdown tables for all outputs.",
        },
    )
    suggestion_id = suggestion_response.json()["id"]

    reject_response = client.post(f"/api/memory/suggestions/{suggestion_id}/reject")
    assert reject_response.status_code == 200
    assert reject_response.json()["status"] == "rejected"


def test_duplicate_transition_protection(client: TestClient) -> None:
    to_approve = client.post(
        "/api/memory/suggestions",
        json={
            "scope": "global",
            "type": "fact",
            "proposed_content": "Duplicate approve guard",
        },
    ).json()["id"]

    first_approve = client.post(f"/api/memory/suggestions/{to_approve}/approve", json={})
    assert first_approve.status_code == 200

    second_approve = client.post(f"/api/memory/suggestions/{to_approve}/approve", json={})
    assert second_approve.status_code == 400

    to_reject = client.post(
        "/api/memory/suggestions",
        json={
            "scope": "global",
            "type": "fact",
            "proposed_content": "Duplicate reject guard",
        },
    ).json()["id"]
    first_reject = client.post(f"/api/memory/suggestions/{to_reject}/reject")
    assert first_reject.status_code == 200

    second_reject = client.post(f"/api/memory/suggestions/{to_reject}/reject")
    assert second_reject.status_code == 400


def test_404_for_missing_ids(client: TestClient) -> None:
    missing_memory = client.patch("/api/memories/missing-memory-id", json={"content": "x"})
    assert missing_memory.status_code == 404

    missing_suggestion_approve = client.post("/api/memory/suggestions/missing-suggestion-id/approve", json={})
    assert missing_suggestion_approve.status_code == 404

    missing_suggestion_reject = client.post("/api/memory/suggestions/missing-suggestion-id/reject")
    assert missing_suggestion_reject.status_code == 404
