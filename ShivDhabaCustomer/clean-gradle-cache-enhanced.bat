@echo off
echo ========================================
echo Enhanced Gradle Cache Cleanup Script
echo For: ShivDhabaCustomer
echo ========================================
echo.

REM Check for administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

cd /d "%~dp0android" 2>nul || (
    echo Error: Could not navigate to android directory
    pause
    exit /b 1
)

echo [1/5] Stopping all Gradle daemons...
call gradlew.bat --stop >nul 2>&1
timeout /t 3 /nobreak >nul
echo    Done.

echo [2/5] Killing any remaining Java processes...
taskkill /F /IM java.exe >nul 2>&1
taskkill /F /IM javaw.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo    Done.

echo [3/5] Removing lock files with force...
if exist .gradle\8.9\fileHashes\fileHashes.lock (
    takeown /F .gradle\8.9\fileHashes\fileHashes.lock >nul 2>&1
    icacls .gradle\8.9\fileHashes\fileHashes.lock /grant Administrators:F >nul 2>&1
    del /f /q .gradle\8.9\fileHashes\fileHashes.lock >nul 2>&1
    echo    Lock file removed.
) else (
    echo    No lock file found.
)

REM Remove entire fileHashes directory
if exist .gradle\8.9\fileHashes (
    takeown /F /R /D Y .gradle\8.9\fileHashes >nul 2>&1
    icacls .gradle\8.9\fileHashes /grant Administrators:F /T >nul 2>&1
    rmdir /s /q .gradle\8.9\fileHashes >nul 2>&1
    echo    fileHashes directory removed.
)

echo [4/5] Removing .gradle cache directory...
if exist .gradle (
    takeown /F /R /D Y .gradle >nul 2>&1
    icacls .gradle /grant Administrators:F /T >nul 2>&1
    rmdir /s /q .gradle >nul 2>&1
    if not exist .gradle (
        echo    .gradle directory removed.
    ) else (
        echo    Warning: Could not fully remove .gradle directory (may be in use)
        echo    Try closing all IDEs and running this script again.
    )
) else (
    echo    .gradle directory not found.
)

echo [5/5] Removing build directories...
if exist app\build (
    takeown /F /R /D Y app\build >nul 2>&1
    icacls app\build /grant Administrators:F /T >nul 2>&1
    rmdir /s /q app\build >nul 2>&1
    echo    app\build directory removed.
)
if exist build (
    takeown /F /R /D Y build >nul 2>&1
    icacls build /grant Administrators:F /T >nul 2>&1
    rmdir /s /q build >nul 2>&1
    echo    build directory removed.
)

echo.
echo ========================================
echo Cleanup complete!
echo ========================================
echo You can now rebuild the project.
echo.
echo Next steps:
echo 1. cd ..
echo 2. npm install (if needed)
echo 3. npx react-native run-android
echo.
cd ..
pause


