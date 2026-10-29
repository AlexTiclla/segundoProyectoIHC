"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import {
  ErrorApi,
  eliminarMascota,
  filtrarMascotas,
  marcarRealizado,
  reprogramarCuidado,
  asignarResponsable,
  type Mascota,
} from "@/lib/api";
import {
  aParametros,
  FILTROS_VACIOS,
  filtrosActivos,
  validarRango,
  type FiltrosPantalla,
} from "@/lib/filtros";
import { fechaHoy, validarNuevaFecha } from "@/lib/validaciones";
import Boton from "./Boton";
import FiltrosMascotas from "./FiltrosMascotas";
import FormularioMascota from "./FormularioMascota";
import MensajeError from "./MensajeError";
import TarjetaMascota, {formatearFecha} from "./TarjetaMascota";
import MensajeExito from "./MensajeExito";

export default function PanelMascotas() {
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [mascotaEditar, setMascotaEditar] = useState<Mascota | null>(null);
  const [exito, setExito] = useState("");
  const [mascotaReprogramar, setMascotaReprogramar] = useState<Mascota | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [guardandoReprogramacion, setGuardandoReprogramacion] = useState(false);
  const [errorReprogramacion, setErrorReprogramacion] = useState("");
  const [filtros, setFiltros] = useState<FiltrosPantalla>(FILTROS_VACIOS);
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
    try {
      const datos = await filtrarMascotas(aParametros(vigentes));
      if (numero !== peticionActual.current) return; // llegó una respuesta más nueva
      setMascotas(datos);
      setError("");
    } catch (e) {
      if (numero !== peticionActual.current) return;
      setError(e instanceof ErrorApi ? e.message : "Ocurrió un error inesperado");
    } finally {
      setCargando(false);
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
    if(!exito) return;
    const temporizador = setTimeout(() => setExito(""), 4000);
    return () => clearTimeout(temporizador);
  },[exito]);

  function abrirNueva() {
    setMascotaEditar(null);
    setMascotaReprogramar(null); 
    setFormularioAbierto(true);
  }

  function abrirEdicion(mascota: Mascota) {
    setMascotaEditar(mascota);
    setMascotaReprogramar(null);
    setFormularioAbierto(true);
  }

  function abrirReprogramacion(mascota: Mascota){
    setFormularioAbierto(false);
    setMascotaReprogramar(mascota);
    setNuevaFecha(mascota.fechaCuidado);
    setErrorReprogramacion("");
    setError("");
    setExito("");
  }

  function cerrarReprogramacion(){
    setMascotaReprogramar(null);
    setNuevaFecha("");
    setErrorReprogramacion("");
  }

  async function borrar(mascota: Mascota) {
    if (!confirm(`¿Eliminar el cuidado ${mascota.cuidado} de ${mascota.nombre} del ${formatearFecha(mascota.fechaCuidado)}?\n\nEsta acción no se puede deshacer.`)){
      return;
    }
    setError("");
    setExito("");
    try {
      await eliminarMascota(mascota.id);
      await cargar();
      setExito(`el cuidado ${mascota.cuidado} de ${mascota.nombre} se elimino con éxito`);
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "Ocurrió un error inesperado");
    }
  }
  async function asignar(mascota: Mascota) {
    const correo = prompt("Correo del responsable:");

    if (!correo?.trim()) return;

    try {
      await asignarResponsable(mascota.id, correo.trim());
      await cargar();
      setExito("Responsable asignado");
    } catch (e) {
      setError(
        e instanceof ErrorApi ? e.message : "Error al asignar"
      );
    }
  }
  async function realizar(mascota: Mascota) {
  if(!confirm(`¿Marcar "${mascota.cuidado}" de ${mascota.nombre} como realizado?\n\nDespués ya no podrás editarlo ni reprogramarlo.`)){
    return;
  }
  setError("");
  setExito("");
  try {
    await marcarRealizado(mascota.id);
    await cargar();
     setExito(`El cuidado de ${mascota.nombre} se marcó como realizado`);
  } catch (e) {
    setError(e instanceof ErrorApi ? e.message : "Ocurrió un error inesperado");
  }
}

  function alGuardar(mensaje:string) {
    setFormularioAbierto(false);
    setError("");
    setExito(mensaje);
    cargar();
  }

  async function guardarReprogramacion(evento: FormEvent<HTMLFormElement>){
    evento.preventDefault();
    if(!mascotaReprogramar) return;

    const mensajeFecha = validarNuevaFecha(nuevaFecha);
    if(mensajeFecha){
      setErrorReprogramacion(mensajeFecha);
      return;
    }

    setErrorReprogramacion("");
    setGuardandoReprogramacion(true);
    try{
      await reprogramarCuidado(mascotaReprogramar.id,nuevaFecha);
      const nombre = mascotaReprogramar.nombre;
      cerrarReprogramacion();
      await cargar();
      setExito(`El cuidado de ${nombre} se reprogramó con éxito`);
    }catch(e){
      setErrorReprogramacion(e instanceof ErrorApi ? e.message : "Ocurrió un error inesperado"); 
    }finally{
      setGuardandoReprogramacion(false);
    }
  }

  return (
    <section className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Mis mascotas</h2>
        <Boton texto="Agregar mascota" alClic={abrirNueva} />
      </div>
      <FiltrosMascotas
        filtros={filtros}
        alCambiar={setFiltros}
        errorRango={validarRango(filtros)}
        mostrarFiltros={mostrarFiltros}
        alAlternarFiltros={() =>
        setMostrarFiltros((anterior) => !anterior)
        }
      />
      <MensajeError mensaje={error} />
      <MensajeExito mensaje={exito} />

      {mascotaReprogramar && (
        <form
          onSubmit={guardarReprogramacion}
          noValidate
          className="flex flex-col gap-3 rounded-xl border border-arena bg-white p-4"
          >
           <h3 className="text-xl font-bold">
             Reprogramar cuidado de {mascotaReprogramar.nombre}
            </h3>  

            <p className="text-sm text-grisazulado">
              Cuidado: {mascotaReprogramar.cuidado}
            </p>

            <p className="text-sm text-grisazulado">
      Fecha actual: {formatearFecha(mascotaReprogramar.fechaCuidado)}
    </p>

    <MensajeError mensaje={errorReprogramacion} />

    <label htmlFor="nuevaFecha" className="font-semibold">
      Nueva fecha
    </label>

    <input
      id="nuevaFecha"
      type="date"
      value={nuevaFecha}
      min={fechaHoy()}
      onChange={(e) => setNuevaFecha(e.target.value)}
      aria-invalid={errorReprogramacion ? true : undefined}
      className="rounded-lg border border-arena px-3 py-2"
    />

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={guardandoReprogramacion}
          className="rounded-lg bg-menta-oscuro px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          {guardandoReprogramacion ? "Guardando..." : "Guardar fecha"}
        </button>

          <button
            type="button"
            onClick={cerrarReprogramacion}
              disabled={guardandoReprogramacion}
              className="rounded-lg border border-arena px-4 py-2 font-semibold"
              >
                Cancelar
              </button>
             </div>
        </form>            
      )}

      {formularioAbierto && (
        <FormularioMascota
          key={mascotaEditar?.id ?? "nueva"}
          mascotaEditar={mascotaEditar}
          alGuardar={alGuardar}
          alCancelar={() => setFormularioAbierto(false)}
        />
      )}

      {cargando ? (
        <p>Cargando...</p>
      ) : mascotas.length === 0 ? (
        filtrosActivos(filtros).length > 0 ? (
          <div className="flex flex-col gap-2 rounded-xl border border-arena bg-white p-4 text-neutral-900">
            <p className="font-semibold">Ningún cuidado coincide con los filtros.</p>
            <p className="text-sm">
              Prueba con otros filtros o quítalos para ver todos tus cuidados.
            </p>
            <div>
              <Boton
                variante="secundario"
                texto="Limpiar filtros"
                alClic={() => setFiltros(FILTROS_VACIOS)}
              />
            </div>
          </div>
        ) : (
          <p>Aún no tienes mascotas. ¡Agrega la primera!</p>
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
           {[...mascotas].sort((a, b) => Number(a.estado === "realizado") - Number(b.estado === "realizado")).map((mascota) => (
            <TarjetaMascota
              key={mascota.id}
              mascota={mascota}
              alEditar={abrirEdicion}
              alEliminar={borrar}
              alRealizar={realizar}
              alReprogramar={abrirReprogramacion}
              alAsignar={asignar}
            />
          ))}
        </div>
      )}
    </section>
  );
}