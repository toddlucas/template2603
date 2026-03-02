# Issue Tracker

File-based issue tracking for TBD. Kept in `llm/issues/` so it stays close to plans and the PRD, and so the AI can read, create, and close issues as part of coding sessions.

---

## Directory Structure

```
issues/
├── README.md        # This file — conventions and index
├── backlog.md       # Unscheduled issues (no milestone yet)
├── v1/
│   ├── open.md      # Active V1 issues
│   └── closed.md    # Resolved V1 issues
└── v2/
    ├── open.md      # Active V2 issues
    └── closed.md    # Resolved V2 issues
```

---

## Issue Format

Each issue is a markdown section in its file:

```markdown
## #001 — Short descriptive title
**Type:** bug | feature | task | debt | question  
**Area:** auth | workspace | chat | changeset | preview | explorer | sync | search | settings | infra  
**Status:** open | in-progress | closed  
**Opened:** 2026-02-17  
**Closed:** —  
**Ref:** (optional link to a plan or PRD section)

Description of the issue. One to a few sentences. Include reproduction steps for bugs,
acceptance criteria for features, or a clear definition of done for tasks.
```

---

## Types

| Type | Use for |
|------|---------|
| `bug` | Something that is broken or behaving incorrectly |
| `feature` | New user-facing capability |
| `task` | Engineering work: refactors, infra, tooling, testing |
| `debt` | Known shortcuts or compromises to revisit |
| `question` | An open decision or investigation needed before implementation |

## Areas

| Area | Covers |
|------|--------|
| `auth` | Microsoft OAuth, identity, cloud storage connections |
| `workspace` | Workspace selection, initialization, MRU |
| `chat` | AI chat interface, tool visibility, streaming |
| `changeset` | Changeset creation, review, approval, diff rendering |
| `preview` | Document preview panel |
| `explorer` | Folder explorer, file tree, document metadata |
| `sync` | Cloud sync, conflict detection, version history |
| `search` | Semantic search, vector store, indexing |
| `settings` | User, workspace, and connection settings |
| `infra` | CI/CD, build, deployment, database, hosting |

## Statuses

| Status | Meaning |
|--------|---------|
| `open` | Not yet started |
| `in-progress` | Actively being worked on |
| `closed` | Resolved, fixed, or deliberately rejected (note reason) |

---

## Workflow

### Adding a new issue
1. Assign the next available number (check all files for the highest existing `#NNN`).
2. If the milestone is known, append it to `v1/open.md` or `v2/open.md`. Otherwise append it to `backlog.md`.
3. Fill in all fields. Leave `Closed` as `—`.

### Starting work
- Change `**Status:**` to `in-progress`.

### Closing an issue
1. Change `**Status:**` to `closed` and set `**Closed:**` to today's date.
2. Move the entire block to the top of the corresponding `vN/closed.md` (most recent first). If the issue was in `backlog.md`, use `v1/closed.md` unless a different milestone applies.
3. Condense the description to a one-line resolution note if the original detail is no longer useful.

### Promoting from backlog
- Move the block from `backlog.md` to the bottom of the appropriate `vN/open.md`.

---

## Numbering

Issues are numbered globally across all files (`#001`, `#002`, …). The number is never reused, even after closing. When in doubt, grep all files for the highest number:

```
rg "^## #" main/llm/issues/
```
