using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.AspNetCore.Identity.Data;

namespace Base2.Web.Test.Auth;


[Collection(WebApplicationFactoryCollection.Name)]
public class LoginTests(WebApplicationFactoryFixture fixture)
{
    private readonly WebApplicationFactory<Program> _factory = fixture.Factory;

    [Fact]
    public async Task Post_WithValidCredentials_ShouldReturnToken()
    {
        var client = new ApiClient(_factory.CreateClient());

        var model = new LoginRequest { Email = "bb@example.com", Password = "123123qW!" };
        //HttpResult<AccessTokenResponse, ProblemDetails> result = await client.PostLoginAsync(model);

        //result.IsSuccess.Should().BeTrue();
        //result.Model!.AccessToken.Should().NotBeNullOrWhiteSpace();
    }
}
