# Workflow Generation Process

## Overview

This system maintains AI-optimized workflow documents through a three-layer architecture: composable modules, assembly templates, and generated workflows.

## Directory Structure

```
doc/
├── templates/
│   ├── backend-service.md
│   ├── frontend-feature.md
│   └── data-migration.md
│
├── modules/
│   ├── conventions/
│   ├── patterns/
│   ├── howto/
│   └── design/
│
└── workflows/              # Generated files
    ├── backend-service.md
    ├── frontend-feature.md
    └── _generated.txt      # Timestamp log
```

## The Three Layers

### 1. Modules (Source of Truth)
Small, focused documents (200-500 tokens) covering single concepts. These are manually maintained and versioned.

**Best practices:**
- One concept per module
- Include concrete examples
- Add metadata at top: type, domain, last updated
- Keep independently understandable

### 2. Templates (Assembly Instructions)
Meta-documents that specify how to build each workflow. These live in `/templates/` and contain:

- Which modules to include and in what order
- Where to add narrative transitions
- Workflow-specific content to inline
- Target length and format
- Update triggers

### 3. Workflows (Generated for AI)
Complete, linear documents optimized for AI context consumption. These live in `/workflows/` and are regenerated from templates.

## Generation Process

**To generate or regenerate a workflow:**

1. Open the template (e.g., `templates/backend-service.md`)
2. Prompt the model:
   ```
   Generate the workflow document specified in this template.
   Pull content from the referenced modules and assemble
   according to the instructions. Output as a single markdown
   artifact titled "[Workflow Name]".
   ```
3. Save the generated artifact to `workflows/[workflow-name].md`
4. Update `workflows/_generated.txt` with timestamp

**Generated workflows include:**
- Header with generation metadata
- Inline module content (not links)
- Narrative transitions between sections
- Complete, self-contained instructions
- Warning that file is generated

## When to Regenerate

Update or regenerate a workflow when:
- Any referenced module changes
- Template assembly instructions change
- After using the workflow and finding gaps
- New patterns emerge that should be included
- Weekly review identifies staleness

## Maintenance Guidelines

**Updating modules:**
1. Edit the module in `/modules/`
2. Note which templates reference it
3. Update affected workflows

**Creating new workflows:**
1. Create template in `/templates/`
2. Reference existing modules
3. Generate initial workflow
4. Refine based on actual use

**When workflow feels incomplete:**
- First check: Is a module outdated? Update it.
- Second check: Is template assembly wrong? Fix order.
- Third check: Missing transitions? Add to template.
- Then regenerate.

## Key Principles

- **Modules are truth**: Never edit generated workflows directly
- **Templates are recipes**: They define the assembly process
- **Workflows are disposable**: Regenerate freely
- **Inline over link**: Generated workflows contain full content, not references
- **Linear narrative**: Each workflow tells a complete story
- **Context-optimized**: Target 2000-4000 tokens per workflow

## Example Template Structure

```markdown
# Template: [Workflow Name]

## Purpose
[Brief description]

## Assembly Instructions

### Include (in order):
1. modules/conventions/[name].md
2. modules/patterns/[name].md
3. modules/howto/[name].md (section: X)

### Add Transitions:
- After conventions: "[connecting text]"
- After patterns: "[connecting text]"

### Inline Workflow-Specific Content:
[Content that doesn't belong in reusable modules]

## Target Output
- Length: 3000-4000 tokens
- Format: Single markdown
- Output: workflows/[workflow-name].md
```

## Benefits

- **Consistency**: All workflows built from same modules
- **Maintainability**: Update once in modules, regenerate many workflows
- **Context-optimized**: Models get complete, linear narratives
- **Traceability**: Know exactly what's in each workflow
- **Evolvability**: Easy to refine based on real usage