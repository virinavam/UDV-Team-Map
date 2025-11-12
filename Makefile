# Makefile для Alembic с Docker + Poetry

CONTAINER=udv-team-map-backend-1
ALEMBIC=app/alembic.ini

current:
	docker exec $(CONTAINER) poetry run alembic -c $(ALEMBIC) current

history:
	docker exec $(CONTAINER) poetry run alembic -c $(ALEMBIC) history

upgrade:
	docker exec $(CONTAINER) poetry run alembic -c $(ALEMBIC) upgrade head

downgrade:
ifeq ($(strip $(REVISION)),)
	$(error REVISION is not set. Usage: make downgrade REVISION=<revision_id>)
endif
	docker exec $(CONTAINER) poetry run alembic -c $(ALEMBIC) downgrade $(REVISION)

downgrade-base:
	docker exec $(CONTAINER) poetry run alembic -c $(ALEMBIC) downgrade base

revision:
ifeq ($(strip $(NAME)),)
	$(error NAME is not set. Usage: make revision NAME="migration_name")
endif
	@echo "Generating migration: $(NAME)"
	docker exec $(CONTAINER) poetry run alembic -c $(ALEMBIC) revision --autogenerate -m "$(NAME)"
	@echo "Setting write permissions for last generated migration..."
	docker exec $(CONTAINER) sh -c 'f=$$(ls -t /app/app/alembic/versions/*.py | head -1) && chmod 777 "$$f"'

up:
	docker compose up -d
	docker exec $(CONTAINER) poetry run alembic -c $(ALEMBIC) upgrade head

up-rebuild:
	docker compose build --no-cache
	docker compose up -d
	docker exec $(CONTAINER) poetry run alembic -c $(ALEMBIC) upgrade head

down:
	docker compose down

test:
	docker exec -e PYTHONPATH=/app -w /app $(CONTAINER) poetry run pytest -v --disable-warnings
