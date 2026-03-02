This is a good moment to take stock. Here's my honest read on the situation.

---

## The case for stepping back

The POC has proven the core interaction loop. You know streaming redlines are feasible with Strategy D, you have the DOM-patching infrastructure, and you have a concrete mental model for what "typing" would require (subsystem 03 §11 Phase 1 — stream raw LLM chunks to the client during generation, then transition to diff view after reconciliation). That design is already written down. What you don't have yet is the foundation it depends on.

The more important observation is that **three known bugs undermine the quality of the interaction you'd be iterating toward.** #001 silently drops element type/level changes, #002 corrupts changesets containing deletes, and #003 displays changes in the wrong order. If you spend time polishing the streaming feel, you're polishing a UX that ends in a broken diff. The bugs need to go before the streaming experience can be evaluated honestly.

---

## What the subsystem gap actually is

You have four subsystem docs (01–04). Looking at the PRD structure:

- `05-changeset-system.md` — **not written**, and it's the most adjacent missing piece
- Everything upstream of changeset (workspace, auth, sync, search) is also unwritten

The streaming edits architecture doc already calls out several "not yet done" items — redlines in review mode, scroll to active change, multi-document changesets — and all of them live in the changeset system. Right now, the streaming flow ends at `done → openChangesetReview()` and then the experience degrades because the review side isn't designed. You'd be building Phase 1 streaming into a half-finished handoff.

---

## My recommendation

**Step back, but not all the way.** The work divides cleanly:

**1. Fix bugs #001 and #002 now** — they're small, implementation-level, and their fixes are already specified (in subsystem 03 §12 and backlog). Fixing them doesn't require any design work and will make the existing POC trustworthy.

**2. Write subsystem 05 (Changeset System)** — this is the most valuable next design artifact. It covers:
- The changeset state machine (pending → approved/rejected, V1 single-pending constraint)
- Track-changes diff rendering requirements (the gap the streaming doc already identifies)
- Scroll-to-change, the ReviewBar interaction, hierarchical approval
- V2 multiple pending changesets

Without this, the Phase 1 streaming "typing" experience has no designed landing zone to transition into.

**3. Then implement `IDocumentCache` + reconciler fixes** — the cache baseline stability from subsystem 03 is a prerequisite for Phase 1 streaming to be correct. `PinBaselineAsync` before the LLM call, stream raw chunks, transition to diff view after reconciliation. This is a well-defined implementation task once the subsystem designs are solid.

**4. Then Phase 1 content streaming is a straightforward change** — emit raw markdown chunks from `ChatService` during generation as a new SSE event type, have the client render them as a live preview in the document pane, then transition to the diff view when the `changeset_ready` event arrives. The state machine is already in subsystem 03 §11. At that point you'll have the "typing" interaction on top of a correct, stable foundation.

---

## So: what are the next subsystems?

In priority order:

| # | Subsystem | Why now |
|---|---|---|
| **05** | **Changeset System** | Directly adjacent; the streaming review gap is blocking; V1 single-pending-changeset constraint touches every other subsystem |
| **08** | **Sync** | Required once you can apply changesets — what happens to the document after approval, ETag handling, re-indexing signal (already partially designed in subsystem 04 §9) |
| **03 impl** | **`IDocumentCache` implementation** | Prerequisite for Phase 1 streaming correctness; bugs #001, #003 fixes land here |

The `06-document-preview.md` (track-changes diff rendering) might also be worth designing alongside 05 since the two are tightly coupled in the UI.