import FormularioIngreso from "@/componentes/FormularioIngreso";
import TarjetaAcceso from "@/componentes/TarjetaAcceso";

type Props = {
  searchParams: Promise<{ creada?: string; sesion?: string; cuenta?: string }>;
};

export default async function PaginaIngreso({ searchParams }: Props) {
  const { creada, sesion, cuenta } = await searchParams;

  return (
    <TarjetaAcceso titulo="Ingresar">
      <FormularioIngreso
        cuentaCreada={creada === "1"}
        sesionVencida={sesion === "vencida"}
        cuentaEliminada={cuenta === "eliminada"}
      />
    </TarjetaAcceso>
  );
}
