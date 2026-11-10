"use client";

import { useEffect, useState, type FormEvent } from "react";

import {
  ErrorApi,
  invitar,
  listarEnviados,
  listarRecibidos,
  responderAcceso,
  type Acceso,
} from "@/lib/api";
import { validarCorreo } from "@/lib/validaciones";
import Boton from "./Boton";
import CampoSeleccion from "./CampoSeleccion";
import CampoTexto from "./CampoTexto";
import MensajeError from "./MensajeError";
import MensajeExito from "./MensajeExito";

const OPCIONES_PERMISO = ["Consulta", "Gestión"];
const TEXTO_PERMISO = { consulta: "Consulta", gestion: "Gestión" };
const TEXTO_ESTADO = { pendiente: "Pendiente", aceptado: "Aceptado", rechazado: "Rechazado", revocado: "Revocado" };

export default function PanelAccesos() {
  const [enviados, setEnviados] = useState<Acceso[]>([]);
  const [recibidos, setRecibidos] = useState<Acceso[]>([]);
  const [correo, setCorreo] = useState("");
  const [permiso, setPermiso] = useState("Consulta");
  const [errorCorreo, setErrorCorreo] = useState<string>();
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [recarga, setRecarga] = useState(0);

  // Al cambiar "recarga" se vuelven a pedir las dos listas
  useEffect(() => {
    Promise.all([listarEnviados(), listarRecibidos()])
      .then(([nuevosEnviados, nuevosRecibidos]) => {
        setEnviados(nuevosEnviados);
        setRecibidos(nuevosRecibidos);
      })
      .catch((e) => setError(e instanceof ErrorApi ? e.message : "No se pudieron cargar los accesos."));
  }, [recarga]);

  useEffect(() => {
    if (!exito) return;
    const temporizador = setTimeout(() => setExito(""), 4000);
    return () => clearTimeout(temporizador);
  }, [exito]);

  // Cada acción recarga las dos listas, para que se vea el estado que quedó guardado
  async function ejecutar(operacion: () => Promise<unknown>, mensaje: string) {
    try {
      await operacion();
      setError("");
      setExito(mensaje);
      setRecarga((numero) => numero + 1);
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "Ocurrió un error inesperado");
    }
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const errorDeCorreo = validarCorreo(correo);
    setErrorCorreo(errorDeCorreo);
    if (errorDeCorreo) return;
    await ejecutar(
      () => invitar(correo.trim(), permiso === "Gestión" ? "gestion" : "consulta").then(() => setCorreo("")),
      `Invitación enviada a ${correo.trim()}`
    );
  }

  return (
    <section className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Compartir cuidados</h1>
        <p className="text-sm text-grisazulado">
          Invita a otra cuenta a ver o gestionar todos tus cuidados. Tú decides hasta cuándo.
        </p>
      </div>

      <MensajeError mensaje={error} />

      <form onSubmit={enviar} noValidate className="flex flex-col gap-4 rounded-xl border border-arena bg-white p-4">
        <CampoTexto
          id="correoInvitado"
          etiqueta="Correo de la persona"
          tipo="email"
          valor={correo}
          alCambiar={setCorreo}
          error={errorCorreo}
          ayuda="Debe tener una cuenta en Mascota al Día."
        />
        <CampoSeleccion
          id="permisoInvitado"
          etiqueta="Permiso"
          opciones={OPCIONES_PERMISO}
          valor={permiso}
          alCambiar={setPermiso}
          ayuda="Consulta: solo ve tus cuidados. Gestión: también los edita, reprograma y marca como realizados."
        />
        <Boton texto="Invitar" clase="self-start" />
      </form>

      <section aria-labelledby="titulo-enviados" className="flex flex-col gap-3">
        <h2 id="titulo-enviados" className="text-xl font-bold">
          Personas con acceso a mis cuidados
        </h2>
        {enviados.length === 0 && <p className="text-grisazulado">Todavía no has invitado a nadie.</p>}
        <ul className="flex flex-col gap-3 text-left">
          {enviados.map((acceso) => (
            <li key={acceso.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-arena bg-white p-4 shadow-sm">
              <div className="min-w-0">
                <p className="break-words font-semibold">{acceso.invitadoNombre}</p>
                <p className="break-words text-sm text-grisazulado">{acceso.invitadoCorreo}</p>
                <p className="text-sm">
                  Permiso: {TEXTO_PERMISO[acceso.permiso]} · Estado: {TEXTO_ESTADO[acceso.estado]}
                </p>
              </div>
              {(acceso.estado === "pendiente" || acceso.estado === "aceptado") && (
                <Boton
                  texto="Revocar"
                  variante="peligro"
                  alClic={() => ejecutar(() => responderAcceso(acceso.id, "revocar"), `Se revocó el acceso de ${acceso.invitadoNombre}`)}
                />
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="titulo-recibidos" className="flex flex-col gap-3">
        <h2 id="titulo-recibidos" className="text-xl font-bold">
          Invitaciones que recibí
        </h2>
        {recibidos.length === 0 && <p className="text-grisazulado">No tienes invitaciones.</p>}
        <ul className="flex flex-col gap-3 text-left">
          {recibidos.map((acceso) => (
            <li key={acceso.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-arena bg-white p-4 shadow-sm">
              <div className="min-w-0">
                <p className="break-words font-semibold">{acceso.propietarioNombre}</p>
                <p className="text-sm">
                  Permiso: {TEXTO_PERMISO[acceso.permiso]} · Estado: {TEXTO_ESTADO[acceso.estado]}
                </p>
              </div>
              {acceso.estado === "pendiente" && (
                <div className="flex gap-2">
                  <Boton
                    texto="Aceptar"
                    alClic={() => ejecutar(() => responderAcceso(acceso.id, "aceptar"), `Ahora ves los cuidados de ${acceso.propietarioNombre}`)}
                  />
                  <Boton
                    texto="Rechazar"
                    variante="secundario"
                    alClic={() => ejecutar(() => responderAcceso(acceso.id, "rechazar"), "Invitación rechazada")}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <MensajeExito mensaje={exito} />
    </section>
  );
}
