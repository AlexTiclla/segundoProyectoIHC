import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */

// La suite levanta su propio backend y frontend en puertos aparte, para no chocar
// con los servidores de desarrollo (3000 y 8000) ni con su base de datos.
const PUERTO_BACKEND = 8100;
const PUERTO_FRONTEND = 3100;
const URL_BACKEND = `http://127.0.0.1:${PUERTO_BACKEND}`;

// Base SQLite desechable: se borra y se crea de nuevo al iniciar el backend.
// cuidados-vencidos.spec.ts la modifica directamente para simular fechas vencidas.
const BASE_E2E = 'e2e.db';
process.env.E2E_SQLITE_LOCAL = '1';
process.env.E2E_RUTA_SQLITE = `backend/${BASE_E2E}`;

// E2E_REUTILIZAR=1 usa servidores ya levantados en esos puertos (más rápido al iterar)
const reutilizar = process.env.E2E_REUTILIZAR === '1';

export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Pocos workers: un solo backend con SQLite atiende a los tres navegadores */
  workers: process.env.CI ? 1 : 3,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Los flujos con varias personas encadenan muchas acciones del servidor */
  timeout: 60_000,
  expect: { timeout: 10_000 },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: `http://localhost:${PUERTO_FRONTEND}`,

    /* Guarda la traza de las pruebas que fallan, para diagnosticarlas */
    trace: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: [
    {
      command: `rm -f ${BASE_E2E} && .venv/bin/uvicorn app.main:app --port ${PUERTO_BACKEND}`,
      cwd: 'backend',
      url: `${URL_BACKEND}/salud`,
      reuseExistingServer: reutilizar,
      env: {
        URL_BASE_DATOS: `sqlite:///./${BASE_E2E}`,
        SECRETO_JWT: 'secreto-solo-para-pruebas-e2e',
        MINUTOS_SESION: '60',
        MINUTOS_CODIGO_RECUPERACION: '15',
      },
    },
    {
      // Compilación de producción en su propia carpeta, para no pisar la de "npm run dev"
      command: `npm run build && npm run start -- --port ${PUERTO_FRONTEND}`,
      cwd: 'frontend',
      url: `http://localhost:${PUERTO_FRONTEND}/ingresar`,
      reuseExistingServer: reutilizar,
      timeout: 300_000,
      env: {
        URL_BASE: URL_BACKEND,
        NEXT_DIST_DIR: '.next-e2e',
      },
    },
  ],
});
