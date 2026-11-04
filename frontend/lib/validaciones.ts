export function esCorreoValido(correo:string): boolean{
    return  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());
}

export function validarNombre(nombre:string): string | undefined{
    if(nombre.trim().length < 2) return "Escribe tu nombre completo (mínimo 2 letras)";
}

export function validarCorreo(correo:string): string | undefined{
    if(!esCorreoValido(correo)) return "Escribe un correo válido, por ejemplo ana@correo.com";
}

export function validarContrasena(contrasena: string): string | undefined {
  if (contrasena.length < 8) return "La contraseña debe tener al menos 8 caracteres";
}

export function validarConfirmacion(contrasena: string,confirmacion:string): string | undefined{
    if(contrasena !== confirmacion) return "Las contraseñas no coinciden";
}

export function validarNombreMascota(nombre: string): string | undefined{
  if(nombre.trim().length < 1) return "Escribe el nombre de tu mascota";
  if(nombre.trim().length > 120) return "El nombre de tu mascota no puede tener más de 120 caracteres";
}
export function validarEspecie(especie: string): string | undefined{
    if(especie.trim().length < 1) return "Elige o escribe la especie de tu mascota";
    if(especie.trim().length > 50) return "La especie de tu mascota no puede tener más de 50 caracteres";
}
export function validarCuidado(cuidado: string):string|undefined{
    if(cuidado.trim().length < 1) return "Elige o escribe el cuidado de tu mascota";
    if(cuidado.trim().length > 100) return "El cuidado de tu mascota no puede tener más de 100 caracteres";
}

export function fechaHoy(): string {
    const ahora = new Date();
    const mes = String(ahora.getMonth()+1).padStart(2,"0");
    const dia = String(ahora.getDate()).padStart(2,"0");
    return `${ahora.getFullYear()}-${mes}-${dia}`;
}

export function validarIntervalo(cantidad: string): string | undefined {
    const numero = Number(cantidad);
    if (!Number.isInteger(numero) || numero < 1 || numero > 365) {
        return "Escribe un número entero de 1 a 365";
    }
}

// Para fechas que se eligen al crear o reprogramar un cuidado
export function validarNuevaFecha(fecha:string): string | undefined{
    if(fecha.trim().length < 1){
        return "Elige la fecha del cuidado";
    }
    if(fecha < fechaHoy()){
        return "La fecha no puede ser anterior a hoy";
    }
}
