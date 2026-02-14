/**
 * Habilidad A: Evaluador_Paramétrico_IA
 * 
 * Este skill analiza los resultados clínicos y determina si están fuera de los rangos
 * definidos para el cargo del trabajador, aplicando lógica de IA para veredictos.
 */

export interface ParametroClinico {
  nombre: string;
  valor: string | number;
}

export interface CargoLimites {
  pa_sistolica_max: number;
  pa_diastolica_max: number;
  glicemia_max: number;
  es_gran_altura: boolean;
}

export interface VeredictoIA {
  es_alerta: boolean;
  estado_sugerido: 'apto' | 'remediacion' | 'no_apto';
  comentario: string;
  justificacion: string;
  alertas_detectadas: string[];
}

export const evaluarParametrosClinicos = (
  parametros: ParametroClinico[],
  limites: CargoLimites
): VeredictoIA => {
  let alertas = 0;
  let criticos = 0;
  let resumen = "";
  let alertasDetectadas: string[] = [];

  // Lógica de Presión Arterial
  const pa_sis = parametros.find(p => p.nombre.toLowerCase().includes('sistólica'))?.valor;
  const pa_dia = parametros.find(p => p.nombre.toLowerCase().includes('diastólica'))?.valor;
  const pa_str = parametros.find(p => p.nombre.toLowerCase() === 'presión arterial')?.valor;

  let sis = 0;
  let dias = 0;

  if (pa_str && typeof pa_str === 'string') {
    [sis, dias] = pa_str.split('/').map(Number);
  } else if (pa_sis !== undefined && pa_dia !== undefined) {
    sis = Number(pa_sis);
    dias = Number(pa_dia);
  }

  if (sis > 0 || dias > 0) {
    if (sis >= 180 || dias >= 110) {
      criticos++;
      alertasDetectadas.push('Presión Arterial');
      resumen += "⚠️ Crisis Hipertensiva detectada. Requiere derivación inmediata. ";
    } else if (sis >= limites.pa_sistolica_max || dias >= limites.pa_diastolica_max) {
      alertas++;
      alertasDetectadas.push('Presión Arterial');
      resumen += `Valores de P.A. (${sis}/${dias}) exceden el límite de ${limites.pa_sistolica_max}/${limites.pa_diastolica_max} definido para este cargo${limites.es_gran_altura ? ' en Gran Altura' : ''}. `;
    }
  }

  // Lógica de Glicemia
  const glicemia = parametros.find(p => p.nombre.toLowerCase().includes('glicemia'));
  if (glicemia) {
    const val = Number(glicemia.valor);
    if (val >= 200) {
      criticos++;
      alertasDetectadas.push('Glicemia');
      resumen += "⚠️ Sospecha Diabetes Descompensada (Glicemia ≥ 200). ";
    } else if (val > limites.glicemia_max) {
      alertas++;
      alertasDetectadas.push('Glicemia');
      resumen += `Glicemia (${val} mg/dL) superior al límite institucional de ${limites.glicemia_max} mg/dL. `;
    }
  }

  // Lógica de IMC
  const peso = parametros.find(p => p.nombre.toLowerCase().includes('peso'))?.valor;
  const talla = parametros.find(p => p.nombre.toLowerCase().includes('talla'))?.valor;
  if (peso && talla) {
    const imc = Number(peso) / (Number(talla) * Number(talla));
    if (imc >= 35) {
      alertas++;
      alertasDetectadas.push('IMC');
      resumen += `Obesidad Clase II/III (IMC: ${imc.toFixed(1)}). Riesgo cardiovascular elevado. `;
    }
  }

  // Veredicto Final
  if (criticos > 0) {
    return {
      es_alerta: true,
      estado_sugerido: 'no_apto',
      comentario: `Se detectaron ${criticos} parámetros críticos que impiden la aptitud inmediata.`,
      justificacion: resumen + (limites.es_gran_altura ? " No cumple criterios de Guía Técnica de Hipobaria Intermitente Crónica." : " No cumple estándares de seguridad básica."),
      alertas_detectadas: alertasDetectadas
    };
  }

  if (alertas > 0) {
    return {
      es_alerta: true,
      estado_sugerido: 'remediacion',
      comentario: `Se detectaron ${alertas} desviaciones que requieren control médico.`,
      justificacion: resumen + " Se sugiere derivación a remediación para control de factores de riesgo antes de considerar aptitud.",
      alertas_detectadas: alertasDetectadas
    };
  }

  return {
    es_alerta: false,
    estado_sugerido: 'apto',
    comentario: "Todos los parámetros se encuentran dentro de los rangos normales.",
    justificacion: "El trabajador cumple con los requerimientos psicofísicos del cargo." + (limites.es_gran_altura ? " Apto para desempeño en Gran Altura Geográfica." : ""),
    alertas_detectadas: []
  };
};
