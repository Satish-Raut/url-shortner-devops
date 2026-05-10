pipeline {
    agent any

    environment {
        BACKEND_IMAGE  = "url-shortener-backend"
        FRONTEND_IMAGE = "url-shortener-frontend"
        IMAGE_TAG      = "${BUILD_NUMBER}"

        // Your EC2 details
        EC2_USER = "ubuntu"
        EC2_HOST = "3.17.73.31"

        // Path to .pem key (SYSTEM-only permissions set, no Administrators group)
        SSH_KEY_PATH = "C:\\ProgramData\\Jenkins\\url-shortener-key.pem"

        // Secrets pulled from Jenkins credential store (never hardcode!)
        DATABASE_URL = credentials('aiven-database-url')
        JWT_KEY      = credentials('jwt-key')
        SMTP_USER    = credentials('smtp-user')
        SMTP_PASS    = credentials('smtp-pass')
    }

    stages {

        // ─── STAGE 1: Pull Latest Code ──────────────────────────────
        stage('Checkout') {
            steps {
                echo '📥 Pulling latest code from GitHub...'
                checkout scm
            }
        }

        // ─── STAGE 2: Build Docker Images (on Laptop) ───────────────
        stage('Build Docker Images') {
            steps {
                echo '🐳 Building Docker images on local machine...'
                // Windows Jenkins uses 'bat' instead of 'sh'
                bat "docker build -t %BACKEND_IMAGE%:%IMAGE_TAG% -t %BACKEND_IMAGE%:latest ./Backend"
                bat "docker build -t %FRONTEND_IMAGE%:%IMAGE_TAG% -t %FRONTEND_IMAGE%:latest ./Frontend"
                echo '✅ Docker images built!'
            }
        }

        // ─── STAGE 3: Health Validation (on Laptop) ─────────────────
        stage('Health Validation') {
            steps {
                echo '🏥 Running health check on backend container...'
                bat """
                    docker run -d --name test-backend -p 3001:3000 ^
                        -e DATABASE_URL=%DATABASE_URL% ^
                        -e JWT_KEY=%JWT_KEY% ^
                        -e NODE_ENV=production ^
                        -e PORT=3000 ^
                        -e SMTP_USER=%SMTP_USER% ^
                        -e SMTP_PASS=%SMTP_PASS% ^
                        -e FRONTEND_URL=http://localhost ^
                        %BACKEND_IMAGE%:%IMAGE_TAG%
                """
                // Wait 12 seconds for container to start
                bat "ping -n 12 127.0.0.1 > nul"

                // Hit the /health endpoint
                bat "curl -f http://localhost:3001/health || exit 1"

                echo '✅ Health check PASSED!'
            }
            post {
                always {
                    // Always clean up test container whether passed or failed
                    bat "docker rm -f test-backend || echo already removed"
                }
            }
        }

        // ─── STAGE 4: Save Images as .tar Files ─────────────────────
        stage('Save Images') {
            steps {
                echo '💾 Saving Docker images to transfer to EC2...'
                bat "docker save %BACKEND_IMAGE%:latest -o backend.tar"
                bat "docker save %FRONTEND_IMAGE%:latest -o frontend.tar"
                echo '✅ Images saved as .tar files!'
            }
        }

        // ─── STAGE 5: Transfer & Deploy to EC2 ──────────────────────
        stage('Deploy to EC2') {
            steps {
                echo '🚀 Transferring images and deploying to EC2...'

                // Step 1: Create .env file locally (Jenkins masks these in logs)
                bat """
                    (
                        echo DATABASE_URL=%DATABASE_URL%
                        echo JWT_KEY=%JWT_KEY%
                        echo SMTP_USER=%SMTP_USER%
                        echo SMTP_PASS=%SMTP_PASS%
                        echo FRONTEND_URL=http://%EC2_HOST%
                        echo NODE_ENV=production
                        echo PORT=3000
                    ) > deploy.env
                """

                // Step 2: SCP images, compose file, and .env to EC2
                bat "scp -o StrictHostKeyChecking=no -i \"%SSH_KEY_PATH%\" backend.tar %EC2_USER%@%EC2_HOST%:/home/ubuntu/"
                bat "scp -o StrictHostKeyChecking=no -i \"%SSH_KEY_PATH%\" frontend.tar %EC2_USER%@%EC2_HOST%:/home/ubuntu/"
                bat "scp -o StrictHostKeyChecking=no -i \"%SSH_KEY_PATH%\" docker-compose.yml %EC2_USER%@%EC2_HOST%:/home/ubuntu/url-shortener/"
                bat "scp -o StrictHostKeyChecking=no -i \"%SSH_KEY_PATH%\" deploy.env %EC2_USER%@%EC2_HOST%:/home/ubuntu/url-shortener/.env"

                // Step 3: Load images on EC2
                bat "ssh -o StrictHostKeyChecking=no -i \"%SSH_KEY_PATH%\" %EC2_USER%@%EC2_HOST% \"docker load -i /home/ubuntu/backend.tar && docker load -i /home/ubuntu/frontend.tar\""

                // Step 4: Restart containers using .env file (no secrets in command)
                bat "ssh -o StrictHostKeyChecking=no -i \"%SSH_KEY_PATH%\" %EC2_USER%@%EC2_HOST% \"cd /home/ubuntu/url-shortener && docker compose down || echo 'WARNING: compose down failed' && docker compose --env-file .env up -d\""

                // Step 5: Wait and verify health
                bat "ping -n 15 127.0.0.1 >nul"
                bat "ssh -o StrictHostKeyChecking=no -i \"%SSH_KEY_PATH%\" %EC2_USER%@%EC2_HOST% \"curl -f http://localhost:3000/health && echo '✅ EC2 health check passed!'\""

                // Step 6: Clean up tar files on EC2
                bat "ssh -o StrictHostKeyChecking=no -i \"%SSH_KEY_PATH%\" %EC2_USER%@%EC2_HOST% \"rm -f /home/ubuntu/backend.tar /home/ubuntu/frontend.tar\""
            }
        }
    }

    post {
        success {
            echo "✅ PIPELINE SUCCESS! App is live at: http://${EC2_HOST}"
        }
        failure {
            echo '❌ Pipeline FAILED! Check the logs above for details.'
        }
        always {
            // Clean up local tar files and unused Docker resources
            bat "del /f backend.tar frontend.tar deploy.env 2>nul || echo nothing to clean"
            bat "docker system prune -f || echo pruned"
        }
    }
}
