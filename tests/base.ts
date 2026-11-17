import { test as base, expect, type BrowserContext, type Page } from '@playwright/test';
import { MCR } from 'monocart-coverage-reports';

import { coberturaActiva, opcionesFrontend } from './cobertura/opciones.mjs';

// Todas las specs importan test y expect de aquí, no de '@playwright/test'.
// Con E2E_COBERTURA=1 y en Chromium, la fixture automática "cobertura" mide qué código
// del frontend ejecuta cada prueba: el de su página y el de las páginas de otras personas
// que se abren con browser.newContext (por ejemplo, Juan y Eva en ayudantes.abrirComo).
export const test = base.extend<{ cobertura: void }>({
  cobertura: [
    async ({ page, browser, browserName }, use) => {
      if (!coberturaActiva || browserName !== 'chromium') {
        await use();
        return;
      }

      const medidas: Page[] = [];
      const recogidas: Page[] = [];

      async function medir(pagina: Page) {
        await pagina.coverage.startJSCoverage({ resetOnNavigation: false });
        medidas.push(pagina);
      }

      // Hay que detener la medición antes de que la página se cierre, o se pierden los datos
      async function recoger(paginas: Page[]) {
        for (const pagina of paginas) {
          if (recogidas.includes(pagina) || pagina.isClosed()) continue;
          recogidas.push(pagina);
          const datos = await pagina.coverage.stopJSCoverage();
          await MCR(opcionesFrontend).add(datos);
        }
      }

      // Los contextos de otras personas: medir sus páginas desde que se crean,
      // y recogerlas si la prueba cierra el contexto antes de terminar
      const newContextOriginal = browser.newContext.bind(browser);
      browser.newContext = async (...argumentos) => {
        const contexto: BrowserContext = await newContextOriginal(...argumentos);
        const newPageOriginal = contexto.newPage.bind(contexto);
        contexto.newPage = async () => {
          const pagina = await newPageOriginal();
          await medir(pagina);
          return pagina;
        };
        const closeOriginal = contexto.close.bind(contexto);
        contexto.close = async (...opciones) => {
          await recoger(contexto.pages());
          return closeOriginal(...opciones);
        };
        return contexto;
      };

      await medir(page);
      try {
        await use();
      } finally {
        browser.newContext = newContextOriginal;
        await recoger(medidas);
      }
    },
    { auto: true },
  ],
});

export { expect };
