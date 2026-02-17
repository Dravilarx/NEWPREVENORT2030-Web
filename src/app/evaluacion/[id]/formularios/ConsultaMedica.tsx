'use client'
import { FormularioProps, isFieldDisabled } from './types'

/**
 * ConsultaMedica — Examen Médico Ocupacional completo.
 * Revisión por sistemas, antecedentes, examen físico, y conclusión.
 */

const SISTEMAS = [
    { field: 'med_cardiovascular', label: 'Cardiovascular' },
    { field: 'med_respiratorio', label: 'Respiratorio' },
    { field: 'med_digestivo', label: 'Digestivo' },
    { field: 'med_musculoesqueletico', label: 'Musculoesquelético' },
    { field: 'med_neurologico', label: 'Neurológico' },
    { field: 'med_dermatologico', label: 'Dermatológico' },
    { field: 'med_genitourinario', label: 'Genitourinario' },
    { field: 'med_endocrino', label: 'Endocrino' },
    { field: 'med_orl', label: 'ORL (Oído-Nariz-Garganta)' },
    { field: 'med_oftalmologico', label: 'Oftalmológico' },
]

const APTITUDES = [
    'Apto sin restricciones',
    'Apto con restricciones',
    'No apto temporalmente',
    'No apto definitivamente',
    'Pendiente de exámenes complementarios',
]

export default function ConsultaMedica({ examId, resultados: res, updateField, isEditable, isFinalizado }: FormularioProps) {
    const disabled = isFieldDisabled(isEditable, isFinalizado)

    return (
        <div className="consulta-medica-form card glass">
            <div className="form-section">
                <h4 className="section-title">📋 Motivo de Consulta</h4>
                <select value={res.med_motivo || ''} onChange={(e) => updateField(examId, 'med_motivo', e.target.value)} disabled={disabled} style={{ width: '100%' }}>
                    <option value="">Seleccionar...</option>
                    <option value="Pre-ocupacional">Pre-ocupacional</option>
                    <option value="Ocupacional periódico">Ocupacional periódico</option>
                    <option value="Retiro">Retiro / Egreso</option>
                    <option value="Reintegro">Reintegro laboral</option>
                    <option value="Cambio de puesto">Cambio de puesto</option>
                    <option value="Altura geográfica">Exposición a altura geográfica</option>
                </select>
            </div>

            <div className="form-section">
                <h4 className="section-title">📜 Antecedentes Relevantes</h4>
                <div className="med-grid">
                    <div className="med-item">
                        <label>Antecedentes Médicos</label>
                        <textarea value={res.med_antecedentes || ''} onChange={(e) => updateField(examId, 'med_antecedentes', e.target.value)} disabled={disabled} rows={2} placeholder="Patologías previas, cirugías..." />
                    </div>
                    <div className="med-item">
                        <label>Medicamentos Actuales</label>
                        <textarea value={res.med_medicamentos || ''} onChange={(e) => updateField(examId, 'med_medicamentos', e.target.value)} disabled={disabled} rows={2} placeholder="Fármacos en uso..." />
                    </div>
                    <div className="med-item">
                        <label>Alergias</label>
                        <input type="text" value={res.med_alergias || ''} onChange={(e) => updateField(examId, 'med_alergias', e.target.value)} disabled={disabled} placeholder="Medicamentos, alimentos..." />
                    </div>
                    <div className="med-item">
                        <label>Antecedentes Familiares</label>
                        <textarea value={res.med_ant_familiares || ''} onChange={(e) => updateField(examId, 'med_ant_familiares', e.target.value)} disabled={disabled} rows={2} placeholder="HTA, DM, cáncer..." />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h4 className="section-title">🩺 Revisión por Sistemas</h4>
                <div className="med-sistemas-grid">
                    {SISTEMAS.map(({ field, label }) => (
                        <div key={field} className="med-sistema-row">
                            <span className="med-sistema-label">{label}</span>
                            <div className="romberg-options">
                                <button className={`romberg-btn ${res[field] === 'Normal' ? 'active-ok' : ''}`} onClick={() => updateField(examId, field, 'Normal')} disabled={disabled}>Normal</button>
                                <button className={`romberg-btn ${res[field] === 'Alterado' ? 'active-alert' : ''}`} onClick={() => updateField(examId, field, 'Alterado')} disabled={disabled}>Alterado</button>
                            </div>
                            {res[field] === 'Alterado' && (
                                <input
                                    type="text"
                                    value={res[`${field}_detalle`] || ''}
                                    onChange={(e) => updateField(examId, `${field}_detalle`, e.target.value)}
                                    disabled={disabled}
                                    placeholder="Describir hallazgo..."
                                    className="med-detalle-input"
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="form-section">
                <h4 className="section-title">📝 Examen Físico General</h4>
                <textarea
                    value={res.med_examen_fisico || ''}
                    onChange={(e) => updateField(examId, 'med_examen_fisico', e.target.value)}
                    disabled={disabled}
                    rows={4}
                    placeholder="Descripción del examen físico general, hallazgos relevantes..."
                />
            </div>

            <div className="form-section">
                <h4 className="section-title">📋 Diagnóstico / Conclusión</h4>
                <textarea
                    value={res.med_diagnostico || ''}
                    onChange={(e) => updateField(examId, 'med_diagnostico', e.target.value)}
                    disabled={disabled}
                    rows={2}
                    placeholder="CIE-10 o diagnóstico descriptivo..."
                />
                <div style={{ marginTop: '12px' }}>
                    <label style={{ fontWeight: 600, marginBottom: '6px', display: 'block' }}>Aptitud Laboral</label>
                    <select value={res.med_aptitud || ''} onChange={(e) => updateField(examId, 'med_aptitud', e.target.value)} disabled={disabled} style={{ width: '100%' }}>
                        <option value="">Seleccionar aptitud...</option>
                        {APTITUDES.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                {res.med_aptitud === 'Apto con restricciones' && (
                    <textarea
                        value={res.med_restricciones || ''}
                        onChange={(e) => updateField(examId, 'med_restricciones', e.target.value)}
                        disabled={disabled}
                        rows={2}
                        placeholder="Detallar restricciones laborales..."
                        style={{ marginTop: '8px' }}
                    />
                )}
            </div>
        </div>
    )
}
