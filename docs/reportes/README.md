# Reportes de pruebas e2e y cobertura

Requisito: *"La suite e2e corre y el código que agregaron en el fork tiene 100 % cobertura, con el reporte en el repo."*

| Reporte | Qué muestra | Cómo se genera |
|---|---|---|
| [`e2e/index.html`](e2e/index.html) | Reporte HTML de Playwright: la suite completa en Chromium, Firefox y WebKit | `pnpm test:e2e` |
| [`cobertura/diff-cover.html`](cobertura/diff-cover.html) · [`.md`](cobertura/diff-cover.md) | **Cobertura de las líneas que el fork cambió** respecto de `upstream/main` (diff-cover) | `pnpm cobertura` |
| [`cobertura/frontend/index.html`](cobertura/frontend/index.html) | Cobertura completa del frontend (navegador + servidor de Next), por archivo y línea | `pnpm cobertura` |
| [`cobertura/backend/html/index.html`](cobertura/backend/html/index.html) | Cobertura completa del backend (coverage.py) | `pnpm cobertura` |

Los HTML se ven abriéndolos en el navegador desde una copia local del repo. El de Playwright también con:

```bash
npx playwright show-report docs/reportes/e2e
```

## Cómo se mide

- `pnpm cobertura` (`tests/cobertura/correr.mjs`) corre la suite en Chromium con `E2E_COBERTURA=1`: el backend bajo `coverage run` y Next con `NODE_V8_COVERAGE`; la fixture de `tests/base.ts` mide el JavaScript de cada página del navegador.
- Monocart une la cobertura del navegador y la del servidor y la mapea a los `.ts`/`.tsx` originales.
- `diff-cover --compare-branch=upstream/main --fail-under=100` revisa solo las líneas que cambió el fork. El script además falla si algún archivo del fork no tiene datos de cobertura, porque diff-cover lo saltaría sin avisar.
- Detalle y exclusiones justificadas: [`evidencias/pruebas-e2e-cobertura.md`](../../evidencias/pruebas-e2e-cobertura.md).
