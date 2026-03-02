dotnet ef migrations add %1 --context AppDbContext --project ..\..\Base2.Data.Npgsql\src --output-dir Migrations\App --startup-project ..\..\Base2.Web\src -- AppDbProvider=Npgsql
