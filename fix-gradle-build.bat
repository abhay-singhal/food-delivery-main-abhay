@echo off
echo Cleaning Gradle build cache and rebuilding...

REM Navigate to the project root
cd /d "%~dp0"

REM Clean Android build
echo Cleaning Android build folders...
cd ShivDhabaCustomer\android
if exist gradlew.bat (
    call gradlew.bat clean
) else (
    echo gradlew.bat not found in current directory
)

REM Clean build folders manually
cd ..
if exist android\app\build rmdir /s /q android\app\build
if exist android\.gradle rmdir /s /q android\.gradle
if exist android\build rmdir /s /q android\build

echo.
echo Build folders cleaned!
echo.
echo Now try building again with:
echo   cd ShivDhabaCustomer
echo   npx react-native run-android
echo.
pause




