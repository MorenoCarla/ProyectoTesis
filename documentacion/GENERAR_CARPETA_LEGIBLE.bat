@echo off
chcp 65001 >nul
echo Creando carpeta TFI legible...
python "%~dp0generar_carpeta_legible.py"
if errorlevel 1 (echo Error & pause & exit /b 1)
echo.
echo LISTO. Abri con doble clic:
echo   CARPETA_TFI_ITUARTE_ENTREGA.doc
echo (NO lo abras desde Cursor)
pause
