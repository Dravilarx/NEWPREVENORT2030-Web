'use client'
import { FormularioProps, isFieldDisabled } from './types'

/**
 * EstiloVida — Formulario de hábitos y estilo de vida.
 * Campos: Tabaquismo (SI/NO), Actividad Física (hrs/sem).
 */
export default function EstiloVida({ examId, resultados: res, updateField, isEditable, isFinalizado }: FormularioProps) {
    const disabled = isFieldDisabled(isEditable, isFinalizado)

    return (
        <div className="lifestyle-table card glass">
            <div className="ls-grid">
                <div className="ls-item group-horizontal">
                    <div className="ls-field">
                        <label>¿Fuma?</label>
                        <div className="flex-si-no">
                            <button className={res.fuma === 'SI' ? 'active' : ''} onClick={() => updateField(examId, 'fuma', 'SI')} disabled={disabled}>SI</button>
                            <button className={res.fuma === 'NO' ? 'active' : ''} onClick={() => updateField(examId, 'fuma', 'NO')} disabled={disabled}>NO</button>
                        </div>
                    </div>
                </div>
                <div className="ls-item">
                    <label>Actividad Física (hrs/sem)</label>
                    <input type="number" value={res.actividad_horas || ''} onChange={(e) => updateField(examId, 'actividad_horas', e.target.value)} disabled={disabled} />
                </div>
            </div>
        </div>
    )
}
