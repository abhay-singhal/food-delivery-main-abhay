import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchMyOrders} from '../store/slices/orderSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MyOrdersScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {orders, isLoading, error} = useSelector(state => state.order);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      await dispatch(fetchMyOrders()).unwrap();
    } catch (error) {
      console.error('Error loading orders:', error);
      if (!refreshing) {
        Alert.alert('Error', error || 'Failed to load orders');
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
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
      case 'CANCELLED':
        return '#F44336';
      case 'PENDING_PAYMENT':
        return '#FF5722';
      default:
        return '#666';
    }
  };

  const getStatusIcon = status => {
    switch (status) {
      case 'PLACED':
        return 'schedule';
      case 'ACCEPTED':
        return 'check-circle';
      case 'PREPARING':
        return 'restaurant';
      case 'READY':
        return 'done';
      case 'OUT_FOR_DELIVERY':
        return 'delivery-dining';
      case 'DELIVERED':
        return 'check-circle';
      case 'CANCELLED':
        return 'cancel';
      case 'PENDING_PAYMENT':
        return 'payment';
      default:
        return 'help';
    }
  };

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

  const handleOrderPress = order => {
    navigation.navigate('OrderTracking', {orderId: order.id || order.orderNumber});
  };

  const handlePayNow = (order) => {
    navigation.navigate('Payment', {orderId: order.id || order.orderNumber});
  };

  const renderOrderItem = ({item}) => {
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);
    const needsPayment = item.status === 'PENDING_PAYMENT' && item.paymentMethod === 'ONLINE';

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleOrderPress(item)}
        activeOpacity={0.7}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>
              #{item.orderNumber || `Order ${item.id}`}
            </Text>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, {backgroundColor: statusColor}]}>
            <Icon name={statusIcon} size={16} color="#FFF" />
            <Text style={styles.statusText}>{item.status?.replace('_', ' ') || 'UNKNOWN'}</Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Icon name="restaurant-menu" size={16} color="#666" />
            <Text style={styles.detailText}>
              {item.items?.length || 0} item{item.items?.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="location-on" size={16} color="#666" />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.deliveryAddress || 'Address not available'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="payment" size={16} color="#666" />
            <Text style={styles.detailText}>
              {item.paymentMethod || 'COD'} • {item.payment?.status || 'PENDING'}
            </Text>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>₹{item.totalAmount?.toFixed(2) || '0.00'}</Text>
          </View>
          {needsPayment && (
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => handlePayNow(item)}
              activeOpacity={0.8}>
              <Icon name="payment" size={18} color="#FFF" />
              <Text style={styles.payButtonText}>Pay Now</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.trackButton,
              item.status === 'DELIVERED' && styles.trackButtonDisabled
            ]}
            onPress={() => handleOrderPress(item)}
            activeOpacity={0.8}
            disabled={item.status === 'DELIVERED'}>
            <Text style={[
              styles.trackButtonText,
              item.status === 'DELIVERED' && styles.trackButtonTextDisabled
            ]}>
              {item.status === 'DELIVERED' ? 'Delivered' : 'Track'}
            </Text>
            {item.status !== 'DELIVERED' && (
              <Icon name="arrow-forward" size={16} color="#FF6B35" />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="shopping-bag" size={80} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No Orders Yet</Text>
      <Text style={styles.emptyText}>
        Start ordering delicious food from our menu!
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.navigate('Menu')}
        activeOpacity={0.8}>
        <Icon name="restaurant-menu" size={20} color="#FFF" />
        <Text style={styles.browseButtonText}>Browse Menu</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && !refreshing && orders.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Icon name="refresh" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {error && !refreshing && (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={24} color="#FF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadOrders}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={orders || []}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id?.toString() || item.orderNumber || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
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
  backButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  refreshButton: {
    padding: 8,
    marginRight: -8,
    borderRadius: 20,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    flex: 1,
    color: '#C62828',
    fontSize: 14,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    padding: 18,
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  orderDate: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
  orderDetails: {
    marginBottom: 16,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  totalLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B35',
    letterSpacing: 0.5,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: '#4CAF50',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFF5F2',
    borderWidth: 1.5,
    borderColor: '#FF6B35',
    gap: 6,
  },
  trackButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  trackButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#CCCCCC',
    opacity: 0.6,
  },
  trackButtonTextDisabled: {
    color: '#999999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 24,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    elevation: 4,
    shadowColor: '#FF6B35',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  browseButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default MyOrdersScreen;

