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

/** Los seis veredictos que puede emitir el motor de reglas.
 *
 *  `FUERA_DE_ALCANCE` (checks G1.6/G1.9, engine/rules/transporte.yaml) NO es
 *  un rechazo: el reclamo supera el tope de cuantía del producto Express
 *  (US$ 10,000), pero el siniestro puede ser perfectamente válido y
 *  pagable -no hay evidencia en contra-. Simplemente no le corresponde a
 *  ESTE flujo automatizado, y se deriva al proceso de ajuste tradicional
 *  completo. La UI nunca debe presentarlo como un problema del asegurado. */
export type Veredicto =
  | "APROBABLE"
  | "APROBABLE_POR_SILENCIO"
  | "RECHAZO"
  | "ESCALADO"
  | "OBSERVADO"
  | "FUERA_DE_ALCANCE";

/** Tramo comercial del producto Express (checks G1.7/G1.8,
 *  engine/rules/transporte.yaml): fija el HONORARIO del servicio de ajuste
 *  -lo que se le cobra a la aseguradora por tramitar el caso-, no la
 *  indemnización que se le paga al asegurado. Se calcula sobre la pérdida
 *  valorizada/reclamada (`siniestro.perdida_usd`), nunca sobre la
 *  indemnización final (que depende de infraseguro/deducible, resueltos
 *  después).
 *    - "I":  hasta US$ 5,000 -> honorario fijo US$ 120 + IGV.
 *    - "II": US$ 5,000.01 a US$ 10,000 -> honorario fijo US$ 250 + IGV.
 *  Ver `RespuestaAnalisis.tramo_cuantia` para cuándo puede ser `null`. */
export type TramoCuantia = "I" | "II";

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
 *
 * `FUERA_DE_ALCANCE` puede ser el estado del último paso (check G1.6): es
 * tan decisivo como FAIL/OBSERVADO/SILENCIO (corta la cascada, ver DECISIVO
 * en `engine/runner.py`) y trae `check`/`motivo`/`evidencia` igual que ellos.
 */
export type PasoTraza =
  | { gate: string; nombre: string; estado: "PASS" }
  | {
      gate: string;
      nombre: string;
      estado: "FAIL" | "OBSERVADO" | "SILENCIO" | "INCONCLUSO" | "FUERA_DE_ALCANCE";
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
 *  a correr (caso derivado antes de decidir).
 *
 *  `moneda` es la de la póliza sobre la que se intentó el cálculo (el motor
 *  solo calcula en USD): si `calculable` es `false` por moneda no soportada
 *  o ausente, igual la cita (o `null` si la póliza no la consigna) para que
 *  la UI explique por qué no se pudo calcular. Verificado contra
 *  `informe/indemnizacion.py::Indemnizacion` -campo ausente en una versión
 *  previa de este tipo-. */
export type Indemnizacion = {
  calculable: boolean;
  moneda: string | null;
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
 *  fuentes documentales). Verificado contra `api/main.py::crear_siniestro`:
 *  estos siete campos son los únicos que vuelven en `datos_formulario`. */
export type CamposExpediente = {
  aseguradora: string;
  asegurado: string;
  corredor: string;
  contacto: string;
  numero_poliza: string;
  monto_reclamado: string;
  descripcion: string;
};

/**
 * Datos de OPERADOR: a diferencia de `CamposExpediente`, estos SÍ entran al
 * `case` y SÍ pueden cambiar el veredicto (ver `api/main.py::crear_siniestro`,
 * parámetros `prima_pagada`/`fecha_aviso`, y `ingestion/schema.py::CAMPOS_OPERADOR`).
 * Por eso NO viajan de vuelta en `datos_formulario` — no son texto para
 * reexhibir, son evidencia que el motor usó.
 *
 * Su fuente legítima es el operador (ajustador) porque ningún documento del
 * expediente los declara; en producción vendrían del sistema de la
 * aseguradora. Se modelan como `string` porque así los recibe el `Form(...)`
 * de FastAPI: `""` significa "no declarado", y el motor lo trata igual que
 * un campo ausente — deriva a ESCALADO por dato faltante, nunca inventa un
 * valor. `prima_pagada` acepta exactamente "true" o "false" (cualquier otra
 * cosa, incluida la cadena vacía, se interpreta como no declarado); `fecha_aviso`
 * exige el formato `YYYY-MM-DD` (el mismo que produce un `<input type="date">`).
 *
 * `escenario` es la excepción: hoy `crear_siniestro` no lo declara como
 * parámetro, así que la API lo ignora sin error. Se envía de todas formas
 * porque cablearlo ahora ahorra otra ronda de cambios en el frontend cuando
 * la API lo adopte (tarea futura).
 */
export type DatosOperador = {
  escenario: string;
  prima_pagada: string;
  fecha_aviso: string;
  /**
   * QUÉ pasó y CUÁNDO — el aviso de siniestro propiamente dicho, y por eso este
   * formulario es su sitio. Se le pedían a la DENUNCIA POLICIAL, que solo existe
   * si hubo robo: en un siniestro de daño (una volcadura, mercadería mojada) no
   * hay ninguna, y el motor no podía ni empezar. Medido sobre el corpus real: el
   * 37% de los expedientes derivaba por esto.
   *
   * `fecha_ocurrencia` exige `YYYY-MM-DD`. Declararla no la vuelve confiable: el
   * motor sigue exigiendo que otro documento la corrobore (check G1.12).
   *
   * `causa_declarada` debe ser UNA de las etiquetas de `CAUSAS` (ver más abajo):
   * el motor las compara por igualdad exacta, así que una frase libre no calza y
   * la API la trata como no declarada. Por eso en la UI es un desplegable, no un
   * campo de texto: un desplegable no puede devolver prosa.
   */
  fecha_ocurrencia: string;
  causa_declarada: string;
};

/**
 * El vocabulario CERRADO de causas (`ingestion/vocabulario.py::CAUSAS`). No es
 * una lista de sugerencias: `engine/rules/transporte.yaml:G3.4` hace
 * `causa_declarada not in poliza.riesgos_cubiertos` —una pertenencia a lista,
 * por igualdad exacta de cadena— y el deducible por riesgo calza contra estas
 * mismas etiquetas. Cualquier otro valor no calza, y el motor deriva el caso.
 */
export const CAUSAS = [
  { valor: "robo", etiqueta: "Robo (con violencia o amenaza)" },
  { valor: "hurto", etiqueta: "Hurto (sin violencia)" },
  { valor: "faltante", etiqueta: "Faltante de mercadería" },
  { valor: "daño", etiqueta: "Daño a la mercadería" },
  { valor: "apropiacion_ilicita", etiqueta: "Apropiación ilícita" },
  { valor: "otro", etiqueta: "Otro" },
] as const;

/** Discrepancia entre un dato de operador (`DatosOperador`) y lo que ya
 *  había traído la extracción para el mismo campo: gana siempre la
 *  extracción (evidencia documental > declaración sin respaldo), pero el
 *  conflicto se reporta igual para que el ajustador lo vea — nunca se
 *  resuelve en silencio. Ver `ingestion/pipeline.py::_fusionar_datos_operador`. */
export type DiscrepanciaDatosOperador = Record<string, { extraido: ValorJson; operador: ValorJson }>;

/** Un documento condicional del escenario clasificado (catálogo Protegia
 *  2021): NUNCA cuenta como faltante en G6.1 — su ausencia es normal si la
 *  condición no aplica (p. ej. la aseguradora no hizo salvamento). Es
 *  puramente informativo. Ver `engine/helpers.py::CATALOGO_PROTEGIA_2021_CONDICIONALES`. */
export type DocumentoCondicional = {
  id: string;
  condicion: string;
};

/** Un documento que SÍ se subió y del que NO se pudo extraer nada — un escaneo
 *  malo, típicamente. `motivo` es la explicación LITERAL del modelo, no una
 *  nuestra: "no se pudo leer" es información, no ausencia de información. Sin
 *  esto, el ajustador lee "falta la vigencia" y sale a pedir una póliza que ya
 *  está en el expediente. */
export type DocumentoIlegible = {
  documentos: string[];
  tipo: string | null;
  motivo: string;
};

/** Un documento que se leyó BIEN y cuyos campos NO llegaron al motor: el modelo
 *  los colgó de una raíz que el `case` no tiene (`raices`). Es el caso más
 *  traicionero de los tres, porque el dato SÍ estaba y el fallo es NUESTRO — no
 *  se arregla pidiendo documentos. Ver `ingestion/campos_por_documento.py::RAICES_CASE`. */
export type CamposDescartados = {
  documentos: string[];
  tipo: string | null;
  raices: string[];
};

/** Forma exacta de la respuesta de `POST /api/siniestros`. */
export type RespuestaAnalisis = {
  caso_id: string;
  veredicto: Veredicto;
  // Tramo comercial del producto Express (ver `TramoCuantia`): fija el
  // honorario del servicio de ajuste, no un dato interno. `null` si el motor
  // no llegó a fijarlo (p.ej. veredicto FUERA_DE_ALCANCE, o pérdida
  // valorizada ausente -check G1.9-).
  tramo_cuantia: TramoCuantia | null;
  motivo: string | null;
  flags: string[];
  traza: PasoTraza[];
  clasificacion: Clasificacion | null;
  discrepancia_escenario: DiscrepanciaEscenario | null;
  discrepancia_datos_operador: DiscrepanciaDatosOperador | null;
  problemas_extraccion: string[];
  pre_analisis_ia: PreAnalisisIA | null;
  informe_md: string | null;
  carta_sbs: string | null;
  indemnizacion: Indemnizacion | null;
  recordatorios: Recordatorio[] | null;
  // `faltantes` son ids de documento (p. ej. "guia_remision"), NUNCA
  // etiquetas listas para pintar: siempre traducir con `etiquetas_documentos`
  // antes de mostrarlos (ver `api/esquema.py::construir_respuesta`).
  faltantes: string[];
  // `faltantes` dice qué documentos NO llegaron. Estas tres dicen qué le pasó a
  // lo que SÍ llegó, y son tres cosas DISTINTAS que antes se veían igual —un
  // "falta poliza.vigencia_inicio" que mandaba al ajustador a buscar un papel
  // que ya tenía en la mano—. Cada una se resuelve de una manera:
  //   - ilegible   -> pedir un escaneo mejor
  //   - ignorado   -> nada (era ruido), pero hay que decirlo
  //   - descartado -> soporte: es un bug NUESTRO y el dato SÍ estaba
  // Aquí van los NOMBRES de archivo tal cual los subió el usuario (no ids de
  // catálogo), así que se pintan directos: no pasan por `etiquetas_documentos`.
  documentos_ilegibles: DocumentoIlegible[];
  documentos_ignorados: string[];
  campos_descartados: CamposDescartados[];
  condicionales: DocumentoCondicional[];
  etiquetas_documentos: Record<string, string>;
  datos_formulario: CamposExpediente;
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const API_KEY = import.meta.env.VITE_API_KEY ?? "";

/**
 * Envía el expediente (campos del formulario + datos de operador + archivos
 * adjuntos) al motor de reglas y devuelve su veredicto.
 *
 * Un 200 con `veredicto: "ESCALADO"` (p. ej. por extracción incompleta, o por
 * no haber declarado `prima_pagada`/`fecha_aviso`) NO es un error: es el
 * motor derivando el caso a un humano. Esta función solo lanza si la API
 * responde con un código de error (401 clave inválida, 413 petición
 * demasiado grande, 415 extensión no soportada, 502 fallo del proveedor de
 * IA, etc.).
 */
export async function analizarSiniestro(
  campos: CamposExpediente,
  archivos: File[],
  datosOperador: DatosOperador,
): Promise<RespuestaAnalisis> {
  const cuerpo = new FormData();
  Object.entries(campos).forEach(([clave, valor]) => cuerpo.append(clave, valor));
  Object.entries(datosOperador).forEach(([clave, valor]) => cuerpo.append(clave, valor));
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
    // FUERA_DE_ALCANCE reutiliza el mismo estado neutro que RECHAZO/ESCALADO
    // en esta lista genérica -no existe (todavía) un estado de tablero
    // dedicado-, pero NUNCA debe leerse como un rechazo: el detalle del
    // expediente es quien explica el matiz (ver TITULO_VEREDICTO/
    // DETALLE_VEREDICTO/CATEGORIA_VEREDICTO en App.tsx).
    case "FUERA_DE_ALCANCE":
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
