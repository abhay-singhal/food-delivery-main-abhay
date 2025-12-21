@echo off
echo ========================================
echo Gradle Cache Cleanup Script
echo ========================================
echo.

cd /d "%~dp0android" 2>nul || (
    echo Error: Could not navigate to android directory
    pause
    exit /b 1
)

echo [1/4] Stopping Gradle daemon...
call gradlew.bat --stop >nul 2>&1
echo    Done.

echo [2/4] Removing lock files...
if exist .gradle\8.9\fileHashes\fileHashes.lock (
    del /f /q .gradle\8.9\fileHashes\fileHashes.lock >nul 2>&1
    echo    Lock file removed.
) else (
    echo    No lock file found.
)

echo [3/4] Removing .gradle cache directory...
if exist .gradle (
    rmdir /s /q .gradle >nul 2>&1
    if not exist .gradle (
        echo    .gradle directory removed.
    ) else (
        echo    Warning: Could not fully remove .gradle directory (may be in use)
    )
) else (
    echo    .gradle directory not found.
)

echo [4/4] Removing build directories...
if exist app\build (
    rmdir /s /q app\build >nul 2>&1
    echo    app\build directory removed.
)
if exist build (
    rmdir /s /q build >nul 2>&1
    echo    build directory removed.
)

echo.
echo ========================================
echo Cleanup complete!
echo ========================================
echo You can now rebuild the project.
echo.
cd ..
pause
