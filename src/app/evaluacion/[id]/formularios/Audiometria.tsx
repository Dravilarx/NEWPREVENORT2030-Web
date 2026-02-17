'use client'
import { FormularioProps, isFieldDisabled } from './types'

const FREQUENCIES = [500, 1000, 2000, 3000, 4000, 6000, 8000]
const DB_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80]

/**
 * Audiometria — Formulario de audiometría tonal.
 * Tabla de frecuencias (Hz) con selects de dB para OD y OI.
 */
export default function Audiometria({ examId, resultados: res, updateField, isEditable, isFinalizado }: FormularioProps) {
    const disabled = isFieldDisabled(isEditable, isFinalizado)

    return (
        <div className="audiovestibular-table card glass">
            <div className="audio-grid">
                <div className="audio-header">
                    <span>Hz</span><span>OD</span><span>OI</span>
                </div>
                {FREQUENCIES.map(freq => (
                    <div key={freq} className="audio-row">
                        <span className="freq-label">{freq}</span>
                        <select value={res[`audio_od_${freq}`] || ''} onChange={(e) => updateField(examId, `audio_od_${freq}`, e.target.value)} disabled={disabled}>
                            <option value="">--</option>
                            {DB_OPTIONS.map(db => <option key={db} value={db}>{db}</option>)}
                        </select>
                        <select value={res[`audio_oi_${freq}`] || ''} onChange={(e) => updateField(examId, `audio_oi_${freq}`, e.target.value)} disabled={disabled}>
                            <option value="">--</option>
                            {DB_OPTIONS.map(db => <option key={db} value={db}>{db}</option>)}
                        </select>
                    </div>
                ))}
            </div>
        </div>
    )
}
