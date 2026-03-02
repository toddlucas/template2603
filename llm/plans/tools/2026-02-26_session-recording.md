# Session Recording

**Version:** 0.1  
**Date:** February 26, 2026  
**Status:** Planning

---

## Summary

A lightweight mechanism for recording and replaying pipeline sessions, so that regressions
discovered during real use can be reproduced, debugged, and converted into eval scenarios.

The immediate motivation: issues #001 and #002 appear to have caused a quality regression in
a real interaction, but there is no way to reproduce that interaction. The session recording
feature closes this gap.

---

## Problem Statement

The current eval framework (Plan: `2026-02-25_evals-framework.md`) covers two tiers:

- **Unit evals** — hand-authored scenarios run against the reconciler and applicator
- **Model evals** — full pipeline runs scored against expected output

Both tiers require hand-authored scenarios. There is no path from "something went wrong in a
real session" to "I can reproduce and test this." When a regression is noticed after the fact,
the inputs are gone.

A session recording captures the full set of inputs and intermediate outputs at the time of
execution, so any session can be replayed later — either to reproduce a failure or to promote
the session into an eval scenario.

---

## Scope

### Phase 1 — CLI-level recording (immediate)

Extend the `round-trip` command with a `--record` flag that saves a structured session
artifact alongside the normal output. This captures everything the pipeline touches:

- The input DOCX (by content hash reference, not embedded)
- The edited markdown
- The reconciler trace (ops + matching strategy per element)
- The apply report (succeeded / skipped ops)
- The full SSE event sequence as it would have been emitted (simulated from the pipeline
  output, not from a live HTTP stream)
- Intermediate markdown states at each op boundary (for streaming simulation)

Phase 1 does not require any changes to the app. It operates entirely within the CLI tooling.

### Phase 2 — In-app capture (deferred)

Add a dev-mode recording flag to `ChatService` that captures the actual SSE stream as it is
emitted. This is the only way to record true streaming behavior — partial markdown states,
real chunk boundaries, actual DOM patch sequence.

Phase 2 is deferred until:
- The app's interaction model is stable enough that the recording format won't need to
  change frequently
- A client-side streaming bug is encountered that cannot be reproduced from CLI artifacts

---

## Recording Format

A session recording is a single JSON file. It is self-contained: given the recording and the
original DOCX (referenced by hash), the full pipeline can be replayed.

```json
{
  "version": 1,
  "recordedAt": "2026-02-26T14:32:00Z",
  "source": "cli",
  "inputs": {
    "docxHash": "a3f9bc...d1",
    "docxPath": "input.docx",
    "editedMarkdown": "# Introduction\n\nThe quick brown fox..."
  },
  "pipeline": {
    "parse": {
      "originalMarkdown": "# Introduction\n\nThe quick brown fox...",
      "metadata": { ... }
    },
    "reconcile": {
      "ops": [ ... ],
      "trace": [ ... ]
    },
    "apply": {
      "succeeded": 3,
      "skipped": 0,
      "operations": [ ... ]
    }
  },
  "stream": {
    "events": [
      { "type": "text", "delta": "I've updated the introduction", "accumulatedText": "I've updated the introduction" },
      { "type": "provisional_edit", "op": { "kind": "update", "elementId": "p-001", "newContent": "..." } },
      { "type": "text", "delta": " and shortened the second paragraph.", "accumulatedText": "I've updated the introduction and shortened the second paragraph." },
      { "type": "provisional_edit", "op": { "kind": "delete", "elementId": "p-003" } }
    ],
    "markdownStates": [
      { "afterEventIndex": 0, "markdown": "I've updated the introduction" },
      { "afterEventIndex": 2, "markdown": "I've updated the introduction and shortened the second paragraph." }
    ]
  }
}
```

**Key design decisions:**

- `docxHash` references the DOCX by content hash. The DOCX itself is not embedded (binary,
  potentially large). The recording is only replayable if the original DOCX is available.
- `stream.events` is a simulated SSE sequence derived from the pipeline output. In Phase 1
  this is constructed from the reconciler trace, not captured from a live stream. In Phase 2
  it would be the actual emitted events.
- `stream.markdownStates` records the accumulated chat text after each `text` event. This
  enables replay of the partial markdown rendering path without a live LLM.

---

## CLI Integration

### `round-trip --record`

```
evaluator round-trip \
  --docx input.docx \
  --edited edited.md \
  --record [session.json]
```

Runs the normal round-trip pipeline and additionally writes a session recording to
`session.json` (default: `<timestamp>-session.json` in the output directory).

The `--record` flag is composable with all existing `round-trip` flags (`--dry-run`,
`--xml-diff`, `--cache`, etc.).

### `replay`

```
evaluator replay --session session.json --docx input.docx [--mode pipeline|stream|markdown]
```

Replays a recorded session. Three modes:

| Mode | What it does |
|------|--------------|
| `pipeline` | Re-runs reconciler + applicator against recorded inputs; compares output to recorded output |
| `stream` | Emits the recorded SSE event sequence to stdout (for piping to a client or test harness) |
| `markdown` | Steps through `markdownStates` and emits each partial markdown string (for testing `MarkdownContent.tsx` rendering) |

**`pipeline` mode** is the primary regression tool: it re-executes the pipeline and diffs the
output against the recorded output. Any divergence indicates a code change affected behavior.

**`stream` mode** enables manual or automated testing of the client's SSE handling without a
live server.

**`markdown` mode** feeds the recorded partial markdown states into a test harness for
`MarkdownContent.tsx`, enabling reproduction of partial-render failures without a live LLM.

### `promote`

```
evaluator promote --session session.json --out-dir src/evals/reconciler/my-scenario/
```

Converts a session recording into an eval scenario (the format defined in
`2026-02-25_evals-framework.md`). Extracts:

- `original.md` from `pipeline.parse.originalMarkdown`
- `metadata.json` from `pipeline.parse.metadata`
- `edited.md` from `inputs.editedMarkdown`
- `expected-changes.json` from `pipeline.reconcile.ops`
- `instruction.md` — left empty for the user to fill in

This is the bridge between "something happened in a real session" and "I have a reproducible
eval scenario."

---

## Workflow: Regression to Scenario

The intended workflow when a regression is noticed:

1. Re-run the interaction using `round-trip --record` with the same inputs (if available) or
   the closest approximation.
2. Use `replay --mode pipeline` to confirm the current code reproduces the issue.
3. Fix the bug.
4. Use `replay --mode pipeline` again to confirm the fix.
5. Use `promote` to convert the session into an eval scenario tagged `regression`.
6. The scenario is now part of the unit eval corpus and will catch future regressions.

For the current situation (inputs not available): the workflow starts at step 5 using a
hand-authored scenario that captures the known-bad case. The recording infrastructure makes
this automatic going forward.

---

## Relationship to Existing Plans

| Plan | Relationship |
|------|-------------|
| `2026-02-25_tooling-updates.md` | `round-trip` is the host command for `--record`; `parse` command produces the `original.md` + `metadata.json` that recordings reference |
| `2026-02-25_evals-framework.md` | `promote` converts recordings into eval scenarios; `replay --mode pipeline` is a lightweight alternative to the full eval runner for single-session debugging |
| `2026-02-25_streaming-html-validation.md` | `replay --mode stream` and `replay --mode markdown` provide the replay infrastructure that streaming HTML tests can use as input |

---

## Files Touched (Phase 1)

| File | Change |
|------|--------|
| `src/tools/evaluator/Commands/RoundTripCommand.cs` | Add `--record` flag; call `SessionRecorder` after pipeline completes |
| `src/tools/evaluator/Commands/ReplayCommand.cs` | New command (`pipeline` / `stream` / `markdown` modes) |
| `src/tools/evaluator/Commands/PromoteCommand.cs` | New command; extracts eval scenario from session recording |
| `src/tools/evaluator/Recording/SessionRecorder.cs` | Builds `SessionRecording` from pipeline artifacts |
| `src/tools/evaluator/Recording/SessionRecording.cs` | Model: serializable session recording schema |
| `src/tools/evaluator/Program.cs` | Register `replay` and `promote` subcommands |

No changes to production `Base2.Docs` library code are required. All new logic lives in
the CLI project.

---

## Phased Rollout

| Phase | What | Trigger |
|-------|------|---------|
| **1 — CLI recording** | `--record` on `round-trip`; `replay --mode pipeline`; `promote` | Now — closes the regression reproduction gap for pipeline bugs |
| **1b — Stream + markdown replay** | `replay --mode stream` and `replay --mode markdown` | When streaming HTML validation tests (Plan: `2026-02-25_streaming-html-validation.md`) are being written |
| **2 — In-app capture** | Dev-mode recording in `ChatService`; actual SSE stream captured | When a client-side streaming bug cannot be reproduced from CLI artifacts |

---

## Open Questions

- **DOCX embedding:** Should the recording optionally embed the DOCX as base64 for fully
  self-contained artifacts? Useful for sharing recordings across machines. Cost: file size.
  Start without embedding; add as an opt-in flag (`--embed-docx`) if needed.
- **LLM output capture:** In Phase 1, `edited.md` is provided by the caller (not generated
  by the LLM). Should `round-trip --record` also support capturing a live LLM call and
  recording the raw model output alongside the edited markdown? This would make the recording
  a true end-to-end artifact. Defer to Phase 2.
- **Recording format versioning:** The `version` field is included from the start. Define a
  migration path before Phase 2 changes the schema.
- **Sensitive content:** Recordings may contain document content. Same scrubbing rules as
  eval scenarios apply — never commit recordings with real client content.
