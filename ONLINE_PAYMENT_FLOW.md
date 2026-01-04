# Online Payment (Razorpay) Flow - Complete Guide

## 📋 Overview

When a user selects **"Online Payment"** instead of **"Cash on Delivery (COD)"**, the application follows a different flow that involves Razorpay payment gateway integration.

---

## 🔄 Complete Payment Flow

### **Step 1: User Selects Online Payment**
- User is on `CheckoutScreen`
- User selects **"Online Payment"** radio button
- User fills in delivery address and location
- User clicks **"Place Order"**

### **Step 2: Order Creation (Pending Payment)**
```
Frontend (CheckoutScreen)
  ↓
POST /api/v1/customer/orders
  {
    items: [...],
    paymentMethod: "ONLINE" or "RAZORPAY",
    deliveryAddress: "...",
    deliveryLatitude: ...,
    deliveryLongitude: ...,
    deliveryCity: "Meerut"
  }
  ↓
Backend (CustomerController.placeOrder)
  ↓
OrderService.placeOrder()
  - Creates Order with status: PENDING_PAYMENT
  - Creates Payment record with status: PENDING
  - Calculates totals
  ↓
PaymentService.createRazorpayOrder()
  - Creates Razorpay order via Razorpay API
  - Gets razorpayOrderId
  - Saves razorpayOrderId to Payment entity
  ↓
Response to Frontend:
  {
    success: true,
    message: "Order placed successfully, awaiting payment",
    data: {
      order: {...},
      razorpayOrderId: "order_xxxxx"
    }
  }
```

### **Step 3: Frontend Initiates Razorpay Payment**
```
CheckoutScreen receives response
  ↓
Extract: razorpayOrderId from result.data.razorpayOrderId
  ↓
Open Razorpay Checkout
  - Use react-native-razorpay SDK
  - Pass: razorpayOrderId, amount, currency, key
  ↓
User sees Razorpay payment screen
  - User enters payment details (Card/UPI/Netbanking)
  - User completes payment
```

### **Step 4: Payment Verification**
```
Razorpay returns payment response:
  {
    razorpay_payment_id: "pay_xxxxx",
    razorpay_order_id: "order_xxxxx",
    razorpay_signature: "signature_xxxxx"
  }
  ↓
Frontend calls:
  POST /api/v1/customer/orders/{orderId}/payment/razorpay/verify
  Params:
    - razorpayOrderId
    - razorpayPaymentId
    - razorpaySignature
  ↓
Backend (PaymentService.verifyPayment)
  - Verifies signature with Razorpay
  - Updates Payment status to COMPLETED
  - Updates Order status from PENDING_PAYMENT to PLACED
  - Saves payment details
  ↓
Response:
  {
    success: true,
    message: "Payment verified successfully",
    data: {
      payment: {...},
      order: {...}
    }
  }
```

### **Step 5: Order Confirmation**
```
Frontend receives verification success
  ↓
Show success message
  ↓
Navigate to OrderTrackingScreen
  - Order is now PLACED
  - Payment is COMPLETED
  - Order processing begins
```

---

## 🔴 Current Implementation Status

### ✅ **What's Already Implemented:**

1. **Backend:**
   - ✅ Order creation with `PENDING_PAYMENT` status for online payments
   - ✅ Razorpay order creation (`PaymentService.createRazorpayOrder`)
   - ✅ Payment verification endpoint (`PaymentService.verifyPayment`)
   - ✅ Order status update after payment verification
   - ✅ Razorpay API keys configured in `application.properties`

2. **Frontend:**
   - ✅ Payment method selection (COD/ONLINE)
   - ✅ Order placement API call
   - ✅ `paymentService.js` with Razorpay methods
   - ✅ `react-native-razorpay` SDK installed

### ❌ **What's Missing (Needs Implementation):**

1. **CheckoutScreen.js:**
   - ❌ Handle Razorpay payment flow after order creation
   - ❌ Open Razorpay checkout UI
   - ❌ Process payment response
   - ❌ Call payment verification API
   - ❌ Handle payment success/failure

---

## 💻 Implementation Required

### **Update CheckoutScreen.js**

You need to add Razorpay payment handling after order placement:

```javascript
import RazorpayCheckout from 'react-native-razorpay';
import {paymentService} from '../services/paymentService';

// In handlePlaceOrder function, after order is placed:

if (result && result.success) {
  const order = result.data?.order || result.data;
  const orderId = order?.id || order?.orderNumber;
  const razorpayOrderId = result.data?.razorpayOrderId;
  
  // If online payment, initiate Razorpay checkout
  if (paymentMethodUpper === 'ONLINE' || paymentMethodUpper === 'RAZORPAY') {
    if (!razorpayOrderId) {
      Alert.alert('Error', 'Payment initialization failed');
      return;
    }
    
    // Open Razorpay checkout
    const options = {
      description: `Order #${order.orderNumber || orderId}`,
      image: 'https://your-logo-url.com/logo.png',
      currency: 'INR',
      key: 'rzp_test_RsgVjuSDbgAziI', // Your Razorpay key ID
      amount: order.totalAmount * 100, // Amount in paise
      name: 'Shiv Dhaba',
      order_id: razorpayOrderId,
      prefill: {
        email: user?.email || '',
        contact: user?.mobileNumber || '',
        name: user?.fullName || '',
      },
      theme: {color: '#FF6B35'},
    };
    
    try {
      const paymentData = await RazorpayCheckout.open(options);
      
      // Payment successful, verify with backend
      const verifyResult = await paymentService.verifyPayment(
        orderId,
        razorpayOrderId,
        paymentData.razorpay_payment_id,
        paymentData.razorpay_signature
      );
      
      if (verifyResult.success) {
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
        Alert.alert('Error', 'Payment verification failed');
      }
    } catch (error) {
      // Payment cancelled or failed
      if (error.code === 'RazorpayCheckout.CANCELLED') {
        Alert.alert('Payment Cancelled', 'You cancelled the payment. Order is pending payment.');
      } else {
        Alert.alert('Payment Failed', error.description || 'Payment failed. Please try again.');
      }
    }
  } else {
    // COD - direct success
    Alert.alert('Success', 'Order placed successfully!', [
      {
        text: 'OK',
        onPress: () => {
          dispatch(clearCart());
          navigation.replace('OrderTracking', {orderId});
        },
      },
    ]);
  }
}
```

---

## 📊 Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER ON CHECKOUT SCREEN                  │
│              Selects "Online Payment" + Places Order         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         POST /api/v1/customer/orders                        │
│         paymentMethod: "ONLINE"                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         BACKEND: Create Order                                │
│         - Order Status: PENDING_PAYMENT                      │
│         - Payment Status: PENDING                            │
│         - Create Razorpay Order                             │
│         - Return razorpayOrderId                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         FRONTEND: Open Razorpay Checkout                    │
│         - Use razorpayOrderId                               │
│         - Show payment UI                                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         USER: Completes Payment                             │
│         - Enters card/UPI details                           │
│         - Confirms payment                                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         RAZORPAY: Returns Payment Response                  │
│         - razorpay_payment_id                               │
│         - razorpay_signature                                │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         POST /api/v1/customer/orders/{id}/payment/verify    │
│         - Verify signature                                  │
│         - Update Payment: COMPLETED                          │
│         - Update Order: PENDING_PAYMENT → PLACED              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         SUCCESS: Navigate to Order Tracking                 │
│         - Order is now PLACED                               │
│         - Payment is COMPLETED                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Points

### **Order Status Flow:**
- **COD:** `PLACED` (immediately after order creation)
- **Online Payment:** `PENDING_PAYMENT` → `PLACED` (after payment verification)

### **Payment Status Flow:**
- **COD:** `PENDING` → `COMPLETED` (when order is delivered)
- **Online Payment:** `PENDING` → `COMPLETED` (after payment verification)

### **Razorpay Configuration:**
- **Key ID:** `rzp_test_RsgVjuSDbgAziI` (in `application.properties`)
- **Key Secret:** Configured in backend
- **Test Mode:** Currently using test keys

### **Error Handling:**
- Payment cancellation: Order remains in `PENDING_PAYMENT`
- Payment failure: Order remains in `PENDING_PAYMENT`
- Verification failure: Payment marked as `FAILED`

---

## 🚀 Next Steps

1. **Implement Razorpay checkout in CheckoutScreen.js** (see code above)
2. **Test with Razorpay test cards:**
   - Success: `4111 1111 1111 1111`
   - Failure: `4000 0000 0000 0002`
3. **Handle edge cases:**
   - Payment timeout
   - Network errors during verification
   - User cancels payment
4. **Add payment retry option** for failed payments
5. **Update OrderTrackingScreen** to show payment status

---

## 📝 Notes

- **Test Mode:** Currently using Razorpay test keys. For production, update keys in `application.properties`
- **Signature Verification:** Backend currently has simplified verification. Implement proper signature verification for production.
- **Payment Retry:** Consider adding ability to retry payment for orders in `PENDING_PAYMENT` status.






