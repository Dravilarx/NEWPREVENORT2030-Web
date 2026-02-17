'use client'
import { FormularioProps, isFieldDisabled } from './types'

/**
 * SignosVitales — Formulario de signos vitales completo.
 * Campos: Pulso, PA Sistólica/Diastólica, Peso, Talla, IMC (calc), Sat O2, Test Ruffier.
 */
export default function SignosVitales({ examId, resultados: res, updateField, isEditable, isFinalizado }: FormularioProps) {
    const disabled = isFieldDisabled(isEditable, isFinalizado)

    const imc = (res.peso && res.talla)
        ? (Number(res.peso) / (Number(res.talla) * Number(res.talla))).toFixed(1)
        : '--'

    const ruffier = (res.pulso && res.pulso_post && res.pulso_recuperacion)
        ? ((Number(res.pulso) + Number(res.pulso_post) + Number(res.pulso_recuperacion) - 200) / 10).toFixed(1)
        : '--'

    return (
        <div className="vital-signs-table card glass">
            <div className="vital-grid">
                <div className="vital-item">
                    <label>Pulso</label>
                    <input type="number" value={res.pulso || ''} onChange={(e) => updateField(examId, 'pulso', e.target.value)} disabled={disabled} />
                </div>
                <div className="vital-item pa-group">
                    <label>P.A (Sis/Dia)</label>
                    <div className="flex-pa">
                        <input type="number" placeholder="Sis" value={res.pa_sistolica || ''} onChange={(e) => updateField(examId, 'pa_sistolica', e.target.value)} disabled={disabled} />
                        <span>/</span>
                        <input type="number" placeholder="Dia" value={res.pa_diastolica || ''} onChange={(e) => updateField(examId, 'pa_diastolica', e.target.value)} disabled={disabled} />
                    </div>
                </div>
                <div className="vital-item">
                    <label>Peso (kg)</label>
                    <input type="number" value={res.peso || ''} onChange={(e) => updateField(examId, 'peso', e.target.value)} disabled={disabled} />
                </div>
                <div className="vital-item">
                    <label>Talla (m)</label>
                    <input type="number" step="0.01" value={res.talla || ''} onChange={(e) => updateField(examId, 'talla', e.target.value)} disabled={disabled} />
                </div>
                <div className="vital-item highlight">
                    <label>IMC</label>
                    <div className="calc-val">{imc}</div>
                </div>
                <div className="vital-item">
                    <label>Sat %</label>
                    <input type="number" value={res.saturometria || ''} onChange={(e) => updateField(examId, 'saturometria', e.target.value)} disabled={disabled} />
                </div>
                <div className="vital-item">
                    <label>Test Ruffier (C.)</label>
                    <div className="flex-pa">
                        <input type="number" placeholder="P1" value={res.pulso || ''} disabled />
                        <input type="number" placeholder="P2" value={res.pulso_post || ''} onChange={(e) => updateField(examId, 'pulso_post', e.target.value)} disabled={disabled} />
                        <input type="number" placeholder="P3" value={res.pulso_recuperacion || ''} onChange={(e) => updateField(examId, 'pulso_recuperacion', e.target.value)} disabled={disabled} />
                    </div>
                </div>
                <div className="vital-item highlight">
                    <label>Resultado Ruffier</label>
                    <div className="calc-val">{ruffier}</div>
                </div>
            </div>
        </div>
    )
}
