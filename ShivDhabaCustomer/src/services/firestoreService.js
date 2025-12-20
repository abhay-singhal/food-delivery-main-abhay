import firestore from '@react-native-firebase/firestore';

class FirestoreService {
  /**
   * Update driver location in Firestore
   * @param {string} driverId - The driver/user ID
   * @param {string} orderId - The order ID (optional)
   * @param {object} location - Location data {latitude, longitude, accuracy, speed, heading, timestamp}
   */
  async updateDriverLocation(driverId, orderId, location) {
    try {
      const locationData = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || 0,
        speed: location.speed || 0,
        heading: location.heading || 0,
        timestamp: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      // Update driver location collection
      await firestore()
        .collection('driverLocations')
        .doc(driverId)
        .set(
          {
            ...locationData,
            orderId: orderId || null,
            active: orderId ? true : false,
            driverId: driverId,
          },
          {merge: true},
        );

      // Update order with driver location if orderId is provided
      if (orderId) {
        await firestore()
          .collection('orders')
          .doc(orderId)
          .set(
            {
              driverLocation: locationData,
              driverId: driverId,
              lastLocationUpdate: firestore.FieldValue.serverTimestamp(),
            },
            {merge: true},
          );
      }

      return {success: true};
    } catch (error) {
      console.error('Error updating driver location:', error);
      throw error;
    }
  }

  /**
   * Listen to driver location updates for a specific order
   * @param {string} orderId - The order ID
   * @param {function} callback - Callback function receiving location updates
   * @returns {function} Unsubscribe function
   */
  subscribeToDriverLocation(orderId, callback) {
    if (!orderId) {
      console.warn('OrderId is required for driver location subscription');
      return () => {};
    }

    const unsubscribe = firestore()
      .collection('orders')
      .doc(orderId)
      .onSnapshot(
        snapshot => {
          if (snapshot.exists) {
            const data = snapshot.data();
            if (data.driverLocation) {
              callback({
                latitude: data.driverLocation.latitude,
                longitude: data.driverLocation.longitude,
                accuracy: data.driverLocation.accuracy,
                speed: data.driverLocation.speed,
                heading: data.driverLocation.heading,
                timestamp: data.driverLocation.timestamp,
                driverId: data.driverId,
              });
            }
          }
        },
        error => {
          console.error('Error listening to driver location:', error);
          callback(null, error);
        },
      );

    return unsubscribe;
  }

  /**
   * Get current driver location for an order
   * @param {string} orderId - The order ID
   * @returns {Promise<object|null>} Location data or null
   */
  async getDriverLocation(orderId) {
    try {
      const doc = await firestore().collection('orders').doc(orderId).get();
      if (doc.exists) {
        const data = doc.data();
        if (data.driverLocation) {
          return {
            latitude: data.driverLocation.latitude,
            longitude: data.driverLocation.longitude,
            accuracy: data.driverLocation.accuracy,
            speed: data.driverLocation.speed,
            heading: data.driverLocation.heading,
            timestamp: data.driverLocation.timestamp,
            driverId: data.driverId,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting driver location:', error);
      throw error;
    }
  }

  /**
   * Subscribe to all active driver locations (for admin)
   * @param {function} callback - Callback function receiving all driver locations
   * @returns {function} Unsubscribe function
   */
  subscribeToAllDriverLocations(callback) {
    const unsubscribe = firestore()
      .collection('driverLocations')
      .where('active', '==', true)
      .onSnapshot(
        snapshot => {
          const drivers = {};
          snapshot.forEach(doc => {
            const data = doc.data();
            drivers[doc.id] = {
              driverId: doc.id,
              orderId: data.orderId,
              latitude: data.latitude,
              longitude: data.longitude,
              accuracy: data.accuracy,
              speed: data.speed,
              heading: data.heading,
              timestamp: data.timestamp,
              updatedAt: data.updatedAt,
            };
          });
          callback(drivers);
        },
        error => {
          console.error('Error listening to all driver locations:', error);
          callback({}, error);
        },
      );

    return unsubscribe;
  }

  /**
   * Get all active driver locations (for admin)
   * @returns {Promise<object>} Object with driverId as key and location data as value
   */
  async getAllDriverLocations() {
    try {
      const snapshot = await firestore()
        .collection('driverLocations')
        .where('active', '==', true)
        .get();

      const drivers = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        drivers[doc.id] = {
          driverId: doc.id,
          orderId: data.orderId,
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          speed: data.speed,
          heading: data.heading,
          timestamp: data.timestamp,
          updatedAt: data.updatedAt,
        };
      });
      return drivers;
    } catch (error) {
      console.error('Error getting all driver locations:', error);
      throw error;
    }
  }

  /**
   * Mark driver as inactive (when delivery is complete)
   * @param {string} driverId - The driver/user ID
   */
  async setDriverInactive(driverId) {
    try {
      await firestore()
        .collection('driverLocations')
        .doc(driverId)
        .update({
          active: false,
          orderId: null,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      return {success: true};
    } catch (error) {
      console.error('Error setting driver inactive:', error);
      throw error;
    }
  }
}

export default new FirestoreService();


