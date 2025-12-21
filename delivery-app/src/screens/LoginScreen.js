import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {sendOtp, verifyOtp} from '../store/slices/authSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';

const LoginScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {isLoading} = useSelector(state => state.auth);
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = async () => {
    if (mobileNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }
    try {
      await dispatch(sendOtp(mobileNumber)).unwrap();
      setOtpSent(true);
      Alert.alert('Success', 'OTP sent. Check backend console for OTP (development mode).');
    } catch (error) {
      Alert.alert('Error', error || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter 6-digit OTP');
      return;
    }
    try {
      await dispatch(verifyOtp({mobileNumber, otp})).unwrap();
      Alert.alert('Success', 'Login successful');
      navigation.replace('MainTabs');
    } catch (error) {
      Alert.alert('Error', error || 'Invalid OTP');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="delivery-dining" size={64} color="#FF6B35" />
        <Text style={styles.title}>Delivery Boy Login</Text>
        <Text style={styles.subtitle}>Enter your mobile number</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Icon name="phone-android" size={20} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Mobile Number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            maxLength={10}
            value={mobileNumber}
            onChangeText={setMobileNumber}
            editable={!otpSent}
          />
        </View>

        {otpSent && (
          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={otpSent ? handleVerifyOtp : handleSendOtp}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>{otpSent ? 'Verify OTP' : 'Send OTP'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
  },
  inputIcon: {
    marginLeft: 18,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    paddingRight: 18,
    fontSize: 16,
    color: '#1A1A1A',
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default LoginScreen;


