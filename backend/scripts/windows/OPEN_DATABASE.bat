@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo Starting Prisma Studio (Database GUI)...
echo It will open automatically in your browser at http://localhost:5555
echo.

cd /d "%~dp0backend"
npx prisma studio

pause
