# Sube PNG de fondo (restaurados en PC) al droplet — si Git no actualizo img/
# Uso: .\subir-fondos-droplet.ps1
# Pide contraseña SSH del servidor (root@165.22.151.229)

$ErrorActionPreference = "Stop"
$proyecto = Split-Path (Split-Path $MyInvocation.MyCommand.Path -Parent) -Parent
$img = Join-Path $proyecto "img"
$servidor = "root@165.22.151.229"
$remoto = "/var/www/ProyectoTesis/img"

$patron = @(
  "fondo*.png", "Fondo*.png", "fondogris*.png",
  "fondointeriores.png", "fondoexteriores*.png", "fondoembutidos.png",
  "fondosmart.png", "fondoalumbradopublico.png", "fondoventiladores.png", "fondocamaras.png"
)

$archivos = @()
foreach ($p in $patron) {
  $archivos += Get-ChildItem -Path $img -Filter $p -File -ErrorAction SilentlyContinue
}
$archivos = $archivos | Sort-Object FullName -Unique

if (-not $archivos.Count) {
  Write-Host "No hay archivos fondo en $img"
  exit 1
}

Write-Host "Subiendo $($archivos.Count) fondos a $servidor ..."
foreach ($f in $archivos) {
  scp $f.FullName "${servidor}:${remoto}/"
  Write-Host "  OK $($f.Name)"
}
Write-Host "Listo. Proba la web con Ctrl+F5 (mejor incognito)."
