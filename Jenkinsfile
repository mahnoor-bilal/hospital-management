pipeline {
    agent any

    environment {
        COMPOSE_FILE = 'docker-compose-build.yml'
    }

    stages {

        stage('Clone Repository') {
            steps {
                echo 'Fetching code from GitHub...'
                checkout scm
            }
        }

        stage('Build') {
            steps {
                echo 'Building the application using Docker Compose...'
                sh 'docker-compose -f ${COMPOSE_FILE} build'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Starting containers...'
                sh 'docker-compose -f ${COMPOSE_FILE} up -d'
            }
        }

        stage('Verify') {
            steps {
                echo 'Verifying containers are running...'
                sh 'docker ps'
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Cleaning up...'
            sh 'docker-compose -f ${COMPOSE_FILE} down'
        }
    }
}