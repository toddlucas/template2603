if exist ..\..\Base2.Web\src\warehouse.db copy /y ..\..\Base2.Web\src\warehouse.db ..\..\Base2.Web\src\warehouse.db.bak
del ..\..\Base2.Web\src\warehouse.db
rd /q /s ..\..\Base2.Data.Sqlite\src\Migrations\Warehouse
call add-sqlite-warehouse-migration Initial
call update-sqlite-warehouse-database
