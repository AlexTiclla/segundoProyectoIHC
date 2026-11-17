# Plan: suite E2E en verde y 100 % de cobertura del código del fork

> Requisito (diapositiva): *"La suite e2e corre y el código que agregaron en el fork tiene 100 % cobertura, con el reporte en el repo."*
>
> Fecha de corte: **miércoles 18/11, 23:59** (la misma del plan de diseño en `docs/plan-sistema-diseno-figma.md`).

## 1. Interpretación

- **"Código del fork"** = las diferencias entre `upstream/main` (repositorio original de Alejandrodelosrios) y nuestro fork (`origin`). Hoy son unas 1 500 líneas en `backend/app/` y una parte grande de `frontend/` (`componentes/`, `lib/api.ts`, `lib/*.ts`, `app/*/page.tsx`, `proxy.ts`).
- **"100 % de cobertura"** se mide sobre ese diff con **`diff-cover`**, no sobre todo el proyecto.
- **"Reporte en el repo"** = el reporte HTML de Playwright y el de cobertura, subidos al repositorio (hoy `/playwright-report/` está en `.gitignore`).

**Decisión pendiente con el docente:** ¿la cobertura del backend puede sumar **pytest + e2e**, o tiene que ser **solo e2e**? Se planea **solo e2e**, que es lo más estricto. Si se acepta la suma, basta con combinar los dos `.coverage` (`coverage combine`).

## 2. Estado actual (16/11)

Reporte de Playwright: **177 pruebas — 159 pasan, 18 fallan, 6 omitidas.**

| Grupo | Pruebas | Causa probable |
|---|---|---|
| Visuales (`visual.spec.ts`) | 6 (Firefox ×3, WebKit ×3) | En WebKit faltan las capturas base (los 3 `.png` sin seguimiento). En Firefox cambia cómo se dibuja el texto: 3 y 7 px distintos en ingreso y registro, **643 px en la lista vacía** (hay que revisarla a mano). |
| Tiempos de espera | 12 (`acceso`, `cuenta`, `cuidados`, `cuidados-compartidos`) | Solo fallan en WebKit y Firefox, nunca en Chromium, y cada navegador falla en pruebas distintas. Todas vencen la espera de 5 s tras una acción del servidor ("Cuenta creada…", "Estado: Revocado", el título de la mascota). Los 3 navegadores corren `fullyParallel` contra `next dev` (compila al vuelo) y SQLite: es carga, no un error determinista. |
| Omitidas | 6 (`cuidados-vencidos.spec.ts`) | Solo corren con `E2E_SQLITE_LOCAL=1`. |

Lo que falta:

- No hay ninguna medición de cobertura (ni backend ni frontend).
- El reporte no puede quedar en el repo (`.gitignore`).
- No hay scripts en `package.json` para correr la suite ni la cobertura.

## 3. Fases

### Fase 0 — Rama

- Crear `test/e2e-cobertura` desde `feat/tarea-10-eliminar-cuenta`.
- `docs/codigo-comentado` queda aislada y no se fusiona en este trabajo.

### Fase 1 — Suite estable, 0 fallos y 0 omitidas

1. **`webServer` en `playwright.config.ts`** para que Playwright levante sus propios servidores:
   - backend: `uvicorn app.main:app` con `URL_BASE_DATOS=sqlite:///./e2e.db` (base desechable, se borra antes de cada corrida; agregar `backend/e2e.db` al `.gitignore`);
   - frontend: `next build && next start` (producción, sin compilación al vuelo).
2. **`E2E_SQLITE_LOCAL=1`** en esa configuración, para que `cuidados-vencidos.spec.ts` corra (la base es local y desechable, así que es seguro).
3. **Ajustes de la configuración:** `workers` limitado (2 o 3), `expect.timeout` en unos 10 s y `trace: 'retain-on-failure'` para diagnosticar.
4. **Visuales:**
   - revisar a mano la diferencia de 643 px en `lista-vacia-firefox` para no ocultar un cambio real;
   - regenerar las capturas de Firefox y WebKit con `--update-snapshots` en el entorno final y subirlas;
   - si hace falta, una tolerancia pequeña (`maxDiffPixelRatio`) en `toHaveScreenshot`.
5. **Lo que siga fallando sin carga:** revisar la traza y corregir la espera en el spec, o la app si hay un error real (sospechoso: revocar acceso en Firefox, `cuidados-compartidos.spec.ts:41` y `:144`).

**Criterio de salida:** 3 corridas completas seguidas en los 3 navegadores con **0 fallos y 0 omitidas**.

**Resultado (16/11): cumplido.** 3 corridas seguidas con 183/183 pruebas en verde (unos 2,9 min cada una). Lo que se hizo:

- `webServer` en `playwright.config.ts`: backend en el puerto 8100 con `backend/e2e.db` (se borra al iniciar) y frontend de producción en el 3100, compilado en `frontend/.next-e2e` (`distDir` configurable en `next.config.ts`).
- `E2E_SQLITE_LOCAL=1` y `E2E_RUTA_SQLITE` se definen en la configuración; `cuidados-vencidos.spec.ts` ya no tiene la ruta `mascotas.db` fija.
- 3 workers, `expect.timeout` de 10 s, `timeout` de 60 s y trazas de las pruebas que fallan.
- Las capturas de Firefox eran anteriores a los enlaces Compartir, Analítica y Mi cuenta de la barra superior (no era ruido de renderizado). Se regeneraron las de Firefox y WebKit.
- **Error real encontrado:** con varias pruebas a la vez, SQLite respondía `database is locked` y el backend devolvía 500 (por ejemplo, al registrar una cuenta). `backend/app/base_datos.py` ahora activa el modo WAL y una espera de 30 s, solo si la base es SQLite (Postgres no cambia).

### Fase 2 — Medir la cobertura

**Backend (Python):**

- Levantar uvicorn con `coverage run --source=app -m uvicorn app.main:app` dentro del `webServer`.
- Al terminar la suite, detener el servidor (para que `coverage` escriba sus datos) y generar `coverage xml` → `cobertura/backend.xml`.

**Frontend (Next.js):** con `monocart-coverage-reports`, sin instrumentar el código de la app.

- **Cliente:** una fixture en `tests/ayudantes.ts` que en Chromium llame a `page.coverage.startJSCoverage()` / `stopJSCoverage()` y entregue los datos a monocart.
- **Servidor** (componentes de servidor, `lib/apiServidor.ts`, `proxy.ts`): correr `next start` con `NODE_V8_COVERAGE=<carpeta>`.
- Monocart une las dos fuentes, usa los source maps para volver a los `.ts`/`.tsx` originales y genera `cobertura/frontend.lcov`. Hay que activar los source maps de producción (`productionBrowserSourceMaps: true` en `next.config.ts`).
- Incluir todos los archivos fuente, incluso los que no se cargan (con 0 %), para que ninguno quede fuera.

**Diff:**

```bash
diff-cover cobertura/backend.xml cobertura/frontend.lcov \
  --compare-branch=upstream/main \
  --fail-under=100 \
  --html-report docs/reportes/cobertura-diff.html
```

**Resultado (16/11): cumplido.** Un solo comando, `pnpm cobertura` (`node tests/cobertura/correr.mjs`), hace todo:

1. Borra `cobertura/` y corre la suite en Chromium con `E2E_COBERTURA=1`:
   - backend bajo `coverage run` (`backend/.coveragerc`);
   - Next con `NODE_V8_COVERAGE`, compilado con source maps y sin minificar (`frontend/next.config.ts`);
   - los dos servidores se detienen con `SIGINT` para que alcancen a guardar sus datos.
2. `tests/base.ts`: fixture automática que mide la página de cada prueba y también las páginas de otras personas abiertas con `browser.newContext`. Todas las specs importan `test` y `expect` de `./base`.
3. Monocart une la cobertura del navegador y la del servidor (normaliza `[project]/frontend/...` a `frontend/...`) y deja solo `frontend/{app,componentes,lib}` y `proxy.ts`.
4. `coverage lcov` del backend desde la raíz, para que las rutas coincidan con git.
5. Verifica que **todo** archivo del fork tenga datos de cobertura (diff-cover se salta en silencio los que faltan) y corre `diff-cover --compare-branch=upstream/main --fail-under=100`.

Salidas en `cobertura/` (ignorada por git por ahora; en la Fase 4 se publica lo que corresponda): `frontend/index.html`, `backend/html/index.html` y `diff-cover.html`.

**Cifra real de partida: 89 % del diff (1 116 líneas cambiadas, faltan 112).** Por archivo:

| Archivo | Diff cubierto | Líneas que faltan |
|---|---|---|
| `backend/app/services/cuenta_servicio.py` | 43 % | 19, 30-32, 34-36, 39, 41-42, 45-46, 58, 60-64, 66-70, 72-75, 77, 87 |
| `backend/app/services/mascota_servicio.py` | 84 % | 33, 39, 56, 58, 63, 65, 83, 115, 151, 154, 156, 179, 194, 227, 236, 262 |
| `backend/app/services/acceso_servicio.py` | 88 % | 11, 23, 25, 35 |
| `backend/app/repositories/mascota_repositorio.py` | 94 % | 240, 253, 263 |
| `backend/app/routers/auth.py` | 93 % | 84 |
| `backend/app/routers/acceso.py` | 96 % | 29 |
| `frontend/app/recuperar/page.tsx` | 0 % | 2 |
| `frontend/app/registro/page.tsx` | 0 % | 2, 4-5 |
| `frontend/lib/filtros.ts` | 53 % | 45, 94-95, 97-98, 100-101, 110, 132 |
| `frontend/componentes/FiltrosMascotas.tsx` | 55 % | 35, 49, 52, 59, 66 |
| `frontend/componentes/MenuAcciones.tsx` | 50 % | 79 |
| `frontend/componentes/FormularioOmitir.tsx` | 76 % | 26-27, 37-38, 67 |
| `frontend/componentes/PanelAccesos.tsx` | 80 % | 41, 46-47, 54-56, 68, 126, 148, 152, 157 |
| `frontend/componentes/BuscadorMascotas.tsx` | 82 % | 45, 60 |
| `frontend/componentes/PanelAnalitica.tsx` | 88 % | 16-17 |
| `frontend/componentes/PanelCuenta.tsx` | 90 % | 32-33, 66 |
| `frontend/componentes/PanelMascota.tsx` | 90 % | 80-81, 124-126, 198 |
| `frontend/componentes/ResumenFiltros.tsx` | 91 % | 39 |
| `frontend/lib/api.ts` | 91 % | 41, 51, 332, 440, 444 |
| `frontend/componentes/CampoSeleccion.tsx` | 92 % | 52, 80 |
| `frontend/componentes/FormularioReprogramar.tsx` | 94 % | 62-63 |

El resto de los archivos del fork ya está al 100 %.

### Fase 3 — Llegar al 100 %

1. Recorrer el reporte de `diff-cover` archivo por archivo, priorizando el que tenga más líneas sin cubrir.
2. Escribir pruebas e2e para lo que falte. Lo normal es que falten ramas de error:
   - 401 y sesión vencida (`/ingresar?sesion=vencida`);
   - fallos de red o 500, simulados con `page.route`;
   - validaciones de formulario;
   - accesos rechazados o revocados y permisos `consulta` / `gestion`;
   - el fallo silencioso de `registrarEvento()`.
3. **Código que no se puede alcanzar:** primero intentar borrarlo. Si es defensivo y debe quedarse, excluirlo (`# pragma: no cover` en Python, `/* c8 ignore next */` en TS) solo en casos puntuales, cada uno justificado en la evidencia.
4. Excluir del cálculo lo que no es código ejecutable: `backend/tests/`, `skills-lock.json`, `.css`, `.gitignore`, configuración.

**Criterio de salida:** `diff-cover --fail-under=100` termina con código 0.

### Fase 4 — Reporte en el repo y evidencia

1. **Scripts en `package.json`** (raíz):
   - `test:e2e` → `playwright test`;
   - `cobertura` → limpia, corre la suite con cobertura, genera los reportes y ejecuta `diff-cover`.
2. **Reportes publicados** en `docs/reportes/`:
   - `e2e/` — reporte HTML de Playwright (`reporter: [['html', { outputFolder: 'docs/reportes/e2e', open: 'never' }]]`);
   - `cobertura-diff.html` — reporte de `diff-cover`;
   - `cobertura/` — lcov/HTML completo de monocart y `coverage html` del backend.
   - Ajustar `.gitignore` para que estas carpetas sí se suban.
3. **Evidencia** en `evidencias/` siguiendo el formato de las anteriores:
   - objetivo y requisito;
   - cómo correrlo (un comando);
   - antes (18 fallos, 6 omitidas, sin cobertura) y después (0 fallos, 100 % del diff);
   - capturas del reporte de Playwright y de `diff-cover`;
   - lista de exclusiones justificadas, si las hay.
4. Actualizar el `README.md` con la sección de pruebas e2e y cobertura.

## 4. Riesgos

| Riesgo | Mitigación |
|---|---|
| La Fase 3 pide muchas pruebas nuevas y no alcanza el tiempo | Llegar pronto a la Fase 2 para tener la cifra real y priorizar por líneas sin cubrir. |
| La cobertura V8 del cliente solo existe en Chromium | La cobertura se mide con el proyecto `chromium`; Firefox y WebKit siguen corriendo para validar que la suite pasa. |
| Los source maps de Next/Turbopack no se mapean bien | Plan B: instrumentar con `swc-plugin-coverage-instrument` (Istanbul) solo en una compilación de cobertura. |
| Las capturas visuales cambian según el sistema | Generarlas siempre en la misma máquina (Linux) y documentarlo. |
| Las pruebas que tocan SQLite directamente afectan una base compartida | Solo se usan con `backend/e2e.db`, nunca con Neon. |

## 5. Calendario

| Día | Trabajo |
|---|---|
| Lunes 16/11 | Fase 0 y Fase 1 (suite en verde). |
| Martes 17/11 | Fase 2 (cobertura medida) y la mayor parte de la Fase 3. |
| Miércoles 18/11 | Terminar la Fase 3, Fase 4 (reportes y evidencia) y PR antes de las 23:59. |
