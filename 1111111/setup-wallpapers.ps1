# Загрузка обоев Kali — без node в PATH
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$node = $null
foreach ($c in @(
  'C:\Program Files\nodejs\node.exe',
  "$env:LOCALAPPDATA\Programs\node\node.exe"
)) {
  if (Test-Path $c) { $node = $c; break }
}
if (-not $node) {
  $node = (Get-Command node -ErrorAction SilentlyContinue)?.Source
}
if (-not $node) {
  Write-Host 'Node.js не найден. Установите LTS: https://nodejs.org/' -ForegroundColor Red
  Read-Host 'Enter'
  exit 1
}

$env:Path = "C:\Program Files\nodejs;$env:LOCALAPPDATA\Programs\node;$env:Path"

Write-Host "Node: $node" -ForegroundColor Cyan
& $node 'scripts\fetch-kali-wallpapers.mjs'
if ($LASTEXITCODE -ne 0) { Read-Host 'Enter'; exit $LASTEXITCODE }
Write-Host "`nГотово. Настройки → Рабочий стол → Kali Neon" -ForegroundColor Green
Read-Host 'Enter'
