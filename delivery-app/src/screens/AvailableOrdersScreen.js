import React, {useEffect, useRef} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchAvailableOrders, acceptOrder} from '../store/slices/orderSlice';
import {authService} from '../services/authService';
import notificationService from '../services/notificationService';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AvailableOrdersScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {availableOrders, isLoading, error} = useSelector(state => state.order);
  const {user} = useSelector(state => state.auth);
  const midnightCheckInterval = useRef(null);

  useEffect(() => {
    loadOrders();
    
    // Setup notification listener
    notificationService.setupListeners((remoteMessage, openedFromNotification) => {
      const notification = remoteMessage.notification;
      if (notification) {
        const title = notification.title || 'New Order';
        const body = notification.body || 'You have a new order available';
        
        // Show alert
        Alert.alert(
          title,
          body,
          [
            {
              text: 'View Orders',
              onPress: () => {
                loadOrders(); // Refresh orders list
                if (openedFromNotification) {
                  // If opened from notification, navigate to available orders
                  navigation.navigate('AvailableOrders');
                }
              },
            },
            {text: 'OK'},
          ],
          {cancelable: false}
        );
        
        // Refresh orders list when notification is received
        loadOrders();
      }
    });
    
    // Start periodic check for midnight auto-logout
    midnightCheckInterval.current = authService.startMidnightLogoutCheck(() => {
      Alert.alert(
        'Session Expired',
        'Your session has expired at midnight. Please login again.',
        [{text: 'OK', onPress: () => navigation.replace('Login')}]
      );
    });
    
    // Cleanup on unmount
    return () => {
      notificationService.removeListeners();
      if (midnightCheckInterval.current) {
        clearInterval(midnightCheckInterval.current);
      }
    };
  }, []);

  const loadOrders = () => {
    dispatch(fetchAvailableOrders()).then((result) => {
      if (result.type === 'order/fetchAvailableOrders/fulfilled') {
        console.log('✅ Available orders loaded:', result.payload?.length || 0);
      } else if (result.type === 'order/fetchAvailableOrders/rejected') {
        console.log('❌ Failed to load orders:', result.payload);
      }
    });
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await dispatch(acceptOrder(orderId)).unwrap();
      Alert.alert('Success', 'Order accepted successfully');
      loadOrders();
      navigation.navigate('MyOrders');
    } catch (error) {
      Alert.alert('Error', error || 'Failed to accept order');
    }
  };

  const renderOrder = ({item}) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>Order #{item.orderNumber}</Text>
        <Text style={styles.orderAmount}>₹{item.totalAmount.toFixed(2)}</Text>
      </View>
      <Text style={styles.orderAddress}>{item.deliveryAddress}</Text>
      <View style={styles.orderFooter}>
        <View style={styles.paymentBadge}>
          <Text style={styles.paymentText}>{item.paymentMethod}</Text>
        </View>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptOrder(item.id)}>
          <Text style={styles.acceptButtonText}>Accept Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Orders</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MyOrders')}>
          <Icon name="list" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity onPress={loadOrders} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      {isLoading && availableOrders.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : availableOrders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon name="inbox" size={64} color="#CCC" />
          <Text style={styles.emptyText}>No available orders</Text>
          <Text style={styles.emptySubtext}>
            Orders with status PLACED, ACCEPTED, PREPARING, or READY will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={availableOrders}
          renderItem={renderOrder}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadOrders} colors={['#FF6B35']} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#FF6B35',
    elevation: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
  },
  orderAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  acceptButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: '#999',
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#BBB',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default AvailableOrdersScreen;

