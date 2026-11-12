"use client";

import { useEffect, useRef, useState } from "react";

import {
  ErrorApi,
  eliminarMascota,
  filtrarMascotas,
  flujoIdDeCuidado,
  marcarRealizado,
  registrarEvento,
  type Mascota,
} from "@/lib/api";
import { formatearFecha } from "@/lib/fechas";
import {
  aParametros,
  FILTROS_INICIALES,
  filtrosActivos,
  validarRango,
  type FiltrosPantalla,
} from "@/lib/filtros";
import Boton from "./Boton";
import BuscadorMascotas from "./BuscadorMascotas";
import Dialogo from "./Dialogo";
import DialogoConfirmar from "./DialogoConfirmar";
import FiltrosMascotas from "./FiltrosMascotas";
import FormularioMascota from "./FormularioMascota";
import FormularioOmitir from "./FormularioOmitir";
import FormularioReprogramar from "./FormularioReprogramar";
import FormularioResponsable from "./FormularioResponsable";
import MensajeError from "./MensajeError";
import MensajeExito from "./MensajeExito";
import ResumenFiltros from "./ResumenFiltros";
import TarjetaMascota from "./TarjetaMascota";

// Qué ventana está abierta en este momento
type Accion =
  | { tipo: "nueva" }
  | {
      tipo:
        | "editar"
        | "reprogramar"
        | "responsable"
        | "eliminar"
        | "realizar"
        | "omitir";
      mascota: Mascota;
    };

const ID_PANEL_FILTROS = "panel-filtros-mascotas";

export default function PanelMascotas() {
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [accion, setAccion] = useState<Accion | null>(null);
  const [filtros, setFiltros] = useState<FiltrosPantalla>(FILTROS_INICIALES);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const filtrosRef = useRef(filtros);
  const peticionActual = useRef(0);
  const primeraCarga = useRef(true);

  // Carga la lista desde el servidor usando los filtros vigentes
  async function cargar() {
    const vigentes = filtrosRef.current;
    if (validarRango(vigentes)) {
      setCargando(false);
      return;
    }
    const numero = ++peticionActual.current;
    setCargando(true);
    try {
      const datos = await filtrarMascotas(aParametros(vigentes));
      if (numero !== peticionActual.current) return; // llegó una respuesta más nueva
      setMascotas(datos);
      setError("");
    } catch (e) {
      if (numero !== peticionActual.current) return;
      setError(
        e instanceof ErrorApi ? e.message : "Ocurrió un error inesperado",
      );
    } finally {
      if (numero === peticionActual.current) setCargando(false);
    }
  }

  // Al aparecer la pantalla y cada vez que cambian los filtros.
  // Espera un momento para no consultar con cada letra que se escribe.
  useEffect(() => {
    filtrosRef.current = filtros;
    const retraso = primeraCarga.current ? 0 : 300;
    primeraCarga.current = false;
    const temporizador = setTimeout(cargar, retraso);
    return () => clearTimeout(temporizador);
  }, [filtros]);

  useEffect(() => {
    if (!exito) return;
    const temporizador = setTimeout(() => setExito(""), 4000);
    return () => clearTimeout(temporizador);
  }, [exito]);

  function cerrarAccion() {
    setAccion(null);
  }

  function alGuardar(mensaje: string) {
    setAccion(null);
    setError("");
    setExito(mensaje);
    cargar();
  }

  // Para las acciones que solo piden confirmación
  async function ejecutar(operacion: () => Promise<unknown>, mensaje: string) {
    try {
      await operacion();
      setAccion(null);
      setError("");
      setExito(mensaje);
      await cargar();
    } catch (e) {
      setAccion(null);
      setError(
        e instanceof ErrorApi ? e.message : "Ocurrió un error inesperado",
      );
    }
  }

  function renderizarLista() {
    if (cargando && mascotas.length === 0) {
      return <p className="text-grisazulado">Cargando cuidados...</p>;
    }
    if (mascotas.length === 0) {
      const hayFiltros = filtrosActivos(filtros).length > 0;
      return (
        <div className="rounded-xl border border-arena bg-white p-6">
          <p className="font-semibold">
            {hayFiltros
              ? "Ningún cuidado coincide con los filtros."
              : "Aún no tienes mascotas."}
          </p>
          <p className="text-sm text-grisazulado">
            {hayFiltros
              ? "Prueba con otros filtros o pulsa Limpiar todo."
              : "Pulsa Agregar mascota para registrar la primera y su próximo cuidado."}
          </p>
        </div>
      );
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {mascotas.map((mascota) => (
          <TarjetaMascota
            key={mascota.id}
            mascota={mascota}
            alEditar={(elegida) =>
              setAccion({ tipo: "editar", mascota: elegida })
            }
            alEliminar={(elegida) =>
              setAccion({ tipo: "eliminar", mascota: elegida })
            }
            alRealizar={(elegida) =>
              setAccion({ tipo: "realizar", mascota: elegida })
            }
            alReprogramar={(elegida) =>
              setAccion({ tipo: "reprogramar", mascota: elegida })
            }
            alAsignar={(elegida) =>
              setAccion({ tipo: "responsable", mascota: elegida })
            }
            alOmitir={(elegida) =>
              setAccion({ tipo: "omitir", mascota: elegida })
            }
          />
        ))}
      </div>
    );
  }

  return (
    <section className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold sm:text-3xl">Mis mascotas</h1>
        <Boton
          texto="Agregar mascota"
          alClic={() => setAccion({ tipo: "nueva" })}
        />
      </div>

      {/* Celular: una columna. Pantalla grande: los filtros a la izquierda y lo demás a la derecha */}
      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-6">
        <BuscadorMascotas
          filtros={filtros}
          alCambiar={setFiltros}
          mostrarFiltros={mostrarFiltros}
          alAlternarFiltros={() => setMostrarFiltros((anterior) => !anterior)}
          idPanelFiltros={ID_PANEL_FILTROS}
          clase="lg:col-start-2"
        />
        <FiltrosMascotas
          id={ID_PANEL_FILTROS}
          filtros={filtros}
          alCambiar={setFiltros}
          errorRango={validarRango(filtros)}
          mostrar={mostrarFiltros}
          clase="lg:sticky lg:top-4 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:max-h-[calc(100dvh-2rem)] lg:self-start lg:overflow-y-auto"
        />
        <div className="flex min-w-0 flex-col gap-4 lg:col-start-2">
          <ResumenFiltros
            cantidad={mascotas.length}
            cargando={cargando}
            filtros={filtros}
            alCambiar={setFiltros}
          />
          <MensajeError mensaje={error} />
          {renderizarLista()}
        </div>
      </div>

      <MensajeExito mensaje={exito} />

      {accion?.tipo === "nueva" && (
        <Dialogo titulo="Nueva mascota" alCerrar={cerrarAccion}>
          <FormularioMascota
            mascotaEditar={null}
            alGuardar={alGuardar}
            alCancelar={cerrarAccion}
          />
        </Dialogo>
      )}

      {accion?.tipo === "editar" && (
        <Dialogo
          titulo={`Editar datos de ${accion.mascota.nombre}`}
          alCerrar={cerrarAccion}
        >
          <FormularioMascota
            mascotaEditar={accion.mascota}
            alGuardar={alGuardar}
            alCancelar={cerrarAccion}
          />
        </Dialogo>
      )}

      {accion?.tipo === "reprogramar" && (
        <Dialogo
          titulo={`Reprogramar cuidado de ${accion.mascota.nombre}`}
          alCerrar={cerrarAccion}
        >
          <FormularioReprogramar
            mascota={accion.mascota}
            alGuardar={alGuardar}
            alCancelar={cerrarAccion}
          />
        </Dialogo>
      )}

      {accion?.tipo === "responsable" && (
        <Dialogo
          titulo={`Responsable del cuidado de ${accion.mascota.nombre}`}
          alCerrar={cerrarAccion}
        >
          <FormularioResponsable
            mascota={accion.mascota}
            alGuardar={alGuardar}
            alCancelar={cerrarAccion}
          />
        </Dialogo>
      )}

      {accion?.tipo === "realizar" && (
        <DialogoConfirmar
          titulo="¿Marcar como realizado?"
          mensaje={`${accion.mascota.cuidado} de ${accion.mascota.nombre}. Después ya no podrás editarlo ni reprogramarlo.${
            accion.mascota.proximaFecha
              ? ` Se programará el próximo para el ${formatearFecha(accion.mascota.proximaFecha)}.`
              : ""
          }`}
          textoConfirmar="Marcar como realizado"
          alCerrar={cerrarAccion}
          alConfirmar={() =>
            ejecutar(
              async () => {
                const realizada = await marcarRealizado(accion.mascota.id);
                registrarEvento(
                  "cuidado_completado",
                  flujoIdDeCuidado(accion.mascota.id),
                  Boolean(accion.mascota.intervaloUnidad),
                );
                return realizada;
              },
              `El cuidado de ${accion.mascota.nombre} se marcó como realizado${
                accion.mascota.proximaFecha
                  ? `. Próximo cuidado: ${formatearFecha(accion.mascota.proximaFecha)}`
                  : ""
              }`,
            )
          }
        />
      )}
      {accion?.tipo === "omitir" && (
        <Dialogo
          titulo={`Omitir cuidado de ${accion.mascota.nombre}`}
          alCerrar={cerrarAccion}
        >
          <FormularioOmitir
            mascota={accion.mascota}
            alGuardar={alGuardar}
            alCancelar={cerrarAccion}
          />
        </Dialogo>
      )}
      {accion?.tipo === "eliminar" && (
        <DialogoConfirmar
          titulo="¿Eliminar este cuidado?"
          mensaje={`${accion.mascota.cuidado} de ${accion.mascota.nombre}, del ${formatearFecha(accion.mascota.fechaCuidado)}. ${
            accion.mascota.proximaFecha ? "Dejará de repetirse. " : ""
          }Esta acción no se puede deshacer.`}
          textoConfirmar="Eliminar"
          peligroso
          alCerrar={cerrarAccion}
          alConfirmar={() =>
            ejecutar(
              () => eliminarMascota(accion.mascota.id),
              `El cuidado de ${accion.mascota.nombre} se eliminó con éxito`,
            )
          }
        />
      )}
    </section>
  );
}
