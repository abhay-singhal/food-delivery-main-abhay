# Restaurant Location Configuration Guide

## Overview

The restaurant location is now configurable through the admin API. You can set it once and it will be used for all delivery distance calculations throughout the application.

## 🟡S Restaurant Variables to Set

The following variables need to be configured for the restaurant:

- 🟡S `restaurant.latitude` - Restaurant latitude coordinate (required)
- 🟡S `restaurant.longitude` - Restaurant longitude coordinate (required)
- 🟡S `restaurant.address` - Restaurant address (optional)

These variables can be set in:
1. `application.properties` file (fallback values)
2. Database `app_config` table (via API or SQL)
3. Admin API endpoint `/api/v1/admin/restaurant/location`

## Features

1. **Configurable Restaurant Location** - Set restaurant location via admin API
2. **Fallback to Properties** - If not configured, uses values from `application.properties`
3. **Dynamic Updates** - Changes take effect immediately without restart
4. **Used Everywhere** - Restaurant location is used in:
   - Delivery distance calculations
   - Delivery radius validation
   - Delivery charge calculations

## API Endpoints

### Get Restaurant Location

**GET** `/api/v1/admin/restaurant/location`

**Response:**
```json
{
  "success": true,
  "message": "Restaurant location retrieved successfully",
  "data": {
    "latitude": 28.9845,
    "longitude": 77.7064,
    "address": "Meerut, Uttar Pradesh",
    "lastUpdatedAt": "2024-01-15T10:30:00"
  }
}
```

### Update Restaurant Location

**POST** `/api/v1/admin/restaurant/location`

**Request Body:**
```json
{
  "latitude": 28.7041,
  "longitude": 77.1025,
  "address": "New Restaurant Address"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Restaurant location updated successfully",
  "data": {
    "latitude": 28.7041,
    "longitude": 77.1025,
    "address": "New Restaurant Address",
    "lastUpdatedAt": "2024-01-15T10:35:00"
  }
}
```

## Usage Examples

### Using cURL

```bash
# Get current location
curl -X GET http://localhost:8080/api/v1/admin/restaurant/location \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Update location
curl -X POST http://localhost:8080/api/v1/admin/restaurant/location \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 28.7041,
    "longitude": 77.1025,
    "address": "Connaught Place, New Delhi"
  }'
```

### Using PowerShell

```powershell
$token = "YOUR_ADMIN_TOKEN"
$body = @{
    latitude = 28.7041
    longitude = 77.1025
    address = "Connaught Place, New Delhi"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/restaurant/location" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } `
    -Body $body
```

## How It Works

1. **Storage**: Restaurant location is stored in `app_config` table with keys:
   - 🟡S `restaurant.latitude`
   - 🟡S `restaurant.longitude`
   - 🟡S `restaurant.address` (optional)

2. **Loading**: `DistanceUtil` loads location from AppConfig on startup, with fallback to `application.properties`

3. **Updates**: When location is updated via API:
   - Values are saved to AppConfig
   - `DistanceUtil.reloadRestaurantLocation()` is called
   - New location is used immediately for all calculations

4. **Fallback**: If AppConfig doesn't have restaurant location, it uses values from:
   ```properties
   # 🟡S restaurant.latitude=28.9845
   # 🟡S restaurant.longitude=77.7064
   ```

## Finding Your Restaurant Coordinates

### Method 1: Google Maps
1. Open Google Maps
2. Navigate to your restaurant location
3. Right-click on the location
4. Click on the coordinates to copy them
5. Format: `latitude, longitude` (e.g., `28.7041, 77.1025`)

### Method 2: Online Tools
- https://www.latlong.net/
- https://www.gps-coordinates.net/

### Method 3: Mobile App
- Use Google Maps app on your phone
- Drop a pin at your restaurant
- Coordinates will be shown in the info card

## Database Setup

On first use, the AppConfig entries will be created automatically. To manually set them via SQL:

```sql
-- 🟡S Set restaurant latitude
INSERT INTO app_config (config_key, config_value, description, created_at, updated_at)
VALUES ('restaurant.latitude', '28.7041', 'Restaurant latitude coordinate', NOW(), NOW())
ON DUPLICATE KEY UPDATE config_value = '28.7041', updated_at = NOW();

-- 🟡S Set restaurant longitude
INSERT INTO app_config (config_key, config_value, description, created_at, updated_at)
VALUES ('restaurant.longitude', '77.1025', 'Restaurant longitude coordinate', NOW(), NOW())
ON DUPLICATE KEY UPDATE config_value = '77.1025', updated_at = NOW();

-- 🟡S Set restaurant address (optional)
INSERT INTO app_config (config_key, config_value, description, created_at, updated_at)
VALUES ('restaurant.address', 'Your Restaurant Address', 'Restaurant address', NOW(), NOW())
ON DUPLICATE KEY UPDATE config_value = 'Your Restaurant Address', updated_at = NOW();
```

## Verification

After updating the location, verify it's working:

1. **Check via API:**
   ```bash
   GET /api/v1/admin/restaurant/location
   ```

2. **Test distance calculation:**
   - Place a test order with a delivery address
   - Check that delivery charge is calculated correctly
   - Verify delivery radius validation works

3. **Check database:**
   ```sql
   SELECT * FROM app_config WHERE config_key LIKE 'restaurant.%';
   ```

## Important Notes

1. **Coordinates Format**: 
   - Latitude: -90 to 90 (negative = South, positive = North)
   - Longitude: -180 to 180 (negative = West, positive = East)

2. **Precision**: Use at least 4-6 decimal places for accuracy (about 1-10 meters)

3. **Updates Take Effect Immediately**: No server restart needed

4. **Fallback**: Always keep default values in `application.properties` as backup

5. **Impact**: Changing restaurant location affects:
   - Delivery radius validation
   - Delivery charge calculations
   - All distance-related features

---

**Ready to configure?** Use the admin API endpoints to set your restaurant location!

