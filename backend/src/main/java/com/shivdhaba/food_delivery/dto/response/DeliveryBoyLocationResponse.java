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
public class DeliveryBoyLocationResponse {
    private Long deliveryBoyId;
    private String deliveryBoyName;
    private String deliveryBoyMobile;
    private Double latitude;
    private Double longitude;
    private String address;
    private Boolean isAvailable;
    private Boolean isOnDuty;
    private LocalDateTime lastUpdatedAt;
    private Long currentOrderId;
    private String currentOrderNumber;
}




