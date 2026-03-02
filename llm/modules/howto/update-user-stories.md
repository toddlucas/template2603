# Update User Stories

> **Module**: How-To  
> **Domain**: Post-implementation tracking  
> **Token target**: 150-200

## Purpose

How to update user story status after implementing a feature.

## Content to Include

### Location

User stories are in `doc/prd/##-roadmap/mvp-user-stories.md`

### Update Process

1. **Locate the story** by feature area or search
2. **Update status marker**:
   - `[ ]` → `[x]` for completed stories
3. **Add completion date** if applicable
4. **Add implementation notes** if implementation differed from story

### Example

Before:
```markdown
- [ ] As a user, I can create contacts for outreach
```

After:
```markdown
- [x] As a user, I can create contacts for outreach
  - Completed: 2025-12-10
  - Note: Added bulk import feature as well
```

### When to Update

- After feature is merged to main
- After feature is deployed (depending on team process)
- When partial implementation is complete (add notes about remaining work)

