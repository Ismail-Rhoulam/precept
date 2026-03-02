# Production Deployment Guide

## Architecture

```
Internet → nginx (server-level, :80/:443 with SSL)
              ├─ /api/, /admin/  → 127.0.0.1:8000  (gunicorn)
              ├─ /ws/            → 127.0.0.1:8001  (daphne, WebSocket)
              └─ /               → 127.0.0.1:3000  (next start)

Docker services (docker-compose.prod.yml):
  ├─ backend      :8000  — Django + gunicorn (runs migrations on startup)
  ├─ channels     :8001  — Django Channels + daphne (WebSocket)
  ├─ frontend     :3000  — Next.js standalone
  ├─ celery-worker       — background task processing
  ├─ celery-beat         — scheduled tasks
  ├─ postgres            — PostgreSQL 16 (internal only)
  └─ redis               — Redis 7 with AOF persistence (internal only)
```

Nginx runs on the host server (not in Docker) and handles SSL termination via Let's Encrypt. Docker services expose ports 8000, 8001, and 3000 to the host.

## Prerequisites

- Docker and Docker Compose installed
- Nginx installed on the server with SSL configured for `precept.online`
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

This builds images using multi-stage Dockerfiles:

- **backend** (`backend/Dockerfile.prod`): Python 3.12 slim, production deps only, static files collected, runs gunicorn
- **frontend** (`frontend/Dockerfile.prod`): Node 20 alpine, Next.js standalone build, runs `node server.js`
- Other services use official images (postgres, redis)

### 2. Start all services

```bash
make prod-up
```

### 3. Verify

```bash
make prod-logs
```

Check that all 7 services are running:
- `postgres`, `redis` — infrastructure (internal, no host ports)
- `backend` — runs migrations on startup, then gunicorn (:8000)
- `celery-worker`, `celery-beat` — background task processing
- `channels` — WebSocket via daphne (:8001)
- `frontend` — Next.js standalone server (:3000)

### 4. Nginx (server-level)

The nginx config is at `/etc/nginx/sites-available/precept`. It proxies:

- `/api/`, `/admin/` → `127.0.0.1:8000` (backend)
- `/ws/` → `127.0.0.1:8001` (channels, WebSocket upgrade)
- `/` → `127.0.0.1:3000` (frontend)

```bash
sudo nginx -t && sudo systemctl reload nginx
```

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
├── docker-compose.yml      # Development stack
├── docker-compose.prod.yml # Production stack
├── .env                    # Environment variables (not committed)
└── .env.example            # Template for .env
```

Server-managed (outside repo):
- `/etc/nginx/sites-available/precept` — nginx reverse proxy config
- `/etc/letsencrypt/live/precept.online/` — SSL certificates (Certbot)

## Volumes

| Volume | Purpose |
|--------|---------|
| `postgres_data` | PostgreSQL database files |
| `redis_data` | Redis append-only persistence |
| `static_files` | Django collected static files |
| `media_files` | User-uploaded media |

## Security Notes

- Production Django settings enable: HSTS, secure cookies, SSL redirect, CSRF protection
- `SECURE_PROXY_SSL_HEADER` is configured so Django trusts nginx's `X-Forwarded-Proto` header
- Nginx adds security headers: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Strict-Transport-Security`
- Backend and frontend containers run as non-root users
- Only backend (:8000), channels (:8001), and frontend (:3000) expose ports to the host
- Postgres and Redis are internal to the Docker network only
