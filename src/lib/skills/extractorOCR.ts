/**
 * Habilidad D: Extractor_OCR_Laboratorio (Asistido por IA)
 * 
 * Este skill simula la extracción de datos desde PDFs de laboratorio 
 * externos para poblar la tabla de resultados_clinicos.
 */

export interface GemaLabResult {
    parametro: string;
    valor: string;
    unidad: string;
    rango_referencia?: string;
}

export interface InformeMapeado {
    atencion_id: string;
    resultados: GemaLabResult[];
    confiabilidad_ia: number; // 0 a 100
}

/**
 * Esta función sería llamada por un flujo que use Gemini para 
 * analizar el texto extraído por un OCR tradicional.
 */
export const mapearResultadosLaboratorio = (
    textoExtraido: string,
    atencionId: string
): InformeMapeado => {
    // Lógica de parsing (Simulación)
    // En producción, aquí se pasaría el texto a un prompt de Gemini

    const resultados: GemaLabResult[] = [];

    // Ejemplo de lo que Gemini extraería
    if (textoExtraido.includes('GLUCOSA') || textoExtraido.includes('GLICEMIA')) {
        resultados.push({
            parametro: 'Glicemia',
            valor: '115',
            unidad: 'mg/dL',
            rango_referencia: '70-110'
        });
    }

    if (textoExtraido.includes('ALCOHOL')) {
        resultados.push({
            parametro: 'Alcoholuria',
            valor: '0.0',
            unidad: 'g/L',
            rango_referencia: 'Negativo'
        });
    }

    return {
        atencion_id: atencionId,
        resultados: resultados,
        confiabilidad_ia: 98
    };
};
