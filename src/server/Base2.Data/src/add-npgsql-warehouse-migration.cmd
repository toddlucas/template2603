dotnet ef migrations add %1 --context WarehouseDbContext --project ..\..\Base2.Data.Npgsql\src --output-dir Migrations\Warehouse --startup-project ..\..\Base2.Web\src -- WarehouseDbProvider=Npgsql
