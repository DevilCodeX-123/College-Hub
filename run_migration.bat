@echo off
echo ==========================================
echo      College-Hub Database Migration
echo ==========================================
echo.
echo This script will migrate your data:
echo FROM: Old Database (in .env.old)
echo TO:   New Database (in .env)
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] Node.js found. Running migration...
    node backend/migrate_full_db.js
    pause
    exit /b
)

:: Check for Bun
where bun >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] Bun found. Running migration...
    bun backend/migrate_full_db.js
    pause
    exit /b
)

echo [ERROR] Neither 'node' nor 'bun' could be found in your PATH.
echo Please ensure you have Node.js installed and available in your terminal.
echo.
echo You can try running this manually:
echo    node backend/migrate_full_db.js
echo.
pause
