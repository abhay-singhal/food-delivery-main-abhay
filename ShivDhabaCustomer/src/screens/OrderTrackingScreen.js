import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView, {Marker, Polyline} from 'react-native-maps';
import {orderService} from '../services/orderService';
import firestoreService from '../services/firestoreService';

const OrderTrackingScreen = ({navigation, route}) => {
  const {orderId} = route?.params || {};
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const mapRef = useRef(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    fetchOrderDetails();
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [orderId]);

  useEffect(() => {
    if (orderId && order?.status === 'OUT_FOR_DELIVERY') {
      subscribeToDriverLocation();
    }
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [orderId, order?.status]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      const response = await orderService.getOrder(orderId);
      
      // Backend returns ApiResponse: {success: true, message: "...", data: OrderResponse}
      // orderService.getOrder returns response.data which is the ApiResponse object
      const orderData = response?.data || response;
      
      if (!orderData) {
        throw new Error('Order data not found in response');
      }
      
      console.log('Order data received:', JSON.stringify(orderData, null, 2));
      
      setOrder(orderData);
      
      // Set initial map region
      if (orderData.deliveryLatitude && orderData.deliveryLongitude) {
        setMapRegion({
          latitude: orderData.deliveryLatitude,
          longitude: orderData.deliveryLongitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      Alert.alert('Error', error?.message || 'Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToDriverLocation = () => {
    if (!orderId) return;

    unsubscribeRef.current = firestoreService.subscribeToDriverLocation(
      orderId,
      (location, error) => {
        if (error) {
          console.error('Error receiving driver location:', error);
          return;
        }
        if (location) {
          setDriverLocation(location);
          
          // Update map region to show both delivery location and driver location
          if (order?.deliveryLatitude && order?.deliveryLongitude) {
            const latDelta = Math.max(
              Math.abs(location.latitude - order.deliveryLatitude) * 2,
              0.01,
            );
            const lngDelta = Math.max(
              Math.abs(location.longitude - order.deliveryLongitude) * 2,
              0.01,
            );
            
            setMapRegion({
              latitude: (location.latitude + order.deliveryLatitude) / 2,
              longitude: (location.longitude + order.deliveryLongitude) / 2,
              latitudeDelta: Math.max(latDelta, 0.01),
              longitudeDelta: Math.max(lngDelta, 0.01),
            });

            // Animate map to show both locations
            if (mapRef.current) {
              mapRef.current.animateToRegion(
                {
                  latitude: (location.latitude + order.deliveryLatitude) / 2,
                  longitude: (location.longitude + order.deliveryLongitude) / 2,
                  latitudeDelta: Math.max(latDelta, 0.01),
                  longitudeDelta: Math.max(lngDelta, 0.01),
                },
                1000,
              );
            }
          }
        }
      },
    );
  };

  const getStatusColor = status => {
    switch (status) {
      case 'PLACED':
        return '#FFA500';
      case 'ACCEPTED':
        return '#4CAF50';
      case 'PREPARING':
        return '#2196F3';
      case 'READY':
        return '#9C27B0';
      case 'OUT_FOR_DELIVERY':
        return '#FF9800';
      case 'DELIVERED':
        return '#4CAF50';
      default:
        return '#666';
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Tracking</Text>
        <View style={{width: 24}} />
      </View>

      {order && (
        <>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
            <View
              style={[
                styles.statusBadge,
                {backgroundColor: getStatusColor(order.status)},
              ]}>
              <Text style={styles.statusText}>{order.status}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <Text style={styles.sectionContent}>{order.deliveryAddress}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estimated Delivery</Text>
            <Text style={styles.sectionContent}>
              {order.estimatedDeliveryTime || 'Calculating...'}
            </Text>
          </View>

          {order.deliveryLatitude && order.deliveryLongitude && (
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={styles.map}
                region={mapRegion || {
                  latitude: order.deliveryLatitude,
                  longitude: order.deliveryLongitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                showsUserLocation={false}
                showsMyLocationButton={false}>
                {/* Delivery Location Marker */}
                <Marker
                  coordinate={{
                    latitude: order.deliveryLatitude,
                    longitude: order.deliveryLongitude,
                  }}
                  title="Delivery Location"
                  description={order.deliveryAddress}
                  pinColor="#4CAF50">
                  <View style={styles.deliveryMarker}>
                    <Icon name="place" size={30} color="#4CAF50" />
                  </View>
                </Marker>

                {/* Driver Location Marker */}
                {driverLocation && (
                  <Marker
                    coordinate={{
                      latitude: driverLocation.latitude,
                      longitude: driverLocation.longitude,
                    }}
                    title="Driver Location"
                    description="Your order is on the way"
                    anchor={{x: 0.5, y: 0.5}}>
                    <View style={styles.driverMarker}>
                      <Icon name="delivery-dining" size={30} color="#FF6B35" />
                      <View style={styles.driverPulse} />
                    </View>
                  </Marker>
                )}

                {/* Route Line */}
                {driverLocation && (
                  <Polyline
                    coordinates={[
                      {
                        latitude: driverLocation.latitude,
                        longitude: driverLocation.longitude,
                      },
                      {
                        latitude: order.deliveryLatitude,
                        longitude: order.deliveryLongitude,
                      },
                    ]}
                    strokeColor="#FF6B35"
                    strokeWidth={3}
                    lineDashPattern={[5, 5]}
                  />
                )}
              </MapView>
              
              {driverLocation && (
                <View style={styles.locationInfo}>
                  <Text style={styles.locationInfoText}>
                    Driver is {calculateDistance(
                      driverLocation.latitude,
                      driverLocation.longitude,
                      order.deliveryLatitude,
                      order.deliveryLongitude,
                    )} away
                  </Text>
                </View>
              )}
            </View>
          )}
        </>
      )}
    </ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#FF6B35',
    elevation: 8,
    shadowColor: '#FF6B35',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  orderInfo: {
    backgroundColor: '#FFF',
    padding: 22,
    margin: 18,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  statusText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: '#FFF',
    padding: 20,
    marginHorizontal: 18,
    marginBottom: 18,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  sectionContent: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    fontWeight: '500',
  },
  mapContainer: {
    height: 320,
    margin: 18,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  map: {
    flex: 1,
  },
  deliveryMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  driverPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    opacity: 0.3,
    zIndex: -1,
  },
  locationInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 14,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  locationInfoText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});

export default OrderTrackingScreen;


