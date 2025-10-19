@echo off
REM Quick Start Script for Team SSO
REM This script launches the PowerShell startup script

echo.
echo ================================================================
echo          TEAM SSO - Quick Start
echo ================================================================
echo.
echo Starting development environment...
echo.

REM Run the PowerShell script
powershell.exe -ExecutionPolicy Bypass -File "%~dp0start-dev.ps1"

REM Keep window open if there was an error
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to start services!
    echo Check the error messages above.
    pause
)
