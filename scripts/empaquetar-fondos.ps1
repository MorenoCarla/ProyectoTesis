# Crea fondos-para-servidor.zip en la raiz del proyecto (subir con Git o un solo scp)
$proyecto = Split-Path (Split-Path $MyInvocation.MyCommand.Path -Parent) -Parent
$img = Join-Path $proyecto "img"
$zip = Join-Path $proyecto "fondos-para-servidor.zip"

if (Test-Path $zip) { Remove-Item $zip -Force }

$archivos = Get-ChildItem $img -File | Where-Object {
  $n = $_.Name.ToLower()
  $n -like "fondo*" -or $n -like "fondogris*"
}

if (-not $archivos.Count) {
  Write-Host "No hay PNG de fondo en img/"
  exit 1
}

Compress-Archive -Path $archivos.FullName -DestinationPath $zip -Force
$mb = [math]::Round((Get-Item $zip).Length / 1MB, 2)
Write-Host "Listo: $zip ($mb MB, $($archivos.Count) archivos)"
