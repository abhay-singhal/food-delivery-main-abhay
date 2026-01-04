package com.shivdhaba.food_delivery.controller;

import com.shivdhaba.food_delivery.domain.entity.*;
import com.shivdhaba.food_delivery.domain.enums.ItemStatus;
import com.shivdhaba.food_delivery.domain.enums.OrderStatus;
import com.shivdhaba.food_delivery.domain.enums.Role;
import com.shivdhaba.food_delivery.dto.response.ApiResponse;
import com.shivdhaba.food_delivery.dto.response.OrderResponse;
import com.shivdhaba.food_delivery.exception.BadRequestException;
import com.shivdhaba.food_delivery.exception.ResourceNotFoundException;
import com.shivdhaba.food_delivery.repository.*;
import com.shivdhaba.food_delivery.service.LocationBroadcastService;
import com.shivdhaba.food_delivery.service.NotificationService;
import com.shivdhaba.food_delivery.service.OrderService;
import com.shivdhaba.food_delivery.service.PaymentService;
import com.shivdhaba.food_delivery.dto.response.DeliveryBoyLocationResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {
    
    private final OrderService orderService;
    private final PaymentService paymentService;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final DeliveryBoyDetailsRepository deliveryBoyDetailsRepository;
    private final MenuCategoryRepository menuCategoryRepository;
    private final MenuItemRepository menuItemRepository;
    private final AppConfigRepository appConfigRepository;
    private final NotificationService notificationService;
    private final LocationBroadcastService locationBroadcastService;
    private final com.shivdhaba.food_delivery.util.DistanceUtil distanceUtil;
    private final PasswordEncoder passwordEncoder;
    
    // Dashboard
    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        LocalDateTime todayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime todayEnd = todayStart.plusDays(1);
        
        Long todayOrders = orderRepository.countOrdersBetweenDates(todayStart, todayEnd);
        Double todayRevenue = orderRepository.getTotalRevenueBetweenDates(todayStart, todayEnd);
        if (todayRevenue == null) todayRevenue = 0.0;
        
        List<Order> pendingOrders = orderRepository.findByStatus(OrderStatus.PLACED);
        List<Order> preparingOrders = orderRepository.findByStatus(OrderStatus.PREPARING);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("todayOrders", todayOrders);
        stats.put("todayRevenue", todayRevenue);
        stats.put("pendingOrders", pendingOrders.size());
        stats.put("preparingOrders", preparingOrders.size());
        stats.put("totalCustomers", userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.CUSTOMER).count());
        stats.put("activeDeliveryBoys", deliveryBoyDetailsRepository.findAll().stream()
                .filter(d -> d.getIsAvailable() && d.getIsOnDuty()).count());
        
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .message("Dashboard stats retrieved successfully")
                .data(stats)
                .build());
    }
    
    // Orders
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllOrders(
            @RequestParam(required = false) OrderStatus status) {
        List<Order> orders = status != null 
                ? orderRepository.findByStatus(status)
                : orderRepository.findAll();
        List<OrderResponse> orderResponses = orders.stream()
                .map(orderService::mapToOrderResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.<List<OrderResponse>>builder()
                .success(true)
                .message("Orders retrieved successfully")
                .data(orderResponses)
                .build());
    }
    
    @GetMapping("/orders/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(@PathVariable Long orderId) {
        OrderResponse order = orderService.getOrder(orderId);
        return ResponseEntity.ok(ApiResponse.<OrderResponse>builder()
                .success(true)
                .message("Order retrieved successfully")
                .data(order)
                .build());
    }
    
    @PostMapping("/orders/{orderId}/accept")
    public ResponseEntity<ApiResponse<OrderResponse>> acceptOrder(@PathVariable Long orderId) {
        OrderResponse order = orderService.updateOrderStatus(orderId, OrderStatus.ACCEPTED);
        return ResponseEntity.ok(ApiResponse.<OrderResponse>builder()
                .success(true)
                .message("Order accepted successfully")
                .data(order)
                .build());
    }
    
    @PostMapping("/orders/{orderId}/reject")
    public ResponseEntity<ApiResponse<OrderResponse>> rejectOrder(@PathVariable Long orderId) {
        OrderResponse order = orderService.updateOrderStatus(orderId, OrderStatus.CANCELLED);
        return ResponseEntity.ok(ApiResponse.<OrderResponse>builder()
                .success(true)
                .message("Order rejected successfully")
                .data(order)
                .build());
    }
    
    @PostMapping("/orders/{orderId}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestParam OrderStatus status) {
        OrderResponse order = orderService.updateOrderStatus(orderId, status);
        return ResponseEntity.ok(ApiResponse.<OrderResponse>builder()
                .success(true)
                .message("Order status updated successfully")
                .data(order)
                .build());
    }
    
    // Delivery Boys
    @GetMapping("/delivery-boys")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllDeliveryBoys() {
        List<DeliveryBoyDetails> deliveryBoys = deliveryBoyDetailsRepository.findAll();
        List<Map<String, Object>> response = deliveryBoys.stream()
                .map(db -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", db.getId());
                    map.put("userId", db.getUser().getId());
                    map.put("name", db.getUser().getFullName());
                    map.put("mobile", db.getUser().getMobileNumber());
                    map.put("licenseNumber", db.getLicenseNumber());
                    map.put("vehicleNumber", db.getVehicleNumber());
                    map.put("vehicleType", db.getVehicleType());
                    map.put("isAvailable", db.getIsAvailable());
                    map.put("isOnDuty", db.getIsOnDuty());
                    map.put("totalDeliveries", db.getTotalDeliveries());
                    map.put("totalEarnings", db.getTotalEarnings());
                    return map;
                })
                .toList();
        return ResponseEntity.ok(ApiResponse.<List<Map<String, Object>>>builder()
                .success(true)
                .message("Delivery boys retrieved successfully")
                .data(response)
                .build());
    }
    
    @PostMapping("/delivery-boys")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createDeliveryBoy(
            @Valid @RequestBody com.shivdhaba.food_delivery.dto.request.DeliveryBoyRegisterRequest request) {
        
        String mobileNumber = request.getMobileNumber();
        String fullName = request.getFullName();
        String licenseNumber = request.getLicenseNumber();
        String vehicleNumber = request.getVehicleNumber();
        String vehicleType = request.getVehicleType();
        
        if (userRepository.existsByMobileNumberAndRole(mobileNumber, Role.DELIVERY_BOY)) {
            throw new BadRequestException("Delivery boy already exists");
        }
        
        User user = User.builder()
                .mobileNumber(mobileNumber)
                .fullName(fullName)
                .role(Role.DELIVERY_BOY)
                .isActive(true)
                .build();
        user = userRepository.save(user);
        
        DeliveryBoyDetails details = DeliveryBoyDetails.builder()
                .user(user)
                .licenseNumber(licenseNumber)
                .vehicleNumber(vehicleNumber)
                .vehicleType(vehicleType)
                .isAvailable(true)
                .isOnDuty(false)
                .build();
        deliveryBoyDetailsRepository.save(details);
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", details.getId());
        response.put("userId", user.getId());
        response.put("mobileNumber", user.getMobileNumber());
        response.put("fullName", user.getFullName());
        
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .message("Delivery boy created successfully")
                .data(response)
                .build());
    }
    
    // Menu Management
    @GetMapping("/menu/categories")
    public ResponseEntity<ApiResponse<List<MenuCategory>>> getCategories() {
        List<MenuCategory> categories = menuCategoryRepository.findAll();
        return ResponseEntity.ok(ApiResponse.<List<MenuCategory>>builder()
                .success(true)
                .message("Categories retrieved successfully")
                .data(categories)
                .build());
    }
    
    @PostMapping("/menu/categories")
    public ResponseEntity<ApiResponse<MenuCategory>> createCategory(@RequestBody MenuCategory category) {
        MenuCategory saved = menuCategoryRepository.save(category);
        return ResponseEntity.ok(ApiResponse.<MenuCategory>builder()
                .success(true)
                .message("Category created successfully")
                .data(saved)
                .build());
    }
    
    @GetMapping("/menu/items")
    public ResponseEntity<ApiResponse<List<MenuItem>>> getMenuItems() {
        List<MenuItem> items = menuItemRepository.findAll();
        return ResponseEntity.ok(ApiResponse.<List<MenuItem>>builder()
                .success(true)
                .message("Menu items retrieved successfully")
                .data(items)
                .build());
    }
    
    @PostMapping("/menu/items")
    public ResponseEntity<ApiResponse<MenuItem>> createMenuItem(@RequestBody MenuItem item) {
        MenuItem saved = menuItemRepository.save(item);
        return ResponseEntity.ok(ApiResponse.<MenuItem>builder()
                .success(true)
                .message("Menu item created successfully")
                .data(saved)
                .build());
    }
    
    // Configuration
    @GetMapping("/config")
    public ResponseEntity<ApiResponse<Map<String, String>>> getConfig() {
        List<AppConfig> configs = appConfigRepository.findAll();
        Map<String, String> configMap = configs.stream()
                .collect(java.util.stream.Collectors.toMap(
                        AppConfig::getConfigKey,
                        AppConfig::getConfigValue,
                        (v1, v2) -> v1));
        return ResponseEntity.ok(ApiResponse.<Map<String, String>>builder()
                .success(true)
                .message("Config retrieved successfully")
                .data(configMap)
                .build());
    }
    
    @PostMapping("/config")
    public ResponseEntity<ApiResponse<AppConfig>> updateConfig(
            @RequestParam String key,
            @RequestParam String value,
            @RequestParam(required = false) String description) {
        AppConfig config = appConfigRepository.findByConfigKey(key)
                .orElse(AppConfig.builder().configKey(key).build());
        config.setConfigValue(value);
        if (description != null) {
            config.setDescription(description);
        }
        config = appConfigRepository.save(config);
        
        // If restaurant location was updated, reload it in DistanceUtil
        if (key.equals("restaurant.latitude") || key.equals("restaurant.longitude")) {
            distanceUtil.reloadRestaurantLocation();
        }
        
        return ResponseEntity.ok(ApiResponse.<AppConfig>builder()
                .success(true)
                .message("Config updated successfully")
                .data(config)
                .build());
    }
    
    // Restaurant Location Configuration
    @GetMapping("/restaurant/location")
    public ResponseEntity<ApiResponse<com.shivdhaba.food_delivery.dto.response.RestaurantLocationResponse>> getRestaurantLocation() {
        // Get address from config if available
        String address = appConfigRepository.findByConfigKey("restaurant.address")
                .map(AppConfig::getConfigValue)
                .orElse(null);
        
        // Get last updated timestamp
        LocalDateTime lastUpdated = appConfigRepository.findByConfigKey("restaurant.latitude")
                .map(AppConfig::getUpdatedAt)
                .orElse(null);
        
        com.shivdhaba.food_delivery.dto.response.RestaurantLocationResponse response = 
                com.shivdhaba.food_delivery.dto.response.RestaurantLocationResponse.builder()
                        .latitude(distanceUtil.getRestaurantLatitude())
                        .longitude(distanceUtil.getRestaurantLongitude())
                        .address(address)
                        .lastUpdatedAt(lastUpdated)
                        .build();
        
        return ResponseEntity.ok(ApiResponse.<com.shivdhaba.food_delivery.dto.response.RestaurantLocationResponse>builder()
                .success(true)
                .message("Restaurant location retrieved successfully")
                .data(response)
                .build());
    }
    
    @PostMapping("/restaurant/location")
    public ResponseEntity<ApiResponse<com.shivdhaba.food_delivery.dto.response.RestaurantLocationResponse>> updateRestaurantLocation(
            @Valid @RequestBody com.shivdhaba.food_delivery.dto.request.RestaurantLocationRequest request) {
        
        // Update latitude
        AppConfig latConfig = appConfigRepository.findByConfigKey("restaurant.latitude")
                .orElse(AppConfig.builder()
                        .configKey("restaurant.latitude")
                        .description("Restaurant latitude coordinate")
                        .build());
        latConfig.setConfigValue(String.valueOf(request.getLatitude()));
        appConfigRepository.save(latConfig);
        
        // Update longitude
        AppConfig lngConfig = appConfigRepository.findByConfigKey("restaurant.longitude")
                .orElse(AppConfig.builder()
                        .configKey("restaurant.longitude")
                        .description("Restaurant longitude coordinate")
                        .build());
        lngConfig.setConfigValue(String.valueOf(request.getLongitude()));
        appConfigRepository.save(lngConfig);
        
        // Update address if provided
        if (request.getAddress() != null && !request.getAddress().trim().isEmpty()) {
            AppConfig addressConfig = appConfigRepository.findByConfigKey("restaurant.address")
                    .orElse(AppConfig.builder()
                            .configKey("restaurant.address")
                            .description("Restaurant address")
                            .build());
            addressConfig.setConfigValue(request.getAddress());
            appConfigRepository.save(addressConfig);
        }
        
        // Reload location in DistanceUtil to use new values
        distanceUtil.reloadRestaurantLocation();
        
        com.shivdhaba.food_delivery.dto.response.RestaurantLocationResponse response = 
                com.shivdhaba.food_delivery.dto.response.RestaurantLocationResponse.builder()
                        .latitude(request.getLatitude())
                        .longitude(request.getLongitude())
                        .address(request.getAddress())
                        .lastUpdatedAt(LocalDateTime.now())
                        .build();
        
        return ResponseEntity.ok(ApiResponse.<com.shivdhaba.food_delivery.dto.response.RestaurantLocationResponse>builder()
                .success(true)
                .message("Restaurant location updated successfully")
                .data(response)
                .build());
    }

    @PutMapping("/menu/items/{itemId}/status")
    public ResponseEntity<ApiResponse<MenuItem>> updateMenuItemStatus(
            @PathVariable Long itemId,
            @RequestParam ItemStatus status) {
        MenuItem item = menuItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found"));
        item.setStatus(status);
        MenuItem updatedItem = menuItemRepository.save(item);
        return ResponseEntity.ok(ApiResponse.<MenuItem>builder()
                .success(true)
                .message("Menu item status updated successfully")
                .data(updatedItem)
                .build());
    }
    
    // Delivery Boy Location Tracking
    @GetMapping("/delivery-boys/locations")
    public ResponseEntity<ApiResponse<List<DeliveryBoyLocationResponse>>> getAllDeliveryBoysLocations() {
        List<DeliveryBoyLocationResponse> locations = locationBroadcastService.getAllDeliveryBoysLocations();
        return ResponseEntity.ok(ApiResponse.<List<DeliveryBoyLocationResponse>>builder()
                .success(true)
                .message("All delivery boys locations retrieved successfully")
                .data(locations)
                .build());
    }
    
    @GetMapping("/delivery-boys/locations/active")
    public ResponseEntity<ApiResponse<List<DeliveryBoyLocationResponse>>> getActiveDeliveryBoysLocations() {
        List<DeliveryBoyLocationResponse> locations = locationBroadcastService.getActiveDeliveryBoysLocations();
        return ResponseEntity.ok(ApiResponse.<List<DeliveryBoyLocationResponse>>builder()
                .success(true)
                .message("Active delivery boys locations retrieved successfully")
                .data(locations)
                .build());
    }
}

