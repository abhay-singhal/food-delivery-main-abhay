import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView, {Marker} from 'react-native-maps';
import locationService from '../services/locationService';
import firestoreService from '../services/firestoreService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DeliveryLocationTrackingScreen = ({navigation, route}) => {
  const {orderId} = route?.params || {};
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [driverId, setDriverId] = useState(null);
  const locationSubscriptionRef = useRef(null);
  const errorSubscriptionRef = useRef(null);

  useEffect(() => {
    initializeTracking();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isTracking && driverId && orderId) {
      startLocationUpdates();
    } else {
      stopLocationUpdates();
    }
    return () => {
      stopLocationUpdates();
    };
  }, [isTracking, driverId, orderId]);

  const initializeTracking = async () => {
    try {
      setIsLoading(true);
      
      // Get driver ID from stored user data
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setDriverId(user.id?.toString() || user.mobileNumber);
      }

      // Check permissions
      const permissions = await locationService.checkPermissions();
      setPermissionsGranted(permissions.allGranted);

      if (!permissions.allGranted) {
        Alert.alert(
          'Location Permission Required',
          'Please grant location permissions to track your delivery location.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Grant',
              onPress: requestPermissions,
            },
          ],
        );
      }
    } catch (error) {
      console.error('Error initializing tracking:', error);
      Alert.alert('Error', 'Failed to initialize location tracking');
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      const granted = await locationService.requestPermissions();
      if (granted) {
        const permissions = await locationService.checkPermissions();
        setPermissionsGranted(permissions.allGranted);
        if (permissions.allGranted) {
          Alert.alert('Success', 'Location permissions granted');
        } else {
          Alert.alert(
            'Permissions Required',
            'Please grant all location permissions including background location.',
          );
        }
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request permissions');
    }
  };

  const startLocationUpdates = () => {
    if (!driverId || !orderId) {
      Alert.alert('Error', 'Driver ID or Order ID is missing');
      return;
    }

    // Start native location tracking service
    locationService
      .startTracking(orderId, driverId)
      .then(() => {
        console.log('Native location tracking started');
      })
      .catch(error => {
        console.error('Error starting native tracking:', error);
        Alert.alert('Error', 'Failed to start location tracking');
      });

    // Listen to location updates from native service
    locationSubscriptionRef.current = locationService.addLocationListener(
      locationData => {
        handleLocationUpdate(locationData);
      },
    );

    // Listen to errors
    errorSubscriptionRef.current = locationService.addErrorListener(error => {
      console.error('Location error:', error);
      Alert.alert('Location Error', error.error || 'Unknown error');
    });
  };

  const stopLocationUpdates = () => {
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
      locationSubscriptionRef.current = null;
    }
    if (errorSubscriptionRef.current) {
      errorSubscriptionRef.current.remove();
      errorSubscriptionRef.current = null;
    }
    locationService.stopTracking().catch(error => {
      console.error('Error stopping tracking:', error);
    });
  };

  const handleLocationUpdate = async locationData => {
    try {
      setCurrentLocation({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        speed: locationData.speed,
        heading: locationData.heading,
        timestamp: locationData.timestamp,
      });

      // Update Firestore with location
      await firestoreService.updateDriverLocation(
        driverId,
        orderId,
        locationData,
      );
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const toggleTracking = async () => {
    if (!permissionsGranted) {
      Alert.alert(
        'Permissions Required',
        'Please grant location permissions first.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Grant',
            onPress: requestPermissions,
          },
        ],
      );
      return;
    }

    if (!driverId || !orderId) {
      Alert.alert('Error', 'Driver ID or Order ID is missing');
      return;
    }

    setIsTracking(!isTracking);
  };

  const stopTracking = async () => {
    setIsTracking(false);
    await firestoreService.setDriverInactive(driverId);
    Alert.alert('Success', 'Location tracking stopped');
  };

  const cleanup = () => {
    stopLocationUpdates();
    locationService.removeAllListeners();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Location Tracking</Text>
        <View style={{width: 24}} />
      </View>

      <View style={styles.mapContainer}>
        {currentLocation ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            region={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            followsUserLocation={isTracking}>
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title="Your Location"
              description="Sharing with customer">
              <View style={styles.markerContainer}>
                <Icon name="my-location" size={30} color="#FF6B35" />
                {isTracking && <View style={styles.pulse} />}
              </View>
            </Marker>
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Icon name="map" size={64} color="#CCC" />
            <Text style={styles.mapPlaceholderText}>
              {permissionsGranted
                ? 'Waiting for location...'
                : 'Location permission required'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoCard}>
          <Icon
            name={isTracking ? 'location-on' : 'location-off'}
            size={24}
            color={isTracking ? '#4CAF50' : '#999'}
          />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Tracking Status</Text>
            <Text style={styles.infoValue}>
              {isTracking ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {currentLocation && (
          <>
            <View style={styles.infoCard}>
              <Icon name="gps-fixed" size={24} color="#2196F3" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Accuracy</Text>
                <Text style={styles.infoValue}>
                  {currentLocation.accuracy?.toFixed(0) || 'N/A'}m
                </Text>
              </View>
            </View>

            {currentLocation.speed > 0 && (
              <View style={styles.infoCard}>
                <Icon name="speed" size={24} color="#FF9800" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Speed</Text>
                  <Text style={styles.infoValue}>
                    {currentLocation.speed?.toFixed(1) || '0'} km/h
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        {orderId && (
          <View style={styles.infoCard}>
            <Icon name="receipt" size={24} color="#9C27B0" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Order ID</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {orderId.substring(0, 16)}...
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        {!isTracking ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={toggleTracking}
            disabled={!permissionsGranted}>
            <Icon name="play-arrow" size={24} color="#FFF" />
            <Text style={styles.buttonText}>Start Tracking</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={stopTracking}>
            <Icon name="stop" size={24} color="#FFF" />
            <Text style={styles.buttonText}>Stop Tracking</Text>
          </TouchableOpacity>
        )}

        {!permissionsGranted && (
          <TouchableOpacity
            style={[styles.button, styles.permissionButton]}
            onPress={requestPermissions}>
            <Icon name="lock-open" size={24} color="#FFF" />
            <Text style={styles.buttonText}>Grant Permissions</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FF6B35',
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  mapContainer: {
    height: 400,
    backgroundColor: '#FFF',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  mapPlaceholderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    opacity: 0.3,
    zIndex: -1,
  },
  infoContainer: {
    padding: 15,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  infoTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonContainer: {
    padding: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  permissionButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default DeliveryLocationTrackingScreen;


