# 🚀 DevOps Learning Guide — URL Shortener Project
### From Source Code → Docker Container → Jenkins CI/CD → AWS EC2

> **Difficulty:** Medium | **Project:** URL Shortener (Node.js + React + Aiven MySQL)
> **Goal:** Build a Jenkins pipeline that automates the transition of source code into
> a containerized service by building a Docker image, performing health validation,
> and deploying the container to an AWS EC2 instance.

---

## 📚 Table of Contents

1. [Big Picture — What Are We Building?](#big-picture)
2. [Phase 1 — Docker: Containerize the App](#phase-1--docker)
3. [Phase 2 — AWS: Set Up Your EC2 Server](#phase-2--aws-ec2)
4. [Phase 3 — Jenkins: Automate Everything](#phase-3--jenkins)
5. [Phase 4 — Full Pipeline: Putting It All Together](#phase-4--full-pipeline)
6. [⭐ Alternative Approach — Jenkins on Your Windows Laptop](#alternative-approach)
7. [Troubleshooting & Common Mistakes](#troubleshooting)
8. [Glossary for Beginners](#glossary)

---

## Big Picture

Before writing a single command, understand **what you are building** and **why**.

```
YOUR LAPTOP (Code)
      │
      │  git push
      ▼
  GitHub Repo
      │
      │  Jenkins detects the push (Webhook)
      ▼
  Jenkins Server (on EC2 or local)
      │
      ├─ Step 1: Pull latest code
      ├─ Step 2: Build Docker Image (Frontend + Backend)
      ├─ Step 3: Health Check — does the container start?
      └─ Step 4: Deploy container to AWS EC2
                        │
                        ▼
              🌐 Live App on EC2 Public IP
                (Users can access it!)
```

### Why Each Tool?

| Tool | What It Does | Why We Use It |
|------|-------------|---------------|
| **Docker** | Packages your app + all its dependencies into a portable "container" | Works on any machine — "it works on my machine" problem SOLVED |
| **Jenkins** | Automates the build → test → deploy steps whenever you push code | No manual deployment needed — push code, app updates automatically |
| **AWS EC2** | A virtual server in the cloud where your app lives 24/7 | Your app needs a machine to run on that is always online |

---

## Phase 1 — Docker

### 🧠 Concept: What is Docker?

Think of Docker like a **lunchbox**. Instead of carrying all the ingredients (Node.js, npm, OS libraries) separately and hoping the destination kitchen has them, you pack everything into one lunchbox (container). Open the lunchbox anywhere — it always works.

**Key Terms:**
- **Dockerfile** — the recipe for building your lunchbox
- **Docker Image** — the packed lunchbox (read-only snapshot)
- **Docker Container** — the lunchbox that is currently open and running

---

### Step 1.1 — Install Docker Desktop

1. Go to https://www.docker.com/products/docker-desktop
2. Download and install **Docker Desktop for Windows**
3. After install, open a terminal and verify:
```bash
docker --version
# Expected: Docker version 24.x.x or higher
```

---

### Step 1.2 — Create the Backend Dockerfile

Create a file at `Backend/Dockerfile` (no extension):

```dockerfile
# ─────────────────────────────────────────────
# Stage 1: Base image
# ─────────────────────────────────────────────

# FROM: Which base image to start from
# node:20-alpine = Node.js version 20 on a tiny Linux (Alpine) — keeps image small
FROM node:20-alpine

# WORKDIR: Set the working directory inside the container
# All future commands run from this folder
WORKDIR /app

# COPY package files first (Docker caches this layer)
# This is a performance trick — if package.json didn't change,
# Docker skips re-installing node_modules
COPY package*.json ./

# RUN: Execute a command during image build
# Install only production dependencies (no devDependencies)
RUN npm install --omit=dev

# COPY the rest of the source code
COPY . .

# EXPOSE: Tell Docker which port this app listens on
# This is documentation — doesn't actually open the port
EXPOSE 3000

# CMD: The command to run when container STARTS
# Use array format (preferred over string)
CMD ["node", "app.js"]
```

> 💡 **Why `node:20-alpine`?** Alpine Linux is only ~5MB vs Ubuntu's ~77MB. Smaller image = faster downloads and deployments.

---

### Step 1.3 — Create the Frontend Dockerfile

The frontend needs to be **built** (compiled to static files) and then served.

Create `Frontend/Dockerfile`:

```dockerfile
# ─────────────────────────────────────────────
# Stage 1: Build the React app
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed to build)
RUN npm install

# Copy source code
COPY . .

# Build the React app — creates /app/dist folder with static HTML/CSS/JS
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Serve with Nginx (lightweight web server)
# ─────────────────────────────────────────────
FROM nginx:alpine

# Copy built files from Stage 1 into nginx's serving folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our custom nginx config (we'll create this next)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

> 💡 **Multi-stage build** — We use TWO FROM statements. Stage 1 builds the app (large), Stage 2 serves it (tiny Nginx image). The final image only contains Stage 2. This keeps production images small!

---

### Step 1.4 — Create Nginx Config for Frontend

Create `Frontend/nginx.conf`:

```nginx
server {
    listen 80;

    # Serve React's static files
    root /usr/share/nginx/html;
    index index.html;

    # This is CRITICAL for React Router to work
    # Without this, refreshing on /dashboard gives 404
    location / {
        try_files $uri /index.html;
    }

    # Proxy API calls to the backend container
    # When frontend calls /api/..., nginx forwards it to backend
    location /api/ {
        proxy_pass http://backend:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

### Step 1.5 — Create .dockerignore Files

Just like `.gitignore` skips files for Git, `.dockerignore` tells Docker what NOT to copy into the image.

Create `Backend/.dockerignore`:
```
node_modules
.env
*.log
.git
```

Create `Frontend/.dockerignore`:
```
node_modules
dist
.env
*.log
.git
```

> ⚠️ **Never copy `.env` into a Docker image!** Your secrets would be permanently baked into the image. We pass env variables at runtime instead.

---

### Step 1.6 — Create Docker Compose (Run Everything Together)

`docker-compose.yml` lets you run Backend + Frontend containers together with one command.

Create `docker-compose.yml` at the **root** of your project:

```yaml
version: "3.9"

services:

  # ─── BACKEND SERVICE ───────────────────────
  backend:
    build:
      context: ./Backend        # Where to find the Dockerfile
      dockerfile: Dockerfile
    container_name: url-backend
    ports:
      - "3000:3000"             # HOST_PORT:CONTAINER_PORT
    environment:
      # Pass env variables at runtime (NOT baked into image)
      PORT: 3000
      DATABASE_URL: ${DATABASE_URL}
      FRONTEND_URL: ${FRONTEND_URL}
      NODE_ENV: production
      JWT_KEY: ${JWT_KEY}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
    restart: unless-stopped     # Auto-restart if it crashes
    healthcheck:
      # Docker checks if app is healthy every 30s
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ─── FRONTEND SERVICE ──────────────────────
  frontend:
    build:
      context: ./Frontend
      dockerfile: Dockerfile
    container_name: url-frontend
    ports:
      - "80:80"                 # App available on port 80 (standard HTTP)
    depends_on:
      - backend                 # Wait for backend to start first
    restart: unless-stopped
```

---

### Step 1.7 — Add a Health Check Endpoint

The pipeline will use a health check to verify the container started correctly. Add this to `Backend/app.js` before `app.listen`:

```javascript
// Health check endpoint — Jenkins uses this to verify deployment
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});
```

---

### Step 1.8 — Test Docker Locally

```bash
# Build and start everything
docker compose up --build

# In another terminal, verify health check works:
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"..."}

# See running containers
docker ps

# See container logs
docker logs url-backend
docker logs url-frontend

# Stop everything
docker compose down
```

✅ **Phase 1 Complete** — Your app runs in containers!

---

## Phase 2 — AWS EC2

### 🧠 Concept: What is AWS EC2?

EC2 = **Elastic Compute Cloud**. It is a virtual machine (VM) running in Amazon's data centers. You get a real Linux server with a public IP address that anyone on the internet can reach.

**Analogy:** EC2 is like renting a computer at Amazon's office 24/7. You control it remotely via SSH.

---

### Step 2.1 — Create AWS Account

1. Go to https://aws.amazon.com
2. Click **"Create an AWS Account"**
3. Enter email, password, payment info (you need a card but **Free Tier** won't charge for basic usage)
4. Choose **"Free Tier"** — you get a `t2.micro` EC2 instance free for 12 months

---

### Step 2.2 — Launch an EC2 Instance

1. Log in to AWS Console → Search for **EC2** → Click **"Launch Instance"**

2. **Configure your instance:**

   | Setting | Value | Why |
   |---------|-------|-----|
   | **Name** | `url-shortener-server` | Easy to identify |
   | **AMI (OS)** | Ubuntu 22.04 LTS | Popular, well-documented Linux |
   | **Instance Type** | `t2.micro` | Free Tier eligible |
   | **Key Pair** | Create new → `url-shortener-key` → Download `.pem` file | Used to SSH into your server |
   | **Security Group** | Create new | Controls who can access what |

3. **Security Group Rules** (very important — this is your firewall):

   | Type | Protocol | Port | Source | Purpose |
   |------|----------|------|--------|---------|
   | SSH | TCP | 22 | My IP | So you can connect to the server |
   | HTTP | TCP | 80 | 0.0.0.0/0 | So users can visit your app |
   | Custom TCP | TCP | 3000 | 0.0.0.0/0 | Backend API access |
   | Custom TCP | TCP | 8080 | My IP | Jenkins dashboard |

4. Click **"Launch Instance"**

---

### Step 2.3 — Connect to Your EC2 Server via SSH

After launch, find your instance's **Public IP** in the EC2 dashboard.

```bash
# On Windows — open PowerShell:

# First, fix key file permissions (required by SSH)
icacls "url-shortener-key.pem" /inheritance:r /grant:r "%USERNAME%:R"

# Connect to server
ssh -i "url-shortener-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP

# Example:
ssh -i "url-shortener-key.pem" ubuntu@54.123.45.67
```

You should see a Linux prompt: `ubuntu@ip-172-31-xx-xx:~$`

---

### Step 2.4 — Install Docker on EC2

Once connected, run these commands on your EC2 server:

```bash
# Update the package list
sudo apt update

# Install Docker
sudo apt install -y docker.io

# Install Docker Compose
sudo apt install -y docker-compose-plugin

# Start Docker and enable it to start on boot
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (so you don't need sudo every time)
sudo usermod -aG docker ubuntu

# IMPORTANT: Log out and log back in for group change to take effect
exit
```

Reconnect and verify:
```bash
ssh -i "url-shortener-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP
docker --version
docker compose version
```

---

### Step 2.5 — Install Java on EC2 (Required for Jenkins Agent)

```bash
sudo apt install -y openjdk-17-jdk
java -version
# Expected: openjdk version "17.x.x"
```

✅ **Phase 2 Complete** — Your EC2 server is ready!

---

## Phase 3 — Jenkins

### 🧠 Concept: What is Jenkins?

Jenkins is a **CI/CD automation server**. CI = Continuous Integration, CD = Continuous Deployment.

**Without Jenkins:** You write code → push to GitHub → manually SSH to server → manually run docker commands → hope nothing breaks.

**With Jenkins:** You write code → push to GitHub → Jenkins automatically does everything → app is updated in minutes, no manual work.

**Analogy:** Jenkins is like a robot assistant that watches your GitHub and rebuilds + redeploys your app every time you push code.

---

### Step 3.1 — Install Jenkins on EC2

Connect to your EC2 server:

```bash
# Add Jenkins repository key
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null

# Add Jenkins repo to apt sources
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

# Update and install Jenkins
sudo apt update
sudo apt install -y jenkins

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Check if Jenkins is running
sudo systemctl status jenkins
```

---

### Step 3.2 — Unlock Jenkins

1. Open your browser and go to: `http://YOUR_EC2_PUBLIC_IP:8080`
2. You'll see an "Unlock Jenkins" screen
3. Get the initial password:
```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```
4. Paste the password → Click **"Install Suggested Plugins"** → Wait
5. Create your Admin user (remember this username/password!)

---

### Step 3.3 — Add Jenkins to Docker Group

Jenkins needs permission to run Docker commands:

```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

---

### Step 3.4 — Install Required Jenkins Plugins

In Jenkins → **Manage Jenkins** → **Plugins** → **Available Plugins**, install:

- ✅ **Git Plugin** — to clone your GitHub repo
- ✅ **Pipeline** — to use Jenkinsfile
- ✅ **Docker Pipeline** — to build Docker images
- ✅ **SSH Agent** — to deploy to remote servers
- ✅ **GitHub Integration** — for webhooks

Click **"Install without restart"**

---

### Step 3.5 — Store Secrets in Jenkins (Credentials)

**Never put passwords in your Jenkinsfile!** Jenkins has a secure credential store.

Go to **Manage Jenkins** → **Credentials** → **System** → **Global** → **Add Credentials**

Add the following credentials:

| ID | Type | Value | Used For |
|----|------|-------|----------|
| `aiven-database-url` | Secret text | Your Aiven DATABASE_URL | DB connection |
| `jwt-key` | Secret text | Your JWT_KEY value | Auth tokens |
| `smtp-user` | Secret text | Your SMTP_USER | Email |
| `smtp-pass` | Secret text | Your SMTP_PASS | Email password |
| `ec2-ssh-key` | SSH Username with private key | Contents of your `.pem` file | Deploy to EC2 |
| `github-token` | Username with password | GitHub username + Personal Access Token | Clone private repos |

> 💡 To create a GitHub Personal Access Token: GitHub → Settings → Developer Settings → Personal Access Tokens → Generate New Token (classic) → Select `repo` scope

---

### Step 3.6 — Create the Jenkinsfile (The Pipeline Recipe)

Create `Jenkinsfile` at the **root** of your project (same level as Backend/Frontend folders):

```groovy
pipeline {
    // agent any = run this pipeline on any available Jenkins agent
    agent any

    // environment = define variables available throughout the pipeline
    environment {
        // Docker Hub or ECR image names
        BACKEND_IMAGE  = "url-shortener-backend"
        FRONTEND_IMAGE = "url-shortener-frontend"
        IMAGE_TAG      = "${BUILD_NUMBER}"  // Jenkins auto-increments build number

        // EC2 connection details
        EC2_USER       = "ubuntu"
        EC2_HOST       = "YOUR_EC2_PUBLIC_IP"  // ← Replace this!
        
        // Pull secrets from Jenkins credential store (never hardcode!)
        DATABASE_URL   = credentials('aiven-database-url')
        JWT_KEY        = credentials('jwt-key')
        SMTP_USER      = credentials('smtp-user')
        SMTP_PASS      = credentials('smtp-pass')
    }

    stages {

        // ─── STAGE 1: Get the code ──────────────────────────────────
        stage('Checkout') {
            steps {
                echo '📥 Pulling latest code from GitHub...'
                // Jenkins automatically clones the repo configured in the job
                checkout scm
            }
        }

        // ─── STAGE 2: Build Docker Images ──────────────────────────
        stage('Build Docker Images') {
            steps {
                echo '🐳 Building Docker images...'
                script {
                    // Build Backend image
                    sh """
                        docker build \
                            -t ${BACKEND_IMAGE}:${IMAGE_TAG} \
                            -t ${BACKEND_IMAGE}:latest \
                            ./Backend
                    """

                    // Build Frontend image
                    sh """
                        docker build \
                            -t ${FRONTEND_IMAGE}:${IMAGE_TAG} \
                            -t ${FRONTEND_IMAGE}:latest \
                            ./Frontend
                    """
                }
                echo '✅ Docker images built successfully!'
            }
        }

        // ─── STAGE 3: Health Validation ─────────────────────────────
        stage('Health Validation') {
            steps {
                echo '🏥 Running health check on backend container...'
                script {
                    // Start the backend container temporarily for testing
                    sh """
                        docker run -d \
                            --name test-backend \
                            -p 3001:3000 \
                            -e DATABASE_URL=${DATABASE_URL} \
                            -e JWT_KEY=${JWT_KEY} \
                            -e NODE_ENV=production \
                            -e PORT=3000 \
                            -e SMTP_USER=${SMTP_USER} \
                            -e SMTP_PASS=${SMTP_PASS} \
                            -e FRONTEND_URL=http://localhost \
                            ${BACKEND_IMAGE}:${IMAGE_TAG}
                    """

                    // Wait 10 seconds for container to fully start
                    sh "sleep 10"

                    // Hit the /health endpoint — if it returns 200, we're good!
                    sh """
                        curl -f http://localhost:3001/health || \
                        (echo '❌ Health check FAILED!' && exit 1)
                    """

                    echo '✅ Health check PASSED!'
                }
            }
            post {
                // always = runs whether stage passed or failed
                always {
                    // Clean up the test container regardless of result
                    sh "docker rm -f test-backend || true"
                }
            }
        }

        // ─── STAGE 4: Deploy to EC2 ──────────────────────────────────
        stage('Deploy to EC2') {
            steps {
                echo '🚀 Deploying to AWS EC2...'
                // sshAgent uses the EC2 SSH key we stored in Jenkins credentials
                sshagent(['ec2-ssh-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} '
                            
                            echo "--- Stopping old containers ---"
                            cd /home/ubuntu/url-shortener
                            docker compose down || true

                            echo "--- Removing old images ---"
                            docker rmi url-shortener-backend:latest || true
                            docker rmi url-shortener-frontend:latest || true

                            echo "--- Pulling latest code ---"
                            git pull origin main

                            echo "--- Starting new containers ---"
                            DATABASE_URL=${DATABASE_URL} \\
                            JWT_KEY=${JWT_KEY} \\
                            SMTP_USER=${SMTP_USER} \\
                            SMTP_PASS=${SMTP_PASS} \\
                            FRONTEND_URL=http://${EC2_HOST} \\
                            docker compose up --build -d

                            echo "--- Verifying deployment ---"
                            sleep 15
                            curl -f http://localhost:3000/health && echo "✅ Deployment successful!"
                        '
                    """
                }
            }
        }
    }

    // ─── POST: Run after ALL stages ──────────────────────────────────
    post {
        success {
            echo """
            ╔════════════════════════════════════╗
            ║  ✅ PIPELINE SUCCESS!              ║
            ║  App is live at: http://${EC2_HOST} ║
            ╚════════════════════════════════════╝
            """
        }
        failure {
            echo '❌ Pipeline FAILED! Check the logs above for details.'
        }
        always {
            // Clean up unused Docker resources to save disk space
            sh "docker system prune -f || true"
        }
    }
}
```

---

### Step 3.7 — Create a Jenkins Pipeline Job

1. Jenkins Dashboard → **"New Item"**
2. Name it: `url-shortener-pipeline`
3. Select **"Pipeline"** → Click **OK**
4. In configuration:
   - **General:** Check "GitHub project" → Enter your repo URL
   - **Build Triggers:** Check **"GitHub hook trigger for GITScm polling"**
   - **Pipeline:**
     - Definition: **"Pipeline script from SCM"**
     - SCM: **Git**
     - Repository URL: `https://github.com/YOUR_USERNAME/YOUR_REPO`
     - Credentials: Select the GitHub credentials you added
     - Branch: `*/main`
     - Script Path: `Jenkinsfile`
5. Click **Save**

---

### Step 3.8 — Set Up GitHub Webhook (Auto-trigger on push)

A webhook tells GitHub to notify Jenkins every time you push code.

1. Go to your GitHub repo → **Settings** → **Webhooks** → **Add webhook**
2. Configure:
   - **Payload URL:** `http://YOUR_EC2_PUBLIC_IP:8080/github-webhook/`
   - **Content type:** `application/json`
   - **Which events:** Select "Just the push event"
3. Click **Add webhook**

Now every `git push` to your main branch → GitHub notifies Jenkins → Jenkins runs the pipeline automatically! 🎉

✅ **Phase 3 Complete** — Jenkins is set up!

---

## Phase 4 — Full Pipeline

### Step 4.1 — Prepare the EC2 Server for Deployment

SSH into your EC2 server:

```bash
# Clone your repo on the EC2 server
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git url-shortener
cd url-shortener

# Verify the structure
ls
# Should show: Backend/  Frontend/  docker-compose.yml  Jenkinsfile
```

### Step 4.2 — First Manual Test Run

Before relying on Jenkins, test the full docker compose on EC2 manually:

```bash
# On EC2 server — create an .env file for testing
cat > .env << 'EOF'
DATABASE_URL=mysql://avnadmin:YOUR_PASS@YOUR_AIVEN_HOST:PORT/defaultdb
JWT_KEY=YourSecretKey
SMTP_USER=your@email.com
SMTP_PASS=yourpassword
FRONTEND_URL=http://YOUR_EC2_PUBLIC_IP
EOF

# Run everything
docker compose up --build -d

# Check logs
docker compose logs -f

# Test health
curl http://localhost:3000/health

# Visit your app
# Open browser: http://YOUR_EC2_PUBLIC_IP
```

### Step 4.3 — Trigger the Jenkins Pipeline

1. Go to Jenkins Dashboard → `url-shortener-pipeline`
2. Click **"Build Now"** for the first manual trigger
3. Click on the build number (e.g., `#1`) → **"Console Output"** to watch it live
4. You'll see each stage: Checkout → Build → Health Check → Deploy

### Step 4.4 — The Complete Development Workflow (After Setup)

Once everything is configured, your daily workflow is just:

```bash
# 1. Write code on your laptop
# 2. Push to GitHub
git add .
git commit -m "Add new feature"
git push origin main

# 3. Jenkins automatically:
#    - Detects the push
#    - Builds Docker images
#    - Runs health check
#    - Deploys to EC2
# 
# 4. Visit http://YOUR_EC2_PUBLIC_IP — app is updated! ✅
```

---

## Troubleshooting

### ❌ "Permission denied" when running Docker on EC2
```bash
sudo usermod -aG docker ubuntu
sudo usermod -aG docker jenkins
# Then log out and log back in
```

### ❌ Jenkins can't connect to GitHub
- Check your GitHub Personal Access Token has `repo` scope
- Verify the token is not expired
- Make sure port 8080 is open in EC2 Security Group

### ❌ Health check fails in pipeline
- Check container logs: `docker logs test-backend`
- Make sure `DATABASE_URL` credential in Jenkins is correct
- Verify the `/health` endpoint exists in `app.js`

### ❌ Frontend shows "Cannot connect to API"
- Check `FRONTEND_URL` env variable matches your EC2 IP
- Verify nginx.conf proxy is pointing to correct backend

### ❌ Docker build fails on EC2 (out of memory)
- `t2.micro` only has 1GB RAM — add a swap file:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Glossary

| Term | Simple Definition |
|------|------------------|
| **Container** | A running instance of a Docker image — like a running app in a box |
| **Image** | A snapshot/template for creating containers — like a class vs object |
| **Dockerfile** | Instructions for building a Docker image |
| **docker-compose** | A tool to run multiple containers together |
| **CI (Continuous Integration)** | Automatically building and testing code on every push |
| **CD (Continuous Deployment)** | Automatically deploying tested code to production |
| **Pipeline** | A series of automated steps (build → test → deploy) |
| **Jenkins Agent** | The machine that actually runs your pipeline steps |
| **Webhook** | GitHub notifying Jenkins: "Hey, new code was pushed!" |
| **EC2** | Amazon's virtual machine service |
| **Security Group** | AWS firewall — controls which ports are open |
| **SSH** | Secure way to remotely control a Linux server |
| **`.pem` file** | Your private key to SSH into EC2 — keep it secret! |
| **Health Check** | Testing if the app is running correctly before going live |
| **Port** | A numbered door on a server (port 80 = HTTP, 3000 = backend) |

---

## 📋 Quick Reference Checklist

### Phase 1 — Docker ✅
- [ ] Install Docker Desktop locally
- [ ] Create `Backend/Dockerfile`
- [ ] Create `Frontend/Dockerfile`
- [ ] Create `Frontend/nginx.conf`
- [ ] Create `Backend/.dockerignore` & `Frontend/.dockerignore`
- [ ] Create root `docker-compose.yml`
- [ ] Add `/health` endpoint to `Backend/app.js`
- [ ] Test locally with `docker compose up --build`

### Phase 2 — AWS EC2 ✅
- [ ] Create AWS Free Tier account
- [ ] Launch Ubuntu t2.micro EC2 instance
- [ ] Configure Security Group (ports 22, 80, 3000, 8080)
- [ ] Download and secure your `.pem` key file
- [ ] SSH into EC2 server
- [ ] Install Docker on EC2
- [ ] Install Java on EC2

### Phase 3 — Jenkins ✅
- [ ] Install Jenkins on EC2
- [ ] Unlock Jenkins and create admin user
- [ ] Install required plugins
- [ ] Add Jenkins to docker group
- [ ] Store all secrets as Jenkins Credentials
- [ ] Create `Jenkinsfile` in project root
- [ ] Create Jenkins Pipeline job
- [ ] Configure GitHub Webhook

### Phase 4 — Full Pipeline ✅
- [ ] Clone repo on EC2 server
- [ ] Test `docker compose up` manually on EC2
- [ ] Trigger first Jenkins build manually
- [ ] Push a code change and watch auto-deploy work
- [ ] Verify app is live at EC2 public IP

---

> 🎓 **You've completed the DevOps pipeline!**
> You now understand how real companies ship code to production.
> Next steps to explore: **Docker Hub** (store images), **AWS ECR** (Amazon's image registry),
> **Terraform** (infrastructure as code), **Kubernetes** (container orchestration at scale).

---

## ⭐ Alternative Approach
### Jenkins on Your Windows Laptop + Deploy to AWS EC2

> 💡 **Why this approach?**
> Running Jenkins on your laptop saves EC2 resources. Your `t2.micro` only has 1GB RAM —
> running Jenkins + Docker builds + your app on the same server is very slow.
> This approach: **Jenkins builds on your laptop → deploys finished containers to EC2**.

```
YOUR WINDOWS LAPTOP
├── Jenkins (localhost:8080)
├── Docker Desktop
└── Your Code
        │
        │  git push
        ▼
    GitHub Repo
        │  Webhook → ngrok → your laptop Jenkins
        ▼
    Jenkins (on laptop) runs pipeline:
        ├─ Pull code
        ├─ Build Docker images (on your laptop)
        ├─ Health check (on your laptop)
        └─ SSH into EC2 → deploy images
                  │
                  ▼
          🌐 Live App on EC2 Public IP
```

---

### Alt-Step 1 — Install Jenkins on Windows

**Option A: Using Java (Recommended)**

1. Install Java 17 first (Jenkins requires it):
   - Go to https://adoptium.net
   - Download **Temurin 17 LTS** for Windows
   - Install it, then verify:
   ```powershell
   java -version
   # Expected: openjdk version "17.x.x"
   ```

2. Download Jenkins for Windows:
   - Go to https://www.jenkins.io/download/
   - Click **Windows** → Download the `.msi` installer
   - Run the installer → follow the wizard
   - Jenkins installs as a **Windows Service** (runs automatically on startup)

3. Open your browser and go to: `http://localhost:8080`

4. Unlock Jenkins — get the initial password:
   ```powershell
   # The password is stored here:
   type C:\ProgramData\Jenkins\.jenkins\secrets\initialAdminPassword
   ```

5. Paste password → **Install Suggested Plugins** → Create Admin User

**Option B: Using Docker (Simpler)**

```powershell
# Run Jenkins inside a Docker container on your laptop
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts

# Get the initial password
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

> ⚠️ If using Docker option, Jenkins runs only while Docker is running.
> The Java/MSI option runs Jenkins as a Windows service — always available.

---

### Alt-Step 2 — Add Jenkins to Docker Group (Docker option only)

If you used **Option B (Docker)**, Jenkins needs access to Docker:

```powershell
# Enter the Jenkins container
docker exec -it -u root jenkins bash

# Inside the container:
apt update && apt install -y docker.io
exit
```

If you used **Option A (Windows Service)**, Docker Desktop handles this automatically.

---

### Alt-Step 3 — Install ngrok (For GitHub Webhooks)

Your laptop doesn't have a public IP, so GitHub can't send webhook notifications to it.
**ngrok** creates a temporary public URL that tunnels to your laptop.

1. Go to https://ngrok.com → Sign up for free
2. Download **ngrok for Windows** → extract the `.exe` file
3. Connect your ngrok account:
   ```powershell
   # After signing up, get your auth token from ngrok dashboard
   ngrok config add-authtoken YOUR_NGROK_TOKEN
   ```
4. Start ngrok tunnel to Jenkins:
   ```powershell
   ngrok http 8080
   ```
5. You'll see output like:
   ```
   Forwarding  https://abc123xyz.ngrok-free.app -> http://localhost:8080
   ```
6. Copy the `https://abc123xyz.ngrok-free.app` URL — this is your public Jenkins URL!

> ⚠️ **Free ngrok limitation:** The URL changes every time you restart ngrok.
> For learning purposes this is fine — just update the GitHub webhook URL when it changes.

---

### Alt-Step 4 — Install Required Jenkins Plugins

In Jenkins → **Manage Jenkins** → **Plugins** → **Available Plugins**, install:

- ✅ **Git Plugin** — to clone your GitHub repo
- ✅ **Pipeline** — to use Jenkinsfile
- ✅ **Docker Pipeline** — to build Docker images
- ✅ **SSH Agent** — to deploy to EC2 via SSH
- ✅ **GitHub Integration** — for webhooks

---

### Alt-Step 5 — Store Secrets in Jenkins

Go to **Manage Jenkins** → **Credentials** → **System** → **Global** → **Add Credentials**

| ID | Type | Value |
|----|------|-------|
| `aiven-database-url` | Secret text | Your Aiven DATABASE_URL |
| `jwt-key` | Secret text | Your JWT_KEY value |
| `smtp-user` | Secret text | Your SMTP_USER |
| `smtp-pass` | Secret text | Your SMTP_PASS |
| `ec2-ssh-key` | SSH Username with private key | Contents of your `url-shortener-key.pem` file |
| `github-token` | Username with password | GitHub username + Personal Access Token |

**How to add the EC2 SSH Key:**
1. Click **Add Credentials** → Kind: **SSH Username with private key**
2. ID: `ec2-ssh-key`
3. Username: `ubuntu`
4. Private Key: **Enter directly** → paste the entire content of your `.pem` file
   ```powershell
   # To view your pem file content:
   type "url-shortener-key.pem"
   ```
5. Click **Create**

---

### Alt-Step 6 — Create the Jenkinsfile for Laptop Approach

This Jenkinsfile is slightly different — it builds images on your **laptop** and then
SSHes into EC2 to pull and run them. Replace the existing `Jenkinsfile` content:

```groovy
pipeline {
    agent any

    environment {
        BACKEND_IMAGE  = "url-shortener-backend"
        FRONTEND_IMAGE = "url-shortener-frontend"
        IMAGE_TAG      = "${BUILD_NUMBER}"

        // Your EC2 details
        EC2_USER = "ubuntu"
        EC2_HOST = "3.17.73.31"  // ← Your EC2 Public IP

        // Secrets from Jenkins credential store
        DATABASE_URL = credentials('aiven-database-url')
        JWT_KEY      = credentials('jwt-key')
        SMTP_USER    = credentials('smtp-user')
        SMTP_PASS    = credentials('smtp-pass')
    }

    stages {

        // ─── STAGE 1: Pull Latest Code ──────────────────
        stage('Checkout') {
            steps {
                echo '📥 Pulling latest code from GitHub...'
                checkout scm
            }
        }

        // ─── STAGE 2: Build Docker Images (on Laptop) ───
        stage('Build Docker Images') {
            steps {
                echo '🐳 Building Docker images on local machine...'
                // On Windows Jenkins, use 'bat' instead of 'sh'
                bat """
                    docker build -t %BACKEND_IMAGE%:%IMAGE_TAG% -t %BACKEND_IMAGE%:latest ./Backend
                """
                bat """
                    docker build -t %FRONTEND_IMAGE%:%IMAGE_TAG% -t %FRONTEND_IMAGE%:latest ./Frontend
                """
                echo '✅ Docker images built!'
            }
        }

        // ─── STAGE 3: Health Check (on Laptop) ──────────
        stage('Health Validation') {
            steps {
                echo '🏥 Running health check...'
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
                // Wait for container to start
                bat "ping -n 12 127.0.0.1 > nul"

                // Check health endpoint
                bat "curl -f http://localhost:3001/health || exit 1"

                echo '✅ Health check PASSED!'
            }
            post {
                always {
                    bat "docker rm -f test-backend || true"
                }
            }
        }

        // ─── STAGE 4: Save Images as .tar files ──────────
        stage('Save Images') {
            steps {
                echo '💾 Saving Docker images to transfer to EC2...'
                bat "docker save %BACKEND_IMAGE%:latest -o backend.tar"
                bat "docker save %FRONTEND_IMAGE%:latest -o frontend.tar"
                echo '✅ Images saved!'
            }
        }

        // ─── STAGE 5: Transfer & Deploy to EC2 ───────────
        stage('Deploy to EC2') {
            steps {
                echo '🚀 Transferring images and deploying to EC2...'
                sshagent(['ec2-ssh-key']) {
                    // Copy image files to EC2
                    bat "scp -o StrictHostKeyChecking=no backend.tar %EC2_USER%@%EC2_HOST%:/home/ubuntu/"
                    bat "scp -o StrictHostKeyChecking=no frontend.tar %EC2_USER%@%EC2_HOST%:/home/ubuntu/"
                    bat "scp -o StrictHostKeyChecking=no docker-compose.yml %EC2_USER%@%EC2_HOST%:/home/ubuntu/url-shortener/"

                    // SSH in and load + run the containers
                    bat """
                        ssh -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "
                            echo '--- Loading Docker images ---'
                            docker load -i /home/ubuntu/backend.tar
                            docker load -i /home/ubuntu/frontend.tar

                            echo '--- Stopping old containers ---'
                            cd /home/ubuntu/url-shortener
                            docker compose down || true

                            echo '--- Starting new containers ---'
                            DATABASE_URL='%DATABASE_URL%' \\
                            JWT_KEY='%JWT_KEY%' \\
                            SMTP_USER='%SMTP_USER%' \\
                            SMTP_PASS='%SMTP_PASS%' \\
                            FRONTEND_URL='http://%EC2_HOST%' \\
                            docker compose up -d

                            echo '--- Verifying deployment ---'
                            sleep 10
                            curl -f http://localhost:3000/health && echo '✅ Deployment successful!'

                            echo '--- Cleaning up tar files ---'
                            rm -f /home/ubuntu/backend.tar /home/ubuntu/frontend.tar
                        "
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ PIPELINE SUCCESS! App is live at: http://${EC2_HOST}"
        }
        failure {
            echo '❌ Pipeline FAILED! Check the logs above.'
        }
        always {
            // Clean up local tar files
            bat "del /f backend.tar frontend.tar 2>nul || true"
            bat "docker system prune -f || true"
        }
    }
}
```

> 💡 **Key difference from EC2 Jenkins approach:**
> - Uses `bat` instead of `sh` (Windows commands vs Linux commands)
> - Saves Docker images as `.tar` files and copies them to EC2 via `scp`
> - EC2 loads the pre-built images instead of building from scratch
> - This saves EC2 from needing to build (which needs RAM) — it just runs the pre-built image

---

### Alt-Step 7 — Create Jenkins Pipeline Job

1. Open `http://localhost:8080` in your browser
2. Jenkins Dashboard → **"New Item"**
3. Name: `url-shortener-pipeline` → Select **"Pipeline"** → **OK**
4. Configuration:
   - **General:** Check "GitHub project" → enter your repo URL
   - **Build Triggers:** Check **"GitHub hook trigger for GITScm polling"**
   - **Pipeline:**
     - Definition: **Pipeline script from SCM**
     - SCM: **Git**
     - Repository URL: `https://github.com/YOUR_USERNAME/YOUR_REPO`
     - Credentials: Select your github-token
     - Branch: `*/main`
     - Script Path: `Jenkinsfile`
5. Click **Save**

---

### Alt-Step 8 — Set Up GitHub Webhook with ngrok

1. Start ngrok (keep this running while developing):
   ```powershell
   ngrok http 8080
   # Copy the URL: https://abc123xyz.ngrok-free.app
   ```

2. Go to your **GitHub repo** → **Settings** → **Webhooks** → **Add webhook**

3. Configure:
   - **Payload URL:** `https://abc123xyz.ngrok-free.app/github-webhook/`
   - **Content type:** `application/json`
   - **Events:** Just the push event

4. Click **Add webhook** → GitHub will send a test ping → you'll see ✅ green tick

---

### Alt-Step 9 — Prepare EC2 for Receiving Deployments

SSH into your EC2 server and prepare the folder:

```bash
ssh -i "url-shortener-key.pem" ubuntu@3.17.73.31

# Create the project folder
mkdir -p /home/ubuntu/url-shortener
cd /home/ubuntu/url-shortener

# EC2 only needs Docker installed — no Jenkins, no Node.js!
# Just verify Docker is running:
docker --version
```

> ✅ EC2 is now a **pure deployment target** — it only receives and runs pre-built images.
> All the heavy building happens on your laptop.

---

### Alt-Step 10 — Test the Full Alternative Pipeline

```powershell
# 1. Make sure ngrok is running
ngrok http 8080

# 2. Make sure Jenkins is running (check http://localhost:8080)

# 3. Push a code change
git add .
git commit -m "Test pipeline"
git push origin main

# 4. Watch Jenkins dashboard at http://localhost:8080
#    You'll see the pipeline trigger automatically!

# 5. After pipeline completes, visit your EC2 app:
#    http://3.17.73.31
```

---

## 📋 Alternative Approach Checklist

### Jenkins on Laptop ✅
- [ ] Install Java 17 on Windows
- [ ] Install Jenkins on Windows (MSI installer)
- [ ] Open Jenkins at `http://localhost:8080` and set up
- [ ] Install required plugins (Git, Pipeline, Docker Pipeline, SSH Agent)
- [ ] Add all secrets as Jenkins Credentials (including `.pem` key)
- [ ] Sign up for ngrok and connect auth token
- [ ] Run `ngrok http 8080` to get public URL

### GitHub Webhook ✅
- [ ] Add webhook in GitHub repo pointing to ngrok URL
- [ ] Verify webhook shows ✅ green tick in GitHub

### EC2 Deployment Target ✅
- [ ] EC2 has Docker installed
- [ ] Create `/home/ubuntu/url-shortener/` folder on EC2
- [ ] Copy `docker-compose.yml` to EC2
- [ ] Update `EC2_HOST` in Jenkinsfile with your EC2 IP

### Full Pipeline Test ✅
- [ ] Trigger first build manually in Jenkins
- [ ] Push code change → watch auto-deploy
- [ ] Visit `http://YOUR_EC2_IP` — app is live!

---

### 🆚 Which Approach Should You Use?

| Situation | Use This Approach |
|-----------|------------------|
| Learning DevOps concepts | ✅ **Laptop Jenkins** (saves EC2 resources) |
| Your laptop is always on while coding | ✅ **Laptop Jenkins** |
| You want 24/7 automated CI/CD | ✅ **Jenkins on EC2** |
| Your t2.micro is running out of RAM | ✅ **Laptop Jenkins** |
| Real production project | ✅ **Jenkins on EC2** or use GitHub Actions |

---

> 🎓 **You've completed the DevOps pipeline!**
> You now understand how real companies ship code to production.
> Next steps to explore: **Docker Hub** (store images), **AWS ECR** (Amazon's image registry),
> **Terraform** (infrastructure as code), **Kubernetes** (container orchestration at scale).
