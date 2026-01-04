package com.shivdhaba.food_delivery.util;

import com.shivdhaba.food_delivery.repository.AppConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
@RequiredArgsConstructor
public class DistanceUtil {
    
    private final AppConfigRepository appConfigRepository;
    
    @Value("${restaurant.latitude}")
    private Double defaultRestaurantLatitude;
    
    @Value("${restaurant.longitude}")
    private Double defaultRestaurantLongitude;
    
    @Value("${delivery.default-radius-km}")
    private Double defaultRadiusKm;
    
    private Double restaurantLatitude;
    private Double restaurantLongitude;
    
    @PostConstruct
    private void initializeRestaurantLocation() {
        loadRestaurantLocation();
    }
    
    /**
     * Load restaurant location from AppConfig, fallback to properties if not configured.
     */
    public void loadRestaurantLocation() {
        try {
            // Try to load from AppConfig first
            appConfigRepository.findByConfigKey("restaurant.latitude")
                    .ifPresent(config -> {
                        try {
                            restaurantLatitude = Double.parseDouble(config.getConfigValue());
                        } catch (NumberFormatException e) {
                            restaurantLatitude = defaultRestaurantLatitude;
                        }
                    });
            
            appConfigRepository.findByConfigKey("restaurant.longitude")
                    .ifPresent(config -> {
                        try {
                            restaurantLongitude = Double.parseDouble(config.getConfigValue());
                        } catch (NumberFormatException e) {
                            restaurantLongitude = defaultRestaurantLongitude;
                        }
                    });
            
            // If not found in AppConfig, use defaults
            if (restaurantLatitude == null) {
                restaurantLatitude = defaultRestaurantLatitude;
            }
            if (restaurantLongitude == null) {
                restaurantLongitude = defaultRestaurantLongitude;
            }
        } catch (Exception e) {
            // Fallback to defaults on any error
            restaurantLatitude = defaultRestaurantLatitude;
            restaurantLongitude = defaultRestaurantLongitude;
        }
    }
    
    /**
     * Force reload restaurant location from AppConfig.
     * Call this after updating restaurant location in database.
     */
    public void reloadRestaurantLocation() {
        restaurantLatitude = null;
        restaurantLongitude = null;
        loadRestaurantLocation();
    }
    
    /**
     * Get current restaurant latitude (from AppConfig or properties).
     */
    public Double getRestaurantLatitude() {
        if (restaurantLatitude == null) {
            loadRestaurantLocation();
        }
        return restaurantLatitude;
    }
    
    /**
     * Get current restaurant longitude (from AppConfig or properties).
     */
    public Double getRestaurantLongitude() {
        if (restaurantLongitude == null) {
            loadRestaurantLocation();
        }
        return restaurantLongitude;
    }
    
    public double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the earth in km
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = R * c;
        
        return distance;
    }
    
    public boolean isWithinDeliveryRadius(double latitude, double longitude) {
        double distance = calculateDistance(getRestaurantLatitude(), getRestaurantLongitude(), latitude, longitude);
        return distance <= defaultRadiusKm;
    }
    
    public double getDistanceFromRestaurant(double latitude, double longitude) {
        return calculateDistance(getRestaurantLatitude(), getRestaurantLongitude(), latitude, longitude);
    }
}

