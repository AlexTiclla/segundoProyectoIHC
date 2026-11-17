// Opciones compartidas de la cobertura e2e (ver docs/plan-e2e-cobertura.md).
// Las usan playwright.config.ts, la fixture de tests/base.ts y tests/cobertura/correr.mjs.

// La cobertura solo se mide si se pide, porque necesita una compilación con source maps
export const coberturaActiva = process.env.E2E_COBERTURA === '1';

// Todo lo que se genera queda en esta carpeta de la raíz del repo
export const CARPETA_COBERTURA = 'cobertura';

// Cobertura de V8 del servidor de Next (componentes de servidor, proxy.ts, apiServidor.ts)
export const CARPETA_V8_SERVIDOR = `${CARPETA_COBERTURA}/v8-servidor`;

// Datos de coverage.py del backend
export const ARCHIVO_COBERTURA_BACKEND = `${CARPETA_COBERTURA}/backend/.coverage`;

// Opciones de monocart para el frontend. Los workers de Playwright solo agregan datos
// (cleanCache: false); el reporte final se genera una vez en correr.mjs.
export const opcionesFrontend = {
  name: 'Cobertura e2e del frontend',
  outputDir: `${CARPETA_COBERTURA}/frontend`,
  reports: ['v8', 'lcovonly', 'console-summary'],
  cleanCache: false,
  // Solo los bundles de la app: los del navegador y los del servidor de Next
  // (deja fuera npm, el runtime de Node y lo que no compila Next)
  entryFilter: (entrada) =>
    entrada.url.includes('/_next/static/') || entrada.url.includes('/.next-e2e/server/'),
  // Turbopack nombra las fuentes del servidor "[project]/frontend/..." y las del navegador
  // "frontend/...": se igualan para que la cobertura de ambos lados se una en un solo archivo
  sourcePath: (ruta) => ruta.replace(/^\[project\]\//, ''),
  // Solo nuestro código, ya con la ruta igualada
  outputFilter: {
    '**/node_modules/**': false,
    'frontend/app/**': true,
    'frontend/componentes/**': true,
    'frontend/lib/**': true,
    'frontend/proxy.ts': true,
  },
};
