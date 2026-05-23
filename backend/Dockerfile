# Backend Dockerfile (mediasoup prototype)
FROM node:18-bullseye-slim

WORKDIR /usr/src/app

# Install build deps for mediasoup native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    git \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./
RUN npm ci --no-audit --no-fund --production

COPY backend/ .

ENV NODE_ENV=production
EXPOSE 8000
# mediasoup UDP ports
# NOTE: docker may require explicit port range mapping in docker-compose
EXPOSE 20000-40000/udp

CMD ["node", "src/app.js"]
