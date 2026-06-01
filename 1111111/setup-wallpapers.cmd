@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Browser OS wallpapers

set "NODE_EXE="
if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE_EXE if exist "%LOCALAPPDATA%\Programs\node\node.exe" set "NODE_EXE=%LOCALAPPDATA%\Programs\node\node.exe"
if not defined NODE_EXE (
  where node >nul 2>&1 && set "NODE_EXE=node"
)

if not defined NODE_EXE (
  echo.
  echo [ERROR] Node.js not found. Install from https://nodejs.org/
  echo.
  pause
  exit /b 1
)

set "PATH=%ProgramFiles%\nodejs;%LOCALAPPDATA%\Programs\node;%PATH%"

echo Node: %NODE_EXE%
echo.

"%NODE_EXE%" "scripts\fetch-kali-wallpapers.mjs"
echo.
if errorlevel 1 (
  echo Failed. See messages above.
) else (
  echo Done. Refresh http://localhost:5173/ and pick wallpaper in Settings.
)
echo.
pause
endlocal
