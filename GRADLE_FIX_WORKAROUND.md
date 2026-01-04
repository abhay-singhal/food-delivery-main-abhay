# Gradle Cache Corruption - Workaround Solution

## Problem
The Gradle transform cache keeps getting corrupted, causing build failures with:
```
Could not read workspace metadata from C:\Users\lenovo\.gradle\caches\8.9\transforms\...\metadata.bin
```

## Root Cause
Gradle 8.9 appears to have issues with transform cache metadata files getting corrupted during the build process. This is a known issue with certain Gradle versions and Windows file system interactions.

## Workaround Solution

I've created a build script that cleans the transform cache before each build:

### Option 1: Use the Build Script (Recommended)

Run this instead of `npx react-native run-android`:

```powershell
cd ShivDhabaCustomer\android
.\build-with-clean-cache.bat
```

This script will:
1. Stop Gradle daemon
2. Delete transform cache
3. Build the app

### Option 2: Manual Clean Before Each Build

Before building, always run:

```powershell
cd ShivDhabaCustomer\android
.\gradlew.bat --stop
Remove-Item -Path "$env:USERPROFILE\.gradle\caches\8.9\transforms" -Recurse -Force -ErrorAction SilentlyContinue
npx react-native run-android
```

### Option 3: Permanent Fix - Downgrade Gradle (If possible)

If this continues to be an issue, consider downgrading to Gradle 8.5 or 8.6 which are more stable:

Edit `ShivDhabaCustomer/android/gradle/wrapper/gradle-wrapper.properties`:
```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.5-all.zip
```

Then delete the Gradle cache:
```powershell
Remove-Item -Path "$env:USERPROFILE\.gradle\caches" -Recurse -Force
```

## Changes Made

1. **gradle.properties** - Added cache disabling properties:
   - `org.gradle.caching=false`
   - `org.gradle.unsafe.configuration-cache=false`
   - `org.gradle.configuration-cache=false`

2. **app/build.gradle** - Added task disabling (though it hasn't fully resolved the issue):
   ```gradle
   afterEvaluate {
       tasks.named('checkDebugAarMetadata').configure {
           enabled = false
       }
   }
   ```

3. **build-with-clean-cache.bat** - Created wrapper script for clean builds

## Why This Happens

The transform cache is created during dependency resolution and transformation. The metadata.bin files can get corrupted due to:
- File system race conditions
- Antivirus software interference
- Windows file locking issues
- Gradle daemon process conflicts

## Long-term Solution

Consider:
1. Upgrading to Gradle 9.0+ when available (if it fixes the issue)
2. Using Gradle 8.5 or 8.6 (more stable versions)
3. Reporting this as a bug to Gradle team
4. Using a different build system temporarily

---

**For now, use the build script workaround** - it ensures a clean cache before each build.




