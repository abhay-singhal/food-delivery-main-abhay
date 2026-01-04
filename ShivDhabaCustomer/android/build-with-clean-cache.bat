@echo off
echo ========================================
echo Building with Clean Cache
echo ========================================
echo.

echo Step 1: Stopping Gradle daemon...
call gradlew.bat --stop
timeout /t 2 /nobreak >nul
echo.

echo Step 2: Cleaning corrupted transform cache...
if exist "%USERPROFILE%\.gradle\caches\8.9\transforms" (
    rmdir /s /q "%USERPROFILE%\.gradle\caches\8.9\transforms"
    echo Transform cache deleted
)
echo.

echo Step 3: Building app...
call gradlew.bat assembleDebug --no-daemon
echo.

if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo BUILD SUCCESSFUL!
    echo ========================================
) else (
    echo ========================================
    echo BUILD FAILED
    echo ========================================
)

pause




