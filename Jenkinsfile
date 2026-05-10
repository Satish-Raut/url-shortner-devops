pipeline {
    agent any

    environment {
        BACKEND_IMAGE  = "url-shortener-backend"
        FRONTEND_IMAGE = "url-shortener-frontend"
        IMAGE_TAG      = "${BUILD_NUMBER}"

        EC2_USER = "ubuntu"
        EC2_HOST = "3.17.73.31"

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
                bat "docker build -t %BACKEND_IMAGE%:%IMAGE_TAG% -t %BACKEND_IMAGE%:latest ./Backend"
                bat "docker build -t %FRONTEND_IMAGE%:%IMAGE_TAG% -t %FRONTEND_IMAGE%:latest ./Frontend"
                echo '✅ Docker images built!'
            }
        }

        // ─── STAGE 3: Health Validation (on Laptop) ─────────────────
        stage('Health Validation') {
            steps {
                echo '🏥 Running health check on backend container...'

                // Write local .env for docker run (avoids -e flag secret exposure)
                bat """
                    (
                        echo DATABASE_URL=%DATABASE_URL%
                        echo JWT_KEY=%JWT_KEY%
                        echo NODE_ENV=production
                        echo PORT=3000
                        echo SMTP_USER=%SMTP_USER%
                        echo SMTP_PASS=%SMTP_PASS%
                        echo FRONTEND_URL=http://localhost
                    ) > health.env
                """

                bat "docker run -d --name test-backend -p 3001:3000 --env-file health.env %BACKEND_IMAGE%:%IMAGE_TAG%"
                bat "ping -n 12 127.0.0.1 > nul"
                bat "curl -f http://localhost:3001/health || exit 1"
                echo '✅ Health check PASSED!'
            }
            post {
                always {
                    bat "docker rm -f test-backend || echo already removed"
                    bat "del /f health.env 2>nul || echo nothing to clean"
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

                // Step 1: Create deploy .env locally
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

                // Step 2: Use Jenkins SSH credentials — fix permissions with PowerShell
                // Jenkins runs as SYSTEM which has SeSecurityPrivilege → Set-Acl works here
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY')]) {

                    // Fix Windows ACL on the Jenkins temp key file (SYSTEM can do this)
                    bat '''powershell -ExecutionPolicy Bypass -Command "& { $k=$env:SSH_KEY; $acl=New-Object System.Security.AccessControl.FileSecurity; $acl.SetAccessRuleProtection($true,$false); $r=New-Object System.Security.AccessControl.FileSystemAccessRule('NT AUTHORITY\\SYSTEM','Read','Allow'); $acl.SetAccessRule($r); [IO.File]::SetAccessControl($k,$acl); Write-Host 'Permissions fixed on' $k }"'''

                    // Ensure destination directory exists on EC2
                    bat "ssh -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" %EC2_USER%@%EC2_HOST% \"mkdir -p /home/ubuntu/url-shortener\""

                    // SCP images, compose file, and .env to EC2
                    bat "scp -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" backend.tar %EC2_USER%@%EC2_HOST%:/home/ubuntu/"
                    bat "scp -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" frontend.tar %EC2_USER%@%EC2_HOST%:/home/ubuntu/"
                    bat "scp -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" docker-compose.yml %EC2_USER%@%EC2_HOST%:/home/ubuntu/url-shortener/"
                    bat "scp -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" deploy.env %EC2_USER%@%EC2_HOST%:/home/ubuntu/url-shortener/.env"

                    // Load images on EC2
                    bat "ssh -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" %EC2_USER%@%EC2_HOST% \"docker load -i /home/ubuntu/backend.tar && docker load -i /home/ubuntu/frontend.tar\""

                    // Restart containers — correct compose down logic (subshell prevents short-circuit)
                    bat "ssh -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" %EC2_USER%@%EC2_HOST% \"cd /home/ubuntu/url-shortener && (docker compose down || echo 'WARNING: compose down failed, continuing...') && docker compose --env-file .env up -d\""

                    // Sleep on EC2 side, then verify health
                    bat "ssh -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" %EC2_USER%@%EC2_HOST% \"sleep 15 && curl -f http://localhost:3000/health && echo '✅ EC2 health check passed!'\""

                    // Cleanup tar files on EC2
                    bat "ssh -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" %EC2_USER%@%EC2_HOST% \"rm -f /home/ubuntu/backend.tar /home/ubuntu/frontend.tar\""
                }
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
            // Clean up ALL local secret files and tar files
            bat "del /f backend.tar frontend.tar deploy.env health.env 2>nul || echo nothing to clean"
            bat "docker system prune -f || echo pruned"
        }
    }
}
