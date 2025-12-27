package com.shivdhaba.food_delivery.controller;

import com.shivdhaba.food_delivery.domain.entity.DeliveryBoyDetails;
import com.shivdhaba.food_delivery.domain.entity.DeliveryTracking;
import com.shivdhaba.food_delivery.domain.entity.Order;
import com.shivdhaba.food_delivery.domain.enums.OrderStatus;
import com.shivdhaba.food_delivery.dto.request.LocationUpdateRequest;
import com.shivdhaba.food_delivery.dto.response.ApiResponse;
import com.shivdhaba.food_delivery.dto.response.OrderResponse;
import com.shivdhaba.food_delivery.dto.response.PaymentResponse;
import jakarta.validation.Valid;
import com.shivdhaba.food_delivery.exception.BadRequestException;
import com.shivdhaba.food_delivery.exception.ResourceNotFoundException;
import com.shivdhaba.food_delivery.repository.DeliveryBoyDetailsRepository;
import com.shivdhaba.food_delivery.repository.DeliveryTrackingRepository;
import com.shivdhaba.food_delivery.repository.OrderRepository;
import com.shivdhaba.food_delivery.repository.UserRepository;
import com.shivdhaba.food_delivery.service.NotificationService;
import com.shivdhaba.food_delivery.service.OrderService;
import com.shivdhaba.food_delivery.service.PaymentService;
import com.shivdhaba.food_delivery.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/delivery")
@RequiredArgsConstructor
public class DeliveryController {
    
    private final OrderService orderService;
    private final PaymentService paymentService;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final DeliveryBoyDetailsRepository deliveryBoyDetailsRepository;
    private final DeliveryTrackingRepository deliveryTrackingRepository;
    private final NotificationService notificationService;
    private final SecurityUtil securityUtil;
    private final com.shivdhaba.food_delivery.service.OrderAssignmentService orderAssignmentService;
    private final com.shivdhaba.food_delivery.service.LocationBroadcastService locationBroadcastService;
    
    @GetMapping("/orders/available")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAvailableOrders() {
        // Get orders that are READY (ready for delivery) OR PLACED/ACCEPTED/PREPARING (waiting to be ready)
        // This allows delivery partners to see orders even before they're marked as READY
        List<OrderStatus> availableStatuses = List.of(
            OrderStatus.PLACED,
            OrderStatus.ACCEPTED,
            OrderStatus.PREPARING,
            OrderStatus.READY
        );
        List<Order> orders = orderRepository.findUnassignedOrdersByStatuses(availableStatuses);
        List<OrderResponse> orderResponses = orders.stream()
                .map(orderService::mapToOrderResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.<List<OrderResponse>>builder()
                .success(true)
                .message("Available orders retrieved successfully")
                .data(orderResponses)
                .build());
    }
    
    @PostMapping("/orders/{orderId}/accept")
    public ResponseEntity<ApiResponse<OrderResponse>> acceptOrder(
            @PathVariable Long orderId,
            Authentication authentication) {
        var deliveryBoy = securityUtil.getCurrentUser(authentication);
        
        // Use assignment service for concurrency-safe assignment
        Order order = orderAssignmentService.assignOrder(orderId, deliveryBoy.getId());
        
        return ResponseEntity.ok(ApiResponse.<OrderResponse>builder()
                .success(true)
                .message("Order accepted successfully")
                .data(orderService.mapToOrderResponse(order))
                .build());
    }
    
    @PostMapping("/orders/{orderId}/update-location")
    public ResponseEntity<ApiResponse<Void>> updateLocation(
            @PathVariable Long orderId,
            @Valid @RequestBody LocationUpdateRequest request,
            Authentication authentication) {
        var deliveryBoy = securityUtil.getCurrentUser(authentication);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        if (order.getDeliveryBoy() == null || !order.getDeliveryBoy().getId().equals(deliveryBoy.getId())) {
            throw new BadRequestException("Order not assigned to you");
        }
        
        DeliveryTracking tracking = DeliveryTracking.builder()
                .order(order)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .address(request.getAddress())
                .build();
        deliveryTrackingRepository.save(tracking);
        
        // Update and broadcast location to customer and admin
        locationBroadcastService.updateAndBroadcastLocation(
                deliveryBoy.getId(), 
                orderId, 
                request.getLatitude(), 
                request.getLongitude(), 
                request.getAddress()
        );
        
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Location updated successfully")
                .build());
    }
    
    @PostMapping("/orders/{orderId}/deliver")
    public ResponseEntity<ApiResponse<OrderResponse>> markDelivered(
            @PathVariable Long orderId,
            Authentication authentication) {
        var deliveryBoy = securityUtil.getCurrentUser(authentication);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        if (order.getDeliveryBoy() == null || !order.getDeliveryBoy().getId().equals(deliveryBoy.getId())) {
            throw new BadRequestException("Order not assigned to you");
        }
        
        if (order.getStatus() != OrderStatus.OUT_FOR_DELIVERY) {
            throw new BadRequestException("Order is not out for delivery");
        }
        
        order.setStatus(OrderStatus.DELIVERED);
        order = orderRepository.save(order);
        
        // If COD, mark payment as collected
        if (order.getPaymentMethod() == com.shivdhaba.food_delivery.domain.enums.PaymentMethod.COD) {
            paymentService.markCodCollected(orderId);
        }
        
        // Release delivery partner (makes them available for new orders)
        orderAssignmentService.releaseDeliveryPartner(orderId);
        
        // Send notifications
        notificationService.sendNotificationToUser(order.getCustomer().getId(),
                "Order Delivered",
                "Your order #" + order.getOrderNumber() + " has been delivered");
        
        return ResponseEntity.ok(ApiResponse.<OrderResponse>builder()
                .success(true)
                .message("Order marked as delivered")
                .data(orderService.mapToOrderResponse(order))
                .build());
    }
    
    @GetMapping("/orders/my-orders")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders(Authentication authentication) {
        var deliveryBoy = securityUtil.getCurrentUser(authentication);
        
        List<Order> orders = orderRepository.findByDeliveryBoyOrderByCreatedAtDesc(deliveryBoy);
        List<OrderResponse> orderResponses = orders.stream()
                .map(orderService::mapToOrderResponse)
                .toList();
        
        return ResponseEntity.ok(ApiResponse.<List<OrderResponse>>builder()
                .success(true)
                .message("Orders retrieved successfully")
                .data(orderResponses)
                .build());
    }
    
    @PutMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateStatus(
            @RequestParam Boolean isAvailable,
            @RequestParam Boolean isOnDuty,
            Authentication authentication) {
        var deliveryBoy = securityUtil.getCurrentUser(authentication);
        
        DeliveryBoyDetails details = deliveryBoyDetailsRepository.findByUser(deliveryBoy)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery boy details not found"));
        
        details.setIsAvailable(isAvailable);
        details.setIsOnDuty(isOnDuty);
        deliveryBoyDetailsRepository.save(details);
        
        Map<String, Object> response = new HashMap<>();
        response.put("isAvailable", details.getIsAvailable());
        response.put("isOnDuty", details.getIsOnDuty());
        
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .message("Status updated successfully")
                .data(response)
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
    
    @PostMapping("/orders/{orderId}/start")
    public ResponseEntity<ApiResponse<OrderResponse>> startOrder(
            @PathVariable Long orderId,
            Authentication authentication) {
        var deliveryBoy = securityUtil.getCurrentUser(authentication);
        
        // Use assignment service to start delivery
        Order order = orderAssignmentService.startDelivery(orderId, deliveryBoy.getId());
        
        return ResponseEntity.ok(ApiResponse.<OrderResponse>builder()
                .success(true)
                .message("Order started successfully")
                .data(orderService.mapToOrderResponse(order))
                .build());
    }
}

