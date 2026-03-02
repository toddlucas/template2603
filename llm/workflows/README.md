# Workflows Directory

This directory contains step-by-step workflows for implementing features at different tiers and scopes.

> **📖 New here?** See [TERMINOLOGY.md](./TERMINOLOGY.md) for the distinction between **Feature Briefs** (high-level) and **Detailed Plans** (step-by-step).

## Quick Start

### Creating a Feature Brief

**Before you start the detailed plan**, generate an implementation brief:

```
"Make a brief for US-11.1"
"Create a feature brief for activity logging"
"Brief me on the reply ingestion feature"
```

📋 **Uses**: [brief-generation.md](./brief-generation.md)  
⏱️ **Time**: 5-10 minutes  
✅ **Output**: Concise brief with namespace, structure, key types, and recommended workflow

### Following the Detailed Plan

**After your brief is approved**, follow the appropriate workflow to generate and execute the detailed plan:

| Workflow | When to Use | Time |
|----------|-------------|------|
| [server-feature.md](./server-feature.md) | New server namespace/feature with full CRUD | 2-3 hours |
| [server-entity.md](./server-entity.md) | New entity in existing server namespace | 1-2 hours |
| [server-modification.md](./server-modification.md) | Changes to existing server entity | 30min-1 hour |
| [client-feature.md](./client-feature.md) | New client feature with i18n | 2-3 hours |
| [client-entity.md](./client-entity.md) | New components in existing client feature | 1-2 hours |
| [client-modification.md](./client-modification.md) | Changes to existing client components | 30min-1 hour |
| [fullstack-feature.md](./fullstack-feature.md) | New feature with server API + client UI | 4-6 hours |
| [fullstack-entity.md](./fullstack-entity.md) | New entity with server + client | 2-3 hours |
| [fullstack-modification.md](./fullstack-modification.md) | Changes spanning server + client | 1-2 hours |

---

## Tier & Scope Matrix

Use this to determine which workflow to follow:

| Scope | Feature | Entity | Modification |
|-------|---------|--------|--------------|
| **Server** | `server-feature.md` | `server-entity.md` | `server-modification.md` |
| **Client** | `client-feature.md` | `client-entity.md` | `client-modification.md` |
| **Fullstack** | `fullstack-feature.md` | `fullstack-entity.md` | `fullstack-modification.md` |

### What's the difference?

**Tier (what you're building):**
- **Feature**: New namespace/capability (e.g., "Activity Tracking")
- **Entity**: New entity in existing namespace (e.g., "ContactActivity" in Prospecting)
- **Modification**: Changes to existing entity (e.g., adding a field to Contact)

**Scope (where the work happens):**
- **Server**: Backend API only, no UI changes
- **Client**: UI changes only, backend already exists
- **Fullstack**: Both server API and client UI

---

## Typical Flow

```
1. User Story → 📋 Brief Generation
   ↓
2. Review Brief → Get approval
   ↓
3. Follow Workflow → Generate detailed plan, implement step-by-step
   ↓
4. Test → Verify functionality
   ↓
5. Update Tracking → Mark stories complete
```

### Example: US-11.1 (Activity Logging)

1. **Brief**: "Make a brief for US-11.1"
   - Output: Server Feature, Prospecting namespace, ContactActivity entity
   
2. **Approve**: Review and confirm approach
   
3. **Detailed Plan**: Follow `server-feature.md` workflow
   - Model → Entity → Query → Mapper → Service → Controller
   - Add RLS policies
   - Write tests
   
4. **Test**: Run `dotnet test`
   
5. **Update**: Mark US-11.1 complete in tracking docs

---

## Common Invocations (for AI Models)

### Creating Brief
```
"Make a brief for US-X.Y"
"Create a feature brief for [feature name]"
"Brief me on [feature description]"
```

### Starting Detailed Plan
```
"Let's implement US-X.Y following the brief"
"Start the detailed plan for activity logging"
"Begin with step 1 of the server-feature workflow"
```

### During Implementation
```
"Continue with the next step"
"What's next in the workflow?"
"I'm stuck on step 3"
```

---

## Tips for Using Workflows

### For Developers
- ✅ **Brief first**: Generate a brief before detailed planning
- ✅ **Follow the workflow**: Don't skip steps
- ✅ **Check off items**: Use the checklist at the end
- ✅ **Test as you go**: Don't wait until the end

### For AI Models
- ✅ **Always brief first**: Use brief-generation.md for medium/large features
- ✅ **Wait for approval**: End briefs with "Ready to proceed?"
- ✅ **Reference the workflow**: Mention which workflow you're following
- ✅ **Track progress**: Update todos, check off completed steps
- ✅ **Stay on track**: Don't deviate from the workflow without discussing

---

## Workflow Maintenance

These workflows are generated from templates in `../templates/` using modules from `../modules/`.

**Last Generated**: See [_generated.txt](./_generated.txt)

**To regenerate**: Use the generation script when templates or modules change.

---

## Related Documentation

- **[Start Guide](../start/new-feature.md)** - Where to begin
- **[Testing Guide](../start/testing.md)** - How to test
- **[Feature Namespaces](../conventions/features-namespaces.md)** - Naming conventions
- **[Development Artifacts](../conventions/development-artifacts.md)** - File organization

