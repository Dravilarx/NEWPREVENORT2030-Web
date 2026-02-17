'use client'
import { FormularioProps, isFieldDisabled } from './types'

/**
 * Radiologia — Informe de Radiología / Imagenología.
 * Rx Tórax, Columna, otras. Clasificación ILO para silicosis.
 */

const TIPOS_EXAMEN = ['Rx Tórax AP', 'Rx Tórax PA-L', 'Rx Columna Lumbar', 'Rx Columna Cervical', 'Rx Pelvis', 'Ecografía', 'Otro']

const CALIDADES = ['Buena', 'Aceptable', 'Deficiente']

const HALLAZGOS_TORAX = [
    { field: 'rx_cardiomegalia', label: 'Cardiomegalia' },
    { field: 'rx_infiltrado', label: 'Infiltrado Pulmonar' },
    { field: 'rx_derrame', label: 'Derrame Pleural' },
    { field: 'rx_nodulo', label: 'Nódulo/Masa' },
    { field: 'rx_neumoconiosis', label: 'Signos de Neumoconiosis' },
    { field: 'rx_fibrosis', label: 'Fibrosis' },
    { field: 'rx_escoliosis', label: 'Escoliosis' },
]

export default function Radiologia({ examId, resultados: res, updateField, isEditable, isFinalizado }: FormularioProps) {
    const disabled = isFieldDisabled(isEditable, isFinalizado)
    const hallazgosPositivos = HALLAZGOS_TORAX.filter(h => res[h.field] === 'SI').length

    return (
        <div className="radiologia-form card glass">
            <div className="form-section">
                <h4 className="section-title">🩻 Datos del Examen</h4>
                <div className="rx-params-grid">
                    <div className="rx-item">
                        <label>Tipo de Examen</label>
                        <select value={res.rx_tipo || ''} onChange={(e) => updateField(examId, 'rx_tipo', e.target.value)} disabled={disabled}>
                            <option value="">Seleccionar...</option>
                            {TIPOS_EXAMEN.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="rx-item">
                        <label>Calidad de la Placa</label>
                        <select value={res.rx_calidad || ''} onChange={(e) => updateField(examId, 'rx_calidad', e.target.value)} disabled={disabled}>
                            <option value="">Seleccionar...</option>
                            {CALIDADES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="rx-item">
                        <label>Lectura ILO (si aplica)</label>
                        <select value={res.rx_ilo || ''} onChange={(e) => updateField(examId, 'rx_ilo', e.target.value)} disabled={disabled}>
                            <option value="">No aplica</option>
                            <option value="0/0">0/0 - Normal</option>
                            <option value="0/1">0/1 - Normal/Sospecha</option>
                            <option value="1/0">1/0 - Mínimo</option>
                            <option value="1/1">1/1 - Leve</option>
                            <option value="1/2">1/2 - Leve/Moderado</option>
                            <option value="2/1">2/1 - Moderado</option>
                            <option value="2/2">2/2 - Moderado</option>
                            <option value="2/3">2/3 - Moderado/Avanzado</option>
                            <option value="3/2">3/2 - Avanzado</option>
                            <option value="3/3">3/3 - Avanzado</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h4 className="section-title">🔍 Hallazgos</h4>
                <div className="ecg-hallazgos-grid">
                    {HALLAZGOS_TORAX.map(({ field, label }) => (
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
                <h4 className="section-title">📝 Informe Radiólogo</h4>
                <textarea
                    value={res.rx_informe || ''}
                    onChange={(e) => updateField(examId, 'rx_informe', e.target.value)}
                    disabled={disabled}
                    rows={4}
                    placeholder="Descripción del informe radiológico..."
                />
            </div>

            <div className="form-section">
                <h4 className="section-title">📋 Conclusión</h4>
                <select value={res.rx_conclusion || ''} onChange={(e) => updateField(examId, 'rx_conclusion', e.target.value)} disabled={disabled} style={{ width: '100%' }}>
                    <option value="">Seleccionar conclusión...</option>
                    <option value="Normal">Estudio Normal</option>
                    <option value="Normal variante">Normal con variante anatómica</option>
                    <option value="Hallazgo sin contraindicación">Hallazgo sin contraindicación laboral</option>
                    <option value="Hallazgo con contraindicación">Hallazgo con contraindicación laboral</option>
                    <option value="Requiere evaluación">Requiere evaluación especializada</option>
                </select>
            </div>

            {hallazgosPositivos > 0 && (
                <div className="romberg-result alert">
                    ⚠️ {hallazgosPositivos} hallazgo(s) positivo(s)
                </div>
            )}
        </div>
    )
}
