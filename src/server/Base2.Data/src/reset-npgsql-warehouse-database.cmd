psql -U postgres -a -c "DROP DATABASE IF EXISTS warehouse"
psql -U postgres -a -c "DROP USER IF EXISTS warehouse_user"
rd /q /s ..\..\Base2.Data.Npgsql\src\Migrations\Warehouse
call add-npgsql-warehouse-migration Initial
call add-npgsql-warehouse-migration EnableRowLevelSecurity

.\Scripts\replace-migration-methods.py --up .\Scripts\rls-warehouse-up.txt --down .\Scripts\rls-warehouse-down.txt --no-backup --file-pattern "..\..\Base2.Data.Npgsql\src\Migrations\Warehouse\*_EnableRowLevelSecurity.cs"

call update-npgsql-warehouse-database
psql -U postgres -a -c "ALTER ROLE warehouse_user WITH PASSWORD 'abc123'"
