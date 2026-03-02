# Building a New Feature - Start Here

## Quick Decision: What Are You Building?

```
What type of feature?
├─ Full-stack (Server API + Client UI)?
│  └─ Use both templates below
│
├─ Server-only (API endpoint)?
│  └─ Use Server Feature Template
│
└─ Client-only (UI feature)?
   └─ Use Client Feature Template
```

## 📖 Recommended: Comprehensive Templates

**These templates are copy-paste ready with all patterns consolidated:**

| Template | Use For | Time |
|----------|---------|------|
| **[Server Feature Template](../patterns/server/server-feature-template.md)** | Complete server-side CRUD with RLS | 2-3 hours |
| **[Client Feature Template](../patterns/client/client-feature-template.md)** | Complete client feature with i18n | 2-3 hours |

Each template includes:
- Step-by-step walkthrough
- Copy-paste code examples
- RLS (server) and i18n (client) setup
- Testing patterns
- Checklists

> **Tip**: For full-stack features, start with the server template to build the API, then use the client template to consume it.

---

## Alternative: Quick Reference Workflow

If you prefer a lighter-weight approach or need specific guidance:

### Planning (5-10 minutes)

**📋 For structured planning (recommended for medium/large features):**
- Use [Brief Generation Workflow](../workflows/brief-generation.md)
- Generates a concise feature brief with namespace, structure, and key types
- Identifies which detailed implementation workflow to use
- Quick invocation: "Make a brief for US-X.Y"

**⚡ For quick planning (simple features):**

**Choose your namespace:**
- Review [Feature Namespaces](../conventions/features-namespaces.md)
- Common namespaces: Prospecting, Orchestration, Communication, Interaction, Analytics

**Choose your database:**
- Review [Database Architecture](../patterns/server/database-architecture.md)
- Control Plane (App): Users, tenants, organizations, access control
- Data Plane (Warehouse): Contacts, sequences, campaigns, domain entities

**Example**: Building a "Contact Management" feature → Use `Prospecting` namespace, `App` database (data plane)

### Server Development

**📖 Primary:** [Server Feature Template](../patterns/server/server-feature-template.md) - Comprehensive, copy-paste ready

**Reference docs (when needed):**
- **[Server Architecture Patterns](../patterns/server/server-architecture-patterns.md)** - Design principles
- **[RLS Patterns](../patterns/server/rls-patterns.md)** - Row-Level Security (included in template)
- **[Mapper Patterns](../patterns/server/mapper-patterns.md)** - When mapping gets complex
- **[Pagination Patterns](../patterns/server/pagination-patterns.md)** - For list endpoints

**Testing docs:**
1. **[Testing Strategy](../overview/server/testing-strategy.md)** (5 min read) - Philosophy and approach
2. **[Testing Patterns](../patterns/server/testing-patterns.md)** (reference) - Concrete examples
3. **[Database Testing Pattern](../patterns/server/database-testing-pattern.md)** (when needed) - Fast database tests

### Client Development

**📖 Primary:** [Client Feature Template](../patterns/client/client-feature-template.md) - Comprehensive, copy-paste ready

**Reference docs (when needed):**
- **[Feature Development Pattern](../patterns/client/feature-development-pattern.md)** - Architecture details
- **[i18n Localization Pattern](../patterns/client/i18n-localization-pattern.md)** - Full i18n reference (included in template)
- **[UI Components Pattern](../patterns/client/ui-components-pattern.md)** - Using shadcn/ui components
- **[Modular Zustand Store Pattern](../patterns/client/modular-zustand-store-pattern.md)** - Complex state management

### Development Artifacts Management

**📖 [Development Artifacts](../conventions/development-artifacts.md)**

- **`scratch/`** - Quick experiments (gitignored)
- **`examples/`** - Committed examples for the team
- **`.notes/`** - Design decisions and notes
- **`src/`** - Production code and tests only

## Checklists

### Server Feature Checklist

- [ ] Chose namespace (Prospecting, Orchestration, etc.)
- [ ] Created Model in `Contracts/`
- [ ] Created Entity in `Data/` (with `TenantId` property)
- [ ] Created Query class in `Data/`
- [ ] Created Mapper in `Data/`
- [ ] Registered DbSet in DbContext
- [ ] Created Service in `Services/` (sets `TenantId` in CreateAsync)
- [ ] Registered service in DI
- [ ] Created Controller in `Web/` (uses `[TenantRead]`/`[TenantWrite]`)
- [ ] Added RLS policy for table (if multi-tenant)
- [ ] Added to TypeScript generation (if needed)
- [ ] Created migration
- [ ] **Wrote unit tests for service**
- [ ] **Wrote database tests for queries**
- [ ] **Wrote integration tests for controller**

### Client Feature Checklist

**New Feature:**
- [ ] Created feature directory structure
- [ ] Created API client (`api/`)
- [ ] Created service (`services/`)
- [ ] Registered service in DI
- [ ] Created all 5 locale files (de, el, en, es, fr) in `locales/`
- [ ] Created locale index (`locales/index.ts`)
- [ ] Registered locales in app's `features/locales.ts`
- [ ] Created components with `useTranslation("featureName")`
- [ ] Created test page (`views/`)
- [ ] Added route for test page
- [ ] Ran duplicate checker: `python bin/i18n_dupes.py -l en`

**Adding to Existing Feature:**
- [ ] Checked `common` and `translation` namespaces for existing keys
- [ ] Added new keys to all 5 locale files
- [ ] Used `useTranslation("featureName")` in component
- [ ] Ran duplicate checker

### Full-Stack Integration Checklist

- [ ] Server API endpoints working
- [ ] Client can call API successfully
- [ ] Error handling on both sides
- [ ] Loading states implemented
- [ ] Happy path tested end-to-end
- [ ] Error paths tested
- [ ] Test page demonstrates all features
- [ ] Development artifacts organized properly

## Common Pitfalls

### Server
- ❌ Forgetting to register service in DI
- ❌ Not ignoring temporal fields in mappers
- ❌ Not testing error paths
- ❌ Using wrong mapper pattern for DetailModels
- ✅ Use Per-Test container pattern for database tests (Pattern 1)

### Client
- ❌ Putting examples/prototypes in `src/` (use `scratch/` or `examples/`)
- ❌ Repeating complex Tailwind patterns (create components!)
- ❌ Not creating test page for feature
- ❌ Forgetting to register routes
- ❌ Creating only `en.jsonc` (must create all 5 languages)
- ❌ Duplicating keys that exist in `common` or `translation` namespaces
- ❌ Forgetting to register feature locales in `features/locales.ts`
- ✅ Use shadcn/ui components
- ✅ Check for existing i18n keys before adding new ones

### Both
- ❌ Not writing tests
- ❌ Not following naming conventions
- ❌ Mixing namespaces
- ❌ Committing TODO comments
- ✅ Follow established patterns

## Getting Help

### Server Questions
- Architecture/patterns: [Server Architecture Patterns](../patterns/server/server-architecture-patterns.md)
- Mapperly issues: [Mapper Patterns](../patterns/server/mapper-patterns.md)
- Multi-tenancy/RLS: [RLS Patterns](../patterns/server/rls-patterns.md)
- Testing issues: [Testing Strategy](../overview/server/testing-strategy.md) or [Testing Patterns](../patterns/server/testing-patterns.md)
- Database testing: [Database Testing Pattern](../patterns/server/database-testing-pattern.md)

### Client Questions
- Architecture: [Client Overview](../overview/client/client-overview.md)
- Components: [UI Components Pattern](../patterns/client/ui-components-pattern.md)
- Localization: [i18n Localization Pattern](../patterns/client/i18n-localization-pattern.md)
- State: [Modular Zustand Store Pattern](../patterns/client/modular-zustand-store-pattern.md)
- DI/Events: [Platform Events System](../overview/client/platform-events-system.md)

### General Questions
- Where to put files: [Development Artifacts](../conventions/development-artifacts.md)
- Naming: [Feature Namespaces](../conventions/features-namespaces.md)
- Messages: [Message Guidelines](../conventions/message-guidelines.md)

## Example: Building "Contact Management"

### 1. Planning
- Namespace: `Prospecting`
- Database: Warehouse (data plane)
- Features: Create, Read, Update, Delete contacts
- Models: `ContactModel`, `ContactDetailModel`

### 2. Server (2-3 hours)
Follow [Server Feature Template](../patterns/server/server-feature-template.md):
- Create Model, Entity, Query, Mapper, Service, Controller
- Add `TenantId` to entity, set it in service
- Use `[TenantRead]`/`[TenantWrite]` on controller actions
- Add RLS policy for `contact` table
- Write tests using Data.Mock
- Create migration

### 3. Client (2-3 hours)
Follow [Client Feature Template](../patterns/client/client-feature-template.md):
- Create feature structure in `common/src/features/contacts/`
- Set up all 5 locale files, register in `features/locales.ts`
- Build components with `useTranslation("contacts")`
- Create test page with all operations
- Add routes

### 4. Integration (30 minutes)
- Test end-to-end workflow
- Fix any issues
- Run `python bin/i18n_dupes.py -l en` to check for duplicates

**Total**: ~5-6 hours for complete full-stack CRUD feature with RLS, i18n, and tests

## Post-Implementation: Update Tracking

### User Stories

After completing your feature, update any associated user stories in the PRD:

1. **Locate user stories** in `doc/prd/11-roadmap/mvp-user-stories.md`
2. **Update status** by changing the story's status marker:
   - `[ ]` → `[x]` for completed stories
   - Add completion date if applicable
3. **Add implementation notes** if the implementation differed from the original story

### GitHub Issues

If there are associated GitHub issues, use the `gh` CLI tool to update them. **Always list and confirm before making changes.**

#### Step 1: List Associated Issues

```bash
# Search for issues related to your feature
gh issue list --search "contact management" --state open

# Or list by label
gh issue list --label "feature:prospecting" --state open

# View a specific issue
gh issue view <issue-number>
```

#### Step 2: Document Intended Actions

Before updating, list all issues and what you plan to do:

```
Issues to update:
- #42: "Implement Contact CRUD" → Close (completed)
- #43: "Contact list pagination" → Close (completed)  
- #44: "Contact import feature" → Add comment (partially done, follow-up needed)
```

#### Step 3: Confirm with User

**⚠️ Always confirm with the user before updating GitHub issues.**

Present the list of changes and wait for approval:
- Which issues will be closed
- Which issues will have comments added
- Any labels to add/remove

#### Step 4: Execute Updates (After Confirmation)

```bash
# Close an issue with a comment
gh issue close <issue-number> --comment "Completed in PR #<pr-number>"

# Add a comment without closing
gh issue comment <issue-number> --body "Implemented core functionality. Follow-up needed for: ..."

# Add a label
gh issue edit <issue-number> --add-label "status:done"

# Remove a label  
gh issue edit <issue-number> --remove-label "status:in-progress"
```

#### Common gh Commands Reference

| Action | Command |
|--------|---------|
| List open issues | `gh issue list --state open` |
| Search issues | `gh issue list --search "keyword"` |
| View issue details | `gh issue view <number>` |
| Close issue | `gh issue close <number>` |
| Close with comment | `gh issue close <number> --comment "message"` |
| Add comment | `gh issue comment <number> --body "message"` |
| Edit labels | `gh issue edit <number> --add-label "label"` |
| Link PR to issue | Include "Closes #<number>" in PR description |

## Next Steps

After building your feature:
- Run tests: `dotnet test` (server), `npm test` (client)
- Run the app and test manually
- Create PR with tests passing
- Update user stories and GitHub issues (see above)
- Update this guide if you found gaps!

