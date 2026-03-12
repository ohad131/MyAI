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
    assert "id" in body


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
            "pinned": True,
            "enabled": False,
        },
    )
    assert update_response.status_code == 200
    body = update_response.json()
    assert body["content"] == "Updated content"
    assert body["type"] == "instruction"
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
