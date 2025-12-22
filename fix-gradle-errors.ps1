# PowerShell script to fix Gradle cache errors in both projects
# Run this script as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Gradle Cache Error Fix Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check for administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

$projectRoot = $PSScriptRoot
if (-not $projectRoot) {
    $projectRoot = Get-Location
}

function Fix-GradleCache {
    param(
        [string]$ProjectName,
        [string]$ProjectPath
    )
    
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "Fixing: $ProjectName" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    
    $androidPath = Join-Path $ProjectPath "android"
    
    if (-not (Test-Path $androidPath)) {
        Write-Host "ERROR: Android directory not found at $androidPath" -ForegroundColor Red
        return $false
    }
    
    Push-Location $androidPath
    
    try {
        # Step 1: Stop Gradle daemon
        Write-Host "[1/5] Stopping Gradle daemon..." -ForegroundColor Yellow
        & .\gradlew.bat --stop 2>&1 | Out-Null
        Start-Sleep -Seconds 3
        Write-Host "    Done." -ForegroundColor Green
        
        # Step 2: Kill Java processes
        Write-Host "[2/5] Killing Java processes..." -ForegroundColor Yellow
        Get-Process | Where-Object {$_.ProcessName -like "*java*"} | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "    Done." -ForegroundColor Green
        
        # Step 3: Remove lock files
        Write-Host "[3/5] Removing lock files..." -ForegroundColor Yellow
        $lockFile = Join-Path $androidPath ".gradle\8.9\fileHashes\fileHashes.lock"
        if (Test-Path $lockFile) {
            try {
                Remove-Item -Path $lockFile -Force -ErrorAction Stop
                Write-Host "    Lock file removed." -ForegroundColor Green
            } catch {
                Write-Host "    Warning: Could not remove lock file (may need manual deletion)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "    No lock file found." -ForegroundColor Gray
        }
        
        # Step 4: Remove .gradle directory
        Write-Host "[4/5] Removing .gradle cache..." -ForegroundColor Yellow
        $gradleDir = Join-Path $androidPath ".gradle"
        if (Test-Path $gradleDir) {
            try {
                Remove-Item -Path $gradleDir -Recurse -Force -ErrorAction Stop
                Write-Host "    .gradle directory removed." -ForegroundColor Green
            } catch {
                Write-Host "    Warning: Could not fully remove .gradle directory" -ForegroundColor Yellow
                Write-Host "    Try closing all IDEs and running this script again." -ForegroundColor Yellow
            }
        } else {
            Write-Host "    .gradle directory not found." -ForegroundColor Gray
        }
        
        # Step 5: Remove build directories
        Write-Host "[5/5] Removing build directories..." -ForegroundColor Yellow
        $appBuild = Join-Path $androidPath "app\build"
        $buildDir = Join-Path $androidPath "build"
        
        if (Test-Path $appBuild) {
            Remove-Item -Path $appBuild -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "    app\build removed." -ForegroundColor Green
        }
        if (Test-Path $buildDir) {
            Remove-Item -Path $buildDir -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "    build removed." -ForegroundColor Green
        }
        
        Write-Host "`n$ProjectName - Fix complete!" -ForegroundColor Green
        return $true
        
    } catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    } finally {
        Pop-Location
    }
}

# Fix delivery-app
$deliveryAppPath = Join-Path $projectRoot "delivery-app"
if (Test-Path $deliveryAppPath) {
    Fix-GradleCache -ProjectName "delivery-app" -ProjectPath $deliveryAppPath
} else {
    Write-Host "WARNING: delivery-app directory not found" -ForegroundColor Yellow
}

# Fix ShivDhabaCustomer
$shivDhabaPath = Join-Path $projectRoot "ShivDhabaCustomer"
if (Test-Path $shivDhabaPath) {
    Fix-GradleCache -ProjectName "ShivDhabaCustomer" -ProjectPath $shivDhabaPath
} else {
    Write-Host "WARNING: ShivDhabaCustomer directory not found" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "All fixes applied!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. For delivery-app: cd delivery-app && npm install && npx react-native run-android --port=8082" -ForegroundColor White
Write-Host "2. For ShivDhabaCustomer: cd ShivDhabaCustomer && npm install && npx react-native run-android" -ForegroundColor White
Write-Host ""
pause


