'use client'
import { FormularioProps, isFieldDisabled } from './types'

/**
 * ECG — Electrocardiograma.
 * Registro de parámetros básicos ECG e interpretación.
 */

const RITMOS = ['Sinusal', 'Fibrilación Auricular', 'Flutter Auricular', 'Taquicardia Ventricular', 'Bradicardia Sinusal', 'Otro']
const EJES = ['Normal', 'Desviación izquierda', 'Desviación derecha', 'Indeterminado']
const HALLAZGOS = [
    { field: 'ecg_hipertrofia_vi', label: 'Hipertrofia VI' },
    { field: 'ecg_hipertrofia_vd', label: 'Hipertrofia VD' },
    { field: 'ecg_bloqueo_rama_der', label: 'Bloqueo Rama Derecha' },
    { field: 'ecg_bloqueo_rama_izq', label: 'Bloqueo Rama Izquierda' },
    { field: 'ecg_isquemia', label: 'Signos de Isquemia' },
    { field: 'ecg_infarto_previo', label: 'Infarto Previo' },
    { field: 'ecg_extrasistoles', label: 'Extrasístoles' },
    { field: 'ecg_qt_prolongado', label: 'QT Prolongado' },
]

export default function ECG({ examId, resultados: res, updateField, isEditable, isFinalizado }: FormularioProps) {
    const disabled = isFieldDisabled(isEditable, isFinalizado)

    const hallazgosPositivos = HALLAZGOS.filter(h => res[h.field] === 'SI').length

    return (
        <div className="ecg-form card glass">
            <div className="form-section">
                <h4 className="section-title">💓 Parámetros del ECG</h4>
                <div className="ecg-params-grid">
                    <div className="ecg-item">
                        <label>FC (lpm)</label>
                        <input type="number" value={res.ecg_fc || ''} onChange={(e) => updateField(examId, 'ecg_fc', e.target.value)} disabled={disabled} />
                    </div>
                    <div className="ecg-item">
                        <label>Ritmo</label>
                        <select value={res.ecg_ritmo || ''} onChange={(e) => updateField(examId, 'ecg_ritmo', e.target.value)} disabled={disabled}>
                            <option value="">Seleccionar...</option>
                            {RITMOS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="ecg-item">
                        <label>Eje Eléctrico</label>
                        <select value={res.ecg_eje || ''} onChange={(e) => updateField(examId, 'ecg_eje', e.target.value)} disabled={disabled}>
                            <option value="">Seleccionar...</option>
                            {EJES.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                    </div>
                    <div className="ecg-item">
                        <label>PR (ms)</label>
                        <input type="number" value={res.ecg_pr || ''} onChange={(e) => updateField(examId, 'ecg_pr', e.target.value)} disabled={disabled} />
                    </div>
                    <div className="ecg-item">
                        <label>QRS (ms)</label>
                        <input type="number" value={res.ecg_qrs || ''} onChange={(e) => updateField(examId, 'ecg_qrs', e.target.value)} disabled={disabled} />
                    </div>
                    <div className="ecg-item">
                        <label>QT/QTc (ms)</label>
                        <input type="number" value={res.ecg_qt || ''} onChange={(e) => updateField(examId, 'ecg_qt', e.target.value)} disabled={disabled} />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h4 className="section-title">🔍 Hallazgos</h4>
                <div className="ecg-hallazgos-grid">
                    {HALLAZGOS.map(({ field, label }) => (
                        <div key={field} className="ecg-hallazgo-row">
                            <span className="ecg-hallazgo-label">{label}</span>
                            <div className="romberg-options">
                                <button className={`romberg-btn ${res[field] === 'NO' ? 'active-ok' : ''}`} onClick={() => updateField(examId, field, 'NO')} disabled={disabled}>No</button>
                                <button className={`romberg-btn ${res[field] === 'SI' ? 'active-alert' : ''}`} onClick={() => updateField(examId, field, 'SI')} disabled={disabled}>Sí</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="form-section">
                <h4 className="section-title">📝 Interpretación</h4>
                <select value={res.ecg_conclusion || ''} onChange={(e) => updateField(examId, 'ecg_conclusion', e.target.value)} disabled={disabled} style={{ width: '100%' }}>
                    <option value="">Seleccionar conclusión...</option>
                    <option value="Normal">ECG Normal</option>
                    <option value="Anormal sin contraindicación">Anormal sin contraindicación laboral</option>
                    <option value="Anormal con contraindicación">Anormal con contraindicación laboral</option>
                    <option value="Requiere evaluación cardiológica">Requiere evaluación cardiológica</option>
                </select>
                <textarea
                    value={res.ecg_obs || ''}
                    onChange={(e) => updateField(examId, 'ecg_obs', e.target.value)}
                    disabled={disabled}
                    placeholder="Observaciones del trazado..."
                    rows={2}
                    style={{ marginTop: '8px', width: '100%' }}
                />
            </div>

            {hallazgosPositivos > 0 && (
                <div className="romberg-result alert">
                    ⚠️ {hallazgosPositivos} hallazgo(s) positivo(s) detectado(s)
                </div>
            )}
        </div>
    )
}
