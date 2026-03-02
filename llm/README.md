# Documentation Hub

The doc directory contains documentation related to the product from a product management and engineering perspective.
It is a collaborative workspace where developers and LLM models collaborate.

> **Note**: For marketing website documentation, see `../../website/llm/`

## 🚀 Quick Start by Goal

| I want to... | Start here |
|--------------|-----------|
| **Build a new feature** | [New Feature Guide](./start/new-feature.md) ⭐ |
| **Write tests** | [Testing Guide](./start/testing.md) ⭐ |
| **Understand the codebase** | [Understanding Guide](./start/understanding-codebase.md) ⭐ |
| **Manage dev files** | [Development Artifacts](./conventions/development-artifacts.md) |
| **Debug or prototype** | [Development Artifacts](./conventions/development-artifacts.md) - use `scratch/` |

## 📚 Documentation Structure

### `start/` - Quick Start Guides ⭐ NEW
Task-focused guides to get you productive quickly:
- **[new-feature.md](./start/new-feature.md)** - Building features (full-stack, server, or client)
- **[testing.md](./start/testing.md)** - Writing and running tests
- **[understanding-codebase.md](./start/understanding-codebase.md)** - Navigating the codebase

### `architecture/` - System Architecture Documents

### `overview/` - Architecture & Philosophy
High-level descriptions of systems and approaches:
- **[Client Overview](./overview/client/client-overview.md)** - React, Zustand, shadcn/ui, DI
- **[Server Overview](./overview/server/server-overview.md)** - Layered architecture, projects
- **[Website Overview](./overview/website/website-overview.md)** - Next.js marketing site (dev setup)
- **[Testing Strategy](./overview/server/testing-strategy.md)** - Testing philosophy and pyramid

> For marketing website documentation (content, design, etc.), see `../website/llm/`
- [Platform Events System](./overview/client/platform-events-system.md) - Component communication
- [Debug Logging](./overview/client/debug-logging.md) - Structured logging

### `guides/` - Step-by-Step How-To Guides ⭐ NEW
Detailed walkthroughs for specific tasks:

**Server:**
- **[Multi-Database RLS Usage](./guides/server/multi-database-rls-usage.md)** - Usage patterns & examples
- **[Keyed Services Injection Guide](./guides/server/keyed-services-injection-guide.md)** - How to inject guards
- **[Enabling RLS](./guides/server/enabling-rls.md)** - Step-by-step RLS setup
- **[Overriding Services in Tests](./guides/server/overriding-services-in-tests.md)** - Replace services in WebApplicationFactory tests

### `concepts/` - System Behaviors & Lifecycles ⭐ NEW
How the system works - key behaviors and flows:

*More concepts coming soon: TBD*

### `patterns/` - Reproducible Patterns & Templates
Best practices and reusable patterns:

**Client:**
- **[Feature Development Pattern](./patterns/client/feature-development-pattern.md)** - Build independent features
- **[UI Components Pattern](./patterns/client/ui-components-pattern.md)** - shadcn/ui usage, styling
- [Modular Zustand Store Pattern](./patterns/client/modular-zustand-store-pattern.md) - Complex state

**Server:**
- **[Server Quick Reference](./patterns/server/server-quick-reference.md)** - Templates & cheat sheet ⭐
- **[Testing Patterns](./patterns/server/testing-patterns.md)** - xUnit, WebApplicationFactory
- **[Database Testing Pattern](./patterns/server/database-testing-pattern.md)** - Fast in-memory testing
- **[Database Architecture](./patterns/server/database-architecture.md)** - Control plane vs data plane ⭐ NEW
- **[RLS Patterns](./patterns/server/rls-patterns.md)** - Row-Level Security & multi-tenancy ⭐ NEW
- [Interceptor Behavior Explanation](./patterns/server/interceptor-behavior-explanation.md) - EF Core interceptors
- [Server Architecture Patterns](./patterns/server/server-architecture-patterns.md) - Layered architecture
- [Server Component Template](./patterns/server/server-component-template.md) - Complete examples
- [Mapper Patterns](./patterns/server/mapper-patterns.md) - Mapperly usage
- [Pagination Patterns](./patterns/server/pagination-patterns.md) - List operations
- [Enumeration Classes Pattern](./patterns/server/enumeration-classes-pattern.md) - Type-safe enums

### `plans/` - Historical Design & Implementation Docs ✅
Completed work and design decisions (date-prefixed):

**Server:**
- [2025-12-06 Multi-Database RLS Design](./plans/server/2025-12-06_multi-database-rls-design.md) - The design plan for the row level security system

### `conventions/` - Rules & Standards
Project-wide conventions and standards:
- **[Development Artifacts](./conventions/development-artifacts.md)** - Where to put files ⭐
- **[Feature Namespaces](./conventions/features-namespaces.md)** - Naming consistency
- **[Settings Naming Conventions](./conventions/settings-naming-conventions.md)** - Config vs persisted settings ⭐ NEW
- [Filename Date Prefix](./conventions/filename-date-prefix.md) - When to use dates
- [Message Guidelines](./conventions/message-guidelines.md) - User-facing messages
- [Testing Conventions](./conventions/testing-conventions.md) - Test organization

### `prd/`, `research/`, `notes/` - Product & Planning
Product requirements, competitive research, and working notes

## 🎯 Common Workflows

### Full-Stack Feature Development
```
1. Brief → workflows/brief-generation.md (generate feature brief)
2. Detailed Plan → workflows/[workflow].md (server/client/fullstack)
3. Server API → patterns/server/server-quick-reference.md
4. Server tests → start/testing.md
5. Client feature → patterns/client/feature-development-pattern.md
6. Client UI → patterns/client/ui-components-pattern.md
7. Manage artifacts → conventions/development-artifacts.md
```

### Server-Only Development with Tests
```
1. Quick reference → patterns/server/server-quick-reference.md
2. Implementation → patterns/server/server-component-template.md (if complex)
3. Unit tests → start/testing.md
4. Integration tests → patterns/server/testing-patterns.md
5. Database tests → patterns/server/database-testing-pattern.md
```

### Client-Only Development
```
1. Architecture → overview/client/client-overview.md
2. App system → overview/client/apps/README.md (if creating new app)
3. Feature pattern → patterns/client/feature-development-pattern.md
4. UI components → patterns/client/ui-components-pattern.md
5. State (if complex) → patterns/client/modular-zustand-store-pattern.md
6. Prototypes → conventions/development-artifacts.md (scratch/)
```

### Understanding Existing Code
```
1. Quick overview → start/understanding-codebase.md (10 min)
2. Client details → overview/client/client-overview.md
3. Server details → overview/server/server-overview.md
4. Testing → overview/server/testing-strategy.md
```

## 📋 Complete Document Index

### Foundations (Read First)
1. **[New Feature Guide](./start/new-feature.md)** - Task-focused feature building
2. **[Testing Guide](./start/testing.md)** - Testing approach and patterns
3. **[Understanding Guide](./start/understanding-codebase.md)** - Navigate the codebase
4. [Client Overview](./overview/client/client-overview.md) - Product application architecture
5. [Server Overview](./overview/server/server-overview.md) - Layered architecture
6. [Website Overview](./overview/website/website-overview.md) - Marketing site architecture
7. [Feature Namespaces](./conventions/features-namespaces.md) - Naming conventions

### Client Development
**Essential:**
- [Feature Development Pattern](./patterns/client/feature-development-pattern.md)
- [UI Components Pattern](./patterns/client/ui-components-pattern.md)
- **[Modular App Architecture](./overview/client/apps/README.md)** - Multi-app system ⭐ NEW
- **[Path Alias System](./overview/client/apps/alias-system.md)** - Import conventions (`$`, `@`, `#app`) ⭐ NEW

**Advanced:**
- [Modular Zustand Store Pattern](./patterns/client/modular-zustand-store-pattern.md)
- [Platform Events System](./overview/client/platform-events-system.md)
- [Debug Logging](./overview/client/debug-logging.md)

**Patterns:**
- **[App Template](./patterns/client/client-app.md)** - Creating new modular apps ⭐ NEW

### Server Development
**Start Here:**
- [Server Quick Reference](./patterns/server/server-quick-reference.md) ⭐

**Core Patterns:**
- [Server Architecture Patterns](./patterns/server/server-architecture-patterns.md)
- **[Database Architecture](./patterns/server/database-architecture.md)** - Control vs data plane ⭐ NEW
- **[RLS Patterns](./patterns/server/rls-patterns.md)** - Multi-tenant security ⭐ NEW
- [Server Component Template](./patterns/server/server-component-template.md)
- [Mapper Patterns](./patterns/server/mapper-patterns.md)

**Testing:**
- [Testing Strategy](./overview/server/testing-strategy.md) - Philosophy
- [Testing Patterns](./patterns/server/testing-patterns.md) - Technical patterns
- [Database Testing Pattern](./patterns/server/database-testing-pattern.md) - Data.Mock

**Specialized:**
- [Pagination Patterns](./patterns/server/pagination-patterns.md)
- [Enumeration Classes Pattern](./patterns/server/enumeration-classes-pattern.md)

### Conventions
- [Development Artifacts](./conventions/development-artifacts.md) - File organization
- [Feature Namespaces](./conventions/features-namespaces.md) - Naming
- [Settings Naming Conventions](./conventions/settings-naming-conventions.md) - Config vs persisted settings
- [Filename Date Prefix](./conventions/filename-date-prefix.md) - Date prefixes
- [Message Guidelines](./conventions/message-guidelines.md) - User messages
- [Testing Conventions](./conventions/testing-conventions.md) - Test organization

## 🔍 Finding What You Need

### By Scenario

**"Where do I put this scratch file?"**  
→ [Development Artifacts](./conventions/development-artifacts.md)

**"How do I test this query?"**  
→ [Testing Guide](./start/testing.md) → [Database Testing Pattern](./patterns/server/database-testing-pattern.md)

**"How do I test this API endpoint?"**  
→ [Testing Guide](./start/testing.md) → [Testing Patterns](./patterns/server/testing-patterns.md)

**"What's the pattern for state management?"**  
→ [Modular Zustand Store Pattern](./patterns/client/modular-zustand-store-pattern.md)

**"How do I create a feature brief?"**  
→ [Brief Generation Workflow](./workflows/brief-generation.md)

**"How do I add a new CRUD feature?"**  
→ [New Feature Guide](./start/new-feature.md) → [Server Quick Reference](./patterns/server/server-quick-reference.md)

**"Which database should my entity go in?"**  
→ [Database Architecture](./patterns/server/database-architecture.md)

**"How do I enable RLS for AppDbContext?"**  
→ [Enabling RLS](./guides/server/enabling-rls.md)

**"How do I use multi-database RLS?"**  
→ [Multi-Database RLS Usage](./guides/server/multi-database-rls-usage.md)

**"How do I inject keyed services?"**  
→ [Keyed Services Injection Guide](./guides/server/keyed-services-injection-guide.md)

**"How do I replace a service with a mock in integration tests?"**  
→ [Overriding Services in Tests](./guides/server/overriding-services-in-tests.md)

**"Where do committed examples go?"**  
→ [Development Artifacts](./conventions/development-artifacts.md) → `examples/` directory

**"How do I build a UI component?"**  
→ [UI Components Pattern](./patterns/client/ui-components-pattern.md)

**"How do I create a new app?"**  
→ [Modular App Architecture](./overview/client/apps/README.md) → [App Template](./patterns/client/client-app.md)

**"What import alias should I use?"**  
→ [Path Alias System](./overview/client/apps/alias-system.md)

**"Should I use Settings or Options for my config class?"**  
→ [Settings Naming Conventions](./conventions/settings-naming-conventions.md)

**"How do I name database-persisted user settings?"**  
→ [Settings Naming Conventions](./conventions/settings-naming-conventions.md)

## Document Naming Conventions

Certain document types should include a date prefix in the format `yyyy-mm-dd_document_name.md`:

* **plans** - All planning documents should be prefixed with the creation date
* **design** - Some design documents that represent specific versions or iterations
* **ideation** - Brainstorming documents that are associated with different times in the project's lifecycle

This helps with chronological organization and makes it easier to track document evolution over time.

For detailed instructions on generating date prefixes (including guidance for AI models), see [Filename Date Prefix Instructions](./conventions/filename-date-prefix.md).

> These directories will often have client and server subdirectories.
