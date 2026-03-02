# Server Overview

## Project Purpose

## Core Domain: Customer Engagement Platform

## Architecture Overview

The server follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────┐
│   Web Layer     │  Controllers, API endpoints, HTTP concerns
├─────────────────┤
│ Services Layer  │  Business logic, orchestration, validation
├─────────────────┤
│   Data Layer    │  Entities, queries, database operations
├─────────────────┤
│ Contracts Layer │  Models, DTOs, shared interfaces
└─────────────────┘
```

## Project Structure

### **Core Applications**

#### **Base2.Web** (Main API)
- **Purpose**: Primary REST API for customer engagement platform
- **Port**: 8181 (development)
- **Features**: Authentication, vocabulary endpoints, learning progress
- **Key Controllers**: `OrganizationController`, (TBD)
- **Database**: SQLite (dev) / PostgreSQL (production)

#### **Base2.Background** (Background Processing)
- **Purpose**: Background job processing with Hangfire
- **Features**: Scheduled tasks, async processing, job monitoring
- **Dashboard**: http://localhost:8181/hangfire

### **Supporting Libraries**

#### **Base2.Contracts** (Data Models)
- **Purpose**: Shared data transfer objects and contracts
- **Contains**: Domain models, user models, pagination, enumerations
- **Key Models**: TBD

#### **Base2.Data** (Data Access)
- **Purpose**: Database entities, queries, and data access logic
- **Features**: Multi-provider support (SQLite/PostgreSQL), RLS policies, migrations
- **Key Components**: `AppDbContext`, `WarehouseDbContext`, query classes, mappers

#### **Base2.Services** (Business Logic)
- **Purpose**: Business logic, orchestration, and domain operations
- **Contains**: Service classes, business rules, validation logic

#### **Base2.Common** (Shared Utilities)
- **Purpose**: Common utilities and shared functionality
- **Contains**: Pagination, HTTP helpers, enumerations

### **Identity & Access Management**

#### **Base2.Core.Identity.Data** & **Base2.Core.Identity.Web**
- **Purpose**: Multi-tenant identity and access management
- **Features**: User authentication, role-based authorization, tenant isolation
- **Integration**: ASP.NET Core Identity with custom tenant support

## Key Features

### **Vocabulary Management**
- **Lemma Management**: CRUD operations for vocabulary entries
- **Language Pairs**: Support for multiple source/target language combinations
- **Frequency Ranking**: Words ordered by usage frequency
- **Search & Discovery**: Text-based search and exploration

### **Learning System**
- **Progress Tracking**: User-specific learning progress
- **Next Words**: Algorithmic selection of words to learn next
- **Explorer Feature**: Interactive vocabulary exploration
- **Meaning Relationships**: Translation mappings between languages

### **Technical Features**
- **Multi-tenant Architecture**: Tenant isolation for organizations
- **Rate Limiting**: API protection with configurable limits
- **CORS Support**: Cross-origin requests for web clients
- **OpenAPI Documentation**: Auto-generated API documentation
- **Background Processing**: Async job processing with Hangfire

## Database Architecture

### Two-Database Pattern: Control Plane vs Data Plane

The server uses **two separate database contexts** with distinct responsibilities:

#### **AppDbContext** - Control Plane (Infrastructure Layer)

**Purpose**: Multi-tenant foundation, access control, and system configuration

**Contains**:
- **Identity**: Users, authentication, roles, permissions
- **Tenancy**: Tenants, organizations, groups (reseller model)
- **Access Control**: Organization members, RBAC

**Characteristics**:
- ✅ Small, stable schema (changes infrequently)
- ✅ RLS-enabled for tenant isolation via `IRequestDbGuard`
- ✅ Extends `TenantIdentityDbContext` for ASP.NET Identity integration
- ✅ Multi-tenant with `tenant_id` on all tables
- ✅ Critical infrastructure - high availability requirements

**Current Entities**:
```
Identity:        Users, Roles, Tenants, Groups
Access:          Organizations, OrganizationMembers, People
```

#### **WarehouseDbContext** - Data Plane (Domain Layer)

**Purpose**: Sales engagement business logic and customer operational data

**Planned Contents**:
- **Prospecting**: Contacts, Accounts, Deals
- **Orchestration**: Sequences, Campaigns, Steps, Templates
- **Communication**: EmailMessages, Calls, Tasks
- **Interaction**: Conversations, Replies
- **Analytics**: Activities, Events, Metrics
- **Discovery**: AIResearch, Enrichment data

**Characteristics**:
- ✅ Large, evolving schema (changes frequently with new features)
- 🔮 Will have RLS for tenant isolation (planned)
- ✅ References control plane entities via foreign keys
- ✅ Domain-specific business logic
- 🔮 Future: May migrate to schema-per-tenant for horizontal scaling

**Status**: Currently mostly empty, to be populated with domain entities

#### Cross-Database Relationships

Data plane entities reference control plane via foreign keys:

```
Warehouse (OLAP)                App (OLTP)
──────────────────              ─────────────────────────
Contact.TenantId           →    Tenant.Id
Contact.OrganizationId     →    Organization.Id
Contact.OwnerId            →    User.Id

Sequence.TenantId          →    Tenant.Id
Sequence.CreatedBy         →    User.Id
```

**Implementation**: References are by ID only. Application code performs joins at service layer.

#### Why Two Databases?

| Aspect | Control Plane (App) | Data Plane (Warehouse) |
|--------|---------------------------|---------------------|
| **Purpose** | Who can access what? | What are they working on? |
| **Change Frequency** | Infrequent (stable) | Frequent (evolving) |
| **Size** | Small (thousands) | Large (millions+) |
| **Scaling** | Vertical | Horizontal (future: schema-per-tenant) |
| **Backup** | Daily | Continuous |
| **Deployment** | Careful, coordinated | Independent, frequent |

**Benefits**:
1. **Scalability**: Data plane can scale independently
2. **Deployment Independence**: Deploy domain changes without touching infrastructure
3. **Security**: Separate security policies for infrastructure vs customer data
4. **Performance**: Optimize each database for its access patterns
5. **Future-Proof**: Easier to migrate data plane to schema-per-tenant

**See**: [Database Architecture](../../patterns/server/database-architecture.md) for detailed implementation guidance

## Database Strategy

### Multi-Provider Support
- **Development**: SQLite for rapid iteration
- **Production**: PostgreSQL for scalability
- **Testing**: In-memory SQLite for unit tests

### Row-Level Security (RLS)
- **App (OLTP)**: ✅ Full RLS support via `IRequestDbGuard`
- **Warehouse (OLAP)**: 🔮 RLS support planned
- Tenant-based data isolation enforced at database level
- No manual `WHERE tenant_id = @tenantId` in application code

**See**: [RLS Patterns](../../patterns/server/rls-patterns.md) for detailed RLS implementation

## Development Workflow

### **Local Development**
1. **API Server**: `Base2.Web` runs on port 8181
2. **Client Apps**: Connect to API via CORS
3. **Database**: SQLite for local development
4. **Background Jobs**: Hangfire dashboard for monitoring

### **Data Management**
- **Migrations**: EF Core migrations for schema changes
- **Background Tasks**: `Base2.Background` for async processing

## API Endpoints

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user info

### **Administration**
- `GET /hangfire` - Background job dashboard
- `GET /scalar/v1` - API documentation
- `GET /openapi/v1.json` - OpenAPI specification
