# Browser OS — запуск без npm в PATH
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$node = $null
$candidates = @(
  'C:\Program Files\nodejs\node.exe',
  "$env:LOCALAPPDATA\Programs\node\node.exe"
)
foreach ($c in $candidates) {
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

if (-not (Test-Path 'node_modules\vite\bin\vite.js')) {
  Write-Host 'npm install...'
  & npm install
}

if (-not (Test-Path 'public\v86\v86.wasm')) {
  Write-Host 'setup:v86...'
  & npm run setup:v86
}

Write-Host 'http://localhost:5173/' -ForegroundColor Green
& $node 'node_modules\vite\bin\vite.js'
