import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {placeOrder} from '../store/slices/orderSlice';
import {clearCart} from '../store/slices/cartSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView, {Marker} from 'react-native-maps';
import RazorpayCheckout from 'react-native-razorpay';
import {paymentService} from '../services/paymentService';

const CheckoutScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {items, total} = useSelector(state => state.cart);
  const {isAuthenticated} = useSelector(state => state.auth);
  const orderState = useSelector(state => state.order);
  const isLoading = orderState?.isLoading || false;

  // Structured address fields
  const [houseNumber, setHouseNumber] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('Meerut');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');
  
  // Location from map picker
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 28.9845,
    longitude: 77.7064,
    address: '',
  });
  
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  
  // Free delivery radius (should match backend config)
  const FREE_DELIVERY_RADIUS_KM = 2.0;
  const RESTAURANT_LAT = 28.9845;
  const RESTAURANT_LON = 77.7064;
  
  // Calculate distance from restaurant
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  
  // Calculate estimated delivery charge
  const getEstimatedDeliveryCharge = () => {
    if (!selectedLocation.latitude || !selectedLocation.longitude) {
      return null;
    }
    
    const distance = calculateDistance(
      RESTAURANT_LAT,
      RESTAURANT_LON,
      selectedLocation.latitude,
      selectedLocation.longitude
    );
    
    if (distance <= FREE_DELIVERY_RADIUS_KM) {
      return 0;
    }
    
    // Charge per km after free delivery radius (should match backend: ₹5/km)
    const CHARGE_PER_KM = 5.0;
    const chargeableDistance = distance - FREE_DELIVERY_RADIUS_KM;
    return Math.max(0, chargeableDistance * CHARGE_PER_KM);
  };
  
  const estimatedDeliveryCharge = getEstimatedDeliveryCharge();

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  const handleRazorpayPayment = async (order, orderId, razorpayOrderId) => {
    try {
      // Razorpay Key ID (should be moved to config in production)
      const RAZORPAY_KEY_ID = 'rzp_test_RsgVjuSDbgAziI';
      
      const options = {
        description: `Order #${order.orderNumber || orderId}`,
        image: 'https://i.imgur.com/3g7nmJC.png', // Your app logo URL
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

      console.log('Opening Razorpay checkout with options:', options);

      const paymentData = await RazorpayCheckout.open(options);
      
      console.log('Razorpay payment response:', paymentData);

      // Payment successful, verify with backend
      const verifyResult = await paymentService.verifyPayment(
        orderId,
        razorpayOrderId,
        paymentData.razorpay_payment_id,
        paymentData.razorpay_signature
      );

      console.log('Payment verification result:', verifyResult);

      if (verifyResult && verifyResult.success) {
        Alert.alert('Success', 'Payment successful! Order placed.', [
          {
            text: 'OK',
            onPress: () => {
              dispatch(clearCart());
              navigation.replace('OrderTracking', {orderId});
            },
          },
        ]);
      } else {
        Alert.alert(
          'Payment Verification Failed',
          verifyResult?.message || 'Payment could not be verified. Please contact support.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to order tracking anyway, but order will be in PENDING_PAYMENT
                navigation.replace('OrderTracking', {orderId});
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Razorpay payment error:', error);
      
      // Payment cancelled or failed
      if (error.code === 'RazorpayCheckout.CANCELLED') {
        Alert.alert(
          'Payment Cancelled',
          'You cancelled the payment. Your order is pending payment. You can complete the payment later.',
          [
            {
              text: 'View Order',
              onPress: () => {
                navigation.replace('OrderTracking', {orderId});
              },
            },
            {text: 'OK', style: 'cancel'},
          ]
        );
      } else {
        Alert.alert(
          'Payment Failed',
          error.description || error.message || 'Payment failed. Please try again.',
          [
            {
              text: 'Retry Payment',
              onPress: () => handleRazorpayPayment(order, orderId, razorpayOrderId),
            },
            {
              text: 'View Order',
              onPress: () => {
                navigation.replace('OrderTracking', {orderId});
              },
            },
          ]
        );
      }
    }
  };

  const buildDeliveryAddress = () => {
    const parts = [];
    if (houseNumber.trim()) parts.push(`House No: ${houseNumber.trim()}`);
    if (addressLine1.trim()) parts.push(addressLine1.trim());
    if (addressLine2.trim()) parts.push(addressLine2.trim());
    if (landmark.trim()) parts.push(`Landmark: ${landmark.trim()}`);
    if (city.trim()) parts.push(city.trim());
    if (pincode.trim()) parts.push(`PIN: ${pincode.trim()}`);
    return parts.join(', ');
  };

  const handlePlaceOrder = async () => {
    // Validate required fields
    if (!addressLine1.trim()) {
      Alert.alert('Error', 'Please enter address line 1');
      return;
    }

    if (!city.trim() || city.toLowerCase() !== 'meerut') {
      Alert.alert('Error', 'Delivery is only available in Meerut');
      return;
    }

    if (!selectedLocation.latitude || !selectedLocation.longitude) {
      Alert.alert('Error', 'Please select delivery location on map');
      return;
    }

    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to place order', [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Login', onPress: () => navigation.navigate('Login')},
      ]);
      return;
    }

    try {
      const deliveryAddress = buildDeliveryAddress();
      
      // Ensure paymentMethod is uppercase to match backend enum (COD, RAZORPAY, ONLINE)
      const paymentMethodUpper = paymentMethod.toUpperCase();
      
      const orderData = {
        items: items.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || null,
        })),
        paymentMethod: paymentMethodUpper,
        deliveryAddress,
        deliveryLatitude: selectedLocation.latitude,
        deliveryLongitude: selectedLocation.longitude,
        deliveryCity: city.trim() || 'Meerut',
        specialInstructions: specialInstructions || null,
      };
      
      console.log('Order data being sent:', JSON.stringify(orderData, null, 2));

      // Place order via API
      let result;
      try {
        result = await dispatch(placeOrder(orderData)).unwrap();
        console.log('Place order result:', JSON.stringify(result, null, 2));
      } catch (error) {
        console.error('Error placing order:', error);
        // Check if order was actually created (might be a response parsing error)
        Alert.alert(
          'Order Status',
          'There was an issue processing the response, but your order may have been placed. Please check your orders.',
          [
            {
              text: 'Check Orders',
              onPress: () => navigation.navigate('Profile'),
            },
            {text: 'OK', style: 'cancel'},
          ]
        );
        return;
      }
      
      // Backend returns: {success: true, message: "...", data: {order: {...}, razorpayOrderId: "..."}}
      if (result && result.success) {
        const order = result.data?.order || result.data;
        const orderId = order?.id || order?.orderNumber;
        const razorpayOrderId = result.data?.razorpayOrderId;
        
        console.log('Extracted order:', order);
        console.log('Extracted orderId:', orderId);
        
        if (!orderId) {
          console.error('Order ID not found. Full result:', JSON.stringify(result, null, 2));
          Alert.alert(
            'Order Placed',
            'Your order has been placed successfully, but there was an issue with the order ID. Please check your orders.',
            [
              {
                text: 'Check Orders',
                onPress: () => navigation.navigate('Profile'),
              },
              {text: 'OK', style: 'cancel'},
            ]
          );
          dispatch(clearCart());
          return;
        }
        
        // Handle Online Payment (Razorpay)
        if ((paymentMethodUpper === 'ONLINE' || paymentMethodUpper === 'RAZORPAY') && razorpayOrderId) {
          await handleRazorpayPayment(order, orderId, razorpayOrderId);
        } else {
          // COD - Direct success
          dispatch(clearCart());
          Alert.alert('Success', result.message || 'Order placed successfully!', [
            {
              text: 'Track Order',
              onPress: () => {
                navigation.replace('OrderTracking', {orderId});
              },
            },
          ]);
        }
      } else {
        // Response doesn't have success flag, but order might still be created
        console.warn('Response missing success flag:', JSON.stringify(result, null, 2));
        Alert.alert(
          'Order Status',
          'Unable to confirm order status. Please check your orders to verify.',
          [
            {
              text: 'Check Orders',
              onPress: () => navigation.navigate('Profile'),
            },
            {text: 'OK', style: 'cancel'},
          ]
        );
      }
    } catch (error) {
      console.error('Place order error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Check if it's a network error but order might have been created
      // Sometimes the response parsing fails but the order is still created
      if (error?.code === 'ERR_BAD_RESPONSE' || error?.status === 500) {
        Alert.alert(
          'Order Status',
          'There was an issue processing the response, but your order may have been placed successfully. Please check your orders.',
          [
            {
              text: 'Check Orders',
              onPress: () => {
                dispatch(clearCart());
                navigation.navigate('Profile');
              },
            },
            {text: 'Try Again', style: 'cancel'},
          ]
        );
      } else {
        // Extract error message
        let errorMessage = 'Failed to place order. Please try again.';
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error?.message) {
          errorMessage = error.message;
        } else if (error?.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        
        Alert.alert('Error', errorMessage);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}>
        <View style={styles.content}>
        {/* Location Picker Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Location</Text>
            <TouchableOpacity
              style={styles.pickLocationButton}
              onPress={() =>
                navigation.navigate('LocationPicker', {
                  onLocationSelect: handleLocationSelect,
                  initialLocation: selectedLocation,
                })
              }>
              <Icon name="place" size={20} color="#FF6B35" />
              <Text style={styles.pickLocationText}>Pick on Map</Text>
            </TouchableOpacity>
          </View>
          
          {selectedLocation.address ? (
            <View style={styles.locationInfo}>
              <Icon name="location-on" size={16} color="#4CAF50" />
              <Text style={styles.locationText} numberOfLines={2}>
                {selectedLocation.address}
              </Text>
            </View>
          ) : (
            <Text style={styles.locationHint}>
              Tap "Pick on Map" to select your delivery location
            </Text>
          )}

          {selectedLocation.latitude && selectedLocation.longitude && (
            <View style={styles.miniMapContainer}>
              <MapView
                style={styles.miniMap}
                initialRegion={{
                  latitude: selectedLocation.latitude,
                  longitude: selectedLocation.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                scrollEnabled={false}
                zoomEnabled={false}>
                <Marker
                  coordinate={{
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                  }}
                />
              </MapView>
            </View>
          )}
        </View>

        {/* Structured Address Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address Details</Text>
          
          <Text style={[styles.fieldLabel, {marginTop: 0}]}>House/Flat Number *</Text>
          <TextInput
            style={[styles.input, styles.singleLineInput]}
            placeholder="e.g., 123, A-45"
            value={houseNumber}
            onChangeText={setHouseNumber}
          />

          <Text style={styles.fieldLabel}>Address Line 1 *</Text>
          <TextInput
            style={[styles.input, styles.singleLineInput]}
            placeholder="Street, Building, Area"
            value={addressLine1}
            onChangeText={setAddressLine1}
          />

          <Text style={styles.fieldLabel}>Address Line 2</Text>
          <TextInput
            style={[styles.input, styles.singleLineInput]}
            placeholder="Apartment, Floor, etc. (Optional)"
            value={addressLine2}
            onChangeText={setAddressLine2}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.fieldLabel}>City *</Text>
              <TextInput
                style={[styles.input, styles.singleLineInput]}
                placeholder="Meerut"
                value={city}
                onChangeText={setCity}
                editable={false}
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.fieldLabel}>PIN Code</Text>
              <TextInput
                style={[styles.input, styles.singleLineInput]}
                placeholder="250001"
                value={pincode}
                onChangeText={setPincode}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Landmark (Optional)</Text>
          <TextInput
            style={[styles.input, styles.singleLineInput]}
            placeholder="e.g., Near City Mall, Behind School"
            value={landmark}
            onChangeText={setLandmark}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'COD' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('COD')}>
            <Text style={styles.paymentOptionText}>Cash on Delivery (COD)</Text>
            {paymentMethod === 'COD' && (
              <Icon name="check-circle" size={24} color="#FF6B35" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'ONLINE' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('ONLINE')}>
            <Text style={styles.paymentOptionText}>Online Payment</Text>
            {paymentMethod === 'ONLINE' && (
              <Icon name="check-circle" size={24} color="#FF6B35" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Any special instructions..."
            multiline
            numberOfLines={3}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
          />
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{total.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.deliveryChargeContainer}>
              <View style={styles.deliveryChargeRow}>
                <Text style={styles.summaryLabel}>Delivery Charge</Text>
                {estimatedDeliveryCharge !== null ? (
                  estimatedDeliveryCharge === 0 ? (
                    <View style={styles.freeDeliveryBadge}>
                      <Icon name="local-offer" size={14} color="#4CAF50" />
                      <Text style={styles.freeDeliveryText}>FREE</Text>
                    </View>
                  ) : (
                    <Text style={styles.summaryValue}>₹{estimatedDeliveryCharge.toFixed(2)}</Text>
                  )
                ) : (
                  <Text style={styles.summaryValue}>Calculated</Text>
                )}
              </View>
              {estimatedDeliveryCharge === 0 && (
                <Text style={styles.freeDeliveryNote}>
                  🎉 Free delivery within {FREE_DELIVERY_RADIUS_KM}km
                </Text>
              )}
            </View>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ₹{(total + (estimatedDeliveryCharge || 0)).toFixed(2)}
            </Text>
          </View>
        </View>
        </View>
      </ScrollView>

      {/* Fixed Place Order Button - Always Visible */}
      <View style={styles.fixedFooter}>
        <TouchableOpacity
          style={[styles.placeOrderButton, isLoading && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={isLoading || items.length === 0}>
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.placeOrderButtonText}>Place Order</Text>
          )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for fixed footer
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
  content: {
    padding: 18,
  },
  section: {
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
    fontSize: 19,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 18,
    letterSpacing: 0.3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  pickLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FF6B35',
    elevation: 2,
    shadowColor: '#FF6B35',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  pickLocationText: {
    color: '#FF6B35',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9F0',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  locationHint: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  miniMapContainer: {
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  miniMap: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  halfWidth: {
    flex: 1,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    textAlignVertical: 'top',
    color: '#1A1A1A',
    marginBottom: 4,
    fontWeight: '500',
  },
  singleLineInput: {
    textAlignVertical: 'center',
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  paymentOptionSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF5F2',
    elevation: 4,
    shadowColor: '#FF6B35',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  paymentOptionText: {
    fontSize: 16,
    color: '#333',
  },
  summary: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
  },
  deliveryChargeContainer: {
    flex: 1,
  },
  deliveryChargeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  freeDeliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    elevation: 2,
    shadowColor: '#4CAF50',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  freeDeliveryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4CAF50',
    letterSpacing: 0.5,
  },
  freeDeliveryNote: {
    fontSize: 13,
    color: '#4CAF50',
    marginTop: 6,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 10,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  placeOrderButton: {
    backgroundColor: '#FF6B35',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  placeOrderButtonDisabled: {
    backgroundColor: '#CCC',
    opacity: 0.6,
  },
  placeOrderButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CheckoutScreen;


