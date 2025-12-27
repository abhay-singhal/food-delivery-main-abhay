package com.shivdhaba.food_delivery.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantLocationResponse {
    private Double latitude;
    private Double longitude;
    private String address;
    private LocalDateTime lastUpdatedAt;
}

