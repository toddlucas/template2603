EntityFramework Notes
=====================

### Install

You need to install the [.NET CLI] before managing your database.

#### Local

Change to your project root directory and run:

```
dotnet new tool-manifest
```

Then change to your data project directory and run:

```
dotnet tool install dotnet-ef
```

#### Global

Alternatively, you can install the global `ef` tool.

```
dotnet tool install --global dotnet-ef
```

#### Updating

When a tool update is required, run one of the following.

```console
dotnet tool update --global dotnet-ef
```

```console
dotnet tool update --local dotnet-ef
```

#### Install design tools

The design tools may need to be added to the startup project.

```
dotnet add package Microsoft.EntityFrameworkCore.Design
```

### Project setup

We use multiple database providers.
First, we use a scalable database for production.
Second, so we use Sqlite so we can rapidly iterate while developing locally.
Third, we can leverage Sqlite to write unit tests using the in-memory storage, which allows for quick test runs.

There are [two approaches][Migrations with Multiple Providers] to developing locally.

In this project, we'll use the multiple context type, with a base interface to allow for code sharing.

### Database

To create a migration:

```
cd src\Example\Data
dotnet ef migrations add InitialCreate --context MyContext --output-dir Migrations/Npgsql
dotnet ef migrations add InitialCreate --context MyContext --output-dir Migrations/Sqlite
```

To apply it, you can run:

```
dotnet ef database update
```

If there are multiple DbContexts, specify which to update with a `--context` argument.

```
dotnet ef database update --context MyContext
```

It may also be necessary to override appsettings to select a different provider.

```
dotnet ef database update --context MyContext -- MyProvider=Npgsql
```

#### Rolling back

```
dotnet ef database update PreviousMigration
dotnet ef migrations remove
```

#### Separate project

Additional steps are required to run the ef commands if you have your data context in a [separate class library project](https://garywoodfine.com/using-ef-core-in-a-separate-class-library-project/).
One [solution](https://stackoverflow.com/a/44434134/51558) is to run from the data project but reference the startup project.

```
cd MyProject.Data
dotnet ef migrations add Initial --startup-project ../MyProject.Web/
```

##### Parameterless constructor

Depending on how your startup project and DbContext load configuration, you may need a design time factory.

```csharp
public class MyContextFactory : IDesignTimeDbContextFactory<MyContext>
{
    public MyContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<MyContext>();
        optionsBuilder.UseNpgsql("Server=localhost;Database=mydb;User ID=postgres;Password=***;CommandTimeout=600");

        return new MyContext(optionsBuilder.Options);
    }
}
```

## Multiple Providers

We create two migrations within the same assembly by using two different DbContexts--one per provider.

## Multiple Providers with same DbContext

This requires using separate two assemblies to contain the migrations.

[//]: # (References)

[.NET CLI]: https://learn.microsoft.com/en-us/ef/core/cli/dotnet
[Migrations with Multiple Providers]: https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/providers
