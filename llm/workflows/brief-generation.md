# Brief Generation Workflow

Generate a concise implementation brief for a user story before creating the detailed plan.

## When to Use This

Use this workflow when asked to:
- "Make a brief for US-X.Y"
- "Create a feature brief for [feature]"
- "Brief me on [feature name]"

**Purpose**: Provide high-level overview to get alignment on approach BEFORE generating the detailed implementation plan from the workflow.

---

## Step 1: Identify the User Story

### 1.1 Locate the User Story

Find the user story in:
- `llm/prd/11-roadmap/mvp-user-stories.md` (primary location)
- `llm/prd/GITHUB_ISSUES.md` (current issues)
- `llm/prd/GITHUB_ISSUES_FUTURE.md` (future issues)

### 1.2 Extract Key Information

From the user story, identify:
- **Title**: What is being built
- **Acceptance Criteria**: What defines "done"
- **Complexity**: S/M/L (small/medium/large)
- **Dependencies**: What must exist first
- **Priority**: P0/P1/P2

---

## Step 2: Determine Tier & Scope

### 2.1 What Tier?

Ask: "What am I building?"

| Tier | Definition | Example |
|------|------------|---------|
| **Feature** | New namespace/capability | Adding "Activity Tracking" to the codebase |
| **Entity** | New entity in existing namespace | Adding "ContactActivity" to Prospecting |
| **Modification** | Changes to existing entity | Adding a field to Contact |

### 2.2 What Scope?

Ask: "Where does this work happen?"

| Scope | Definition | Example |
|-------|------------|---------|
| **Server** | Backend API only, no UI | Activity logging infrastructure |
| **Client** | UI changes only, backend exists | Activity timeline view |
| **Fullstack** | Both server and client | Complete activity tracking feature |

### 2.3 Identify the Workflow

Use this matrix to determine which workflow document to reference:

| Scope | Feature | Entity | Modification |
|----|---|-----|-----|
| **Server** | `server-feature.md` | `server-entity.md` | `server-modification.md` |
| **Client** | `client-feature.md` | `client-entity.md` | `client-modification.md` |
| **Fullstack** | `fullstack-feature.md` | `fullstack-entity.md` | `fullstack-modification.md` |

---

## Step 3: Gather Context

### 3.1 Search for Related Code

Use `codebase_search` to understand existing patterns:
- "Where are contacts stored in the database?"
- "How does sequence execution work?"
- "Where is email sending implemented?"

### 3.2 Identify the Namespace

Determine which namespace this feature belongs to:
- Review `llm/conventions/features-namespaces.md`
- Look at similar existing features
- Common namespaces: `Prospecting`, `Orchestration`, `Communication`, `Interaction`, `Analytics`, `Infrastructure`

### 3.3 Identify Related Entities

What existing entities will this interact with?
- Look at the data model in `llm/prd/11-roadmap/mvp-data-model.md`
- Search for related specs in `llm/prd/06-feature-requirements/mvp/`

---

## Step 4: Generate the Brief

### 4.1 Brief Structure

Present the brief in this format:

```markdown
## US-X.Y: [Feature Name] - Implementation Brief

### Workflow
**[Server/Client/Fullstack] [Feature/Entity/Modification]** (`llm/workflows/[workflow-name].md`)

### Tier & Scope
- **Tier**: [Feature/Entity/Modification]
- **Scope**: [Server/Client/Fullstack]
- **Database**: [App/Warehouse] ([control/data] plane)

### Namespace & Structure
**Primary Namespace**: `[Namespace]` ([reason])

```
[Show directory structure with specific files]
```

### Key Types

**Core Entity**:
- `[EntityName]` - [Purpose]
- `[EnumName]` enum - [Values]
- `[ModelName]Model` - [Purpose]
- `[ServiceName]Service` - [Purpose]

**Integration Points** ([where to add logging/hooks]):
- `[ExistingClass].[Method]()` → [What to do]
- `[ExistingClass2]` → [What to do]

### Database Schema
```sql
[table_name] (
  [key fields with types]
)
```

**Key Decision**: [Any architectural decisions to make]
**Recommend**: [Your recommendation with reasoning]

Ready to proceed?
```

### 4.2 What to Include

**Essential:**
- ✅ Workflow to use (specific file)
- ✅ Tier and scope (clear categorization)
- ✅ Namespace (with reasoning)
- ✅ File structure (specific paths and filenames)
- ✅ Key types (class/enum names)
- ✅ Integration points (where to hook in)
- ✅ Database schema (if applicable)
- ✅ Key decisions (with recommendations)

**Keep It Concise:**
- ❌ No implementation code
- ❌ No detailed steps (that's in the detailed plan from the workflow)
- ❌ No testing details (that's in the detailed plan)
- ✅ Just enough to understand the scope
- ✅ Clear recommendations on design decisions

### 4.3 Tone & Style

- **Concise**: 20-30 lines maximum
- **Actionable**: Reader should know exactly what to do next
- **Decisive**: Make recommendations, don't hedge
- **Structured**: Use consistent formatting
- **High-level**: Strategy, not tactics

---

## Step 5: Confirm Before Implementation

### 5.1 End with "Ready to proceed?"

Always end the brief with this question. This:
- ✅ Signals the brief is complete
- ✅ Gives the user a chance to ask questions
- ✅ Provides a natural transition to the detailed plan
- ✅ Ensures alignment before generating the full implementation plan

### 5.2 Wait for Confirmation

Do NOT generate the detailed plan or start implementation until the user:
- Approves the brief, or
- Asks questions/requests changes, or
- Explicitly says "let's go" or similar

---

## Example Brief Output

```markdown
## US-11.1: Activity Logging Infrastructure - Implementation Brief

### Workflow
**Server Feature** (`llm/workflows/server-feature.md`)

### Tier & Scope
- **Tier**: Feature (new Activity Tracking capability)
- **Scope**: Server-only (no UI, that's US-11.2)
- **Database**: Warehouse (data plane - tenant data)

### Namespace & Structure
**Primary Namespace**: `Prospecting` (contact-centric)

```
Contracts/src/Prospecting/
├── ContactActivityModel.cs
├── ActivityType.cs

Data/src/Prospecting/
├── ContactActivity.cs
├── ContactActivityQuery.cs
├── ContactActivityMapper.cs

Services/src/Prospecting/
├── ContactActivityService.cs

Web/src/Controllers/Prospecting/
├── ContactActivityController.cs
```

### Key Types

**Core Entity**:
- `ContactActivity` - Main activity log entity
- `ActivityType` enum - EmailSent, EmailOpened, EmailClicked, ReplyReceived, etc.
- `ContactActivityModel` - API model
- `ContactActivityService` - Business logic

**Integration Points** (add logging calls):
- `EmailService.SendAsync()` → Log EmailSent
- `TrackingController` → Log EmailOpened/Clicked  
- `SequenceOrchestrationService` → Log SequenceEnrolled/Completed

### Database Schema
```sql
contact_activity (
  id, contact_id, tenant_id, organization_id,
  activity_type, subject_line, metadata,
  occurred_at, created_at, updated_at, deleted_at
)
```

**Key Decision**: Single polymorphic table vs separate tables per type
**Recommend**: Single table (simpler timeline queries, less joins)

Ready to proceed?
```

---

## Common Pitfalls

### Brief Writing Mistakes

❌ **Too detailed** - Brief shows implementation code  
✅ **Right level** - Brief shows file structure and key types

❌ **Too vague** - "We'll need some entities and services"  
✅ **Specific** - "ContactActivity entity in Prospecting namespace"

❌ **No workflow** - Doesn't specify which workflow to follow  
✅ **Clear path** - "Use server-feature.md workflow"

❌ **Starting detailed plan** - Begins showing step-by-step without approval  
✅ **Wait for confirmation** - Ends with "Ready to proceed?"

❌ **Hedging** - "We could maybe possibly use..."  
✅ **Decisive** - "Recommend: Single table (simpler queries)"

### Information Gathering

❌ **Guessing** - Assumes namespace without checking  
✅ **Research** - Uses codebase_search to find patterns

❌ **Missing context** - Doesn't check acceptance criteria  
✅ **Complete** - Reviews US, dependencies, existing code

❌ **Ignoring patterns** - Proposes new structure  
✅ **Consistent** - Follows existing namespace conventions

---

## Tips for AI Models

### Research First
Before generating the brief:
1. Read the full user story (don't just use what's selected)
2. Check dependencies (are they complete?)
3. Search for similar features (what patterns exist?)
4. Review the namespace conventions

### Be Decisive
- Make clear recommendations on design decisions
- Explain reasoning briefly (one sentence)
- Don't present multiple options without a recommendation

### Stay High-Level
- Show the "what" and "where", not the "how"
- File structure: Yes. Implementation code: No.
- Key types: Yes. Method signatures: No.
- Integration points: Yes. Implementation details: No.

### Match the Workflow
Ensure your brief aligns with the workflow you're recommending:
- Server Feature → Full CRUD with RLS
- Server Entity → New entity in existing namespace
- Server Modification → Changes to existing code

### End Clearly
Always end with "Ready to proceed?" and wait for the user's response before generating the detailed plan or starting implementation.

---

## Integration with Start Guide

This workflow is referenced in `llm/start/new-feature.md` as the **Brief** step:

1. **Brief** (this workflow) - High-level overview and alignment
2. **Plan** (workflow documents) - Detailed step-by-step plan
3. **Implement** - Execute the plan
4. **Test** (testing guide) - Verify functionality
5. **Update** (tracking docs) - Mark stories complete

The brief step is quick (5-10 minutes) but crucial for alignment before diving into the detailed plan.
