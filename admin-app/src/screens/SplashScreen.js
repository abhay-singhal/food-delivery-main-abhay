import React, {useEffect} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {checkAuth} from '../store/slices/authSlice';

const SplashScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {isAuthenticated} = useSelector((state) => state.auth);

  useEffect(() => {
    const init = async () => {
      await dispatch(checkAuth());
      setTimeout(() => {
        if (isAuthenticated) {
          navigation.replace('Dashboard');
        } else {
          navigation.replace('Login');
        }
      }, 2000);
    };
    init();
  }, [dispatch, navigation, isAuthenticated]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shiv Dhaba</Text>
      <Text style={styles.subtitle}>Admin Panel</Text>
      <ActivityIndicator size="large" color="#FF6B35" style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 32,
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;


