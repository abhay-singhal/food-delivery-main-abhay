import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchActiveOrder, markDelivered} from '../store/slices/orderSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ActiveOrderScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {activeOrder, isLoading} = useSelector(state => state.order);
  const refreshInterval = useRef(null);

  useEffect(() => {
    loadOrder();
    // Refresh every 5 seconds to keep active order updated
    refreshInterval.current = setInterval(loadOrder, 5000);
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, []);

  const loadOrder = () => {
    dispatch(fetchActiveOrder());
  };

  const handleMarkDelivered = async () => {
    if (!activeOrder) return;

    Alert.alert(
      'Mark as Delivered',
      `Are you sure you want to mark Order #${activeOrder.orderNumber} as delivered?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Mark Delivered',
          onPress: async () => {
            try {
              await dispatch(markDelivered(activeOrder.id)).unwrap();
              Alert.alert('Success', 'Order marked as delivered successfully');
              loadOrder();
              // Navigate to Order History tab
              navigation.navigate('OrderHistory');
            } catch (error) {
              Alert.alert('Error', error || 'Failed to mark as delivered');
            }
          },
        },
      ]
    );
  };

  if (isLoading && !activeOrder) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading active order...</Text>
      </View>
    );
  }

  if (!activeOrder) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Active Order</Text>
        </View>
        <View style={styles.centerContainer}>
          <Icon name="check-circle" size={64} color="#4CAF50" />
          <Text style={styles.emptyText}>No Active Order</Text>
          <Text style={styles.emptySubtext}>
            You don't have any active orders right now.{'\n'}
            Check the Pick-Up Orders tab to start a delivery.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Order</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>OUT FOR DELIVERY</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadOrder} colors={['#FF6B35']} />
        }>
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderNumber}>Order #{activeOrder.orderNumber}</Text>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Icon name="location-on" size={20} color="#FF6B35" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Delivery Address</Text>
                <Text style={styles.infoValue}>{activeOrder.deliveryAddress}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Icon name="attach-money" size={20} color="#FF6B35" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Total Amount</Text>
                <Text style={styles.infoValue}>₹{activeOrder.totalAmount?.toFixed(2) || '0.00'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Icon name="payment" size={20} color="#FF6B35" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Payment Method</Text>
                <Text style={styles.infoValue}>{activeOrder.paymentMethod || 'N/A'}</Text>
              </View>
            </View>

            {activeOrder.customer && (
              <View style={styles.infoRow}>
                <Icon name="person" size={20} color="#FF6B35" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Customer</Text>
                  <Text style={styles.infoValue}>
                    {activeOrder.customer.name || activeOrder.customer.mobileNumber || 'N/A'}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.deliverButton}
            onPress={handleMarkDelivered}>
            <Icon name="check-circle" size={24} color="#FFF" />
            <Text style={styles.deliverButtonText}>Mark as Delivered</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => navigation.navigate('OrderDetail', {orderId: activeOrder.id})}>
            <Text style={styles.detailButtonText}>View Full Details</Text>
            <Icon name="arrow-forward" size={20} color="#FF6B35" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  statusBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  orderHeader: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  infoSection: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  deliverButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  deliverButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderRadius: 12,
  },
  detailButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
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
    fontSize: 20,
    color: '#999',
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 12,
    fontSize: 14,
    color: '#BBB',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ActiveOrderScreen;

