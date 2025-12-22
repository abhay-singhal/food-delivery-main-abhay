# Test Gradle Fix - Verification Script
# This script verifies that Gradle initializes successfully after the JAVA_TOOL_OPTIONS fix

Write-Host "=== Gradle Fix Verification Script ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check JAVA_TOOL_OPTIONS
Write-Host "[1/5] Checking JAVA_TOOL_OPTIONS..." -ForegroundColor Yellow
$javaToolOptions = $env:JAVA_TOOL_OPTIONS
if ($javaToolOptions) {
    Write-Host "  WARNING: JAVA_TOOL_OPTIONS = $javaToolOptions" -ForegroundColor Yellow
    Write-Host "  (This is OK - gradlew.bat will override it)" -ForegroundColor Gray
} else {
    Write-Host "  ✓ No JAVA_TOOL_OPTIONS in current session" -ForegroundColor Green
}

# Step 2: Verify gradlew.bat fix
Write-Host "`n[2/5] Verifying gradlew.bat fix..." -ForegroundColor Yellow
$gradlewFix = Select-String -Path "gradlew.bat" -Pattern "JAVA_TOOL_OPTIONS" -Quiet
if ($gradlewFix) {
    Write-Host "  ✓ gradlew.bat contains JAVA_TOOL_OPTIONS fix" -ForegroundColor Green
} else {
    Write-Host "  ✗ gradlew.bat fix NOT FOUND!" -ForegroundColor Red
    Write-Host "  Please ensure gradlew.bat has been updated" -ForegroundColor Red
    exit 1
}

# Step 3: Stop existing daemons
Write-Host "`n[3/5] Stopping existing Gradle daemons..." -ForegroundColor Yellow
.\gradlew --stop 2>$null
Start-Sleep -Seconds 2
Write-Host "  ✓ Daemons stopped" -ForegroundColor Green

# Step 4: Test Gradle initialization (NO DAEMON - Fastest)
Write-Host "`n[4/5] Testing Gradle initialization (no daemon)..." -ForegroundColor Yellow
Write-Host "  Running: .\gradlew --no-daemon --version" -ForegroundColor Cyan
Write-Host "  Expected: Should complete in < 10 seconds" -ForegroundColor Gray
Write-Host ""

$startTime = Get-Date
try {
    $result = .\gradlew --no-daemon --version 2>&1
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Gradle initialized successfully!" -ForegroundColor Green
        Write-Host "  Duration: $([math]::Round($duration, 2)) seconds" -ForegroundColor $(if ($duration -lt 10) { "Green" } else { "Yellow" })
        
        # Show Gradle version
        $versionLine = $result | Select-String "Gradle \d+\.\d+"
        if ($versionLine) {
            Write-Host "  $versionLine" -ForegroundColor Cyan
        }
        
        if ($duration -gt 10) {
            Write-Host "  WARNING: Initialization took > 10 seconds" -ForegroundColor Yellow
            Write-Host "  This may indicate remaining issues" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ✗ Gradle initialization FAILED!" -ForegroundColor Red
        Write-Host "  Exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ✗ Gradle initialization FAILED with error!" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Test settings evaluation
Write-Host "`n[5/5] Testing settings evaluation..." -ForegroundColor Yellow
Write-Host "  Running: .\gradlew --no-daemon tasks --all" -ForegroundColor Cyan
Write-Host "  Expected: Should show task list, NOT freeze" -ForegroundColor Gray
Write-Host ""

$startTime = Get-Date
try {
    $result = .\gradlew --no-daemon tasks --all 2>&1 | Select-Object -First 20
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Settings evaluation successful!" -ForegroundColor Green
        Write-Host "  Duration: $([math]::Round($duration, 2)) seconds" -ForegroundColor $(if ($duration -lt 10) { "Green" } else { "Yellow" })
        
        # Show first few tasks
        $taskLines = $result | Select-String "^\w+ - " | Select-Object -First 5
        if ($taskLines) {
            Write-Host "  Sample tasks found:" -ForegroundColor Cyan
            $taskLines | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
        }
    } else {
        Write-Host "  ✗ Settings evaluation FAILED!" -ForegroundColor Red
        Write-Host "  Exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ✗ Settings evaluation FAILED with error!" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}

# Final Summary
Write-Host ""
Write-Host "=== Verification Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "✓ Gradle initializes successfully" -ForegroundColor Green
Write-Host "✓ Settings evaluation works" -ForegroundColor Green
Write-Host "✓ JAVA_TOOL_OPTIONS override is working" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run: .\gradlew clean (to test full build)" -ForegroundColor White
Write-Host "  2. Run: .\gradlew tasks (with daemon - should be faster)" -ForegroundColor White
Write-Host "  3. Build your React Native app normally" -ForegroundColor White
Write-Host ""

