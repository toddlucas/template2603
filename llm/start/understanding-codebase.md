# Understanding the Codebase - Start Here

## Project Structure Overview

The workspace contains three main code projects:

1. **Product Application** (`MAIN/`)
   - Backend API (.NET)
   - Web Client (React + Vite)
   - Admin Client (React + Vite)

2. **Marketing Website** (`website/src/site/`)
   - Next.js site for public-facing marketing
   - Separate tech stack from product

3. **Documentation** (`llm/`)
   - Product requirements, patterns, guides
   - This documentation hub

## Quick Start: 10-Minute Overview

Read these documents for a solid foundation:

1. **[Client Overview](../overview/client/client-overview.md)** (5 min) - React, Zustand, shadcn/ui, DI, project structure
2. **[Server Overview](../overview/server/server-overview.md)** (5 min) - Layered architecture, projects, database strategy
3. **[Website Overview](../overview/website/website-overview.md)** (2 min) - Next.js marketing site
4. **[Feature Namespaces](../conventions/features-namespaces.md)** (2 min) - Naming conventions

After this, you'll know:
- How the client is organized (features, platform, components)
- How the server is layered (Web → Services → Data → Contracts)
- How the website differs from the product application
- What namespaces mean (Prospecting, Orchestration, etc.)

## Finding Your Way Around

### I Need to Work on the Website

**📖 [Website Overview](../overview/website/website-overview.md)**

**What is it?**
- Next.js 16 marketing site
- Located in `website/src/site/`
- Separate from the product's React client

**Key differences from Product Client**:
- Next.js (SSR/SSG) vs Vite (SPA)
- Marketing content vs application features
- Public-facing vs authenticated users
- File-based routing vs React Router

**Tech Stack**:
- Next.js 16.1.1 with App Router
- React 19.2.3
- Tailwind CSS 4
- MDX for content

### I Need to Modify Client Code

#### React Components
**📖 [UI Components Pattern](../patterns/client/ui-components-pattern.md)**

**Where are components?**
```
common/src/
├── components/           # Shared general components
│   └── ui/              # shadcn/ui components
├── features/            # Feature-specific components
│   ├── auth/components/
│   └── contacts/components/
```

**Key principle**: Encapsulate complex Tailwind patterns (5+ classes) in reusable components.

**Common components**:
- Button, Input, Card, Badge → `$/components/ui/`
- Custom shared → `$/components/`
- Feature-specific → `$/features/*/components/`

#### State Management
**📖 [Modular Zustand Store Pattern](../patterns/client/modular-zustand-store-pattern.md)**

**Where are stores?**
```
common/src/features/*/stores/
├── types.ts          # Type definitions
├── selectors.ts      # State selectors
├── actions.ts        # Business logic
└── *Store.ts         # Main store
```

**How to use**:
```tsx
import { useCoreStore, selectData } from '$/features/core/stores';

const data = useCoreStore(selectData);
const { fetchData } = useCoreStore();
```

#### Feature Structure
**📖 [Feature Development Pattern](../patterns/client/feature-development-pattern.md)**

**Standard feature layout**:
```
features/my-feature/
├── api/              # API client
├── components/       # UI components
├── stores/           # State management
├── views/            # Pages
├── services/         # Business logic
└── di/               # DI registration
```

### I Need to Modify Server Code

#### Finding the Right Layer

**Use this decision tree:**
```
What are you modifying?
├─ HTTP/API concerns? → Web Layer (Controllers)
├─ Business logic? → Services Layer
├─ Database queries? → Data Layer (Queries)
├─ DTOs/Models? → Contracts Layer
└─ Not sure? → Read Server Architecture Patterns
```

**📖 [Server Architecture Patterns](../patterns/server/server-architecture-patterns.md)**

#### Controllers (Web Layer)
**Location**: `Base2.Web/src/Controllers/{Namespace}/`

**Purpose**: HTTP endpoints, routing, authorization

**Example**: `OrganizationController.cs`
```csharp
[Route("api/[area]/[controller]")]
[Area(nameof(Access))]
[ApiController]
public class OrganizationController(OrganizationService service) : ControllerBase
{
    [HttpGet("{id:long}")]
    public async Task<ActionResult> Get(long id) { ... }
}
```

#### Services (Services Layer)
**Location**: `Base2.Services/src/{Namespace}/`

**Purpose**: Business logic, orchestration, validation

**Example**: `OrganizationService.cs`
```csharp
public class OrganizationService(WarehouseDbContext db, ILogger logger)
{
    public async Task<OrganizationModel?> ReadOrDefaultAsync(long id) { ... }
    public async Task<OrganizationModel> CreateAsync(OrganizationModel model) { ... }
}
```

#### Queries (Data Layer)
**Location**: `Base2.Data/src/{Namespace}/`

**Purpose**: Database queries, data access

**Example**: `OrganizationQuery.cs`
```csharp
public record OrganizationQuery(DbSet<Organization> DbSet, ILogger logger)
{
    public Task<Organization?> SingleOrDefaultAsync(long id) { ... }
    public Task<Organization[]> ListAsync() { ... }
}
```

#### Models (Contracts Layer)
**Location**: `Base2.Contracts/src/{Namespace}/`

**Purpose**: DTOs, data transfer objects

**Example**: `OrganizationModel.cs`
```csharp
public class OrganizationModel
{
    public long Id { get; set; }
    public string Name { get; set; } = null!;
}

public class OrganizationDetailModel : OrganizationModel, ITemporal
{
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### I Need to Understand the Tests

**📖 [Testing Strategy](../overview/server/testing-strategy.md)** (5 min read)

**Test organization**:
```
MyProject/
├── src/              # Production code
└── test/             # Tests alongside src
    ├── Unit tests    # Services, utilities
    ├── Data tests    # Queries (uses Data.Mock)
    └── Integration   # Controllers (WebApplicationFactory)
```

**Key patterns**:
- Unit tests mock dependencies
- Data tests use `TestDbContextContainer` (fast SQLite)
- Integration tests use `WebApplicationFactory` (real HTTP)

**📖 [Database Testing Pattern](../patterns/server/database-testing-pattern.md)** for data layer tests

## Common Code Patterns

### Server: Standard CRUD Flow

1. **Request arrives** → Controller
2. **Controller calls** → Service
3. **Service uses** → Query (read) or DbSet (write)
4. **Mapper converts** → Entity ↔ Model
5. **Response returns** → Model to client

**Example flow**:
```
GET /api/access/organization/1
  ↓
OrganizationController.Get(1)
  ↓
OrganizationService.ReadDetailOrDefaultAsync(1)
  ↓
OrganizationQuery.SingleDetailOrDefaultAsync(1)
  ↓
Organization entity from database
  ↓
OrganizationMapper.ToDetailModel()
  ↓
OrganizationDetailModel (JSON response)
```

### Client: Standard Feature Flow

1. **User interacts** → Component
2. **Component calls** → Service (via DI)
3. **Service calls** → API client
4. **Service updates** → Store (Zustand)
5. **Store notifies** → Components (re-render)

**Example flow**:
```
User clicks "Add Contact"
  ↓
ContactForm.onSubmit()
  ↓
ContactService.createContact(model)
  ↓
ContactApi.post('/api/contacts', model)
  ↓
useContactStore.addContact(newContact)
  ↓
ContactList re-renders with new contact
```

## Key Files to Know

### Client

**Entry points**:
- `common/src/main.tsx` - Main app entry
- `common/src/App.tsx` - Root component
- `common/src/routes/index.tsx` - Routing configuration

**Platform**:
- `common/src/platform/di/container.ts` - DI container setup
- `common/src/platform/config/` - Configuration management
- `common/src/platform/logging/` - Logging system

**Configuration**:
- `common/vite.config.ts` - Build configuration
- `common/tailwind.config.ts` - Tailwind CSS config
- `common/components.json` - shadcn/ui config

### Server

**Entry points**:
- `Base2.Web/src/Program.cs` - Application startup
- `Base2.Web/src/Startup.cs` - Service configuration

**Database**:
- `Base2.Data/src/AppDbContext.cs` - App context
- `Base2.Data/src/WarehouseDbContext.cs` - Warehouse context
- `Base2.Data/src/Migrations/` - EF migrations

**Configuration**:
- `Base2.Web/src/appsettings.json` - App settings
- `Base2.Web/src/appsettings.Development.json` - Dev overrides

## Navigating by Feature

### Authentication (Auth)

**Client**: `common/src/features/auth/`
- Login/register flows
- Session management
- Account settings

**Server**: `Base2.Core.Identity.Web/`
- Identity management
- JWT tokens
- User authentication

### Dashboard

**Client**: `common/src/features/frame/`
- Main dashboard view
- Sidebar navigation
- Breadcrumbs

**Server**: No specific namespace (UI-driven)

## Understanding Conventions

### Naming Patterns

**📖 [Feature Namespaces](../conventions/features-namespaces.md)**

Common namespaces:
- **Prospecting** - Contacts, accounts, deals
- **Orchestration** - Campaigns, sequences, templates
- **Communication** - Emails, calls, messages
- **Access** - Users, organizations, permissions

### File Organization

**📖 [Development Artifacts](../conventions/development-artifacts.md)**

**Production code**: `src/`
**Examples**: `examples/` (committed)
**Prototypes**: `scratch/` (gitignored)
**Notes**: `.notes/` (committed)

### Type Aliases (Server)

Common pattern in server code:
```csharp
using Record = Organization;    // Database entity
using Model = OrganizationModel;    // Basic DTO
using DetailModel = OrganizationDetailModel; // Detailed DTO
```

This makes code more readable when working with mappers and services.

## Debugging Tips

### Client Debugging

**Development tools**:
- React DevTools (browser extension)
- Zustand DevTools (included in dev mode)
- Vite HMR (hot module replacement)

**Logging**:
```tsx
import { Logger } from '$/platform/logging';

const logger = new Logger('MyComponent');
logger.debug('Debug message');
logger.info('Info message');
```

**📖 [Debug Logging](../overview/client/debug-logging.md)**

### Server Debugging

**Development tools**:
- Visual Studio / Rider debugger
- Hangfire dashboard (`/hangfire`)
- OpenAPI docs (`/scalar/v1`)

**Logging**:
```csharp
_logger.LogInformation("Created {entityName} {EntityId}.", "Organization", id);
_logger.LogWarning("Failed to find {entityName} {EntityId}.", "Organization", id);
```

## Quick Reference Links

### When You Need To...

**Add a UI component**:
→ [UI Components Pattern](../patterns/client/ui-components-pattern.md)

**Write a test**:
→ [Testing Guide](./testing.md)

**Add a CRUD endpoint**:
→ [Server Quick Reference](../patterns/server/server-quick-reference.md)

**Understand mappers**:
→ [Mapper Patterns](../patterns/server/mapper-patterns.md)

**Add pagination**:
→ [Pagination Patterns](../patterns/server/pagination-patterns.md)

**Handle multi-tenancy/RLS**:
→ [RLS Patterns](../patterns/server/rls-patterns.md)

**Manage state**:
→ [Modular Zustand Store Pattern](../patterns/client/modular-zustand-store-pattern.md)

**Organize files**:
→ [Development Artifacts](../conventions/development-artifacts.md)

## What to Read Next

After understanding the basics:

**For client development**:
1. [Feature Development Pattern](../patterns/client/feature-development-pattern.md)
2. [UI Components Pattern](../patterns/client/ui-components-pattern.md)
3. [Modular Zustand Store Pattern](../patterns/client/modular-zustand-store-pattern.md)

**For server development**:
1. [Server Quick Reference](../patterns/server/server-quick-reference.md)
2. [Server Architecture Patterns](../patterns/server/server-architecture-patterns.md)
3. [Testing Strategy](../overview/server/testing-strategy.md)

**For both**:
1. [Development Artifacts](../conventions/development-artifacts.md)
2. [Feature Namespaces](../conventions/features-namespaces.md)

