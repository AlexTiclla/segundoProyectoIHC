# MASCOTA AL DÍA

Organiza las vacunas, controles y cuidados de tus mascotas en un solo lugar.

## TECNOLOGÍAS

* **Next.js** — Frontend
* **FastAPI** — Backend
* **Neon (PostgreSQL)** — Base de datos

## VERSIONES UTILIZADAS DURANTE EL DESARROLLO:

* **Node.js:** v22.14.0
* **Python:** v3.13.3

## INSTALACIÓN Y COMANDOS

### Backend

Desde la raíz del proyecto:

1. Entrar a la carpeta `backend`.
2. Crear y activar el entorno virtual `.venv`.
3. Instalar las dependencias:

```bash
pip install -r requirements.txt
```

4. Copiar el archivo `.env-example` como `.env` y configurar las variables de entorno.
5. Iniciar el servidor:

```bash
fastapi dev app/main.py
```

El backend estará disponible en:

`http://127.0.0.1:8000`

### Frontend

En otra terminal:

1. Entrar a la carpeta `frontend`.
2. Instalar las dependencias:

```bash
npm install
```

3. Iniciar el servidor de desarrollo:

```bash
npm run dev
```

El frontend estará disponible en:

`http://localhost:3000`

## VARIABLES DE ENTORNO DEL BACKEND

El backend utiliza las siguientes variables de entorno:

* `URL_BASE_DATOS`
* `SECRETO_JWT`
* `MINUTOS_SESION`

Estas variables deben configurarse en el archivo `.env`, tomando como referencia el archivo `.env-ejemplo`.

## VARIABLES DE ENTORNO DEL FRONTEND

El frontend utiliza la siguiente variable de entorno:

* `URL_BASE`

Esta variable debe configurarse en el archivo `.env`, tomando como referencia el archivo `.env-ejemplo`.

## PRUEBAS E2E Y COBERTURA

Las pruebas e2e (Playwright) están en `tests/` y se corren desde la raíz con **pnpm**. Playwright levanta solo un backend (puerto 8100, con una base SQLite desechable) y un frontend de producción (puerto 3100), así que no hace falta tener los servidores de desarrollo encendidos.

```bash
pnpm install
pnpm exec playwright install --with-deps
pnpm test:e2e     # suite completa en Chromium, Firefox y WebKit
pnpm cobertura    # suite en Chromium midiendo la cobertura del código del fork
```

`pnpm cobertura` necesita `coverage` y `diff_cover` en el entorno virtual del backend (están en `backend/requirements.txt`) y el remoto `upstream` con el repositorio original. Falla si el código que cambió el fork no queda cubierto al 100 %.

Los reportes quedan en el repo, en [`docs/reportes/`](docs/reportes/README.md): el de Playwright, el de `diff-cover` y la cobertura completa de backend y frontend. El detalle está en [`evidencias/pruebas-e2e-cobertura.md`](evidencias/pruebas-e2e-cobertura.md).

## SISTEMA DE DISEÑO

* **Figma:** [Mascota Dia](https://www.figma.com/design/Pq8Q35LoYXwrKROyiItaCe/Mascota-Dia): portada, fundaciones (logo, paleta, tipografía, sombras), 11 componentes con variantes y estados, y las pantallas de los 7 flujos armadas con esos componentes.
* **Tokens en el código:** `frontend/app/globals.css` (bloque `@theme inline`), con los mismos nombres que las variables de Figma (`color/peligro` ↔ `--color-peligro`). Ninguna pantalla usa colores fijos.
* **Tabla componente ↔ archivo:** [docs/tabla-componentes.md](docs/tabla-componentes.md).
* **Inventario de interfaz e inconsistencias:** [docs/inventario-interfaz.md](docs/inventario-interfaz.md).
* **Plan y registro de construcción:** [docs/plan-sistema-diseno-figma.md](docs/plan-sistema-diseno-figma.md).
