@echo off
echo Registering Delivery Boy with mobile number 7023166771...
echo.

REM Try to find MySQL in common locations
set MYSQL_PATH=
if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe
) else if exist "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" (
    set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe
) else if exist "C:\xampp\mysql\bin\mysql.exe" (
    set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
) else if exist "C:\wamp64\bin\mysql\mysql8.0.xx\bin\mysql.exe" (
    set MYSQL_PATH=C:\wamp64\bin\mysql\mysql8.0.xx\bin\mysql.exe
)

if "%MYSQL_PATH%"=="" (
    echo MySQL not found in common locations.
    echo Please run the SQL manually:
    echo   1. Open MySQL Workbench or command line
    echo   2. Connect to your database
    echo   3. Run: backend\register-delivery-boy-direct.sql
    echo.
    echo Or use the API endpoint after starting backend:
    echo   POST http://localhost:8080/api/v1/auth/delivery-boy/register
    echo   Body: {"mobileNumber":"7023166771","fullName":"Delivery Boy"}
    pause
    exit /b 1
)

echo Using MySQL at: %MYSQL_PATH%
echo.

"%MYSQL_PATH%" -u admin -pSinghal@01 food_delivery_db < register-delivery-boy-direct.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Delivery boy registered successfully!
    echo Mobile Number: 7023166771
    echo.
) else (
    echo.
    echo ❌ Registration failed. Please check:
    echo   1. MySQL is running
    echo   2. Database 'food_delivery_db' exists
    echo   3. Username/password are correct
    echo.
)

pause






