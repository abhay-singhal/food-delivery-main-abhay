import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchPickUpOrders, startOrder, fetchAvailableOrders, acceptOrder} from '../store/slices/orderSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';

const PickUpOrdersScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {pickUpOrders, availableOrders, isLoading, error, activeOrder} = useSelector(state => state.order);

  useEffect(() => {
    loadOrders();
    // Refresh every 10 seconds
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = () => {
    dispatch(fetchPickUpOrders());
    dispatch(fetchAvailableOrders());
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await dispatch(acceptOrder(orderId)).unwrap();
      Alert.alert('Success', 'Order accepted successfully');
      loadOrders();
    } catch (error) {
      Alert.alert('Error', error || 'Failed to accept order');
    }
  };

  const handleStartOrder = async (orderId) => {
    // Check if there's already an active order
    if (activeOrder) {
      Alert.alert(
        'Active Order Exists',
        'You already have an active order. Please complete it before starting a new one.',
        [{text: 'OK'}]
      );
      return;
    }

    Alert.alert(
      'Start Delivery',
      'Are you sure you want to start delivering this order?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Start',
          onPress: async () => {
            try {
              await dispatch(startOrder(orderId)).unwrap();
              Alert.alert('Success', 'Order started successfully');
              loadOrders();
              // Navigate to Active Order tab
              navigation.navigate('ActiveOrder');
            } catch (error) {
              Alert.alert('Error', error || 'Failed to start order');
            }
          },
        },
      ]
    );
  };

  const renderOrder = ({item}) => {
    const isAssigned = item.section === 'assigned';
    
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>Order #{item.orderNumber}</Text>
          <View style={[styles.statusBadge, isAssigned ? styles.assignedBadge : styles.availableBadge]}>
            <Text style={styles.statusText}>
              {isAssigned ? 'READY FOR PICKUP' : 'AVAILABLE'}
            </Text>
          </View>
        </View>
        <View style={styles.orderInfo}>
          <Icon name="location-on" size={16} color="#666" />
          <Text style={styles.orderAddress}>{item.deliveryAddress}</Text>
        </View>
        <View style={styles.orderInfo}>
          <Icon name="attach-money" size={16} color="#FF6B35" />
          <Text style={styles.orderAmount}>₹{item.totalAmount?.toFixed(2) || '0.00'}</Text>
        </View>
        <View style={styles.orderInfo}>
          <Icon name="payment" size={16} color="#666" />
          <Text style={styles.paymentMethod}>{item.paymentMethod || 'N/A'}</Text>
        </View>
        {isAssigned ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => handleStartOrder(item.id)}>
            <Icon name="play-arrow" size={20} color="#FFF" />
            <Text style={styles.startButtonText}>Start Delivery</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptOrder(item.id)}>
            <Icon name="check-circle" size={20} color="#FFF" />
            <Text style={styles.acceptButtonText}>Accept Order</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Combine available and assigned orders for display
  const allOrders = [
    ...pickUpOrders.map(order => ({...order, section: 'assigned'})),
    ...availableOrders.map(order => ({...order, section: 'available'})),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pick-Up Orders</Text>
        <Text style={styles.headerSubtitle}>
          {pickUpOrders.length} assigned • {availableOrders.length} available
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity onPress={loadOrders} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading && pickUpOrders.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : allOrders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon name="inbox" size={64} color="#CCC" />
          <Text style={styles.emptyText}>No pick-up orders</Text>
          <Text style={styles.emptySubtext}>
            Orders assigned to you and available orders will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={allOrders}
          renderItem={renderOrder}
          keyExtractor={item => `${item.section}-${item.id}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadOrders} colors={['#FF6B35']} />
          }
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
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 18,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
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
    alignItems: 'center',
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  assignedBadge: {
    backgroundColor: '#FF9800',
  },
  availableBadge: {
    backgroundColor: '#2196F3',
  },
  statusText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderAddress: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
    marginLeft: 8,
  },
  paymentMethod: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  acceptButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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

export default PickUpOrdersScreen;

