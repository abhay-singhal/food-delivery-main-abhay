# Google Maps API Key Setup Guide

This guide will help you set up the Google Maps API key for the location picker and map features in the app.

## Step 1: Get a Google Maps API Key

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project (or select existing)**
   - Click on the project dropdown at the top
   - Click "New Project"
   - Enter project name: "ShivDhaba Food Delivery" (or any name)
   - Click "Create"

3. **Enable Required APIs**
   - In the left sidebar, go to "APIs & Services" > "Library"
   - Search for and enable these APIs:
     - **Maps SDK for Android** (Required for react-native-maps)
     - **Geocoding API** (Optional, for reverse geocoding addresses)
     - **Places API** (Optional, for place search)

4. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

5. **Restrict API Key (Recommended for Production)**
   - Click on the API key you just created
   - Under "Application restrictions":
     - Select "Android apps"
     - Click "Add an item"
     - Enter package name: `com.shivdhabacustomer`
     - Get SHA-1 certificate fingerprint (see below)
   - Under "API restrictions":
     - Select "Restrict key"
     - Select only: "Maps SDK for Android", "Geocoding API", "Places API"
   - Click "Save"

## Step 2: Get SHA-1 Certificate Fingerprint

### For Debug Build (Development):
```bash
cd ShivDhabaCustomer/android
./gradlew signingReport
```

Look for the SHA1 value under `Variant: debug` > `Config: debug`

**OR** on Windows:
```powershell
cd ShivDhabaCustomer\android
.\gradlew signingReport
```

### For Release Build (Production):
You'll need the SHA-1 from your release keystore:
```bash
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
```

## Step 3: Add API Key to AndroidManifest.xml

1. Open: `ShivDhabaCustomer/android/app/src/main/AndroidManifest.xml`

2. Find this line:
   ```xml
   <meta-data
     android:name="com.google.android.geo.API_KEY"
     android:value="YOUR_GOOGLE_MAPS_API_KEY_HERE"/>
   ```

3. Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key:
   ```xml
   <meta-data
     android:name="com.google.android.geo.API_KEY"
     android:value="AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"/>
   ```

## Step 4: Rebuild the App

After adding the API key, rebuild the app:

```bash
cd ShivDhabaCustomer
npx react-native run-android
```

## Troubleshooting

### Error: "API key not found"
- Make sure you've replaced `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual key
- Check that the API key is correctly placed in AndroidManifest.xml
- Rebuild the app after making changes

### Error: "This API key is not authorized"
- Make sure you've enabled "Maps SDK for Android" in Google Cloud Console
- Check that your package name matches: `com.shivdhabacustomer`
- Verify SHA-1 fingerprint is correctly added in API key restrictions
- Wait a few minutes after making changes (Google may take time to propagate)

### Maps not showing / Blank map
- Check that billing is enabled in Google Cloud Console (required for Maps API)
- Verify API key restrictions allow your app
- Check Android logs: `adb logcat | grep -i maps`

## Free Tier / Billing

Google Maps Platform offers a free tier:
- **$200 free credit per month**
- This covers approximately:
  - 28,000 map loads per month
  - 40,000 geocoding requests per month

For a small food delivery app, this should be sufficient. You'll need to:
1. Enable billing in Google Cloud Console
2. Set up a payment method (won't be charged unless you exceed free tier)

## Alternative: Use OpenStreetMap (Free, No API Key)

If you prefer not to use Google Maps, you can use OpenStreetMap which is free and doesn't require an API key. However, this would require changing the map library in the code.

## Quick Setup (Minimal Steps)

1. Go to: https://console.cloud.google.com/
2. Create/Select project
3. Enable "Maps SDK for Android"
4. Create API Key
5. Copy API key
6. Paste in `AndroidManifest.xml` replacing `YOUR_GOOGLE_MAPS_API_KEY_HERE`
7. Rebuild app

---

**Note:** Keep your API key secure. Never commit it to public repositories. Consider using environment variables or build config files for production.




