FROM python:3.12-slim-bookworm AS produccion

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN groupadd --system --gid 10001 mascota \
    && useradd --system --uid 10001 --gid mascota --home-dir /app mascota \
    && mkdir -p /datos \
    && chown mascota:mascota /datos

COPY requirements.deploy.txt ./
RUN pip install --no-cache-dir --requirement requirements.deploy.txt

COPY --chown=mascota:mascota app ./app

USER mascota
EXPOSE 8000
CMD ["sh", "-c", "umask 077 && chmod 700 /datos && if [ -f /datos/mascota-al-dia.db ]; then chmod 600 /datos/mascota-al-dia.db; fi && exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1 --proxy-headers --forwarded-allow-ips '*' "]
