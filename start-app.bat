@echo off
title JN Business System - System Starter
color 0A

echo.
echo ===============================================
echo   JN BUSINESS SYSTEM - SYSTEM STARTER
echo ===============================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    pause
    exit /b 1
)

echo [1/4] Starting MongoDB...
:: Check if MongoDB is already running on port 27017
netstat -ano | findstr ":27017" | findstr "LISTENING" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo       MongoDB is already running on port 27017
) else (
    echo       MongoDB not detected - please start it manually or via Docker
)

echo.
echo [2/4] Starting Redis...
:: Check if Redis is already running on port 6379
netstat -ano | findstr ":6379" | findstr "LISTENING" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo       Redis is already running on port 6379
) else (
    echo       Redis not detected - starting Docker container...
    docker start jn-business-system-redis 2>nul || docker run -d --name jn-business-system-redis -p 6379:6379 redis:alpine 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo       Redis started successfully
    ) else (
        echo       Redis not available - continuing without cache
    )
)

echo.
echo [3/4] Starting Backend Server...
:: Check if backend is already running
netstat -ano | findstr ":5000" | findstr "LISTENING" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo       Backend is already running on port 5000
) else (
    echo       Starting Backend on port 5000...
    start "JN Backend" cmd /k "cd /d "%~dp0backend" && node server.js"
    timeout /t 3 /nobreak >nul
    echo       Backend started!
)

echo.
echo [4/4] Starting Frontend Server...
:: Check if frontend is already running
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo       Frontend is already running on port 3000
) else (
    echo       Starting Frontend on port 3000...
    start "JN Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
    timeout /t 3 /nobreak >nul
    echo       Frontend started!
)

echo.
echo ===============================================
echo   ALL SERVICES STARTED!
echo ===============================================
echo.
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo   API:      http://localhost:5000/api
echo.
echo   CEO Login: http://localhost:3000/ceo-login
echo.
echo ===============================================
echo.
echo Press any key to open the app in browser...
pause >nul

start http://localhost:3000

exit
