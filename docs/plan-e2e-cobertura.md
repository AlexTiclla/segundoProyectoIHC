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
