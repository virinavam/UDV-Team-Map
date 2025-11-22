FROM python:3.12.12-alpine3.22

RUN apk add --no-cache libpq && pip install poetry

WORKDIR /app

COPY pyproject.toml poetry.lock setup.cfg /app/
RUN poetry config virtualenvs.in-project false
RUN poetry install --no-root --only main

COPY ./app /app/app

EXPOSE 8000

CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
