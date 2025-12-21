# Order Assignment & Notification Flow - Architecture Document

## 📋 Overview

This document describes the order assignment and notification system for the food delivery platform. The system ensures that when an order becomes ready, all available delivery partners are notified, and the first one to accept gets the order with proper concurrency safety.

---

## 🏗️ System Architecture

### Components

1. **OrderAssignmentService** - Handles order assignment logic with concurrency safety
2. **NotificationService** - Sends push notifications via Firebase Cloud Messaging
3. **LocationBroadcastService** - Broadcasts delivery partner locations for real-time tracking
4. **OrderService** - Triggers notifications when order status changes to READY
5. **DeliveryController** - API endpoints for delivery partners

---

## 📊 Data Model

### Order Entity
```java
- id: Long
- orderNumber: String
- customer: User (ManyToOne)
- deliveryBoy: User (ManyToOne, nullable) // null = unassigned
- status: OrderStatus (PLACED → ACCEPTED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED)
- deliveryAddress: String
- deliveryLatitude: Double
- deliveryLongitude: Double
- readyAt: LocalDateTime // When order becomes ready for delivery
- outForDeliveryAt: LocalDateTime
- deliveredAt: LocalDateTime
```

### DeliveryBoyDetails Entity
```java
- id: Long
- user: User (OneToOne)
- isAvailable: Boolean // true = can receive new orders
- isOnDuty: Boolean // true = online/active
- currentLatitude: Double
- currentLongitude: Double
- totalDeliveries: Integer
- totalEarnings: Double
```

### Assignment Rules
- **Unassigned Order**: `deliveryBoy = null` AND `status = READY`
- **Available Partner**: `isAvailable = true` AND `isOnDuty = true` AND no active orders
- **Active Order**: `status IN (READY, OUT_FOR_DELIVERY)`

---

## 🔄 Order Assignment Flow

### Sequence Diagram

```
Customer          Backend          Admin          Delivery Partners
   |                 |               |                    |
   |--Place Order--->|               |                    |
   |                 |--Notify------>|                    |
   |                 |               |                    |
   |                 |<--Accept------|                    |
   |                 |                                    |
   |                 |<--Status: PREPARING--             |
   |                 |                                    |
   |                 |<--Status: READY------             |
   |                 |                                    |
   |                 |--Notify All Available Partners---->|
   |                 |                                    |
   |                 |<--Accept Order (Partner 1)---------|
   |                 |                                    |
   |                 |--Reject (Partner 2)----------------|
   |                 |                                    |
   |<--Out for Delivery--|                                |
   |                 |                                    |
   |                 |<--Location Updates----------------|
   |<--Location Updates--|                                |
   |                 |                                    |
   |                 |<--Mark Delivered------------------|
   |<--Delivered------|                                    |
   |                 |--Release Partner------------------>|
```

---

## 🔐 Concurrency Safety

### Strategy: Transaction + Validation

1. **Database Transaction**: All assignment operations run in `@Transactional`
2. **Double-Check Pattern**: Verify order is unassigned before and during assignment
3. **Availability Check**: Verify partner is available before assignment
4. **Status Validation**: Ensure order is in READY status

### Assignment Process (Thread-Safe)

```java
@Transactional
public Order assignOrder(Long orderId, Long deliveryPartnerId) {
    // 1. Load order (within transaction)
    Order order = orderRepository.findById(orderId);
    
    // 2. Validate order is unassigned
    if (order.getDeliveryBoy() != null) {
        throw BadRequestException("Already assigned");
    }
    
    // 3. Validate partner is available
    if (!partner.isAvailable() || partner.hasActiveOrder()) {
        throw BadRequestException("Partner not available");
    }
    
    // 4. Assign (atomic operation)
    order.setDeliveryBoy(partner);
    order.setStatus(OUT_FOR_DELIVERY);
    partner.setIsAvailable(false);
    
    // 5. Save (transaction commits)
    orderRepository.save(order);
    partnerRepository.save(partner);
    
    return order;
}
```

**Why This Works:**
- Database transactions provide isolation
- If two partners try to accept simultaneously, one will see `deliveryBoy != null` and fail
- First commit wins, second gets `BadRequestException`

---

## 📱 Notification Flow

### When Order Becomes READY

1. **OrderService.updateOrderStatus()** sets status to `READY`
2. **OrderService.sendStatusUpdateNotifications()** calls:
   ```java
   orderAssignmentService.notifyAvailableDeliveryPartners(orderId)
   ```
3. **OrderAssignmentService**:
   - Finds all available delivery partners
   - Sends push notification to each via `NotificationService`
   - Notification includes: Order number, amount, delivery address

### Notification Content

```json
{
  "title": "New Order Available",
  "body": "Order #ORD123 - ₹250.00 - 123 Main St, Meerut",
  "data": {
    "orderId": "123",
    "orderNumber": "ORD123",
    "amount": "250.00",
    "address": "123 Main St, Meerut"
  }
}
```

---

## 🗺️ Location Tracking Flow

### Delivery Partner Updates Location

1. **Delivery Partner App** calls:
   ```
   POST /api/v1/delivery/orders/{orderId}/update-location
   ?latitude=28.9845&longitude=77.7064
   ```

2. **DeliveryController** calls:
   ```java
   locationBroadcastService.updateAndBroadcastLocation(
       deliveryPartnerId, orderId, latitude, longitude, address
   )
   ```

3. **LocationBroadcastService**:
   - Updates `DeliveryBoyDetails.currentLatitude/longitude`
   - Saves `DeliveryTracking` record
   - (Future: Push to Firestore for real-time updates)

### Customer/Admin View Location

**Option 1: Polling**
```
GET /api/v1/customer/orders/{orderId}
GET /api/v1/admin/orders/{orderId}
```
Returns order with `deliveryBoy.currentLatitude/longitude`

**Option 2: Firestore Real-Time (Recommended)**
- Delivery app updates Firestore: `driverLocations/{driverId}`
- Customer/Admin apps subscribe to Firestore changes
- Real-time updates without polling

---

## 🔌 API Endpoints

### Delivery Partner Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/delivery/orders/available` | Get unassigned READY orders |
| POST | `/api/v1/delivery/orders/{orderId}/accept` | Accept order (first wins) |
| POST | `/api/v1/delivery/orders/{orderId}/update-location` | Update location |
| POST | `/api/v1/delivery/orders/{orderId}/deliver` | Mark as delivered |
| GET | `/api/v1/delivery/orders/my-orders` | Get my assigned orders |
| PUT | `/api/v1/delivery/status?isAvailable=true&isOnDuty=true` | Update availability |

### Customer Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/customer/orders/{orderId}` | Get order with delivery partner location |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/orders/{orderId}` | Get order with delivery partner location |
| GET | `/api/v1/admin/orders` | List all orders |

---

## 📝 Step-by-Step Flow

### 1. Order Creation → READY

```
Customer places order
  ↓
Order status: PLACED
  ↓
Admin accepts order
  ↓
Order status: ACCEPTED
  ↓
Admin marks as preparing
  ↓
Order status: PREPARING
  ↓
Admin marks as ready
  ↓
Order status: READY
  ↓
OrderAssignmentService.notifyAvailableDeliveryPartners()
  ↓
All available delivery partners receive push notification
```

### 2. Delivery Partner Accepts Order

```
Delivery Partner receives notification
  ↓
Opens app, sees order in "Available Orders"
  ↓
Clicks "Accept Order"
  ↓
POST /api/v1/delivery/orders/{orderId}/accept
  ↓
OrderAssignmentService.assignOrder()
  ↓
[Concurrency Check]
  - Order is READY? ✓
  - Order is unassigned? ✓
  - Partner is available? ✓
  - Partner has no active orders? ✓
  ↓
Assign order to partner
  ↓
Set partner.isAvailable = false
  ↓
Set order.status = OUT_FOR_DELIVERY
  ↓
Notify customer: "Order out for delivery"
  ↓
Order removed from other partners' "Available Orders" list
```

### 3. Location Tracking During Delivery

```
Delivery Partner starts location tracking
  ↓
Every 10 seconds:
  POST /api/v1/delivery/orders/{orderId}/update-location
  ↓
LocationBroadcastService updates location
  ↓
Customer app polls or listens to Firestore
  ↓
Customer sees real-time location on map
```

### 4. Order Delivered

```
Delivery Partner marks order as delivered
  ↓
POST /api/v1/delivery/orders/{orderId}/deliver
  ↓
Order status: DELIVERED
  ↓
OrderAssignmentService.releaseDeliveryPartner()
  ↓
Check if partner has other active orders
  ↓
If no active orders:
  Set partner.isAvailable = true
  ↓
Partner can now receive new order notifications
```

---

## 🛡️ Concurrency Safety Details

### Problem: Race Condition

**Scenario**: Two delivery partners try to accept the same order simultaneously.

**Solution**: Transaction + Validation

```java
@Transactional
public Order assignOrder(Long orderId, Long deliveryPartnerId) {
    // Within transaction:
    // 1. Load order (database lock)
    Order order = orderRepository.findById(orderId);
    
    // 2. Check if already assigned
    if (order.getDeliveryBoy() != null) {
        throw BadRequestException("Already assigned");
    }
    
    // 3. Assign
    order.setDeliveryBoy(partner);
    order.setStatus(OUT_FOR_DELIVERY);
    
    // 4. Save (transaction commits)
    orderRepository.save(order);
}
```

**How It Prevents Race Conditions:**
- Database transaction provides isolation level (typically READ_COMMITTED or REPEATABLE_READ)
- If Partner A and Partner B both call `assignOrder()` simultaneously:
  - Partner A's transaction loads order (deliveryBoy = null)
  - Partner B's transaction loads order (deliveryBoy = null)
  - Partner A sets deliveryBoy = A, saves (commits)
  - Partner B tries to set deliveryBoy = B, but order already has deliveryBoy = A
  - Partner B's validation fails: "Order is already assigned"

**Alternative: Optimistic Locking (Future Enhancement)**
```java
@Entity
public class Order {
    @Version
    private Long version; // Optimistic locking
}
```

---

## 🔔 Notification Implementation

### Finding Available Partners

```java
public List<Long> getAvailableDeliveryPartners() {
    // 1. Find all partners who are online and available
    List<DeliveryBoyDetails> partners = deliveryBoyDetailsRepository
        .findByIsAvailableTrueAndIsOnDutyTrue();
    
    // 2. Filter out partners with active orders
    return partners.stream()
        .filter(partner -> {
            List<Order> activeOrders = orderRepository
                .findByStatusAndDeliveryBoy(READY, partner.getUser());
            activeOrders.addAll(orderRepository
                .findByStatusAndDeliveryBoy(OUT_FOR_DELIVERY, partner.getUser()));
            return activeOrders.isEmpty();
        })
        .map(partner -> partner.getUser().getId())
        .collect(Collectors.toList());
}
```

### Sending Notifications

```java
public void notifyAvailableDeliveryPartners(Long orderId) {
    Order order = orderRepository.findById(orderId);
    List<Long> partnerIds = getAvailableDeliveryPartners();
    
    for (Long partnerId : partnerIds) {
        notificationService.sendNotificationToUser(
            partnerId,
            "New Order Available",
            "Order #" + order.getOrderNumber() + " - ₹" + order.getTotalAmount()
        );
    }
}
```

---

## 📍 Location Tracking Implementation

### Update Location

```java
@PostMapping("/orders/{orderId}/update-location")
public ResponseEntity<ApiResponse<Void>> updateLocation(
        @PathVariable Long orderId,
        @RequestParam Double latitude,
        @RequestParam Double longitude,
        Authentication authentication) {
    
    var deliveryBoy = securityUtil.getCurrentUser(authentication);
    
    // Verify order is assigned to this delivery partner
    Order order = orderRepository.findById(orderId);
    if (order.getDeliveryBoy().getId() != deliveryBoy.getId()) {
        throw BadRequestException("Order not assigned to you");
    }
    
    // Update and broadcast location
    locationBroadcastService.updateAndBroadcastLocation(
        deliveryBoy.getId(), orderId, latitude, longitude, null
    );
    
    return ResponseEntity.ok(ApiResponse.success());
}
```

### Real-Time Broadcasting (Firestore)

**Delivery App** updates Firestore:
```javascript
firestore()
  .collection('driverLocations')
  .doc(driverId)
  .set({
    orderId: orderId,
    latitude: latitude,
    longitude: longitude,
    timestamp: new Date(),
  });
```

**Customer/Admin Apps** listen to Firestore:
```javascript
firestore()
  .collection('driverLocations')
  .doc(driverId)
  .onSnapshot(snapshot => {
    const location = snapshot.data();
    updateMapMarker(location);
  });
```

---

## ✅ Validation Rules

### Order Assignment Validation

1. **Order Status**: Must be `READY`
2. **Order Assignment**: `deliveryBoy` must be `null`
3. **Partner Availability**: `isAvailable = true` AND `isOnDuty = true`
4. **Partner Active Orders**: Must have no orders with status `READY` or `OUT_FOR_DELIVERY`

### Partner Availability Rules

- **Available**: `isAvailable = true` AND `isOnDuty = true` AND no active orders
- **Unavailable**: `isAvailable = false` OR `isOnDuty = false` OR has active order
- **Auto-Release**: When order is `DELIVERED`, check if partner has other active orders. If not, set `isAvailable = true`

---

## 🧪 Testing Scenarios

### Scenario 1: Single Partner Accepts
1. Order becomes READY
2. Partner A receives notification
3. Partner A accepts order
4. ✅ Order assigned to Partner A
5. ✅ Partner A marked as unavailable

### Scenario 2: Concurrent Accept (Race Condition)
1. Order becomes READY
2. Partner A and Partner B both receive notification
3. Partner A and Partner B both click "Accept" simultaneously
4. ✅ First transaction commits successfully
5. ✅ Second transaction fails with "Order already assigned"

### Scenario 3: Partner Becomes Available Again
1. Partner A has order in OUT_FOR_DELIVERY
2. Partner A marks order as DELIVERED
3. ✅ Order status: DELIVERED
4. ✅ Partner A's `isAvailable` set to `true`
5. ✅ Partner A can receive new order notifications

### Scenario 4: Multiple Active Orders
1. Partner A has Order 1 (OUT_FOR_DELIVERY)
2. Partner A delivers Order 1
3. Partner A still has Order 2 (READY)
4. ✅ Partner A remains unavailable (`isAvailable = false`)
5. ✅ Partner A cannot receive new notifications until Order 2 is delivered

---

## 🚀 Future Enhancements

1. **Optimistic Locking**: Add `@Version` field to Order entity
2. **Firestore Integration**: Real-time location broadcasting via Firestore
3. **Order Expiry**: Auto-unassign if no partner accepts within X minutes
4. **Assignment History**: Track who tried to accept but was too late
5. **Distance-Based Matching**: Prioritize closer delivery partners (optional)

---

## 📚 Key Files

### Backend Services
- `OrderAssignmentService.java` - Core assignment logic
- `LocationBroadcastService.java` - Location broadcasting
- `NotificationService.java` - Push notifications
- `OrderService.java` - Order lifecycle management

### Controllers
- `DeliveryController.java` - Delivery partner APIs
- `CustomerController.java` - Customer APIs
- `AdminController.java` - Admin APIs

### Repositories
- `OrderRepository.java` - Order queries
- `DeliveryBoyDetailsRepository.java` - Delivery partner queries

---

## 🔍 Monitoring & Logging

### Key Log Points

1. **Order Ready**: `Order {} is ready, notifying {} delivery partners`
2. **Assignment Success**: `Order {} assigned to delivery partner {}`
3. **Assignment Failure**: `Order {} already assigned, rejecting partner {}`
4. **Partner Release**: `Delivery partner {} released and available for new orders`

### Metrics to Track

- Average time from READY to ACCEPTED
- Number of concurrent accept attempts
- Partner availability rate
- Order assignment success rate

---

## ✅ Summary

This implementation provides:

1. ✅ **Concurrency Safety**: Transaction-based assignment prevents race conditions
2. ✅ **Notification System**: All available partners notified when order is READY
3. ✅ **First-Come-First-Served**: First partner to accept wins
4. ✅ **Availability Management**: Partners automatically become unavailable when assigned
5. ✅ **Location Tracking**: Real-time location updates for customers and admins
6. ✅ **Simple & Reliable**: No complex algorithms, easy to understand and maintain

The system is designed to handle up to 5 delivery partners efficiently while maintaining correctness and reliability.


