import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {
  fetchOrder,
  acceptOrder,
  rejectOrder,
  updateOrderStatus,
  assignOrderToDeliveryBoy,
} from '../store/slices/orderSlice';
import {fetchDeliveryBoys} from '../store/slices/deliveryBoySlice';
import Icon from 'react-native-vector-icons/MaterialIcons';

const OrderDetailScreen = ({navigation, route}) => {
  const dispatch = useDispatch();
  const {currentOrder, isLoading} = useSelector((state) => state.order);
  const {deliveryBoys} = useSelector((state) => state.deliveryBoy);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  useEffect(() => {
    dispatch(fetchOrder(route.params.orderId));
    dispatch(fetchDeliveryBoys());
  }, [route.params.orderId]);

  const handleAccept = async () => {
    try {
      await dispatch(acceptOrder(route.params.orderId)).unwrap();
      Alert.alert('Success', 'Order accepted successfully');
    } catch (error) {
      Alert.alert('Error', error || 'Failed to accept order');
    }
  };

  const handleReject = async () => {
    Alert.alert(
      'Reject Order',
      'Are you sure you want to reject this order?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(rejectOrder(route.params.orderId)).unwrap();
              Alert.alert('Success', 'Order rejected');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', error || 'Failed to reject order');
            }
          },
        },
      ]
    );
  };

  const handleStatusUpdate = (status) => {
    Alert.alert(
      'Update Status',
      `Change order status to ${status}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Update',
          onPress: async () => {
            try {
              await dispatch(
                updateOrderStatus({orderId: route.params.orderId, status})
              ).unwrap();
              Alert.alert('Success', 'Order status updated');
            } catch (error) {
              Alert.alert('Error', error || 'Failed to update status');
            }
          },
        },
      ]
    );
  };

  const handleAssign = (deliveryBoyId) => {
    Alert.alert(
      'Assign Order',
      'Assign this order to the selected delivery boy?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Assign',
          onPress: async () => {
            try {
              await dispatch(
                assignOrderToDeliveryBoy({
                  orderId: route.params.orderId,
                  deliveryBoyId,
                })
              ).unwrap();
              Alert.alert('Success', 'Order assigned successfully');
              setShowAssignDialog(false);
            } catch (error) {
              Alert.alert('Error', error || 'Failed to assign order');
            }
          },
        },
      ]
    );
  };

  if (isLoading || !currentOrder) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  const availableDeliveryBoys = deliveryBoys.filter(
    (db) => db.isAvailable && db.isOnDuty
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.orderNumber}>Order #{currentOrder.orderNumber}</Text>
            <View
              style={[
                styles.statusBadge,
                {backgroundColor: getStatusColor(currentOrder.status) + '20'},
              ]}>
              <Text
                style={[
                  styles.statusText,
                  {color: getStatusColor(currentOrder.status)},
                ]}>
                {currentOrder.status}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            <InfoRow
              icon="person"
              label="Name"
              value={currentOrder.customer?.fullName || 'Guest'}
            />
            <InfoRow
              icon="phone"
              label="Mobile"
              value={currentOrder.customer?.mobileNumber || 'N/A'}
            />
            <InfoRow
              icon="location-on"
              label="Address"
              value={currentOrder.deliveryAddress}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            {currentOrder.items?.map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <Text style={styles.itemName}>
                  {item.quantity}x {item.menuItem?.name}
                </Text>
                <Text style={styles.itemPrice}>
                  ₹{(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <InfoRow
              icon="payment"
              label="Payment Method"
              value={currentOrder.paymentMethod || 'COD'}
            />
            <InfoRow
              icon="attach-money"
              label="Total Amount"
              value={`₹${currentOrder.totalAmount?.toFixed(2)}`}
            />
          </View>

          {currentOrder.deliveryBoy && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Boy</Text>
              <InfoRow
                icon="delivery-dining"
                label="Name"
                value={currentOrder.deliveryBoy.fullName}
              />
              <InfoRow
                icon="phone"
                label="Mobile"
                value={currentOrder.deliveryBoy.mobileNumber}
              />
            </View>
          )}

          <View style={styles.actions}>
            {currentOrder.status === 'PLACED' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.acceptButton]}
                  onPress={handleAccept}>
                  <Icon name="check" size={20} color="#FFF" />
                  <Text style={styles.actionButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={handleReject}>
                  <Icon name="close" size={20} color="#FFF" />
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
              </>
            )}

            {currentOrder.status === 'ACCEPTED' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.updateButton]}
                onPress={() => handleStatusUpdate('PREPARING')}>
                <Text style={styles.actionButtonText}>Start Preparing</Text>
              </TouchableOpacity>
            )}

            {currentOrder.status === 'PREPARING' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.updateButton]}
                onPress={() => handleStatusUpdate('READY')}>
                <Text style={styles.actionButtonText}>Mark Ready</Text>
              </TouchableOpacity>
            )}

            {currentOrder.status === 'READY' && !currentOrder.deliveryBoy && (
              <TouchableOpacity
                style={[styles.actionButton, styles.assignButton]}
                onPress={() => setShowAssignDialog(true)}>
                <Icon name="person-add" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>Assign Delivery Boy</Text>
              </TouchableOpacity>
            )}
          </View>

          {showAssignDialog && (
            <View style={styles.dialog}>
              <Text style={styles.dialogTitle}>Select Delivery Boy</Text>
              {availableDeliveryBoys.length === 0 ? (
                <Text style={styles.noDeliveryBoys}>
                  No available delivery boys
                </Text>
              ) : (
                availableDeliveryBoys.map((db) => (
                  <TouchableOpacity
                    key={db.id}
                    style={styles.deliveryBoyOption}
                    onPress={() => handleAssign(db.userId)}>
                    <Text style={styles.deliveryBoyName}>{db.name}</Text>
                    <Text style={styles.deliveryBoyMobile}>{db.mobile}</Text>
                  </TouchableOpacity>
                ))
              )}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAssignDialog(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const InfoRow = ({icon, label, value}) => (
  <View style={styles.infoRow}>
    <Icon name={icon} size={18} color="#666" />
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const getStatusColor = (status) => {
  switch (status) {
    case 'PLACED':
      return '#FF9800';
    case 'ACCEPTED':
      return '#2196F3';
    case 'PREPARING':
      return '#9C27B0';
    case 'READY':
      return '#4CAF50';
    case 'OUT_FOR_DELIVERY':
      return '#00BCD4';
    case 'DELIVERED':
      return '#4CAF50';
    case 'CANCELLED':
      return '#F44336';
    default:
      return '#666';
  }
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
    backgroundColor: '#FFF',
    padding: 16,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFF',
    margin: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    minWidth: '45%',
    justifyContent: 'center',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  updateButton: {
    backgroundColor: '#2196F3',
  },
  assignButton: {
    backgroundColor: '#FF6B35',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dialog: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  noDeliveryBoys: {
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  deliveryBoyOption: {
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 8,
  },
  deliveryBoyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  deliveryBoyMobile: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  cancelButton: {
    marginTop: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OrderDetailScreen;

