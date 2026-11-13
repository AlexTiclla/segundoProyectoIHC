# Cómo funciona el código de "Mascota al Día"

Guía para explicar (y defender en preguntas) cómo viaja una acción desde la pantalla hasta la base de datos. Se basa en el código real y en los últimos commits.

## 1. Visión general

| Capa | Tecnología | Carpeta |
|---|---|---|
| Frontend | Next.js (App Router) + React + TypeScript + Tailwind | `frontend/` |
| Backend | FastAPI + SQLAlchemy + Pydantic | `backend/app/` |
| Base de datos | PostgreSQL en Neon (SQLite en pruebas y E2E locales) | definida por `URL_BASE_DATOS` |
| Pruebas | pytest (backend) y Playwright (E2E) | `backend/tests/`, `tests/` |

El backend usa **arquitectura en capas**. Cada capa solo habla con la siguiente:

```
Router  ->  Servicio  ->  Repositorio  ->  Modelo (tabla)
(HTTP)      (reglas)      (consultas)       (SQLAlchemy)
```

| Capa | Responsabilidad | Ejemplo |
|---|---|---|
| `routers/` | Recibir la petición HTTP, validar con el esquema y llamar al servicio. No tiene reglas. | `routers/mascota.py` |
| `schemas/` | Forma de los datos de entrada y salida (Pydantic). | `schemas/mascota.py` |
| `services/` | **Reglas de negocio**, permisos, historial. Lanza `ErrorDeNegocio`. | `services/mascota_servicio.py` |
| `repositories/` | Lo único que hace `select`, `add` y `commit`. | `repositories/mascota_repositorio.py` |
| `models/` | Tablas y propiedades calculadas. | `models/mascota.py` |

## 2. Recorrido completo de una acción: "Omitir con motivo" (Tarea 9)

Es el ejemplo más reciente (commit `c44f3bc`), así que es el más probable en preguntas.

```
Usuario pulsa "Omitir con motivo" en la tarjeta
  |
  v
TarjetaMascota.tsx        -> llama alOmitir(mascota)         (no omite, solo avisa)
  |
  v
PanelMascota.tsx          -> setAccion({tipo:"omitir"})      (abre el diálogo)
  |
  v
FormularioOmitir.tsx      -> valida motivo no vacío, llama omitirCuidado(id, motivo)
  |
  v
lib/api.ts                -> pedir("/mascotas/{id}/omitir", PATCH, {motivo})
  |      fetch("/api/mascotas/5/omitir")
  v
next.config.ts (rewrites) -> /api/:path*  =>  http://127.0.0.1:8000/:path*
  |
  v
routers/mascota.py        -> @router.patch("/{mascota_id}/omitir")
  |      Depends(obtener_sesion) y Depends(obtener_usuario_actual)
  |      Pydantic valida el cuerpo con MascotaOmitir (motivo 1..200)
  v
services/mascota_servicio.py -> omitir_cuidado(...)
  |      1. _obtener_con_permiso(...PUEDEN_GESTIONAR)  -> 404 / 403
  |      2. if not mascota.vencido -> 400
  |      3. motivo.strip() vacío   -> 400
  |      4. proxima_fecha = mascota.proxima_fecha
  v
repositories/mascota_repositorio.py -> omitir(...)
  |      estado = "omitido", motivo_omision = motivo
  |      si hay proxima_fecha: crea una nueva fila Mascota (la siguiente)
  |      session.commit()   <- un solo commit
  v
Base de datos: UPDATE mascotas + INSERT mascotas (si es recurrente)
  |
  v
historial_servicio.registrar("omitir") y ("programar")  -> INSERT historial
  |
  v
Respuesta JSON (MascotaSalida) <- snake_case
  |
  v
api.ts convertirMascota() -> camelCase
  |
  v
FormularioOmitir -> alGuardar("Se omitió...") -> PanelMascota.cargar() -> GET /mascotas/filtrar -> la lista se repinta
```

### Paso a paso

1. **Tarjeta (`frontend/componentes/TarjetaMascota.tsx`)**: el botón "Omitir con motivo" solo aparece si `mascota.vencido` y el usuario puede gestionar (`permiso !== "consulta"`). Es un componente de presentación: recibe callbacks por props (`alOmitir`) y no llama al servidor.
2. **Panel (`frontend/componentes/PanelMascota.tsx`)**: es el componente contenedor. Guarda en el estado una sola variable `accion` (qué diálogo está abierto) y la lista `mascotas`. Al recibir `alOmitir`, hace `setAccion({ tipo: "omitir", mascota })` y se renderiza `<FormularioOmitir>` dentro de un `<Dialogo>`.
3. **Formulario (`FormularioOmitir.tsx`)**: valida en el cliente que el motivo no esté vacío, pone `cargando`, llama `omitirCuidado` y captura `ErrorApi` para mostrar el mensaje que mandó el backend.
4. **Cliente HTTP (`frontend/lib/api.ts`)**:
   - `pedir<T>()` es el único punto que hace `fetch`. Siempre llama a `/api/...`, nunca directo al backend.
   - Convierte errores en `ErrorApi` usando `detail` del backend. Si recibe 401 fuera de `/auth/`, redirige a `/ingresar?sesion=vencida`.
   - `convertirMascota()` pasa de `snake_case` (backend) a `camelCase` (frontend).
5. **Proxy de Next (`frontend/next.config.ts`)**: el `rewrites` reenvía `/api/:path*` a `urlBackend` (`URL_BASE` o `http://127.0.0.1:8000`). Así el navegador cree que backend y frontend son el mismo origen, y la cookie de sesión viaja sin problemas de CORS.
6. **Router (`backend/app/routers/mascota.py`)**: `PATCH /mascotas/{mascota_id}/omitir`. FastAPI valida el cuerpo con `MascotaOmitir`, inyecta la sesión de base de datos y el usuario autenticado, y delega en `mascota_servicio.omitir_cuidado`.
7. **Servicio (`backend/app/services/mascota_servicio.py`)**: aquí viven las reglas. Orden: permiso, luego vencido, luego motivo, luego repositorio, luego historial.
8. **Repositorio (`backend/app/repositories/mascota_repositorio.py`)**: cambia el estado a `omitido`, guarda `motivo_omision` y, si el cuidado es recurrente, crea la siguiente ocurrencia. **Un solo `commit`** para que no quede omitido sin su siguiente.
9. **Modelo (`backend/app/models/mascota.py`)**: define la tabla `mascotas` y las propiedades calculadas (`vencido`, `proxima_fecha`, `proximas_fechas`, `fecha_original`) que **no se guardan en la base**.
10. **Vuelta**: el router devuelve `MascotaSalida` (`response_model`), el frontend lo convierte, el panel recarga la lista con `cargar()`.

## 3. Autenticación: cómo sabe el backend quién eres

1. `POST /auth/ingresar` (`routers/auth.py`) verifica la contraseña con bcrypt (`seguridad.py`) y crea un **JWT** (`crear_token`) con `sub = usuario.id` y expiración.
2. El token se guarda en una **cookie `sesion`** con `httponly=True` y `samesite="lax"`. JavaScript no puede leerla.
3. En cada petición protegida, `dependencias.obtener_usuario_actual` lee la cookie, llama a `auth_servicio.usuario_desde_token` y devuelve el `Usuario`, o lanza `ErrorDeNegocio("No has iniciado sesión", 401)`.
4. En Next hay **dos protecciones**:
   - `frontend/proxy.ts` (middleware): si no existe la cookie, redirige a `/ingresar` para `/inicio`, `/historial`, `/compartir` y `/analitica`. Solo comprueba que la cookie exista.
   - `frontend/lib/apiServidor.ts`: en el servidor, `obtenerUsuarioActual()` llama a `/auth/yo` con la cookie. Lo usa `app/inicio/page.tsx` para validar de verdad y obtener el nombre.

## 4. Manejo de errores

- `backend/app/errores.py`: `ErrorDeNegocio(mensaje, estado)`.
- `backend/app/main.py`: un `exception_handler` lo convierte en `JSONResponse({"detail": mensaje}, status)`.
- `frontend/lib/api.ts`: lee `detail` y lanza `ErrorApi(mensaje, estado)`.
- Los componentes hacen `catch (e)` y muestran `e.message` si es `ErrorApi`.

Códigos usados: **400** regla rota, **401** sin sesión, **403** permiso de solo consulta, **404** no existe o no tienes acceso, **409** duplicado.

Detalle de seguridad: si un usuario no tiene acceso a un cuidado, responde **404 y no 403**, para no revelar que existe.

## 5. Permisos y cuidados compartidos (Tarea 8)

- Tabla `accesos` (`models/acceso.py`): propietario, invitado, `permiso` (`consulta` o `gestion`) y `estado` (`pendiente`, `aceptado`, `rechazado`, `revocado`). Revocar **no borra**: cambia el estado.
- `mascota_servicio._obtener_con_permiso(session, id, usuario_id, permitidos)`:
  - Si eres el dueño, el permiso es `propietario`.
  - Si no, busca un acceso `aceptado` del dueño hacia ti.
  - Si el permiso no está en `permitidos`, lanza 403.
  - Guarda el permiso en `mascota.permiso`, un atributo normal de Python (no es columna), y el esquema lo devuelve al frontend.
- Constantes: `PUEDEN_VER = (propietario, consulta, gestion)` y `PUEDEN_GESTIONAR = (propietario, gestion)`. Eliminar y asignar responsable usan `_obtener_propia`, solo del propietario.
- `mascota_repositorio._visibles(usuario_id)`: la consulta SQL trae las mascotas propias **o** las de dueños que te aceptaron como invitado.
- En el frontend, `TarjetaMascota` oculta botones según `permiso`. Esto es solo UX: **el backend es quien realmente protege**.

## 6. Reglas del dominio que suelen preguntar

### Estados de un cuidado
`pendiente` -> `realizado` u `omitido`. Los dos últimos son finales: no se puede realizar, editar ni reprogramar (ver `test_no_se_puede_realizar_ni_editar_un_omitido`).

### Vencido (`models/mascota.py`, propiedad `vencido`)
```python
estado == PENDIENTE and fecha_cuidado < date.today() and not eliminada
```
**No es una columna.** Se calcula cada vez, así no hay que ejecutar un proceso diario para actualizarlo. El esquema `MascotaSalida` lo expone como `vencido: bool`.

### Recurrencia (`backend/app/recurrencia.py`)
- Un cuidado recurrente tiene `intervalo_cantidad` e `intervalo_unidad` (`dias`, `meses`, `anios`).
- Solo se guarda la **siguiente** ocurrencia cuando se realiza u omite la actual. Las "próximas fechas" son calculadas (`proximas_fechas`).
- `sumar_intervalo`: si el mes destino es más corto, usa su último día (31 ene + 1 mes = 28 feb).
- `fecha_base` marca desde dónde se cuentan las fechas. Al reprogramar con alcance `futuras` se mueve la base y arrastra las siguientes. Con `solo_esta` no se mueve.
- **Al omitir o realizar tarde, la siguiente fecha se calcula desde la fecha planificada, no desde hoy** (ver `test_omitir_recurrente_respetando_fecha_planificada`).

### Marcar como realizado (`marcar_realizado`)
- Sin recurrencia: `repo.marcar_realizada` guarda `estado`, `realizado_por_id` y `realizado_en = hoy`.
- Con recurrencia: `repo.realizar_y_programar` hace lo mismo y crea la siguiente fila en **un solo commit**.
- El mismo botón se llama "Realizado tarde" si el cuidado está vencido.

### Reprogramar (`reprogramar_cuidado`)
- No permite fechas anteriores a hoy, ni la misma fecha, y exige motivo.
- Inserta una fila en `reprogramaciones` (nunca se edita ni se borra) y cambia `fecha_cuidado` en un solo commit.

### Eliminar
Es **borrado lógico**: `eliminada = True`. Todas las consultas filtran `eliminada.is_(False)`.

## 7. Historial (auditoría)

Cada acción del servicio llama a `historial_servicio.registrar(session, tipo_accion, descripcion, usuario_id, mascota_id)`, que inserta en la tabla `historial` mediante `historial_repositorio.crear`. Se lee con `GET /historial` (`routers/historial.py`) y se muestra en `app/historial/page.tsx` con `PanelHistorial.tsx`.

Tipos usados: `crear`, `actualizar`, `eliminar`, `realizar`, `reprogramar`, `responsable`, `omitir`, `programar`.

## 8. Analítica (clase 21)

| Pieza | Archivo |
|---|---|
| Tabla `eventos` (`evento`, `props` JSON, `flujo_id`, `fecha`) | `backend/app/models/evento.py` |
| Esquemas | `backend/app/schemas/evento.py` |
| `POST /analitica/eventos` y `GET /analitica/resumen` | `backend/app/routers/analitica.py` |
| Emisión del evento | `frontend/lib/api.ts` (`registrarEvento`, `flujoIdDeCuidado`) |
| Panel | `frontend/componentes/PanelAnalitica.tsx` y `app/analitica/page.tsx` |

- `cuidado_abierto` se emite en `FormularioMascota.tsx` al crear una mascota. `cuidado_completado` se emite en `PanelMascota.tsx` al marcar como realizado.
- `flujoIdDeCuidado(id)` genera un UUID determinista desde el id de la mascota, así ambos eventos comparten el mismo `flujo_id`.
- `registrarEvento` **traga los errores** a propósito: la analítica no debe romper la acción real.
- `resumen`: `iniciados` = `flujo_id` distintos con `cuidado_abierto`. `completados` = distintos con `cuidado_completado` que además estén entre los iniciados. `porcentaje = completados / iniciados * 100`.
- Limitaciones: se agrega **globalmente**, no por usuario, y omitir **no** emite evento.

## 9. Base de datos

- Conexión en `backend/app/base_datos.py`: `create_engine(url_base_datos, pool_pre_ping=True)` y `sessionmaker`. `obtener_sesion()` es un generador con `yield` y `finally: close()`, que FastAPI inyecta con `Depends`.
- Configuración en `backend/app/config.py` (`pydantic-settings` lee `.env`): `URL_BASE_DATOS`, `SECRETO_JWT`, `MINUTOS_SESION`, `MINUTOS_CODIGO_RECUPERACION`.
- Las tablas se crean en `main.py` con `Base.metadata.create_all(bind=motor)`. **No hay migraciones (Alembic)**, así que agregar una columna a una tabla existente no la altera.
- Tablas: `usuarios`, `mascotas`, `historial`, `reprogramaciones`, `accesos`, `eventos`.
- Relaciones clave en `mascotas`: `usuario_id` (propietario), `responsable_id`, `realizado_por_id`, todas hacia `usuarios.id`. Por eso `Mascota.usuario` tiene `foreign_keys` explícito.
- Cada "cuidado" es una fila de la tabla `mascotas` (el nombre histórico es confuso: una "mascota" es en realidad un cuidado de una mascota).

## 10. Evolución según los últimos commits

| Commit | Qué agregó | Archivos clave |
|---|---|---|
| `8bd5816` (Tarea 8) | Cuidados compartidos con permisos | `models/acceso.py`, `services/acceso_servicio.py`, `routers/acceso.py`, `PanelAccesos.tsx`, `app/compartir/page.tsx` |
| `07841ee` (clase 21) | Backend de analítica | `models/evento.py`, `routers/analitica.py`, `schemas/evento.py` |
| `ea13845` | Flujo completo de analítica en pantalla y E2E | `PanelAnalitica.tsx`, `app/analitica/page.tsx`, `tests/analitica.spec.ts` |
| `c44f3bc` (Tarea 9) | Cuidados vencidos: omitir con motivo y realizar tarde | `models/mascota.py` (`vencido`, `motivo_omision`), `services/mascota_servicio.py` (`omitir_cuidado`), `repositories/mascota_repositorio.py` (`omitir`), `routers/mascota.py`, `FormularioOmitir.tsx`, `TarjetaMascota.tsx`, `tests/test_cuidados_vencidos.py`, `tests/cuidados-vencidos.spec.ts` |
| Cambios sin commit | Comentarios en `omitir` y `vencido` | ver sección 12 |

## 11. Archivos clave para estudiar (en orden)

**Backend**
1. `backend/app/main.py`: ensambla routers y el manejador de errores.
2. `backend/app/routers/mascota.py`: todas las rutas del cuidado.
3. `backend/app/services/mascota_servicio.py`: **el archivo más importante**, con todas las reglas.
4. `backend/app/repositories/mascota_repositorio.py`: consultas y commits.
5. `backend/app/models/mascota.py`: columnas y propiedades calculadas.
6. `backend/app/schemas/mascota.py`: contrato de entrada y salida.
7. `backend/app/dependencias.py` y `backend/app/seguridad.py`: sesión, JWT y bcrypt.
8. `backend/app/recurrencia.py`: cálculo de fechas.

**Frontend**
1. `frontend/lib/api.ts`: **el puente con el backend** (`pedir`, conversores, funciones por endpoint).
2. `frontend/next.config.ts`: el proxy `/api`.
3. `frontend/proxy.ts`: protección de rutas.
4. `frontend/componentes/PanelMascota.tsx`: estado central y diálogos.
5. `frontend/componentes/TarjetaMascota.tsx`: qué se ve y cuándo.
6. `frontend/componentes/FormularioOmitir.tsx` (y `FormularioReprogramar.tsx`, `FormularioMascota.tsx`): formularios.
7. `frontend/lib/filtros.ts`: filtros de pantalla convertidos en parámetros de consulta.

**Pruebas**: `backend/tests/test_cuidados_vencidos.py`, `backend/tests/conftest.py` (SQLite en memoria) y `tests/cuidados-vencidos.spec.ts`.

## 12. Cosas raras que conviene saber (el profesor puede encontrarlas)

Estas se ven en el código actual. Conviene decidir si se corrigen antes de la revisión.

1. **`omitir` está definida dos veces** en `backend/app/repositories/mascota_repositorio.py` (líneas 216 y 251). Python usa la **segunda** (la comentada). Funciona, pero la primera sobra.
2. **Texto sobrante en `frontend/componentes/BarraSuperior.tsx`**: hay dos comillas invertidas (dos caracteres de acento grave) pegadas justo después de `</div>`, cerca de la línea 46. Es un cambio sin commit; aparecería como texto en pantalla. Conviene quitarlas.
3. **Bloque repetido en `TarjetaMascota.tsx`**: el párrafo "Realizado por ... el ..." aparece dos veces seguidas.
4. **`/mascotas/filtrar` solo acepta `pendiente` y `realizado`** (`Literal` en `routers/mascota.py` y en `api.ts`). No se puede filtrar por `omitido`.
5. **Omitir no genera evento de analítica**, y el resumen es global, no por usuario. Está reconocido en `evidencias/tarea-9.md`.
6. **Dos "pendiente" distintos**: `models/acceso.py` y `models/mascota.py` definen cada uno su constante `PENDIENTE`, con el mismo texto pero con significado distinto (invitación pendiente vs. cuidado pendiente).
7. **`main.py` no tiene CORS** porque el proxy de Next hace que todo sea mismo origen. Si se llamara al backend directo desde el navegador, fallaría.
8. **Sin migraciones**: `create_all` solo crea tablas nuevas. Una columna nueva (como `motivo_omision`) en una base ya creada exige alterar la tabla a mano o recrearla.

## 13. Preguntas probables y cómo responderlas

- **¿Dónde se valida que un cuidado se pueda omitir?** En `mascota_servicio.omitir_cuidado` (`if not mascota.vencido`). El frontend solo oculta el botón; el backend es la garantía.
- **¿Por qué `vencido` no es columna?** Depende de la fecha de hoy; guardarlo exigiría un proceso que lo actualice y podría quedar desfasado.
- **¿Por qué el commit está en el repositorio y no en el servicio?** El repositorio concentra el acceso a datos y agrupa en **un solo commit** los cambios que deben ser atómicos (omitir + crear la siguiente).
- **¿Qué pasa si falla `historial_servicio.registrar` después de omitir?** El cuidado ya quedó omitido (commit previo) pero sin registro. Cada capa hace su propio commit, así que no es una transacción única.
- **¿Cómo viajan los datos de snake_case a camelCase?** En `api.ts`, `convertirMascota` hace la traducción campo por campo.
- **¿Por qué el frontend llama a `/api/...`?** Por `rewrites` en `next.config.ts`, que lo reenvía al backend. La cookie viaja como si fuera el mismo sitio.
- **¿Cómo se protege una ruta privada?** `proxy.ts` (¿hay cookie?), `apiServidor.obtenerUsuarioActual` (¿es válida?) y `obtener_usuario_actual` en el backend (¿token válido?).
- **¿Qué diferencia hay entre `consulta` y `gestion`?** Consulta solo ve (`PUEDEN_VER`); gestión puede realizar, omitir, reprogramar y editar (`PUEDEN_GESTIONAR`). Eliminar y asignar responsable son solo del propietario.
- **¿Cómo se prueba?** `python -m pytest -q` en `backend` (SQLite en memoria, ver `conftest.py`) y `playwright test` en la raíz. `tests/cuidados-vencidos.spec.ts` requiere `E2E_SQLITE_LOCAL=1`, porque cambia la fecha del cuidado directamente en SQLite para simular que venció.
- **¿Qué hace el `Depends` en los routers?** Inyecta la sesión (`obtener_sesion`) y el usuario autenticado (`obtener_usuario_actual`) en cada ruta sin repetir código.
