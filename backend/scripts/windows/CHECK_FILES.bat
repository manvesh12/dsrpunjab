@echo off
setlocal
cd /d "%~dp0..\.."
echo Checking required project files...
echo.

set missing=0
for %%F in (
  "package.json"
  ".env.example"
  "docker-compose.yml"
  "START_HERE.bat"
  "STOP_ALL.bat"
  "frontend\package.json"
  "frontend\app\page.tsx"
  "frontend\app\globals.css"
  "frontend\public\legacy\index.html"
  "backend\package.json"
  "backend\src\server.ts"
  "backend\src\worker.ts"
  "backend\src\routes\auth.ts"
  "backend\src\routes\projects.ts"
  "backend\src\routes\reports.ts"
  "backend\src\routes\pdf.ts"
  "backend\src\routes\users.ts"
  "backend\src\routes\files.ts"
  "backend\prisma\schema.prisma"
  "backend\prisma\seed.ts"
) do (
  if exist %%F (
    echo OK      %%F
  ) else (
    echo MISSING %%F
    set missing=1
  )
)

echo.
if "%missing%"=="0" (
  echo All required files are present.
) else (
  echo Some files are missing.
)
pause
