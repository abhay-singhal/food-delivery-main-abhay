/**
 * @format
 */

import {AppRegistry} from 'react-native';
import firebaseApp from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import {name as appName} from './app.json';

// Initialize Firebase (auto-initializes if google-services.json is present)
// React Native Firebase auto-initializes, but we check to be safe
try {
  if (!firebaseApp.apps.length) {
    // Firebase should auto-initialize from google-services.json
    // If not, we'll get an error which we'll catch
    console.log('📱 Firebase apps:', firebaseApp.apps.length);
  } else {
    console.log('✅ Firebase already initialized');
  }
} catch (error) {
  console.warn('⚠️ Firebase initialization note:', error.message);
  // Firebase should auto-initialize from google-services.json
}

// Register background handler for Firebase Cloud Messaging
// Only register if Firebase is available
try {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('📬 Message handled in the background!', remoteMessage);
  });
} catch (error) {
  console.warn('⚠️ Could not register background message handler:', error.message);
}

// Register app component
AppRegistry.registerComponent(appName, () => App);

