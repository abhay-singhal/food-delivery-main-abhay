# Admin App - Shiv Dhaba Food Delivery

React Native admin application for managing the food delivery system.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- React Native CLI
- Android Studio (for Android development)
- Backend server running on port 8080

### Installation

1. **Install Dependencies**
   ```bash
   cd admin-app
   npm install
   ```

2. **Configure API URL**
   - Open `src/config/api.js`
   - Update `API_BASE_URL` with your backend URL:
     - Android Emulator: `http://10.0.2.2:8080/api/v1`
     - iOS Simulator: `http://localhost:8080/api/v1`
     - Physical Device: `http://YOUR_COMPUTER_IP:8080/api/v1`

3. **Run on Android**
   ```bash
   npm run android
   ```

## 📱 Features

### Authentication
- ✅ Secure username/password login
- ✅ JWT token-based authentication
- ✅ Automatic token refresh
- ✅ Secure token storage

### Dashboard
- ✅ Today's orders count
- ✅ Today's revenue
- ✅ Pending orders
- ✅ Preparing orders
- ✅ Active delivery boys
- ✅ Total customers
- ✅ Quick action buttons

### Menu Management
- ✅ View all menu items
- ✅ Add new menu items (name, description, price, category, veg only)
- ✅ Update menu items
- ✅ Delete menu items
- ✅ Enable/Disable menu items (visibility control)
- ✅ Real-time UI updates (no full refresh)

### Order Management
- ✅ View all orders with status filtering
- ✅ View order details
- ✅ Accept/Reject orders
- ✅ Update order status (PLACED → PREPARING → READY)
- ✅ Assign orders to delivery boys
- ✅ Real-time order status updates

### Delivery Boy Management
- ✅ View all delivery boys
- ✅ Create new delivery boy accounts
- ✅ Update delivery boy information
- ✅ Enable/Disable delivery boy accounts
- ✅ Toggle on-duty/off-duty status
- ✅ View delivery statistics

### Settings
- ✅ Restaurant open/close toggle
- ✅ COD enable/disable
- ✅ App configuration management

## 🏗️ Project Structure

```
admin-app/
├── src/
│   ├── config/
│   │   └── api.js              # API configuration & interceptors
│   ├── services/
│   │   ├── authService.js      # Authentication service
│   │   ├── menuService.js      # Menu management service
│   │   ├── orderService.js    # Order management service
│   │   ├── deliveryBoyService.js # Delivery boy service
│   │   ├── dashboardService.js # Dashboard service
│   │   └── configService.js   # Configuration service
│   ├── store/
│   │   ├── store.js            # Redux store
│   │   └── slices/
│   │       ├── authSlice.js
│   │       ├── menuSlice.js
│   │       ├── orderSlice.js
│   │       ├── deliveryBoySlice.js
│   │       ├── dashboardSlice.js
│   │       └── configSlice.js
│   └── screens/
│       ├── SplashScreen.js
│       ├── LoginScreen.js
│       ├── DashboardScreen.js
│       ├── MenuManagementScreen.js
│       ├── OrdersScreen.js
│       ├── OrderDetailScreen.js
│       ├── DeliveryBoysScreen.js
│       ├── SettingsScreen.js
│       └── AddEditMenuItemScreen.js
├── App.js
├── package.json
└── README.md
```

## 🔌 Backend Integration

The admin app integrates with the Spring Boot backend using REST APIs:

### Authentication
- `POST /api/v1/auth/admin/login` - Admin login

### Dashboard
- `GET /api/v1/admin/dashboard/stats` - Dashboard statistics

### Menu Management
- `GET /api/v1/admin/menu/items` - Get all menu items
- `POST /api/v1/admin/menu/items` - Create menu item
- `PUT /api/v1/admin/menu/items/{id}` - Update menu item
- `DELETE /api/v1/admin/menu/items/{id}` - Delete menu item
- `PUT /api/v1/admin/menu/items/{id}/status` - Update item status

### Order Management
- `GET /api/v1/admin/orders` - Get all orders
- `GET /api/v1/admin/orders/{id}` - Get order details
- `POST /api/v1/admin/orders/{id}/accept` - Accept order
- `POST /api/v1/admin/orders/{id}/reject` - Reject order
- `POST /api/v1/admin/orders/{id}/status` - Update order status
- `PUT /api/v1/admin/orders/{id}/assign` - Assign order to delivery boy

### Delivery Boy Management
- `GET /api/v1/admin/delivery-boys` - Get all delivery boys
- `POST /api/v1/admin/delivery-boys` - Create delivery boy
- `PUT /api/v1/admin/delivery-boys/{id}` - Update delivery boy
- `PUT /api/v1/admin/delivery-boys/{id}/status` - Update delivery boy status

### Settings
- `GET /api/v1/admin/config` - Get configuration
- `POST /api/v1/admin/config` - Update configuration

## 🔐 Security

- JWT-based authentication
- Secure token storage using AsyncStorage
- Automatic token refresh
- Role-based access control (ADMIN only)
- API request/response interceptors

## 📝 Notes

- Menu enable/disable changes reflect instantly in customer app
- Order assignments reflect instantly in delivery boy app
- All API calls include proper error handling
- Loading states for better UX
- Pull-to-refresh on all list screens

## 🐛 Troubleshooting

### Network Connection Issues
- Ensure backend is running on port 8080
- Check API_BASE_URL in `src/config/api.js`
- For physical devices, ensure phone and computer are on same network

### Authentication Issues
- Clear app data and re-login
- Check backend admin credentials
- Verify JWT token expiration settings

### Build Issues
- Run `cd android && ./gradlew clean` then rebuild
- Clear Metro bundler cache: `npm start -- --reset-cache`

## 📄 License

This project is part of the Shiv Dhaba Food Delivery System.
