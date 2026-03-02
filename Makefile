.PHONY: up down build migrate seed shell test

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
