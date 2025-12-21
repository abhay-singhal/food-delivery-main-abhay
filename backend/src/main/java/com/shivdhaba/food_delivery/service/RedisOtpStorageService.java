package com.shivdhaba.food_delivery.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * Redis-based OTP storage implementation.
 * Used when Redis is configured and available.
 * Uses StringRedisSerializer for both keys and values since OTPs are simple strings.
 */
@Slf4j
@Service("redisOtpStorageService")
@Primary
@ConditionalOnBean(name = "otpRedisTemplate")
@RequiredArgsConstructor
public class RedisOtpStorageService implements OtpStorageService {
    
    @Qualifier("otpRedisTemplate")
    private final RedisTemplate<String, String> otpRedisTemplate;
    
    @Override
    public void storeOtp(String mobileNumber, String otp, int expirationMinutes) {
        String otpKey = "otp:" + mobileNumber;
        otpRedisTemplate.opsForValue().set(otpKey, otp, expirationMinutes, TimeUnit.MINUTES);
        log.debug("OTP stored in Redis for mobile: {} (expires in {} minutes)", mobileNumber, expirationMinutes);
    }
    
    @Override
    public String getOtp(String mobileNumber) {
        String otpKey = "otp:" + mobileNumber;
        String otp = otpRedisTemplate.opsForValue().get(otpKey);
        if (otp == null) {
            log.debug("OTP not found in Redis for mobile: {}", mobileNumber);
        } else {
            log.debug("OTP retrieved from Redis for mobile: {}", mobileNumber);
        }
        return otp;
    }
    
    @Override
    public void deleteOtp(String mobileNumber) {
        String otpKey = "otp:" + mobileNumber;
        otpRedisTemplate.delete(otpKey);
        log.debug("OTP deleted from Redis for mobile: {}", mobileNumber);
    }
}

