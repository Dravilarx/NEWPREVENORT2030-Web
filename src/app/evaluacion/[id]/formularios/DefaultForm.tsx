'use client'
import { FormularioProps, isFieldDisabled } from './types'

/**
 * DefaultForm — Formulario genérico de texto libre.
 * Se usa como fallback cuando no existe un formulario especializado.
 * Incluye un campo de resultado/hallazgo de texto libre.
 */
export default function DefaultForm({ examId, resultados, updateField, isEditable, isFinalizado }: FormularioProps) {
    const disabled = isFieldDisabled(isEditable, isFinalizado)

    return (
        <div className="default-inputs">
            <div className="input-group">
                <label>Resultado / Hallazgo</label>
                <input
                    type="text"
                    value={resultados.resultado || ''}
                    onChange={(e) => updateField(examId, 'resultado', e.target.value)}
                    disabled={disabled}
                />
            </div>
        </div>
    )
}
