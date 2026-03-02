using Metalama.Framework.Aspects;

using Base2.Data;
using Base2.Data.Identity;

namespace Microsoft.AspNetCore.Mvc;

/// <summary>
/// Metalama aspect that automatically ensures write transactions are active before executing a method.
/// This aspect calls IRequestDbGuard.EnsureWriteAsync() for each specified database context.
///
/// Usage:
/// [TenantWrite]  // Defaults to AppDbContext
/// public async Task<IActionResult> CreateUser() { ... }
///
/// [TenantWrite(nameof(AppDbContext))]  // Uses AppDbContext
/// public async Task<IActionResult> CreateContact() { ... }
///
/// [TenantWrite(nameof(AppDbContext), nameof(AppDbContext))]  // Uses both
/// public async Task<IActionResult> CreateContactWithUser() { ... }
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class TenantWriteAttribute : OverrideMethodAspect
{
    private readonly string[] _databaseKeys;

    /// <summary>
    /// Initializes a new instance of the <see cref="TenantWriteAttribute"/> class.
    /// </summary>
    /// <param name="databaseKeys">
    /// The database context type names (e.g., nameof(AppDbContext), nameof(AppDbContext)).
    /// Defaults to "AppDbContext" if not specified.
    /// </param>
    public TenantWriteAttribute(params string[] databaseKeys)
    {
        _databaseKeys = databaseKeys.Length > 0 ? databaseKeys : new[] { "AppDbContext" };
    }

    /// <summary>
    /// Overrides the method to ensure write transactions are active before execution.
    /// </summary>
    public override dynamic? OverrideMethod()
    {
        // Ensure write transaction for each specified database
        foreach (var key in _databaseKeys)
        {
            var guard = AmbientRequestGuard.Get(key);
            guard.EnsureWriteAsync().GetAwaiter().GetResult();
        }

        // Execute the original method
        return meta.Proceed();
    }

    /// <summary>
    /// Overrides the method to ensure write transactions are active before execution.
    /// </summary>
    public override async Task<dynamic?> OverrideAsyncMethod()
    {
        // Ensure write transaction for each specified database
        foreach (var key in _databaseKeys)
        {
            var guard = AmbientRequestGuard.Get(key);
            await guard.EnsureWriteAsync();
        }

        // Execute the original method
        return await meta.ProceedAsync();
    }
}
