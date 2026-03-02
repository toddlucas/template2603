using Metalama.Framework.Aspects;

using Base2.Data;
using Base2.Data.Identity;

namespace Microsoft.AspNetCore.Mvc;

/// <summary>
/// Metalama aspect that automatically ensures read transactions are active before executing a method.
/// This aspect calls IRequestDbGuard.EnsureReadAsync() for each specified database context.
///
/// Usage:
/// [TenantRead]  // Defaults to AppDbContext
/// public async Task<IActionResult> GetUsers() { ... }
///
/// [TenantRead(nameof(AppDbContext))]  // Uses AppDbContext
/// public async Task<IActionResult> GetContacts() { ... }
///
/// [TenantRead(nameof(AppDbContext), nameof(AppDbContext))]  // Uses both
/// public async Task<IActionResult> GetContactWithOwner() { ... }
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class TenantReadAttribute : OverrideMethodAspect
{
    private readonly string[] _databaseKeys;

    /// <summary>
    /// Initializes a new instance of the <see cref="TenantReadAttribute"/> class.
    /// </summary>
    /// <param name="databaseKeys">
    /// The database context type names (e.g., nameof(AppDbContext), nameof(AppDbContext)).
    /// Defaults to "AppDbContext" if not specified.
    /// </param>
    public TenantReadAttribute(params string[] databaseKeys)
    {
        _databaseKeys = databaseKeys.Length > 0 ? databaseKeys : new[] { "AppDbContext" };
    }

    /// <summary>
    /// Overrides the method to ensure read transactions are active before execution.
    /// </summary>
    public override dynamic? OverrideMethod()
    {
        // Ensure read transaction for each specified database
        foreach (var key in _databaseKeys)
        {
            var guard = AmbientRequestGuard.Get(key);
            guard.EnsureReadAsync().GetAwaiter().GetResult();
        }

        // Execute the original method
        return meta.Proceed();
    }

    /// <summary>
    /// Overrides the method to ensure read transactions are active before execution.
    /// </summary>
    public override async Task<dynamic?> OverrideAsyncMethod()
    {
        // Ensure read transaction for each specified database
        foreach (var key in _databaseKeys)
        {
            var guard = AmbientRequestGuard.Get(key);
            await guard.EnsureReadAsync();
        }

        // Execute the original method
        return await meta.ProceedAsync();
    }
}
