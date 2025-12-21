import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {
  fetchDeliveryBoys,
  createDeliveryBoy,
  updateDeliveryBoyStatus,
} from '../store/slices/deliveryBoySlice';
import Icon from 'react-native-vector-icons/MaterialIcons';

const DeliveryBoysScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {deliveryBoys, isLoading} = useSelector((state) => state.deliveryBoy);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    mobileNumber: '',
    fullName: '',
    licenseNumber: '',
    vehicleNumber: '',
    vehicleType: '',
  });

  useEffect(() => {
    loadDeliveryBoys();
  }, []);

  const loadDeliveryBoys = async () => {
    await dispatch(fetchDeliveryBoys());
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadDeliveryBoys();
    setRefreshing(false);
  }, []);

  const handleCreate = async () => {
    if (
      !formData.mobileNumber ||
      !formData.fullName ||
      !formData.licenseNumber ||
      !formData.vehicleNumber ||
      !formData.vehicleType
    ) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      await dispatch(createDeliveryBoy(formData)).unwrap();
      Alert.alert('Success', 'Delivery boy created successfully');
      setShowAddModal(false);
      setFormData({
        mobileNumber: '',
        fullName: '',
        licenseNumber: '',
        vehicleNumber: '',
        vehicleType: '',
      });
    } catch (error) {
      Alert.alert('Error', error || 'Failed to create delivery boy');
    }
  };

  const handleToggleStatus = async (db, field) => {
    const updates = {};
    if (field === 'isActive') {
      updates.isActive = !db.isActive;
    } else if (field === 'isAvailable') {
      updates.isAvailable = !db.isAvailable;
    } else if (field === 'isOnDuty') {
      updates.isOnDuty = !db.isOnDuty;
    }

    try {
      await dispatch(
        updateDeliveryBoyStatus({
          id: db.id,
          ...updates,
        })
      ).unwrap();
    } catch (error) {
      Alert.alert('Error', error || 'Failed to update status');
    }
  };

  const renderDeliveryBoy = ({item}) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.mobile}>{item.mobile}</Text>
        </View>
        <View style={styles.badges}>
          {item.isOnDuty && (
            <View style={[styles.badge, styles.onDutyBadge]}>
              <Text style={styles.badgeText}>On Duty</Text>
            </View>
          )}
          {item.isAvailable && (
            <View style={[styles.badge, styles.availableBadge]}>
              <Text style={styles.badgeText}>Available</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Icon name="directions-car" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.vehicleType} - {item.vehicleNumber}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="badge" size={16} color="#666" />
          <Text style={styles.detailText}>{item.licenseNumber}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="local-shipping" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.totalDeliveries || 0} deliveries
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="attach-money" size={16} color="#666" />
          <Text style={styles.detailText}>
            ₹{item.totalEarnings?.toFixed(2) || '0.00'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            item.isOnDuty ? styles.toggleButtonActive : styles.toggleButtonInactive,
          ]}
          onPress={() => handleToggleStatus(item, 'isOnDuty')}>
          <Text
            style={[
              styles.toggleButtonText,
              item.isOnDuty
                ? styles.toggleButtonTextActive
                : styles.toggleButtonTextInactive,
            ]}>
            {item.isOnDuty ? 'On Duty' : 'Off Duty'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            item.isAvailable
              ? styles.toggleButtonActive
              : styles.toggleButtonInactive,
          ]}
          onPress={() => handleToggleStatus(item, 'isAvailable')}>
          <Text
            style={[
              styles.toggleButtonText,
              item.isAvailable
                ? styles.toggleButtonTextActive
                : styles.toggleButtonTextInactive,
            ]}>
            {item.isAvailable ? 'Available' : 'Busy'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Boys</Text>
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={styles.addButton}>
          <Icon name="add" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      {isLoading && !deliveryBoys.length ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : (
        <FlatList
          data={deliveryBoys}
          renderItem={renderDeliveryBoy}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="people" size={64} color="#CCC" />
              <Text style={styles.emptyText}>No delivery boys found</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Delivery Boy</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <TextInput
                style={styles.input}
                placeholder="Mobile Number"
                value={formData.mobileNumber}
                onChangeText={(text) =>
                  setFormData({...formData, mobileNumber: text})
                }
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={formData.fullName}
                onChangeText={(text) =>
                  setFormData({...formData, fullName: text})
                }
              />
              <TextInput
                style={styles.input}
                placeholder="License Number"
                value={formData.licenseNumber}
                onChangeText={(text) =>
                  setFormData({...formData, licenseNumber: text})
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Vehicle Number"
                value={formData.vehicleNumber}
                onChangeText={(text) =>
                  setFormData({...formData, vehicleNumber: text})
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Vehicle Type (e.g., Bike, Car)"
                value={formData.vehicleType}
                onChangeText={(text) =>
                  setFormData({...formData, vehicleType: text})
                }
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreate}>
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 12,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  mobile: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onDutyBadge: {
    backgroundColor: '#E3F2FD',
  },
  availableBadge: {
    backgroundColor: '#E8F5E9',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2196F3',
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#E8F5E9',
  },
  toggleButtonInactive: {
    backgroundColor: '#FFEBEE',
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: '#4CAF50',
  },
  toggleButtonTextInactive: {
    color: '#F44336',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DeliveryBoysScreen;

