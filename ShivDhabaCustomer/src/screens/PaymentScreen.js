import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RazorpayCheckout from 'react-native-razorpay';
import {paymentService} from '../services/paymentService';
import {orderService} from '../services/orderService';
import {fetchMyOrders} from '../store/slices/orderSlice';

const PaymentScreen = ({navigation, route}) => {
  const dispatch = useDispatch();
  const {user} = useSelector(state => state.auth);
  const {orderId} = route?.params || {};
  
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    } else {
      Alert.alert('Error', 'Order ID is required');
      navigation.goBack();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setIsLoading(true);
      const response = await orderService.getOrder(orderId);
      const orderData = response?.data || response;
      setOrder(orderData);
    } catch (error) {
      console.error('Error loading order:', error);
      Alert.alert('Error', 'Failed to load order details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (!order) return;

    try {
      setIsProcessing(true);

      // Get or create Razorpay order
      let razorpayOrderId = order.payment?.razorpayOrderId;
      
      if (!razorpayOrderId) {
        // Create Razorpay order
        const createResponse = await paymentService.createRazorpayOrder(orderId);
        razorpayOrderId = createResponse?.data || createResponse;
        
        if (!razorpayOrderId) {
          throw new Error('Failed to create Razorpay order');
        }
      }

      // Razorpay Key ID
      const RAZORPAY_KEY_ID = 'rzp_test_RsgVjuSDbgAziI';

      const options = {
        description: `Order #${order.orderNumber || orderId}`,
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: 'INR',
        key: RAZORPAY_KEY_ID,
        amount: Math.round(order.totalAmount * 100), // Amount in paise
        name: 'Shiv Dhaba',
        order_id: razorpayOrderId,
        prefill: {
          email: user?.email || '',
          contact: user?.mobileNumber || '',
          name: user?.fullName || 'Customer',
        },
        theme: {color: '#FF6B35'},
      };

      console.log('Opening Razorpay checkout:', options);

      const paymentData = await RazorpayCheckout.open(options);
      
      console.log('Razorpay payment response:', paymentData);

      // Verify payment with backend
      const verifyResult = await paymentService.verifyPayment(
        orderId,
        razorpayOrderId,
        paymentData.razorpay_payment_id,
        paymentData.razorpay_signature
      );

      console.log('Payment verification result:', verifyResult);

      if (verifyResult && verifyResult.success) {
        // Refresh orders list
        await dispatch(fetchMyOrders());
        
        Alert.alert('Success', 'Payment successful! Your order is now confirmed.', [
          {
            text: 'View Order',
            onPress: () => {
              navigation.replace('OrderTracking', {orderId});
            },
          },
        ]);
      } else {
        throw new Error(verifyResult?.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      
      if (error.code === 'RazorpayCheckout.CANCELLED') {
        Alert.alert('Payment Cancelled', 'You cancelled the payment. You can try again later.');
      } else {
        Alert.alert(
          'Payment Failed',
          error.message || error.description || 'Payment failed. Please try again.',
          [
            {text: 'Try Again', onPress: handlePayNow},
            {text: 'Cancel', style: 'cancel'},
          ]
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={{width: 24}} />
        </View>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={64} color="#FF6B35" />
          <Text style={styles.errorText}>Order not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Payment</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.orderInfoCard}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderLabel}>Order Number</Text>
              <Text style={styles.orderNumber}>
                #{order.orderNumber || `Order ${order.id}`}
              </Text>
            </View>
            <View style={[styles.statusBadge, {backgroundColor: '#FF5722'}]}>
              <Icon name="payment" size={16} color="#FFF" />
              <Text style={styles.statusText}>Pending Payment</Text>
            </View>
          </View>
        </View>

        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <Text style={styles.amountValue}>₹{order.totalAmount?.toFixed(2) || '0.00'}</Text>
          
          <View style={styles.breakdown}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Subtotal</Text>
              <Text style={styles.breakdownValue}>₹{order.subtotal?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Delivery Charge</Text>
              <Text style={styles.breakdownValue}>₹{order.deliveryCharge?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={[styles.breakdownRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{order.totalAmount?.toFixed(2) || '0.00'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.paymentMethodCard}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethod}>
            <Icon name="account-balance-wallet" size={24} color="#FF6B35" />
            <View style={styles.paymentMethodInfo}>
              <Text style={styles.paymentMethodName}>Razorpay</Text>
              <Text style={styles.paymentMethodDesc}>
                Pay securely with UPI, Cards, Net Banking
              </Text>
            </View>
            <Icon name="check-circle" size={24} color="#4CAF50" />
          </View>
        </View>

        <View style={styles.infoCard}>
          <Icon name="info" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            Your order will be confirmed once payment is successful. You can track your order after payment.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handlePayNow}
          disabled={isProcessing}
          activeOpacity={0.8}>
          {isProcessing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Icon name="payment" size={24} color="#FFF" />
              <Text style={styles.payButtonText}>Pay ₹{order.totalAmount?.toFixed(2) || '0.00'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 100,
  },
  orderInfoCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
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
  },
  orderLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  amountCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  amountLabel: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FF6B35',
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  breakdown: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  breakdownLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#F0F0F0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B35',
    letterSpacing: 0.5,
  },
  paymentMethodCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
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
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  paymentMethodDesc: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 20,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#FF6B35',
    marginTop: 16,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
    elevation: 6,
    shadowColor: '#FF6B35',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default PaymentScreen;

