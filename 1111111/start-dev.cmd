@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Browser OS dev

set "NODE_EXE="
if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE_EXE if exist "%LOCALAPPDATA%\Programs\node\node.exe" set "NODE_EXE=%LOCALAPPDATA%\Programs\node\node.exe"
if not defined NODE_EXE (
  where node >nul 2>&1 && set "NODE_EXE=node"
)

if not defined NODE_EXE (
  echo.
  echo [ERROR] Node.js not found. Install LTS from https://nodejs.org/
  echo.
  pause
  exit /b 1
)

set "PATH=%ProgramFiles%\nodejs;%LOCALAPPDATA%\Programs\node;%PATH%"

echo Browser OS
echo Node: %NODE_EXE%
echo.

if not exist "node_modules\vite\bin\vite.js" (
  echo Running npm install...
  if exist "%ProgramFiles%\nodejs\npm.cmd" (
    call "%ProgramFiles%\nodejs\npm.cmd" install
  ) else (
    call npm install
  )
)

if not exist "public\v86\v86.wasm" (
  echo Running setup:v86...
  if exist "%ProgramFiles%\nodejs\npm.cmd" (
    call "%ProgramFiles%\nodejs\npm.cmd" run setup:v86
  ) else (
    call npm run setup:v86
  )
)

if not exist "public\wallpapers\kali-neon-16x9.svg" (
  echo Creating local Kali wallpapers...
  "%NODE_EXE%" "scripts\fetch-kali-wallpapers.mjs"
)

echo.
echo Open: http://localhost:5173/
echo Stop: Ctrl+C
echo.

"%NODE_EXE%" "node_modules\vite\bin\vite.js"
if errorlevel 1 pause
endlocal
