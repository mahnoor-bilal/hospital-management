# MediCore — Hospital Management System

## Tech Stack
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (Mongoose)
- **Frontend**: HTML, CSS, Vanilla JS
- **Auth**: JWT
- **Containerization**: Docker + Docker Compose
- **Cloud**: AWS EC2

---

# PART I: Containerized Deployment Guide

## File Overview

| File | Purpose |
|---|---|
| `Dockerfile` | Builds the Node.js app image (multi-stage) |
| `docker-compose.yml` | Orchestrates app + MongoDB containers |
| `.dockerignore` | Excludes unnecessary files from image |
| `mongo-init.js` | DB initialization script (runs on first start) |
| `deploy.sh` | One-command EC2 deployment script |
| `.env.docker` | Docker-specific environment variable template |

---

## Step-by-Step: Build & Push to Docker Hub

### Prerequisites (on your local machine)
- Docker Desktop installed and running
- Docker Hub account → https://hub.docker.com

---

### Step 1 — Login to Docker Hub
```bash
docker login
# Enter your Docker Hub username and password
```

---

### Step 2 — Build the Docker Image
```bash
cd hospital-management

docker build -t yourdockerhubusername/hospital-management:latest .
```
Replace `yourdockerhubusername` with your actual Docker Hub username.

Verify it built:
```bash
docker images | grep hospital-management
```

---

### Step 3 — Test Locally with Docker Compose
```bash
# Copy env template
cp .env.docker .env

# Edit .env — set your Docker Hub username and a strong JWT_SECRET
nano .env

# Start both containers
docker-compose up -d

# Check both containers are running
docker-compose ps

# View logs
docker-compose logs -f app

# Test the app
curl http://localhost:5000/api/health
```
Open browser: http://localhost:5000

---

### Step 4 — Push Image to Docker Hub
```bash
docker push yourdockerhubusername/hospital-management:latest
```

Verify it's on Docker Hub:
→ https://hub.docker.com/r/yourdockerhubusername/hospital-management

---

## Step-by-Step: Deploy on AWS EC2

### Step 5 — Launch EC2 Instance (AWS Console)

1. Go to **AWS Console → EC2 → Launch Instance**
2. Choose:
   - AMI: **Amazon Linux 2023** (free tier)
   - Instance type: **t2.micro** (free tier)
   - Key pair: create/select one (download the `.pem` file)
3. Security Group — open these ports:
   - **22** (SSH)
   - **80** (HTTP — your app)
   - **5000** (optional direct access)
4. Click **Launch**

---

### Step 6 — Connect to EC2
```bash
# On your local machine
chmod 400 your-key.pem

ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

---

### Step 7 — Run the Deployment Script on EC2

**Option A — Using deploy.sh (automated):**
```bash
# Upload deploy.sh to EC2
scp -i your-key.pem deploy.sh ec2-user@YOUR_EC2_PUBLIC_IP:~

# SSH in and run it
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
bash deploy.sh yourdockerhubusername
```

**Option B — Manual steps on EC2:**
```bash
# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user
newgrp docker  # refresh group without logout

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create app directory
mkdir ~/hospital-management && cd ~/hospital-management

# Copy your docker-compose.yml here (or scp it)
# Edit the image name to match your Docker Hub username

# Pull & start
docker pull yourdockerhubusername/hospital-management:latest
docker-compose up -d
```

---

### Step 8 — Verify Deployment
```bash
# Check containers
docker-compose ps

# Check app logs
docker-compose logs app

# Check health endpoint
curl http://localhost/api/health

# Check from browser
# http://YOUR_EC2_PUBLIC_IP
```

---

## Persistent Volume Explained

In `docker-compose.yml`, MongoDB data is stored in a named volume:

```yaml
volumes:
  mongo_data:
    driver: local
    name: hms_mongo_data   # <-- persistent volume name
```

This means:
- Even if you `docker-compose down` and `up` again, **data survives**
- Only `docker-compose down -v` deletes the volume and data
- The volume lives at `/var/lib/docker/volumes/hms_mongo_data/` on the host

---

## Useful Docker Commands

```bash
# Start all containers
docker-compose up -d

# Stop all containers (data preserved)
docker-compose down

# Stop and DELETE volumes (data lost!)
docker-compose down -v

# View running containers
docker-compose ps

# Follow logs
docker-compose logs -f

# Restart just the app
docker-compose restart app

# Shell into app container
docker exec -it hms_app sh

# Shell into MongoDB
docker exec -it hms_mongo mongosh

# Check volumes
docker volume ls
docker volume inspect hms_mongo_data

# Update to latest image
docker-compose pull && docker-compose up -d
```

---

## Architecture Diagram

```
┌─────────────────────────────────────┐
│           AWS EC2 Instance          │
│                                     │
│  ┌──────────────────────────────┐   │
│  │       Docker Network         │   │
│  │      (hms_network)           │   │
│  │                              │   │
│  │  ┌─────────────┐             │   │
│  │  │  hms_app    │ Port 80     │   │
│  │  │  Node.js    │◄────────────┼───┼── Internet
│  │  │  Express    │             │   │
│  │  └──────┬──────┘             │   │
│  │         │ mongodb://mongo    │   │
│  │  ┌──────▼──────┐             │   │
│  │  │  hms_mongo  │             │   │
│  │  │  MongoDB    │             │   │
│  │  │  7.0        │             │   │
│  │  └──────┬──────┘             │   │
│  └─────────┼────────────────────┘   │
│            │                        │
│  ┌─────────▼────────────────────┐   │
│  │  Named Volume: hms_mongo_data│   │
│  │  /var/lib/docker/volumes/... │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```
"# trigger" 
