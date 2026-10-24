# Backend Dockerfile (mediasoup prototype)
FROM node:22-bookworm

WORKDIR /usr/src/app

# Use the official image's CA bundle for HTTPS package transport.
RUN sed -i 's|http://deb.debian.org/debian$|https://ftp.debian.org/debian|;s|http://deb.debian.org|https://deb.debian.org|g' /etc/apt/sources.list.d/debian.sources \
    && apt-get -o Acquire::https::Timeout=15 -o Acquire::Retries=2 update \
    && apt-get -o Acquire::https::Timeout=15 -o Acquire::https::Pipeline-Depth=0 -o Acquire::Retries=2 install -y --no-install-recommends \
    build-essential \
    python3 \
    git \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --no-audit --no-fund --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 8000
# mediasoup UDP ports
# NOTE: docker may require explicit port range mapping in docker-compose
EXPOSE 20000-40000/udp

CMD ["node", "src/app.js"]
