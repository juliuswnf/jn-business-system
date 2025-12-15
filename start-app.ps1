# JN Business System - System Starter
# Run with: powershell -ExecutionPolicy Bypass -File start-app.ps1

$Host.UI.RawUI.WindowTitle = "JN Business System - System Starter"

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   JN BUSINESS SYSTEM - SYSTEM STARTER" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    $result = netstat -ano | findstr ":$Port" | findstr "LISTENING"
    return $null -ne $result -and $result.Length -gt 0
}

# Function to wait for port to be ready
function Wait-ForPort {
    param([int]$Port, [int]$TimeoutSeconds = 30)
    $elapsed = 0
    while (-not (Test-Port -Port $Port) -and $elapsed -lt $TimeoutSeconds) {
        Start-Sleep -Seconds 1
        $elapsed++
        Write-Host "." -NoNewline
    }
    Write-Host ""
    return Test-Port -Port $Port
}

# 1. Check MongoDB
Write-Host "[1/4] Checking MongoDB (Port 27017)..." -ForegroundColor Yellow
if (Test-Port -Port 27017) {
    Write-Host "      MongoDB is running" -ForegroundColor Green
} else {
    Write-Host "      MongoDB not detected - trying Docker..." -ForegroundColor Yellow
    try {
        docker start jn-business-system-mongodb 2>$null
        if ($LASTEXITCODE -ne 0) {
            docker run -d --name jn-business-system-mongodb -p 27017:27017 mongo:latest 2>$null
        }
        Start-Sleep -Seconds 2
        if (Test-Port -Port 27017) {
            Write-Host "      MongoDB started via Docker" -ForegroundColor Green
        } else {
            Write-Host "      MongoDB not available - please start manually" -ForegroundColor Red
        }
    } catch {
        Write-Host "      Docker not available - please start MongoDB manually" -ForegroundColor Red
    }
}

# 2. Check Redis
Write-Host ""
Write-Host "[2/4] Checking Redis (Port 6379)..." -ForegroundColor Yellow
if (Test-Port -Port 6379) {
    Write-Host "      Redis is running" -ForegroundColor Green
} else {
    Write-Host "      Redis not detected - trying Docker..." -ForegroundColor Yellow
    try {
        docker start jn-business-system-redis 2>$null
        if ($LASTEXITCODE -ne 0) {
            docker run -d --name jn-business-system-redis -p 6379:6379 redis:alpine 2>$null
        }
        Start-Sleep -Seconds 2
        if (Test-Port -Port 6379) {
            Write-Host "      Redis started via Docker" -ForegroundColor Green
        } else {
            Write-Host "      Redis not available - continuing without cache" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "      Docker not available - continuing without Redis" -ForegroundColor Yellow
    }
}

# 3. Start Backend
Write-Host ""
Write-Host "[3/4] Starting Backend (Port 5000)..." -ForegroundColor Yellow
if (Test-Port -Port 5000) {
    Write-Host "      Backend is already running" -ForegroundColor Green
} else {
    $backendPath = Join-Path $scriptDir "backend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Starting JN Backend...' -ForegroundColor Cyan; node server.js" -WindowStyle Normal
    Write-Host "      Waiting for Backend to start" -NoNewline
    if (Wait-ForPort -Port 5000 -TimeoutSeconds 15) {
        Write-Host "      Backend started successfully!" -ForegroundColor Green
    } else {
        Write-Host "      Backend may still be starting..." -ForegroundColor Yellow
    }
}

# 4. Start Frontend
Write-Host ""
Write-Host "[4/4] Starting Frontend (Port 3000)..." -ForegroundColor Yellow
if (Test-Port -Port 3000) {
    Write-Host "      Frontend is already running" -ForegroundColor Green
} else {
    $frontendPath = Join-Path $scriptDir "frontend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Starting JN Frontend...' -ForegroundColor Cyan; npm run dev" -WindowStyle Normal
    Write-Host "      Waiting for Frontend to start" -NoNewline
    if (Wait-ForPort -Port 3000 -TimeoutSeconds 20) {
        Write-Host "      Frontend started successfully!" -ForegroundColor Green
    } else {
        Write-Host "      Frontend may still be starting..." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "   ALL SERVICES STARTED!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "   Frontend: " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend:  " -NoNewline; Write-Host "http://localhost:5000" -ForegroundColor Cyan
Write-Host "   API:      " -NoNewline; Write-Host "http://localhost:5000/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "   CEO Login: " -NoNewline; Write-Host "http://localhost:3000/ceo-login" -ForegroundColor Magenta
Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""

$openBrowser = Read-Host "Open app in browser? (Y/n)"
if ($openBrowser -ne "n" -and $openBrowser -ne "N") {
    Start-Process "http://localhost:3000"
}
