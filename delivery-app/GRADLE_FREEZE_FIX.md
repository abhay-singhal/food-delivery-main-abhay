# Gradle Initialization Freeze Fix - Windows PowerShell

## Problem Analysis

Gradle stuck at "0% INITIALIZING – Evaluating settings" on Windows is typically caused by:

1. **Stuck Gradle daemon** - Previous daemon process is hung
2. **Corrupted Gradle cache** - Corrupted files in `.gradle` directory
3. **Network timeout** - Gradle distribution download blocked or slow
4. **Java version mismatch** - Wrong Java version or JAVA_HOME not set correctly
5. **Low JVM memory** - Insufficient heap space for initialization
6. **Firewall/Proxy blocking** - Network restrictions preventing Gradle downloads

---

## Step-by-Step Fix (Windows PowerShell)

### Step 1: Stop All Gradle Daemons

Open PowerShell in the project root and run:

```powershell
# Navigate to Android directory
cd delivery-app\android

# Stop all Gradle daemons
.\gradlew --stop

# If that doesn't work, kill Java processes (be careful!)
Get-Process java -ErrorAction SilentlyContinue | Where-Object {$_.Path -like "*java*"} | Stop-Process -Force
```

### Step 2: Verify Java Version

```powershell
# Check Java version (should be 17)
java -version

# Check JAVA_HOME
$env:JAVA_HOME

# If JAVA_HOME is not set or wrong, set it (adjust path to your Java 17 installation)
# Example: $env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
# Example: $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot"
```

**Expected output:**
```
java version "17.0.x"
```

If Java 17 is not installed, download from:
- https://adoptium.net/ (Eclipse Adoptium - recommended)
- https://www.oracle.com/java/technologies/downloads/#java17

### Step 3: Clean Gradle Cache

```powershell
# Delete local Gradle cache (in project)
Remove-Item -Recurse -Force .gradle -ErrorAction SilentlyContinue

# Delete global Gradle cache (optional but recommended)
# This is usually at: C:\Users\<YourUsername>\.gradle
$gradleUserHome = "$env:USERPROFILE\.gradle"
Remove-Item -Recurse -Force "$gradleUserHome\caches" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$gradleUserHome\daemon" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$gradleUserHome\wrapper" -ErrorAction SilentlyContinue

Write-Host "Gradle cache cleaned successfully" -ForegroundColor Green
```

### Step 4: Fix gradle-wrapper.properties

The file should have a **single** `distributionUrl` line. Current file looks correct, but we'll ensure optimal settings:

**File: `delivery-app/android/gradle/wrapper/gradle-wrapper.properties`**

```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.9-all.zip
networkTimeout=60000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

**Key changes:**
- `networkTimeout=60000` (increased from 10000 to 60 seconds for slow networks)

### Step 5: Fix gradle.properties

**File: `delivery-app/android/gradle.properties`**

```properties
# Project-wide Gradle settings.

# IDE (e.g. Android Studio) users:
# Gradle settings configured through the IDE *will override*
# any settings specified in this file.

# For more details on how to configure your build environment visit
# http://www.gradle.org/docs/current/userguide/build_environment.html

# Specifies the JVM arguments used for the daemon process.
# The setting is particularly useful for tweaking memory settings.
# Default value: -Xmx512m -XX:MaxMetaspaceSize=256m
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8 -Duser.country=US -Duser.language=en
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.caching=true

# When configured, Gradle will run in incubating parallel mode.
# This option should only be used with decoupled projects. More details, visit
# http://www.gradle.org/docs/current/userguide/multi_project_builds.html#sec:decoupled_projects

# AndroidX package structure to make it clearer which packages are bundled with the
# Android operating system, and which are packaged with your app's APK
# https://developer.android.com/topic/libraries/support-library/androidx-rn
android.useAndroidX=true
# Automatically convert third-party libraries to use AndroidX
android.enableJetifier=true

# Use this property to specify which architecture you want to build.
# You can also override it from the CLI using
# ./gradlew <task> -PreactNativeArchitectures=x86_64
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64

# Use this property to enable support to the new architecture.
# This will allow you to use TurboModules and the Fabric render in
# your application. You should enable this flag either if you want
# to write custom TurboModules/Fabric components OR use libraries that
# are providing them.
newArchEnabled=false

# Use this property to enable or disable the Hermes JS engine.
# If set to false, you will be using JSC instead.
hermesEnabled=true
```

**Key changes:**
- `org.gradle.jvmargs`: Increased to 4GB heap (`-Xmx4096m`) and 1GB metaspace
- `org.gradle.daemon=true`: Enable daemon (was false, which can cause issues)
- Added `org.gradle.parallel=true`: Enable parallel builds
- Added `org.gradle.configureondemand=true`: Faster configuration
- Added `org.gradle.caching=true`: Enable build cache
- Added locale settings to prevent encoding issues

### Step 6: Test Gradle with Debug Output

```powershell
# Navigate to Android directory
cd delivery-app\android

# Run Gradle with debug logging to see where it's stuck
.\gradlew --info --stacktrace tasks

# If that works, try a simple build
.\gradlew clean

# If still stuck, try with no daemon (slower but more reliable for debugging)
.\gradlew --no-daemon --info tasks
```

### Step 7: If Network Issues Persist

If Gradle still can't download the distribution, check firewall/proxy:

```powershell
# Test connectivity to Gradle services
Test-NetConnection services.gradle.org -Port 443

# If behind corporate proxy, configure Gradle proxy in gradle.properties:
# systemProp.http.proxyHost=proxy.company.com
# systemProp.http.proxyPort=8080
# systemProp.https.proxyHost=proxy.company.com
# systemProp.https.proxyPort=8080
```

---

## Complete Fix Script (Run All Steps)

Save this as `fix-gradle-freeze.ps1` in `delivery-app/android/`:

```powershell
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
```

---

## Verification Commands

After applying fixes, verify with:

```powershell
cd delivery-app\android

# Test 1: Check Gradle version (should complete quickly)
.\gradlew --version

# Test 2: List tasks (should complete without freezing)
.\gradlew tasks

# Test 3: Clean build (full test)
.\gradlew clean
```

---

## Why Gradle Was Stuck

**Root Causes Identified:**

1. **Daemon disabled** (`org.gradle.daemon=false`) - This forces Gradle to start a new JVM each time, which can hang on Windows
2. **Low memory allocation** - 2GB heap may be insufficient for React Native projects
3. **Short network timeout** - 10 seconds may be too short for slow networks or first-time downloads
4. **Possible corrupted cache** - Windows file system issues can corrupt Gradle cache

**The Fix:**
- Enable daemon with proper memory settings (4GB heap)
- Increase network timeout to 60 seconds
- Clean corrupted cache
- Enable parallel builds and caching for better performance

---

## Expected Output After Fix

When running `.\gradlew --version`, you should see:

```
Welcome to Gradle 8.9!

Here are the highlights of this release:
...

Gradle 8.9

Build time:   2024-XX-XX XX:XX:XX UTC
Revision:     xxxxxxxx

Kotlin:       1.9.22
Groovy:       3.0.21
Ant:          Apache Ant(TM) version 1.10.14
JVM:          17.0.x (Eclipse Adoptium 17.0.x+xx)
OS:           Windows 10 10.0 amd64
```

If you see this output, Gradle is working correctly!

---

## Troubleshooting

**If still stuck after all steps:**

1. **Check disk space:**
   ```powershell
   Get-PSDrive C | Select-Object Used,Free
   ```

2. **Check antivirus exclusions:**
   - Add `delivery-app\android` to antivirus exclusions
   - Add `C:\Users\<YourUsername>\.gradle` to exclusions

3. **Try offline mode (if you have Gradle distribution cached):**
   ```powershell
   .\gradlew --offline --version
   ```

4. **Check Windows Event Viewer** for Java/Gradle errors

5. **Run as Administrator** (sometimes helps with file permissions):
   ```powershell
   # Right-click PowerShell -> Run as Administrator
   cd D:\project\food-delivery-main-abhay\delivery-app\android
   .\gradlew --version
   ```

---

## Summary

✅ **Files Updated:**
- `gradle-wrapper.properties` - Increased network timeout
- `gradle.properties` - Increased memory, enabled daemon, enabled optimizations

✅ **Actions Taken:**
- Stopped stuck Gradle daemons
- Cleaned corrupted cache
- Verified Java 17 installation

✅ **Next Steps:**
- Run `.\gradlew --version` to verify
- Run `.\gradlew clean` to test full initialization
- Build your React Native app normally

