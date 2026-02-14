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
}

export const evaluarParametrosClinicos = (
  parametros: ParametroClinico[],
  limites: CargoLimites
): VeredictoIA => {
  let alertas = 0;
  let criticos = 0;
  let resumen = "";

  // Lógica de Presión Arterial (Especialmente para Gran Altura)
  const pa = parametros.find(p => p.nombre.toLowerCase().includes('presión arterial'));
  if (pa && typeof pa.valor === 'string') {
    const [sis, dias] = pa.valor.split('/').map(Number);
    
    // Umbrales definidos en PROJECT_BIBLE.md
    if (sis >= 160 || dias >= 100) {
      criticos++;
      resumen += "Presión arterial en nivel crítico (Roja). ";
    } else if (sis >= limites.pa_sistolica_max || dias >= limites.pa_diastolica_max) {
      alertas++;
      resumen += "Presión arterial sobre el límite de seguridad (Naranja). ";
    }
  }

  // Lógica de Glicemia
  const glicemia = parametros.find(p => p.nombre.toLowerCase().includes('glicemia'));
  if (glicemia) {
    const val = Number(glicemia.valor);
    if (val >= 126) {
      criticos++;
      resumen += "Glicemia en rango de sospecha diagnóstica (Roja). ";
    } else if (val > limites.glicemia_max) {
      alertas++;
      resumen += "Glicemia elevada (Naranja). ";
    }
  }

  // Veredicto Final
  if (criticos > 0) {
    return {
      es_alerta: true,
      estado_sugerido: 'no_apto',
      comentario: `Se detectaron ${criticos} parámetros críticos.`,
      justificacion: resumen || "Parámetros fuera de rango crítico normativo."
    };
  }

  if (alertas > 0) {
    return {
      es_alerta: true,
      estado_sugerido: 'remediacion',
      comentario: `Se detectaron ${alertas} desviaciones leves.`,
      justificacion: resumen || "Parámetros en rango de remediación según protocolo Prevenort."
    };
  }

  return {
    es_alerta: false,
    estado_sugerido: 'apto',
    comentario: "Todos los parámetros se encuentran dentro de los rangos normales.",
    justificacion: "Cumple con los estándares de salud para el cargo."
  };
};
