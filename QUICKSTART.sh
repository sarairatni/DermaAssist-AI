#!/bin/bash
# Quick Start Guide - DermAssist AI

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}  DermAssist AI - Quick Start${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}\n"

# Check prerequisites
echo -e "${YELLOW}1️⃣  Checking prerequisites...${NC}"

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "  ❌ $1 not found"
        return 1
    else
        echo -e "  ${GREEN}✓${NC} $1 installed"
        return 0
    fi
}

check_command "python3" || exit 1
check_command "node" || exit 1
check_command "npm" || exit 1

echo ""

# Backend Setup
echo -e "${YELLOW}2️⃣  Setting up Backend...${NC}"

cd backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "  ${GREEN}✓${NC} Virtual environment created"
fi

source venv/bin/activate || source venv/Scripts/activate

pip install -q -r requirements.txt
echo -e "  ${GREEN}✓${NC} Dependencies installed"

# Check if .env exists
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "  ${YELLOW}!${NC} Created .env - edit with your API keys"
fi

cd ..
echo ""

# Doctor Web Setup
echo -e "${YELLOW}3️⃣  Setting up Doctor Web App...${NC}"

cd doctor-web
npm install -q
echo -e "  ${GREEN}✓${NC} Dependencies installed"
cd ..
echo ""

# Patient Mobile Setup
echo -e "${YELLOW}4️⃣  Setting up Patient Mobile App...${NC}"

cd patient-mobile
npm install -q
echo -e "  ${GREEN}✓${NC} Dependencies installed"
cd ..
echo ""

# PostgreSQL Check
echo -e "${YELLOW}5️⃣  Database Setup...${NC}"
echo -e "  ${YELLOW}!${NC} Make sure PostgreSQL is running"
echo -e "  ${YELLOW}!${NC} Create database: createdb dermassist_db"
echo ""

# Redis Check
echo -e "${YELLOW}6️⃣  Cache Setup...${NC}"
echo -e "  ${YELLOW}!${NC} Make sure Redis is running on localhost:6379"
echo ""

# MinIO Setup
echo -e "${YELLOW}7️⃣  Object Storage Setup...${NC}"
echo -e "  ${YELLOW}!${NC} Option 1 (Docker):"
echo "    docker run -d -p 9000:9000 -p 9001:9001 minio/minio:latest \\"
echo "      minio server /data --console-address ':9001'"
echo -e "  ${YELLOW}!${NC} Option 2 (Local): Download from https://min.io"
echo ""

# Show commands
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Ready to Launch!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}\n"

echo -e "${BLUE}Terminal 1 - Backend:${NC}"
echo "  cd backend && source venv/bin/activate && python main.py"
echo "  → http://localhost:8000/docs\n"

echo -e "${BLUE}Terminal 2 - Doctor Web:${NC}"
echo "  cd doctor-web && npm run dev"
echo "  → http://localhost:5173\n"

echo -e "${BLUE}Terminal 3 - Patient Mobile:${NC}"
echo "  cd patient-mobile && npm start"
echo "  → Scan QR with Expo Go\n"

echo -e "${GREEN}✓ Setup complete!${NC}\n"

# Optional: Start services
read -p "Would you like to start services now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting services..."
    
    # Backend
    (cd backend && source venv/bin/activate && python main.py) &
    echo "Backend started (PID: $!)"
    
    # Wait a bit
    sleep 3
    
    # Doctor Web
    (cd doctor-web && npm run dev) &
    echo "Doctor Web started (PID: $!)"
    
    # Patient Mobile
    (cd patient-mobile && npm start) &
    echo "Patient Mobile started (PID: $!)"
    
    echo -e "\n${GREEN}All services running!${NC}"
    echo "Press Ctrl+C to stop all services"
fi
