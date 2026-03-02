@echo off
echo Adding RLS migration for PostgreSQL...

cd /d "%~dp0"
dotnet ef migrations add EnableRowLevelSecurity --context AppDbContext --project ../Base2.Data.Npgsql --startup-project ../../Base2.Web

echo Migration created. Please review and run update-database when ready.
pause
