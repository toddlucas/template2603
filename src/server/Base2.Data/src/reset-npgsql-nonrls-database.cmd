psql -U postgres -a -c "DROP DATABASE IF EXISTS product_name"
rd /q /s ..\..\Base2.Data.Npgsql\src\Migrations\App
call add-npgsql-app-migration Initial
call update-npgsql-app-database
