@echo off
cd /d "%~dp0"
echo Actualizando TODAS las fichas de producto...
node backend\scripts\parchear-fichas-swiper-todas.js
echo.
echo Listo. Reinicia el backend (npm start) y recarga con Ctrl+Shift+R.
pause
