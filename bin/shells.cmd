setlocal
set _PROMPT=Developer Command Prompt

REM Get the bin directory where this script is located
SET _BIN_DIR=%~dp0

REM Strip "bin\" from _BIN_DIR to get project root
REM Calculate _PROJ by removing trailing backslash from bin directory, 
REM then go up one more level 
FOR %%A IN ("%_BIN_DIR%.") DO SET _PROJ=%%~dpA
REM Remove trailing backslash
SET _PROJ=%_PROJ:~0,-1%

REM Calculate _ROOT by going up one level from _PROJ
FOR %%A IN ("%_PROJ%") DO SET _ROOT=%%~dpA
REM Remove trailing backslash
SET _ROOT=%_ROOT:~0,-1%

wt -p "%_PROMPT%" -d "%_ROOT%" --title "root" ^
    ; new-tab -p "%_PROMPT%" -d "%_PROJ%" --title "main" ^
    ; new-tab -p "%_PROMPT%" -d "%_PROJ%\src\client" --title "client" ^
    ; new-tab -p "%_PROMPT%" -d "%_PROJ%\src\client\app" --title "app" ^
    ; new-tab -p "%_PROMPT%" -d "%_PROJ%\src\client\web" --title "web" ^
    ; new-tab -p "%_PROMPT%" -d "%_PROJ%\src\client\web" --title "test" ^
    ; new-tab -p "%_PROMPT%" -d "%_PROJ%\src\server" --title "server" ^
    ; new-tab -p "%_PROMPT%" -d "%_PROJ%\src\server\Base2.Data\src" --title "data" ^
    ; new-tab -p "%_PROMPT%" -d "%_PROJ%\src\server\Base2.Web\src" --title "api"
