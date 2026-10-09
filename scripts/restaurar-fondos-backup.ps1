# Restaura PNG/JPG de fondo desde img/.backup-paso4/ (calidad original)
$img = Join-Path (Split-Path (Split-Path $MyInvocation.MyCommand.Path -Parent) -Parent) "img"
$backup = Join-Path $img ".backup-paso4"
if (-not (Test-Path $backup)) {
  Write-Host "No hay backup en: $backup"
  exit 1
}
$count = 0
Get-ChildItem $backup -Recurse -File | ForEach-Object {
  $rel = $_.FullName.Substring($backup.Length).TrimStart("\")
  $name = Split-Path $rel -Leaf
  if ($name -match '^fondo|^Fondo|fondogris|fondointerior|fondoexterior') {
    $dest = Join-Path $img $rel
    New-Item -ItemType Directory -Force -Path (Split-Path $dest -Parent) | Out-Null
    Copy-Item $_.FullName $dest -Force
    Write-Host "OK $rel"
    $count++
  }
}
Write-Host "Restaurados: $count archivos de fondo."
