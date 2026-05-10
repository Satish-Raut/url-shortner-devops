
# ─────────────────────────────────────────────
# Stage 1: Build the React app
# ─────────────────────────────────────────────

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Bake VITE_API_URL into the React bundle at build time
# /api is the nginx reverse proxy path that forwards to the backend container
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

# Build the React app
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Serve with Nginx (lightweight web server)
# ─────────────────────────────────────────────

FROM nginx:alpine

# Copy built files from Stage 1 into nginx's serving folder

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

