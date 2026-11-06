"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

import { cambiarContrasena, solicitarRecuperacion, ErrorApi } from "@/lib/api";
import {
  validarConfirmacion,
  validarContrasena,
  validarCorreo,
} from "@/lib/validaciones";
import Boton from "./Boton";
import CampoTexto from "./CampoTexto";
import MensajeError from "./MensajeError";

type Paso = "pedirCodigo" | "cambiar" | "listo";

export default function FormularioRecuperar() {
  const [paso, setPaso] = useState<Paso>("pedirCodigo");
  const [correo, setCorreo] = useState("");
  const [codigoGenerado, setCodigoGenerado] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [errorCorreo, setErrorCorreo] = useState<string>();
  const [errorCodigo, setErrorCodigo] = useState<string>();
  const [errorContrasena, setErrorContrasena] = useState<string>();
  const [errorConfirmacion, setErrorConfirmacion] = useState<string>();
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);

  async function pedirCodigo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral("");
    const error = validarCorreo(correo);
    setErrorCorreo(error);
    if (error) return;

    setCargando(true);
    try {
      const respuesta = await solicitarRecuperacion(correo.trim());
      setCodigoGenerado(respuesta.codigo);
      setPaso("cambiar");
    } catch (error) {
      setErrorGeneral(error instanceof ErrorApi ? error.message : "Ocurrió un error inesperado");
    } finally {
      setCargando(false);
    }
  }

  async function cambiar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral("");
    const errorDeCodigo = /^\d{6}$/.test(codigo) ? undefined : "El código tiene 6 números";
    const errorDeContrasena = validarContrasena(contrasena);
    const errorDeConfirmacion = validarConfirmacion(contrasena, confirmacion);
    setErrorCodigo(errorDeCodigo);
    setErrorContrasena(errorDeContrasena);
    setErrorConfirmacion(errorDeConfirmacion);
    if (errorDeCodigo || errorDeContrasena || errorDeConfirmacion) return;

    setCargando(true);
    try {
      await cambiarContrasena(correo.trim(), codigo, contrasena);
      setPaso("listo");
    } catch (error) {
      setErrorGeneral(error instanceof ErrorApi ? error.message : "Ocurrió un error inesperado");
    } finally {
      setCargando(false);
    }
  }

  function cambiarCorreo() {
    setPaso("pedirCodigo");
    setCodigoGenerado(null);
    setCodigo("");
    setContrasena("");
    setConfirmacion("");
    setErrorCodigo(undefined);
    setErrorContrasena(undefined);
    setErrorConfirmacion(undefined);
    setErrorGeneral("");
  }

  if (paso === "listo") {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-emerald-800">
          Contraseña actualizada. Ya puedes ingresar con la nueva.
        </p>
        <Boton texto="Ir a ingresar" href="/ingresar" />
      </div>
    );
  }

  if (paso === "cambiar") {
    return (
      <form onSubmit={cambiar} noValidate className="flex w-full flex-col gap-4">
        {codigoGenerado ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <p>Simulación: como no se envía correo real, tu código es:</p>
            <p className="mt-1 text-2xl font-bold tracking-widest">{codigoGenerado}</p>
            <p className="mt-1">Vence en pocos minutos.</p>
          </div>
        ) : (
          <p className="rounded-lg border border-arena p-3 text-sm">
            Si el correo existe, se generó un código de recuperación.
          </p>
        )}
        <p className="text-sm">
          Correo: <span className="font-semibold">{correo.trim()}</span>{" "}
          <button
            type="button"
            onClick={cambiarCorreo}
            className="font-semibold text-menta-oscuro underline"
          >
            Cambiar correo
          </button>
        </p>
        <MensajeError mensaje={errorGeneral} />
        <CampoTexto
          id="codigo"
          etiqueta="Código de 6 números"
          valor={codigo}
          alCambiar={setCodigo}
          error={errorCodigo}
          autoComplete="one-time-code"
        />
        <CampoTexto
          id="contrasenaNueva"
          etiqueta="Contraseña nueva"
          tipo="password"
          valor={contrasena}
          alCambiar={setContrasena}
          error={errorContrasena}
          ayuda="Mínimo 8 caracteres"
          autoComplete="new-password"
        />
        <CampoTexto
          id="confirmacionNueva"
          etiqueta="Confirmar contraseña nueva"
          tipo="password"
          valor={confirmacion}
          alCambiar={setConfirmacion}
          error={errorConfirmacion}
          autoComplete="new-password"
        />
        <Boton texto="Cambiar contraseña" textoCargando="Cambiando..." cargando={cargando} />
        <p className="text-center text-sm">
          <Link href="/ingresar" className="font-semibold text-menta-oscuro underline">
            Volver a ingresar
          </Link>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={pedirCodigo} noValidate className="flex w-full flex-col gap-4">
      <MensajeError mensaje={errorGeneral} />
      <CampoTexto
        id="correo"
        etiqueta="Correo de tu cuenta"
        tipo="email"
        valor={correo}
        alCambiar={setCorreo}
        error={errorCorreo}
        autoComplete="email"
      />
      <Boton texto="Generar código" textoCargando="Generando..." cargando={cargando} />
      <p className="text-center text-sm">
        <Link href="/ingresar" className="font-semibold text-menta-oscuro underline">
          Volver a ingresar
        </Link>
      </p>
    </form>
  );
}