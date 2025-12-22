# Quick Fix: JAVA_TOOL_OPTIONS Override

## 🚨 Problem
Gradle stuck at "0% INITIALIZING" because `JAVA_TOOL_OPTIONS=-Xmx1024m` limits memory to 1GB.

## ✅ Fix Applied
`gradlew.bat` now unsets `JAVA_TOOL_OPTIONS` and passes `-Xmx4096m` directly to JVM.

## 🚀 Test (Copy-Paste)

```powershell
cd delivery-app\android

# Stop daemons
.\gradlew --stop

# Test (should complete in < 10 seconds)
.\gradlew --no-daemon --version
```

**Expected:** Gradle version info, NOT freeze.

## 📋 Verification

```powershell
# Run automated test
.\test-gradle-fix.ps1
```

## 🔧 If Still Stuck

1. **Check fix is applied:**
   ```powershell
   Select-String -Path "gradlew.bat" -Pattern "JAVA_TOOL_OPTIONS"
   # Should show: set JAVA_TOOL_OPTIONS=
   ```

2. **Remove JAVA_TOOL_OPTIONS from session:**
   ```powershell
   $env:JAVA_TOOL_OPTIONS = $null
   ```

3. **Clean cache:**
   ```powershell
   Remove-Item -Recurse -Force .gradle -ErrorAction SilentlyContinue
   ```

## 📖 Full Documentation
See: `GRADLE_FREEZE_ROOT_CAUSE_FIX.md`

