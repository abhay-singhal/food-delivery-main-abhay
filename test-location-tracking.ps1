# Script to simulate delivery boy location movement for testing
# Usage: .\test-location-tracking.ps1 -OrderId <orderId> -Token <deliveryBoyToken> -Duration <seconds>

param(
    [Parameter(Mandatory=$true)]
    [string]$OrderId,
    
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$false)]
    [int]$Duration = 300,  # 5 minutes default
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:8080/api/v1"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Delivery Boy Location Simulator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Order ID: $OrderId" -ForegroundColor Yellow
Write-Host "Duration: $Duration seconds" -ForegroundColor Yellow
Write-Host "Update interval: 5 seconds" -ForegroundColor Yellow
Write-Host ""

# Starting location (example: restaurant location)
$startLat = 28.7041
$startLng = 77.1025

# Destination location (example: customer delivery address)
# Adjust these coordinates based on your test scenario
$endLat = 28.7100
$endLng = 77.1100

$updates = [math]::Floor($Duration / 5)
$latStep = ($endLat - $startLat) / $updates
$lngStep = ($endLng - $startLng) / $updates

$currentLat = $startLat
$currentLng = $startLng

$updateCount = 0

Write-Host "Starting location simulation..." -ForegroundColor Green
Write-Host "Starting from: ($startLat, $startLng)" -ForegroundColor Gray
Write-Host "Moving towards: ($endLat, $endLng)" -ForegroundColor Gray
Write-Host ""

for ($i = 0; $i -le $updates; $i++) {
    $updateCount++
    
    # Update location
    $currentLat = $startLat + ($latStep * $i)
    $currentLng = $startLng + ($lngStep * $i)
    
    $body = @{
        latitude = [math]::Round($currentLat, 6)
        longitude = [math]::Round($currentLng, 6)
        address = "Moving to delivery location... Update $updateCount"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/delivery/orders/$OrderId/update-location" `
            -Method POST `
            -Headers @{
                "Authorization" = "Bearer $Token"
                "Content-Type" = "application/json"
            } `
            -Body $body
        
        Write-Host "[$updateCount] Location updated: ($([math]::Round($currentLat, 6)), $([math]::Round($currentLng, 6))) - $($response.message)" -ForegroundColor Green
    }
    catch {
        Write-Host "[$updateCount] ERROR: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response: $responseBody" -ForegroundColor Red
        }
    }
    
    if ($i -lt $updates) {
        Start-Sleep -Seconds 5
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Simulation Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total updates sent: $updateCount" -ForegroundColor Yellow
Write-Host "Final location: ($([math]::Round($currentLat, 6)), $([math]::Round($currentLng, 6)))" -ForegroundColor Yellow
Write-Host ""
Write-Host "Check the customer app to see the location updates!" -ForegroundColor Green




