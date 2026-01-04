package com.shivdhaba.food_delivery.controller;

import com.shivdhaba.food_delivery.dto.request.PlaceOrderRequest;
import com.shivdhaba.food_delivery.dto.request.UpdateFullNameRequest;
import com.shivdhaba.food_delivery.dto.response.ApiResponse;
import com.shivdhaba.food_delivery.dto.response.OrderResponse;
import com.shivdhaba.food_delivery.dto.response.PaymentResponse;
import com.shivdhaba.food_delivery.dto.request.ReviewRequest;
import com.shivdhaba.food_delivery.dto.response.ReviewResponse;
import com.shivdhaba.food_delivery.dto.response.UserResponse;
import com.shivdhaba.food_delivery.repository.UserRepository;
import com.shivdhaba.food_delivery.domain.entity.User;
import com.shivdhaba.food_delivery.exception.ResourceNotFoundException;
import com.shivdhaba.food_delivery.service.LocationBroadcastService;
import com.shivdhaba.food_delivery.service.NotificationService;
import com.shivdhaba.food_delivery.domain.entity.Order;
import com.shivdhaba.food_delivery.service.OrderService;
import com.shivdhaba.food_delivery.service.PaymentService;
import com.shivdhaba.food_delivery.service.ReviewService;
import com.shivdhaba.food_delivery.util.SecurityUtil;
import com.shivdhaba.food_delivery.util.DistanceUtil;
import com.shivdhaba.food_delivery.dto.response.DeliveryBoyLocationResponse;
import com.shivdhaba.food_delivery.dto.response.RestaurantLocationResponse;
import com.shivdhaba.food_delivery.repository.AppConfigRepository;
import com.shivdhaba.food_delivery.domain.entity.AppConfig;
import java.time.LocalDateTime;
import com.shivdhaba.food_delivery.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/customer")
@RequiredArgsConstructor
@Slf4j
public class CustomerController {
    
    private final OrderService orderService;
    private final PaymentService paymentService;
    private final NotificationService notificationService;
    private final ReviewService reviewService;
    private final LocationBroadcastService locationBroadcastService;
    private final SecurityUtil securityUtil;
    private final DistanceUtil distanceUtil;
    private final AppConfigRepository appConfigRepository;
    private final UserRepository userRepository;
    
    @PostMapping("/orders")
    public ResponseEntity<ApiResponse<Map<String, Object>>> placeOrder(
            @Valid @RequestBody PlaceOrderRequest request,
            Authentication authentication) {
        Long customerId = securityUtil.getCurrentUserId(authentication);
        OrderResponse order = orderService.placeOrder(customerId, request);

        if (request.getPaymentMethod() == com.shivdhaba.food_delivery.domain.enums.PaymentMethod.RAZORPAY) {
            Order orderEntity = orderService.getOrderEntity(order.getId());
            String razorpayOrderId = paymentService.createRazorpayOrder(orderEntity);

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("order", order);
            responseData.put("razorpayOrderId", razorpayOrderId);

            return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                    .success(true)
                    .message("Order placed successfully, awaiting payment")
                    .data(responseData)
                    .build());
        } else {
            return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                    .success(true)
                    .message("Order placed successfully")
                    .data(Map.of("order", order))
                    .build());
        }
    }
    
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders(Authentication authentication) {
        Long customerId = securityUtil.getCurrentUserId(authentication);
        List<OrderResponse> orders = orderService.getCustomerOrders(customerId);
        return ResponseEntity.ok(ApiResponse.<List<OrderResponse>>builder()
                .success(true)
                .message("Orders retrieved successfully")
                .data(orders)
                .build());
    }
    
    @GetMapping("/orders/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(
            @PathVariable Long orderId,
            Authentication authentication) {
        Long customerId = securityUtil.getCurrentUserId(authentication);
        OrderResponse order = orderService.getOrder(orderId);
        
        // Verify order belongs to customer
        if (order.getCustomerId() == null || !order.getCustomerId().equals(customerId)) {
            log.warn("Access denied: Order {} does not belong to customer {}", orderId, customerId);
            return ResponseEntity.status(403)
                    .body(ApiResponse.<OrderResponse>builder()
                            .success(false)
                            .message("Access denied. This order does not belong to you.")
                            .build());
        }
        
        return ResponseEntity.ok(ApiResponse.<OrderResponse>builder()
                .success(true)
                .message("Order retrieved successfully")
                .data(order)
                .build());
    }
    
    @PostMapping("/orders/{orderId}/payment/razorpay/create")
    public ResponseEntity<ApiResponse<String>> createRazorpayOrder(
            @PathVariable Long orderId,
            Authentication authentication) {
        Long customerId = securityUtil.getCurrentUserId(authentication);
        OrderResponse order = orderService.getOrder(orderId);
        
        if (!order.getCustomerId().equals(customerId)) {
            return ResponseEntity.status(403).build();
        }
        
        Order orderEntity = orderService.getOrderEntity(orderId);
        String razorpayOrderId = paymentService.createRazorpayOrder(orderEntity);
        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true)
                .message("Razorpay order created successfully")
                .data(razorpayOrderId)
                .build());
    }
    
    @PostMapping("/orders/{orderId}/payment/razorpay/verify")
    public ResponseEntity<ApiResponse<PaymentResponse>> verifyRazorpayPayment(
            @PathVariable Long orderId,
            @RequestParam String razorpayOrderId,
            @RequestParam String razorpayPaymentId,
            @RequestParam String razorpaySignature,
            Authentication authentication) {
        Long customerId = securityUtil.getCurrentUserId(authentication);
        OrderResponse order = orderService.getOrder(orderId);
        
        if (!order.getCustomerId().equals(customerId)) {
            return ResponseEntity.status(403).build();
        }
        
        PaymentResponse payment = paymentService.verifyPayment(
                razorpayOrderId, razorpayPaymentId, razorpaySignature);
        return ResponseEntity.ok(ApiResponse.<PaymentResponse>builder()
                .success(true)
                .message("Payment verified successfully")
                .data(payment)
                .build());
    }
    
    @PutMapping("/fcm-token")
    public ResponseEntity<ApiResponse<Void>> updateFcmToken(
            @RequestParam String fcmToken,
            Authentication authentication) {
        Long userId = securityUtil.getCurrentUserId(authentication);
        notificationService.updateFcmToken(userId, fcmToken);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("FCM token updated successfully")
                .build());
    }
    
    @PostMapping("/reviews")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {
        Long customerId = securityUtil.getCurrentUserId(authentication);
        ReviewResponse review = reviewService.createReview(customerId, request);
        return ResponseEntity.ok(ApiResponse.<ReviewResponse>builder()
                .success(true)
                .message("Review submitted successfully")
                .data(review)
                .build());
    }
    
    @GetMapping("/reviews")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getMyReviews(Authentication authentication) {
        Long customerId = securityUtil.getCurrentUserId(authentication);
        List<ReviewResponse> reviews = reviewService.getCustomerReviews(customerId);
        return ResponseEntity.ok(ApiResponse.<List<ReviewResponse>>builder()
                .success(true)
                .message("Reviews retrieved successfully")
                .data(reviews)
                .build());
    }
    
    @GetMapping("/orders/{orderId}/delivery-boy-location")
    public ResponseEntity<ApiResponse<DeliveryBoyLocationResponse>> getDeliveryBoyLocation(
            @PathVariable Long orderId,
            Authentication authentication) {
        Long customerId = securityUtil.getCurrentUserId(authentication);
        OrderResponse order = orderService.getOrder(orderId);
        
        // Verify order belongs to customer
        if (order.getCustomerId() == null || !order.getCustomerId().equals(customerId)) {
            log.warn("Access denied: Order {} does not belong to customer {}", orderId, customerId);
            return ResponseEntity.status(403)
                    .body(ApiResponse.<DeliveryBoyLocationResponse>builder()
                            .success(false)
                            .message("Access denied. This order does not belong to you.")
                            .build());
        }
        
        // Check if order has a delivery boy assigned
        if (order.getDeliveryBoyId() == null) {
            return ResponseEntity.ok(ApiResponse.<DeliveryBoyLocationResponse>builder()
                    .success(true)
                    .message("No delivery boy assigned to this order yet")
                    .data(null)
                    .build());
        }
        
        DeliveryBoyLocationResponse location = locationBroadcastService.getDeliveryBoyLocationForOrder(orderId);
        
        if (location == null) {
            return ResponseEntity.ok(ApiResponse.<DeliveryBoyLocationResponse>builder()
                    .success(true)
                    .message("Delivery boy location not available")
                    .data(null)
                    .build());
        }
        
        return ResponseEntity.ok(ApiResponse.<DeliveryBoyLocationResponse>builder()
                .success(true)
                .message("Delivery boy location retrieved successfully")
                .data(location)
                .build());
    }
    
    @GetMapping("/restaurant/location")
    public ResponseEntity<ApiResponse<RestaurantLocationResponse>> getRestaurantLocation() {
        // Get address from config if available
        String address = appConfigRepository.findByConfigKey("restaurant.address")
                .map(AppConfig::getConfigValue)
                .orElse(null);
        
        // Get last updated timestamp
        LocalDateTime lastUpdated = appConfigRepository.findByConfigKey("restaurant.latitude")
                .map(AppConfig::getUpdatedAt)
                .orElse(null);
        
        RestaurantLocationResponse response = RestaurantLocationResponse.builder()
                .latitude(distanceUtil.getRestaurantLatitude())
                .longitude(distanceUtil.getRestaurantLongitude())
                .address(address)
                .lastUpdatedAt(lastUpdated)
                .build();
        
        return ResponseEntity.ok(ApiResponse.<RestaurantLocationResponse>builder()
                .success(true)
                .message("Restaurant location retrieved successfully")
                .data(response)
                .build());
    }
    
    @PutMapping("/profile/name")
    public ResponseEntity<ApiResponse<UserResponse>> updateFullName(
            @Valid @RequestBody UpdateFullNameRequest request,
            Authentication authentication) {
        Long userId = securityUtil.getCurrentUserId(authentication);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        user.setFullName(request.getFullName());
        user = userRepository.save(user);
        
        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .mobileNumber(user.getMobileNumber())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .build();
        
        return ResponseEntity.ok(ApiResponse.<UserResponse>builder()
                .success(true)
                .message("Name updated successfully")
                .data(userResponse)
                .build());
    }
}

