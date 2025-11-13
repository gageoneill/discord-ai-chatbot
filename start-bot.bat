@echo off
REM Check if bot is already running
tasklist /FI "WINDOWTITLE eq Discord Bot - Local Llama" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo Bot is already running. Skipping startup.
    exit /B
)

REM Navigate to bot directory
cd /d "%~dp0"

REM Start the bot in a new window with a specific title
start "Discord Bot - Local Llama" cmd /k "npm start"

echo Bot started successfully!
