# Production Deployment Guide

## Architecture

```
Internet → nginx (:80/:443)
              ├─ /api/, /admin/  → backend:8000  (gunicorn)
              ├─ /ws/            → channels:8001  (daphne, WebSocket)
              ├─ /static/        → served directly from volume
              ├─ /media/         → served directly from volume
              └─ /               → frontend:3000  (next start)
           certbot (auto-renews SSL certs)
           postgres, redis, celery-worker, celery-beat (internal only)
```

Only **nginx** is exposed to the internet (ports 80 and 443). All other services communicate on an internal Docker network (`precept-net`).

## Prerequisites

- Docker and Docker Compose installed
- Domain `precept.online` pointing to the server's IP
- Ports 80 and 443 open on the firewall

## Configuration

### Environment Variables

Copy and edit the example env file:

```bash
cp .env.example .env
```

Required production values in `.env`:

| Variable | Example |
|----------|---------|
| `DJANGO_SECRET_KEY` | A strong random string |
| `DJANGO_SETTINGS_MODULE` | `config.settings.production` |
| `ALLOWED_HOSTS` | `precept.online,www.precept.online` |
| `POSTGRES_DB` | `precept_db` |
| `POSTGRES_USER` | `precept_user` |
| `POSTGRES_PASSWORD` | A strong random password |
| `CORS_ALLOWED_ORIGINS` | `https://precept.online` |
| `NEXT_PUBLIC_API_URL` | `https://precept.online/api` |
| `NEXT_PUBLIC_WS_URL` | `wss://precept.online/ws` |

The frontend URLs (`NEXT_PUBLIC_*`) are baked into the Next.js build at image build time via build args in `docker-compose.prod.yml`.

## Deployment Steps

### 1. Build production images

```bash
make prod-build
```

This builds three images using multi-stage Dockerfiles:

- **backend** (`backend/Dockerfile.prod`): Python 3.12 slim, production deps only, static files collected, runs gunicorn
- **frontend** (`frontend/Dockerfile.prod`): Node 20 alpine, Next.js standalone build, runs `node server.js`
- Other services use official images (postgres, redis, nginx, certbot)

### 2. Obtain SSL certificate (first time only)

```bash
CERTBOT_EMAIL=you@example.com sudo -E ./nginx/init-letsencrypt.sh
```

This script:
1. Creates a temporary self-signed certificate so nginx can start
2. Starts nginx to serve the ACME challenge
3. Requests a real certificate from Let's Encrypt
4. Reloads nginx with the valid certificate

### 3. Start all services

```bash
make prod-up
```

### 4. Verify

```bash
make prod-logs
```

Check that all 9 services are running and healthy:
- `postgres`, `redis` — infrastructure
- `backend` — runs migrations on startup, then gunicorn
- `celery-worker`, `celery-beat` — background task processing
- `channels` — WebSocket via daphne
- `frontend` — Next.js standalone server
- `nginx` — reverse proxy with SSL
- `certbot` — auto-renews certificates every 12 hours

## Makefile Targets

| Command | Description |
|---------|-------------|
| `make prod-build` | Build all production Docker images |
| `make prod-up` | Start production stack (detached) |
| `make prod-down` | Stop production stack |
| `make prod-logs` | Tail logs from all production services |
| `make prod-shell` | Open Django shell in production backend |

## Files Overview

```
├── backend/
│   ├── Dockerfile          # Development image
│   └── Dockerfile.prod     # Production multi-stage image (gunicorn)
├── frontend/
│   ├── Dockerfile          # Development image
│   └── Dockerfile.prod     # Production multi-stage image (standalone)
├── nginx/
│   ├── nginx.conf          # Reverse proxy config (SSL, WebSocket, static)
│   └── init-letsencrypt.sh # First-time SSL certificate setup
├── docker-compose.yml      # Development stack
├── docker-compose.prod.yml # Production stack
├── .env                    # Environment variables (not committed)
└── .env.example            # Template for .env
```

## SSL Certificate Renewal

The `certbot` container automatically attempts renewal every 12 hours. Certificates are stored in the `certbot_conf` Docker volume and shared read-only with nginx.

## Volumes

| Volume | Purpose |
|--------|---------|
| `postgres_data` | PostgreSQL database files |
| `redis_data` | Redis append-only persistence |
| `static_files` | Django collected static files (shared with nginx) |
| `media_files` | User-uploaded media (shared with nginx) |
| `certbot_conf` | SSL certificates from Let's Encrypt |
| `certbot_www` | ACME challenge files for certificate verification |

## Security Notes

- Production Django settings enable: HSTS, secure cookies, SSL redirect, CSRF protection
- `SECURE_PROXY_SSL_HEADER` is configured so Django trusts nginx's `X-Forwarded-Proto` header
- Nginx adds security headers: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Strict-Transport-Security`
- Backend and frontend containers run as non-root users
- No service except nginx exposes ports to the host
