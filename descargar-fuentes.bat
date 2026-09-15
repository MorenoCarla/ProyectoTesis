@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0descargar-fuentes.ps1"
