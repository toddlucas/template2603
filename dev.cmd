@ECHO OFF
REM Get cwd and trim trailing backslash.
SET _PROJ_DIR=%~dp0
SET _PROJ_ROOT=%_PROJ_DIR:~0,-1%
SET _PROJ_BIN_DIR=%_PROJ_ROOT%\bin

IF EXIST "%_PROJ_ROOT%\dev-%USERNAME%.cmd" GOTO user
ECHO No developer environment file dev-%USERNAME%.cmd was found. Skipping.
GOTO sql

:user
CALL %_PROJ_ROOT%\dev-%USERNAME%.cmd

:sql
CALL %_PROJ_BIN_DIR%\pgenv.cmd

SET PATH=%_PROJ_BIN_DIR%;%PATH%
