import FormularioRegistro from "@/componentes/FormularioRegistro";
import TarjetaAcceso from "@/componentes/TarjetaAcceso";

export default function PaginaRegistro() {
  return (
    <TarjetaAcceso titulo="Crear cuenta">
      <FormularioRegistro />
    </TarjetaAcceso>
  );
}
