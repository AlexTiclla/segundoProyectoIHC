# Tarea 9 — Analítica y gestión de cuidados vencidos

**Aplicación:** Mascota al Día
**Asignatura:** Interacción Humano-Computadora (IHC)
**Fecha de validación:** 12 de noviembre de 2026
**Entorno probado:** FastAPI + Next.js + SQLite local + Playwright (Chromium/Windows)

## A. Analítica del flujo de cuidados

### Objetivo
Medir cuántos cuidados entran en el flujo de seguimiento y cuántos se marcan como realizados, sin guardar en los eventos nombres de mascotas, correos ni contraseñas.

### Plan de eventos

| Evento | Cuándo se registra | Identificador | Propiedades mínimas |
|---|---|---|---|
| `cuidado_abierto` | Al incorporar un cuidado al flujo de seguimiento, según la implementación actual | `flujo_id` asociado al ID del cuidado | `recurrente` |
| `cuidado_completado` | Al marcar correctamente el cuidado como realizado | El mismo `flujo_id` del cuidado | `recurrente` |

**Rutas:** `POST /analitica/eventos` registra eventos y `GET /analitica/resumen` devuelve `iniciados`, `completados` y `porcentaje`.

**Cálculo del embudo:**

- Cuidados iniciados = cantidad de `flujo_id` distintos con evento `cuidado_abierto`.
- Cuidados completados = cantidad de `flujo_id` distintos con `cuidado_completado` y un evento previo `cuidado_abierto`.
- Conversión = `completados / iniciados × 100`, si hay iniciados.
- Cuidados sin completar = `iniciados - completados`. **No equivale necesariamente a abandono**: pueden ser cuidados todavía pendientes, futuros o vencidos.

### Validación

Se verificó el conjunto de pruebas funcionales de Playwright, que incluye `tests/analitica.spec.ts`: crear un cuidado incrementa `iniciados`, completar un cuidado incrementa `completados` y el panel `/analitica` muestra esos indicadores.

**Resultados numéricos de la base del expositor:**

- Iniciados: **pendiente de anotar valor observado en `/analitica`**.
- Completados: **pendiente de anotar valor observado en `/analitica`**.
- Conversión: **pendiente de anotar porcentaje observado en `/analitica`**.
- Evidencia visual: añadir captura de `/analitica` con fecha de ejecución.

### Interpretación y mejora UX

La diferencia entre iniciados y completados indica qué cantidad aún no terminó el flujo observado, pero no demuestra por sí sola abandono. La mejora introducida para la Tarea 9 es hacer visibles los cuidados **vencidos** y permitir cerrarlos como **realizados tarde** u **omitidos con un motivo obligatorio**. Una siguiente mejora de la analítica sería distinguir cuidados pendientes de futuros, vencidos, omitidos y completados para explicar mejor la caída del embudo.

### Privacidad y límites

Los eventos usan un identificador de flujo y el indicador de recurrencia, sin incluir nombre de mascota, correo ni motivo de omisión. Los resultados de `/analitica/resumen` son agregados; **la implementación actual agrega eventos globalmente, no por usuario**, por lo que no debe presentarse como una métrica personal de cada propietario. No usar datos personales reales en capturas o demostraciones.

## B. Cuidados vencidos

### Reglas implementadas

1. Un cuidado aparece como **vencido** si sigue `pendiente` y su fecha programada es anterior a la fecha actual.
2. **Realizado tarde** lo lleva a `realizado` y guarda la fecha real en `realizado_en`.
3. **Omitir con motivo** exige una razón y guarda `estado = omitido` y `motivo_omision`.
4. Los cuidados `realizado` y `omitido` son estados finales; no se permite volver a realizarlos, editarlos ni reprogramarlos.
5. Para cuidados recurrentes, la próxima ocurrencia se calcula desde la fecha **originalmente programada** y no desde el día de realización u omisión.
6. Los permisos de solo consulta no permiten omitir ni realizar cuidados; gestión y propietario pueden actuar conforme a su autorización.

### Casos de prueba del backend

**Archivo:** `backend/tests/test_cuidados_vencidos.py`

| Caso | Resultado observado |
|---|---|
| Detectar cuidado con fecha vencida | Aprobado |
| Rechazar omisión de cuidado futuro | Aprobado |
| Exigir motivo no vacío | Aprobado |
| Guardar omisión sin duplicarla | Aprobado |
| Omitir recurrente respetando la fecha prevista | Aprobado |
| Realizar tarde registrando hoy y respetando recurrencia | Aprobado |
| Impedir omitir con permiso de consulta | Aprobado |
| Impedir realizar, editar o reprogramar un omitido | Aprobado |

**Comando:** `python -m pytest -q`, desde `backend` con el entorno virtual activo.
**Resultado real:** `89 passed in 2.33s` (12/11/2026).

### Regresión de la interfaz

**Comando desde la raíz:** `pnpm.cmd exec playwright test --project=chromium --workers=1 --reporter=line --grep-invert "se ve igual"`
**Resultado real:** `51 passed (3.3m)`.

**Comando de capturas:** `pnpm.cmd exec playwright test tests/visual.spec.ts --project=chromium --workers=1 --reporter=line`
**Resultado real:** `3 passed (4.8s)`.

**Nueva prueba E2E de vencidos:** `tests/cuidados-vencidos.spec.ts`. **Resultado real: `2 passed (9.3s)`**, ejecutada en Chromium el 12/11/2026. Comprueba: (a) omitir un cuidado vencido con motivo y conservar el estado; (b) realizar tarde un cuidado recurrente, registrar la fecha efectiva y generar la siguiente ocurrencia desde su fecha programada. Esta prueba requiere **SQLite local**, y solo cambia la fecha del cuidado de prueba que acaba de crear; no debe ejecutarse contra una base compartida.

### Demostración manual sugerida

1. Iniciar sesión con la cuenta de demostración.
2. Mostrar un cuidado pendiente con fecha anterior a hoy y el indicador de vencimiento.
3. Abrir **Omitir con motivo**, probar motivo vacío y después registrar una explicación.
4. Comprobar el estado **Omitido**, el motivo almacenado y que no se pueda realizar nuevamente.
5. Usar otro vencido recurrente con **Realizado tarde** y mostrar `realizado_en` junto a su próxima ocurrencia.
6. Mostrar el panel de analítica y explicar las métricas y su limitación.

### Decisiones de UX

Se ha conservado la visibilidad de todos los estados por defecto en Inicio para que las tarjetas de cuidados realizados u omitidos no desaparezcan al finalizar una acción. Los cuidados vencidos se distinguen del resto, y la omisión requiere una explicación deliberada en un diálogo.

## Evidencias y reproducibilidad

| Evidencia | Ubicación o estado |
|---|---|
| Pruebas backend | Consola: `89 passed in 2.33s` |
| E2E funcionales | Consola: `51 passed (3.3m)` |
| E2E visuales | Consola: `3 passed (4.8s)` |
| Pruebas específicas de vencidos | `backend/tests/test_cuidados_vencidos.py` |
| Nueva E2E de vencidos | `tests/cuidados-vencidos.spec.ts`: **2 passed (9.3s)** |
| Capturas visuales | `tests/visual.spec.ts-snapshots/` |
| Panel de analítica | Captura y valores: **pendientes de anexar** |

> Los resultados provienen de ejecuciones compartidas desde la terminal de desarrollo. Las suites E2E existentes (51 funcionales + 3 visuales) y las 2 pruebas nuevas se ejecutaron **por separado**. Los valores numéricos del panel de analítica y su captura siguen pendientes de anexarse.
