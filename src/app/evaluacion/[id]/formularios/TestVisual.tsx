'use client'
import { FormularioProps, isFieldDisabled } from './types'

/**
 * TestVisual — Formulario de agudeza visual.
 * Campos: Lejos (OD, OI, Ambos), Cerca (OD, OI, Ambos).
 */
export default function TestVisual({ examId, resultados: res, updateField, isEditable, isFinalizado }: FormularioProps) {
    const disabled = isFieldDisabled(isEditable, isFinalizado)

    const rows = [
        { label: 'Lejos OD', field: 'lejos_od' },
        { label: 'Lejos OI', field: 'lejos_oi' },
        { label: 'Lejos Ambos', field: 'lejos_ambos' },
        { label: 'Cerca OD', field: 'cerca_od' },
        { label: 'Cerca OI', field: 'cerca_oi' },
        { label: 'Cerca Ambos', field: 'cerca_ambos' },
    ]

    return (
        <div className="visual-test-table card glass">
            <div className="vt-acuity-grid">
                {rows.map(({ label, field }) => (
                    <div key={field} className="vta-row">
                        <span className="vta-label">{label}</span>
                        <input
                            type="text"
                            value={res[field] || ''}
                            onChange={(e) => updateField(examId, field, e.target.value)}
                            disabled={disabled}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
