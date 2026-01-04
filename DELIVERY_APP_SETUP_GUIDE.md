# Delivery Boy App - Setup and Run Guide

## 📋 Overview

The Delivery Boy App is a React Native application for delivery personnel to manage orders, track deliveries, and update order statuses.

## 🚀 Quick Setup

### **Option 1: Create from Customer App Template (Recommended)**

Since the delivery app doesn't exist yet, you can create it by copying the customer app structure:

```bash
# Navigate to project root
cd C:\Users\lenovo\Desktop\food-delivery-main

# Copy customer app structure (if you want to use it as a base)
# Or create a new React Native app
```

### **Option 2: Initialize New React Native App**

```bash
cd delivery-app
npx react-native@latest init DeliveryBoyApp --version 0.73.0
cd DeliveryBoyApp
```

### **Option 3: Manual Setup (Step by Step)**

I'll create the complete delivery app structure for you. Here's what needs to be set up:

---

## 📁 Required Project Structure

```
delivery-app/
├── package.json
├── App.js
├── index.js
├── babel.config.js
├── metro.config.js
├── android/
│   └── (Android native files)
├── src/
│   ├── config/
│   │   └── api.js
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── AvailableOrdersScreen.js
│   │   ├── MyOrdersScreen.js
│   │   ├── OrderDetailScreen.js
│   │   └── DeliveryTrackingScreen.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── orderService.js
│   │   └── locationService.js
│   └── store/
│       ├── store.js
│       └── slices/
│           ├── authSlice.js
│           └── orderSlice.js
└── README.md
```

---

## 🔧 Backend APIs Available

### **Authentication:**
- `POST /api/v1/auth/otp/send` - Send OTP
- `POST /api/v1/auth/otp/verify/delivery` - Verify OTP (Delivery Boy role)

### **Orders:**
- `GET /api/v1/delivery/orders/available` - Get available orders (READY status, unassigned)
- `POST /api/v1/delivery/orders/{orderId}/accept` - Accept an order
- `GET /api/v1/delivery/orders/my-orders` - Get my assigned orders
- `POST /api/v1/delivery/orders/{orderId}/update-location` - Update delivery location
- `POST /api/v1/delivery/orders/{orderId}/deliver` - Mark order as delivered

### **Status:**
- `PUT /api/v1/delivery/status?isAvailable=true&isOnDuty=true` - Update availability

### **Notifications:**
- `PUT /api/v1/delivery/fcm-token?fcmToken=xxx` - Update FCM token

---

## 📝 Next Steps

I can create the complete delivery app for you with:
1. ✅ Complete project structure
2. ✅ All required screens
3. ✅ API integration
4. ✅ Redux store setup
5. ✅ Navigation setup
6. ✅ Location tracking integration
7. ✅ Order management features

Would you like me to create the complete delivery app now?

---

## 🏃 Quick Run (Once Created)

```bash
cd delivery-app
npm install
npm run android
```

---

## ⚙️ Configuration Required

1. **API URL**: Update `src/config/api.js` with backend URL (same as customer app)
2. **Google Maps API Key**: Add to `AndroidManifest.xml` (same key as customer app)
3. **Firebase**: Configure if using FCM notifications

---

## 📱 Features to Implement

- ✅ OTP-based login (Delivery Boy role)
- ✅ View available orders
- ✅ Accept orders
- ✅ View my assigned orders
- ✅ Update delivery location
- ✅ Mark order as delivered
- ✅ COD collection confirmation
- ✅ Location tracking
- ✅ Google Maps navigation
- ✅ Earnings tracking







