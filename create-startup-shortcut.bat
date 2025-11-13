@echo off
echo Creating startup shortcut for Discord bot...

REM Get the current directory
set "SCRIPT_DIR=%~dp0"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

REM Create a VBS script to make a shortcut (batch files can't create shortcuts directly)
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut.vbs"
echo sLinkFile = "%STARTUP_DIR%\Discord Llama Bot.lnk" >> "%TEMP%\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut.vbs"
echo oLink.TargetPath = "%SCRIPT_DIR%start-bot.bat" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WorkingDirectory = "%SCRIPT_DIR%" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Description = "Auto-start Discord Llama Bot" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WindowStyle = 7 >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut.vbs"

REM Run the VBS script
cscript //nologo "%TEMP%\CreateShortcut.vbs"

REM Clean up
del "%TEMP%\CreateShortcut.vbs"

echo.
echo Startup shortcut created successfully!
echo The bot will now auto-start when you log into Windows.
echo.
echo To disable auto-start, delete the shortcut from:
echo %STARTUP_DIR%
echo.
pause
