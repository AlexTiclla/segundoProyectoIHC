"use client";

import { useState, type FormEvent } from "react";

import { actualizarMascota, crearMascota, ErrorApi, type Mascota } from "@/lib/api";
import { CUIDADOS, ESPECIES } from "@/lib/constantes";
import {
  fechaHoy,
  validarCuidado,
  validarEspecie,
  validarNombreMascota,
  validarNuevaFecha,
} from "@/lib/validaciones";
import Boton from "./Boton";
import CampoSeleccion from "./CampoSeleccion";
import CampoTexto from "./CampoTexto";
import MensajeError from "./MensajeError";

type Props = {
  mascotaEditar: Mascota | null;
  alGuardar: (mensaje:string) => void;
  alCancelar: () => void;
};

type Errores = {
  nombre?: string;
  especie?: string;
  cuidado?: string;
  fecha?: string;
};

export default function FormularioMascota({ mascotaEditar, alGuardar, alCancelar }: Props) {
  // Si estamos editando, cada campo arranca con los datos de la mascota.
  // Si es nueva, arranca vacío ("??" significa "si no hay valor, usa este").
  const [nombre, setNombre] = useState(mascotaEditar?.nombre ?? "");
  const [sexo, setSexo] = useState(mascotaEditar?.sexo ?? "Macho");
  const [especie, setEspecie] = useState(mascotaEditar?.especie ?? "");
  const [cuidado, setCuidado] = useState(mascotaEditar?.cuidado ?? "");
  const [fecha, setFecha] = useState(mascotaEditar?.fechaCuidado ?? "");
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral("");

    const nuevosErrores: Errores = {
      nombre: validarNombreMascota(nombre),
      especie: validarEspecie(especie),
      cuidado: validarCuidado(cuidado),
      // Al editar la fecha no se cambia: para eso está "Reprogramar"
      fecha: mascotaEditar ? undefined : validarNuevaFecha(fecha),
    };
    setErrores(nuevosErrores);
    if (Object.values(nuevosErrores).some(Boolean)) return;

    const datos = {
      nombre: nombre.trim(),
      sexo,
      especie: especie.trim(),
      cuidado: cuidado.trim(),
      fechaCuidado: fecha,
    };

    setCargando(true);
    try {
      if (mascotaEditar) {
        await actualizarMascota(mascotaEditar.id, datos);
      } else {
        await crearMascota(datos);
      }
      alGuardar(mascotaEditar ? "Mascota actualizada con éxito" : "Mascota creada con éxito"); // le avisa al Panel que ya terminó
    } catch (error) {
      setErrorGeneral(error instanceof ErrorApi ? error.message : "Ocurrió un error inesperado");
      setCargando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <MensajeError mensaje={errorGeneral} />

      <CampoTexto id="nombre" etiqueta="Nombre" valor={nombre} alCambiar={setNombre} error={errores.nombre} ayuda="El nombre de tu mascota" />
      <CampoSeleccion id="sexo" etiqueta="Sexo" opciones={["Macho", "Hembra"]} valor={sexo} alCambiar={setSexo} />
      <CampoSeleccion
        id="especie"
        etiqueta="Especie"
        opciones={ESPECIES}
        textoOtro="Otra (escribirla)"
        valor={especie}
        alCambiar={setEspecie}
        error={errores.especie}
      />
      <CampoSeleccion
        id="cuidado"
        etiqueta="Cuidado"
        opciones={CUIDADOS}
        textoOtro="Otro (escribirlo)"
        valor={cuidado}
        alCambiar={setCuidado}
        error={errores.cuidado}
        ayuda="Qué necesita tu mascota en esa fecha"
      />
      <CampoTexto
        id="fecha"
        etiqueta="Fecha del cuidado"
        tipo="date"
        valor={fecha}
        min={mascotaEditar ? undefined : fechaHoy()}
        alCambiar={setFecha}
        error={errores.fecha}
        deshabilitado={Boolean(mascotaEditar)}
        ayuda={mascotaEditar ? "Para cambiar la fecha usa el botón Reprogramar" : "Desde hoy en adelante"}
      />

      <div className="flex flex-wrap justify-end gap-2">
        <Boton texto="Cancelar" variante="secundario" alClic={alCancelar} deshabilitado={cargando} />
        <Boton
          texto={mascotaEditar ? "Guardar cambios" : "Crear mascota"}
          textoCargando="Guardando..."
          cargando={cargando}
        />
      </div>
    </form>
  );
}
