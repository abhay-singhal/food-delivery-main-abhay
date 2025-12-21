import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {useDispatch, useSelector} from 'react-redux';
import {
  createMenuItem,
  updateMenuItem,
  fetchCategories,
  fetchMenuItems,
} from '../store/slices/menuSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AddEditMenuItemScreen = ({navigation, route}) => {
  const dispatch = useDispatch();
  const {categories, items} = useSelector((state) => state.menu);
  const item = route?.params?.item;
  const isEdit = !!item;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    imageUrl: '',
    isVegetarian: true,
    isSpicy: false,
    preparationTimeMinutes: '',
    displayOrder: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        price: item.price?.toString() || '',
        categoryId: item.category?.id?.toString() || '',
        imageUrl: item.imageUrl || '',
        isVegetarian: item.isVegetarian !== false,
        isSpicy: item.isSpicy || false,
        preparationTimeMinutes: item.preparationTimeMinutes?.toString() || '',
        displayOrder: item.displayOrder?.toString() || '',
      });
    }
  }, [item, dispatch]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.categoryId) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const menuItem = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: {id: parseInt(formData.categoryId)},
        imageUrl: formData.imageUrl || null,
        isVegetarian: formData.isVegetarian,
        isSpicy: formData.isSpicy,
        preparationTimeMinutes: formData.preparationTimeMinutes
          ? parseInt(formData.preparationTimeMinutes)
          : null,
        displayOrder: formData.displayOrder ? parseInt(formData.displayOrder) : 0,
        status: 'AVAILABLE',
      };

      if (isEdit) {
        await dispatch(
          updateMenuItem({itemId: item.id, item: menuItem})
        ).unwrap();
        Alert.alert('Success', 'Menu item updated successfully');
      } else {
        await dispatch(createMenuItem(menuItem)).unwrap();
        Alert.alert('Success', 'Menu item created successfully');
      }

      dispatch(fetchMenuItems());
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error || 'Failed to save menu item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? 'Edit Menu Item' : 'Add Menu Item'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
              placeholder="Enter item name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) =>
                setFormData({...formData, description: text})
              }
              placeholder="Enter description"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Price (₹) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.price}
              onChangeText={(text) => setFormData({...formData, price: text})}
              placeholder="Enter price"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Category <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.categoryId}
                onValueChange={(value) =>
                  setFormData({...formData, categoryId: value})
                }
                style={styles.picker}>
                <Picker.Item label="Select Category" value="" />
                {categories.map((cat) => (
                  <Picker.Item
                    key={cat.id}
                    label={cat.name}
                    value={cat.id.toString()}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Image URL</Text>
            <TextInput
              style={styles.input}
              value={formData.imageUrl}
              onChangeText={(text) =>
                setFormData({...formData, imageUrl: text})
              }
              placeholder="Enter image URL"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preparation Time (minutes)</Text>
            <TextInput
              style={styles.input}
              value={formData.preparationTimeMinutes}
              onChangeText={(text) =>
                setFormData({...formData, preparationTimeMinutes: text})
              }
              placeholder="Enter preparation time"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Order</Text>
            <TextInput
              style={styles.input}
              value={formData.displayOrder}
              onChangeText={(text) =>
                setFormData({...formData, displayOrder: text})
              }
              placeholder="Enter display order"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.checkboxGroup}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() =>
                setFormData({...formData, isVegetarian: !formData.isVegetarian})
              }>
              <Icon
                name={formData.isVegetarian ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color={formData.isVegetarian ? '#4CAF50' : '#999'}
              />
              <Text style={styles.checkboxLabel}>Vegetarian</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkbox}
              onPress={() =>
                setFormData({...formData, isSpicy: !formData.isSpicy})
              }>
              <Icon
                name={formData.isSpicy ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color={formData.isSpicy ? '#FF6B35' : '#999'}
              />
              <Text style={styles.checkboxLabel}>Spicy</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEdit ? 'Update Item' : 'Create Item'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#F44336',
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  checkboxGroup: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddEditMenuItemScreen;

