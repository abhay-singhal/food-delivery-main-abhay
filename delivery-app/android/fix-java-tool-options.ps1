# Fix JAVA_TOOL_OPTIONS Environment Variable Issue
# This script checks and removes JAVA_TOOL_OPTIONS that causes Gradle to freeze

Write-Host "=== JAVA_TOOL_OPTIONS Fix Script ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check current JAVA_TOOL_OPTIONS
Write-Host "[1/4] Checking JAVA_TOOL_OPTIONS..." -ForegroundColor Yellow
$javaToolOptions = $env:JAVA_TOOL_OPTIONS
if ($javaToolOptions) {
    Write-Host "  FOUND: JAVA_TOOL_OPTIONS = $javaToolOptions" -ForegroundColor Red
    Write-Host "  This is causing Gradle to freeze!" -ForegroundColor Red
} else {
    Write-Host "  No JAVA_TOOL_OPTIONS found in current session" -ForegroundColor Green
}

# Step 2: Check system-wide environment variables
Write-Host "`n[2/4] Checking system environment variables..." -ForegroundColor Yellow
$systemJavaToolOptions = [System.Environment]::GetEnvironmentVariable("JAVA_TOOL_OPTIONS", "Machine")
$userJavaToolOptions = [System.Environment]::GetEnvironmentVariable("JAVA_TOOL_OPTIONS", "User")

if ($systemJavaToolOptions) {
    Write-Host "  FOUND in SYSTEM: $systemJavaToolOptions" -ForegroundColor Red
} else {
    Write-Host "  No JAVA_TOOL_OPTIONS in SYSTEM" -ForegroundColor Green
}

if ($userJavaToolOptions) {
    Write-Host "  FOUND in USER: $userJavaToolOptions" -ForegroundColor Red
} else {
    Write-Host "  No JAVA_TOOL_OPTIONS in USER" -ForegroundColor Green
}

# Step 3: Remove from current session
Write-Host "`n[3/4] Removing JAVA_TOOL_OPTIONS from current PowerShell session..." -ForegroundColor Yellow
$env:JAVA_TOOL_OPTIONS = $null
Remove-Item Env:\JAVA_TOOL_OPTIONS -ErrorAction SilentlyContinue
Write-Host "  Removed from current session" -ForegroundColor Green

# Step 4: Instructions for permanent removal
Write-Host "`n[4/4] Permanent removal instructions..." -ForegroundColor Yellow
Write-Host ""
if ($systemJavaToolOptions -or $userJavaToolOptions) {
    Write-Host "  To PERMANENTLY remove JAVA_TOOL_OPTIONS:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Option A: Using PowerShell (Run as Administrator):" -ForegroundColor White
    Write-Host "    [System.Environment]::SetEnvironmentVariable('JAVA_TOOL_OPTIONS', `$null, 'User')" -ForegroundColor Gray
    Write-Host "    [System.Environment]::SetEnvironmentVariable('JAVA_TOOL_OPTIONS', `$null, 'Machine')" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Option B: Using Windows GUI:" -ForegroundColor White
    Write-Host "    1. Press Win+R, type: sysdm.cpl" -ForegroundColor Gray
    Write-Host "    2. Advanced tab → Environment Variables" -ForegroundColor Gray
    Write-Host "    3. Find JAVA_TOOL_OPTIONS in User/System variables" -ForegroundColor Gray
    Write-Host "    4. Select it → Delete" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Option C: Keep it but override in gradlew.bat (Already done!)" -ForegroundColor White
    Write-Host "    The gradlew.bat has been modified to unset JAVA_TOOL_OPTIONS" -ForegroundColor Gray
    Write-Host "    This fix works even if JAVA_TOOL_OPTIONS is set system-wide" -ForegroundColor Gray
} else {
    Write-Host "  No permanent JAVA_TOOL_OPTIONS found. Current session fix is sufficient." -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Fix Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Close and reopen PowerShell (to clear session env vars)" -ForegroundColor White
Write-Host "  2. Navigate to: cd delivery-app\android" -ForegroundColor White
Write-Host "  3. Test: .\gradlew --version" -ForegroundColor White
Write-Host ""
Write-Host "Expected: Gradle should initialize in < 10 seconds" -ForegroundColor Cyan

