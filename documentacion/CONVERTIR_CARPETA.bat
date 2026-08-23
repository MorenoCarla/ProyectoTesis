@echo off
chcp 65001 >nul
echo.
echo  Convirtiendo CARPETA TFI para que Word muestre bien el espanol...
echo  (Cierra Word antes de continuar)
echo.
python "%~dp0convertir_carpeta_entrega.py"
if errorlevel 1 goto error
echo.
echo  LISTO. Abri este archivo con doble clic:
echo  CARPETA_TFI_ITUARTE_ENTREGA.doc
echo.
pause
exit /b 0
:error
echo.
echo  Error. Cerra Word completamente e intenta de nuevo.
pause
exit /b 1
