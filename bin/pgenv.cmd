rem @ECHO OFF
REM The script sets environment variables helpful for PostgreSQL

IF EXIST "C:\Program Files\PostgreSQL" SET "_PGDIR=C:\Program Files\PostgreSQL"
IF EXIST "C:\Program Files (x86)\PostgreSQL" SET "_PGDIR=C:\Program Files (x86)\PostgreSQL"

IF NOT EXIST "%_PGDIR%" (
    ECHO No PostgreSQL install found. Set _PGDIR in your developer environment and re-run this script.
    EXIT /B
)

IF EXIST "%_PGDIR%\8.3" SET _PGVER=8.3
IF EXIST "%_PGDIR%\8.4" SET _PGVER=8.4
IF EXIST "%_PGDIR%\9.0" SET _PGVER=9.0
IF EXIST "%_PGDIR%\9.1" SET _PGVER=9.1
IF EXIST "%_PGDIR%\9.2" SET _PGVER=9.2
IF EXIST "%_PGDIR%\9.3" SET _PGVER=9.3
IF EXIST "%_PGDIR%\9.4" SET _PGVER=9.4
IF EXIST "%_PGDIR%\9.5" SET _PGVER=9.5
IF EXIST "%_PGDIR%\9.6" SET _PGVER=9.6
IF EXIST "%_PGDIR%\10" SET _PGVER=10
IF EXIST "%_PGDIR%\11" SET _PGVER=11
IF EXIST "%_PGDIR%\12" SET _PGVER=12
IF EXIST "%_PGDIR%\13" SET _PGVER=13
IF EXIST "%_PGDIR%\14" SET _PGVER=14
IF EXIST "%_PGDIR%\15" SET _PGVER=15
IF EXIST "%_PGDIR%\16" SET _PGVER=16
IF EXIST "%_PGDIR%\17" SET _PGVER=17

IF "%_PGVER%" == "" (
    ECHO No matching PostgreSQL version found.
    ECHO Check _PGDIR in your developer environment and compare to versions in pgenv.cmd
    EXIT /B
)

REM Remove quotes in pg_env to avoid the "could not find..." error.
CALL "%_PGDIR%\%_PGVER%\pg_env.bat"

rem SET PATH=%_PGDIR%\%_PGVER%\bin;%PATH%
rem SET PGDATA=%_PGDIR%\%_PGVER%\data
rem SET PGDATABASE=postgres
rem SET PGUSER=postgres
rem SET PGPORT=5432
rem SET PGLOCALEDIR=%_PGDIR%\%_PGVER%\share\locale

SET _PGVER=
SET _PGDIR=
