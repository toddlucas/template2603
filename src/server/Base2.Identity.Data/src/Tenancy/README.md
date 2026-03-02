# Request Database Guard Pattern

This implementation provides automatic transaction management for multi-tenant database operations using the "read guard" pattern.

## Overview

The read guard pattern provides:
- **Lazy transaction creation** - Only starts transactions when actually needed
- **Read-only optimization** - Uses `SET TRANSACTION READ ONLY` for read operations
- **Automatic promotion** - Can switch from read to write transactions when needed
- **Tenant context integration** - Automatically sets tenant context for RLS policies

## Components

### IRequestDbGuard
The main interface for transaction management within a request scope.

### RequestDbGuard<TDb>
Implementation that manages read and write transactions for a specific DbContext type.

### TenantTransactionInterceptor
EF Core interceptor that sets the tenant context (`app.current_tenant`) on each transaction.

### WriteGuardInterceptor
EF Core interceptor that automatically promotes read transactions to write transactions when `SaveChanges` is called.

## Usage Examples

### Basic Read Operations

```csharp
public class InvoiceService
{
    private readonly AppDbContext _dbContext;
    private readonly IRequestDbGuard _guard;

    public InvoiceService(
        AppDbContext dbContext,
        [FromKeyedServices(nameof(AppDbContext))] IRequestDbGuard guard)
    {
        _dbContext = dbContext;
        _guard = guard;
    }

    public async Task<List<Invoice>> GetInvoicesAsync(CancellationToken cancellationToken = default)
    {
        // Automatically starts a read-only transaction with tenant context
        await _guard.EnsureReadAsync(cancellationToken);

        return await _dbContext.Invoices
            .Where(i => i.Amount > 100)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }
}
```

### Mixed Read/Write Operations

```csharp
public async Task<Invoice> UpdateInvoiceAsync(int id, InvoiceUpdateDto update, CancellationToken cancellationToken = default)
{
    // Start with read transaction
    await _guard.EnsureReadAsync(cancellationToken);

    var invoice = await _dbContext.Invoices
        .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

    if (invoice == null)
        return null;

    if (NeedsUpdate(invoice, update))
    {
        // Automatically promotes to write transaction
        await _guard.EnsureWriteAsync(cancellationToken);
        
        invoice.Status = update.Status;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    return invoice;
}
```

### Using Extension Methods

```csharp
public async Task<List<Invoice>> GetInvoicesWithExtensionsAsync(CancellationToken cancellationToken = default)
{
    return await _guard.QueryAsync(
        _dbContext,
        query => query.Where(i => i.Amount > 100),
        cancellationToken);
}

public async Task<Invoice?> GetInvoiceByIdAsync(int id, CancellationToken cancellationToken = default)
{
    return await _guard.QuerySingleAsync(
        _dbContext,
        query => query.Where(i => i.Id == id),
        cancellationToken);
}
```

### Controller Usage

```csharp
[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IRequestDbGuard _guard;

    public InvoicesController(
        AppDbContext dbContext,
        [FromKeyedServices(nameof(AppDbContext))] IRequestDbGuard guard)
    {
        _dbContext = dbContext;
        _guard = guard;
    }

    [HttpGet]
    public async Task<ActionResult<List<InvoiceDto>>> GetInvoices(CancellationToken cancellationToken = default)
    {
        await _guard.EnsureReadAsync(cancellationToken);

        var invoices = await _dbContext.Invoices
            .AsNoTracking()
            .Select(i => new InvoiceDto { Id = i.Id, Amount = i.Amount })
            .ToListAsync(cancellationToken);

        return Ok(invoices);
    }

    [HttpPost]
    public async Task<ActionResult<InvoiceDto>> CreateInvoice(CreateInvoiceDto dto, CancellationToken cancellationToken = default)
    {
        await _guard.EnsureWriteAsync(cancellationToken);

        var invoice = new Invoice { Amount = dto.Amount, Status = "Draft" };
        _dbContext.Invoices.Add(invoice);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, invoice);
    }
}
```

## Configuration

To enable the read guard pattern, add this to your `appsettings.json`:

```json
{
  "UseTenantInterceptor": true
}
```

The pattern is automatically registered when `AddDatabases()` is called in your `Program.cs`.

## How It Works

1. **Request Start**: The `IRequestDbGuard` is registered as scoped, so one instance per request
2. **First Read**: When `EnsureReadAsync()` is called, a read-only transaction is created
3. **Tenant Context**: The `TenantTransactionInterceptor` automatically sets `app.current_tenant` on the transaction
4. **Write Promotion**: If `SaveChanges` is called, the `WriteGuardInterceptor` promotes to a write transaction
5. **Request End**: The guard is disposed, committing any active transaction

## Benefits

- **Automatic tenant context** - No manual tenant ID passing needed
- **Optimized reads** - Read-only transactions are lightweight
- **Safe writes** - Automatic transaction promotion when needed
- **RLS integration** - Works seamlessly with PostgreSQL Row Level Security
- **Clean code** - Business logic stays focused on business concerns
