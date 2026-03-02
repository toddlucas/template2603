psql -U postgres -a -c "DROP DATABASE IF EXISTS product_name"
psql -U postgres -a -c "DROP USER IF EXISTS product_name_user"
rd /q /s ..\..\Base2.Data.Npgsql\src\Migrations\App
call add-npgsql-app-migration Initial
call add-npgsql-app-migration EnableRowLevelSecurity

.\Scripts\replace-migration-methods.py --up .\Scripts\rls-app-up.txt --down .\Scripts\rls-app-down.txt --no-backup --file-pattern "..\..\Base2.Data.Npgsql\src\Migrations\App\*_EnableRowLevelSecurity.cs"

call update-npgsql-app-database
psql -U postgres -a -c "ALTER ROLE product_name_user WITH PASSWORD 'abc123'"
