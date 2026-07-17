@echo off
setlocal
cd /d "%~dp0..\.."
if not exist .env copy .env.example .env >nul
copy .env backend\.env >nul
copy .env frontend\.env.local >nul
echo Env synced to backend\.env and frontend\.env.local
pause
