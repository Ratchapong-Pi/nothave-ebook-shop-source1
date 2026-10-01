@echo off
title NOT HAVE A BOOK SHOP - Local Server (Port 8080)
echo ===================================================
echo   NOT HAVE A BOOK SHOP (บักบ่ได้หนังสือ)
echo   Local Web Server is starting on http://localhost:8080/
echo ===================================================
echo.
cd /d "%~dp0"
node local_server.js
pause
