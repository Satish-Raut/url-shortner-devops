pipeline {
    agent any

    // ── Environment Variables ─────────────────────────────────────────
    environment {
        BACKEND_IMAGE  = "url-shortener-backend"
        FRONTEND_IMAGE = "url-shortener-frontend"
        IMAGE_TAG      = "${BUILD_NUMBER}"
        EC2_USER       = "ubuntu"
        EC2_HOST       = "3.17.73.31"

        // Secrets injected from Jenkins Credentials Store at runtime
        DATABASE_URL = credentials('aiven-database-url')
        JWT_KEY      = credentials('jwt-key')
        SMTP_USER    = credentials('smtp-user')
        SMTP_PASS    = credentials('smtp-pass')
    }

    stages {

        // ── 1. Get latest code from GitHub ───────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // ── 2. Build Docker images on the Jenkins laptop ─────────────
        stage('Build Docker Images') {
            steps {
                bat "docker build -t %BACKEND_IMAGE%:%IMAGE_TAG% -t %BACKEND_IMAGE%:latest ./Backend"
                bat "docker build -t %FRONTEND_IMAGE%:%IMAGE_TAG% -t %FRONTEND_IMAGE%:latest ./Frontend"
            }
        }

        // ── 3. Smoke-test the backend image locally ───────────────────
        //    Spins up a temporary container, hits /health, then removes it.
        //    If the image is broken, we catch it here before touching EC2.
        stage('Health Validation') {
            steps {
                // Write secrets to a file — avoids exposing them in 'docker inspect'
                bat """
                    (
                        echo DATABASE_URL=%DATABASE_URL%
                        echo JWT_KEY=%JWT_KEY%
                        echo SMTP_USER=%SMTP_USER%
                        echo SMTP_PASS=%SMTP_PASS%
                        echo NODE_ENV=production
                        echo PORT=3000
                        echo FRONTEND_URL=http://localhost
                    ) > health.env
                """
                bat "docker run -d --name test-backend -p 3001:3000 --env-file health.env %BACKEND_IMAGE%:%IMAGE_TAG%"
                bat "ping -n 12 127.0.0.1 > nul"
                bat "curl -f http://localhost:3001/health || exit 1"
            }
            post {
                always {
                    bat "docker rm -f test-backend || echo already removed"
                    bat "del /f health.env 2>nul"
                }
            }
        }

        // ── 4. Export images to .tar so we can transfer them to EC2 ──
        //    Alternative to pushing to Docker Hub — keeps images private.
        stage('Save Images') {
            steps {
                bat "docker save %BACKEND_IMAGE%:latest -o backend.tar"
                bat "docker save %FRONTEND_IMAGE%:latest -o frontend.tar"
            }
        }

        // ── 5. Ship images to EC2 and restart the services ───────────
        stage('Deploy to EC2') {
            steps {
                // Write the production .env for docker-compose on EC2
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

                // withCredentials writes the .pem key to a temp path (%SSH_KEY%)
                // and deletes it when the block exits — more secure than a static file.
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY')]) {

                    // Fix the key file's Windows ACL so OpenSSH accepts it.
                    // Jenkins runs as SYSTEM which has the SeSecurityPrivilege needed for Set-Acl.
                    bat 'powershell -ExecutionPolicy Bypass -Command "$k=$env:SSH_KEY; $acl=New-Object System.Security.AccessControl.FileSecurity; $acl.SetAccessRuleProtection($true,$false); $r=New-Object System.Security.AccessControl.FileSystemAccessRule(\'NT AUTHORITY\\SYSTEM\',\'Read\',\'Allow\'); $acl.SetAccessRule($r); [IO.File]::SetAccessControl($k,$acl)"'

                    // Transfer files to EC2
                    bat "ssh -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" %EC2_USER%@%EC2_HOST% \"mkdir -p /home/ubuntu/url-shortener\""
                    bat "scp -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" backend.tar frontend.tar %EC2_USER%@%EC2_HOST%:/home/ubuntu/"
                    bat "scp -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" docker-compose.yml deploy.env %EC2_USER%@%EC2_HOST%:/home/ubuntu/url-shortener/"

                    // Load images, restart services, verify health — all in one SSH call
                    bat """ssh -o StrictHostKeyChecking=no -i "%SSH_KEY%" %EC2_USER%@%EC2_HOST% "
                        docker load -i /home/ubuntu/backend.tar &&
                        docker load -i /home/ubuntu/frontend.tar &&
                        cd /home/ubuntu/url-shortener &&
                        mv deploy.env .env &&
                        (docker compose down || echo compose-down-warning) &&
                        docker compose up -d &&
                        sleep 15 &&
                        curl -f http://localhost:3000/health &&
                        rm -f /home/ubuntu/backend.tar /home/ubuntu/frontend.tar
                    " """
                }
            }
        }
    }

    // ── Runs after every build regardless of result ───────────────────
    post {
        success { echo "SUCCESS — App is live at: http://${EC2_HOST}" }
        failure { echo "FAILED — Check the stage logs above." }
        always  {
            bat "del /f backend.tar frontend.tar deploy.env health.env 2>nul"
            bat "docker system prune -f"
        }
    }
}
