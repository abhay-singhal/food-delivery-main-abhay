# Quick Start Guide - Admin App

## Prerequisites

1. **Backend Running**
   - Ensure Spring Boot backend is running on port 8080
   - Backend should have admin user created

2. **Node.js & React Native**
   - Node.js >= 18
   - React Native CLI installed
   - Android Studio (for Android)

## Setup Steps

### 1. Install Dependencies

```bash
cd admin-app
npm install
```

### 2. Configure API URL

Edit `src/config/api.js` and update the API_BASE_URL:

```javascript
// For Android Emulator
const API_BASE_URL = 'http://10.0.2.2:8080/api/v1';

// For Physical Device (replace with your computer's IP)
const API_BASE_URL = 'http://192.168.1.100:8080/api/v1';
```

### 3. Create Admin User (if not exists)

If you don't have an admin user, register one:

```bash
curl -X POST http://localhost:8080/api/v1/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "email": "admin@shivdhaba.com"
  }'
```

### 4. Run the App

```bash
npm run android
```

## Login Credentials

Use the admin credentials you created:
- Username: `admin` (or your username)
- Password: `admin123` (or your password)

## Features Overview

### Dashboard
- View today's orders and revenue
- See pending and preparing orders
- Check active delivery boys
- Quick access to all sections

### Menu Management
- Add new food items
- Edit existing items
- Delete items
- Enable/Disable items (controls visibility in customer app)

### Order Management
- View all orders
- Filter by status
- Accept/Reject orders
- Update order status
- Assign orders to delivery boys

### Delivery Boy Management
- Create delivery boy accounts
- Update delivery boy info
- Toggle availability
- View statistics

### Settings
- Toggle restaurant open/close
- Enable/Disable COD

## Troubleshooting

### Connection Issues
- **Error: Network request failed**
  - Check if backend is running
  - Verify API_BASE_URL is correct
  - For physical device, ensure phone and computer are on same network

### Authentication Issues
- **Error: Invalid credentials**
  - Verify admin user exists in backend
  - Check username/password are correct
  - Clear app data and try again

### Build Issues
- **Error: Build failed**
  - Run `cd android && ./gradlew clean`
  - Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
  - Clear Metro cache: `npm start -- --reset-cache`

## Next Steps

1. Login to admin app
2. Add menu categories (if not exists)
3. Add menu items
4. View and manage orders
5. Create delivery boy accounts
6. Configure settings

## Support

For issues or questions, refer to:
- `README.md` - Full documentation
- `INTEGRATION_SUMMARY.md` - Integration details
- Backend API documentation


