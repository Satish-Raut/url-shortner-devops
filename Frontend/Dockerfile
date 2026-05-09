
# ─────────────────────────────────────────────
# Stage 1: Build the React app
# ─────────────────────────────────────────────

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build the React app — creates /app/dist folder with static HTML/CSS/JS
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

