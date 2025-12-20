import {NativeModules, NativeEventEmitter, Platform} from 'react-native';

const {LocationTrackingModule} = NativeModules;

class LocationService {
  constructor() {
    this.eventEmitter = LocationTrackingModule
      ? new NativeEventEmitter(LocationTrackingModule)
      : null;
    this.locationListeners = [];
  }

  /**
   * Request location permissions
   */
  async requestPermissions() {
    if (!LocationTrackingModule) {
      throw new Error('LocationTrackingModule is not available');
    }
    return await LocationTrackingModule.requestLocationPermissions();
  }

  /**
   * Check current permission status
   */
  async checkPermissions() {
    if (!LocationTrackingModule) {
      return {
        fineLocation: false,
        coarseLocation: false,
        backgroundLocation: false,
        allGranted: false,
      };
    }
    return await LocationTrackingModule.checkLocationPermissions();
  }

  /**
   * Start location tracking for a delivery order
   * @param {string} orderId - The order ID
   * @param {string} driverId - The driver/user ID
   */
  async startTracking(orderId, driverId) {
    if (!LocationTrackingModule) {
      throw new Error('LocationTrackingModule is not available');
    }
    return await LocationTrackingModule.startLocationTracking(orderId, driverId);
  }

  /**
   * Stop location tracking
   */
  async stopTracking() {
    if (!LocationTrackingModule) {
      throw new Error('LocationTrackingModule is not available');
    }
    return await LocationTrackingModule.stopLocationTracking();
  }

  /**
   * Add listener for location updates
   * @param {function} callback - Callback function receiving location data
   */
  addLocationListener(callback) {
    if (!this.eventEmitter) {
      console.warn('LocationTrackingModule event emitter not available');
      return null;
    }

    const subscription = this.eventEmitter.addListener('locationUpdate', callback);
    this.locationListeners.push(subscription);
    return subscription;
  }

  /**
   * Add listener for location errors
   * @param {function} callback - Callback function receiving error data
   */
  addErrorListener(callback) {
    if (!this.eventEmitter) {
      console.warn('LocationTrackingModule event emitter not available');
      return null;
    }

    const subscription = this.eventEmitter.addListener('locationError', callback);
    this.locationListeners.push(subscription);
    return subscription;
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    this.locationListeners.forEach(subscription => subscription.remove());
    this.locationListeners = [];
  }
}

export default new LocationService();


