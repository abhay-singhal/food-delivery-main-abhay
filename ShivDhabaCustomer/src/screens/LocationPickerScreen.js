import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Geolocation from '@react-native-community/geolocation';

const LocationPickerScreen = ({navigation, route}) => {
  const {onLocationSelect, initialLocation} = route?.params || {};
  const mapRef = useRef(null);
  
  const [selectedLocation, setSelectedLocation] = useState(
    initialLocation || {
      latitude: 28.9845, // Meerut default
      longitude: 77.7064,
    }
  );
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);

  useEffect(() => {
    getCurrentLocation();
    reverseGeocode(selectedLocation.latitude, selectedLocation.longitude);
  }, []);

  const getCurrentLocation = () => {
    setIsGettingCurrentLocation(true);
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        setSelectedLocation({latitude, longitude});
        reverseGeocode(latitude, longitude);
        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            1000,
          );
        }
        setIsGettingCurrentLocation(false);
      },
      error => {
        console.error('Error getting location:', error);
        Alert.alert('Error', 'Could not get your current location. Please select on map.');
        setIsGettingCurrentLocation(false);
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'ShivDhabaFoodDelivery/1.0',
          },
        },
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const handleMapPress = event => {
    const {latitude, longitude} = event.nativeEvent.coordinate;
    setSelectedLocation({latitude, longitude});
    reverseGeocode(latitude, longitude);
  };

  const handleConfirm = () => {
    if (onLocationSelect) {
      onLocationSelect({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        address: address,
      });
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Location</Text>
        <TouchableOpacity onPress={getCurrentLocation}>
          {isGettingCurrentLocation ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Icon name="my-location" size={24} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}>
        <Marker
          coordinate={selectedLocation}
          draggable
          onDragEnd={e => {
            const {latitude, longitude} = e.nativeEvent.coordinate;
            setSelectedLocation({latitude, longitude});
            reverseGeocode(latitude, longitude);
          }}
        />
      </MapView>

      <View style={styles.infoContainer}>
        <View style={styles.addressContainer}>
          <Icon name="place" size={20} color="#FF6B35" />
          <View style={styles.addressTextContainer}>
            <Text style={styles.addressLabel}>Selected Address</Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {address || 'Tap on map to select location'}
            </Text>
          </View>
        </View>
        <Text style={styles.instructionText}>
          Drag the marker or tap on map to change location
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  map: {
    flex: 1,
  },
  infoContainer: {
    backgroundColor: '#FFF',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  addressTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  addressLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  instructionText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#FFF',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    elevation: 4,
  },
  confirmButton: {
    backgroundColor: '#FF6B35',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LocationPickerScreen;


