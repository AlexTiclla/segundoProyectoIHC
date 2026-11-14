# Clase 23 — Del código al sistema: inventario de interfaz y tokens

## Objetivo

Pasar de una interfaz que "funciona" a un sistema de diseño en el que el código y Figma hablan el mismo idioma:
- un inventario con las inconsistencias reales;
- un archivo de tokens sin colores fijos, con los mismos nombres que en Figma;
- componentes completos en Figma, con variantes y estados, con los que se arman las pantallas.

## Qué se entrega

| Pedido de la clase | Dónde está |
|---|---|
| Inventario con las inconsistencias | [`docs/inventario-interfaz.md`](../docs/inventario-interfaz.md): 8 de color, 4 de tipografía, 6 de componentes, y formas/elevación |
| Archivo de tokens | `frontend/app/globals.css`, bloque `@theme inline`: 24 colores `--color-*` |
| Al menos una pantalla sin colores fijos | **Todas**. Primero Mi cuenta (Etapa 2) y después el resto (Etapa 5): 0 clases de color crudo y 0 hex en `frontend/app` y `frontend/componentes` |
| Un componente completo en Figma | **11 componentes** con variantes y estados, más piezas auxiliares y formularios: página `02 · Componentes` de [Mascota Dia](https://www.figma.com/design/Pq8Q35LoYXwrKROyiItaCe/Mascota-Dia) |
| Tabla componente ↔ archivo | [`docs/tabla-componentes.md`](../docs/tabla-componentes.md) |

## Antes y después

**Antes:** el código usaba 9 tokens propios (`menta-*`, `arena`, `tinta`…) mezclados con **69 clases de la paleta cruda de Tailwind** (`bg-white`, `red-700`, `red-600`, `amber-*`, `emerald-*`, `green-*`, `neutral-*`, `black/40`). Había dos rojos distintos para "error", dos verdes distintos para "éxito" y grises que no pertenecían a la paleta.

**Después:** 24 tokens de color con nombre de rol (`peligro`, `advertencia`, `exito`, `blanco`, `velo`…), cada uno con el valor exacto que Tailwind v4 pintaba antes (convertido de `oklch` a hex). La migración no cambia la apariencia, salvo las unificaciones intencionales documentadas en el inventario.

```css
/* frontend/app/globals.css */
--color-peligro: #c10007;          /* Figma: color/peligro */
--color-peligro-fondo: #fef2f2;    /* Figma: color/peligro-fondo */
```

```tsx
// frontend/componentes/MensajeError.tsx
// antes:   border-red-300 bg-red-50 text-red-700
// después: border-peligro-borde bg-peligro-fondo text-peligro
```

## Principio aplicado

Un mismo significado tiene un solo nombre y un solo valor ("Consistencia y estándares", `docs/evaluacion-heuristicas.md`). Si el error es rojo en un lugar y otro rojo en otro, quien usa la app no puede aprender qué significa cada color, y el equipo no puede cambiarlo en un solo lugar.

## Cómo se comprobó

- **`grep`** sobre `frontend/app` y `frontend/componentes`: ninguna clase de color crudo ni hex.
- **Navegador** (`getComputedStyle` en la app local), comparado con las variables de Figma: botón peligro `#c10007`, velo `rgba(0,0,0,0.4)`, avisos de advertencia (`#ffd230`/`#fffbeb`/`#7b3306`) y de éxito (`#5ee9b5`/`#ecfdf5`/`#006045`), insignia Pendiente (`#fef3c6`/`#7b3306`), campos con error `#c10007`.
- **Compilación y lint:** `npx tsc --noEmit`, `npm run lint` (0 errores) y `npm run build` correctos.
- **E2E en chromium:** 58 pasan y 2 se omiten, incluidas las capturas visuales de `/ingresar`, `/registro` y `/inicio`, que no cambiaron. Un fallo por tiempo de espera en `cuidados-compartidos.spec.ts` pasó 6/6 al repetirlo aislado.
- **Deuda previa, no causada por este cambio:** en firefox y webkit fallan pruebas también con el código anterior (capturas de referencia desactualizadas o inexistentes y pruebas de acceso inestables). Se comprobó con `git stash`.

## Herramienta

El archivo de Figma se construyó con el MCP de Figma desde Claude Code. El plan por etapas y el registro de lo construido están en [`docs/plan-sistema-diseno-figma.md`](../docs/plan-sistema-diseno-figma.md), y los IDs de Figma en [`docs/figma-registro-ids.json`](../docs/figma-registro-ids.json).
