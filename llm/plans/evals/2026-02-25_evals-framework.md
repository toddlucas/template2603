# Evals Framework

**Version:** 0.2  
**Date:** February 25, 2026  
**Status:** Planning

---

## Summary

Two kinds of evals, kept in the same corpus:

- **Unit evals** — deterministic. Test the reconciler and applicator code against known inputs and expected outputs. The LLM never runs. Fast, cheap, CI-safe.
- **Model evals** — non-deterministic. Run the full pipeline including the LLM and score the model's output. Used to validate model upgrades (e.g., Sonnet 3.5 → 3.6), compare providers (Anthropic vs. OpenAI), and detect prompt regressions.

Both tiers draw from the same scenario corpus. A scenario authored for unit evals automatically becomes a model eval baseline. The key difference is which part of the system is under test.

---

## Two Tiers

| | Unit evals | Model evals |
|---|---|---|
| **Tests** | Reconciler + applicator code | LLM output quality |
| **LLM runs?** | No — uses pre-captured `edited.md` | Yes — model generates fresh output |
| **Non-determinism** | None | High (outputs vary per run) |
| **Run when** | Every commit / PR | On model upgrade, provider change, or prompt change |
| **Failure means** | Code regression | Model or prompt regression |
| **Scoring** | Binary pass/fail vs. expected | Quantitative (match rate, op counts) |
| **Cost** | Negligible | $$ per run (LLM API calls) |

---

## Scenario Format

Each scenario is a self-contained directory. The structure supports both tiers:

```
src/evals/
├── reconciler/                    ← unit evals (no DOCX needed)
│   ├── update-single-paragraph/
│   │   ├── scenario.json
│   │   ├── original.md
│   │   ├── metadata.json
│   │   ├── edited.md              ← pre-captured (used by unit evals)
│   │   ├── instruction.md         ← user prompt (used by model evals)
│   │   └── expected-changes.json  ← golden output
│   ├── insert-at-top/
│   ├── delete-middle/
│   ├── fuzzy-heading-match/
│   ├── table-unchanged/
│   └── ...
└── round-trip/                    ← unit + model evals (real DOCX)
    ├── simple-update/
    │   ├── scenario.json
    │   ├── input.docx
    │   ├── instruction.md
    │   ├── edited.md              ← pre-captured model output (unit evals use this)
    │   ├── expected-changes.json
    │   ├── expected-report.json
    │   └── expected-xml-diff.patch
    └── ...
```

**`scenario.json`:**
```json
{
  "description": "Single paragraph updated with slightly different wording",
  "tags": ["update", "exact-match", "single-element"],
  "created": "2026-02-25",
  "source": "manual",
  "models": ["claude-3-5-sonnet", "claude-3-7-sonnet"]
}
```

The `models` field is optional. When present, it lists the models that should be tested against this scenario during model evals. Omit to test all configured models.

**Tags:**

| Tag | Meaning |
|-----|---------|
| `update` | Tests `ContentUpdateOp` path |
| `insert` | Tests `ElementInsertOp` path |
| `delete` | Tests `ElementDeleteOp` path |
| `exact-match` | Matching strategy: exact hash |
| `fuzzy-heading` | Matching strategy: heading fuzzy |
| `fuzzy-paragraph` | Matching strategy: paragraph fuzzy |
| `multi-op` | Multiple operations in one edit |
| `table` | Document contains a table |
| `real-doc` | Uses a real (non-synthetic) DOCX |
| `regression` | Added to prevent a specific bug from recurring |
| `synthetic` | Content is artificial (safe to commit) |

---

## Unit Evals

Unit evals run `MarkdownReconciler` and `DocxApplicator` against the pre-captured `edited.md` and compare the output to `expected-changes.json`. No model runs.

### Scoring

| Metric | How measured |
|--------|--------------|
| **Op precision** | Fraction of actual ops that match an expected op |
| **Op recall** | Fraction of expected ops that appear in actual output |
| **Strategy match** | Did the reconciler use the expected matching strategy per element? |
| **False positives** | Actual ops not in expected (spurious changes) |
| **False negatives** | Expected ops missing from actual (missed changes) |
| **Apply report match** | (Round-trip only) Actual `ApplyReport` matches `expected-report.json` |

A "match" for an op requires: same kind (update/insert/delete), same target element ID, and same new content for updates. Inserts match on content + position.

The default pass threshold is exact match (precision = recall = 1.0). This is appropriate for hand-authored scenarios where the expected output is known to be correct.

### Running

```
# All unit evals
evaluator eval --corpus src/evals/ --mode unit

# By tag
evaluator eval --corpus src/evals/ --mode unit --tags regression

# Single scenario
evaluator eval --scenario src/evals/reconciler/fuzzy-heading-match/ --mode unit
```

Exit code 1 if any scenarios fail. Suitable for CI.

---

## Model Evals

Model evals run the full pipeline: the LLM receives `(document_content, instruction)` and produces a fresh `edited.md`. The reconciler maps that output to ops, which are compared to `expected-changes.json`.

The LLM is not tested for instruction adherence (whether it understood the intent) — that requires human review or a judge LLM, which is out of scope for now. The mechanical signal — reconciler match rate — is sufficient for catching model regressions on the edit task.

### What "match rate" measures here

If the model produces clean markdown with only the intended changes, the reconciler matches nearly every element (high precision, high recall). If the model:
- Rewrites unchanged text → spurious update ops (false positives)
- Reorders sections → low match rates, many fuzzy-only matches
- Hallucinates new paragraphs → unmatched inserts
- Drops content → spurious deletes

The reconciler trace makes all of these visible quantitatively without a judge. This is the primary signal for model evals.

### Scoring

| Metric | How measured |
|--------|--------------|
| **Op precision** | Fraction of generated ops matching expected |
| **Op recall** | Fraction of expected ops present in generated output |
| **Unmatched rate** | Elements in model output that couldn't be matched to original |
| **Strategy distribution** | Fraction of matches that are exact vs. fuzzy (more fuzzy = model drifted from source text) |
| **Pass threshold** | Configurable per scenario (default: precision ≥ 0.9, recall ≥ 0.9) |

Model evals use a softer threshold than unit evals because LLM outputs are non-deterministic. The threshold is configurable in `scenario.json`:
```json
"thresholds": { "precision": 0.9, "recall": 0.9 }
```

### Multi-run averaging

Because model output varies, a single run can pass or fail by chance. For production model gating, run each scenario N times (default: 3) and use the mean score. The `--runs` flag controls this.

### Running

```
# All model evals against default model
evaluator eval --corpus src/evals/ --mode model

# Compare two models
evaluator eval --corpus src/evals/ --mode model --model claude-3-5-sonnet --model claude-3-7-sonnet

# Multiple runs per scenario
evaluator eval --corpus src/evals/ --mode model --runs 3

# Single scenario, one model
evaluator eval --scenario src/evals/reconciler/update-single-paragraph/ --mode model --model gpt-4o
```

### Model configuration

Models are registered in `evals.config.json` at the corpus root:
```json
{
  "models": {
    "claude-3-5-sonnet": {
      "provider": "anthropic",
      "modelId": "claude-3-5-sonnet-20241022",
      "apiKeyEnv": "ANTHROPIC_API_KEY"
    },
    "claude-3-7-sonnet": {
      "provider": "anthropic",
      "modelId": "claude-3-7-sonnet-20250219",
      "apiKeyEnv": "ANTHROPIC_API_KEY"
    },
    "gpt-4o": {
      "provider": "openai",
      "modelId": "gpt-4o-2024-11-20",
      "apiKeyEnv": "OPENAI_API_KEY"
    }
  },
  "defaultModel": "claude-3-7-sonnet"
}
```

The eval runner calls the same prompt infrastructure used by `ChatService`, so provider-specific formatting, system prompts, and tool schemas are shared.

---

## CLI Runner: `evaluator eval`

```
evaluator eval
  --corpus <path>        Root directory of eval corpus
  --scenario <path>      Run a single scenario
  --mode unit|model|all  Which tier to run (default: unit)
  --tags <tag,...>        Filter scenarios by tag
  --model <id>           Model alias from evals.config.json (model mode only)
  --runs <n>             Runs per scenario for averaging (model mode, default: 1)
  --update-expected      Overwrite expected-changes.json with actual output
  --out <path>           Write full report JSON to file
```

**Sample output:**
```
── Unit Evals ────────────────────────────────────────────────
PASS  reconciler/update-single-paragraph    P=1.0  R=1.0  strategy: exact ✓
PASS  reconciler/insert-at-top              P=1.0  R=1.0
FAIL  reconciler/fuzzy-heading-match        P=0.5  R=1.0  missing op: delete(heading-3)
PASS  round-trip/simple-update              apply: 1/1 ✓

── Model Evals (claude-3-7-sonnet, 1 run) ────────────────────
PASS  reconciler/update-single-paragraph    P=1.0  R=1.0  unmatched: 0
PASS  reconciler/insert-at-top              P=0.9  R=1.0  unmatched: 1  [fuzzy: 2]
PASS  round-trip/simple-update              P=1.0  R=1.0

─────────────────────────────────────────────────────────────
Unit:  3 passed, 1 failed
Model: 3 passed, 0 failed  (model: claude-3-7-sonnet)
```

---

## Labeling Guide

Scenarios are hand-labeled. The process for creating one:

### Tier 1 (reconciler, no DOCX)

1. Use `evaluator parse` to extract `original.md` + `metadata.json` from any real document.
2. Write `instruction.md` — a plain English description of the intended edit (e.g., "Shorten the second paragraph to one sentence").
3. Apply the edit yourself to produce `edited.md`. Be deliberate: only change what the instruction says; leave everything else exactly as it appears in `original.md`. Whitespace and punctuation changes outside the target paragraph count as false edits.
4. Run `evaluator reconcile --original original.md --edited edited.md --metadata metadata.json --out actual-changes.json` and review the trace output.
5. Confirm every op in `actual-changes.json` is correct and complete. If the trace shows unexpected fuzzy matches or unmatched elements, revise `edited.md` until the trace is clean.
6. Rename `actual-changes.json` to `expected-changes.json`.
7. Fill in `scenario.json` with description, tags, and source.

**Common labeling mistakes:**

| Mistake | Effect | Fix |
|---------|--------|-----|
| Extra blank lines in `edited.md` | Spurious insert ops | Match blank line structure of `original.md` exactly |
| Reformatting unchanged paragraphs | Spurious updates | Copy-paste unchanged paragraphs verbatim from `original.md` |
| Reordering sections | Many fuzzy matches, wrong op kinds | Reorder only intentionally; document it in `scenario.json` |
| Editing heading level unintentionally | Wrong op | Check heading `#` counts match original |

### Tier 2 (round-trip, with DOCX)

Same as above, plus:
- Keep `input.docx` (scrubbed of any sensitive content — replace real names, figures, etc. with filler)
- Run `evaluator round-trip --docx input.docx --edited edited.md --xml-diff --report report.json`
- Review `report.json`: confirm all ops succeeded (none skipped)
- Store `expected-report.json` and optionally extract `expected-xml-diff.patch` from the report

### For model evals specifically

The same `expected-changes.json` is used. The model will not reproduce it exactly, but it defines what "correct behavior" looks like. When writing `instruction.md`, be precise: the model eval measures whether the model interprets and executes the instruction faithfully. Vague instructions make the expected output ambiguous.

---

## Integration with Existing Tooling

| Eval step | Command / code |
|-----------|----------------|
| Parse DOCX | `evaluator parse` (Plan: `2026-02-25_tooling-updates.md`) with cache |
| Reconcile (unit) | `MarkdownReconciler.ReconcileWithTrace` |
| Reconcile (model) | LLM call → save as `actual-edited.md` → then reconcile |
| Apply | `DocxApplicator.ApplyAsync` |
| XML diff | `--xml-diff` from `round-trip` |

---

## Corpus Location and Git Considerations

**Location:** `src/evals/` inside the project repo.

**DOCX files:** Binary files are large. Start with in-repo storage for small synthetic fixtures. Migrate to Git LFS if the corpus grows.

**Sensitive content:** Never commit real client documents. Scrub or replace all content with filler before committing. Tag as `synthetic` regardless of whether the structure came from a real document.

**`actual-edited.md`:** Model eval runs save the model's raw output alongside the scenario as `runs/<model>/<timestamp>/actual-edited.md`. These are gitignored — they're transient artifacts, not part of the corpus.

---

## Phased Rollout

| Phase | What | When |
|-------|------|------|
| **0 — Foundation** | Format, directory structure, labeling guide, `evals.config.json` | Before first scenario |
| **1 — Unit corpus** | 10–15 reconciler scenarios covering all op types and matching strategies; `evaluator eval --mode unit` runner | First sprint |
| **2 — Model eval runner** | LLM call infrastructure in CLI; run unit corpus scenarios in model mode; compare Anthropic models | Second sprint |
| **3 — Provider comparison** | Add OpenAI + one other provider to `evals.config.json`; run same corpus across all | Once unit corpus is stable |
| **4 — Round-trip corpus** | 5 round-trip scenarios with DOCX fixtures | Once round-trip CLI command is ready |
| **5 — Live capture** | Debug flag in `ChatService` to export candidate scenarios from real sessions | Longer-term |

---

## Open Questions

- **`--update-expected` safety:** Re-baselining should require an explicit flag and a confirmation prompt (or `--force`) to prevent accidental overwrite of golden files during a routine run.
- **Run history:** Model eval results should be persisted somewhere for trend analysis (did match rate improve or degrade between model versions?). For Phase 2, writing a JSON report per run to `runs/<model>/<timestamp>/` is sufficient. A proper dashboard (Braintrust, custom) can come later if the corpus grows.
- **Instruction format:** Should `instruction.md` be the raw user message, or a structured prompt with context (document title, section being edited, etc.)? Start with raw user message — matches how `ChatService` receives it today.
