using Base2.Access;
using Base2.Data.Mock;
using Base2.Identity;

namespace Base2.Data.Test;

public class ExampleTest
{
    [Fact]
    public async Task AddPerson_ShouldSucceed()
    {
        using var container = new TestDbContextContainer();
        var services = await container.AddTestDbServicesAsync();

        using var scope = services.CreateScope();

        var appDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var profile = new Person() { TenantId = IdentitySeedData.TenantId, GivenName = "Jack", FamilyName = "Squat" };
        appDb.People.Add(profile);
        await appDb.SaveChangesAsync();

        profile.Id.Should().BeGreaterThan(0);
    }
}
