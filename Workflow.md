# URL Shortener — DevOps Workflow & Jenkinsfile Guide

---

## 1. The Complete CI/CD Architecture

```
Your Laptop
─────────────────────────────────────────────────────────
  VS Code  ──git push──►  GitHub  ──webhook──►  ngrok
                                                   │
                                                   ▼
                                             Jenkins :8080
                                                   │
                              ┌────────────────────┼────────────────────┐
                              ▼                    ▼                    ▼
                         Checkout           Build Images        Health Check
                       (git pull)     (docker build x2)    (test container)
                              │                    │                    │
                              └────────────────────┼────────────────────┘
                                                   ▼
                                            Save as .tar
                                                   │
                                    scp ──────────►│
                                                   ▼
                                          AWS EC2 (3.17.73.31)
                                    ┌──────────────────────────┐
                                    │  docker load images      │
                                    │  docker compose up       │
                                    │                          │
                                    │  ┌────────────────────┐  │
                                    │  │  Nginx  (port 80)  │  │
                                    │  │  /api/* → backend  │  │
                                    │  │  /     → frontend  │  │
                                    │  └────────────────────┘  │
                                    └──────────────────────────┘
                                       http://3.17.73.31 ✅
```

---

## 2. Tools Used & Why

| Tool | Role | Why Used |
|---|---|---|
| **Docker** | Packages app into containers | Same behavior on any machine |
| **Docker Compose** | Runs frontend + backend together | Handles networking between containers |
| **Jenkins** | Automation server | Runs pipeline on every git push |
| **ngrok** | Public URL for localhost Jenkins | GitHub webhook needs a public address |
| **SSH / SCP** | Remote access and file copy to EC2 | Transfer images to AWS securely |
| **Nginx** | Web server + reverse proxy | Serves React, forwards /api to backend |

---

## 3. Project File Structure

```
URL-Shortner-Devops-Apply/
├── Backend/
│   ├── Dockerfile          ← How to containerize the Node.js API
│   └── .env                ← Local secrets (never committed)
├── Frontend/
│   ├── Dockerfile          ← Multi-stage: build React → serve with Nginx
│   └── nginx.conf          ← Nginx config: serve SPA + proxy /api to backend
├── docker-compose.yml      ← Runs both containers together on EC2
└── Jenkinsfile             ← The pipeline script (explained below)
```

---

## 4. Phase-by-Phase Explanation

### Phase 1: Dockerizing the Backend

```dockerfile
FROM node:20-alpine        # Start with lightweight Linux that has Node.js
WORKDIR /app               # Set working directory inside the container
COPY package*.json ./      # Copy only dependency list first (for layer caching)
RUN npm install            # Install only production dependencies
COPY . .                   # Copy all source code
```

> **Why copy package.json first?**
> Docker caches each step. If code changes but package.json doesn't,
> it reuses the cached `npm install` layer — much faster builds.

### Phase 2: Dockerizing the Frontend (Multi-Stage)

```
Stage 1 (Build):                Stage 2 (Serve):
node:20-alpine                  nginx:alpine
  npm install                     COPY dist/ → /usr/share/nginx/html
  npm run build ──► dist/         Only ~25MB, no dev tools ✅
  (~800MB with node_modules)
```

> **Why Multi-Stage?**
> Node.js and npm are only needed to BUILD the React app.
> The final image only needs Nginx to serve the HTML/CSS/JS files.
> This makes the production image 30x smaller and more secure.

### Phase 3: Nginx as Reverse Proxy

```nginx
# Serve the React SPA
location / {
    try_files $uri $uri/ /index.html;  # For client-side routing
}

# Forward /api/* to the backend container
location /api/ {
    proxy_pass http://backend:3000/;
}
```

> **Why needed?**
> Without this, the frontend at port 80 would need to call
> `http://3.17.73.31:3000` (different port = CORS error).
> With nginx proxy, everything goes through port 80 — same origin, no CORS.

### Phase 4: GitHub Webhook + ngrok

```
Problem:  GitHub needs to call Jenkins when you push code.
          Jenkins runs at localhost:8080 — not on the internet.

Solution: ngrok creates a public tunnel:
          https://abc.ngrok-free.dev → localhost:8080

You set this URL in: GitHub repo → Settings → Webhooks
```

> **Important**: ngrok URL changes every restart. Always update the GitHub webhook URL after restarting ngrok.

---

## 5. Jenkinsfile — Complete Line-by-Line Explanation

```groovy
pipeline {
```
> The root block. Everything inside defines your CI/CD pipeline.

```groovy
    agent any
```
> Run this pipeline on ANY available Jenkins agent (executor).
> Since we only have one Jenkins server (the laptop), it runs there.

---

### Environment Block (Variables)

```groovy
    environment {
        BACKEND_IMAGE  = "url-shortener-backend"
        FRONTEND_IMAGE = "url-shortener-frontend"
```
> Define the Docker image names as variables.
> Using variables means if you rename an image, you change it in ONE place.

```groovy
        IMAGE_TAG = "${BUILD_NUMBER}"
```
> `BUILD_NUMBER` is auto-provided by Jenkins (1, 2, 3...).
> Every build gets a unique tag: `url-shortener-backend:24`.
> This lets you roll back to a specific build if something breaks.

```groovy
        EC2_USER = "ubuntu"
        EC2_HOST = "3.17.73.31"
```
> The SSH username and IP address of your AWS EC2 server.
> Ubuntu is the default user for Ubuntu-based EC2 instances.

```groovy
        DATABASE_URL = credentials('aiven-database-url')
        JWT_KEY      = credentials('jwt-key')
        SMTP_USER    = credentials('smtp-user')
        SMTP_PASS    = credentials('smtp-pass')
```
> `credentials('id')` fetches secrets from Jenkins Credentials Store.
> They are NEVER stored in the Jenkinsfile or GitHub.
> Jenkins automatically masks them in logs (shows `****`).

---

### Stage 1: Checkout

```groovy
        stage('Checkout') {
            steps {
                echo 'Pulling latest code from GitHub...'
                checkout scm
            }
        }
```
> `checkout scm` = "Check out Source Code Management"
> Jenkins pulls the latest code from the GitHub repo branch that
> triggered the build (via the webhook).
> The code is placed in the Jenkins workspace folder.

---

### Stage 2: Build Docker Images

```groovy
        stage('Build Docker Images') {
            steps {
                bat "docker build -t %BACKEND_IMAGE%:%IMAGE_TAG% -t %BACKEND_IMAGE%:latest ./Backend"
```
> `bat` = Run a Windows batch command (because Jenkins is on Windows).
> On Linux Jenkins, you'd use `sh` instead.
>
> `docker build` builds an image from the `./Backend/Dockerfile`.
>
> `-t %BACKEND_IMAGE%:%IMAGE_TAG%` = Tag as `url-shortener-backend:24`
> `-t %BACKEND_IMAGE%:latest` = Also tag as `url-shortener-backend:latest`
>
> Two tags: versioned (for rollback) + latest (for docker-compose).

```groovy
                bat "docker build -t %FRONTEND_IMAGE%:%IMAGE_TAG% -t %FRONTEND_IMAGE%:latest ./Frontend"
```
> Same as above but for the React frontend.
> Uses the multi-stage Dockerfile in `./Frontend/`.

---

### Stage 3: Health Validation

```groovy
                bat """
                    (
                        echo DATABASE_URL=%DATABASE_URL%
                        ...
                    ) > health.env
                """
```
> `bat """..."""` = Multi-line Windows batch command.
> Creates a local `health.env` file with all environment variables.
>
> **Why a file instead of `-e` flags?**
> If you use `docker run -e PASSWORD=secret`, the secret appears in
> `docker inspect` logs. Writing to a file is more secure.

```groovy
                bat "docker run -d --name test-backend -p 3001:3000 --env-file health.env %BACKEND_IMAGE%:%IMAGE_TAG%"
```
> `-d` = Detached mode (run in background)
> `--name test-backend` = Give it a name so we can remove it later
> `-p 3001:3000` = Map laptop port 3001 → container port 3000
> `--env-file health.env` = Load secrets from the file we just created

```groovy
                bat "ping -n 12 127.0.0.1 > nul"
```
> Windows trick for sleep: ping localhost 12 times = ~12 second wait.
> Gives the Node.js server time to start up before we test it.
> (`> nul` hides the ping output from logs)

```groovy
                bat "curl -f http://localhost:3001/health || exit 1"
```
> `curl -f` = Fail with error if the HTTP response is not 2xx.
> Calls the `/health` endpoint we added to the backend.
> `|| exit 1` = If curl fails, exit with error code 1 (fails the stage).

```groovy
            post {
                always {
                    bat "docker rm -f test-backend || echo already removed"
                    bat "del /f health.env 2>nul || echo nothing to clean"
                }
            }
```
> `post { always { } }` = Runs WHETHER the stage passed OR failed.
> This guarantees cleanup — container and secret file are always deleted.
>
> `docker rm -f` = Force remove the test container.
> `del /f health.env` = Delete the secrets file from disk.
> `|| echo ...` = If delete fails (file already gone), don't fail the build.

---

### Stage 4: Save Images

```groovy
                bat "docker save %BACKEND_IMAGE%:latest -o backend.tar"
                bat "docker save %FRONTEND_IMAGE%:latest -o frontend.tar"
```
> `docker save` = Export a Docker image to a `.tar` archive file.
> These files contain the entire image (all layers).
>
> **Why .tar instead of Docker Hub?**
> Docker Hub is a public registry. Pushing there exposes your image.
> Copying .tar files via SCP keeps images private and needs no registry account.

---

### Stage 5: Deploy to EC2

```groovy
                bat """
                    (
                        echo DATABASE_URL=%DATABASE_URL%
                        ...
                        echo FRONTEND_URL=http://%EC2_HOST%
                    ) > deploy.env
                """
```
> Creates the production `.env` file locally.
> Note `FRONTEND_URL=http://3.17.73.31` — used by the backend for CORS.
> This file will be copied to EC2 and used by docker-compose.

```groovy
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY')]) {
```
> Fetches the EC2 `.pem` private key from Jenkins Credentials.
> Jenkins writes it to a temporary file and puts the path in `%SSH_KEY%`.
> When the block ends, Jenkins automatically deletes the temp file.

```groovy
                    bat 'powershell -ExecutionPolicy Bypass -Command "..."'
```
> **This is the most complex line — Windows SSH permission fix.**
>
> **The Problem:** OpenSSH requires the `.pem` key file to be readable
> ONLY by the current user. Jenkins runs as `SYSTEM`, but the temp file
> may have broader permissions — OpenSSH refuses it ("too open").
>
> **The Solution:** Use PowerShell to set SYSTEM-only ACL (Access Control List):
> ```
> $k = $env:SSH_KEY           → Get the temp key file path
> $acl = New-Object ...       → Create a new empty permission set
> $acl.SetAccessRuleProtection($true, $false)  → Disable inherited permissions
> $r = New-Object ... ('NT AUTHORITY\SYSTEM', 'Read', 'Allow')
>                             → Create a rule: SYSTEM can read
> $acl.SetAccessRule($r)      → Add that rule to the permission set
> [IO.File]::SetAccessControl($k, $acl)  → Apply to the key file
> ```
> Result: Only the SYSTEM account (Jenkins) can read the key → SSH accepts it.

```groovy
                    bat "ssh -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" %EC2_USER%@%EC2_HOST% \"mkdir -p /home/ubuntu/url-shortener\""
```
> First SSH command — ensures the deploy directory exists on EC2.
> `-o StrictHostKeyChecking=no` = Don't ask "are you sure you trust this server?"
>   (Safe here because we control the EC2 instance)
> `-i "%SSH_KEY%"` = Use our .pem key file for authentication
> `mkdir -p` = Create directory and any parent dirs, no error if it exists

```groovy
                    bat "scp -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" backend.tar    %EC2_USER%@%EC2_HOST%:/home/ubuntu/"
                    bat "scp -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" frontend.tar   %EC2_USER%@%EC2_HOST%:/home/ubuntu/"
                    bat "scp -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" docker-compose.yml %EC2_USER%@%EC2_HOST%:/home/ubuntu/url-shortener/"
                    bat "scp -o StrictHostKeyChecking=no -i \"%SSH_KEY%\" deploy.env     %EC2_USER%@%EC2_HOST%:/home/ubuntu/url-shortener/.env"
```
> `scp` = Secure Copy Protocol (like `cp` but over SSH to remote server).
> Copies 4 files to EC2:
> - `backend.tar` → `/home/ubuntu/` (the saved Docker image)
> - `frontend.tar` → `/home/ubuntu/` (the saved Docker image)
> - `docker-compose.yml` → `/home/ubuntu/url-shortener/`
> - `deploy.env` → `/home/ubuntu/url-shortener/.env` (renamed on EC2)

```groovy
                    bat "ssh ... \"docker load -i /home/ubuntu/backend.tar && docker load -i /home/ubuntu/frontend.tar\""
```
> SSH into EC2 and run two commands:
> `docker load -i backend.tar` = Import the .tar file into Docker.
>   After this, EC2 has the image available as `url-shortener-backend:latest`
> `&&` = Only run the second command if the first succeeded.

```groovy
                    bat "ssh ... \"cd /home/ubuntu/url-shortener && (docker compose down || echo compose-down-warning) && docker compose --env-file .env up -d\""
```
> Three commands on EC2:
>
> `cd /home/ubuntu/url-shortener` = Go to the deploy directory.
>
> `(docker compose down || echo compose-down-warning)`
>   = Stop any running containers. The `( || echo )` pattern means:
>   if compose down fails (first deploy, nothing running yet), just log a warning
>   and continue — don't fail the whole pipeline.
>
> `docker compose --env-file .env up -d`
>   = Start all containers defined in docker-compose.yml
>   `--env-file .env` = Load secrets from the .env file we copied
>   `-d` = Detached/background mode

```groovy
                    bat "ssh ... \"sleep 15 && curl -f http://localhost:3000/health\""
```
> `sleep 15` = Wait 15 seconds on EC2 for containers to fully start.
>   (This runs ON EC2, unlike the Windows ping trick in Stage 3)
> `curl -f http://localhost:3000/health` = Verify the backend is healthy.
>   Calls port 3000 directly (not through nginx) for a direct check.

```groovy
                    bat "ssh ... \"rm -f /home/ubuntu/backend.tar /home/ubuntu/frontend.tar\""
```
> Clean up the large .tar files from EC2 after loading them.
> Docker already imported them into its image store — the .tar files
> are no longer needed and just waste disk space.

---

### Post Block (Runs After Every Build)

```groovy
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
```
> `post` block runs AFTER all stages complete.
>
> `success { }` = Runs only if ALL stages passed.
> `failure { }` = Runs only if any stage failed.
> `always { }` = Runs regardless of result — for cleanup.
>
> `del /f *.tar *.env` = Delete all local temp files (secrets + images).
>   `2>nul` = Suppress errors if files don't exist (already cleaned up).
>
> `docker system prune -f` = Remove unused Docker build cache.
>   Keeps the laptop disk from filling up over many builds.

---

## 6. Common Windows vs Linux Differences in Jenkinsfile

| Linux Jenkins (`sh`) | Windows Jenkins (`bat`) |
|---|---|
| `sh "command"` | `bat "command"` |
| `sleep 15` | `ping -n 16 127.0.0.1 > nul` |
| `rm -f file` | `del /f file 2>nul` |
| `$VARIABLE` | `%VARIABLE%` |
| Single quotes safe for `$` | Must use `bat '...'` for PowerShell `$` |

---

## 7. Issues Faced & How They Were Solved

### Issue 1: SSH "UNPROTECTED PRIVATE KEY FILE"
```
Problem: OpenSSH rejected the .pem key because Windows ACL
         allowed too many users to read it.
         
Solution: PowerShell Set-Acl inside Jenkins pipeline.
          Jenkins runs as SYSTEM which can modify file permissions.
          Set permission: ONLY NT AUTHORITY\SYSTEM can read the key.
```

### Issue 2: Groovy Parsing Errors
```
Problem 1: Unicode characters (emojis, em-dashes) in comments
           caused Jenkins' Groovy parser to fail with backtick error.
Fix: Use only plain ASCII characters in the Jenkinsfile.

Problem 2: $true, $false inside bat "..." double-quoted string
           — Groovy tried to interpolate them as Groovy variables.
Fix: Use bat '...' single-quoted string for PowerShell commands.
     Single quotes = Groovy does NOT interpolate $variables.
```

### Issue 3: Login Cookie Not Working on HTTP
```
Problem: auth.service.js set secure: true on cookies when
         NODE_ENV=production. Secure cookies require HTTPS.
         Site was on plain HTTP → browser silently dropped cookies.
         
Solution: Added HTTPS env var separate from NODE_ENV.
          secure: process.env.HTTPS === "true"   (false on plain HTTP)
          sameSite: "lax" for HTTP, "none" for HTTPS
```

### Issue 4: Frontend Calling localhost:3000
```
Problem: Frontend .env had VITE_API_URL="/api" but .dockerignore
         excluded .env files. Vite built without the variable.
         Fallback was "http://localhost:3000" — broken on EC2.

Solution: Added to Frontend Dockerfile:
          ARG VITE_API_URL=/api
          ENV VITE_API_URL=${VITE_API_URL}
          RUN npm run build
          Bakes the API URL into the React bundle at build time.
```

---

## 8. What to Learn Next

1. **Docker Hub / AWS ECR** — Push images to a registry instead of .tar files
2. **HTTPS / SSL** — Free cert via Let's Encrypt + Certbot on EC2
3. **Custom Domain** — Route53 domain pointing to EC2
4. **Monitoring** — Prometheus + Grafana for production observability
5. **Kubernetes** — Container orchestration at scale (beyond Docker Compose)
6. **Jenkins Shared Libraries** — Reusable pipeline code across projects
