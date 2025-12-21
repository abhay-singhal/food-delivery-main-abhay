import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchConfig, updateConfig} from '../store/slices/configSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SettingsScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {config, isLoading} = useSelector((state) => state.config);
  const [restaurantOpen, setRestaurantOpen] = useState(false);
  const [codEnabled, setCodEnabled] = useState(true);

  useEffect(() => {
    dispatch(fetchConfig());
  }, [dispatch]);

  useEffect(() => {
    if (config) {
      setRestaurantOpen(config.RESTAURANT_OPEN === 'true');
      setCodEnabled(config.COD_ENABLED !== 'false');
    }
  }, [config]);

  const handleRestaurantToggle = async (value) => {
    try {
      await dispatch(
        updateConfig({
          key: 'RESTAURANT_OPEN',
          value: value ? 'true' : 'false',
          description: 'Restaurant open/close status',
        })
      ).unwrap();
      setRestaurantOpen(value);
      Alert.alert(
        'Success',
        value ? 'Restaurant is now open' : 'Restaurant is now closed'
      );
    } catch (error) {
      Alert.alert('Error', error || 'Failed to update setting');
    }
  };

  const handleCodToggle = async (value) => {
    try {
      await dispatch(
        updateConfig({
          key: 'COD_ENABLED',
          value: value ? 'true' : 'false',
          description: 'Cash on Delivery enabled/disabled',
        })
      ).unwrap();
      setCodEnabled(value);
      Alert.alert(
        'Success',
        value ? 'COD is now enabled' : 'COD is now disabled'
      );
    } catch (error) {
      Alert.alert('Error', error || 'Failed to update setting');
    }
  };

  const SettingItem = ({icon, title, description, value, onValueChange}) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Icon name={icon} size={24} color="#FF6B35" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{false: '#CCC', true: '#FF6B35'}}
        thumbColor="#FFF"
      />
    </View>
  );

  if (isLoading && !config) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant Settings</Text>
          <SettingItem
            icon="restaurant"
            title="Restaurant Open"
            description="Toggle restaurant availability"
            value={restaurantOpen}
            onValueChange={handleRestaurantToggle}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Settings</Text>
          <SettingItem
            icon="money"
            title="Cash on Delivery (COD)"
            description="Enable or disable COD payment method"
            value={codEnabled}
            onValueChange={handleCodToggle}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>App Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Restaurant</Text>
            <Text style={styles.aboutValue}>Shiv Dhaba</Text>
          </View>
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Location</Text>
            <Text style={styles.aboutValue}>Meerut</Text>
          </View>
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
  section: {
    backgroundColor: '#FFF',
    marginTop: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  aboutLabel: {
    fontSize: 14,
    color: '#666',
  },
  aboutValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

export default SettingsScreen;

