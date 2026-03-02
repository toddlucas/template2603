# RLS Essentials

> **Module**: Patterns / Server  
> **Domain**: Multi-tenancy  
> **Token target**: 200-300

## Purpose

Essential RLS setup for new features. Minimal, actionable steps.

## Content to Include

### Requirements Checklist

1. **Entity has TenantId**
   ```csharp
   public Guid TenantId { get; set; }
   ```

2. **Service sets TenantId on create**
   ```csharp
   record.TenantId = tenantId;  // Passed from controller
   ```

3. **Controller uses RLS attributes**
   ```csharp
   [TenantRead]   // GET operations
   [TenantWrite]  // POST, PUT, DELETE
   ```

4. **Table registered for RLS policy**
   ```csharp
   // In RlsPolicyManager.cs
   public static readonly string[] TablesWithTenantOnly = 
   [
       // existing tables...
       "{entity}",
   ];
   ```

### Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| Controller | Call `[TenantRead]`/`[TenantWrite]` to set RLS context |
| Service | Set `TenantId` on new entities |
| Query | No tenant filtering—RLS handles it |
| Database | PostgreSQL RLS policy filters all queries |

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Empty results | TenantId not set on entity | Check service sets it |
| Wrong tenant data | RLS attribute missing | Add `[TenantRead]`/`[TenantWrite]` |
| Permission denied | Using wrong attribute | Use `[TenantWrite]` for mutations |

## Backlink

- [RLS Patterns](../../../patterns/server/rls-patterns.md) - Full RLS documentation, advanced patterns
