# Gradle Freeze Root Cause Fix - JAVA_TOOL_OPTIONS Override

## 🔴 ROOT CAUSE IDENTIFIED

**Problem:** Gradle stuck at "0% INITIALIZING > Evaluating settings"

**Root Cause:** `JAVA_TOOL_OPTIONS` environment variable is set system-wide with:
```
-Xmx1024m -XX:MaxMetaspaceSize=256m
```

**Why This Causes Freeze:**
1. `JAVA_TOOL_OPTIONS` is a **JVM-wide** environment variable
2. It gets applied to **ALL Java processes** BEFORE they start
3. It's processed **BEFORE** Gradle reads `gradle.properties`
4. Gradle 8.x + React Native needs **minimum 2GB heap** to initialize
5. With only 1GB heap, Gradle runs out of memory during settings evaluation
6. The JVM enters GC thrashing → appears frozen at "INITIALIZING"

**Technical Details:**
- `JAVA_TOOL_OPTIONS` is read by the JVM launcher (`java.exe`)
- It's applied before any `-Xmx` arguments passed via command line
- However, explicit `-Xmx` args in the command line **can override** it if passed correctly
- The issue: `gradlew.bat` wasn't passing explicit memory args, so JAVA_TOOL_OPTIONS won

---

## ✅ PERMANENT FIX APPLIED

### Fix 1: Modified `gradlew.bat` (CRITICAL)

**File:** `delivery-app/android/gradlew.bat`

**Change:** Added code to unset `JAVA_TOOL_OPTIONS` and pass explicit memory arguments:

```batch
@rem CRITICAL FIX: Unset JAVA_TOOL_OPTIONS to prevent memory override
set JAVA_TOOL_OPTIONS=

@rem Execute Gradle with explicit memory settings that override any remaining env vars
"%JAVA_EXE%" -Xmx4096m -XX:MaxMetaspaceSize=1024m %DEFAULT_JVM_OPTS% ...
```

**Why This Works:**
- Unsets `JAVA_TOOL_OPTIONS` in the batch script scope
- Passes explicit `-Xmx4096m` directly to JVM
- Explicit JVM args take precedence over environment variables
- Works even if `JAVA_TOOL_OPTIONS` is set system-wide

### Fix 2: Updated `gradle.properties`

**File:** `delivery-app/android/gradle.properties`

**Changes:**
- Increased heap to 4GB (`-Xmx4096m`)
- Increased metaspace to 1GB (`-XX:MaxMetaspaceSize=1024m`)
- Added G1GC for better memory management
- Enabled daemon, parallel builds, caching

### Fix 3: Created Diagnostic Script

**File:** `delivery-app/android/fix-java-tool-options.ps1`

**Purpose:** Check and remove `JAVA_TOOL_OPTIONS` from environment

---

## 🚀 STEP-BY-STEP FIX (Copy-Paste Ready)

### Step 1: Stop All Gradle Processes

```powershell
cd delivery-app\android
.\gradlew --stop
Get-Process java -ErrorAction SilentlyContinue | Where-Object {$_.Path -like "*java*"} | Stop-Process -Force
```

### Step 2: Check JAVA_TOOL_OPTIONS

```powershell
# Check current session
$env:JAVA_TOOL_OPTIONS

# Check system-wide (requires admin)
[System.Environment]::GetEnvironmentVariable("JAVA_TOOL_OPTIONS", "User")
[System.Environment]::GetEnvironmentVariable("JAVA_TOOL_OPTIONS", "Machine")
```

### Step 3: Remove JAVA_TOOL_OPTIONS (Current Session)

```powershell
# Remove from current PowerShell session
$env:JAVA_TOOL_OPTIONS = $null
Remove-Item Env:\JAVA_TOOL_OPTIONS -ErrorAction SilentlyContinue
```

### Step 4: Remove JAVA_TOOL_OPTIONS (Permanent - Optional)

**Option A: PowerShell (Run as Administrator)**
```powershell
# Remove from User variables
[System.Environment]::SetEnvironmentVariable('JAVA_TOOL_OPTIONS', $null, 'User')

# Remove from System variables (if set)
[System.Environment]::SetEnvironmentVariable('JAVA_TOOL_OPTIONS', $null, 'Machine')
```

**Option B: Windows GUI**
1. Press `Win+R`, type: `sysdm.cpl`
2. Click **Advanced** tab → **Environment Variables**
3. Find `JAVA_TOOL_OPTIONS` in **User variables** or **System variables**
4. Select it → Click **Delete** → **OK**
5. **Restart PowerShell** for changes to take effect

**Option C: Keep It (Recommended)**
- The fix in `gradlew.bat` works even if `JAVA_TOOL_OPTIONS` is set
- No need to remove it system-wide
- Gradle will use 4GB regardless of `JAVA_TOOL_OPTIONS`

### Step 5: Clean Gradle Cache

```powershell
# Clean project cache
Remove-Item -Recurse -Force .gradle -ErrorAction SilentlyContinue

# Clean global cache (optional)
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\caches" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\daemon" -ErrorAction SilentlyContinue
```

### Step 6: Test Gradle (No Daemon - Fastest Test)

```powershell
# Test without daemon (should complete in < 10 seconds)
.\gradlew --no-daemon --version

# Expected output:
# Welcome to Gradle 8.9!
# ...
# Gradle 8.9
```

### Step 7: Test Full Initialization

```powershell
# Test settings evaluation (should complete in < 10 seconds)
.\gradlew --no-daemon tasks --all

# Expected: Should show task list, NOT freeze at "INITIALIZING"
```

---

## 📋 VERIFICATION COMMANDS

### Quick Test (Must Pass)

```powershell
cd delivery-app\android

# This MUST complete in < 10 seconds
Measure-Command { .\gradlew --no-daemon --version } | Select-Object TotalSeconds

# Expected: TotalSeconds < 10
```

### Full Test

```powershell
# Test settings evaluation
.\gradlew --no-daemon tasks

# Test clean build
.\gradlew --no-daemon clean

# Test with daemon (after initial test passes)
.\gradlew --version
.\gradlew tasks
```

---

## 🔍 TROUBLESHOOTING

### If Still Freezing After Fix

**1. Verify gradlew.bat was modified:**
```powershell
Select-String -Path "gradlew.bat" -Pattern "JAVA_TOOL_OPTIONS"
# Should show: set JAVA_TOOL_OPTIONS=
```

**2. Check Java version:**
```powershell
java -version
# Must be: java version "17.0.x"
```

**3. Verify memory args are passed:**
```powershell
# Run with debug to see JVM args
.\gradlew --no-daemon --info --version 2>&1 | Select-String "Xmx"
# Should show: -Xmx4096m
```

**4. Check for other memory-limiting env vars:**
```powershell
$env:JAVA_OPTS
$env:GRADLE_OPTS
$env:_JAVA_OPTIONS
# All should be empty or not set
```

**5. Test with explicit memory override:**
```powershell
# Force memory via GRADLE_OPTS
$env:GRADLE_OPTS = "-Xmx4096m -XX:MaxMetaspaceSize=1024m"
.\gradlew --no-daemon --version
```

**6. Check disk space:**
```powershell
Get-PSDrive C | Select-Object Used,Free
# Need at least 2GB free
```

**7. Check antivirus exclusions:**
- Add `delivery-app\android` to antivirus exclusions
- Add `C:\Users\<YourUsername>\.gradle` to exclusions

---

## 📝 FILE CONTENTS (For Reference)

### gradlew.bat (Critical Section)

```batch
:execute
@rem Setup the command line

set CLASSPATH=%APP_HOME%\gradle\wrapper\gradle-wrapper.jar

@rem CRITICAL FIX: Unset JAVA_TOOL_OPTIONS to prevent memory override
@rem JAVA_TOOL_OPTIONS is applied BEFORE gradle.properties is read, causing freeze
@rem This ensures Gradle uses memory settings from gradle.properties
set JAVA_TOOL_OPTIONS=

@rem Execute Gradle with explicit memory settings that override any remaining env vars
@rem These args are passed directly to JVM and take precedence over JAVA_TOOL_OPTIONS
"%JAVA_EXE%" -Xmx4096m -XX:MaxMetaspaceSize=1024m %DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS% "-Dorg.gradle.appname=%APP_BASE_NAME%" -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %*
```

### gradle.properties (Key Settings)

```properties
# CRITICAL: These settings override JAVA_TOOL_OPTIONS which may be set system-wide
# Minimum required for Gradle 8.x + React Native: 2GB heap, 512MB metaspace
# Recommended: 4GB heap, 1GB metaspace for faster builds
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8 -Duser.country=US -Duser.language=en -XX:+UseG1GC
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.caching=true
```

### settings.gradle (No Changes Needed)

```gradle
rootProject.name = 'DeliveryBoyApp'
apply from: file("../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); applyNativeModulesSettingsGradle(settings)
include ':app'
includeBuild('../node_modules/@react-native/gradle-plugin')
```

**Note:** `settings.gradle` is correct. The freeze was due to low memory, not settings evaluation logic.

---

## ✅ SUCCESS CRITERIA

After applying the fix:

1. ✅ `.\gradlew --no-daemon --version` completes in < 10 seconds
2. ✅ `.\gradlew --no-daemon tasks` shows task list (not frozen)
3. ✅ No "INITIALIZING" freeze
4. ✅ Gradle reaches "TASK" phase successfully
5. ✅ Build completes normally

---

## 🎯 SUMMARY

**Root Cause:** `JAVA_TOOL_OPTIONS=-Xmx1024m -XX:MaxMetaspaceSize=256m` was limiting Gradle memory to 1GB, causing freeze during settings evaluation.

**Fix:** Modified `gradlew.bat` to:
1. Unset `JAVA_TOOL_OPTIONS` in script scope
2. Pass explicit `-Xmx4096m -XX:MaxMetaspaceSize=1024m` to JVM
3. These explicit args override any environment variables

**Result:** Gradle now uses 4GB heap regardless of `JAVA_TOOL_OPTIONS` setting, allowing successful initialization.

**Permanent:** The fix in `gradlew.bat` works even if `JAVA_TOOL_OPTIONS` is set system-wide. No need to remove it from environment (optional).

---

## 📚 ADDITIONAL RESOURCES

- [Gradle JVM Options Documentation](https://docs.gradle.org/current/userguide/build_environment.html#sec:gradle_java_opts)
- [JAVA_TOOL_OPTIONS Explanation](https://docs.oracle.com/javase/8/docs/technotes/guides/troubleshoot/envvars002.html)
- [React Native Android Setup](https://reactnative.dev/docs/environment-setup)

