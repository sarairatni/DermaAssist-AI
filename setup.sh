#!/bin/bash

# DermAssist AI - Setup Script
# Ce script configure l'environnement complet

set -e

echo "🚀 DermAssist AI - Setup"
echo "======================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.10+"
    exit 1
fi
echo "✅ Python $(python3 --version)"

# Setup Backend
echo ""
echo "📦 Setting up Backend..."
cd backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

source venv/bin/activate || source venv/Scripts/activate

pip install -r requirements.txt
echo "✅ Backend dependencies installed"

# Setup Frontend Doctor
echo ""
echo "💻 Setting up Doctor Web App..."
cd ../doctor-web
npm install
echo "✅ Doctor Web dependencies installed"

# Setup Frontend Patient
echo ""
echo "📱 Setting up Patient Mobile App..."
cd ../patient-mobile
npm install
echo "✅ Patient Mobile dependencies installed"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure .env files:"
echo "   - backend/.env"
echo "2. Start services:"
echo "   - PostgreSQL, Redis, MinIO (or Docker)"
echo "3. Run projects:"
echo "   - cd backend && python main.py"
echo "   - cd doctor-web && npm run dev"
echo "   - cd patient-mobile && npm start"
