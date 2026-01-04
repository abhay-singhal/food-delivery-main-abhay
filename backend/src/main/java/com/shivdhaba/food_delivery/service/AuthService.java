package com.shivdhaba.food_delivery.service;

import com.shivdhaba.food_delivery.domain.entity.User;
import com.shivdhaba.food_delivery.domain.enums.Role;
import com.shivdhaba.food_delivery.dto.request.AdminLoginRequest;
import com.shivdhaba.food_delivery.dto.request.AdminRegisterRequest;
import com.shivdhaba.food_delivery.dto.request.OtpRequest;
import com.shivdhaba.food_delivery.dto.request.OtpVerifyRequest;
import com.shivdhaba.food_delivery.dto.response.AuthResponse;
import com.shivdhaba.food_delivery.dto.response.OtpResponse;
import com.shivdhaba.food_delivery.dto.response.UserResponse;
import com.shivdhaba.food_delivery.exception.UnauthorizedException;
import com.shivdhaba.food_delivery.domain.entity.DeliveryBoyDetails;
import com.shivdhaba.food_delivery.dto.request.DeliveryBoyRegisterRequest;
import com.shivdhaba.food_delivery.exception.BadRequestException;
import com.shivdhaba.food_delivery.repository.DeliveryBoyDetailsRepository;
import com.shivdhaba.food_delivery.repository.UserRepository;
import com.shivdhaba.food_delivery.util.JwtUtil;
import com.shivdhaba.food_delivery.util.OtpUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final DeliveryBoyDetailsRepository deliveryBoyDetailsRepository;
    private final OtpUtil otpUtil;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final OtpStorageService otpStorageService;
    
    @Value("${otp.expiration-minutes}")
    private int otpExpirationMinutes;
    
    public OtpResponse sendOtp(OtpRequest request) {
        String mobileNumber = request.getMobileNumber();
        String otp = otpUtil.generateOtp();
        
        // Store OTP using OtpStorageService (works with Redis or InMemory)
        otpStorageService.storeOtp(mobileNumber, otp, otpExpirationMinutes);
        
        // In production, send OTP via SMS service
        // For now, we'll log it (remove in production)
        System.out.println("OTP for " + mobileNumber + ": " + otp);
        
        return OtpResponse.builder()
                .message("OTP sent successfully")
                .expiresInSeconds((long) (otpExpirationMinutes * 60))
                .build();
    }
    
    @Transactional
    public AuthResponse verifyOtp(OtpVerifyRequest request, Role role) {
        String mobileNumber = request.getMobileNumber();
        String otp = request.getOtp();
        
        // Verify OTP using OtpStorageService (works with Redis or InMemory)
        String storedOtp = otpStorageService.getOtp(mobileNumber);
        
        if (storedOtp == null) {
            System.out.println("OTP verification failed for " + mobileNumber + ": OTP not found or expired");
            throw new UnauthorizedException("Invalid or expired OTP");
        }
        
        if (!storedOtp.equals(otp)) {
            System.out.println("OTP verification failed for " + mobileNumber + ": Expected " + storedOtp + ", got " + otp);
            throw new UnauthorizedException("Invalid or expired OTP");
        }
        
        System.out.println("OTP verification successful for " + mobileNumber);
        
        // Delete OTP after verification
        otpStorageService.deleteOtp(mobileNumber);
        
        // For delivery boys, they must be pre-registered by admin
        // For customers, auto-create if doesn't exist
        User user;
        if (role == Role.DELIVERY_BOY) {
            // Delivery boys must be pre-registered - don't auto-create
            user = userRepository.findByMobileNumberAndRole(mobileNumber, role)
                    .orElseThrow(() -> new UnauthorizedException(
                            "Delivery boy not registered. Please contact admin to register your account."));
            
            // Also verify that DeliveryBoyDetails exists (created by admin)
            if (deliveryBoyDetailsRepository.findByUser(user).isEmpty()) {
                throw new UnauthorizedException(
                        "Delivery boy account incomplete. Please contact admin to complete registration.");
            }
        } else {
            // For customers, auto-create if doesn't exist
            user = userRepository.findByMobileNumberAndRole(mobileNumber, role)
                    .orElseGet(() -> {
                        User newUser = User.builder()
                                .mobileNumber(mobileNumber)
                                .role(role)
                                .isActive(true)
                                .build();
                        return userRepository.save(newUser);
                    });
        }
        
        if (!user.getIsActive()) {
            throw new UnauthorizedException("User account is inactive");
        }
        
        // Generate tokens - For delivery boys, tokens expire at midnight (12 AM)
        String accessToken;
        String refreshToken;
        if (role == Role.DELIVERY_BOY) {
            accessToken = jwtUtil.generateAccessTokenUntilMidnight(user.getMobileNumber(), user.getRole().name());
            refreshToken = jwtUtil.generateRefreshTokenUntilMidnight(user.getMobileNumber());
        } else {
            accessToken = jwtUtil.generateAccessToken(user.getMobileNumber(), user.getRole().name());
            refreshToken = jwtUtil.generateRefreshToken(user.getMobileNumber());
        }
        
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(UserResponse.builder()
                        .id(user.getId())
                        .mobileNumber(user.getMobileNumber())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .isActive(user.getIsActive())
                        .build())
                .build();
    }
    
    @Transactional
    public AuthResponse createAdminUser(AdminRegisterRequest request) {
        if (userRepository.findByMobileNumber(request.getMobileNumber()).isPresent()) {
            throw new IllegalArgumentException("User with this mobile number already exists");
        }

        User adminUser = User.builder()
                .mobileNumber(request.getMobileNumber())
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.ADMIN)
                .isActive(true)
                .build();

        adminUser = userRepository.save(adminUser);

        String accessToken = jwtUtil.generateAccessToken(adminUser.getMobileNumber(), adminUser.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(adminUser.getMobileNumber());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(UserResponse.builder()
                        .id(adminUser.getId())
                        .mobileNumber(adminUser.getMobileNumber())
                        .fullName(adminUser.getFullName())
                        .email(adminUser.getEmail())
                        .role(adminUser.getRole())
                        .isActive(adminUser.getIsActive())
                        .build())
                .build();
    }

    public AuthResponse adminLogin(AdminLoginRequest request) {
        User admin = userRepository.findByMobileNumberAndRole(request.getUsername(), Role.ADMIN)
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
        
        if (!admin.getIsActive()) {
            throw new UnauthorizedException("Admin account is inactive");
        }
        
        if (admin.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), admin.getPasswordHash())) {
            throw new UnauthorizedException("Invalid credentials");
        }
        
        String accessToken = jwtUtil.generateAccessToken(admin.getMobileNumber(), admin.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(admin.getMobileNumber());
        
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(UserResponse.builder()
                        .id(admin.getId())
                        .mobileNumber(admin.getMobileNumber())
                        .fullName(admin.getFullName())
                        .email(admin.getEmail())
                        .role(admin.getRole())
                        .isActive(admin.getIsActive())
                        .build())
                .build();
    }
    
    public AuthResponse refreshToken(String refreshToken) {
        try {
            String username = jwtUtil.extractUsername(refreshToken);
            if (!jwtUtil.validateToken(refreshToken, username)) {
                throw new UnauthorizedException("Invalid refresh token");
            }
            
            User user = userRepository.findByMobileNumber(username)
                    .orElseThrow(() -> new UnauthorizedException("User not found"));
            
            if (!user.getIsActive()) {
                throw new UnauthorizedException("User account is inactive");
            }
            
            // For delivery boys, tokens expire at midnight (12 AM)
            String newAccessToken;
            String newRefreshToken;
            if (user.getRole() == Role.DELIVERY_BOY) {
                newAccessToken = jwtUtil.generateAccessTokenUntilMidnight(user.getMobileNumber(), user.getRole().name());
                newRefreshToken = jwtUtil.generateRefreshTokenUntilMidnight(user.getMobileNumber());
            } else {
                newAccessToken = jwtUtil.generateAccessToken(user.getMobileNumber(), user.getRole().name());
                newRefreshToken = jwtUtil.generateRefreshToken(user.getMobileNumber());
            }
            
            return AuthResponse.builder()
                    .accessToken(newAccessToken)
                    .refreshToken(newRefreshToken)
                    .user(UserResponse.builder()
                            .id(user.getId())
                            .mobileNumber(user.getMobileNumber())
                            .fullName(user.getFullName())
                            .email(user.getEmail())
                            .role(user.getRole())
                            .isActive(user.getIsActive())
                            .build())
                    .build();
        } catch (Exception e) {
            throw new UnauthorizedException("Invalid refresh token");
        }
    }
    
    /**
     * Register a delivery boy (public endpoint for self-registration).
     * Creates both User and DeliveryBoyDetails records.
     * 
     * Note: This is a convenience method for development/testing.
     * In production, consider restricting this endpoint or requiring admin approval.
     */
    @Transactional
    public Map<String, Object> registerDeliveryBoy(DeliveryBoyRegisterRequest request) {
        String mobileNumber = request.getMobileNumber();
        String fullName = request.getFullName();
        
        // Check if delivery boy already exists
        if (userRepository.existsByMobileNumberAndRole(mobileNumber, Role.DELIVERY_BOY)) {
            throw new BadRequestException("Delivery boy with this mobile number already exists");
        }
        
        // Create User
        User user = User.builder()
                .mobileNumber(mobileNumber)
                .fullName(fullName)
                .role(Role.DELIVERY_BOY)
                .isActive(true)
                .build();
        user = userRepository.save(user);
        
        // Create DeliveryBoyDetails
        DeliveryBoyDetails details = DeliveryBoyDetails.builder()
                .user(user)
                .licenseNumber(request.getLicenseNumber())
                .vehicleNumber(request.getVehicleNumber())
                .vehicleType(request.getVehicleType())
                .isAvailable(true)
                .isOnDuty(false)
                .build();
        deliveryBoyDetailsRepository.save(details);
        
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("id", details.getId());
        response.put("userId", user.getId());
        response.put("mobileNumber", user.getMobileNumber());
        response.put("fullName", user.getFullName());
        
        return response;
    }
}

