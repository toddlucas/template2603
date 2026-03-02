# Template: Client Modification

## Purpose

Workflow for modifying existing client components—adding UI elements, operations, or small enhancements to existing entities.

## Generation Rules

> ⚠️ **CRITICAL**: Generate COMPLETE, STANDALONE workflows.
> - Do NOT elide sections or say "see other workflow for patterns"
> - Do NOT shorten to "save space" - target token lengths are intentional
> - Each workflow must contain ALL code examples inline
> - The implementing model should need ONLY this document

## Assembly Instructions

### Include (in order):

1. `modules/patterns/client/localization.md` (section: Adding to Existing Feature)
   - Checking common/translation namespaces first
   - Adding keys to all 5 language files
   - Using useTranslation with feature namespace

2. `modules/patterns/client/components.md` (section: Adding Components)
   - Component patterns
   - Using existing services
   - Connecting to existing state

3. `modules/patterns/client/testing.md` (section: What to Test)
   - Update existing tests for new functionality

4. `modules/howto/update-tracking-docs.md` (section: Modification updates)
   - User stories, GitHub issues

### Preserve Notes:

> **Important:** Copy all `> **Note:**` blocks from modules directly into the workflow output. These are instructions for the implementing model.

### Add Transitions:

- After localization: "With translations in place, build or update the component."
- After component changes: "Update tests for the new functionality."
- Before post-implementation: "Update tracking documents."

### Inline Workflow-Specific Content:

#### Prerequisites Section
```markdown
Before starting:
1. **Identify the existing feature**: Which namespace and entity?
2. **Check existing translations**: Does the key exist in common or translation?
3. **Review existing components**: Understand patterns in use
```

#### Decision Tree
```markdown
What are you modifying?

├─ New UI element in existing component
│  └─ Steps: Check i18n → Add translations → Update component
│
├─ New page/view for existing entity
│  └─ Steps: Check i18n → Add translations → Create view → Add route
│
├─ New API operation for existing entity
│  └─ Steps: Add to API client → Add to service → Use in component
│
├─ New entity in existing feature
│  └─ Use client-entity workflow instead
│
└─ New feature
    └─ Use client-feature workflow instead
```

#### i18n Quick Check
```markdown
Before adding a translation key:

1. Check `common` namespace (generic UI):
   - Edit, Delete, Save, Cancel, Actions, Search, etc.

2. Check `translation` namespace (app-wide):
   - Dashboard, Settings, navigation items

3. Only add to feature namespace if truly feature-specific
```

#### Checklist (end of document)
```markdown
### Localization
- [ ] Checked common namespace for existing keys
- [ ] Checked translation namespace for existing keys
- [ ] Added new keys to all 5 locale files
- [ ] Ran duplicate checker: `python bin/i18n_dupes.py -l en`

### Component
- [ ] Updated component with useTranslation("{feature}")
- [ ] Connected to existing services
- [ ] Integrated with parent component or route

### Testing
- [ ] Component tests updated
- [ ] Verified i18n keys resolve

### Tracking
- [ ] User stories updated
- [ ] GitHub issues updated
```

## Target Output

- **Length**: 1000-1500 tokens
- **Format**: Single markdown, focused on modifications
- **Output**: `workflows/client-modification.md`

## Backlinks for Deep Dives

- [Client Feature Template](../patterns/client/client-feature-template.md) - Full reference
- [i18n Localization Pattern](../patterns/client/i18n-localization-pattern.md) - Comprehensive i18n
