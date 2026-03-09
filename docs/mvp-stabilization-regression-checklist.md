# MVP Stabilization Regression Checklist

Date: 2026-03-09

## Service outage and recovery

- Backend unavailable:
  - Stop API service and open Chat page with a previously selected workspace.
  - Confirm active workspace is not cleared from state/localStorage.
  - Confirm outage UI is shown with retry option.
- Backend recovery:
  - Start API service again and trigger workspace refresh.
  - Confirm previously active workspace is restored automatically.
- Ollama unavailable:
  - Keep API up, make Ollama unavailable, then send a message.
  - Confirm error is surfaced as API detail (for example, "Ollama service unavailable") and app stays usable.

## Conversation persistence

- Select a conversation in workspace A, hard reload, verify same conversation is active.
- Switch to workspace B, verify no stale conversation from workspace A is selected.
- Delete or invalidate the saved conversation, reload, verify clean empty conversation state.

## Empty and error UI states

- No workspace selected: verify "No workspace selected" state and Workspaces CTA.
- Workspace fetch error with persisted workspace: verify "Workspace service unavailable" state and Retry button.
- No conversations: verify empty conversation list state.
- No messages in selected conversation: verify empty message state.

## Not-found behavior

- Navigate to an invalid route from inside the app (client navigation) and verify 404 page.
- Hard refresh the same invalid route and verify 404 page still renders inside normal app layout.
