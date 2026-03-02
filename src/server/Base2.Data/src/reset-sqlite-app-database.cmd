if exist ..\..\Base2.Web\src\base2.db copy /y ..\..\Base2.Web\src\base2.db ..\..\Base2.Web\src\base2.db.bak
del ..\..\Base2.Web\src\base2.db
rd /q /s ..\..\Base2.Data.Sqlite\src\Migrations\App
call add-sqlite-app-migration Initial
call update-sqlite-app-database
