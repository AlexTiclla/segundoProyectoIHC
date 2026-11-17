import { test as base, expect, type BrowserContext, type Page } from '@playwright/test';
import { MCR } from 'monocart-coverage-reports';

import { coberturaActiva, opcionesFrontend } from './cobertura/opciones.mjs';

// Todas las specs importan test y expect de aquí, no de '@playwright/test'.
// Con E2E_COBERTURA=1 y en Chromium, la fixture automática "cobertura" mide qué código
// del frontend ejecuta cada prueba: el de su página y el de las páginas de otras personas
// que se abren con browser.newContext (por ejemplo, Juan y Eva en ayudantes.abrirComo).
// Lo que la fixture ofrece a las pruebas: si se está midiendo, y guardar lo medido antes
// de una navegación completa que inicia la propia app (ver errores-servidor.spec.ts)
type Cobertura = { activa: boolean; guardar: () => Promise<void> };

export const test = base.extend<{ cobertura: Cobertura }>({
  cobertura: [
    async ({ page, browser, browserName }, use) => {
      if (!coberturaActiva || browserName !== 'chromium') {
        await use({ activa: false, guardar: async () => {} });
        return;
      }

      const medidas: Page[] = [];
      const recogidas: Page[] = [];

      async function guardar(pagina: Page) {
        const datos = await pagina.coverage.stopJSCoverage();
        // Sin scripts (por ejemplo, un goto justo al abrir la página) no hay nada que guardar
        if (datos.length > 0) await MCR(opcionesFrontend).add(datos);
      }

      async function medir(pagina: Page) {
        await pagina.coverage.startJSCoverage({ resetOnNavigation: false });
        medidas.push(pagina);

        // Al cargar un documento nuevo, V8 descarta los contadores de los scripts del
        // anterior: lo que se midió en esa pantalla se perdería. Por eso, antes de
        // page.goto y page.reload se guarda lo medido y se vuelve a empezar. (Las
        // navegaciones internas de Next no cargan un documento nuevo.)
        for (const metodo of ['goto', 'reload'] as const) {
          const original = pagina[metodo].bind(pagina) as (...argumentos: unknown[]) => Promise<unknown>;
          Object.assign(pagina, {
            [metodo]: async (...argumentos: unknown[]) => {
              await guardar(pagina);
              await pagina.coverage.startJSCoverage({ resetOnNavigation: false });
              return original(...argumentos);
            },
          });
        }
      }

      // Hay que detener la medición antes de que la página se cierre, o se pierden los datos
      async function recoger(paginas: Page[]) {
        for (const pagina of paginas) {
          if (recogidas.includes(pagina) || pagina.isClosed()) continue;
          recogidas.push(pagina);
          await guardar(pagina);
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
        await use({
          activa: true,
          guardar: async () => {
            await guardar(page);
            await page.coverage.startJSCoverage({ resetOnNavigation: false });
          },
        });
      } finally {
        browser.newContext = newContextOriginal;
        await recoger(medidas);
      }
    },
    { auto: true },
  ],
});

export { expect };
