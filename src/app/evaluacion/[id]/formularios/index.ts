/**
 * Form Registry — Mapea cada tipo_formulario a su componente React.
 * 
 * Para agregar un nuevo formulario:
 * 1. Crear el archivo ComponenteNuevo.tsx en este directorio
 * 2. Importarlo aquí
 * 3. Agregar la entrada al FORM_REGISTRY
 * 
 * Eso es todo. El page.tsx lo renderiza automáticamente.
 */

import SignosVitales from './SignosVitales'
import TestVisual from './TestVisual'
import Audiometria from './Audiometria'
import EstiloVida from './EstiloVida'
import DefaultForm from './DefaultForm'

import type { FormularioProps } from './types'
import type { ComponentType } from 'react'

/** Registry central: tipo_formulario → componente React */
export const FORM_REGISTRY: Record<string, ComponentType<FormularioProps>> = {
    signos_vitales: SignosVitales,
    test_visual: TestVisual,
    audiometria: Audiometria,
    estilo_vida: EstiloVida,
    // ─── Próximos formularios (descomentar al implementar) ───
    // escala_epworth: EscalaEpworth,
    // romberg: Romberg,
    // framingham: Framingham,
    // ecg: ECG,
    // psicotecnico: Psicotecnico,
    // psicologico: Psicologico,
    // consulta_medica: ConsultaMedica,
    // consentimiento: Consentimiento,
    // laboratorio: Laboratorio,
    // radiologia: Radiologia,
}

/** Obtiene el componente de formulario correcto dado un tipo_formulario */
export function getFormComponent(tipoFormulario: string | undefined): ComponentType<FormularioProps> {
    return FORM_REGISTRY[tipoFormulario || 'default'] || DefaultForm
}

export type { FormularioProps } from './types'
export { DefaultForm }
