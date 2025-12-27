@echo off
echo ========================================
echo Building Android App with Clean Cache
echo ========================================
echo.

echo Step 1: Stopping Gradle daemon...
cd android
if exist gradlew.bat (
    call gradlew.bat --stop >nul 2>&1
    timeout /t 2 /nobreak >nul
)
cd ..
echo Done.
echo.

echo Step 2: Cleaning corrupted transform cache...
if exist "%USERPROFILE%\.gradle\caches\8.9\transforms" (
    rmdir /s /q "%USERPROFILE%\.gradle\caches\8.9\transforms" 2>nul
    echo Transform cache deleted.
) else (
    echo No transform cache found.
)
echo.

echo Step 3: Building React Native Android app...
echo This may take several minutes on first build...
echo.
call npx react-native run-android

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo BUILD SUCCESSFUL!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo BUILD FAILED
    echo If you see cache errors, the cache was cleaned but build still failed.
    echo Try running the script again.
    echo ========================================
)

pause
