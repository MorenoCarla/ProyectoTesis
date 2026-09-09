# Ejecutá esto UNA VEZ con internet (clic derecho -> Ejecutar con PowerShell)
# Descarga Chart.js y Font Awesome dentro del proyecto para que el CRM funcione SIN WiFi.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$vendor = Join-Path $root "vendor"

New-Item -ItemType Directory -Force -Path (Join-Path $vendor "fontawesome\css") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $vendor "fontawesome\webfonts") | Out-Null

Write-Host "Descargando Chart.js..." -ForegroundColor Cyan
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js" -OutFile (Join-Path $vendor "chart.umd.min.js")

Write-Host "Descargando Font Awesome..." -ForegroundColor Cyan
Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" -OutFile (Join-Path $vendor "fontawesome\css\all.min.css")

$fonts = @("fa-solid-900.woff2", "fa-regular-400.woff2", "fa-brands-400.woff2", "fa-v4compatibility.woff2")
foreach ($f in $fonts) {
  Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/webfonts/$f" -OutFile (Join-Path $vendor "fontawesome\webfonts\$f")
}

Write-Host ""
Write-Host "Listo. Archivos en: $vendor" -ForegroundColor Green
Write-Host "Proba el CRM con WiFi APAGADO (modo avion) antes de la defensa." -ForegroundColor Yellow
Read-Host "Enter para cerrar"
