# Update GitHub Issues

> **Module**: How-To  
> **Domain**: Post-implementation tracking  
> **Token target**: 300-400

## Purpose

How to update GitHub issues after implementing a feature using the `gh` CLI.

## Content to Include

### Step 1: Find Related Issues

```bash
# Search by keyword
gh issue list --search "contact management" --state open

# List by label
gh issue list --label "feature:prospecting" --state open

# View specific issue
gh issue view <issue-number>
```

### Step 2: Document Changes

Before updating, list what you plan to do:

```
Issues to update:
- #42: "Implement Contact CRUD" → Close (completed)
- #43: "Contact list pagination" → Close (completed)
- #44: "Contact import feature" → Add comment (partially done)
```

### Step 3: Confirm with User

**⚠️ Always confirm before updating GitHub issues.**

Present:
- Which issues will be closed
- Which issues will have comments added
- Any labels to add/remove

### Step 4: Execute Updates

**NOTE: Any body text has to be in a temporary file created and removed as separate commands.**

```bash
# Close with comment
gh issue close <number> --comment "Completed in PR #<pr-number>"

# Add comment without closing
gh issue comment <number> --body "Implemented core functionality. Follow-up needed for: ..."

# Add label
gh issue edit <number> --add-label "status:done"

# Remove label
gh issue edit <number> --remove-label "status:in-progress"
```

### Quick Reference

| Action | Command |
|--------|---------|
| List open | `gh issue list --state open` |
| Search | `gh issue list --search "keyword"` |
| View | `gh issue view <number>` |
| Close | `gh issue close <number>` |
| Close with comment | `gh issue close <number> --comment "message"` |
| Add comment | `gh issue comment <number> --body "message"` |
| Edit labels | `gh issue edit <number> --add-label "label"` |

### Link PR to Issue

Include in PR description:
```
Closes #<issue-number>
```

This auto-closes the issue when PR merges.

