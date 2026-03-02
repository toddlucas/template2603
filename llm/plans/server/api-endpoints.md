# API Endpoints Reference

**Version:** 0.2  
**Date:** February 18, 2026  
**Status:** Current (reflects implemented endpoints)

This document is the living reference for all API endpoints. It focuses on URL patterns and intent—not data model details.

---

## Projects

> **Not yet implemented.** `projectId` is currently a bare GUID with no backing table or CRUD API. Any UUID can be used as a project scope.

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/api/projects` | List all projects for the current user |
| `POST` | `/api/projects` | Create a new project |
| `GET` | `/api/projects/{projectId}` | Get project details |
| `PUT` | `/api/projects/{projectId}` | Update project metadata |
| `DELETE` | `/api/projects/{projectId}` | Delete a project |

---

## Documents

> **Partially implemented.** Only `POST` (register) and `POST .../sync` exist. List, get, delete, and preview are not yet built.

| Method | URL | Description | Status |
|--------|-----|-------------|--------|
| `POST` | `/api/projects/{projectId}/documents` | Register a document (link cloud doc to project) | ✅ Implemented |
| `POST` | `/api/projects/{projectId}/documents/{documentId}/sync` | Trigger sync from cloud (refresh metadata/ETag) | ✅ Implemented |
| `GET` | `/api/projects/{projectId}/documents` | List all documents in a project | ⬜ Not built |
| `GET` | `/api/projects/{projectId}/documents/{documentId}` | Get document record and sync status | ⬜ Not built |
| `GET` | `/api/projects/{projectId}/documents/{documentId}/preview` | Get rendered markdown preview | ⬜ Not built |
| `DELETE` | `/api/projects/{projectId}/documents/{documentId}` | Remove document from project | ⬜ Not built |

**`POST /api/projects/{projectId}/documents` request body:**

```json
{
  "providerId": "string",
  "name": "string",
  "path": "string (optional)"
}
```

---

## Changesets

> Changeset routes are **not** scoped under `/api/projects/{projectId}`. The server enforces ownership via tenant context.

| Method | URL | Description | Status |
|--------|-----|-------------|--------|
| `GET` | `/api/changesets/{changesetId}` | Get changeset with all document changes and edits (for diff view) | ✅ Implemented |
| `POST` | `/api/changesets/{changesetId}/approve` | Approve and apply a changeset | ✅ Implemented |
| `POST` | `/api/changesets/{changesetId}/reject` | Reject a changeset | ✅ Implemented |
| `POST` | `/api/changesets/{changesetId}/approve?force=true` | Force apply despite conflict warning | ✅ Implemented |
| `GET` | `/api/projects/{projectId}/changesets` | List changesets for a project | ⬜ Not built |
| `POST` | `/api/changesets/{changesetId}/content-updates/{editId}/approve` | Approve a single content update | ⬜ Not built |
| `POST` | `/api/changesets/{changesetId}/content-updates/{editId}/reject` | Reject a single content update | ⬜ Not built |
| `POST` | `/api/changesets/{changesetId}/element-inserts/{editId}/approve` | Approve a single element insert | ⬜ Not built |
| `POST` | `/api/changesets/{changesetId}/element-inserts/{editId}/reject` | Reject a single element insert | ⬜ Not built |
| `POST` | `/api/changesets/{changesetId}/element-deletes/{editId}/approve` | Approve a single element delete | ⬜ Not built |
| `POST` | `/api/changesets/{changesetId}/element-deletes/{editId}/reject` | Reject a single element delete | ⬜ Not built |

---

## AI Chat

| Method | URL | Description | Status |
|--------|-----|-------------|--------|
| `POST` | `/api/projects/{projectId}/chat/turns` | Submit a chat turn; streams reply via SSE | ✅ Implemented |

### Implemented SSE events

**`text`** — emitted many times as the LLM streams its conversational reply.
```
event: text
data: {"content":"..."}
```

**`done`** — always the final event. Carries any changesets produced by `propose_edit` tool calls during the turn.
```
event: done
data: {"changesets":[...]}
```

### Planned SSE events (not yet implemented)

These events are needed to support streaming tool activity in the client (e.g. showing "Reading doc…" or a live diff as edits stream in). The server has four tools — `list_documents`, `read_document`, `propose_edit`, and `get_changeset` — and all of them would emit `tool_start` / `tool_end`. Only `propose_edit` emits `edit_chunk`.

**`tool_start`** — emitted when the LLM invokes any tool.
```
event: tool_start
data: {"toolCallId":"...","toolName":"read_document","documentId":"...","documentName":"..."}
```
`documentId` and `documentName` are present when the tool operates on a specific document (`read_document`, `propose_edit`). They are absent for `list_documents` and `get_changeset`.

**`edit_chunk`** — emitted repeatedly during `propose_edit` as the revised markdown streams in. Specific to `propose_edit`.
```
event: edit_chunk
data: {"toolCallId":"...","content":"..."}
```

**`tool_end`** — emitted when a tool call completes.
```
event: tool_end
data: {"toolCallId":"...","toolName":"propose_edit"}
```

**Client rendering by tool:**

| Tool | Card behavior |
|---|---|
| `list_documents` | "Listing documents…" spinner, no detail, collapses on `tool_end` |
| `read_document` | "Reading *documentName*…" spinner, collapses on `tool_end` |
| `propose_edit` | "Editing *documentName*…" then streams diff via `edit_chunk`; diff locks on `tool_end` |
| `get_changeset` | Generic "Working…" spinner, collapses on `tool_end` |

Multiple tool calls may be in-flight simultaneously (e.g. the LLM reads two documents in parallel). `toolCallId` is used to correlate `tool_start`, `edit_chunk`, and `tool_end` events to the correct card.

---

## Cloud / Sync (Internal)

These endpoints support cloud provider connections. Exposed as needed for OAuth flows and drive browsing.

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/api/cloud/microsoft/files` | Browse OneDrive/SharePoint files available to import |
| `POST` | `/api/cloud/microsoft/connect` | Initiate Microsoft OAuth flow |
| `GET` | `/api/cloud/microsoft/status` | Check connection status and token validity |

---

## Notes

- All routes are under `/api`.
- `{projectId}` scopes documents and chat to a project. Changesets are intentionally unscoped by project URL (the server enforces ownership via tenant context).
- The `approve` endpoint accepts an optional `?force=true` query parameter to apply despite conflict warnings.
- Per-edit approve/reject endpoints are wired up in the workspace client but not yet implemented on the server.
- WebSocket streaming was planned but not implemented; SSE is used instead.
