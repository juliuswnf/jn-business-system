@echo off
title JN Business System - System Stopper
color 0C

echo.
echo ===============================================
echo   JN BUSINESS SYSTEM - SYSTEM STOPPER
echo ===============================================
echo.

echo [1/3] Stopping Frontend (Port 3000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
    echo       Killed process %%a
)
echo       Frontend stopped.

echo.
echo [2/3] Stopping Backend (Port 5000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
    echo       Killed process %%a
)
echo       Backend stopped.

echo.
echo [3/3] Stopping Redis Docker container...
docker stop jn-business-system-redis 2>nul
echo       Redis stopped.

echo.
echo ===============================================
echo   ALL SERVICES STOPPED!
echo ===============================================
echo.
pause
