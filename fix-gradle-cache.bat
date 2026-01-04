@echo off
echo ========================================
echo Gradle Cache Fix Script
echo ========================================
echo.

echo Step 1: Stopping Gradle daemon...
cd /d "%~dp0ShivDhabaCustomer\android"
call gradlew.bat --stop
echo.

echo Step 2: Waiting for processes to release files...
timeout /t 3 /nobreak >nul
echo.

echo Step 3: Deleting corrupted Gradle cache...
if exist "%USERPROFILE%\.gradle\caches\8.9" (
    rmdir /s /q "%USERPROFILE%\.gradle\caches\8.9"
    echo Deleted: %USERPROFILE%\.gradle\caches\8.9
) else (
    echo Cache folder not found
)

if exist "%USERPROFILE%\.gradle\caches\transforms" (
    rmdir /s /q "%USERPROFILE%\.gradle\caches\transforms"
    echo Deleted: %USERPROFILE%\.gradle\caches\transforms
)

echo.
echo ========================================
echo Cache cleanup complete!
echo ========================================
echo.
echo Now try building again:
echo   cd ShivDhabaCustomer
echo   npx react-native run-android
echo.
echo Note: The first build will take longer as Gradle downloads dependencies.
echo.
pause



