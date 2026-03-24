@echo off
REM DermAssist AI - Setup Script for Windows

echo.
echo 🚀 DermAssist AI - Setup
echo =======================
echo.

REM Check Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js 18+
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION%

REM Check Python
where python >nul 2>nul
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.10+
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo ✅ %PYTHON_VERSION%

REM Setup Backend
echo.
echo 📦 Setting up Backend...
cd backend

if not exist "venv" (
    python -m venv venv
    echo ✅ Virtual environment created
)

call venv\Scripts\activate.bat
pip install -r requirements.txt
echo ✅ Backend dependencies installed

REM Setup Frontend Doctor
echo.
echo 💻 Setting up Doctor Web App...
cd ..\doctor-web
call npm install
echo ✅ Doctor Web dependencies installed

REM Setup Frontend Patient
echo.
echo 📱 Setting up Patient Mobile App...
cd ..\patient-mobile
call npm install
echo ✅ Patient Mobile dependencies installed

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Configure .env files:
echo    - backend\.env
echo 2. Start services:
echo    - PostgreSQL, Redis, MinIO (or Docker)
echo 3. Run projects:
echo    - cd backend ^&^& python main.py
echo    - cd doctor-web ^&^& npm run dev
echo    - cd patient-mobile ^&^& npm start
