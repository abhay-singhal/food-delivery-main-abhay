# Quick Start - Build Android App

## ✅ Build Command

Simply run:

```powershell
cd ShivDhabaCustomer
.\build-android-clean.bat
```

This script automatically:
- ✅ Stops Gradle daemon
- ✅ Cleans corrupted cache
- ✅ Builds and installs the app

## 📝 What This Fixes

The script solves the Gradle cache corruption issue by cleaning the transform cache before each build. This is a workaround for a known Gradle 8.9 issue on Windows.

## ⏱️ Build Time

- **First build:** 5-10 minutes (downloads dependencies)
- **Subsequent builds:** 2-5 minutes

## 🔧 Manual Alternative

If you prefer manual steps:

```powershell
# 1. Stop Gradle
cd ShivDhabaCustomer\android
.\gradlew.bat --stop

# 2. Clean cache
Remove-Item -Path "$env:USERPROFILE\.gradle\caches\8.9\transforms" -Recurse -Force -ErrorAction SilentlyContinue

# 3. Build
cd ..
npx react-native run-android
```

## ✅ Prerequisites

- Backend server running on port 8080
- Android device/emulator connected
- Metro bundler can be started automatically (or start manually with `npm start`)

## 🐛 Troubleshooting

If build still fails:
1. Make sure Android device/emulator is connected: `adb devices`
2. Verify backend is running: Check `http://localhost:8080/api/v1/public/menu`
3. Try running the script again (sometimes cache cleanup needs a retry)
4. Check Android Studio is properly configured

---

**Ready to build?** Run `.\build-android-clean.bat` from the `ShivDhabaCustomer` folder!



