/**
 * Cliente HTTP del motor de reglas (Motor A) y su asistente de informe (Motor B).
 *
 * Los tipos de aquí reflejan la forma REAL de `POST /api/siniestros` tal como
 * la construye `api/esquema.py::construir_respuesta` en el repo del motor
 * (`/Volumes/ORICO/projects/personal/motor-siniestros`), no un boceto previo:
 * cuando hubo diferencia entre el plan original y el código de la API, se
 * verificó el código y ganó éste.
 */
import type { CaseStatus } from "./data/mockCases";

/** Los cinco veredictos que puede emitir el motor de reglas. */
export type Veredicto =
  | "APROBABLE"
  | "APROBABLE_POR_SILENCIO"
  | "RECHAZO"
  | "ESCALADO"
  | "OBSERVADO";

/** Nivel de confianza, tal como lo reportan el clasificador de escenario y la
 *  capa IA de lectura. Es un `str` libre en Python, pero documentado y en la
 *  práctica acotado a estos tres valores. */
export type Confianza = "alta" | "media" | "baja";

/** Un valor JSON arbitrario: el motor cita el valor del campo del expediente
 *  tal cual está en el `case` (puede ser un escalar, una lista o un objeto;
 *  p. ej. `poliza.garantias` es una lista de objetos, `poliza.exclusiones`
 *  una lista de strings). */
export type ValorJson =
  | string
  | number
  | boolean
  | null
  | ValorJson[]
  | { [clave: string]: ValorJson };

/** Un campo citado como evidencia, con su valor y el documento que lo respalda. */
export type Evidencia = {
  campo: string;
  valor: ValorJson;
  fuente: string | null;
};

/** Lo que la capa IA de lectura respondió al leer un documento (nunca decide
 *  el veredicto, solo cita evidencia). */
export type PreAnalisisIA = {
  resuelto: boolean;
  hallazgo: string | null;
  evidencia: string | null;
  documento: string | null;
  confianza: Confianza;
  proveedor: string;
};

/**
 * Un paso de la cascada de compuertas (Motor A).
 *
 * Si `estado` es "PASS" ninguna regla de esa compuerta disparó, así que no
 * hay `check`/`motivo`/`evidencia`. En cualquier otro estado esas tres claves
 * vienen siempre juntas. `lectura_ia` solo aparece en el último paso de un
 * caso ESCALADO, cuando la capa IA de lectura ya anotó su pre-análisis ahí
 * (además de en `pre_analisis_ia`, a nivel de la respuesta completa).
 */
export type PasoTraza =
  | { gate: string; nombre: string; estado: "PASS" }
  | {
      gate: string;
      nombre: string;
      estado: "FAIL" | "OBSERVADO" | "SILENCIO" | "INCONCLUSO";
      check: string;
      motivo: string;
      evidencia: Evidencia[];
      lectura_ia?: PreAnalisisIA;
    };

/** Salida del clasificador de escenario. En la práctica siempre está
 *  presente (el pipeline la produce en ambas ramas), pero se tipa nula
 *  porque la API la reexpone con un `.get()` defensivo. */
export type Clasificacion = {
  escenario: string | null;
  grupo: "A" | "B" | null;
  confianza: Confianza;
  motivo: string;
  senales: {
    rol: string | null;
    modalidad: string | null;
    docs_comex: string[];
    fuente_valor: string | null;
  };
};

/** Discrepancia entre el escenario que trajo la extracción y el que calculó
 *  el clasificador: el motor nunca pisa uno con el otro, la reporta para
 *  revisión humana. */
export type DiscrepanciaEscenario = {
  extraido: string;
  clasificado: string;
};

/** Cálculo de indemnización con infraseguro (Motor B). `null` si el
 *  veredicto no es APROBABLE/APROBABLE_POR_SILENCIO o si el motor no llegó
 *  a correr (caso derivado antes de decidir). */
export type Indemnizacion = {
  calculable: boolean;
  perdida_bruta: number | null;
  suma_asegurada: number | null;
  valor_real: number | null;
  aplica_infraseguro: boolean;
  factor_prorrata: number;
  deducible: number;
  indemnizacion: number;
  detalle: string[];
};

/** Recordatorio de documentación pendiente (solo cuando el veredicto es
 *  OBSERVADO). `fecha` es `null` si no hay fecha base (asignación o aviso
 *  del siniestro) desde la que contar los días. */
export type Recordatorio = {
  dias: number;
  fecha: string | null;
};

/** Campos de expediente que llena el usuario en el formulario. Viajan de
 *  vuelta bajo `datos_formulario` solo para que la UI los reexhiba: no
 *  participan en el cálculo del veredicto, que sale únicamente de los
 *  documentos (así la traza del motor sigue siendo una cita fiel de sus
 *  fuentes documentales). */
export type CamposExpediente = {
  aseguradora: string;
  asegurado: string;
  corredor: string;
  contacto: string;
  numero_poliza: string;
  monto_reclamado: string;
  descripcion: string;
};

/** Forma exacta de la respuesta de `POST /api/siniestros`. */
export type RespuestaAnalisis = {
  caso_id: string;
  veredicto: Veredicto;
  motivo: string | null;
  flags: string[];
  traza: PasoTraza[];
  clasificacion: Clasificacion | null;
  discrepancia_escenario: DiscrepanciaEscenario | null;
  problemas_extraccion: string[];
  pre_analisis_ia: PreAnalisisIA | null;
  informe_md: string | null;
  carta_sbs: string | null;
  indemnizacion: Indemnizacion | null;
  recordatorios: Recordatorio[] | null;
  faltantes: string[];
  datos_formulario: CamposExpediente;
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const API_KEY = import.meta.env.VITE_API_KEY ?? "";

/**
 * Envía el expediente (campos del formulario + archivos adjuntos) al motor
 * de reglas y devuelve su veredicto.
 *
 * Un 200 con `veredicto: "ESCALADO"` (p. ej. por extracción incompleta) NO
 * es un error: es el motor derivando el caso a un humano. Esta función solo
 * lanza si la API responde con un código de error (401 clave inválida, 413
 * petición demasiado grande, 415 extensión no soportada, 502 fallo del
 * proveedor de IA, etc.).
 */
export async function analizarSiniestro(
  campos: CamposExpediente,
  archivos: File[],
): Promise<RespuestaAnalisis> {
  const cuerpo = new FormData();
  Object.entries(campos).forEach(([clave, valor]) => cuerpo.append(clave, valor));
  archivos.forEach((archivo) => cuerpo.append("archivos", archivo));

  const respuesta = await fetch(`${API_URL}/api/siniestros`, {
    method: "POST",
    headers: { "X-API-Key": API_KEY },
    body: cuerpo,
  });

  if (!respuesta.ok) {
    const cuerpoError = await respuesta.text();
    let detalle = cuerpoError;
    try {
      const json = JSON.parse(cuerpoError) as { detail?: string };
      if (json.detail) detalle = json.detail;
    } catch {
      // el cuerpo del error no es JSON válido: se usa el texto tal cual
    }
    throw new Error(`La API respondió ${respuesta.status}: ${detalle}`);
  }

  return respuesta.json() as Promise<RespuestaAnalisis>;
}

/** Veredicto del motor -> etiqueta que la UI ya sabe pintar. */
export function estadoDeVeredicto(veredicto: Veredicto): CaseStatus {
  switch (veredicto) {
    case "APROBABLE":
    case "APROBABLE_POR_SILENCIO":
      return "Informe generado";
    case "OBSERVADO":
      return "Información faltante";
    case "RECHAZO":
    case "ESCALADO":
      return "Registrado";
  }
}

const CLAVE_SESION = "resultado-analisis";

/** Guarda el resultado del análisis en sessionStorage, para que la siguiente
 *  pantalla (cableada en una tarea posterior) lo lea sin volver a llamar a
 *  la API. */
export function guardarResultado(resultado: RespuestaAnalisis): void {
  sessionStorage.setItem(CLAVE_SESION, JSON.stringify(resultado));
}

export function leerResultado(): RespuestaAnalisis | null {
  const bruto = sessionStorage.getItem(CLAVE_SESION);
  return bruto ? (JSON.parse(bruto) as RespuestaAnalisis) : null;
}
