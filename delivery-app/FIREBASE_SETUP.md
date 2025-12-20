# Firebase Setup for Delivery App

## Issue
The app is showing: "No Firebase App '[DEFAULT]' has been created"

## Solution

Firebase needs to be properly configured. The app will work without Firebase, but push notifications won't work.

### Option 1: Setup Firebase (Recommended for Notifications)

1. **Get google-services.json from Firebase Console**
   - Go to Firebase Console: https://console.firebase.google.com/
   - Create a new project or use existing one
   - Add Android app with package name: `com.deliveryboyapp`
   - Download `google-services.json`

2. **Place google-services.json**
   - Copy `google-services.json` to `delivery-app/android/app/`

3. **Add Google Services Plugin**
   - Open `delivery-app/android/build.gradle`
   - Add to `dependencies`:
     ```gradle
     classpath 'com.google.gms:google-services:4.4.0'
     ```
   - Open `delivery-app/android/app/build.gradle`
   - Add at the bottom:
     ```gradle
     apply plugin: 'com.google.gms.google-services'
     ```

4. **Rebuild the app**
   ```bash
   cd delivery-app
   npx react-native run-android
   ```

### Option 2: Run Without Firebase (Notifications Won't Work)

The app is now configured to handle missing Firebase gracefully. It will:
- Show warnings in console
- Skip notification setup
- Still allow login and order management
- Notifications will not work until Firebase is configured

## Current Status

The app is configured to:
- ✅ Check if Firebase is initialized before using it
- ✅ Handle errors gracefully if Firebase is not available
- ✅ Continue working even without Firebase (just no notifications)

## Testing

1. **Without Firebase**: App should run and show warnings in console
2. **With Firebase**: After adding google-services.json, notifications should work

