# JN Business System - Production Health Check Script (PowerShell)
# Run after Railway/Vercel deployment

Write-Host "JN BUSINESS SYSTEM - PRODUCTION HEALTH CHECK" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Variables (UPDATE THESE)
$RAILWAY_DOMAIN = "jn-automation-production.up.railway.app"
$VERCEL_DOMAIN = "jn-automation.vercel.app"

Write-Host "Testing Backend: https://$RAILWAY_DOMAIN"
Write-Host "Testing Frontend: https://$VERCEL_DOMAIN"
Write-Host ""

# Test 1: Backend Health Check
Write-Host "1. Testing Backend Health..." -ForegroundColor White
try {
    $healthResponse = Invoke-WebRequest -Uri "https://$RAILWAY_DOMAIN/api/system/health" -UseBasicParsing -TimeoutSec 10
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "   [OK] Backend Health: 200" -ForegroundColor Green
        $healthData = $healthResponse.Content | ConvertFrom-Json
    } else {
        Write-Host "   [FAIL] Backend Health: $($healthResponse.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "   [FAIL] Backend Health: Connection Error" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Database Connection
Write-Host "2. Testing Database Connection..." -ForegroundColor White
if ($healthData.checks.database.status -eq "healthy") {
    Write-Host "   [OK] Database: Connected ($($healthData.checks.database.details.responseTime))" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] Database: $($healthData.checks.database.status)" -ForegroundColor Red
}

# Test 3: Stripe Integration
Write-Host "3. Testing Stripe Integration..." -ForegroundColor White
if ($healthData.checks.stripe.status -eq "healthy") {
    Write-Host "   [OK] Stripe: Configured ($($healthData.checks.stripe.details.mode) mode)" -ForegroundColor Green
} else {
    Write-Host "   [WARN] Stripe: $($healthData.checks.stripe.status)" -ForegroundColor Yellow
}

# Test 4: Email Queue
Write-Host "4. Testing Email Queue..." -ForegroundColor White
if ($healthData.checks.emailQueue.status -eq "healthy") {
    Write-Host "   [OK] Email Queue: Running ($($healthData.checks.emailQueue.details.pending) pending)" -ForegroundColor Green
} else {
    Write-Host "   [WARN] Email Queue: $($healthData.checks.emailQueue.status)" -ForegroundColor Yellow
}

# Test 5: Frontend Accessibility
Write-Host "5. Testing Frontend..." -ForegroundColor White
try {
    $frontendResponse = Invoke-WebRequest -Uri "https://$VERCEL_DOMAIN" -UseBasicParsing -TimeoutSec 10
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "   [OK] Frontend: Accessible (200)" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] Frontend: $($frontendResponse.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "   [FAIL] Frontend: Connection Error" -ForegroundColor Red
}

# Test 6: API Version Endpoint
Write-Host "6. Testing API Endpoints..." -ForegroundColor White
try {
    $versionResponse = Invoke-RestMethod -Uri "https://$RAILWAY_DOMAIN/api/system/version" -Method Get -TimeoutSec 10
    Write-Host "   [OK] API Version: $($versionResponse.version)" -ForegroundColor Green
    Write-Host "   [INFO] Environment: $($versionResponse.environment)" -ForegroundColor Cyan
} catch {
    Write-Host "   [WARN] API Endpoint: Failed (check CORS settings)" -ForegroundColor Yellow
}

# Test 7: Memory Usage
Write-Host "7. Checking Memory Usage..." -ForegroundColor White
if ($healthData.checks.memory) {
    $memString = $healthData.checks.memory.details.heapUsagePercent
    $memPercent = $memString -replace '%', ''
    if ([double]$memPercent -lt 70) {
        Write-Host "   [OK] Memory: $memString (Healthy)" -ForegroundColor Green
    } elseif ([double]$memPercent -lt 90) {
        Write-Host "   [WARN] Memory: $memString (Warning)" -ForegroundColor Yellow
    } else {
        Write-Host "   [CRITICAL] Memory: $memString (Critical)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend URL:    https://$RAILWAY_DOMAIN" -ForegroundColor White
Write-Host "Frontend URL:   https://$VERCEL_DOMAIN" -ForegroundColor White
Write-Host "Health Check:   https://$RAILWAY_DOMAIN/api/system/health" -ForegroundColor White
Write-Host "API Base:       https://$RAILWAY_DOMAIN/api" -ForegroundColor White
Write-Host ""
Write-Host "Environment:    $($healthData.environment)" -ForegroundColor Cyan
Write-Host "Version:        $($healthData.version)" -ForegroundColor Cyan
Write-Host "Uptime:         $([math]::Round($healthData.uptime / 60, 1)) minutes" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open https://$VERCEL_DOMAIN in browser" -ForegroundColor White
Write-Host "2. Check browser console (F12) for errors" -ForegroundColor White
Write-Host "3. Test registration flow" -ForegroundColor White
Write-Host "4. Run full checklist: See PRODUCTION_CHECKLIST.md" -ForegroundColor White
Write-Host ""
