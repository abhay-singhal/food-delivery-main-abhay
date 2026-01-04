package com.shivdhaba.food_delivery.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class DeliveryBoyRegisterRequest {
    
    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Mobile number must be 10 digits")
    private String mobileNumber;
    
    @NotBlank(message = "Full name is required")
    private String fullName;
    
    private String licenseNumber;
    
    private String vehicleNumber;
    
    private String vehicleType;
}







