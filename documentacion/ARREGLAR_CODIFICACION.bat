@echo off
chcp 65001 >nul
echo Arreglando codificacion de documentos Word...
python "%~dp0_fix_doc_encoding.py"
if errorlevel 1 (
  echo.
  echo ERROR: Cierra Word completamente y volve a ejecutar este archivo.
  pause
  exit /b 1
)
echo.
echo Listo. Abri los .doc con doble clic en Word.
pause
