import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {addToCart, updateQuantity, removeFromCart} from '../store/slices/cartSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MenuItemDetailScreen = ({navigation, route}) => {
  const {item} = route.params || {};
  const dispatch = useDispatch();
  const cartItems = useSelector(state => state.cart.items);
  
  const cartItem = cartItems.find(cartItem => cartItem.id === item?.id);
  const quantity = cartItem?.quantity || 0;

  if (!item) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Item Details</Text>
          <View style={{width: 24}} />
        </View>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={64} color="#FF6B35" />
          <Text style={styles.errorText}>Item not found</Text>
        </View>
      </View>
    );
  }

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    
    if (newQuantity <= 0) {
      dispatch(removeFromCart(item.id));
    } else if (quantity === 0) {
      dispatch(addToCart({menuItem: item, quantity: 1}));
    } else {
      dispatch(updateQuantity({itemId: item.id, quantity: newQuantity}));
    }
  };

  const handleAddToCart = () => {
    if (quantity === 0) {
      dispatch(addToCart({menuItem: item, quantity: 1}));
      Alert.alert('Success', 'Item added to cart!', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Item Details</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Section */}
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image source={{uri: item.imageUrl}} style={styles.image} />
          ) : (
            <View style={styles.placeholderImage}>
              <Icon name="restaurant-menu" size={64} color="#CCC" />
            </View>
          )}
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          {/* Name and Price */}
          <View style={styles.titleRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>₹{item.price}</Text>
          </View>

          {/* Category and Tags */}
          <View style={styles.tagsContainer}>
            {item.categoryName && (
              <View style={styles.tag}>
                <Icon name="category" size={14} color="#FF6B35" />
                <Text style={styles.tagText}>{item.categoryName}</Text>
              </View>
            )}
            {item.isVegetarian && (
              <View style={[styles.tag, styles.vegetarianTag]}>
                <Icon name="eco" size={14} color="#4CAF50" />
                <Text style={[styles.tagText, styles.vegetarianText]}>Vegetarian</Text>
              </View>
            )}
            {item.isSpicy && (
              <View style={[styles.tag, styles.spicyTag]}>
                <Icon name="whatshot" size={14} color="#FF5722" />
                <Text style={[styles.tagText, styles.spicyText]}>Spicy</Text>
              </View>
            )}
          </View>

          {/* Description */}
          {item.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{item.description}</Text>
            </View>
          )}

          {/* Additional Info */}
          <View style={styles.infoSection}>
            {item.preparationTimeMinutes && (
              <View style={styles.infoRow}>
                <Icon name="schedule" size={20} color="#666" />
                <Text style={styles.infoText}>
                  Preparation Time: {item.preparationTimeMinutes} minutes
                </Text>
              </View>
            )}
            {item.status && (
              <View style={styles.infoRow}>
                <Icon
                  name={item.status === 'AVAILABLE' ? 'check-circle' : 'cancel'}
                  size={20}
                  color={item.status === 'AVAILABLE' ? '#4CAF50' : '#FF5722'}
                />
                <Text
                  style={[
                    styles.infoText,
                    item.status === 'AVAILABLE' ? styles.availableText : styles.unavailableText,
                  ]}>
                  {item.status === 'AVAILABLE' ? 'Available' : 'Unavailable'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Footer with Quantity Controls */}
      <View style={styles.footer}>
        {quantity > 0 ? (
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(-1)}
              activeOpacity={0.7}>
              <Icon name="remove" size={24} color="#FF6B35" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(1)}
              activeOpacity={0.7}>
              <Icon name="add" size={24} color="#FF6B35" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddToCart}
            activeOpacity={0.8}>
            <Icon name="add-shopping-cart" size={24} color="#FFF" />
            <Text style={styles.addButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FF6B35',
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#FFF',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    backgroundColor: '#FFF',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  itemName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  itemPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  vegetarianTag: {
    backgroundColor: '#E8F5E9',
  },
  spicyTag: {
    backgroundColor: '#FFEBEE',
  },
  tagText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  vegetarianText: {
    color: '#4CAF50',
  },
  spicyText: {
    color: '#FF5722',
  },
  descriptionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  infoSection: {
    marginTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
  },
  availableText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  unavailableText: {
    color: '#FF5722',
    fontWeight: '500',
  },
  footer: {
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
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF5F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  quantityText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 40,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    padding: 15,
    borderRadius: 8,
    gap: 10,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF6B35',
    marginTop: 16,
    fontWeight: '500',
  },
});

export default MenuItemDetailScreen;


