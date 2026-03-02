# Feature Notes Directory

**✅ These files are committed for team reference**

## Purpose

Feature-specific documentation, design decisions, and technical notes that don't belong in formal documentation.

## What Goes Here

- ✅ Design decisions and rationale
- ✅ Complex state management flows
- ✅ API integration details
- ✅ Performance considerations
- ✅ Known issues or limitations
- ✅ Architecture diagrams
- ✅ Migration notes
- ✅ Feature-specific ADRs (Architecture Decision Records)

## What Does NOT Go Here

- ❌ Production README files → use `doc/`
- ❌ Code examples → use `examples/`
- ❌ Temporary scratch notes → use `scratch/`
- ❌ API documentation → use inline JSDoc

## File Naming

Use descriptive names with `.md` extension:
- `breadcrumb-design.md`
- `sidebar-state-management.md`
- `auth-flow-diagram.png`
- `performance-optimization-notes.md`

## When to Create Notes

Create a note when:
- 📝 You make a significant design decision
- 📝 You implement complex logic that needs explanation
- 📝 You discover non-obvious behavior
- 📝 You want to document "why" not "what"
- 📝 Future developers might ask "why did we do it this way?"

## Example Note Structure

```markdown
# Feature Name Design

## Context

Brief explanation of the problem or requirement.

## Decision

What we decided to do and why.

## Alternatives Considered

Other approaches we considered and why we didn't choose them.

## Consequences

Trade-offs, benefits, and potential issues.

## References

- Link to related documentation
- Link to examples
- External resources
```

## Current Notes

- Coming soon (add links to notes here as they're created)

## vs. Formal Documentation

| .notes/ | doc/ |
|---------|------|
| Feature-specific | Project-wide |
| Informal | Formal |
| Implementation details | Architecture & patterns |
| "Why we did this" | "How to do this" |
| Living document | Maintained documentation |

---

**Tip**: Start with a note here, then move to formal `doc/` if it's widely applicable.

