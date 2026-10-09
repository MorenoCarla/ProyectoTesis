# Paso 4: ver las imagenes mas pesadas (MB) en img/
$root = Join-Path (Split-Path (Split-Path $MyInvocation.MyCommand.Path -Parent) -Parent) "img"
if (-not (Test-Path $root)) {
  Write-Host "No existe la carpeta: $root"
  exit 1
}
Get-ChildItem $root -Recurse -File -Include *.png,*.jpg,*.jpeg,*.webp,*.gif |
  Sort-Object Length -Descending |
  Select-Object -First 40 @{ N = "MB"; E = { [math]::Round($_.Length / 1MB, 2) } }, FullName |
  Format-Table -AutoSize
