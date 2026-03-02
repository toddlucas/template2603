using System.Security.Claims;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Base2.Identity;
using Base2.Data.Identity;

#pragma warning disable IDE0130 // Namespace does not match folder structure
namespace Microsoft.AspNetCore.Builder;
#pragma warning restore IDE0130 // Namespace does not match folder structure

public class TenantContextOptions
{
    public bool UseDatabaseLookup { get; set; }
}

public class TenantContextMiddleware(RequestDelegate next, IOptions<TenantContextOptions> options)
{
    private readonly RequestDelegate _next = next;
    private readonly bool _useDatabaseLookup = options.Value.UseDatabaseLookup;

    public async Task InvokeAsync(HttpContext httpContext, ILogger<TenantContextMiddleware> logger, ITenantResolver tenantResolver, TenantContext<Guid> tenantContext)
    {
        if (!(httpContext.User.Identity?.IsAuthenticated == true))
        {
            await _next(httpContext);
            return;
        }

#if RESELLER
        Guid? groupId = httpContext.User.GetGroupIdOrDefault();

        tenantContext.CurrentGroupId = groupId ?? Guid.Empty; // REVIEW: This is nullable.
#endif
        Guid? tenantId = httpContext.User.GetTenantIdOrDefault();

        tenantContext.CurrentId = tenantId ?? Guid.Empty;
        tenantContext.UserTenantId = tenantId ?? Guid.Empty;

        if (_useDatabaseLookup)
        {
            var routeData = httpContext.GetRouteData();

            var subdomain = routeData.Values[RouteValueKey.Subdomain] as string;
            if (!string.IsNullOrWhiteSpace(subdomain))
            {
                // TODO: Implement read-through cache in memory or Redis.
                IdentityTenant<Guid>? tenant = await tenantResolver.GetTenantBySubdomainAsync(subdomain);
                if (tenant is not null)
                {
                    if (tenantId is not null &&
                        tenantId != tenant.Id)
                    {
                        logger.LogError("Subdomain tenant {SubdomainTenantId} is different than user tenant {UserTenantId}.", tenant.Id, tenantId);
                    }

                    tenantContext.CurrentId = tenant.Id;
                    tenantContext.SubdomainTenantId = tenant.Id;
                    tenantContext.Subdomain = subdomain;
                }
            }

            var hostname = routeData.Values[RouteValueKey.Hostname] as string;
            if (!string.IsNullOrWhiteSpace(hostname))
            {
                IdentityTenant<Guid>? tenant = await tenantResolver.GetTenantByDomainAsync(hostname);
                if (tenant is not null)
                {
                    if (tenantId is not null &&
                        tenantId != tenant.Id)
                    {
                        logger.LogError("Hostname tenant {HostnameTenantId} is different than user tenant {UserTenantId}.", tenant.Id, tenantId);
                    }

                    tenantContext.CurrentId = tenant.Id;
                    tenantContext.HostnameTenantId = tenant.Id;
                    tenantContext.Hostname = hostname;
                }
            }
        }

        await _next(httpContext);
    }
}

public static class TenantContextMiddlewareExtensions
{
    /// <summary>
    /// Adds services required for host routing.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/> to add the services to.</param>
    /// <returns>The <see cref="IServiceCollection"/> so that additional calls can be chained.</returns>
    public static IServiceCollection AddTenantContext(this IServiceCollection services)
    {
        // services.TryAddEnumerable(ServiceDescriptor.Singleton<IConfigureOptions<RouteOptions>, RegexInlineRouteConstraintSetup>());
        return services;
    }

    /// <summary>
    /// Adds services required for host routing.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection"/> to add the services to.</param>
    /// <param name="configureOptions">The host route options to configure the middleware with.</param>
    /// <returns>The <see cref="IServiceCollection"/> so that additional calls can be chained.</returns>
    public static IServiceCollection AddTenantContext(
        this IServiceCollection services,
        Action<TenantContextOptions> configureOptions)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configureOptions);

        services.Configure(configureOptions);
        services.AddTenantContext();

        return services;
    }

    /// <summary>
    /// Adds tenant context middleware.
    /// </summary>
    /// <param name="builder"></param>
    /// <returns></returns>
    /// <remarks>Call after UseAuthentication.</remarks>
    public static IApplicationBuilder UseTenantContextMiddleware(
        this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<TenantContextMiddleware>(Options.Create(new TenantContextOptions { UseDatabaseLookup = true }));
    }
}
