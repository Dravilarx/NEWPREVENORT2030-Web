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
import CalidadSueno from './CalidadSueno'
import Romberg from './Romberg'
import Framingham from './Framingham'
import ECG from './ECG'
import Psicotecnico from './Psicotecnico'
import Psicologico from './Psicologico'
import ConsultaMedica from './ConsultaMedica'
import Consentimiento from './Consentimiento'
import ConsentimientoGeneral from './ConsentimientoGeneral'
import Laboratorio from './Laboratorio'
import Radiologia from './Radiologia'
import AlcoholDrogas from './AlcoholDrogas'
import DefaultForm from './DefaultForm'

import type { FormularioProps } from './types'
import type { ComponentType } from 'react'

/** Registry central: tipo_formulario → componente React */
export const FORM_REGISTRY: Record<string, ComponentType<FormularioProps>> = {
    signos_vitales: SignosVitales,
    test_visual: TestVisual,
    audiometria: Audiometria,
    estilo_vida: EstiloVida,
    escala_epworth: CalidadSueno,
    romberg: Romberg,
    framingham: Framingham,
    ecg: ECG,
    psicotecnico: Psicotecnico,
    psicologico: Psicologico,
    consulta_medica: ConsultaMedica,
    consentimiento: Consentimiento,
    consentimiento_general: ConsentimientoGeneral,
    laboratorio: Laboratorio,
    radiologia: Radiologia,
    alcohol_drogas: AlcoholDrogas,
}

/** Obtiene el componente de formulario correcto dado un tipo_formulario */
export function getFormComponent(tipoFormulario: string | undefined): ComponentType<FormularioProps> {
    return FORM_REGISTRY[tipoFormulario || 'default'] || DefaultForm
}

export type { FormularioProps } from './types'
export { DefaultForm }
