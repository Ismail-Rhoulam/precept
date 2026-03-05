.PHONY: up down build migrate seed shell test prod-build prod-up prod-down prod-logs prod-shell reload-front reload-back

# ── Development ───────────────────────────────────────────────
up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

migrate:
	docker compose exec backend python manage.py migrate --database=infra
	docker compose exec backend python manage.py migrate --database=default

seed:
	docker compose exec backend python manage.py seed_data

shell:
	docker compose exec backend python manage.py shell

test:
	docker compose exec backend pytest

frontend-dev:
	cd frontend && npm run dev

backend-dev:
	cd backend && python manage.py runserver

# ── Production ────────────────────────────────────────────────
prod-build:
	docker compose -f docker-compose.prod.yml build

prod-up:
	docker compose -f docker-compose.prod.yml up -d

prod-down:
	docker compose -f docker-compose.prod.yml down

prod-logs:
	docker compose -f docker-compose.prod.yml logs -f

prod-shell:
	docker compose -f docker-compose.prod.yml exec backend python manage.py shell

reload-front:
	docker compose -f docker-compose.prod.yml build frontend
	docker compose -f docker-compose.prod.yml up -d frontend

reload-back:
	docker compose -f docker-compose.prod.yml build backend
	docker compose -f docker-compose.prod.yml up -d backend channels
