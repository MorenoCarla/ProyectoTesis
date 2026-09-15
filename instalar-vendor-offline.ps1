# Ejecutá esto UNA VEZ con internet (clic derecho -> Ejecutar con PowerShell)
# Descarga Chart.js, Font Awesome y Swiper dentro del proyecto para uso SIN WiFi.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$vendor = Join-Path $root "vendor"

New-Item -ItemType Directory -Force -Path (Join-Path $vendor "fontawesome\css") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $vendor "fontawesome\webfonts") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $vendor "swiper") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $vendor "fonts") | Out-Null

Write-Host "Descargando Chart.js..." -ForegroundColor Cyan
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js" -OutFile (Join-Path $vendor "chart.umd.min.js")

Write-Host "Descargando Font Awesome..." -ForegroundColor Cyan
Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" -OutFile (Join-Path $vendor "fontawesome\css\all.min.css")

$fonts = @("fa-solid-900.woff2", "fa-regular-400.woff2", "fa-brands-400.woff2", "fa-v4compatibility.woff2")
foreach ($f in $fonts) {
  Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/webfonts/$f" -OutFile (Join-Path $vendor "fontawesome\webfonts\$f")
}

Write-Host "Descargando Swiper (carruseles del sitio)..." -ForegroundColor Cyan
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" -OutFile (Join-Path $vendor "swiper\swiper-bundle.min.css")
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js" -OutFile (Join-Path $vendor "swiper\swiper-bundle.min.js")

Write-Host "Descargando Work Sans (tipografia)..." -ForegroundColor Cyan
$wsBase = "https://fonts.gstatic.com/s/worksans/v19"
$wsFonts = @{
  "work-sans-400.woff2" = "$wsBase/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K0nXBi8Jpg.woff2"
  "work-sans-500.woff2" = "$wsBase/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K0vEBi8Jpg.woff2"
  "work-sans-600.woff2" = "$wsBase/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K0wnXBi8Jpg.woff2"
  "work-sans-700.woff2" = "$wsBase/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K0uNXBi8Jpg.woff2"
}
foreach ($entry in $wsFonts.GetEnumerator()) {
  Invoke-WebRequest -Uri $entry.Value -OutFile (Join-Path $vendor "fonts\$($entry.Key)")
}

Write-Host "Actualizando HTML a rutas locales..." -ForegroundColor Cyan
Push-Location $root
node scripts/migrate-swiper-offline.js
node scripts/migrate-public-offline.js
Pop-Location

Write-Host ""
Write-Host "Listo. Archivos en: $vendor" -ForegroundColor Green
Write-Host "Proba index.html y una pagina de producto con WiFi APAGADO (modo avion)." -ForegroundColor Yellow
Read-Host "Enter para cerrar"
