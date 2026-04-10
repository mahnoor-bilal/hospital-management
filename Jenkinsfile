pipeline {
    agent any

    // ─────────────────────────────────────────────────────
    // Pipeline-wide environment variables
    // DOCKER_HUB_CREDENTIALS → Jenkins credential ID (user+pass)
    // EC2_SSH_CREDENTIALS    → Jenkins credential ID (SSH private key)
    // ─────────────────────────────────────────────────────
    environment {
        DOCKER_IMAGE     = "mahnoorbilal/hospital-management"
        DOCKER_TAG       = "${BUILD_NUMBER}"          // e.g. 42
        DOCKER_LATEST    = "${DOCKER_IMAGE}:latest"
        DOCKER_VERSIONED = "${DOCKER_IMAGE}:${BUILD_NUMBER}"

        EC2_HOST         = "ec2-user@16.170.158.199"   // ← change this
        EC2_APP_DIR      = "/home/ec2-user/hospital-management"

        COMPOSE_FILE     = "docker-compose.yml"
    }

    // Discard old builds — keep last 5
    options {
        buildDiscarder(logRotator(numToKeepStr: '5'))
        timeout(time: 20, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {

        // ── Stage 1: Checkout ─────────────────────────────
        stage('Checkout') {
            steps {
                echo '📥 Checking out source code...'
                checkout scm
            }
        }

        // ── Stage 2: Install Dependencies ─────────────────
        stage('Install Dependencies') {
            steps {
                echo '📦 Installing Node.js dependencies...'
                sh 'node --version'
                sh 'npm --version'
                sh 'npm ci --only=production'
            }
        }

        // ── Stage 3: Build Docker Image ───────────────────
        stage('Build Docker Image') {
            steps {
                echo "🐳 Building Docker image: ${DOCKER_VERSIONED}"
                sh """
                    docker build \
                        -t ${DOCKER_VERSIONED} \
                        -t ${DOCKER_LATEST} \
                        --target production \
                        .
                """
                echo "✅ Docker image built successfully"
                sh "docker images | grep mahnoorbilal/hospital-management"
            }
        }

        // ── Stage 4: Push to Docker Hub ───────────────────
        stage('Push to Docker Hub') {
            steps {
                echo '🚀 Pushing image to Docker Hub...'
                withCredentials([
                    usernamePassword(
                        credentialsId: 'DOCKER_HUB_CREDENTIALS',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                    sh "docker push ${DOCKER_VERSIONED}"
                    sh "docker push ${DOCKER_LATEST}"
                    sh 'docker logout'
                }
                echo "✅ Pushed ${DOCKER_VERSIONED} and ${DOCKER_LATEST}"
            }
        }

        // ── Stage 5: Deploy to EC2 ────────────────────────
        stage('Deploy to EC2') {
            steps {
                echo "🖥️  Deploying to EC2: ${EC2_HOST}"
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'EC2_SSH_CREDENTIALS',
                        keyFileVariable: 'SSH_KEY'
                    )
                ]) {
                    // Copy docker-compose.yml to EC2
                    sh """
                        scp -i ${SSH_KEY} \
                            -o StrictHostKeyChecking=no \
                            ${COMPOSE_FILE} \
                            ${EC2_HOST}:${EC2_APP_DIR}/${COMPOSE_FILE}
                    """

                    // SSH into EC2 and redeploy
                    sh """
                        ssh -i ${SSH_KEY} \
                            -o StrictHostKeyChecking=no \
                            ${EC2_HOST} << 'REMOTE'
                                set -e
                                cd ${EC2_APP_DIR}

                                echo "Pulling latest image..."
                                docker pull ${DOCKER_LATEST}

                                echo "Stopping old containers..."
                                docker-compose down --remove-orphans

                                echo "Starting updated containers..."
                                docker-compose up -d

                                echo "Cleaning up old images..."
                                docker image prune -f

                                echo "Container status:"
                                docker-compose ps
REMOTE
                    """
                }
                echo "✅ Deployment complete!"
            }
        }

        // ── Stage 6: Health Check ─────────────────────────
        stage('Health Check') {
            steps {
                echo '🏥 Running health check on deployed app...'
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'EC2_SSH_CREDENTIALS',
                        keyFileVariable: 'SSH_KEY'
                    )
                ]) {
                    sh """
                        ssh -i ${SSH_KEY} \
                            -o StrictHostKeyChecking=no \
                            ${EC2_HOST} \
                            'curl -sf http://localhost/api/health && echo "✅ Health check passed!" || echo "❌ Health check failed!"'
                    """
                }
            }
        }
    }

    // ── Post Actions ──────────────────────────────────────
    post {
        success {
            echo """
            ╔══════════════════════════════════╗
            ║   ✅ Pipeline SUCCESS             ║
            ║   Build #${BUILD_NUMBER}           
            ║   Image: ${DOCKER_VERSIONED}      
            ╚══════════════════════════════════╝
            """
        }
        failure {
            echo """
            ╔══════════════════════════════════╗
            ║   ❌ Pipeline FAILED              ║
            ║   Build #${BUILD_NUMBER}           
            ║   Check logs above for errors     ║
            ╚══════════════════════════════════╝
            """
        }
        always {
            echo '🧹 Cleaning up local Docker images...'
            sh "docker rmi ${DOCKER_VERSIONED} || true"
            sh "docker rmi ${DOCKER_LATEST} || true"
            cleanWs()
        }
    }
}