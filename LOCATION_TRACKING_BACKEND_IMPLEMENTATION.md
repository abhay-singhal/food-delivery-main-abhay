# Location Tracking Feature - Backend Implementation

This document describes the location tracking feature implementation for delivery boys in the food delivery backend.

## Overview

The location tracking feature allows:
1. **Delivery boys** to update their location while delivering orders
2. **Customers** to view the real-time location of the delivery boy assigned to their order
3. **Admins** to view all delivery boys' locations (both active and inactive)

## Implementation Details

### 1. DTOs Created

#### `LocationUpdateRequest` (`dto/request/LocationUpdateRequest.java`)
- Request DTO for updating delivery boy location
- Fields:
  - `latitude` (required): Current latitude
  - `longitude` (required): Current longitude
  - `address` (optional): Address string

#### `DeliveryBoyLocationResponse` (`dto/response/DeliveryBoyLocationResponse.java`)
- Response DTO containing delivery boy location information
- Fields:
  - `deliveryBoyId`: ID of the delivery boy
  - `deliveryBoyName`: Full name of the delivery boy
  - `deliveryBoyMobile`: Mobile number of the delivery boy
  - `latitude`: Current latitude
  - `longitude`: Current longitude
  - `address`: Current address (optional)
  - `isAvailable`: Availability status
  - `isOnDuty`: Duty status
  - `lastUpdatedAt`: Last location update timestamp
  - `currentOrderId`: ID of current active order (if any)
  - `currentOrderNumber`: Order number of current active order (if any)

### 2. Service Enhancements

#### `LocationBroadcastService` Enhancements

Added three new methods:

1. **`getDeliveryBoyLocationForOrder(Long orderId)`**
   - Returns location information for the delivery boy assigned to a specific order
   - Returns `null` if order doesn't exist or has no delivery boy assigned

2. **`getAllDeliveryBoysLocations()`**
   - Returns location information for ALL delivery boys in the system
   - Includes both active and inactive delivery boys
   - Includes current active order information if available

3. **`getActiveDeliveryBoysLocations()`**
   - Returns location information for ACTIVE delivery boys only (available and on duty)
   - Useful for admins to see only currently working delivery boys

### 3. API Endpoints

#### Delivery Boy Endpoints

**POST** `/api/v1/delivery/orders/{orderId}/update-location`
- **Description**: Update delivery boy's location for a specific order
- **Authentication**: Required (Delivery Boy role)
- **Request Body**:
  ```json
  {
    "latitude": 28.7041,
    "longitude": 77.1025,
    "address": "Optional address string"
  }
  ```
- **Response**: Success message
- **Changes**: Now accepts request body instead of query parameters (more RESTful)

#### Customer Endpoints

**GET** `/api/v1/customer/orders/{orderId}/delivery-boy-location`
- **Description**: Get the location of the delivery boy assigned to the customer's order
- **Authentication**: Required (Customer role)
- **Authorization**: Customer can only access their own orders
- **Response**: `DeliveryBoyLocationResponse` object with delivery boy location details
- **Error Cases**:
  - Returns 403 if order doesn't belong to the customer
  - Returns null location data if no delivery boy is assigned
  - Returns null location data if delivery boy location is not available

#### Admin Endpoints

**GET** `/api/v1/admin/delivery-boys/locations`
- **Description**: Get locations of ALL delivery boys (active and inactive)
- **Authentication**: Required (Admin role)
- **Response**: List of `DeliveryBoyLocationResponse` objects

**GET** `/api/v1/admin/delivery-boys/locations/active`
- **Description**: Get locations of ACTIVE delivery boys only (available and on duty)
- **Authentication**: Required (Admin role)
- **Response**: List of `DeliveryBoyLocationResponse` objects for active delivery boys only

## Data Flow

### Location Update Flow

1. Delivery boy calls `POST /api/v1/delivery/orders/{orderId}/update-location` with their current location
2. System validates that the order is assigned to the delivery boy
3. System creates a `DeliveryTracking` record (for historical tracking)
4. System updates `DeliveryBoyDetails.currentLatitude` and `currentLongitude`
5. Location is now available for customers and admins to query

### Customer Location Query Flow

1. Customer calls `GET /api/v1/customer/orders/{orderId}/delivery-boy-location`
2. System verifies the order belongs to the customer
3. System checks if a delivery boy is assigned to the order
4. System retrieves delivery boy's current location from `DeliveryBoyDetails`
5. System returns location information to the customer

### Admin Location Query Flow

1. Admin calls `GET /api/v1/admin/delivery-boys/locations` (all) or `/locations/active` (active only)
2. System retrieves all/active delivery boys from `DeliveryBoyDetails`
3. System finds current active orders for each delivery boy (if any)
4. System returns list of location information

## Database Schema

The location tracking uses existing database entities:

### `DeliveryBoyDetails`
- `currentLatitude`: Stores current latitude of delivery boy
- `currentLongitude`: Stores current longitude of delivery boy
- `updatedAt`: Timestamp of last update (automatically updated)

### `DeliveryTracking`
- Stores historical location updates per order
- Used for tracking history and analytics
- Created each time location is updated

## Security

- All endpoints require authentication
- Customer endpoints validate order ownership (403 if order doesn't belong to customer)
- Delivery boy endpoints validate order assignment (400 if order not assigned to them)
- Admin endpoints require admin role

## Usage Examples

### Update Location (Delivery Boy)

```bash
POST /api/v1/delivery/orders/123/update-location
Authorization: Bearer <delivery_boy_token>
Content-Type: application/json

{
  "latitude": 28.7041,
  "longitude": 77.1025,
  "address": "Near Metro Station"
}
```

### Get Delivery Boy Location (Customer)

```bash
GET /api/v1/customer/orders/123/delivery-boy-location
Authorization: Bearer <customer_token>
```

Response:
```json
{
  "success": true,
  "message": "Delivery boy location retrieved successfully",
  "data": {
    "deliveryBoyId": 5,
    "deliveryBoyName": "John Doe",
    "deliveryBoyMobile": "9876543210",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "address": null,
    "isAvailable": true,
    "isOnDuty": true,
    "lastUpdatedAt": "2024-01-15T10:30:00",
    "currentOrderId": 123,
    "currentOrderNumber": "ORD-20240115-001"
  }
}
```

### Get All Delivery Boys Locations (Admin)

```bash
GET /api/v1/admin/delivery-boys/locations
Authorization: Bearer <admin_token>
```

### Get Active Delivery Boys Locations (Admin)

```bash
GET /api/v1/admin/delivery-boys/locations/active
Authorization: Bearer <admin_token>
```

## Integration Notes

- The delivery boy location is updated in real-time as delivery boys send location updates
- Customers can poll the endpoint to get updated locations (recommended interval: 10-30 seconds)
- Admins can use either endpoint depending on whether they want to see all delivery boys or only active ones
- The `currentOrderId` and `currentOrderNumber` fields help identify which order a delivery boy is currently handling

## Future Enhancements

Potential improvements:
1. Add WebSocket support for real-time location streaming
2. Add location history endpoint for analytics
3. Add distance calculation between delivery boy and delivery address
4. Add ETA (Estimated Time of Arrival) calculation
5. Add geofencing for delivery areas
6. Integrate with Firebase for real-time updates (as mentioned in existing LocationBroadcastService comments)

