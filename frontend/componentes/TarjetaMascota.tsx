import type { Mascota } from "@/lib/api";
import {
  diasHasta,
  formatearFecha,
  formatearFechaCorta,
  textoDias,
  textoRecurrencia,
} from "@/lib/fechas";
import Boton from "./Boton";
import MenuAcciones, { type OpcionMenu } from "./MenuAcciones";

type Props = {
  mascota: Mascota;
  alEditar: (mascota: Mascota) => void;
  alEliminar: (mascota: Mascota) => void;
  alRealizar: (mascota: Mascota) => void;
  alReprogramar: (mascota: Mascota) => void;
  alAsignar: (mascota: Mascota) => void;
  // No omite aquí. Avisa al panel para que abra el formulario del motivo.
  alOmitir: (mascota: Mascota) => void;
};

export default function TarjetaMascota({
  mascota,
  alEditar,
  alEliminar,
  alRealizar,
  alReprogramar,
  alAsignar,
  alOmitir,
}: Props) {
  const realizado = mascota.estado === "realizado";
  const omitido = mascota.estado === "omitido";
  const finalizado = realizado || omitido;
  const propia = mascota.permiso === "propietario";
  const puedeGestionar = mascota.permiso !== "consulta";
  const dias = diasHasta(mascota.fechaCuidado);
  const atrasado = mascota.vencido;
  const recurrencia = textoRecurrencia(
    mascota.intervaloCantidad,
    mascota.intervaloUnidad,
  );

  let estado = {
    texto: `Pendiente · ${textoDias(dias)}`,
    color: "bg-amber-100 text-amber-900",
  };
  if (realizado) {
    estado = {
      texto: "Realizado",
      color: "bg-green-100 text-green-900",
    };
  } else if (omitido) {
    estado = {
      texto: "Omitido",
      color: "bg-neutral-200 text-neutral-800",
    };
  } else if (atrasado) {
    estado = {
      texto: `Vencido · ${textoDias(dias)}`,
      color: "bg-red-100 text-red-900",
    };
  }

  // Acciones poco frecuentes: van dentro del menú de tres puntos
  const opcionesMenu: OpcionMenu[] = [
    ...(!finalizado
      ? [
          {
            texto: mascota.responsableNombre
              ? "Cambiar responsable"
              : "Asignar responsable",
            alSeleccionar: () => alAsignar(mascota),
          },
        ]
      : []),
    {
      texto: "Eliminar",
      alSeleccionar: () => alEliminar(mascota),
      peligrosa: true,
    },
  ];

  return (
    <article
      className={`flex h-full flex-col gap-3 rounded-xl border p-4 text-left shadow-sm ${
        atrasado ? "border-red-300" : "border-arena"
      } ${finalizado ? "bg-neutral-50" : "bg-white"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="break-words text-lg font-bold">{mascota.nombre}</h2>
          <p className="text-sm text-grisazulado first-letter:uppercase">
            {mascota.especie} · {mascota.sexo}
          </p>
        </div>
        {/* Eliminar y asignar responsable son solo del propietario */}
        {propia && (
          <MenuAcciones
            etiqueta={`Más acciones de ${mascota.cuidado} de ${mascota.nombre}`}
            opciones={opcionesMenu}
          />
        )}
      </div>

      <p
        className={`self-start rounded-full px-3 py-1 text-sm font-semibold ${estado.color}`}
      >
        {estado.texto}
      </p>

      <div>
        <p className="break-words font-semibold first-letter:uppercase">
          {mascota.cuidado}
        </p>
        <p className="text-sm">{formatearFecha(mascota.fechaCuidado)}</p>
        {/* En un cuidado realizado no se muestra: la repetición sigue en su siguiente tarjeta */}
        {recurrencia && !finalizado && (
          <p className="text-sm">Se repite {recurrencia}</p>
        )}
        {mascota.proximasFechas.length > 0 && (
          <p className="text-sm text-grisazulado">
            Próximas:{" "}
            {mascota.proximasFechas.map(formatearFechaCorta).join(", ")}
          </p>
        )}
        <p className="mt-1 break-words text-sm text-grisazulado">
          Responsable: {mascota.responsableNombre || "sin asignar"}
        </p>
        {!propia && (
          <p className="break-words text-sm text-grisazulado">
            Compartido por {mascota.propietarioNombre} ·{" "}
            {mascota.permiso === "gestion" ? "Gestión" : "Consulta"}
          </p>
        )}
        {realizado && mascota.realizadoPorNombre && mascota.realizadoEn && (
          <p className="break-words text-sm text-grisazulado">
            Realizado por {mascota.realizadoPorNombre} el{" "}
            {formatearFecha(mascota.realizadoEn)}
          </p>
        )}

        {omitido && mascota.motivoOmision && (
          <p className="mt-2 break-words text-sm text-grisazulado">
            <strong>Motivo de omisión:</strong> {mascota.motivoOmision}
          </p>
        )}
      </div>

      {mascota.reprogramaciones.length > 0 && (
        <div className="text-sm">
          <p>Fecha original: {formatearFechaCorta(mascota.fechaOriginal)}</p>
          <details>
            <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-menta-profundo">
              Ver cambios ({mascota.reprogramaciones.length})
            </summary>
            <ol className="flex flex-col gap-2">
              {mascota.reprogramaciones.map((cambio, indice) => (
                <li
                  key={indice}
                  className="break-words border-l-2 border-arena pl-2"
                >
                  {formatearFechaCorta(cambio.fechaAnterior)} →{" "}
                  {formatearFechaCorta(cambio.fechaNueva)}
                  {cambio.alcance === "futuras" && " (y las siguientes)"}
                  <br />
                  <span className="text-grisazulado">
                    Motivo: {cambio.motivo}
                  </span>
                </li>
              ))}
            </ol>
          </details>
        </div>
      )}

      {!finalizado && puedeGestionar && (
        <div className="mt-auto flex flex-col gap-2">
          <Boton
            texto="Editar datos"
            variante="secundario"
            alClic={() => alEditar(mascota)}
            clase="w-full"
          />

          <div className="flex flex-wrap gap-2">
            <Boton
              texto={
                mascota.vencido ? "Realizado tarde" : "Marcar como realizado"
              }
              alClic={() => alRealizar(mascota)}
              clase="flex-auto"
            />
            {atrasado && (
              <Boton
                texto="Omitir con motivo"
                variante="secundario"
                alClic={() => alOmitir(mascota)}
                clase="flex-auto"
              />
            )}

            <Boton
              texto="Reprogramar"
              variante="secundario"
              alClic={() => alReprogramar(mascota)}
              clase="flex-auto"
            />
          </div>
        </div>
      )}
    </article>
  );
}
