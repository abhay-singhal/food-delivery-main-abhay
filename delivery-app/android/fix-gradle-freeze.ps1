# Fix Gradle Freeze on Windows
Write-Host "=== Gradle Freeze Fix Script ===" -ForegroundColor Cyan

# Step 1: Stop Gradle daemons
Write-Host "`n[1/6] Stopping Gradle daemons..." -ForegroundColor Yellow
.\gradlew --stop 2>$null
Get-Process java -ErrorAction SilentlyContinue | Where-Object {$_.Path -like "*java*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Step 2: Verify Java
Write-Host "`n[2/6] Verifying Java version..." -ForegroundColor Yellow
$javaVersion = java -version 2>&1 | Select-Object -First 1
Write-Host "Java: $javaVersion" -ForegroundColor $(if ($javaVersion -match "17") { "Green" } else { "Red" })
if (-not ($javaVersion -match "17")) {
    Write-Host "WARNING: Java 17 is required. Current: $javaVersion" -ForegroundColor Red
}

# Step 3: Clean cache
Write-Host "`n[3/6] Cleaning Gradle cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .gradle -ErrorAction SilentlyContinue
$gradleUserHome = "$env:USERPROFILE\.gradle"
Remove-Item -Recurse -Force "$gradleUserHome\caches" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$gradleUserHome\daemon" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$gradleUserHome\wrapper" -ErrorAction SilentlyContinue
Write-Host "Cache cleaned" -ForegroundColor Green

# Step 4: Verify files (user should have updated them)
Write-Host "`n[4/6] Verifying Gradle configuration files..." -ForegroundColor Yellow
if (Test-Path "gradle\wrapper\gradle-wrapper.properties") {
    Write-Host "✓ gradle-wrapper.properties exists" -ForegroundColor Green
} else {
    Write-Host "✗ gradle-wrapper.properties missing!" -ForegroundColor Red
}

if (Test-Path "gradle.properties") {
    Write-Host "✓ gradle.properties exists" -ForegroundColor Green
} else {
    Write-Host "✗ gradle.properties missing!" -ForegroundColor Red
}

# Step 5: Test Gradle
Write-Host "`n[5/6] Testing Gradle initialization..." -ForegroundColor Yellow
Write-Host "Running: .\gradlew --version" -ForegroundColor Cyan
.\gradlew --version

# Step 6: Final test
Write-Host "`n[6/6] Running final test..." -ForegroundColor Yellow
Write-Host "Running: .\gradlew tasks --all" -ForegroundColor Cyan
.\gradlew tasks --all

Write-Host "`n=== Fix Complete ===" -ForegroundColor Green
Write-Host "If Gradle still freezes, check:" -ForegroundColor Yellow
Write-Host "  1. Java 17 is installed and JAVA_HOME is set" -ForegroundColor Yellow
Write-Host "  2. No firewall blocking services.gradle.org" -ForegroundColor Yellow
Write-Host "  3. Sufficient disk space (at least 2GB free)" -ForegroundColor Yellow

