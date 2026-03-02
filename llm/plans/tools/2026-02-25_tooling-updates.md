# Tooling Updates: `parse`, `round-trip`, and Parse Cache

**Version:** 0.1  
**Date:** February 25, 2026  
**Status:** Planning

---

## Summary

Three additions to the existing `evaluator` CLI:

1. **`parse` command** — dump a DOCX's `ParseResult` (markdown + metadata) to disk as inspectable, reusable artifacts.
2. **`round-trip` command** — end-to-end pipeline in one invocation: parse → reconcile → apply → write output DOCX + emit a structured report.
3. **Parse cache** — opt-in content-hash-keyed cache so repeated operations on the same DOCX skip the parse step.

These build on the three commands already implemented (`reconcile`, `apply`, `validate-paths`) and are motivated by two needs: tighter iteration loops during development/debugging, and a fast path for the eval runner (Plan: `2026-02-25_evals-framework.md`).

---

## Pipeline Overview

```
Inputs                                   Tool            Output
────────────────────────────────────────────────────────────────────────
document.docx                        ─►  parse       ──► original.md
                                                          metadata.json
                                                          [cache entry]

document.docx                        ─┐
edited.md                            ─┴─► round-trip ──► output.docx
                                                          report.json
                                                          (match trace + apply report)
```

---

## Command 1: `parse`

**Purpose:** Extract the full `ParseResult` from a DOCX to disk so it can be inspected, diffed, used as reconciler input, or fed to the eval runner without re-parsing.

**Usage:**
```
evaluator parse --docx document.docx [--out-dir ./output] [--cache]
```

**Output files (in `--out-dir`, default `./`):**
- `original.md` — the extracted markdown (same content the reconciler sees)
- `metadata.json` — serialized `DocumentMetadata` (element IDs, OpenXML paths, hashes, positions)

**Flags:**
- `--cache` — write a cache entry for this DOCX after parsing (see §Cache below)
- `--out-dir` — directory for output files (default: current directory)
- `--pretty` — pretty-print `metadata.json` (default: true for CLI use)

**What this enables:**
- Inspect exactly what the reconciler sees for any real document
- Manually craft an `edited.md` by editing `original.md` and feeding it to `reconcile`
- Feed `metadata.json` into `validate-paths` to check path staleness
- Save artifacts as eval fixtures (see Plan 3)

---

## Command 2: `round-trip`

**Purpose:** Run the full pipeline — parse DOCX, reconcile against edited markdown, apply changes, write output — in a single invocation with a unified report.

**Usage:**
```
evaluator round-trip \
  --docx input.docx \
  --edited edited.md \
  [--out output.docx] \
  [--report report.json] \
  [--dry-run] \
  [--xml-diff] \
  [--cache]
```

**Steps (in order):**
1. Parse `input.docx` → `(ParseResult: markdown, metadata)` (cache-aware)
2. Run `MarkdownReconciler.ReconcileWithTrace(metadata, editedMarkdown)` → `(DocumentChanges, ReconcileTrace)`
3. Run `DocxApplicator.ApplyAsync(inputDocx, changes)` → `ApplyReport`
4. Write `output.docx` (unless `--dry-run`)
5. Emit structured report

**Report structure (`report.json`):**
```json
{
  "reconcile": {
    "updates": 3,
    "inserts": 1,
    "deletes": 0,
    "trace": [ ... ]
  },
  "apply": {
    "succeeded": 4,
    "skipped": 0,
    "operations": [ ... ]
  },
  "xmlDiff": "--- word/document.xml\n+++ word/document.xml\n..." // if --xml-diff
}
```

**Flags:**
- `--dry-run` — reconcile and apply in memory, print report, do not write `output.docx`
- `--xml-diff` — extract `word/document.xml` from both input and output ZIPs and emit a unified text diff in the report (useful for verifying structural correctness)
- `--report` — path to write the JSON report (default: stdout)
- `--cache` — use parse cache

**What the XML diff adds:**

The `--xml-diff` flag produces a raw unified diff of `word/document.xml` before and after apply. This is the lowest-level verification that the applicator made exactly the right structural changes — useful when debugging or building eval fixtures. The diff is compact because OpenXML paragraph elements are mostly single logical lines in the XML.

---

## Feature 3: Parse Cache

**Motivation:**

Parsing a DOCX is the most expensive step in both `parse` and `round-trip`. When iterating on a set of edited markdown variants against the same document (common during debugging and eval development), re-parsing is wasteful. The cache eliminates this cost.

**Cache key:** SHA-256 of the DOCX file bytes. This ensures correctness: any change to the document (even metadata) invalidates the entry, and the same binary DOCX always hits the same entry regardless of file path or name.

**Cache value:** serialized `ParseResult`:
```json
{
  "markdown": "# Introduction\n\nThe quick brown fox...",
  "metadata": { ... }
}
```

**Storage location (priority order):**
1. `--cache-dir <path>` explicit flag
2. `EVALUATOR_CACHE_DIR` environment variable
3. `~/.evaluator/cache/` default

**File naming:** `<sha256>.json` (e.g., `a3f9bc...d1.json`)

**CLI flags:**
- `--cache` — read from and write to cache (opt-in)
- `--cache-dir <path>` — use a specific cache directory
- `--no-cache` — explicitly bypass cache even if `--cache` is set by environment

**Cache invalidation:** Content-hash keyed, so no TTL or manual invalidation is needed. Stale entries for old document versions will accumulate but remain inert; a `evaluator cache clear` subcommand can prune them if needed.

**Consistency note:** The cache stores the `ParseResult` as it comes from `WordDocumentParser`. If the parser logic changes (e.g., a bug fix), cached entries from before the fix will be stale. When making breaking changes to the parser, bump a cache schema version constant and include it in the cache file key prefix (e.g., `v1_<sha256>.json`).

---

## Files Touched

| File | Change |
|------|--------|
| `src/tools/evaluator/Commands/ParseCommand.cs` | New command |
| `src/tools/evaluator/Commands/RoundTripCommand.cs` | New command |
| `src/tools/evaluator/Cache/ParseCache.cs` | New cache read/write helper |
| `src/tools/evaluator/Program.cs` | Register two new subcommands; add cache DI |
| `src/tools/evaluator/evaluator.csproj` | No new dependencies expected (System.Text.Json already present) |

No changes to production `Base2.Docs` library code are required. All new logic lives in the CLI project.

---

## Open Questions

- **XML diff format:** A raw unified text diff of `word/document.xml` is human-readable for debugging but verbose. An alternative is a semantic diff (list of added/removed XML elements by XPath). Start with raw unified diff; promote to semantic if needed for evals.
- **Cache storage for evals:** The eval runner (Plan 3) will want to use the cache too. Decide whether evals use a dedicated cache directory or the global one. Leaning toward eval-specific to keep eval runs hermetic.
- **`round-trip` with streaming simulation:** If we later want to test the streaming path (one provisional edit at a time), `round-trip` could gain a `--stream-sim` flag that applies ops one at a time and emits an intermediate state report after each. Defer until streaming tests (Plan 2) are designed.
