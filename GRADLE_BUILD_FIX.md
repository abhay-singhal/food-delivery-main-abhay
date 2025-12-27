# Gradle Build Fix - Corrupted Cache Issue

## Problem
Build failed with error:
```
Could not read workspace metadata from C:\Users\lenovo\.gradle\caches\8.9\transforms\1b6851095e3d9acd662ec71adffcee2c\metadata.bin
```

This is caused by corrupted Gradle cache files.

## Solution Steps (COMPLETED ✅)

### Step 1: Stop Gradle Daemon
**Important:** The Gradle daemon locks cache files, so we need to stop it first:
```powershell
cd ShivDhabaCustomer\android
.\gradlew.bat --stop
```

### Step 2: Clean Gradle Cache (Already Done ✅)
After stopping the daemon, cleaned the corrupted Gradle transforms cache:
```powershell
Remove-Item -Path "$env:USERPROFILE\.gradle\caches\8.9\transforms" -Recurse -Force
```

### Step 3: Clean Project Build (Already Done ✅)
```powershell
cd ShivDhabaCustomer\android
.\gradlew.bat clean
```

**Result:** BUILD SUCCESSFUL! ✅

### Step 2: Clean Project Build Folders

Run these commands in PowerShell:

```powershell
# Navigate to project directory
cd C:\Users\lenovo\Desktop\food-delivery-main

# Clean Android build folders
cd ShivDhabaCustomer\android
.\gradlew.bat clean

# Or manually delete build folders
Remove-Item -Path "ShivDhabaCustomer\android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "ShivDhabaCustomer\android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "ShivDhabaCustomer\android\build" -Recurse -Force -ErrorAction SilentlyContinue
```

### Step 3: Invalidate Gradle Cache (If Step 2 doesn't work)

If the build still fails, try invalidating all Gradle caches:

```powershell
# Clean all Gradle caches (this will download dependencies again)
Remove-Item -Path "$env:USERPROFILE\.gradle\caches" -Recurse -Force -ErrorAction SilentlyContinue

# Or just clean the problematic transforms folder
Remove-Item -Path "$env:USERPROFILE\.gradle\caches\8.9\transforms" -Recurse -Force -ErrorAction SilentlyContinue
```

### Step 4: Rebuild Project

After cleaning, try building again:

```powershell
cd ShivDhabaCustomer
npx react-native run-android
```

## Alternative: Manual Clean and Rebuild

If the above doesn't work, try this complete clean:

```powershell
# 1. Stop Metro bundler if running (Ctrl+C)

# 2. Clean React Native cache
cd ShivDhabaCustomer
npx react-native start --reset-cache

# 3. In a new terminal, clean Android build
cd ShivDhabaCustomer\android
.\gradlew.bat clean
.\gradlew.bat cleanBuildCache

# 4. Delete node_modules and reinstall (if needed)
cd ..
Remove-Item -Path "node_modules" -Recurse -Force
npm install

# 5. Rebuild
npx react-native run-android
```

## Quick Fix Command

Run this single command to clean everything:

```powershell
cd C:\Users\lenovo\Desktop\food-delivery-main\ShivDhabaCustomer\android; .\gradlew.bat clean; cd ..; npx react-native run-android
```

## Verification

After cleaning, the build should:
1. Download fresh dependencies
2. Rebuild all modules
3. Complete successfully

If you still get errors, check:
- Java version (should be 17+)
- Android SDK is properly installed
- Android Studio is set up correctly

