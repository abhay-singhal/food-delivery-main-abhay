import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert} from 'react-native';
import {useDispatch} from 'react-redux';
import {markDelivered} from '../store/slices/orderSlice';
import {orderService} from '../services/orderService';
import Icon from 'react-native-vector-icons/MaterialIcons';

const OrderDetailScreen = ({navigation, route}) => {
  const {orderId} = route.params || {};
  const dispatch = useDispatch();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setIsLoading(true);
      const response = await orderService.getOrder(orderId);
      if (response.success) {
        setOrder(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkDelivered = async () => {
    try {
      await dispatch(markDelivered(orderId)).unwrap();
      Alert.alert('Success', 'Order marked as delivered');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error || 'Failed to mark as delivered');
    }
  };

  if (isLoading || !order) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
          <Text style={styles.status}>Status: {order.status}</Text>
          <Text style={styles.addressLabel}>Delivery Address:</Text>
          <Text style={styles.address}>{order.deliveryAddress}</Text>
          <Text style={styles.amount}>Total: ₹{order.totalAmount.toFixed(2)}</Text>
        </View>

        {order.status === 'OUT_FOR_DELIVERY' && (
          <TouchableOpacity style={styles.deliverButton} onPress={handleMarkDelivered}>
            <Text style={styles.deliverButtonText}>Mark as Delivered</Text>
          </TouchableOpacity>
        )}
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
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  status: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  address: {
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B35',
  },
  deliverButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  deliverButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OrderDetailScreen;


