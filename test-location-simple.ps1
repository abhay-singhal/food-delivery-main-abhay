# Simple script to update delivery boy location once
# Quick test without simulation

param(
    [Parameter(Mandatory=$true)]
    [string]$OrderId,
    
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$false)]
    [double]$Latitude = 28.7041,
    
    [Parameter(Mandatory=$false)]
    [double]$Longitude = 77.1025,
    
    [Parameter(Mandatory=$false)]
    [string]$Address = "Test Location",
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:8080/api/v1"
)

Write-Host "Updating delivery boy location..." -ForegroundColor Cyan
Write-Host "Order ID: $OrderId" -ForegroundColor Yellow
Write-Host "Location: ($Latitude, $Longitude)" -ForegroundColor Yellow
Write-Host ""

$body = @{
    latitude = $Latitude
    longitude = $Longitude
    address = $Address
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/delivery/orders/$OrderId/update-location" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $Token"
            "Content-Type" = "application/json"
        } `
        -Body $body
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Message: $($response.message)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Location updated successfully. Check customer app to see the update." -ForegroundColor Cyan
}
catch {
    Write-Host "❌ ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Verify order ID is correct" -ForegroundColor Gray
    Write-Host "2. Check token is valid and not expired" -ForegroundColor Gray
    Write-Host "3. Ensure order is assigned to this delivery boy" -ForegroundColor Gray
    Write-Host "4. Verify backend is running on $BaseUrl" -ForegroundColor Gray
}

