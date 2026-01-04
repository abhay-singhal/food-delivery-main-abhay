# =====================================================
# Admin OTP Login Test Script
# =====================================================

$baseUrl = "http://localhost:8080/api/v1/auth"
$adminPhone = "9389110115"
$adminEmail = "harshg101999@gmail.com"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 1: Sending OTP to Admin" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Send OTP
$sendOtpBody = @{
    emailOrPhone = $adminPhone
} | ConvertTo-Json

Write-Host "Request URL: POST $baseUrl/admin/otp/send" -ForegroundColor Green
Write-Host "Request Body: $sendOtpBody" -ForegroundColor Green
Write-Host ""

try {
    $sendOtpResponse = Invoke-RestMethod -Uri "$baseUrl/admin/otp/send" `
        -Method POST `
        -ContentType "application/json" `
        -Body $sendOtpBody
    
    Write-Host "✅ OTP Sent Successfully!" -ForegroundColor Green
    Write-Host "Response: $($sendOtpResponse | ConvertTo-Json -Depth 3)" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Check your application console/logs for the OTP!" -ForegroundColor Yellow
    Write-Host "    Look for output like: 'ADMIN OTP for $adminPhone : XXXXXX'" -ForegroundColor Yellow
    Write-Host ""
    
    # Step 2: Verify OTP
    $otp = Read-Host "Enter the 6-digit OTP from console logs"
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Step 2: Verifying OTP" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    
    $verifyOtpBody = @{
        emailOrPhone = $adminPhone
        otp = $otp
    } | ConvertTo-Json
    
    Write-Host "Request URL: POST $baseUrl/admin/otp/verify" -ForegroundColor Green
    Write-Host "Request Body: $verifyOtpBody" -ForegroundColor Green
    Write-Host ""
    
    $verifyOtpResponse = Invoke-RestMethod -Uri "$baseUrl/admin/otp/verify" `
        -Method POST `
        -ContentType "application/json" `
        -Body $verifyOtpBody
    
    Write-Host "✅ Login Successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $verifyOtpResponse | ConvertTo-Json -Depth 5 | Write-Host
    Write-Host ""
    Write-Host "Access Token: $($verifyOtpResponse.data.accessToken)" -ForegroundColor Green
    Write-Host "Refresh Token: $($verifyOtpResponse.data.refreshToken)" -ForegroundColor Green
    Write-Host ""
    Write-Host "User Info:" -ForegroundColor Cyan
    Write-Host "  ID: $($verifyOtpResponse.data.user.id)" -ForegroundColor White
    Write-Host "  Name: $($verifyOtpResponse.data.user.fullName)" -ForegroundColor White
    Write-Host "  Mobile: $($verifyOtpResponse.data.user.mobileNumber)" -ForegroundColor White
    Write-Host "  Email: $($verifyOtpResponse.data.user.email)" -ForegroundColor White
    Write-Host "  Role: $($verifyOtpResponse.data.user.role)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}


