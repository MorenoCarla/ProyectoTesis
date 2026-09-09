@echo off
echo Instalando archivos offline para el CRM...
powershell -ExecutionPolicy Bypass -File "%~dp0instalar-vendor-offline.ps1"
pause
