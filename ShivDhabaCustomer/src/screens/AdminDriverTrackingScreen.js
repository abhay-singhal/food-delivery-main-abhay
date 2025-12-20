import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView, {Marker} from 'react-native-maps';
import firestoreService from '../services/firestoreService';

const AdminDriverTrackingScreen = ({navigation}) => {
  const [drivers, setDrivers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 28.9845, // Default to Meerut (from backend config)
    longitude: 77.7064,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const mapRef = useRef(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    subscribeToAllDrivers();
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const subscribeToAllDrivers = () => {
    setIsLoading(true);
    unsubscribeRef.current = firestoreService.subscribeToAllDriverLocations(
      (driversData, error) => {
        if (error) {
          console.error('Error receiving driver locations:', error);
          Alert.alert('Error', 'Failed to load driver locations');
          setIsLoading(false);
          return;
        }
        setDrivers(driversData);
        setIsLoading(false);
        setIsRefreshing(false);
        
        // Update map region to show all drivers
        if (Object.keys(driversData).length > 0) {
          updateMapRegion(driversData);
        }
      },
    );
  };

  const updateMapRegion = driversData => {
    const locations = Object.values(driversData).filter(
      driver => driver.latitude && driver.longitude,
    );

    if (locations.length === 0) return;

    const latitudes = locations.map(d => d.latitude);
    const longitudes = locations.map(d => d.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const latDelta = Math.max((maxLat - minLat) * 1.5, 0.01);
    const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.01);

    const newRegion = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.05),
      longitudeDelta: Math.max(lngDelta, 0.05),
    };

    setMapRegion(newRegion);
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 1000);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    subscribeToAllDrivers();
  };

  const getDriverList = () => {
    return Object.values(drivers).filter(
      driver => driver.latitude && driver.longitude,
    );
  };

  const formatTimestamp = timestamp => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading driver locations...</Text>
      </View>
    );
  }

  const driverList = getDriverList();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Drivers</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Icon name="refresh" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <MapView ref={mapRef} style={styles.map} region={mapRegion}>
          {driverList.map((driver, index) => (
            <Marker
              key={driver.driverId}
              coordinate={{
                latitude: driver.latitude,
                longitude: driver.longitude,
              }}
              title={`Driver ${driver.driverId.substring(0, 8)}`}
              description={
                driver.orderId
                  ? `Order: ${driver.orderId.substring(0, 8)}...`
                  : 'No active order'
              }>
              <View style={styles.driverMarker}>
                <Icon name="delivery-dining" size={30} color="#FF6B35" />
                <View style={styles.markerBadge}>
                  <Text style={styles.markerBadgeText}>{index + 1}</Text>
                </View>
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderText}>
            Active Drivers ({driverList.length})
          </Text>
        </View>

        {driverList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="delivery-dining" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No active drivers</Text>
          </View>
        ) : (
          driverList.map((driver, index) => (
            <View key={driver.driverId} style={styles.driverCard}>
              <View style={styles.driverCardHeader}>
                <View style={styles.driverInfo}>
                  <Icon name="person" size={20} color="#FF6B35" />
                  <Text style={styles.driverId}>
                    Driver #{driver.driverId.substring(0, 8)}
                  </Text>
                </View>
                {driver.orderId && (
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderBadgeText}>
                      Order: {driver.orderId.substring(0, 8)}...
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.driverCardBody}>
                <View style={styles.infoRow}>
                  <Icon name="place" size={16} color="#666" />
                  <Text style={styles.infoText}>
                    {driver.latitude.toFixed(6)}, {driver.longitude.toFixed(6)}
                  </Text>
                </View>

                {driver.speed > 0 && (
                  <View style={styles.infoRow}>
                    <Icon name="speed" size={16} color="#666" />
                    <Text style={styles.infoText}>
                      {driver.speed.toFixed(1)} km/h
                    </Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Icon name="access-time" size={16} color="#666" />
                  <Text style={styles.infoText}>
                    Updated {formatTimestamp(driver.updatedAt || driver.timestamp)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
    height: 300,
    backgroundColor: '#FFF',
  },
  map: {
    flex: 1,
  },
  driverMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  markerBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
  },
  listHeader: {
    padding: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  listHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
  driverCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  driverCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverId: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  orderBadgeText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  driverCardBody: {
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default AdminDriverTrackingScreen;


