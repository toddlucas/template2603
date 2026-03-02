# MVP Planning Documents

This directory contains the scoped MVP plan for Product Name, informed by POC learnings. It sits alongside the long-term product vision in `../prd/`.

---

## Relationship to the PRD

The `prd/` directory describes the full product vision.

The `mvp/` directory answers a different question: **what is the smallest working product we can ship from the POC, and what constraints must we design around?**

---

## Directory Structure

```
mvp/
├── README.md                  # This file — index and scope philosophy
├── 00-scope.md                # What MVP is and isn't; POC learnings and validated assumptions
├── 01-document-ownership.md   # Marker/property strategy; "we created it" guard
├── 02-conflict-detection.md   # File locking, ETag strategy, Word co-authoring limits
├── 03-changeset-flow.md       # Single changeset, approval, and apply cycle
├── 04-save-as.md              # Save As and other escape hatches for conflict cases
└── 05-electron-local.md       # Electron + .NET sidecar architecture
```

---

## MVP Scope Summary

**In scope:**
- Electron desktop application (Windows; macOS stretch goal)
- Local .NET sidecar (SQLite, no server required)
- AI chat with tool visibility and streaming

**Deferred to later phases:**

---

## PRD Cross-References

Where MVP decisions directly correspond to PRD sections, the relevant MVP document references the PRD. The PRD is not modified — it remains the long-term specification.

| MVP Document | Related PRD Section |
|---|---|
| `00-scope.md` | `prd/00-overview.md` |
| `01-document-ownership.md` | `prd/03-document-management.md` |
| `02-conflict-detection.md` | `prd/08-sync.md` |
| `03-changeset-flow.md` | `prd/05-changeset-system.md` |
| `04-save-as.md` | `prd/08-sync.md`, `prd/03-document-management.md` |
| `05-electron-local.md` | `architecture/desktop-app-architecture.md` |
