/**
 * Tipos compartidos para todos los formularios de evaluación médica.
 * 
 * Cada formulario recibe estas props estándar:
 * - examId: ID del examen en atencion_examenes
 * - resultados: objeto clave-valor con los datos capturados
 * - updateField: callback para actualizar un campo específico
 * - isEditable: si el usuario actual puede editar (basado en rol)
 * - isFinalizado: si el examen ya fue guardado como finalizado
 */

export interface FormularioProps {
    /** ID único del examen (atencion_examenes.id) */
    examId: string
    /** Datos capturados del formulario (Record<string, any>) */
    resultados: Record<string, any>
    /** Callback para actualizar campos: (examId, fieldName, value) */
    updateField: (examId: string, field: string, val: string) => void
    /** Si el usuario actual tiene permisos para editar este examen */
    isEditable: boolean
    /** Si el examen está en estado 'finalizado' */
    isFinalizado: boolean
}

/**
 * Función para determinar si un input debe estar deshabilitado.
 * Un campo se deshabilita si NO es editable Y el examen ya está finalizado.
 */
export const isFieldDisabled = (isEditable: boolean, isFinalizado: boolean): boolean => {
    return !isEditable && isFinalizado
}
