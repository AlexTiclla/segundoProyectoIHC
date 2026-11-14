# Plan — Sistema de diseño en Figma + tokens en código para "Mascota al Día"

## 0. Por qué este plan y con qué fecha límite

El jueves **19/11/2026** es la **presentación final del Proyecto 2** (diapositiva "Presentación final · jueves 19/11/2026", 10 minutos por grupo para vender el producto + 2 preguntas sobre el código agregado en el fork). Dentro del rubro de esa defensa, la parte de diseño pide explícitamente (diapositivas "Ese día se presenta todo el Proyecto 2" y "Esto es lo que vamos a revisar"):

- **Sistema de diseño en Figma**: logo, paleta, tipografía y **10 componentes con variantes y estados**. Las pantallas de la app se arman ensamblando esos componentes, no se dibujan sueltas.
- **Tokens en el código**: los mismos nombres que en Figma, **sin colores fijos** (hardcoded), más una **tabla componente ↔ archivo**.
- Accesibilidad: reporte interpretado y corregido, contraste AA comprobado (relacionado, pero fuera del detalle de este plan — ver nota al final).

Hay además un **checkpoint intermedio obligatorio y calificado en clase**, antes de la fecha final:

| Cuándo | Qué | Se revisa |
|---|---|---|
| **Clase 23 · martes 17/11** | "Del código al sistema: inventario de interfaz y tokens" | Trabajo en clase con nota: **inventario con las inconsistencias**, **archivo de tokens con al menos una pantalla sin colores fijos**, y **un componente completo en Figma**. Se revisa avance grupo por grupo. |
| **Miércoles 18/11, 23:59** | Corte del repositorio (historial de git) + envío del usuario/contraseña de prueba a `bjvtamayo78@gmail.com` | Todo lo que se suba después de ese corte **no se evalúa**. |
| **Jueves 19/11** | Presentación final | Sistema completo en Figma + tokens + pantallas armadas con los componentes. |

Este plan está dividido en **etapas acumulativas**: cada etapa deja algo demostrable y commiteable por sí sola. Si los créditos/uso del MCP de Figma se agotan a mitad de camino, lo ya hecho en una etapa cerrada sigue sirviendo para la nota del checkpoint y para la defensa, en vez de quedar un archivo de Figma a medio construir e inservible.

## 1. Alcance y herramienta a usar

**Todo el trabajo de diseño en Figma de este plan se hace con el MCP de Figma conectado a esta sesión de Claude Code** (servidor oficial "Figma Dev Mode MCP", cuenta `Alex Ticlla` / `aticllac126@ficct.uagrm.edu.bo`, equipo **"Grupo IHC"**), no editando a mano en figma.com en paralelo. En concreto:

- `create_session` abre la sesión de trabajo sobre el archivo antes de cualquier lectura o escritura.
- `use_figma` (con su skill `figma-use`, de carga obligatoria antes de cada llamada) crea y edita frames, variables, componentes y variantes.
- `get_design_context` / `get_screenshot` / `get_metadata` verifican visualmente cada etapa antes de seguir.
- `search_design_system` / `get_libraries` se usan si conviene reutilizar algo ya existente en el equipo antes de crear de cero.

Usar el MCP (en vez de clicar manualmente) es intencional por dos razones: cualquier corte a medias deja un archivo coherente con lo que el código describe (nombres calcados, nada "a ojo"), y en la defensa del jueves es fácil explicar "cómo se armó" porque quedó un historial de operaciones, no una mezcla de ediciones manuales y automáticas.

**Primer paso operativo (Etapa 0):** localizar si ya existe un archivo de Figma llamado "Mascota al Día" dentro del equipo "Grupo IHC"; si no existe, crearlo con `create_new_file` (precedido por la skill `figma-create-new-file`, de carga obligatoria) y abrir la sesión sobre su `fileKey`.

## 2. Fuente de verdad: lo que ya existe en el código (nada se inventa en Figma)

Todo el sistema de Figma se calca de `frontend/app/globals.css` y `frontend/app/layout.tsx`, que son la única fuente de verdad de la paleta y la tipografía actuales.

### 2.1 Paleta de color actual (variables `--color-*` en `frontend/app/globals.css:3-15`)

| Variable código | Hex | Uso actual en el código | Nombre de variable en Figma (idéntico) |
|---|---|---|---|
| `--color-fondo` | `#f6f8f7` | fondo de `<body>` | `color/fondo` |
| `--color-menta-claro` | `#dff3ec` | hover de chips/botones/nav, fondos suaves | `color/menta-claro` |
| `--color-menta` | `#b5e0d3` | declarada; **revisar en el inventario si tiene algún uso real** (posible inconsistencia: variable sin consumidores) | `color/menta` |
| `--color-arena` | `#dde3e0` | separadores y bordes de tarjetas | `color/arena` |
| `--color-contorno` | `#79847f` | bordes de campos y botones secundarios | `color/contorno` |
| `--color-grisazulado` | `#56606b` | texto secundario/ayuda | `color/grisazulado` |
| `--color-menta-oscuro` | `#2f7f6b` | botón primario, chip seleccionado | `color/menta-oscuro` |
| `--color-menta-profundo` | `#266857` | hover de primario, enlaces, outline de foco | `color/menta-profundo` |
| `--color-tinta` | `#27323a` | texto principal y color de `<body>` | `color/tinta` |

### 2.2 Gap real encontrado: colores "fijos" que rompen el sistema

Esto **es** el hallazgo central que pide el checkpoint del 17/11 ("inventario con las inconsistencias" + "tokens... sin colores fijos"). Hoy conviven la paleta semántica de arriba con clases de la paleta cruda de Tailwind, nunca declaradas como variable propia:

| Color crudo de Tailwind | Dónde aparece | Significado real (lo que debería ser un token semántico) |
|---|---|---|
| `red-700` / `red-800` / `red-600` / `red-300` / `red-50` | `Boton.tsx` (variante `peligro`), `MensajeError.tsx`, `CampoTexto.tsx`/`CampoSeleccion.tsx` (borde de error), `MenuAcciones.tsx` (opción peligrosa), `TarjetaMascota.tsx` (borde cuando está vencido) | `color/peligro`, `color/peligro-fondo` |
| `amber-100` / `amber-900` | `TarjetaMascota.tsx` (estado "Pendiente") | `color/advertencia`, `color/advertencia-fondo` |
| `green-100` / `green-900` | `TarjetaMascota.tsx` (estado "Realizado") | `color/exito`, `color/exito-fondo` |
| `neutral-50` / `neutral-100` / `neutral-200` / `neutral-600` / `neutral-800` | `TarjetaMascota.tsx` (estado "Omitido", fondo cuando finaliza), `CampoTexto.tsx` (estado deshabilitado) | `color/neutral`, `color/neutral-fondo` |

No hay ningún componente de "éxito" (`MensajeExito.tsx`) con color propio declarado como token tampoco — usa una clase aparte que hay que revisar al leerlo en detalle durante el inventario.

> **Actualización (Etapa 1, 14/11) — inventario real con `grep` sobre `frontend/app` y `frontend/componentes`.** Hay más colores crudos que los de la tabla anterior, y la tabla de tokens definitiva quedó así (creada en Figma, colección `Color`, modo `Claro`):
>
> | Color crudo hoy | Dónde | Token que lo reemplaza |
> |---|---|---|
> | `bg-white` (25 usos), `text-white` (4) | tarjetas, campos, diálogos, botón primario/peligro, chip seleccionado | `color/blanco` `#ffffff` |
> | `backdrop:bg-black/40` | `Dialogo.tsx` | `color/velo` `#000000` al 40 % |
> | `red-700` (texto, botón) y `red-600` (borde de campo con error) | `Boton.tsx`, `CampoTexto.tsx`, `CampoSeleccion.tsx`, `MenuAcciones.tsx`, `MensajeError.tsx` | `color/peligro` `#b91c1c` — **se unifican** los dos rojos en uno (inconsistencia resuelta) |
> | `red-800` (hover), `red-900` (texto insignia Vencido) | `Boton.tsx`, `TarjetaMascota.tsx` | `color/peligro-profundo` `#991b1b` |
> | `red-100` | insignia Vencido | `color/peligro-suave` `#fee2e2` |
> | `red-50` | `MensajeError.tsx`, hover de opción peligrosa | `color/peligro-fondo` `#fef2f2` |
> | `red-300` | borde de `MensajeError.tsx` y de la tarjeta vencida | `color/peligro-borde` `#fca5a5` |
> | `amber-900` / `amber-100` / `amber-50` / `amber-300` | insignia Pendiente; avisos de `FormularioIngreso.tsx` y `FormularioRecuperar.tsx` | `color/advertencia` / `-suave` / `-fondo` / `-borde` |
> | `emerald-800/50/300` (avisos) **y** `green-900/100` (insignia Realizado) | `FormularioIngreso.tsx`, `FormularioRecuperar.tsx`, `TarjetaMascota.tsx` | `color/exito` / `-suave` / `-fondo` / `-borde` — **se unifican** dos verdes distintos para el mismo significado (inconsistencia resuelta) |
> | `neutral-800/600/200/100/50` | insignia Omitido, campo deshabilitado, tarjeta finalizada | **No se crea familia "neutral"**: se reutiliza la paleta que ya existe (`tinta` sobre `arena` para Omitido, `grisazulado` sobre `fondo` para deshabilitado, `fondo` para tarjeta finalizada). Los grises puros de Tailwind no pertenecen a la paleta menta/arena del proyecto (inconsistencia resuelta). |
>
> Resultado: **24 variables** (los 9 de `globals.css` + 15 nuevos). Cada una tiene `codeSyntax` WEB `var(--color-<nombre>)`, una descripción de uso y scopes explícitos (nunca "todos").

**Otra inconsistencia de inventario:** `BuscadorMascotas.tsx` tiene un `<input type="search">` escrito a mano con su propio `border-contorno`/padding en vez de reusar `CampoTexto.tsx`, y la fila de cada invitación en `PanelAccesos.tsx` es un `<li>` de marcado suelto en vez de un componente propio (mientras que `TarjetaMascota.tsx` sí es un componente) — ambas cosas se documentan en el inventario de la Etapa 2 y se resuelven del lado de Figma creando el componente que falta (`Tarjeta de cuidado compartido`, ver §4).

### 2.3 Tipografía actual (`frontend/app/layout.tsx:1-14`, `globals.css:13-14`)

- **Geist Sans** (`next/font/google`, variable `--font-geist-sans`) — única fuente de la interfaz.
- **Geist Mono** (`--font-geist-mono`) — cargada pero sin uso visible en pantallas de producto (revisar en el inventario; probablemente solo relevante si se muestra código en algún lado).
- **No existe una escala tipográfica declarada como token.** Hoy cada pantalla usa clases sueltas de Tailwind (`text-4xl`/`text-5xl` en el H1 del landing, `text-2xl` en el H1 de las tarjetas de acceso, `text-xl`/`text-lg` en títulos de sección, `text-sm` en ayuda/metadatos). Esto se formaliza como tokens de tipografía en Figma y en código (ver §6):

| Nombre de estilo en Figma | Tamaño/peso aproximado (del código actual) | Uso |
|---|---|---|
| `tipografia/titulo-1` | 36–48px, bold (`text-4xl sm:text-5xl`) | H1 del landing |
| `tipografia/titulo-2` | 24px, bold (`text-2xl`) | H1 de tarjetas de acceso / secciones principales |
| `tipografia/titulo-3` | 18–20px, bold/semibold (`text-lg`/`text-xl`) | Subtítulos de panel, nombre de mascota |
| `tipografia/cuerpo` | 16px, normal | Texto de párrafo general |
| `tipografia/etiqueta` | 14px, medium/semibold (`text-sm font-semibold`) | Labels de campo, botones pequeños |
| `tipografia/ayuda` | 14px, normal, color `grisazulado` (`text-sm text-grisazulado`) | Texto de ayuda y metadatos |

> **Actualización (Etapa 1):** la escala definitiva creada en Figma tiene **9 estilos** (Geist, `letterSpacing` 0, alturas de línea de Tailwind): `titulo-1` Bold 48/48, `titulo-2` Bold 24/32, `titulo-3` Bold 20/28, `titulo-4` Bold 18/28, `cuerpo` Regular 16/24, `cuerpo-medio` Medium 16/24 (etiquetas de campo), `boton` SemiBold 16/24, `etiqueta` SemiBold 14/20, `ayuda` Regular 14/20. Se separaron `cuerpo-medio` y `boton` porque el código usa `font-medium` en etiquetas y `font-semibold` en botones y navegación. Los títulos responsivos (`text-2xl sm:text-3xl`) se diseñan con su tamaño de escritorio y se anotan en la pantalla.

### 2.4 Logo

**No existe ningún logo hoy** (confirmado por el usuario). Se diseña desde cero en Figma, dentro de este mismo plan, como un wordmark simple ("Mascota al Día" con la tipografía y el color `menta-oscuro`/`menta-profundo` del sistema) y, si el tiempo/créditos alcanzan, un ícono simple (huella o collar) a su lado. Deliberadamente simple para no gastar etapas enteras en esto: es un requisito del rubro ("logo" aparece en la diapositiva de "Sistema de diseño en Figma"), no el centro del proyecto.

## 3. Los 7 flujos (se diseñan **separados**, cada uno en su propia página de Figma)

Mapeado 1:1 contra `frontend/app/*/page.tsx` y los `Panel*.tsx` que renderizan:

| # | Flujo (página de Figma) | Ruta(s) en código | Pantallas / estados a diseñar |
|---|---|---|---|
| 1 | **Landing** | `/` (`app/page.tsx`) | 1 pantalla estática (sin estados) |
| 2 | **Autenticación** | `/ingresar`, `/registro`, `/recuperar` | 3 pantallas base + estado con error de validación + estado "enviando" (botón en `cargando`) |
| 3 | **Mascotas** (panel principal) | `/inicio` (`PanelMascota.tsx`) | Cargando / Vacío / Con datos (grid de tarjetas + filtros) + 7 modales: nueva mascota, editar, reprogramar, asignar responsable, confirmar "marcar como realizado", omitir con motivo, confirmar eliminar |
| 4 | **Historial** | `/historial` (`PanelHistorial.tsx`) | Cargando / Vacío / Con datos (lista de registros) |
| 5 | **Compartir** | `/compartir` (`PanelAccesos.tsx`) | Formulario de invitar + lista "enviados" (vacía/con datos) + lista "recibidos" (vacía/con datos, con acciones aceptar/rechazar) |
| 6 | **Analítica** | `/analitica` (`PanelAnalitica.tsx`) | Cargando / Vacío / Con datos |
| 7 | **Mi cuenta** | `/cuenta` (`PanelCuenta.tsx`) | Descargar datos + eliminar cuenta + diálogo de confirmación honesta (botones del mismo tamaño) |

Cada página de Figma lleva además el `BarraSuperior` como marco común (salvo Landing y Autenticación, que no la usan en el código).

## 4. Los componentes del sistema (≥10, con variantes y estados) — mapeados 1:1 al código

Se eligieron 11 para tener margen sobre el mínimo de 10. Cada fila es la futura fila de la tabla componente↔archivo que pide el rubro (plantilla completa en §6.3).

| # | Componente en Figma | Archivo de código | Variantes | Estados |
|---|---|---|---|---|
| 1 | Botón | `Boton.tsx` | primario / secundario / texto / peligro | reposo / hover / enfocado / deshabilitado / cargando |
| 2 | Campo de texto | `CampoTexto.tsx` | texto / email / password (con mostrar‑ocultar) / fecha / número | reposo / enfocado / con ayuda / con error / deshabilitado |
| 3 | Campo de selección | `CampoSeleccion.tsx` | con opción "otro" / sin ella | reposo / con error / "otro" expandido (campo de texto visible) |
| 4 | Chip | `Chip.tsx` | único | no seleccionado / seleccionado / hover / enfocado |
| 5 | Insignia de estado *(nuevo, formaliza el objeto `estado` inline de `TarjetaMascota.tsx:44-63`)* | `TarjetaMascota.tsx` (a extraer) | — | pendiente (`advertencia`) / vencido (`peligro`) / realizado (`exito`) / omitido (`neutral`) |
| 6 | Diálogo | `Dialogo.tsx` + `DialogoConfirmar.tsx` | genérico (con formulario) / confirmación | abierto con foco atrapado; en confirmación: normal / peligroso, y botón confirmar en reposo / cargando |
| 7 | Tarjeta de mascota | `TarjetaMascota.tsx` | permiso: propietario (con menú de acciones) / gestión / consulta (solo lectura) | pendiente / vencido / realizado / omitido |
| 8 | Tarjeta de cuidado compartido *(nuevo, formaliza el `<li>` suelto de `PanelAccesos.tsx:112-162`)* | `PanelAccesos.tsx` (a extraer) | enviado (con botón revocar) / recibido (con aceptar/rechazar) | pendiente / aceptado / rechazado / revocado |
| 9 | Barra superior | `BarraSuperior.tsx` | — | enlace actual / no actual, por cada una de las 5 secciones (Mascotas, Historial, Compartir, Analítica, Mi cuenta) |
| 10 | Menú de acciones | `MenuAcciones.tsx` | — | cerrado / abierto; opción normal / opción peligrosa |
| 11 | Mensaje de aviso | `MensajeError.tsx` + `MensajeExito.tsx` | error / éxito | visible (oculto no se diseña: el componente no se renderiza) |

La **tarjeta de acceso de autenticación** (`TarjetaAcceso.tsx`, el marco de ingresar/registro/recuperar) no se cuenta como componente del sistema aparte: no tiene variantes ni estados propios, es solo un contenedor — se arma directamente dentro de las pantallas del flujo 2 usando el resto de componentes.

## 5. Etapas (para no quedar a medias)

Cada etapa es acumulativa y cierra con un commit propio y, cuando aplica, una captura (`get_screenshot`) guardada como evidencia. Si los créditos de Figma se acaban, el orden está pensado para que lo perdido sea siempre lo de *menor* valor para la nota (pantallas ensambladas) y lo que sobrevive sea siempre lo de *mayor* valor (variables/tokens + componentes con estados), porque esas dos cosas se evalúan como ítems propios y separados de "las pantallas se arman con ellos".

### Etapa 0 — Preparar el archivo (barata, sin riesgo de créditos) — ✅ completada 14/11

**Archivo de Figma:** [Mascota Dia](https://www.figma.com/design/Pq8Q35LoYXwrKROyiItaCe/Mascota-Dia) (`fileKey` `Pq8Q35LoYXwrKROyiItaCe`).

1. ✅ `whoami` confirmado (cuenta y equipo "Grupo IHC" visibles).
2. ✅ El archivo ya existía (creado por el usuario) y estaba vacío: una sola página "Page 1", sin variables, sin estilos de texto ni de color. Se abrió la sesión con `create_session` sobre su `fileKey`; no hizo falta `create_new_file`.
3. ✅ Estructura de páginas creada con `use_figma` ("Page 1" renombrada a Portada, el resto creadas):

   | ID de página | Nombre |
   |---|---|
   | `0:1` | 00 · Portada |
   | `9:2` | 01 · Fundaciones |
   | `9:3` | 02 · Componentes |
   | `9:4` | 03 · Flujo 1 · Landing |
   | `9:5` | 04 · Flujo 2 · Autenticación |
   | `9:6` | 05 · Flujo 3 · Mascotas |
   | `9:7` | 06 · Flujo 4 · Historial |
   | `9:8` | 07 · Flujo 5 · Compartir |
   | `9:9` | 08 · Flujo 6 · Analítica |
   | `9:10` | 09 · Flujo 7 · Mi cuenta |

4. Commit: `docs(figma): crear archivo y estructura del sistema de diseño` (este `.md` con el link y los IDs de página).

### Etapa 1 — Fundaciones: variables, tipografía y logo — ✅ completada 14/11
1. ✅ **Variables de color**: colección `Color` (modo `Claro`) con 24 variables — ver la tabla actualizada en §2.2. Antes se buscó con `get_libraries` + `search_design_system`: el archivo no tenía librerías ni tokens, y los kits comunitarios disponibles (Material 3, iOS…) no calzan con la paleta del código, así que se construyó desde `globals.css`.
2. ✅ **Estilos de texto**: 9 estilos `tipografia/*` en Geist (ver §2.3).
3. ✅ **Logo**: componente `Logo` con variantes `Versión=Completo` (huella + "Mascota al Día", 180×40) y `Versión=Ícono` (40×40). Huella blanca (`color/blanco`) sobre cuadrado redondeado `color/menta-oscuro`; wordmark Geist Bold 18 en `color/menta-profundo`, igual que el enlace de marca de `BarraSuperior.tsx`. Contraste blanco sobre `menta-oscuro` ≈ 4,9:1 (AA).
4. ✅ **Lámina "Fundaciones"** (página `01 · Fundaciones`, 1280 px de ancho): logo, las 24 muestras agrupadas (marca, superficies y texto, peligro, advertencia, éxito) con nombre de variable, token CSS, hex y uso, y la escala tipográfica con su clase Tailwind de origen. Todo enlazado a variables y estilos, sin un solo hex suelto.
5. ✅ Verificado con `get_screenshot`. Se encontró y corrigió un defecto: la unión de óvalos de la huella había quedado con el gris por defecto de Figma (`#d9d9d9`) sin variable; ahora está enlazada a `color/blanco`.
6. IDs de todo lo creado en [`docs/figma-registro-ids.json`](figma-registro-ids.json) (para retomar si se corta la sesión).
7. Commit: `docs(figma): fundaciones del sistema (color, tipografia, logo)`.

Esta etapa por sí sola, si no se avanza nada más, ya cubre "paleta y tipografía iguales a las del proyecto" y "logo" del rubro — es la de mayor prioridad si el tiempo aprieta.

### Etapa 2 — Primeros componentes + checkpoint del 17/11 (Clase 23)
Objetivo explícito del checkpoint: inventario + archivo de tokens con una pantalla sin colores fijos + un componente completo en Figma. Se hace de más (varios componentes, no solo uno) para llegar con margen:

1. **En Figma:** construir los componentes 1–5 de §4 (Botón, Campo de texto, Campo de selección, Chip, Insignia de estado) con todas sus variantes/estados como *component properties*, usando las variables de la Etapa 1 (nada de hex sueltos dentro del componente).
2. **En código (en paralelo, mismo repo):**
   - Agregar a `frontend/app/globals.css` las 15 variables nuevas de §2.2 (`--color-blanco`, `--color-velo`, `--color-peligro`, `--color-peligro-profundo`, `--color-peligro-suave`, `--color-peligro-fondo`, `--color-peligro-borde`, y las cuatro de `advertencia` y de `exito`) dentro del bloque `@theme inline`, con los mismos nombres y valores que las variables de Figma (`color/peligro` → `--color-peligro` → clase utilitaria `bg-peligro`/`text-peligro`).
   - Elegir **una pantalla** para dejarla sin colores fijos (candidata: **Mi cuenta**, `PanelCuenta.tsx` + `MensajeError.tsx`, porque es chica y su único color crudo es el `peligro` del botón de eliminar y del mensaje de error — fácil de verificar al 100%). Reemplazar ahí todas las clases `red-*` por las nuevas clases semánticas.
   - Redactar `docs/inventario-interfaz.md` (o una sección en `evidencias/clase-23.md`, según lo que pida el profesor ese día) con la tabla de inconsistencias de §2.2 y §2.3, más lo que se vaya encontrando al construir.
3. Commit(s) separados: uno para Figma (actualizar este plan con el link/estado), uno para `globals.css` + la pantalla migrada, uno para el inventario.
4. Lunes 16/11, 23:59: no se olvida la Tarea 10 (ya entregada según el historial de git de esta rama) — este plan no la toca.

### Etapa 3 — Resto de componentes (6–11 de §4)
1. Diálogo (genérico + confirmación, con el detalle de "botones del mismo tamaño" ya presente en el código).
2. Tarjeta de mascota, con sus 3 variantes de permiso × 4 estados (usa la Insignia de estado de la Etapa 2 como sub-componente, no como color repetido).
3. Tarjeta de cuidado compartido (nuevo).
4. Barra superior, con sus 5 estados de "actual".
5. Menú de acciones.
6. Mensaje de aviso (error/éxito).
7. Página `02 · Componentes` queda como el "escaparate" fácil de mostrar en los 10 minutos de defensa: todas las variantes y estados visibles de un vistazo.

### Etapa 4 — Ensamblar las 7 pantallas con los componentes ya creados
Orden sugerido (de menor a mayor esfuerzo, para asegurar cobertura si el tiempo se acorta):
1. Autenticación (3 pantallas simples).
2. Landing (1 pantalla).
3. Mi cuenta (ya tiene su pantalla sin colores fijos resuelta en código desde la Etapa 2; ahora se arma la versión Figma).
4. Compartir.
5. Historial.
6. Analítica.
7. Mascotas (la más grande: grid + 7 modales) — se deja para el final porque es la que más componentes reutiliza y por lo tanto la que sale más rápida una vez que el resto del sistema ya existe.

Cada pantalla se arma **insertando instancias** de los componentes de la Etapa 2–3, nunca dibujando rectángulos/texto sueltos — es literalmente lo que pide "las pantallas se arman con ellos".

### Etapa 5 — Tokens en código, completos
1. Revisar **todo** el código tocado durante el proyecto (no solo la pantalla de la Etapa 2) y reemplazar cualquier clase de color cruda de Tailwind (`red-*`, `amber-*`, `green-*`, `neutral-*`, y cualquier otra que aparezca) por las variables semánticas del `@theme inline`.
2. Completar la **tabla componente ↔ archivo** (plantilla en §6.3) en el repo (`docs/` o `README.md`, según se prefiera), con los nombres ya verificados contra los nombres reales usados en Figma.
3. Confirmar con `npx tsc --noEmit` y `npm run build` (frontend) que nada se rompió.
4. Commit: `refactor(frontend): tokens semanticos sin colores fijos` (+ el commit de la tabla).

### Etapa 6 — Pulido y ensayo de la defensa (antes del 18/11 23:59)
1. Revisar con `get_screenshot` cada página del archivo de Figma; corregir inconsistencias visuales.
2. Verificar que la página `00 · Portada` resume el sistema en una sola vista (paleta, tipografía, logo, grid de componentes) — es lo primero que se enseña en los 10 minutos.
3. Ensayar la explicación de "cómo se armó" (nombres de variables, cómo cada pantalla usa componentes) para las 2 preguntas sobre el código del fork.
4. Cerrar el corte del repositorio antes de las 23:59 del miércoles 18/11 y enviar el usuario/contraseña de prueba a `bjvtamayo78@gmail.com`.

## 6. Entregables concretos de este plan

### 6.1 En Figma
- Archivo "Mascota al Día" en el equipo "Grupo IHC", con las páginas: Portada, Fundaciones, Componentes, y una por cada uno de los 7 flujos.
- Variables de color (9 base + 15 nuevas = 24) y estilos de tipografía (9), nombradas exactamente como en §2. ✅
- Logo.
- 11 componentes con sus variantes y estados (§4).
- Las 7 pantallas armadas solo con instancias de esos componentes.

### 6.2 En código
- `frontend/app/globals.css`: variables semánticas nuevas agregadas al bloque `@theme inline`, con los mismos nombres que Figma.
- Al menos una pantalla (Mi cuenta, Etapa 2) sin ninguna clase de color cruda de Tailwind — y, al cerrar la Etapa 5, todas las pantallas tocadas durante el proyecto.
- `docs/inventario-interfaz.md` (o equivalente en `evidencias/clase-23.md`): tabla de inconsistencias encontradas y cómo se resolvieron.
- Tabla componente ↔ archivo (plantilla abajo), completa.

### 6.3 Plantilla de la tabla componente ↔ archivo (pide el rubro explícitamente)

| Componente (Figma) | Archivo en el código | Variables/tokens que usa |
|---|---|---|
| Botón | `frontend/componentes/Boton.tsx` | `color/menta-oscuro`, `color/menta-profundo`, `color/contorno`, `color/tinta`, `color/peligro` |
| Campo de texto | `frontend/componentes/CampoTexto.tsx` | `color/blanco`, `color/contorno`, `color/peligro`, `color/fondo` + `color/grisazulado` (deshabilitado) |
| Campo de selección | `frontend/componentes/CampoSeleccion.tsx` | `color/contorno`, `color/peligro` |
| Chip | `frontend/componentes/Chip.tsx` | `color/menta-oscuro`, `color/contorno`, `color/menta-claro` |
| Insignia de estado | `frontend/componentes/TarjetaMascota.tsx` | `color/advertencia(-suave)`, `color/peligro-profundo` + `color/peligro-suave`, `color/exito(-suave)`, `color/tinta` + `color/arena` (omitido) |
| Diálogo | `frontend/componentes/Dialogo.tsx`, `DialogoConfirmar.tsx` | `color/menta-profundo` (foco), `color/peligro` |
| Tarjeta de mascota | `frontend/componentes/TarjetaMascota.tsx` | `color/arena`, `color/peligro`, `color/grisazulado` |
| Tarjeta de cuidado compartido | `frontend/componentes/PanelAccesos.tsx` | `color/arena`, `color/grisazulado` |
| Barra superior | `frontend/componentes/BarraSuperior.tsx` | `color/arena`, `color/menta-claro`, `color/menta-profundo` |
| Menú de acciones | `frontend/componentes/MenuAcciones.tsx` | `color/arena`, `color/menta-claro`, `color/peligro` |
| Mensaje de aviso | `frontend/componentes/MensajeError.tsx`, `MensajeExito.tsx` | `color/peligro(-fondo, -borde)`; el éxito flotante usa `color/tinta` + `color/blanco` |

*(Se deja como plantilla: se completa/ajusta con lo que realmente se termine usando en cada componente a medida que avanzan las etapas.)*

## 7. Fuera del alcance detallado de este plan

El rubro del jueves 19/11 incluye más ítems que no son "diseños en Figma" y por lo tanto no se detallan etapa por etapa aquí (requieren su propio plan si hace falta): pruebas E2E con 100% de cobertura del código del fork (`diff-cover`), reporte de accesibilidad (Lighthouse/WAVE) con contraste AA corregido, video de los flujos principales, informe (problema/usuario/funcionalidades/decisiones/mapa de conexión/comparación IA vs. sin IA), y la app desplegada en la nube con usuario de prueba. Se mencionan aquí solo como recordatorio de que comparten la misma fecha de corte (miércoles 18/11, 23:59) que este plan de diseño.
