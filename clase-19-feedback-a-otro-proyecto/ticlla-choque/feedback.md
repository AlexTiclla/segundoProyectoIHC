# Feedback a otro proyecto — Clase 19

- **Nombre completo del evaluador:** Alex Ticlla Choque
- **Mi grupo y caso de estudio:** [Completar grupo] — Mascota al Día
- **Grupo y caso de estudio evaluado:** [Completar grupo] — Presupuesto estudiantil
- **Integrantes del proyecto evaluado:** Adolfo Mendoza Ribera y Sebastian Cespedes Rodas
- **URL de la app evaluada:** https://github.com/BrayanG123/2do_Proyeccto_IHC
- **URL del repositorio evaluado:** https://github.com/BrayanG123/2do_Proyeccto_IHC
- **Fecha de evaluación:** 3 de noviembre de 2026
- **Versión/commit probado:** [Completar si está disponible]

## Primera impresión

Al entrar, entendí que Presupuesto estudiantil sirve para registrar y organizar los movimientos económicos de un estudiante. La idea principal es clara y permite consultar el historial, los límites y los filtros avanzados. Sin embargo, encontré oportunidades de mejora en la recurrencia, la validación de fechas, la disposición de algunos botones, las categorías y el filtrado de ingresos.

## Funcionalidad asignada y resultado

**Tarea probada:** Registrar movimientos, configurar una recurrencia, consultar el historial y utilizar los límites y filtros disponibles.

**Resultado:**

- [ ] La completé sin ayuda.
- [ ] La completé con ayuda. ¿Cuál?: __________
- [x] No pude completarla. **¿Dónde me detuve?** Pude revisar las funciones principales, pero encontré limitaciones al configurar recurrencias, registrar fechas y filtrar los ingresos del historial.

## Qué no funcionó

### 1. Falta una opción de recurrencia cada quince días

- **Pasos:** Abrir la configuración de recurrencia de un movimiento y revisar las frecuencias disponibles.
- **Esperado:** Debería existir una opción para repetir el movimiento cada quince días.
- **Observado:** No se encontró una frecuencia específica para una recurrencia quincenal.

### 2. Se puede guardar un movimiento con fecha anterior a la actual

- **Pasos:** Abrir el formulario para crear un movimiento, seleccionar una fecha anterior al día actual e intentar guardarlo.
- **Esperado:** El sistema debería impedir guardar la fecha anterior y mostrar un mensaje claro que explique qué corregir.
- **Observado:** La aplicación permite guardar una fecha anterior a la actual.

### 3. La disposición de los botones de historial y límite puede mejorar

- **Pasos:** Consultar las secciones de historial y límite y ubicar las acciones disponibles.
- **Esperado:** Los botones deberían estar agrupados y ubicados de forma consistente para encontrarlos y utilizarlos con facilidad.
- **Observado:** La disposición actual de los botones de historial y límite puede dificultar su localización y uso.

### 4. El botón de quitar todos se desplaza al eliminar filtros

- **Pasos:** Aplicar varios filtros avanzados y eliminar los chips de filtro hasta quitarlos todos.
- **Esperado:** El botón de quitar todos debería permanecer fijo en la misma ubicación.
- **Observado:** El botón se desplaza cuando se eliminan los chips de filtro avanzado, lo que afecta la estabilidad visual y puede dificultar encontrarlo.

### 5. Las opciones de categoría son muy limitadas

- **Pasos:** Intentar crear un movimiento relacionado con una categoría que no aparece entre las opciones disponibles, como salud.
- **Esperado:** Debería existir una categoría de salud o una opción para agregar categorías personalizadas.
- **Observado:** Las categorías disponibles son muy mínimas y no permiten registrar algunos tipos de presupuesto, como uno destinado a salud.

### 6. Falta filtrar los ingresos en el historial

- **Pasos:** Abrir el historial e intentar consultar únicamente los ingresos registrados.
- **Esperado:** Debería existir un filtro de ingresos que permita saber cuánto dinero se ha recibido.
- **Observado:** No hay una opción clara para filtrar por ingresos, por lo que no se puede identificar fácilmente cuánto se ingresa.

## Qué mejoraría y por qué

Agregaría una recurrencia quincenal y una validación que impida seleccionar fechas pasadas al crear movimientos. También reorganizaría los botones de historial y límite y mantendría fijo el botón de quitar todos aunque cambien los chips de filtros. Ampliaría las categorías disponibles, incluyendo salud, y añadiría un filtro para consultar únicamente los ingresos en el historial. Estas mejoras facilitarían la planificación y la lectura del presupuesto.

## Qué quitaría y por qué

No quitaría ninguna función por ahora. Las opciones de registro de movimientos, recurrencia, historial, límites y filtros son necesarias para el objetivo de la aplicación. Priorizaría mejorar su disposición y ampliar sus opciones antes que eliminarlas.

## Observaciones de la evaluación

Este feedback registra lo que observé al usar la aplicación; no es una auditoría del código fuente. Se recomienda repetir los escenarios anteriores después de aplicar correcciones para comprobar que funcionan y verificar que las nuevas categorías, recurrencias y filtros se integren correctamente.
