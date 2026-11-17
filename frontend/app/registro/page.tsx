/* v8 ignore start */
// Página estática: Next la ejecuta una sola vez en "next build" y luego solo sirve su HTML,
// así que la cobertura de V8 de las pruebas e2e no puede ver este código. Las pruebas sí
// abren esta pantalla y verifican lo que muestra (acceso.spec.ts, visual.spec.ts).
import FormularioRegistro from "@/componentes/FormularioRegistro";
import TarjetaAcceso from "@/componentes/TarjetaAcceso";

export default function PaginaRegistro() {
  return (
    <TarjetaAcceso titulo="Crear cuenta">
      <FormularioRegistro />
    </TarjetaAcceso>
  );
}
/* v8 ignore stop */
