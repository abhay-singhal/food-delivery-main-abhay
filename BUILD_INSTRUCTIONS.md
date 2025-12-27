# Build Instructions - Android App

## Gradle Cache Issue Workaround

Due to a persistent Gradle cache corruption issue, use the clean build script:

### Quick Build Command

```powershell
cd ShivDhabaCustomer
.\build-android-clean.bat
```

This script will:
1. ✅ Stop Gradle daemon
2. ✅ Clean corrupted transform cache
3. ✅ Build and install the app

### Alternative: Manual Clean Build

If you prefer to build manually:

```powershell
# Stop Gradle
cd ShivDhabaCustomer\android
.\gradlew.bat --stop

# Delete transform cache
Remove-Item -Path "$env:USERPROFILE\.gradle\caches\8.9\transforms" -Recurse -Force -ErrorAction SilentlyContinue

# Build app
cd ..
npx react-native run-android
```

### Why This Is Needed

Gradle 8.9 has a known issue with transform cache metadata files getting corrupted on Windows. The workaround is to delete the transforms folder before each build.

---

**Note:** The first build after cache deletion will take longer as dependencies are downloaded fresh. Subsequent builds will be faster.

