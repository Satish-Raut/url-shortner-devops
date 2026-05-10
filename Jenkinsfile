pipeline {
    agent any

    environment {
        BACKEND_IMAGE  = "url-shortener-backend"
        FRONTEND_IMAGE = "url-shortener-frontend"
        IMAGE_TAG      = "${BUILD_NUMBER}"

        EC2_USER = "ubuntu"
        EC2_HOST = "3.17.73.31"

        DATABASE_URL = credentials('aiven-database-url')
        JWT_KEY      = credentials('jwt-key')
        SMTP_USER    = credentials('smtp-user')
        SMTP_PASS    = credentials('smtp-pass')
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Pulling latest code from GitHub...'
                checkout scm
            }
        }

        stage('Build Docker Images') {
            steps {
                echo 'Building Docker images...'
                bat "docker build -t %BACKEND_IMAGE%:%IMAGE_TAG% -t %BACKEND_IMAGE%:latest ./Backend"
                bat "docker build -t %FRONTEND_IMAGE%:%IMAGE_TAG% -t %FRONTEND_IMAGE%:latest ./Frontend"
                echo 'Docker images built!'
            }
        }

        stage('Health Validation') {
            steps {
                echo 'Running health check on backend container...'
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
                echo 'Health check PASSED!'
            }
            post {
                always {
                    bat "docker rm -f test-backend || echo already removed"
                    bat "del /f health.env 2>nul || echo nothing to clean"
                }
            }
        }

        stage('Save Images') {
            steps {
                echo 'Saving Docker images as tar files...'
                bat "docker save %BACKEND_IMAGE%:latest -o backend.tar"
                bat "docker save %FRONTEND_IMAGE%:latest -o frontend.tar"
                echo 'Images saved!'
            }
        }

        stage('Deploy to EC2') {
            steps {
                echo 'Transferring images and deploying to EC2...'

                // Write deploy .env file locally
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

                // Use Jenkins SSH credentials, fix ACL with PowerShell (Jenkins=SYSTEM has SeSecurityPrivilege)
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY')]) {

                    // Fix key file permissions: SYSTEM-only read access
                    bat "powershell -ExecutionPolicy Bypass -Command \"$k=$env:SSH_KEY; $acl=New-Object System.Security.AccessControl.FileSecurity; $acl.SetAccessRuleProtection($true,$false); $r=New-Object System.Security.AccessControl.FileSystemAccessRule('NT AUTHORITY\\SYSTEM','Read','Allow'); $acl.SetAccessRule($r); [IO.File]::SetAccessControl($k,$acl); Write-Host Permissions fixed\""

                    // Ensure EC2 deploy directory exists
                    bat "ssh -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" %EC2_USER%@%EC2_HOST% \"mkdir -p /home/ubuntu/url-shortener\""

                    // Transfer files to EC2
                    bat "scp -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" backend.tar    %EC2_USER%@%EC2_HOST%:/home/ubuntu/"
                    bat "scp -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" frontend.tar   %EC2_USER%@%EC2_HOST%:/home/ubuntu/"
                    bat "scp -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" docker-compose.yml %EC2_USER%@%EC2_HOST%:/home/ubuntu/url-shortener/"
                    bat "scp -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" deploy.env     %EC2_USER%@%EC2_HOST%:/home/ubuntu/url-shortener/.env"

                    // Load images on EC2
                    bat "ssh -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" %EC2_USER%@%EC2_HOST% \"docker load -i /home/ubuntu/backend.tar && docker load -i /home/ubuntu/frontend.tar\""

                    // Restart services (subshell ensures compose up always runs)
                    bat "ssh -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" %EC2_USER%@%EC2_HOST% \"cd /home/ubuntu/url-shortener && (docker compose down || echo compose-down-warning) && docker compose --env-file .env up -d\""

                    // Wait on EC2 then health check
                    bat "ssh -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" %EC2_USER%@%EC2_HOST% \"sleep 15 && curl -f http://localhost:3000/health\""

                    // Cleanup tar files from EC2
                    bat "ssh -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" %EC2_USER%@%EC2_HOST% \"rm -f /home/ubuntu/backend.tar /home/ubuntu/frontend.tar\""
                }
            }
        }
    }

    post {
        success {
            echo "PIPELINE SUCCESS! App is live at: http://${EC2_HOST}"
        }
        failure {
            echo 'Pipeline FAILED! Check the logs above for details.'
        }
        always {
            bat "del /f backend.tar frontend.tar deploy.env health.env 2>nul || echo nothing to clean"
            bat "docker system prune -f || echo pruned"
        }
    }
}
