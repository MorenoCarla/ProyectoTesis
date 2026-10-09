$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$cdnFa = '(?m)^\s*<link rel="stylesheet" href="https://cdnjs\.cloudflare\.com/ajax/libs/font-awesome[^"]*">\r?\n'
$google = '(?m)^\s*<link href="https://fonts\.googleapis\.com/css2\?family=Work\+Sans[^"]*" rel="stylesheet">\r?\n'
$updated = 0
Get-ChildItem -Path $root -Filter '*.html' -File | ForEach-Object {
  $html = [IO.File]::ReadAllText($_.FullName)
  if ($html -notmatch 'scriptcadaproducto\.js') { return }
  $next = $html -replace $cdnFa, "`n"
  $next = $next -replace $google, "`n"
  $next = $next -replace '(?m)\s*<link rel="stylesheet" href="vendor/fontawesome/css/all\.min\.css">\r?\n\s*<link href="vendor/fonts/work-sans\.css" rel="stylesheet">\r?\n(?=\s*</head>)', "`n"
  $next = $next -replace '(?m)\s*<link rel="stylesheet" href="vendor/fontawesome/css/all\.min\.css">\r?\n(?=\s*</head>)', "`n"
  $next = $next -replace '(?m)\s*<link href="vendor/fonts/work-sans\.css" rel="stylesheet">\r?\n(?=\s*</head>)', "`n"
  $seen = $false
  $next = [regex]::Replace($next, '(?m)^\s*<link rel="stylesheet" href="vendor/fonts/work-sans\.css">\s*\r?\n|^\s*<link href="vendor/fonts/work-sans\.css" rel="stylesheet">\s*\r?\n', {
    param($m)
    if ($script:seenWs) { return '' }
    $script:seenWs = $true
    return "  <link rel=`"stylesheet`" href=`"vendor/fonts/work-sans.css`">`n"
  })
  if ($next -notmatch 'vendor/fontawesome/css/all\.min\.css') {
    $next = $next -replace '(<link rel="stylesheet" href="vendor/fonts/work-sans\.css">\n)', "`$1  <link rel=`"stylesheet`" href=`"vendor/fontawesome/css/all.min.css`">`n"
  }
  if ($next -ne $html) {
    [IO.File]::WriteAllText($_.FullName, $next)
    $updated++
  }
}
Write-Host "Paginas de producto actualizadas: $updated"
