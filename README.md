
# MASCOTA AL DÍA

[![Pruebas](https://github.com/AlexTiclla/segundoProyectoIHC/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/AlexTiclla/segundoProyectoIHC/actions/workflows/playwright.yml)

Organiza las vacunas, controles y cuidados de tus mascotas en un solo lugar.


## TECNOLOGÍAS

* **Next.js** — Frontend
* **FastAPI** — Backend
* **SQLite** — Base de datos (persistencia mediante volumen Docker en AWS)

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
pnpm test --coverage   # pruebas unitarias del backend (pytest) con cobertura → coverage/
pnpm test:e2e     # suite completa en Chromium, Firefox y WebKit → playwright-report/
pnpm cobertura    # suite en Chromium midiendo la cobertura del código del fork
```

`pnpm cobertura` necesita `coverage` y `diff_cover` en el entorno virtual del backend (están en `backend/requirements.txt`) y el remoto `upstream` con el repositorio original. Falla si el código que cambió el fork no queda cubierto al 100 %.

Los reportes quedan en el repo: el de Playwright en [`playwright-report/`](playwright-report/index.html), y en [`docs/reportes/`](docs/reportes/README.md) el de `diff-cover` y la cobertura completa de backend y frontend. El detalle está en [`evidencias/pruebas-e2e-cobertura.md`](evidencias/pruebas-e2e-cobertura.md).

### Resultados verificados

| Evaluación | Resultado |
|---|---|
| Pruebas backend (pytest) | 100/100 aprobadas |
| Pruebas E2E (Playwright) | 273/273 aprobadas |
| Navegadores | Chromium, Firefox y WebKit |
| Cobertura diferencial del fork | 100 % (1.133 líneas, 0 faltantes) |
| GitHub Actions | Última ejecución exitosa |

### Integración continua (CI)

El proyecto utiliza GitHub Actions para ejecutar
automáticamente las pruebas cuando se realizan cambios
en `main` o se crean Pull Requests hacia esa rama.

El workflow `.github/workflows/playwright.yml`
ejecuta las pruebas backend con pytest y las pruebas
E2E con Playwright en Chromium, Firefox y WebKit.

Los resultados pueden consultarse desde la insignia
ubicada al inicio de este README.

**Evidencias:**
- [Última ejecución de GitHub Actions](https://github.com/AlexTiclla/segundoProyectoIHC/actions/workflows/playwright.yml)
- [Reporte de cobertura diferencial](docs/reportes/cobertura/diff-cover.md)
- [Detalle de pruebas y cobertura](evidencias/pruebas-e2e-cobertura.md)

**Nota:** La cobertura del 100 % corresponde al reporte diferencial guardado en el repositorio. Actualmente el workflow ejecuta pytest y Playwright, pero no recalcula la cobertura diferencial en cada push.


## SISTEMA DE DISEÑO

* **Figma:** [Mascota al Día](https://www.figma.com/design/Pq8Q35LoYXwrKROyiItaCe/Mascota-Dia): portada, fundaciones (logo, paleta, tipografía, sombras), 11 componentes con variantes y estados, y las pantallas de los 7 flujos armadas con esos componentes.
* **Tokens en el código:** `frontend/app/globals.css` (bloque `@theme inline`), con los mismos nombres que las variables de Figma (`color/peligro` ↔ `--color-peligro`). Ninguna pantalla usa colores fijos.
* **Tabla componente ↔ archivo:** [docs/tabla-componentes.md](docs/tabla-componentes.md).
* **Inventario de interfaz e inconsistencias:** [docs/inventario-interfaz.md](docs/inventario-interfaz.md).
* **Plan y registro de construcción:** [docs/plan-sistema-diseno-figma.md](docs/plan-sistema-diseno-figma.md).
