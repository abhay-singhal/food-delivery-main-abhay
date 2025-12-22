# Quick Fix: Gradle Freeze on Windows

## 🚀 Fast Solution (3 Steps)

### Step 1: Stop Gradle & Clean Cache
```powershell
cd delivery-app\android
.\gradlew --stop
Remove-Item -Recurse -Force .gradle -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\caches" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\daemon" -ErrorAction SilentlyContinue
```

### Step 2: Verify Java 17
```powershell
java -version
# Should show: java version "17.0.x"
```

### Step 3: Test Gradle
```powershell
.\gradlew --version
```

---

## ✅ Files Already Fixed

- ✓ `gradle-wrapper.properties` - Network timeout increased to 60s
- ✓ `gradle.properties` - Memory increased to 4GB, daemon enabled

---

## 🔧 If Still Stuck

Run the automated fix script:
```powershell
cd delivery-app\android
.\fix-gradle-freeze.ps1
```

Or check:
1. Java 17 installed? → Download from https://adoptium.net/
2. JAVA_HOME set? → `$env:JAVA_HOME`
3. Firewall blocking? → Test: `Test-NetConnection services.gradle.org -Port 443`
4. Disk space? → Need at least 2GB free

---

## 📋 What Was Fixed

**Root Cause:** Gradle daemon was disabled + low memory (2GB) + short network timeout (10s)

**Solution:**
- Enabled daemon with 4GB heap memory
- Increased network timeout to 60 seconds
- Enabled parallel builds and caching
- Cleaned corrupted cache

---

For detailed explanation, see: `GRADLE_FREEZE_FIX.md`

