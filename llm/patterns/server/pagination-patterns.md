# Pagination Patterns

## Overview

This document outlines the established pagination patterns used throughout the Lexy server architecture. These patterns provide consistent, efficient, and flexible pagination for large datasets while maintaining good performance and user experience.

## Core Components

### 1. Pagination Models

#### PagedQuery
```csharp
public class PagedQuery
{
    public int Page { get; set; }           // 1-based page number (must be >= 1)
    public int? Limit { get; set; }         // Number of items to return (default is per-endpoint)
    public string? Cursor { get; set; }     // Cursor for cursor-based pagination
    public string? Search { get; set; }     // Search term(s)
    public string[]? Column { get; set; }   // Column(s) for ordering
    public string[]? Direction { get; set; } // Direction(s) for ordering (ASC/DESC)
}
```

#### PagedResult
```csharp
public record PagedResult<T, C>(
    IReadOnlyCollection<T> Items,    // The paginated items
    int Count,                       // Total count of items
    C Next)                         // Next cursor (if applicable)
{
}

public class PagedResult
{
    public static PagedResult<T, C> Create<T, C>(IReadOnlyCollection<T> items, int count, C next)
        => new(items, count, next);
}
```

### 2. Pagination Extensions

#### IQueryableExtensions
```csharp
public static IOrderedQueryable<T> OrderByPage<T>(this IQueryable<T> queryable, PagedQuery query, string defaultOrderBy)
{
    string orderByColumnName = defaultOrderBy;
    if (query.Column != null && query.Column.Length > 0)
    {
        orderByColumnName = query.Column[0];
        
        if (query.Direction?.Length > 0)
        {
            string direction = query.Direction[0].ToUpper() switch
            {
                "DESC" => "descending",
                "ASC" => "ascending",
                _ => throw new Exception($"Invalid query direction {query.Direction[0]}")
            };
            orderByColumnName += " " + direction;
        }
    }
    
    return queryable.OrderBy(orderByColumnName);
}
```

#### PagedQueryExtensions
```csharp
public static IQueryable<T> Paginate<T>(this IOrderedQueryable<T> queryable, PagedQuery query, out int count, int max = DefaultQueryMax)
{
    count = queryable.Count();
    
    if (query == null) return queryable;
    
    int limit = query.Limit ?? DefaultQueryLimit;
    int take = limit;
    if (max != NoQueryLimit)
    {
        take = Math.Min(limit, max);
    }
    
    var modifiedQuery = queryable.Skip(query.Page * limit);
    modifiedQuery = modifiedQuery.Take(take);
    
    return modifiedQuery;
}

public static void Search(this PagedQuery query, Action<string> addTerm, int limit = DefaultSearchTermLimit)
{
    if (!string.IsNullOrWhiteSpace(query.Search))
    {
        string[] terms = query.Search
            .ToLower(CultureInfo.CurrentCulture)
            .Split(' ')
            .Select(s => s.Trim())
            .Where(s => !string.IsNullOrEmpty(s))
            .ToArray();
            
        foreach (string term in terms)
        {
            if (--limit < 0) break;
            addTerm(term);
        }
    }
}
```

## Implementation Patterns

### 1. Service Layer Pattern

#### Basic Paginated Service Method
```csharp
/// <summary>
/// Gets paginated entities ordered by rank.
/// </summary>
/// <param name="query">Pagination query parameters.</param>
/// <param name="cancellationToken">A cancellation token.</param>
/// <returns>A paginated result of entity models.</returns>
public async Task<PagedResult<Model, string?>> GetPagedAsync(PagedQuery query, CancellationToken cancellationToken = default)
{
    IQueryable<Record> queryable = _dbSet.AsQueryable();

    query.Search((term) =>
    {
        queryable = queryable
            .Where(e => e.Text.ToLower().Contains(term) ||
                       e.LanguageCodeId.ToLower().Contains(term));
    });

    Record[] records = await queryable
        .OrderByPage(query, nameof(Record.Rank))
        .Paginate(query, out int count)
        .ToArrayAsync(cancellationToken);

    return PagedResult.Create(records.ToModels(), count, (string?)null);
}
```

#### Filtered Paginated Service Method
```csharp
/// <summary>
/// Gets paginated entities by filter ordered by rank.
/// </summary>
/// <param name="query">Pagination query parameters.</param>
/// <param name="filterValue">The filter value.</param>
/// <param name="cancellationToken">A cancellation token.</param>
/// <returns>A paginated result of entity models for the specified filter.</returns>
public async Task<PagedResult<Model, string?>> GetPagedByFilterAsync(PagedQuery query, string filterValue, CancellationToken cancellationToken = default)
{
    IQueryable<Record> queryable = _dbSet
        .Where(e => e.FilterField == filterValue);

    query.Search((term) =>
    {
        queryable = queryable
            .Where(e => e.Text.ToLower().Contains(term));
    });

    Record[] records = await queryable
        .OrderByPage(query, nameof(Record.Rank))
        .Paginate(query, out int count)
        .ToArrayAsync(cancellationToken);

    return PagedResult.Create(records.ToModels(), count, (string?)null);
}
```

### 2. Controller Layer Pattern

#### Basic Paginated Controller Endpoint
```csharp
/// <summary>
/// Returns paginated entities ordered by rank.
/// </summary>
/// <param name="query">Pagination query parameters.</param>
/// <param name="cancellationToken">A cancellation token.</param>
/// <returns>A paginated result of entities.</returns>
[HttpGet]
[Produces(typeof(PagedResult<EntityModel, string?>))]
[EndpointDescription("Returns paginated entities ordered by rank.")]
public async Task<ActionResult> GetPaged(
    [FromQuery] PagedQuery query,
    CancellationToken cancellationToken = default)
{
    PagedResult<EntityModel, string?> result = await _entityService.GetPagedAsync(query, cancellationToken);
    return Ok(result);
}
```

#### Filtered Paginated Controller Endpoint
```csharp
/// <summary>
/// Returns paginated entities by filter ordered by rank.
/// </summary>
/// <param name="query">Pagination query parameters.</param>
/// <param name="filterValue">The filter value.</param>
/// <param name="cancellationToken">A cancellation token.</param>
/// <returns>A paginated result of entities for the specified filter.</returns>
[HttpGet("filter/{filterValue}")]
[Produces(typeof(PagedResult<EntityModel, string?>))]
[EndpointDescription("Returns paginated entities by filter ordered by rank.")]
public async Task<ActionResult> GetPagedByFilter(
    [FromQuery] PagedQuery query,
    string filterValue,
    CancellationToken cancellationToken = default)
{
    if (string.IsNullOrWhiteSpace(filterValue))
        return BadRequest("Filter value is required");

    PagedResult<EntityModel, string?> result = await _entityService.GetPagedByFilterAsync(query, filterValue, cancellationToken);
    return Ok(result);
}
```

## Search Patterns

### 1. Multi-Field Search
```csharp
query.Search((term) =>
{
    queryable = queryable
        .Where(e => e.Text.ToLower().Contains(term) ||
                   e.LanguageCodeId.ToLower().Contains(term) ||
                   e.PartOfSpeechId.ToLower().Contains(term));
});
```

### 2. Single-Field Search (Filtered Context)
```csharp
query.Search((term) =>
{
    queryable = queryable
        .Where(e => e.Text.ToLower().Contains(term));
});
```

### 3. Complex Search with Related Entities
```csharp
query.Search((term) =>
{
    queryable = queryable
        .Where(e => e.Text.ToLower().Contains(term) ||
                   e.RelatedEntity.Name.ToLower().Contains(term) ||
                   e.Category.Description.ToLower().Contains(term));
});
```

## Ordering Patterns

### 1. Default Ordering
```csharp
// Most common: Order by rank (frequency-based)
.OrderByPage(query, nameof(Record.Rank))

// Alternative: Order by creation date
.OrderByPage(query, nameof(Record.CreatedAt))

// Alternative: Order by name
.OrderByPage(query, nameof(Record.Name))
```

### 2. Custom Ordering
```csharp
// Allow custom ordering via query parameters
// GET /api/entities?column=Name&direction=DESC
// GET /api/entities?column=CreatedAt&direction=ASC
```

## Performance Considerations

### 1. Index Requirements
- **Search fields**: Ensure indexes on fields used in search (e.g., `Text`, `LanguageCodeId`)
- **Ordering fields**: Ensure indexes on fields used for ordering (e.g., `Rank`, `CreatedAt`)
- **Filter fields**: Ensure indexes on fields used for filtering (e.g., `LanguageCodeId`, `CategoryId`)

### 2. Query Optimization
```csharp
// Good: Use IQueryable for deferred execution
IQueryable<Record> queryable = _dbSet.AsQueryable();

// Good: Apply filters before search
IQueryable<Record> queryable = _dbSet
    .Where(e => e.LanguageCodeId == languageCode);

// Good: Count before pagination
Record[] records = await queryable
    .OrderByPage(query, nameof(Record.Rank))
    .Paginate(query, out int count)  // Count is calculated here
    .ToArrayAsync(cancellationToken);
```

### 3. Memory Management
```csharp
// Good: Use arrays for final results
Record[] records = await queryable.ToArrayAsync(cancellationToken);

// Good: Map to models efficiently
return PagedResult.Create(records.ToModels(), count, (string?)null);
```

## Common Patterns by Use Case

### 1. Vocabulary/Language Data
```csharp
// Pattern: Language-specific pagination with text search
public async Task<PagedResult<LemmaModel, string?>> GetPagedByLanguageAsync(PagedQuery query, string languageCodeId, CancellationToken cancellationToken = default)
{
    IQueryable<Lemma> queryable = _dbSet
        .Where(l => l.LanguageCodeId == languageCodeId);

    query.Search((term) =>
    {
        queryable = queryable
            .Where(l => l.Text.ToLower().Contains(term));
    });

    Lemma[] records = await queryable
        .OrderByPage(query, nameof(Lemma.Rank))
        .Paginate(query, out int count)
        .ToArrayAsync(cancellationToken);

    return PagedResult.Create(records.ToModels(), count, (string?)null);
}
```

### 2. User-Scoped Data
```csharp
// Pattern: User-scoped pagination with search
public async Task<PagedResult<ProjectModel, string?>> GetPagedByUserIdAsync(PagedQuery query, string userId, CancellationToken cancellationToken = default)
{
    IQueryable<Project> queryable = _dbSet
        .Where(p => p.UserId == userId);

    query.Search((term) =>
    {
        queryable = queryable
            .Where(p => p.Name.ToLower().Contains(term) ||
                       p.Description.ToLower().Contains(term));
    });

    Project[] records = await queryable
        .OrderByPage(query, nameof(Project.CreatedAt))
        .Paginate(query, out int count)
        .ToArrayAsync(cancellationToken);

    return PagedResult.Create(records.ToModels(), count, (string?)null);
}
```

### 3. Reference Data
```csharp
// Pattern: System-wide reference data pagination
public async Task<PagedResult<CategoryModel, string?>> GetPagedAsync(PagedQuery query, CancellationToken cancellationToken = default)
{
    IQueryable<Category> queryable = _dbSet.AsQueryable();

    query.Search((term) =>
    {
        queryable = queryable
            .Where(c => c.Name.ToLower().Contains(term) ||
                       c.Description.ToLower().Contains(term));
    });

    Category[] records = await queryable
        .OrderByPage(query, nameof(Category.Name))
        .Paginate(query, out int count)
        .ToArrayAsync(cancellationToken);

    return PagedResult.Create(records.ToModels(), count, (string?)null);
}
```

## API Usage Examples

### 1. Basic Pagination
```http
GET /api/vocabulary/lemma?limit=20&page=0
```

### 2. Search with Pagination
```http
GET /api/vocabulary/lemma?limit=20&page=0&search=run
```

### 3. Custom Ordering
```http
GET /api/vocabulary/lemma?limit=20&page=0&column=Text&direction=ASC
```

### 4. Filtered Pagination
```http
GET /api/vocabulary/lemma/language/en?limit=20&page=0&search=run
```

### 5. Complex Search
```http
GET /api/vocabulary/lexeme?limit=20&page=0&search=run verb&column=Rank&direction=ASC
```

## Response Format

### Success Response
```json
{
  "items": [
    {
      "id": 1,
      "text": "run",
      "languageCodeId": "en",
      "rank": 100
    }
  ],
  "count": 1500,
  "next": null
}
```

### Error Response
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "FilterValue": ["Filter value is required"]
  }
}
```

## Best Practices

### 1. Service Layer
- Always use `IQueryable` for deferred execution
- Apply filters before search to reduce dataset
- Use `out int count` parameter for efficient counting
- Map to models after pagination for memory efficiency

### 2. Controller Layer
- Validate required parameters before calling service
- Use appropriate HTTP status codes
- Include comprehensive XML documentation
- Use `[Produces]` attributes for OpenAPI documentation

### 3. Search Implementation
- Use case-insensitive search with `.ToLower()`
- Split search terms by spaces for multi-term search
- Limit search terms to prevent performance issues
- Apply search after filtering for better performance

### 4. Performance
- Ensure proper database indexes on search and ordering fields
- Use appropriate `Limit` values to prevent large result sets
- Consider cursor-based pagination for very large datasets
- Monitor query performance and optimize as needed

## Common Pitfalls

### 1. Memory Issues
```csharp
// Bad: Loading all data into memory
var allRecords = await _dbSet.ToListAsync();
int limit = query.Limit ?? DefaultQueryLimit;
var pagedRecords = allRecords.Skip(query.Page * limit).Take(limit);

// Good: Using IQueryable for deferred execution
var pagedRecords = await _dbSet
    .OrderByPage(query, nameof(Record.Rank))
    .Paginate(query, out int count)
    .ToArrayAsync(cancellationToken);
```

### 2. Inefficient Counting
```csharp
// Bad: Counting after pagination
int limit = query.Limit ?? DefaultQueryLimit;
var records = await queryable.Skip(query.Page * limit).Take(limit).ToArrayAsync();
var count = await queryable.CountAsync();

// Good: Counting before pagination
var records = await queryable
    .OrderByPage(query, nameof(Record.Rank))
    .Paginate(query, out int count)  // Count is calculated here
    .ToArrayAsync(cancellationToken);
```

### 3. Missing Indexes
```csharp
// Ensure database indexes on:
// - Search fields (Text, Name, Description)
// - Filter fields (LanguageCodeId, UserId, CategoryId)
// - Ordering fields (Rank, CreatedAt, Name)
```

## Migration from Simple Lists

### Before (Simple List)
```csharp
[HttpGet]
public async Task<ActionResult> List(CancellationToken cancellationToken)
{
    EntityModel[] results = await _entityService.ListAsync(cancellationToken);
    return Ok(results);
}
```

### After (Paginated)
```csharp
[HttpGet]
public async Task<ActionResult> GetPaged(
    [FromQuery] PagedQuery query,
    CancellationToken cancellationToken = default)
{
    PagedResult<EntityModel, string?> result = await _entityService.GetPagedAsync(query, cancellationToken);
    return Ok(result);
}
```

### Service Method Update
```csharp
// Add new paginated method
public async Task<PagedResult<Model, string?>> GetPagedAsync(PagedQuery query, CancellationToken cancellationToken = default)
{
    // Implementation as shown above
}

// Keep existing method for backward compatibility
public async Task<Model[]> ListAsync(CancellationToken cancellationToken = default)
{
    Record[] records = await _query.ListAsync(cancellationToken);
    return records.ToModels();
}
```

This pattern ensures backward compatibility while providing the benefits of pagination for new implementations.
