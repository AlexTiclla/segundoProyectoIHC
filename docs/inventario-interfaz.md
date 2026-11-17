# Inventario de interfaz — Mascota al Día

Clase 23 · "Del código al sistema: inventario de interfaz y tokens". Inventario hecho el 14/11/2026 con `grep` sobre `frontend/app` y `frontend/componentes`, comparado contra el sistema de diseño de Figma ([Mascota Dia](https://www.figma.com/design/Pq8Q35LoYXwrKROyiItaCe/Mascota-Dia)).

Fuente de verdad de los tokens: `frontend/app/globals.css` (bloque `@theme inline`). Cada `--color-x` tiene una variable `color/x` en Figma con el mismo valor y `codeSyntax` `var(--color-x)`.

## 1. Inconsistencias encontradas

### 1.1 Colores fijos (clases crudas de Tailwind fuera de la paleta)

| # | Inconsistencia | Dónde | Resolución |
|---|---|---|---|
| C1 | `bg-white` / `text-white` sin token (el color más usado de la interfaz, ~30 usos) | casi todos los componentes | Token `--color-blanco` |
| C2 | **Dos rojos para lo mismo**: `red-700` (texto de error, botón peligro) y `red-600` (borde de campo con error) | `Boton`, `CampoTexto`, `CampoSeleccion`, `MenuAcciones`, `MensajeError`, `FormularioOmitir` | Un solo `--color-peligro` (`#c10007`, el `red-700` de Tailwind v4) |
| C3 | `red-800` (hover) y `red-900` (texto de la insignia Vencido): dos tonos oscuros distintos | `Boton`, `TarjetaMascota` | Un solo `--color-peligro-profundo` (`#9f0712`) |
| C4 | **Dos verdes para "éxito"**: `emerald-*` en los avisos y `green-*` en la insignia Realizado | `FormularioIngreso`, `FormularioRecuperar`, `TarjetaMascota` | Familia única `--color-exito`, `-suave`, `-fondo`, `-borde` |
| C5 | Grises puros `neutral-*`, ajenos a la paleta menta/arena del proyecto | `TarjetaMascota` (Omitido, tarjeta finalizada), `CampoTexto` (deshabilitado) | Sin tokens nuevos: se usan `arena`, `fondo`, `grisazulado` y `tinta` |
| C6 | `backdrop:bg-black/40` | `Dialogo` | Token `--color-velo` |
| C7 | `amber-*` para avisos y la insignia Pendiente, sin nombre semántico | `FormularioIngreso`, `FormularioRecuperar`, `TarjetaMascota` | Familia `--color-advertencia`, `-suave`, `-fondo`, `-borde` |

Los valores de los tokens nuevos son los hex sRGB de la paleta `oklch` de **Tailwind v4** (la versión que usa el proyecto), así que la migración no cambia ningún píxel. Se comprobó en el navegador con `getComputedStyle`.

### 1.2 Tipografía

| # | Inconsistencia | Dónde | Resolución |
|---|---|---|---|
| T1 | No hay escala tipográfica nombrada: cada pantalla elige su clase (`text-sm` ×52, `text-2xl` ×7, `text-lg` ×5, `text-xl` ×4…) | todo el frontend | 15 estilos `tipografia/*` en Figma (Geist), cada uno anotado con su clase Tailwind |
| T2 | Los H1 no son iguales entre pantallas: 4 usan `text-2xl sm:text-3xl`, 2 solo `text-2xl` (Mi cuenta y la tarjeta de acceso) | `app/cuenta/page.tsx`, `TarjetaAcceso.tsx` vs. los paneles | Pendiente: unificar en `titulo-2` al ensamblar las pantallas (Etapa 4) |
| T3 | `Geist Mono` se carga en `layout.tsx` y nunca se usa | `app/layout.tsx`, `globals.css` | Fuera del sistema; candidato a quitarse para ahorrar una descarga de fuente |
| T4 | "Mostrar/Ocultar" de la contraseña es el único texto `text-sm font-medium` | `CampoTexto.tsx` | En Figma: estilo `ayuda` con peso Medium |

### 1.3 Componentes

| # | Inconsistencia | Dónde | Resolución |
|---|---|---|---|
| K1 | El buscador es un `<input type="search">` escrito a mano, con estilos duplicados de `CampoTexto` | `BuscadorMascotas.tsx:41` | Pendiente: reutilizar `CampoTexto` o documentarlo como variante |
| K2 | El motivo de omisión es un `<textarea>` suelto, fuera del sistema de campos | `FormularioOmitir.tsx:56` | Pendiente: variante "multilínea" del Campo de texto |
| K3 | La fila de cada invitación es un `<li>` de marcado suelto, repetido dos veces con pequeñas diferencias | `PanelAccesos.tsx` | Componente "Tarjeta de cuidado compartido" (Etapa 3) |
| K4 | La insignia de estado es un objeto `{texto, color}` dentro de la tarjeta, no un componente | `TarjetaMascota.tsx:44-63` | Componente "Insignia de estado" en Figma (hecho) |
| K5 | "Éxito" tiene dos formas: aviso flotante oscuro (`MensajeExito`) y caja verde en línea (ingreso/recuperar) | `MensajeExito.tsx`, `FormularioIngreso.tsx`, `FormularioRecuperar.tsx` | Se documentan las dos variantes en el componente "Mensaje de aviso" (Etapa 3) |
| K6 | `--color-menta` tiene un solo uso (hover de un filtro activo) | `ResumenFiltros.tsx:41` | Se conserva: es el hover sobre `menta-claro` |

### 1.4 Formas y elevación

Radios en uso: `rounded-lg` ×19, `rounded-xl` ×14, `rounded-2xl` ×4, `rounded-full` ×1 y un `rounded` suelto (el botón "Mostrar" de la contraseña). Sombras: `shadow-sm` ×6, `shadow-lg` ×2, `shadow-xl` ×1. Los radios quedaron como variables `radio/lg`, `radio/xl`, `radio/2xl` y `radio/full` en Figma, con `codeSyntax` hacia los `--radius-*` de Tailwind. El `rounded` suelto queda anotado como inconsistencia menor.

## 2. Pantalla sin colores fijos: **Mi cuenta** (`/cuenta`)

Todo lo que se pinta en `/cuenta` usa ya solo tokens: la página, la barra superior, el botón de salir, el panel, los botones y el diálogo de confirmación.

| Archivo | Antes | Después |
|---|---|---|
| `Boton.tsx` | `text-white`, `bg-white`, `bg-red-700`, `hover:bg-red-800` | `text-blanco`, `bg-blanco`, `bg-peligro`, `hover:bg-peligro-profundo` |
| `BarraSuperior.tsx` | `bg-white` | `bg-blanco` |
| `PanelCuenta.tsx` | `bg-white` ×2 | `bg-blanco` ×2 |
| `Dialogo.tsx` | `bg-white`, `backdrop:bg-black/40` | `bg-blanco`, `backdrop:bg-velo` |
| `MensajeError.tsx` | `border-red-300 bg-red-50 text-red-700` | `border-peligro-borde bg-peligro-fondo text-peligro` |

Comprobación:
- `grep` sobre los 9 archivos de la ruta no encuentra ninguna clase de color crudo ni ningún hex.
- En el navegador, los estilos computados coinciden con Figma: botón peligro `rgb(193, 0, 7)` = `#c10007`, velo `rgba(0, 0, 0, 0.4)`, mensaje de error `#ffa2a2` / `#fef2f2` / `#c10007`. En el diálogo, Cancelar y Confirmar miden lo mismo (44 px).
- `npx tsc --noEmit` sin errores. `npm run lint` sin errores (queda un aviso previo en `lib/api.ts`, no relacionado).
- Suite E2E completa (`npx playwright test`): 167 pasan, 6 se omiten y 10 fallan. **Chromium pasa entero**, incluidas las 3 pruebas visuales (las capturas de `/ingresar`, `/registro` y `/inicio` no cambiaron ni un píxel). Los 10 fallos son de firefox y webkit, y **también fallan con el código anterior a la migración**: se comprobó con `git stash` y repitiendo esas pruebas.
  - Las 3 visuales de firefox ya no coinciden con su captura de referencia.
  - Las 3 visuales de webkit nunca tuvieron captura de referencia.
  - Las pruebas de acceso de webkit son inestables (en cada corrida falla una distinta).
  - No son causados por este cambio; quedan anotados como deuda de pruebas.

Como `Boton`, `Dialogo`, `MensajeError` y `BarraSuperior` son compartidos, la migración ya alcanza también a esas piezas en el resto de pantallas.

## 3. Resto de la app (Etapa 5) — resuelto 14/11

Las **56 clases de color crudo que quedaban en 17 archivos** se reemplazaron por tokens según la tabla 1.1. `grep` sobre `frontend/app` y `frontend/componentes` ya no encuentra ningún color fijo ni hex.

Comprobación en el navegador con `getComputedStyle`:

| Elemento | Estilo computado | Token |
|---|---|---|
| Aviso "sesión vencida" | borde `#ffd230`, fondo `#fffbeb`, texto `#7b3306` | `advertencia-*` |
| Aviso "cuenta creada" | borde `#5ee9b5`, fondo `#ecfdf5`, texto `#006045` | `exito-*` |
| Campos con error del formulario de mascota | borde y mensaje `#c10007` (antes `red-600` y `red-700`) | `peligro` |
| Insignia "Pendiente" | fondo `#fef3c6`, texto `#7b3306` | `advertencia-suave`, `advertencia` |
| Tarjeta de mascota | fondo `#ffffff`, borde `#dde3e0` | `blanco`, `arena` |
| Aviso flotante | fondo `#27323a`, texto `#ffffff` | `tinta`, `blanco` |

Además:
- `npx tsc --noEmit`, `npm run lint` (0 errores) y `npm run build` correctos.
- E2E en chromium: 58 pasan y 2 se omiten. Un fallo de `cuidados-compartidos.spec.ts` por tiempo de espera desapareció al repetirlo aislado (6/6 pasan), así que es inestabilidad bajo carga y no un cambio visual.

Cambios visibles **intencionales** por unificar la paleta:
- El borde de los campos con error pasa de `red-600` a `peligro` (`red-700`).
- El texto de la insignia Vencido pasa de `red-900` a `peligro-profundo` (`red-800`), y el de Realizado de `green-900` a `exito` (`emerald-800`).
- Omitido y el campo deshabilitado usan `arena`/`tinta` y `fondo`/`grisazulado` en lugar de los grises `neutral-*`.

### 3.1 Inconsistencia nueva encontrada al diseñar las pantallas

| # | Inconsistencia | Dónde | Estado |
|---|---|---|---|
| C8 | Las dos tarjetas de Mi cuenta tienen borde `contorno` (el del borde de los campos), mientras que todas las demás tarjetas usan `arena` | `PanelCuenta.tsx` | Documentada; en Figma se respeta tal cual está en el código. Candidata a unificar con `arena`. |
