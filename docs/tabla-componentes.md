# Tabla componente ↔ archivo

Sistema de diseño de Mascota al Día en Figma: [Mascota Dia](https://www.figma.com/design/Pq8Q35LoYXwrKROyiItaCe/Mascota-Dia), página `02 · Componentes`.

Cada componente de Figma usa variables con el mismo nombre que los tokens de `frontend/app/globals.css`. Ejemplo: la variable `color/peligro` de Figma es `--color-peligro` en CSS y las clases `bg-peligro` / `text-peligro` / `border-peligro` en Tailwind. Ningún archivo de `frontend/app` ni de `frontend/componentes` usa colores fijos. Para comprobarlo:

```bash
grep -rnE '\b[a-z:]*-(red|amber|green|emerald|neutral|gray|slate|black|white)(-[0-9]+)?\b|#[0-9a-fA-F]{3,6}\b' frontend/app frontend/componentes --include=*.tsx
```

## Los 11 componentes del sistema

| # | Componente (Figma) | Archivo en el código | Variantes y estados en Figma | Tokens que usa |
|---|---|---|---|---|
| 1 | Botón | `frontend/componentes/Boton.tsx` | Variante (primario, secundario, texto, peligro) × Estado (reposo, hover, enfocado, deshabilitado, cargando) = 20 | `menta-oscuro`, `menta-profundo`, `menta-claro`, `blanco`, `contorno`, `tinta`, `peligro`, `peligro-profundo` · `radio/lg` · `tamano/control-min` |
| 2 | Campo de texto | `frontend/componentes/CampoTexto.tsx` | Estado (reposo, enfocado, ayuda, error, deshabilitado) + booleano Contraseña | `blanco`, `contorno`, `tinta`, `grisazulado`, `peligro`, `fondo`, `menta-profundo` |
| 3 | Campo de selección | `frontend/componentes/CampoSeleccion.tsx` | Estado (reposo, enfocado, ayuda, error, otro) | `blanco`, `contorno`, `tinta`, `grisazulado`, `peligro` |
| 4 | Chip | `frontend/componentes/Chip.tsx` (agrupado en `GrupoChips.tsx`) | Estado (reposo, hover, enfocado, seleccionado) | `blanco`, `contorno`, `tinta`, `menta-claro`, `menta-oscuro` |
| 5 | Insignia de estado | `frontend/componentes/TarjetaMascota.tsx` (objeto `estado`) | Estado (pendiente, vencido, realizado, omitido) | `advertencia` + `advertencia-suave`, `peligro-profundo` + `peligro-suave`, `exito` + `exito-suave`, `tinta` + `arena` · `radio/full` |
| 6 | Diálogo | `frontend/componentes/Dialogo.tsx`, `DialogoConfirmar.tsx` | Tipo (confirmación, peligro, formulario) × Estado (reposo, guardando) = 5; el contenido del formulario se intercambia | `blanco`, `tinta`, `velo` · `radio/2xl` · `sombra/xl` |
| 7 | Tarjeta de mascota | `frontend/componentes/TarjetaMascota.tsx` | Permiso (propietario, gestión, consulta) × Estado (pendiente, vencido, realizado, omitido) = 12 | `blanco`, `fondo`, `arena`, `peligro-borde`, `tinta`, `grisazulado` · `radio/xl` · `sombra/sm` |
| 8 | Tarjeta de cuidado compartido | `frontend/componentes/PanelAccesos.tsx` (fila `<li>`) | Tipo (enviado, recibido) × Estado (pendiente, aceptado, rechazado, revocado) = 8 | `blanco`, `arena`, `tinta`, `grisazulado` · `radio/xl` · `sombra/sm` |
| 9 | Barra superior | `frontend/componentes/BarraSuperior.tsx` (+ `BotonSalir.tsx`) | Actual (mascotas, historial, compartir, analítica, cuenta) | `blanco`, `arena`, `menta-claro`, `menta-profundo`, `tinta`, `grisazulado` |
| 10 | Menú de acciones | `frontend/componentes/MenuAcciones.tsx` | Estado (cerrado, hover, abierto) | `blanco`, `arena`, `tinta`, `menta-claro`, `peligro`, `peligro-fondo` · `sombra/lg` |
| 11 | Mensaje de aviso | `frontend/componentes/MensajeError.tsx`, `MensajeExito.tsx`, avisos de `FormularioIngreso.tsx` y `FormularioRecuperar.tsx` | Tipo (error, éxito, advertencia, flotante) | `peligro`, `peligro-fondo`, `peligro-borde`, `exito`, `exito-fondo`, `exito-borde`, `advertencia`, `advertencia-fondo`, `advertencia-borde`, `tinta`, `blanco` · `sombra/lg` |

## Piezas auxiliares y formularios

Son componentes de Figma que existen para que las pantallas se armen solo con instancias.

| Componente (Figma) | Archivo en el código |
|---|---|
| Logo (Completo, Ícono, Texto) | Enlace de marca de `BarraSuperior.tsx` y `TarjetaAcceso.tsx` (hoy solo el texto) |
| Opción de menú | Botones internos de `MenuAcciones.tsx` |
| Enlace de navegación | Enlaces de `BarraSuperior.tsx` |
| Filtro activo | `ResumenFiltros.tsx` |
| Registro de historial | `<li>` de `PanelHistorial.tsx` |
| Métrica | Tarjetas de `PanelAnalitica.tsx` |
| Tarjeta de beneficio | `app/page.tsx` |
| Área de texto | `<textarea>` de `FormularioOmitir.tsx` |
| Formulario de mascota (nueva, editar) | `FormularioMascota.tsx` |
| Formulario reprogramar | `FormularioReprogramar.tsx` |
| Formulario responsable | `FormularioResponsable.tsx` |
| Formulario omitir | `FormularioOmitir.tsx` |
| Contenido de diálogo (hueco) | `children` de `Dialogo.tsx` |

## Fundaciones

| Figma | Código |
|---|---|
| Colección `Color` (24 variables `color/*`) | `@theme inline` de `frontend/app/globals.css` (`--color-*`) |
| Colección `Dimensiones`: `espacio/*`, `radio/*`, `tamano/control-min` | Escala de Tailwind v4: `--spacing`, `--radius-lg/xl/2xl`, `min-h-11` |
| 15 estilos `tipografia/*` (Geist) | Clases `text-*` + `font-*` de Tailwind, fuente `--font-geist-sans` |
| 3 estilos `sombra/sm`, `sombra/lg`, `sombra/xl` | `shadow-sm`, `shadow-lg`, `shadow-xl` de Tailwind v4 |
