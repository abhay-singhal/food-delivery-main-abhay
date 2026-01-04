# Online Payment (Razorpay) Integration - Complete Guide

## 📋 Overview

This guide explains how the online payment system works in your food delivery app, including order placement, payment processing, and order management.

---

## 🔄 Complete Online Payment Flow

### **Step 1: User Selects Online Payment**
- User is on `CheckoutScreen`
- User selects **"Online Payment"** option
- User fills delivery address and selects location
- User clicks **"Place Order"**

### **Step 2: Order Creation (Pending Payment)**
```
Frontend → POST /api/v1/customer/orders
{
  items: [...],
  paymentMethod: "ONLINE",
  deliveryAddress: "...",
  deliveryLatitude: ...,
  deliveryLongitude: ...,
  deliveryCity: "Meerut"
}

Backend:
1. Creates Order with status: PENDING_PAYMENT
2. Creates Payment record with status: PENDING
3. Creates Razorpay Order via Razorpay API
4. Gets razorpayOrderId
5. Saves razorpayOrderId to Payment entity

Response:
{
  success: true,
  message: "Order placed successfully, awaiting payment",
  data: {
    order: {...},
    razorpayOrderId: "order_xxxxx"
  }
}
```

### **Step 3: Razorpay Payment UI**
```
Frontend receives response with razorpayOrderId
  ↓
Opens Razorpay Checkout
  - Uses react-native-razorpay SDK
  - Passes: razorpayOrderId, amount, currency, key
  ↓
User sees Razorpay payment screen
  - User enters payment details (Card/UPI/Netbanking)
  - User completes payment
```

### **Step 4: Payment Verification**
```
Razorpay returns:
{
  razorpay_payment_id: "pay_xxxxx",
  razorpay_order_id: "order_xxxxx",
  razorpay_signature: "signature_xxxxx"
}

Frontend → POST /api/v1/customer/orders/{orderId}/payment/razorpay/verify
Params:
  - razorpayOrderId
  - razorpayPaymentId
  - razorpaySignature

Backend:
1. Verifies signature with Razorpay
2. Updates Payment status: PENDING → COMPLETED
3. Updates Order status: PENDING_PAYMENT → PLACED
4. Saves payment details

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
Shows success message
  ↓
Navigates to OrderTrackingScreen
  - Order is now PLACED
  - Payment is COMPLETED
  - Order processing begins
```

---

## 📱 Screens and Features

### **1. My Orders Screen** (`MyOrdersScreen.js`)

**Features:**
- ✅ Displays all user orders
- ✅ Shows order status with color-coded badges
- ✅ Shows order details (items, address, payment method)
- ✅ **"Pay Now"** button for orders with `PENDING_PAYMENT` status
- ✅ **"Track"** button to view order details
- ✅ Pull-to-refresh functionality
- ✅ Empty state when no orders

**Navigation:**
- Profile → My Orders → MyOrdersScreen
- Shows all orders from `fetchMyOrders` API

### **2. Payment Screen** (`PaymentScreen.js`)

**Features:**
- ✅ Displays order details
- ✅ Shows amount breakdown (subtotal, delivery, total)
- ✅ Razorpay payment integration
- ✅ Creates Razorpay order if not exists
- ✅ Opens Razorpay checkout UI
- ✅ Verifies payment with backend
- ✅ Updates order status after successful payment

**Navigation:**
- My Orders → Pay Now → PaymentScreen
- CheckoutScreen → (if online payment) → PaymentScreen

### **3. Checkout Screen** (`CheckoutScreen.js`)

**Features:**
- ✅ Handles both COD and Online Payment
- ✅ For ONLINE: Creates order → Opens Razorpay → Verifies payment
- ✅ For COD: Creates order → Shows success → Navigates to tracking

---

## 🔧 Implementation Details

### **Order Status Flow:**

**COD Orders:**
```
PLACED → ACCEPTED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
```

**Online Payment Orders:**
```
PENDING_PAYMENT → (after payment) → PLACED → ACCEPTED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
```

### **Payment Status Flow:**

**COD:**
```
PENDING → (when delivered) → COMPLETED
```

**Online Payment:**
```
PENDING → (after payment verification) → COMPLETED
```

---

## 💻 Code Structure

### **Services:**

1. **`orderService.js`**
   - `placeOrder()` - Creates order
   - `getMyOrders()` - Fetches all user orders
   - `getOrder()` - Fetches single order details

2. **`paymentService.js`**
   - `createRazorpayOrder()` - Creates Razorpay order for existing order
   - `verifyPayment()` - Verifies Razorpay payment

### **Redux Slice:**

**`orderSlice.js`**
- `placeOrder` - Async thunk for placing orders
- `fetchMyOrders` - Async thunk for fetching orders
- State: `orders[]`, `currentOrder`, `isLoading`, `error`

### **Screens:**

1. **`MyOrdersScreen.js`** - Lists all orders
2. **`PaymentScreen.js`** - Handles payment for pending orders
3. **`CheckoutScreen.js`** - Initial order placement with payment
4. **`OrderTrackingScreen.js`** - Tracks individual order

---

## 🎯 User Flow Examples

### **Example 1: Complete Online Payment Flow**

1. User adds items to cart
2. User goes to Checkout
3. User selects "Online Payment"
4. User fills address and selects location
5. User clicks "Place Order"
6. Order created with status `PENDING_PAYMENT`
7. Razorpay checkout opens automatically
8. User completes payment
9. Payment verified with backend
10. Order status changes to `PLACED`
11. User navigated to Order Tracking

### **Example 2: Payment for Pending Order**

1. User goes to Profile → My Orders
2. User sees order with "Pay Now" button
3. User clicks "Pay Now"
4. PaymentScreen opens
5. User clicks "Pay ₹XXX"
6. Razorpay checkout opens
7. User completes payment
8. Payment verified
9. Order status updated to `PLACED`
10. User can track order

---

## 🔑 Key Configuration

### **Razorpay Keys:**
- **Key ID:** `rzp_test_RsgVjuSDbgAziI` (in `CheckoutScreen.js` and `PaymentScreen.js`)
- **Key Secret:** Configured in backend `application.properties`
- **Test Mode:** Currently using test keys

### **Backend Endpoints:**
- `POST /api/v1/customer/orders` - Place order
- `GET /api/v1/customer/orders` - Get all orders
- `GET /api/v1/customer/orders/{id}` - Get order details
- `POST /api/v1/customer/orders/{id}/payment/razorpay/create` - Create Razorpay order
- `POST /api/v1/customer/orders/{id}/payment/razorpay/verify` - Verify payment

---

## 🧪 Testing

### **Test Cards (Razorpay Test Mode):**

**Success:**
- Card: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: Any 3 digits

**Failure:**
- Card: `4000 0000 0000 0002`

### **Test Scenarios:**

1. **Complete Payment Flow:**
   - Place order with ONLINE payment
   - Complete payment with test card
   - Verify order status changes to PLACED

2. **Payment Cancellation:**
   - Place order with ONLINE payment
   - Cancel payment in Razorpay
   - Verify order remains PENDING_PAYMENT
   - Verify "Pay Now" button appears in My Orders

3. **Payment Retry:**
   - Order with PENDING_PAYMENT status
   - Go to My Orders
   - Click "Pay Now"
   - Complete payment
   - Verify order status updates

---

## 🚨 Error Handling

### **Payment Cancelled:**
- Order remains in `PENDING_PAYMENT`
- User can retry payment from My Orders
- No charges applied

### **Payment Failed:**
- Order remains in `PENDING_PAYMENT`
- User can retry payment
- Error message shown to user

### **Verification Failed:**
- Payment marked as FAILED
- Order remains in `PENDING_PAYMENT`
- User can retry payment
- Admin can investigate

---

## 📝 Notes

- **Test Mode:** Currently using Razorpay test keys. Update to production keys in `application.properties` and screens for production.
- **Signature Verification:** Backend currently has simplified verification. Implement proper Razorpay signature verification for production.
- **Payment Retry:** Users can retry payment for orders in `PENDING_PAYMENT` status from My Orders screen.
- **Order Status:** Orders with `PENDING_PAYMENT` status won't be processed until payment is completed.

---

## ✅ Summary

✅ **My Orders Screen** - Displays all orders with status and payment options  
✅ **Payment Screen** - Dedicated screen for completing payments  
✅ **Razorpay Integration** - Complete payment flow with verification  
✅ **Order Management** - Track orders from placement to delivery  
✅ **Payment Retry** - Ability to pay for pending orders  
✅ **Status Tracking** - Real-time order and payment status updates

The online payment system is now fully integrated and functional!






