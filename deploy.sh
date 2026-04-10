#!/bin/bash
# ================================================
# MediCore HMS — EC2 Deployment Script
# Run this script on your AWS EC2 instance
# ================================================

set -e  # Exit on any error

DOCKERHUB_USERNAME=${1:-"yourdockerhubusername"}
APP_DIR="/home/ec2-user/hospital-management"

echo "========================================"
echo "  MediCore HMS — EC2 Deployment"
echo "========================================"

# ── Step 1: Update system & install Docker ──
echo "[1/6] Installing Docker..."
sudo yum update -y
sudo yum install -y docker git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# ── Step 2: Install Docker Compose ──
echo "[2/6] Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version

# ── Step 3: Pull the latest Docker image ──
echo "[3/6] Pulling Docker image from Docker Hub..."
docker pull ${DOCKERHUB_USERNAME}/hospital-management:latest

# ── Step 4: Set up project directory ──
echo "[4/6] Setting up project directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# ── Step 5: Create docker-compose.yml on server ──
echo "[5/6] Writing docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3.9'

services:
  app:
    image: DOCKERHUB_USERNAME/hospital-management:latest
    container_name: hms_app
    restart: unless-stopped
    ports:
      - "80:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGODB_URI=mongodb://mongo:27017/hospital_management
      - JWT_SECRET=CHANGE_THIS_SECRET
      - JWT_EXPIRE=7d
    depends_on:
      mongo:
        condition: service_healthy
    networks:
      - hms_network

  mongo:
    image: mongo:7.0
    container_name: hms_mongo
    restart: unless-stopped
    volumes:
      - mongo_data:/data/db
      - mongo_config:/data/configdb
    networks:
      - hms_network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 15s
      timeout: 10s
      retries: 5
      start_period: 30s

volumes:
  mongo_data:
    driver: local
    name: hms_mongo_data
  mongo_config:
    driver: local
    name: hms_mongo_config

networks:
  hms_network:
    driver: bridge
EOF

# Replace placeholder with actual username
sed -i "s/DOCKERHUB_USERNAME/${DOCKERHUB_USERNAME}/g" docker-compose.yml

# ── Step 6: Start containers ──
echo "[6/6] Starting containers..."
docker-compose pull
docker-compose up -d

echo ""
echo "========================================"
echo "  Deployment complete!"
echo "  App running at: http://$(curl -s ifconfig.me)"
echo "========================================"
docker-compose ps
