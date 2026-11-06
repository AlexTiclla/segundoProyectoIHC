import FormularioRecuperar from "@/componentes/FormularioRecuperar";
import TarjetaAcceso from "@/componentes/TarjetaAcceso";

export default function PaginaRecuperar() {
  return (
    <TarjetaAcceso titulo="Recuperar contraseña">
      <FormularioRecuperar />
    </TarjetaAcceso>
  );
}
