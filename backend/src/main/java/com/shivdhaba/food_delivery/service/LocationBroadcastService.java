package com.shivdhaba.food_delivery.service;

import com.shivdhaba.food_delivery.domain.entity.DeliveryBoyDetails;
import com.shivdhaba.food_delivery.domain.entity.Order;
import com.shivdhaba.food_delivery.repository.DeliveryBoyDetailsRepository;
import com.shivdhaba.food_delivery.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for broadcasting delivery partner location updates to customers and admins.
 * 
 * This service updates the delivery partner's location and broadcasts it via Firebase Firestore
 * so that customers and admins can see real-time tracking on maps.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LocationBroadcastService {
    
    private final DeliveryBoyDetailsRepository deliveryBoyDetailsRepository;
    private final OrderRepository orderRepository;
    
    /**
     * Update delivery partner location and broadcast to relevant parties.
     * 
     * @param deliveryPartnerId The delivery partner's user ID
     * @param orderId The order ID (if updating location for a specific order)
     * @param latitude Current latitude
     * @param longitude Current longitude
     * @param address Optional address string
     */
    @Transactional
    public void updateAndBroadcastLocation(Long deliveryPartnerId, Long orderId, 
                                          Double latitude, Double longitude, String address) {
        // Update delivery partner's current location
        DeliveryBoyDetails partnerDetails = deliveryBoyDetailsRepository
                .findByUserId(deliveryPartnerId)
                .orElse(null);
        
        if (partnerDetails != null) {
            partnerDetails.setCurrentLatitude(latitude);
            partnerDetails.setCurrentLongitude(longitude);
            deliveryBoyDetailsRepository.save(partnerDetails);
        }
        
        // If orderId is provided, also update order-specific tracking
        if (orderId != null) {
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order != null && order.getDeliveryBoy() != null 
                    && order.getDeliveryBoy().getId().equals(deliveryPartnerId)) {
                // Location is already tracked via DeliveryTracking entity
                // This service can be extended to push to Firestore for real-time updates
                log.debug("Location updated for order {}: ({}, {})", orderId, latitude, longitude);
            }
        }
        
        // Note: Real-time broadcasting to Firestore would be implemented here
        // For now, clients can poll the API or use Firestore listeners directly
        log.debug("Location broadcasted for delivery partner {}: ({}, {})", 
                deliveryPartnerId, latitude, longitude);
    }
    
    /**
     * Get location data for a delivery partner.
     * 
     * @param deliveryPartnerId The delivery partner's user ID
     * @return Map containing location data
     */
    public Map<String, Object> getDeliveryPartnerLocation(Long deliveryPartnerId) {
        DeliveryBoyDetails partnerDetails = deliveryBoyDetailsRepository
                .findByUserId(deliveryPartnerId)
                .orElse(null);
        
        Map<String, Object> locationData = new HashMap<>();
        if (partnerDetails != null) {
            locationData.put("latitude", partnerDetails.getCurrentLatitude());
            locationData.put("longitude", partnerDetails.getCurrentLongitude());
            locationData.put("isAvailable", partnerDetails.getIsAvailable());
            locationData.put("isOnDuty", partnerDetails.getIsOnDuty());
        }
        
        return locationData;
    }
}

