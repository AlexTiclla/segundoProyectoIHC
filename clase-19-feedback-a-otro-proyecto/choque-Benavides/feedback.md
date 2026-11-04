# Feedback a otro proyecto — Clase 19

- **Nombre completo del evaluador:** [Completar nombre y apellidos]
- **Mi grupo y caso de estudio:** [Completar grupo] — Mascota al Día
- **Grupo y caso de estudio evaluado:** [Completar grupo] — Planazo
- **Integrantes del proyecto evaluado:** [Completar nombres]
- **URL de la app evaluada:** [Completar URL]
- **URL del repositorio evaluado:** [Completar URL]
- **Fecha de evaluación:** 3 de noviembre de 2026
- **Versión/commit probado:** [Completar si está disponible]

## Primera impresión

Al entrar, entendí que Planazo sirve para organizar planes y coordinar actividades entre participantes. La idea principal es clara, pero al intentar registrar o actualizar un plan tuve dificultades con la fecha y la ubicación. Tampoco pude completar la votación de las opciones del plan.

## Funcionalidad asignada y resultado

**Tarea probada:** Crear un plan, definir o proponer fecha y ubicación, actualizarlo y votar por una opción.

**Resultado:**

- [ ] La completé sin ayuda.
- [ ] La completé con ayuda. ¿Cuál?: __________
- [x] No pude completarla. **¿Dónde me detuve?** No pude registrar correctamente la fecha y la ubicación ni votar por las opciones del plan.

## Qué no funcionó

### 1. Se puede crear un plan con fecha pasada

- **Pasos:** Abrir el formulario de creación, seleccionar una fecha anterior al día actual e intentar guardar el plan.
- **Esperado:** El sistema debería impedir una fecha pasada y mostrar un mensaje claro que explique qué corregir.
- **Observado:** El sistema permitió crear el plan con una fecha anterior a la actual.

### 2. Se puede actualizar un plan con fecha pasada

- **Pasos:** Abrir un plan existente, entrar a editar o actualizar, elegir una fecha anterior al día actual y guardar.
- **Esperado:** La actualización debería validar la fecha y rechazar fechas pasadas cuando se trate de un plan futuro.
- **Observado:** El sistema permitió guardar una fecha anterior a la actual.

### 3. No pude registrar fecha ni ubicación en un plan

- **Pasos:** Intentar completar o proponer la fecha y la ubicación de un plan desde la interfaz.
- **Esperado:** Debería poder ingresar o seleccionar ambos datos y verlos reflejados en el plan.
- **Observado:** No logré registrar correctamente la fecha ni la ubicación.
- **Nota:** No determiné si se debe a controles faltantes, validaciones o un error al guardar.

### 4. No pude votar por las opciones de un plan

- **Pasos:** Entrar a un plan e intentar seleccionar y votar por una de las opciones disponibles.
- **Esperado:** La aplicación debería permitir elegir una opción y confirmar que el voto quedó registrado.
- **Observado:** No pude completar la votación.
- **Nota:** No se determinó si se debe a permisos, ausencia de opciones o un fallo del sistema.

## Qué mejoraría y por qué

Agregaría una validación sencilla que impida seleccionar fechas pasadas al crear o actualizar planes. También haría más visibles y fáciles de usar los campos de fecha y ubicación y la opción para votar. Cada acción debería mostrar un mensaje de éxito o un error que indique qué debe corregirse. Esto ayudaría a completar el flujo sin dudas.

## Qué quitaría y por qué

No quitaría ninguna función por ahora. La creación de planes, la edición, la propuesta de fechas o lugares y la votación son necesarias para el objetivo de la aplicación. Priorizaría corregir su funcionamiento antes que eliminarlas.

## Observaciones de la evaluación

Este feedback registra lo que observé al usar la aplicación; no es una auditoría del código fuente. Se recomienda repetir los escenarios anteriores después de aplicar correcciones para comprobar que funcionan.
