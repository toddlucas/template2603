# Templates

Templates define how to assemble modules into workflows. Each template specifies:
- Which modules to include
- In what order
- What transitions to add between sections
- What workflow-specific content to inline
- Target length and output location

## Template Tiers

| Tier | Purpose | When to Use |
|------|---------|-------------|
| **Feature** | New namespace/directory + first entity | Starting a new feature area |
| **Entity** | New entity in existing namespace | Adding Contact, Sequence, etc. to existing feature |
| **Modification** | Changes to existing entity | Adding fields, operations, UI elements |

## Available Templates

| Template | Purpose | Target Length |
|----------|---------|---------------|
| [server-feature.md](./server-feature.md) | New server namespace + first entity | 2500-3500 tokens |
| [server-entity.md](./server-entity.md) | Add entity to existing namespace | 2000-3000 tokens |
| [server-modification.md](./server-modification.md) | Modify existing entity | 1500-2000 tokens |
| [client-feature.md](./client-feature.md) | New client feature + first entity | 2500-3500 tokens |
| [client-entity.md](./client-entity.md) | Add entity to existing feature | 2000-2500 tokens |
| [client-modification.md](./client-modification.md) | Modify existing components | 1000-1500 tokens |
| [fullstack-feature.md](./fullstack-feature.md) | Combined server + client feature | 5000-6000 tokens |
| [fullstack-entity.md](./fullstack-entity.md) | Combined server + client entity | 4000-5000 tokens |
| [fullstack-modification.md](./fullstack-modification.md) | Combined server + client changes | 2500-4000 tokens |

## How to Use

### Generating a Workflow

1. Open the template you need
2. Prompt the AI:
   ```
   Generate the workflow document specified in this template.
   Pull content from the referenced modules and assemble
   according to the instructions. Output as a single markdown
   artifact.
   ```
3. Save to `workflows/{template-name}.md`
4. Update `workflows/_generated.txt` with timestamp

### When to Regenerate

- When a referenced module changes
- When template assembly instructions change
- After using workflow and finding gaps
- Weekly review identifies staleness

## Template Structure

Each template follows this format:

```markdown
# Template: {Name}

## Purpose
Brief description of when to use this template.

## Assembly Instructions

### Include (in order):
1. module-path (full or section: X)
2. module-path (full or section: X)
...

### Preserve Notes:
> **Important:** Copy all `> **Note:**` blocks from modules
> directly into the workflow output.

### Add Transitions:
- After X: "connecting text"
- After Y: "connecting text"

### Inline Workflow-Specific Content:
Content that doesn't belong in reusable modules.

## Target Output
- Length: token range
- Format: description
- Output: path

## Backlinks for Deep Dives
Links to comprehensive reference docs.
```

## Module Dependencies

```
server-feature
├── model-troika (full)
├── queries (full)
├── mappers (full)
├── services (full)
├── localization (full)
├── metrics (full)
├── controllers (full)
├── rls (essentials)
├── testing (full)
└── update-tracking-docs

server-entity
├── model-troika (full)
├── queries (full)
├── mappers (full)
├── services (full or section)
├── localization (full)
├── metrics (full)
├── controllers (full or section)
├── rls (essentials)
├── testing (full)
└── update-tracking-docs

server-modification
├── model-troika (section: Adding Fields)
├── queries (section: Adding Query Methods)
├── mappers (section: Updating Mappers)
├── services (section: Adding Operations)
├── localization (section: Using Localizer)
├── metrics (section: Recording Metrics)
├── controllers (section: Adding Endpoints)
├── testing (section)
└── update-tracking-docs (section)

client-feature
├── feature-structure (full)
├── localization (section: New Feature Setup)
├── components (full)
├── routing (full)
├── testing (full)
└── update-tracking-docs

client-entity
├── localization (section: Adding to Existing Feature)
├── components (full for new entity)
├── routing (section: Adding Routes)
├── testing (full)
└── update-tracking-docs

client-modification
├── localization (section: Adding to Existing Feature)
├── components (section: Adding Components)
├── testing (section)
└── update-tracking-docs (section)

fullstack-feature
├── [all server-feature modules]
├── [all client-feature modules]
├── integration (inline)
└── update-tracking-docs

fullstack-entity
├── [all server-entity modules]
├── [all client-entity modules]
├── integration (inline)
└── update-tracking-docs

fullstack-modification
├── [all server-modification modules]
├── [all client-modification modules]
├── integration (inline)
└── update-tracking-docs (section)
```

## Related

- [Modules](../modules/) - Source content for workflows
- [Workflows](../workflows/) - Generated output documents
- [Workflow Generation Process](./BACKGROUND.md) - Detailed process guide
