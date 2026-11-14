"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ingresar, ErrorApi } from "@/lib/api";
import { validarCorreo } from "@/lib/validaciones";
import Boton from "./Boton";
import CampoTexto from "./CampoTexto";
import MensajeError from "./MensajeError";

type Props = { cuentaCreada?: boolean; sesionVencida?: boolean; cuentaEliminada?: boolean };

export default function FormularioIngreso({
  cuentaCreada = false,
  sesionVencida = false,
  cuentaEliminada = false,
}: Props) {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [errorCorreo, setErrorCorreo] = useState<string>();
  const [errorContrasena, setErrorContrasena] = useState<string>();
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral("");

    const errorDeCorreo = validarCorreo(correo);
    const errorDeContrasena = contrasena ? undefined : "Escribe tu contraseña";
    setErrorCorreo(errorDeCorreo);
    setErrorContrasena(errorDeContrasena);
    if (errorDeCorreo || errorDeContrasena) return;

    setCargando(true);
    try {
      await ingresar(correo.trim(), contrasena);
      router.replace("/inicio");
      router.refresh();
    } catch (error) {
      setErrorGeneral(error instanceof ErrorApi ? error.message : "Ocurrió un error inesperado");
      setCargando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex w-full flex-col gap-4">
      {cuentaCreada && (
        <p
          role="status"
          className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          Cuenta creada. Ahora inicia sesión.
        </p>
      )}
      {sesionVencida && (
        <p
          role="status"
          className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
        >
          Tu sesión venció. Ingresa de nuevo para continuar.
        </p>
      )}
      {cuentaEliminada && (
        <p
          role="status"
          className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
        >
          Tu cuenta fue eliminada. Los accesos compartidos quedaron revocados.
        </p>
      )}
      <MensajeError mensaje={errorGeneral} />
      <CampoTexto
        id="correo"
        etiqueta="Correo"
        tipo="email"
        valor={correo}
        alCambiar={setCorreo}
        error={errorCorreo}
        autoComplete="email"
      />
      <CampoTexto
        id="contrasena"
        etiqueta="Contraseña"
        tipo="password"
        valor={contrasena}
        alCambiar={setContrasena}
        error={errorContrasena}
        autoComplete="current-password"
      />
      <Boton texto="Ingresar" textoCargando="Ingresando..." cargando={cargando} />
      <div className="flex flex-col items-center gap-1 text-sm">
        <Link href="/recuperar" className="font-semibold text-menta-oscuro underline">
          ¿Olvidaste tu contraseña?
        </Link>
        <p>
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-semibold text-menta-oscuro underline">
            Crear cuenta
          </Link>
        </p>
      </div>
    </form>
  );
}