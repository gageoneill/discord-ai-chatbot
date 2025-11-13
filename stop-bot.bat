@echo off
echo Stopping Discord bot...

REM Kill all node.exe processes
taskkill /F /IM node.exe 2>NUL

if "%ERRORLEVEL%"=="0" (
    echo Bot stopped successfully!
) else (
    echo No bot instances were running.
)

pause
