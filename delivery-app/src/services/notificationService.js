import firebaseApp from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import {Platform} from 'react-native';
import api from '../config/api';

// Ensure Firebase is initialized
try {
  if (!firebaseApp.apps.length) {
    console.log('📱 Initializing Firebase...');
    // Firebase should auto-initialize from google-services.json
  }
} catch (error) {
  console.warn('⚠️ Firebase initialization check:', error.message);
}

class NotificationService {
  constructor() {
    this.fcmToken = null;
    this.notificationListener = null;
    this.backgroundMessageListener = null;
  }

  /**
   * Request notification permissions
   */
  async requestPermission() {
    try {
      // Check if Firebase is initialized
      if (!firebaseApp.apps.length) {
        console.warn('⚠️ Firebase not initialized, skipping notification permission request');
        return false;
      }

      if (Platform.OS === 'android') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('✅ Notification permission granted');
          return true;
        } else {
          console.log('❌ Notification permission denied');
          return false;
        }
      } else {
        // iOS
        const authStatus = await messaging().requestPermission();
        return authStatus === messaging.AuthorizationStatus.AUTHORIZED;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Get FCM token
   */
  async getFcmToken() {
    try {
      // Check if Firebase is initialized
      if (!firebaseApp.apps.length) {
        console.warn('⚠️ Firebase not initialized, cannot get FCM token');
        return null;
      }

      if (!this.fcmToken) {
        this.fcmToken = await messaging().getToken();
        console.log('📱 FCM Token:', this.fcmToken);
      }
      return this.fcmToken;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Register FCM token with backend
   */
  async registerFcmToken() {
    try {
      const token = await this.getFcmToken();
      if (!token) {
        console.warn('⚠️ No FCM token available');
        return false;
      }

      const response = await api.put('/delivery/fcm-token', null, {
        params: {fcmToken: token},
      });

      if (response.data.success) {
        console.log('✅ FCM token registered successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error registering FCM token:', error);
      return false;
    }
  }

  /**
   * Set delivery boy as on duty (logged in)
   */
  async setOnDuty(isOnDuty = true) {
    try {
      const response = await api.put('/delivery/status', null, {
        params: {
          isAvailable: true,
          isOnDuty: isOnDuty,
        },
      });

      if (response.data.success) {
        console.log(`✅ Delivery boy ${isOnDuty ? 'on duty' : 'off duty'}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating on duty status:', error);
      return false;
    }
  }

  /**
   * Set delivery boy as off duty (logged out)
   */
  async setOffDuty() {
    return this.setOnDuty(false);
  }

  /**
   * Initialize notification service
   * Call this when delivery boy logs in
   */
  async initialize() {
    try {
      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.warn('⚠️ Notification permission not granted');
        return false;
      }

      // Get and register FCM token
      await this.registerFcmToken();

      // Set delivery boy as on duty
      await this.setOnDuty(true);

      console.log('✅ Notification service initialized');
      return true;
    } catch (error) {
      console.error('Error initializing notification service:', error);
      return false;
    }
  }

  /**
   * Cleanup notification service
   * Call this when delivery boy logs out
   */
  async cleanup() {
    try {
      // Set delivery boy as off duty
      await this.setOffDuty();

      // Remove listeners
      if (this.notificationListener) {
        this.notificationListener();
        this.notificationListener = null;
      }

      if (this.backgroundMessageHandler) {
        this.backgroundMessageHandler();
        this.backgroundMessageHandler = null;
      }

      this.fcmToken = null;
      console.log('✅ Notification service cleaned up');
    } catch (error) {
      console.error('Error cleaning up notification service:', error);
    }
  }

  /**
   * Setup notification listeners
   */
  setupListeners(onNotificationReceived) {
    try {
      // Check if Firebase is initialized
      if (!firebaseApp.apps.length) {
        console.warn('⚠️ Firebase not initialized, cannot setup notification listeners');
        return;
      }

      // Foreground notification handler
      this.notificationListener = messaging().onMessage(async remoteMessage => {
        console.log('📬 Notification received in foreground:', remoteMessage);
        if (onNotificationReceived) {
          onNotificationReceived(remoteMessage);
        }
      });

      // Note: Background message handler is registered in index.js
      // It must be registered at the root level before the app starts

      // Notification opened handler (when user taps notification)
      messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('📬 Notification opened app:', remoteMessage);
        if (onNotificationReceived) {
          onNotificationReceived(remoteMessage, true);
        }
      });

      // Check if app was opened from a notification
      messaging()
        .getInitialNotification()
        .then(remoteMessage => {
          if (remoteMessage) {
            console.log('📬 App opened from notification:', remoteMessage);
            if (onNotificationReceived) {
              onNotificationReceived(remoteMessage, true);
            }
          }
        });
    } catch (error) {
      console.error('Error setting up notification listeners:', error);
    }
  }

  /**
   * Remove notification listeners
   */
  removeListeners() {
    if (this.notificationListener) {
      this.notificationListener();
      this.notificationListener = null;
    }
  }
}

export default new NotificationService();

