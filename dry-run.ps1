# Comprehensive Dry Run Script for Food Delivery Application
# This script validates the entire application without actually running it

param(
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$global:Errors = 0
$global:Warnings = 0
$global:Success = 0

function Write-Status {
    param(
        [string]$Message,
        [string]$Status = "INFO"
    )
    
    $color = switch ($Status) {
        "SUCCESS" { "Green" }
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        "INFO" { "Cyan" }
        default { "White" }
    }
    
    $symbol = switch ($Status) {
        "SUCCESS" { "✅" }
        "ERROR" { "❌" }
        "WARNING" { "⚠️" }
        "INFO" { "ℹ️" }
        default { "•" }
    }
    
    Write-Host "$symbol $Message" -ForegroundColor $color
}

function Test-Command {
    param([string]$Command, [string]$Name)
    
    try {
        $null = Get-Command $Command -ErrorAction Stop
        Write-Status "$Name is installed" "SUCCESS"
        $script:Success++
        return $true
    }
    catch {
        Write-Status "$Name is NOT installed" "ERROR"
        $script:Errors++
        return $false
    }
}

function Test-File {
    param([string]$Path, [string]$Description)
    
    if (Test-Path $Path) {
        Write-Status "$Description found: $Path" "SUCCESS"
        $script:Success++
        return $true
    }
    else {
        Write-Status "$Description NOT found: $Path" "ERROR"
        $script:Errors++
        return $false
    }
}

function Test-Directory {
    param([string]$Path, [string]$Description)
    
    if (Test-Path $Path) {
        Write-Status "$Description found: $Path" "SUCCESS"
        $script:Success++
        return $true
    }
    else {
        Write-Status "$Description NOT found: $Path" "WARNING"
        $script:Warnings++
        return $false
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FOOD DELIVERY APP - DRY RUN VALIDATION" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================
# 1. PREREQUISITES CHECK
# ============================================
Write-Host "`n[1/6] Checking Prerequisites..." -ForegroundColor Yellow

$javaOk = Test-Command "java" "Java"
if ($javaOk) {
    try {
        $javaVersion = java -version 2>&1 | Select-String "version"
        Write-Status "Java version: $javaVersion" "INFO"
    } catch {}
}

$mavenOk = Test-Command "mvn" "Maven"
if ($mavenOk) {
    try {
        $mavenVersion = mvn -version 2>&1 | Select-String "Apache Maven"
        Write-Status "Maven: $mavenVersion" "INFO"
    } catch {}
}

$nodeOk = Test-Command "node" "Node.js"
if ($nodeOk) {
    try {
        $nodeVersion = node --version
        Write-Status "Node.js version: $nodeVersion" "INFO"
        
        # Check Node version >= 18
        $versionNumber = [int]($nodeVersion -replace 'v', '' -split '\.')[0]
        if ($versionNumber -lt 18) {
            Write-Status "Node.js version should be >= 18 (current: $nodeVersion)" "WARNING"
            $script:Warnings++
        }
    } catch {}
}

$npmOk = Test-Command "npm" "npm"
if ($npmOk) {
    try {
        $npmVersion = npm --version
        Write-Status "npm version: $npmVersion" "INFO"
    } catch {}
}

# ============================================
# 2. PROJECT STRUCTURE VALIDATION
# ============================================
Write-Host "`n[2/6] Validating Project Structure..." -ForegroundColor Yellow

$rootDir = Get-Location
Write-Status "Working directory: $rootDir" "INFO"

# Check main directories
Test-Directory "backend" "Backend directory"
Test-Directory "customer-app" "Customer app directory"
Test-Directory "delivery-app" "Delivery app directory"
Test-Directory "admin-app" "Admin app directory"

# Check backend structure
if (Test-Path "backend") {
    Test-File "backend\pom.xml" "Backend pom.xml"
    Test-File "backend\src\main\resources\application.properties" "Backend application.properties"
    Test-Directory "backend\src\main\java" "Backend Java source directory"
}

# Check frontend structures
@("customer-app", "delivery-app", "admin-app") | ForEach-Object {
    $app = $_
    if (Test-Path $app) {
        Test-File "$app\package.json" "$app package.json"
        Test-Directory "$app\src" "$app source directory"
        Test-Directory "$app\android" "$app Android directory"
    }
}

# ============================================
# 3. BACKEND VALIDATION
# ============================================
if (-not $SkipBackend) {
    Write-Host "`n[3/6] Validating Backend..." -ForegroundColor Yellow
    
    if (Test-Path "backend") {
        Push-Location "backend"
        
        # Check application.properties
        if (Test-Path "src\main\resources\application.properties") {
            $props = Get-Content "src\main\resources\application.properties" -Raw
            
            # Validate key configurations
            $checks = @{
                "spring.datasource.url" = "Database URL"
                "spring.datasource.username" = "Database username"
                "spring.datasource.password" = "Database password"
                "jwt.secret" = "JWT secret"
                "server.port" = "Server port"
            }
            
            foreach ($key in $checks.Keys) {
                if ($props -match [regex]::Escape($key)) {
                    Write-Status "$($checks[$key]) configured" "SUCCESS"
                    $script:Success++
                } else {
                    Write-Status "$($checks[$key]) NOT configured" "WARNING"
                    $script:Warnings++
                }
            }
        }
        
        # Try Maven compile (dry run - compile only, don't run)
        if ($mavenOk) {
            Write-Status "Attempting Maven compile (dry run)..." "INFO"
            try {
                $compileOutput = mvn clean compile -DskipTests 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Status "Backend compiles successfully" "SUCCESS"
                    $script:Success++
                } else {
                    Write-Status "Backend compilation failed" "ERROR"
                    $script:Errors++
                    if ($Verbose) {
                        Write-Host $compileOutput -ForegroundColor Red
                    }
                }
            }
            catch {
                Write-Status "Could not compile backend: $($_.Exception.Message)" "ERROR"
                $script:Errors++
            }
        } else {
            Write-Status "Skipping Maven compile (Maven not found)" "WARNING"
            $script:Warnings++
        }
        
        Pop-Location
    }
} else {
    Write-Host "`n[3/6] Skipping Backend Validation..." -ForegroundColor Gray
}

# ============================================
# 4. FRONTEND VALIDATION
# ============================================
if (-not $SkipFrontend) {
    Write-Host "`n[4/6] Validating Frontend Applications..." -ForegroundColor Yellow
    
    @("customer-app", "delivery-app", "admin-app") | ForEach-Object {
        $app = $_
        Write-Host "`n  Validating $app..." -ForegroundColor Cyan
        
        if (Test-Path $app) {
            Push-Location $app
            
            # Check package.json
            if (Test-Path "package.json") {
                try {
                    $packageJson = Get-Content "package.json" | ConvertFrom-Json
                    Write-Status "$app package.json is valid JSON" "SUCCESS"
                    $script:Success++
                    
                    # Check required scripts
                    if ($packageJson.scripts) {
                        $requiredScripts = @("start", "android")
                        foreach ($script in $requiredScripts) {
                            if ($packageJson.scripts.$script) {
                                Write-Status "$app has '$script' script" "SUCCESS"
                                $script:Success++
                            } else {
                                Write-Status "$app missing '$script' script" "WARNING"
                                $script:Warnings++
                            }
                        }
                    }
                }
                catch {
                    Write-Status "$app package.json is invalid JSON" "ERROR"
                    $script:Errors++
                }
            }
            
            # Check if node_modules exists (optional - might not be installed)
            if (Test-Path "node_modules") {
                Write-Status "$app dependencies installed" "SUCCESS"
                $script:Success++
            } else {
                Write-Status "$app dependencies not installed (run 'npm install')" "WARNING"
                $script:Warnings++
            }
            
            # Try npm install (dry run - check if it would work)
            if ($npmOk -and -not (Test-Path "node_modules")) {
                Write-Status "Checking if npm install would work for $app..." "INFO"
                try {
                    # Just validate package.json, don't actually install
                    $null = npm install --dry-run 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        Write-Status "$app dependencies can be installed" "SUCCESS"
                        $script:Success++
                    }
                }
                catch {
                    Write-Status "$app dependency check failed" "WARNING"
                    $script:Warnings++
                }
            }
            
            Pop-Location
        }
    }
} else {
    Write-Host "`n[4/6] Skipping Frontend Validation..." -ForegroundColor Gray
}

# ============================================
# 5. CONFIGURATION VALIDATION
# ============================================
Write-Host "`n[5/6] Validating Configurations..." -ForegroundColor Yellow

# Check backend configuration
if (Test-Path "backend\src\main\resources\application.properties") {
    $props = Get-Content "backend\src\main\resources\application.properties"
    
    # Check for placeholder values
    $placeholders = @("YOUR_", "CHANGE_", "TODO", "FIXME")
    foreach ($line in $props) {
        foreach ($placeholder in $placeholders) {
            if ($line -match $placeholder) {
                Write-Status "Found placeholder in config: $line" "WARNING"
                $script:Warnings++
            }
        }
    }
}

# Check frontend API configurations
@("customer-app", "delivery-app", "admin-app") | ForEach-Object {
    $app = $_
    $configFiles = @(
        "$app\src\config\api.js",
        "$app\src\config\api.ts",
        "$app\src\config\index.js",
        "$app\src\config\index.ts"
    )
    
    foreach ($configFile in $configFiles) {
        if (Test-Path $configFile) {
            Write-Status "Found API config: $configFile" "SUCCESS"
            $script:Success++
            
            # Check if it has API URL
            $content = Get-Content $configFile -Raw
            if ($content -match "localhost|127\.0\.0\.1|10\.0\.2\.2") {
                Write-Status "$app API config points to localhost" "INFO"
            }
            break
        }
    }
}

# ============================================
# 6. SUMMARY
# ============================================
Write-Host "`n[6/6] Summary..." -ForegroundColor Yellow

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DRY RUN RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n✅ Successes: $global:Success" -ForegroundColor Green
Write-Host "⚠️  Warnings:  $global:Warnings" -ForegroundColor Yellow
Write-Host "❌ Errors:    $global:Errors" -ForegroundColor Red

$total = $global:Success + $global:Warnings + $global:Errors
if ($total -gt 0) {
    $successRate = [math]::Round(($global:Success / $total) * 100, 2)
    Write-Host "`n📊 Success Rate: $successRate%" -ForegroundColor Cyan
}

Write-Host "`n========================================" -ForegroundColor Cyan

if ($global:Errors -eq 0) {
    Write-Host "`n✅ DRY RUN PASSED - Application is ready!" -ForegroundColor Green
    if ($global:Warnings -gt 0) {
        Write-Host "⚠️  Some warnings found - review recommended" -ForegroundColor Yellow
    }
    exit 0
} else {
    Write-Host "`n❌ DRY RUN FAILED - Please fix errors before proceeding" -ForegroundColor Red
    exit 1
}

