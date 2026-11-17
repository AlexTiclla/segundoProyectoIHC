# Pruebas e2e y 100 % de cobertura del código del fork

**Aplicación:** Mascota al Día
**Asignatura:** Interacción Humano-Computadora (IHC)
**Fecha:** 16 de noviembre de 2026
**Entorno probado:** FastAPI + Next.js 16 (compilación de producción) + SQLite local + Playwright 1.64 (Chromium, Firefox y WebKit en Linux)
**Rama:** `test/e2e-cobertura`, partiendo de `feat/tarea-10-eliminar-cuenta`
**Plan:** [`docs/plan-e2e-cobertura.md`](../docs/plan-e2e-cobertura.md)

## Objetivo

> *"La suite e2e corre y el código que agregaron en el fork tiene 100 % cobertura, con el reporte en el repo."*

- **"Código del fork"**: las líneas que cambiaron entre `upstream/main` (repositorio original) y esta rama, en `backend/app/` y en `frontend/{app,componentes,lib}` y `frontend/proxy.ts`.
- **"100 % de cobertura"**: medida solo con la suite **e2e** (Playwright contra el backend y el frontend reales), no con las pruebas unitarias de pytest.
- **"Reporte en el repo"**: [`docs/reportes/`](../docs/reportes/README.md).

## Cómo correrlo

```bash
pnpm install
pnpm test:e2e     # suite completa en los 3 navegadores → docs/reportes/e2e
pnpm cobertura    # suite en Chromium con cobertura → docs/reportes/cobertura
```

Playwright levanta solo su backend (puerto 8100, base SQLite desechable `backend/e2e.db`) y su frontend (compilación de producción en el puerto 3100), sin chocar con los servidores de desarrollo.

## Antes y después

| | Antes (16/11, mañana) | Después |
|---|---|---|
| Pruebas por navegador | 59 | 91 |
| Resultado (3 navegadores) | 159 pasan, **18 fallan**, **6 omitidas** | **273 pasan**, 0 fallan, 0 omitidas |
| Cobertura del código del fork | no se medía | **100 %** (1 133 de 1 133 líneas, con la rama de despliegue) |
| Reporte en el repo | no (`/playwright-report/` ignorado) | `docs/reportes/` |

## Qué se corrigió para que la suite corra

| Problema | Causa | Solución |
|---|---|---|
| 12 pruebas vencían su espera de 5 s (solo Firefox y WebKit) | La suite corría contra `next dev`, que compila al vuelo, con los 3 navegadores en paralelo | `playwright.config.ts` levanta su propio backend y un frontend de producción; 3 workers; esperas de 10 s |
| 500 al registrar cuentas, de forma intermitente | SQLite respondía `database is locked` con varias pruebas a la vez | **Error real de la app.** `backend/app/base_datos.py` activa el modo WAL y espera hasta 30 s, solo con SQLite |
| 6 capturas visuales | Las de WebKit no existían; las de Firefox eran de antes de los enlaces Compartir, Analítica y Mi cuenta | Se revisó la diferencia y se regeneraron |
| 6 pruebas omitidas | `cuidados-vencidos.spec.ts` solo corría con `E2E_SQLITE_LOCAL=1` | La configuración la activa con su base desechable |

## Cómo se mide la cobertura

1. **Backend:** uvicorn corre bajo `coverage run` (`backend/.coveragerc`).
2. **Frontend en el navegador:** la fixture automática de [`tests/base.ts`](../tests/base.ts) mide con V8 cada página de Chromium, también las de otras personas (Juan, Eva). Antes de cada `page.goto`/`page.reload` guarda lo medido, porque un documento nuevo descarta los contadores del anterior.
3. **Frontend en el servidor:** Next corre con `NODE_V8_COVERAGE` y compilado con source maps y sin minificar, solo en esta corrida.
4. **Unión y mapeo:** monocart une ambas fuentes y las lleva a los `.ts`/`.tsx` originales.
5. **Solo el diff:** `diff-cover --compare-branch=upstream/main --fail-under=100`. diff-cover cuenta como faltante una línea con una rama sin ejecutar, no solo una línea entera.
6. **Protección:** el script falla si un archivo del fork no tiene datos de cobertura, porque diff-cover lo saltaría sin avisar.

La cobertura nativa de V8 solo existe en Chromium. Firefox y WebKit corren la misma suite para validar que pasa, pero no aportan cobertura.

## Pruebas nuevas (de 89 % a 100 %)

La primera medición dio **89 %** (faltaban 112 líneas). Se agregaron 30 pruebas por navegador (de 61 a 91):

| Spec | Qué cubre |
|---|---|
| [`reglas-negocio.spec.ts`](../tests/reglas-negocio.spec.ts) (nuevo) | Reglas que la interfaz no deja provocar pero la API debe cumplir: invitar a un correo sin cuenta, responder una invitación ajena o dos veces, revocar dos veces, cuidado inexistente o ajeno (404 sin revelar que existe), repetición inválida, fecha pasada, realizar dos veces, reprogramar a la misma fecha / sin motivo / "las siguientes" sin repetición, omitir un cuidado no vencido |
| [`errores-servidor.spec.ts`](../tests/errores-servidor.spec.ts) (nuevo) | Qué ve la persona si el servidor falla: sin conexión, sesión vencida (lleva a ingresar con el aviso), errores 500 al marcar realizado, al reprogramar, al cargar accesos y analítica, y al eliminar la cuenta; respuestas con datos inesperados (mensaje genérico) |
| [`filtros.spec.ts`](../tests/filtros.spec.ts) (nuevo) | Buscar por nombre y quitar el filtro, próximos 7 días, rango de fechas (desde, hasta, ambas), panel de filtros en pantalla de celular |
| `cuidados-vencidos.spec.ts` | Omitir un cuidado recurrente programa el siguiente; motivo de solo espacios; error del servidor al omitir |
| `cuidados.spec.ts` | Especie escrita a mano ("Otra") y su edición; menú de un cuidado realizado |
| `cuidados-compartidos.spec.ts` | Rechazar una invitación |
| `cuenta.spec.ts` | Descargar los datos en CSV con todas sus secciones; cancelar la eliminación de la cuenta |

Con eso, el código del fork queda cubierto en el **100 %**: [`docs/reportes/cobertura/diff-cover.html`](../docs/reportes/cobertura/diff-cover.html).

## Exclusiones justificadas

Solo se excluyó código que las pruebas e2e **no pueden ejecutar**. Cada exclusión tiene un comentario en el código:

| Código | Por qué no se puede ejecutar desde la suite e2e |
|---|---|
| `mascota_servicio.py` líneas 63, 83 y 179, `cuenta_servicio.py` líneas 19 y 87: `raise ErrorDeNegocio("No se encontró el usuario"/"la cuenta", 404)` | Toda ruta protegida pasa antes por `obtener_usuario_actual`, que responde 401 si la cuenta no existe o está eliminada. Por HTTP nunca se llega a estas comprobaciones defensivas, que sí prueban los tests de pytest. |
| `mascota_servicio.py` línea 236: motivo de omisión vacío | El esquema `MascotaOmitir` recorta espacios y exige al menos 1 carácter: un motivo vacío se rechaza con 422 antes de llegar al servicio. |
| `config.py`: `validar_produccion` y el `except` de `validar_zona_horaria`; `routers/auth.py`: el 503 de recuperar con `RECUPERACION_SIMULADA=false` | Solo se ejecutan con la configuración de producción (o con una zona horaria inválida, con la que el backend no arranca). La suite e2e corre con `ENTORNO=desarrollo`; los prueba `backend/tests/test_seguridad_despliegue.py`. |
| `frontend/app/registro/page.tsx` y `frontend/app/recuperar/page.tsx` | Son páginas estáticas: Next las ejecuta una sola vez en `next build` y luego solo sirve su HTML, así que la cobertura no ve ese código. Las pruebas sí abren esas pantallas y verifican lo que muestran (`acceso.spec.ts`, `visual.spec.ts`). |

## Resultados

- **Suite completa:** 273/273 pruebas en verde en Chromium, Firefox y WebKit → [`docs/reportes/e2e/index.html`](../docs/reportes/e2e/index.html).
- **Cobertura del diff:** 100 % (1 133 líneas, 0 faltantes) → [`docs/reportes/cobertura/diff-cover.md`](../docs/reportes/cobertura/diff-cover.md).
- **Pruebas del backend (pytest):** 100/100 en verde.

## Integración continua (GitHub Actions)

El workflow `.github/workflows/playwright.yml` falló en todas sus corridas anteriores: ejecutaba `playwright test` sin backend ni frontend levantados (`ERR_CONNECTION_REFUSED` en `localhost:3000`). Ahora tiene dos trabajos:

| Trabajo | Qué hace |
|---|---|
| Backend (pytest) | Python 3.13, instala `backend/requirements.txt` y corre pytest |
| E2E (Playwright, 3 navegadores) | Corre dentro de la imagen oficial `mcr.microsoft.com/playwright:v1.64.1-noble` (navegadores y fuentes fijos). Crea `backend/.venv` con uv, instala la raíz con pnpm y `frontend/` con npm, instala los navegadores y corre la suite; `playwright.config.ts` levanta solo sus servidores. Sube como artefacto el reporte (`docs/reportes/e2e`) y `test-results/` |

Las capturas visuales tienen referencias propias para el CI (`*-ci.png`, ver `snapshotPathTemplate` en `playwright.config.ts`): Ubuntu 24.04 dibuja el "✓" con otra fuente del sistema y corre unos píxeles los botones, sin cambiar el diseño. Se generan con la misma imagen oficial de Playwright que usa el CI: un primer intento con un contenedor `ubuntu:24.04` genérico no coincidió con el runner de GitHub, que tiene otras fuentes instaladas. En esa imagen la suite completa pasa 273/273 con `CI=true`.

## Integración con la rama de despliegue (`feat/deploy-aws-mascota-dia`)

Se unió la rama de despliegue en AWS (Docker, Caddy, configuración segura de producción, zona horaria `America/La_Paz`, Next 16.4.6 y la fuente `geist`) para comprobar que no rompe la suite ni baja la cobertura.

| Punto | Resultado |
|---|---|
| Conflictos | 3, resueltos: `mascota_servicio.py` (se conserva `hoy_local()` y la exclusión), `next.config.ts` (`output: "standalone"` + la configuración de la suite), `playwright.config.ts` (puertos propios de la suite + `PLAYWRIGHT_BASE_URL` para probar una app ya desplegada sin levantar servidores) |
| Zona horaria | El backend de la suite usa la zona de la máquina (`ZONA_HORARIA`), para que su "hoy" sea el mismo que el de las pruebas |
| Cobertura | Las líneas nuevas que la suite puede ejecutar están cubiertas; se agregaron 2 reglas a `reglas-negocio.spec.ts` (editar un cuidado realizado, reprogramar a una fecha pasada) |
| Capturas visuales | Cambió el trazado de las letras (Geist ahora viene del paquete `geist`, no de Google Fonts); el diseño es igual. Se regeneraron |
| Despliegue | `frontend/.dockerignore` excluye `.next-e2e`. Con `ENTORNO=produccion`: `/salud` responde, `/docs` da 404, recuperar da 503 y SQLite queda en modo WAL (mejora la concurrencia también en la EC2). `next build` compila con `output: standalone`. La imagen Docker no se construyó en esta máquina (sin permiso sobre Docker) |
