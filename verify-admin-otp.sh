#!/bin/bash
# Admin OTP Verification - Curl Command
# Replace the OTP value with the actual OTP from your console logs

# Using phone number
curl -X POST http://localhost:8080/api/v1/auth/admin/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "9389110115",
    "otp": "123456"
  }'

# Alternative: Using email
# curl -X POST http://localhost:8080/api/v1/auth/admin/otp/verify \
#   -H "Content-Type: application/json" \
#   -d '{
#     "emailOrPhone": "harshg101999@gmail.com",
#     "otp": "123456"
#   }'

