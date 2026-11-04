export const nombreCookie = "sesion";
export const urlBackend = process.env.URL_BASE ?? "http://127.0.0.1:8000";

// Opciones que se ofrecen en el formulario y en los filtros
export const ESPECIES = ["Perro", "Gato", "Conejo", "Ave"];
export const CUIDADOS = [
  "Vacuna",
  "Control",
  "Medicamento",
  "Desparasitación",
  "Baño",
  "Corte de uñas",
  "Limpieza dental",
];

// Cada cuánto se puede repetir un cuidado
export const NO_SE_REPITE = "No se repite";
export const REPETICIONES = [
  { texto: "Cada ciertos días", unidad: "dias", singular: "día", plural: "días" },
  { texto: "Cada ciertos meses", unidad: "meses", singular: "mes", plural: "meses" },
  { texto: "Cada ciertos años", unidad: "anios", singular: "año", plural: "años" },
];
