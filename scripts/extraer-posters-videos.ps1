# Genera JPG de portada (-poster.jpg) desde cada MP4 listado abajo.
# Requiere ffmpeg en PATH: https://www.gyan.dev/ffmpeg/builds/ (zip, agregar bin a PATH)
#
# Uso (PowerShell):
#   cd C:\Users\Estudiante\Desktop\ProyectoTesis
#   .\scripts\extraer-posters-videos.ps1

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$img = Join-Path $root "img"
$proy = Join-Path $img "proyectos"

$videos = @(
  (Join-Path $img "productos.mp4"),
  (Join-Path $img "ubicConcep.mp4"),
  (Join-Path $img "ubicAlberdi.mp4"),
  (Join-Path $proy "hammer.mp4"),
  (Join-Path $proy "yohanaabregu.mp4"),
  (Join-Path $proy "zurich.mp4"),
  (Join-Path $proy "perezcurbelo.mp4")
)

$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ffmpeg) {
  Write-Host "No se encontro ffmpeg. Instalalo o crea los JPG a mano con HandBrake (ver INSTRUCCIONES-POSTERS-VIDEOS.txt)."
  exit 1
}

foreach ($v in $videos) {
  if (-not (Test-Path $v)) {
    Write-Host "Omitido (no existe): $v"
    continue
  }
  $poster = $v -replace '\.(mp4|mov|MP4)$', '-poster.jpg'
  Write-Host "Creando $poster"
  & ffmpeg -y -ss 00:00:01 -i $v -frames:v 1 -q:v 4 $poster 2>$null
  if (Test-Path $poster) { Write-Host "  OK" } else { Write-Host "  Error" }
}

Write-Host "`nListo. Subi los *-poster.jpg con WinSCP (misma carpeta que cada mp4)."
