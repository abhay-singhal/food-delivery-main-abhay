# 🚀 Running Both Apps - Command Reference

## Quick Start Guide

### 📱 Customer App (ShivDhabaCustomer)

| Terminal | Command | Purpose |
|----------|---------|---------|
| **Terminal 1** | `cd ShivDhabaCustomer`<br>`npm start` | Start Metro Bundler on port **8081** |
| **Terminal 2** | `cd ShivDhabaCustomer`<br>`npx react-native run-android` | Build & Install Customer App |

**Or use batch file:**
- Double-click `ShivDhabaCustomer/start-metro.bat` (Terminal 1)
- Double-click `ShivDhabaCustomer/run-android.bat` (Terminal 2)

---

### 🚚 Delivery Boy App (delivery-app)

| Terminal | Command | Purpose |
|----------|---------|---------|
| **Terminal 1** | `cd delivery-app`<br>`npm start` | Start Metro Bundler on port **8082** |
| **Terminal 2** | `cd delivery-app`<br>`npx react-native run-android` | Build & Install Delivery App |

**Or use batch file:**
- Double-click `delivery-app/start-metro.bat` (Terminal 1)
- Double-click `delivery-app/run-android.bat` (Terminal 2)

---

## 📊 Complete Setup Table

### Running Customer App Only

| Step | Terminal | Command | Port |
|------|----------|---------|------|
| 1. Start Metro | Terminal 1 | `cd ShivDhabaCustomer`<br>`npm start` | 8081 |
| 2. Build & Run | Terminal 2 | `cd ShivDhabaCustomer`<br>`npx react-native run-android` | - |

### Running Delivery App Only

| Step | Terminal | Command | Port |
|------|----------|---------|------|
| 1. Start Metro | Terminal 1 | `cd delivery-app`<br>`npm start` | 8082 |
| 2. Build & Run | Terminal 2 | `cd delivery-app`<br>`npx react-native run-android` | - |

### Running Both Apps Simultaneously

| App | Terminal 1 (Metro) | Terminal 2 (Build) | Port |
|-----|-------------------|-------------------|------|
| **Customer** | `cd ShivDhabaCustomer`<br>`npm start` | `cd ShivDhabaCustomer`<br>`npx react-native run-android` | 8081 |
| **Delivery** | `cd delivery-app`<br>`npm start` | `cd delivery-app`<br>`npx react-native run-android` | 8082 |

**Note:** You'll need **4 terminals total** to run both apps:
- Terminal 1: Customer Metro (8081)
- Terminal 2: Customer Build
- Terminal 3: Delivery Metro (8082)
- Terminal 4: Delivery Build

---

## 🔧 Alternative: Using Batch Files

### Customer App
1. **Terminal 1:** Run `ShivDhabaCustomer/start-metro.bat`
2. **Terminal 2:** Run `ShivDhabaCustomer/run-android.bat`

### Delivery App
1. **Terminal 1:** Run `delivery-app/start-metro.bat`
2. **Terminal 2:** Run `delivery-app/run-android.bat`

---

## 📝 Important Notes

1. **Metro must be running** before building the app
2. **Each app needs its own Metro instance** on different ports
3. **Keep Metro terminals open** while using the apps
4. **Port conflicts:** If you see "port already in use", the other app's Metro is running

---

## 🛑 Stopping Apps

| To Stop | Command |
|---------|---------|
| Metro Server | Press `Ctrl + C` in Metro terminal |
| Android App | Close the app on device or uninstall |

---

## ✅ Verification

After starting Metro, you should see:
```
Metro waiting on exp://192.168.x.x:8081
```

For delivery app:
```
Metro waiting on exp://192.168.x.x:8082
```

