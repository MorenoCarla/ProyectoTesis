# Descarga Work Sans + Font Awesome para uso offline (ejecutar UNA VEZ con WiFi)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$fonts = Join-Path $root "vendor\fonts"
$webfonts = Join-Path $root "vendor\fontawesome\webfonts"

New-Item -ItemType Directory -Force -Path $fonts | Out-Null
New-Item -ItemType Directory -Force -Path $webfonts | Out-Null

Write-Host "Descargando Work Sans desde Google Fonts..." -ForegroundColor Cyan
$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
$cssUrl = "https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&display=swap"
$css = (Invoke-WebRequest -Uri $cssUrl -Headers @{"User-Agent" = $ua}).Content

$pattern = '@font-face\s*\{[^}]*?font-weight:\s*(\d+)[^}]*?url\((https://fonts\.gstatic\.com/[^)]+\.woff2)\)'
$matches = [regex]::Matches($css, $pattern)
if ($matches.Count -eq 0) {
  throw "No se pudieron leer las URLs de Work Sans desde Google Fonts."
}

$seen = @{}
foreach ($m in $matches) {
  $weight = $m.Groups[1].Value
  if ($seen.ContainsKey($weight)) { continue }
  $seen[$weight] = $true
  $url = $m.Groups[2].Value
  $out = Join-Path $fonts "work-sans-$weight.woff2"
  Write-Host "  work-sans-$weight.woff2 ..."
  Invoke-WebRequest -Uri $url -OutFile $out
  $size = (Get-Item $out).Length
  if ($size -lt 1000) { throw "Descarga invalida: $out" }
  Write-Host "    OK ($size bytes)" -ForegroundColor Green
}

Write-Host "Descargando Font Awesome webfonts..." -ForegroundColor Cyan
$fa = @(
  @{ Name = "fa-solid-900.woff2"; Url = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/webfonts/fa-solid-900.woff2" },
  @{ Name = "fa-regular-400.woff2"; Url = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/webfonts/fa-regular-400.woff2" },
  @{ Name = "fa-brands-400.woff2"; Url = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/webfonts/fa-brands-400.woff2" },
  @{ Name = "fa-v4compatibility.woff2"; Url = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/webfonts/fa-v4compatibility.woff2" }
)
foreach ($item in $fa) {
  $out = Join-Path $webfonts $item.Name
  if ((Test-Path $out) -and ((Get-Item $out).Length -gt 1000)) {
    Write-Host "  $($item.Name) ya existe, omitido." -ForegroundColor DarkGray
    continue
  }
  Write-Host "  $($item.Name) ..."
  Invoke-WebRequest -Uri $item.Url -OutFile $out
  Write-Host "    OK" -ForegroundColor Green
}

Write-Host ""
Write-Host "Listo. Archivos en vendor\fonts y vendor\fontawesome\webfonts" -ForegroundColor Green
Write-Host "Proba el sitio sin WiFi (Ctrl+F5)." -ForegroundColor Yellow
Read-Host "Enter para cerrar"
