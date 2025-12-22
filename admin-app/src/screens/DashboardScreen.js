import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchDashboardStats} from '../store/slices/dashboardSlice';
import {logout} from '../store/slices/authSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';

const DashboardScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {stats, isLoading} = useSelector((state) => state.dashboard);
  const {user} = useSelector((state) => state.auth);
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchDashboardStats());
    setRefreshing(false);
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigation.replace('Login');
  };

  const StatCard = ({title, value, icon, color, onPress}) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <View style={[styles.statIconContainer, {backgroundColor: color + '20'}]}>
        <Icon name={icon} size={32} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome, {user?.username || 'Admin'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="logout" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.statsGrid}>
          <StatCard
            title="Today's Orders"
            value={stats?.todayOrders || 0}
            icon="receipt"
            color="#4CAF50"
          />
          <StatCard
            title="Today's Revenue"
            value={`₹${stats?.todayRevenue?.toFixed(2) || '0.00'}`}
            icon="attach-money"
            color="#2196F3"
          />
          <StatCard
            title="Pending Orders"
            value={stats?.pendingOrders || 0}
            icon="pending"
            color="#FF9800"
            onPress={() => navigation.navigate('Orders', {status: 'PLACED'})}
          />
          <StatCard
            title="Preparing"
            value={stats?.preparingOrders || 0}
            icon="restaurant"
            color="#9C27B0"
            onPress={() => navigation.navigate('Orders', {status: 'PREPARING'})}
          />
          <StatCard
            title="Active Delivery Boys"
            value={stats?.activeDeliveryBoys || 0}
            icon="delivery-dining"
            color="#F44336"
            onPress={() => navigation.navigate('DeliveryBoys')}
          />
          <StatCard
            title="Total Customers"
            value={stats?.totalCustomers || 0}
            icon="people"
            color="#00BCD4"
          />
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('MenuManagement')}>
              <Icon name="restaurant-menu" size={28} color="#FF6B35" />
              <Text style={styles.actionText}>Manage Menu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Orders')}>
              <Icon name="list-alt" size={28} color="#FF6B35" />
              <Text style={styles.actionText}>View Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('DeliveryBoys')}>
              <Icon name="people" size={28} color="#FF6B35" />
              <Text style={styles.actionText}>Delivery Boys</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Settings')}>
              <Icon name="settings" size={28} color="#FF6B35" />
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
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
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
  },
  quickActions: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

export default DashboardScreen;


