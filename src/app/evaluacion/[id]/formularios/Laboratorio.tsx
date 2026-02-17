'use client'
import { FormularioProps, isFieldDisabled } from './types'

/**
 * Laboratorio — Resultados de exámenes de laboratorio.
 * Hemograma, glicemia, perfil lipídico, hepático, orina, drogas.
 */

const GRUPOS = [
    {
        titulo: '🩸 Hemograma',
        campos: [
            { field: 'lab_hemoglobina', label: 'Hemoglobina (g/dL)', ref: '12-17' },
            { field: 'lab_hematocrito', label: 'Hematocrito (%)', ref: '36-52' },
            { field: 'lab_leucocitos', label: 'Leucocitos (/µL)', ref: '4.500-11.000' },
            { field: 'lab_plaquetas', label: 'Plaquetas (/µL)', ref: '150.000-400.000' },
            { field: 'lab_vhs', label: 'VHS (mm/h)', ref: '<20' },
        ]
    },
    {
        titulo: '🧪 Bioquímica',
        campos: [
            { field: 'lab_glicemia', label: 'Glicemia (mg/dL)', ref: '70-100' },
            { field: 'lab_creatinina', label: 'Creatinina (mg/dL)', ref: '0.6-1.2' },
            { field: 'lab_bun', label: 'BUN (mg/dL)', ref: '7-20' },
            { field: 'lab_acido_urico', label: 'Ácido Úrico (mg/dL)', ref: '3.5-7.2' },
        ]
    },
    {
        titulo: '❤️ Perfil Lipídico',
        campos: [
            { field: 'lab_colesterol', label: 'Colesterol Total (mg/dL)', ref: '<200' },
            { field: 'lab_hdl', label: 'HDL (mg/dL)', ref: '>40' },
            { field: 'lab_ldl', label: 'LDL (mg/dL)', ref: '<130' },
            { field: 'lab_trigliceridos', label: 'Triglicéridos (mg/dL)', ref: '<150' },
        ]
    },
    {
        titulo: '🟡 Perfil Hepático',
        campos: [
            { field: 'lab_got', label: 'GOT/AST (U/L)', ref: '<40' },
            { field: 'lab_gpt', label: 'GPT/ALT (U/L)', ref: '<41' },
            { field: 'lab_ggt', label: 'GGT (U/L)', ref: '<60' },
            { field: 'lab_bilirrubina', label: 'Bilirrubina Total (mg/dL)', ref: '0.1-1.2' },
        ]
    },
    {
        titulo: '💧 Orina Completa',
        campos: [
            { field: 'lab_orina_ph', label: 'pH', ref: '5.0-8.0' },
            { field: 'lab_orina_proteinas', label: 'Proteínas', ref: 'Negativo' },
            { field: 'lab_orina_glucosa', label: 'Glucosa', ref: 'Negativo' },
            { field: 'lab_orina_sangre', label: 'Sangre', ref: 'Negativo' },
        ]
    },
]

export default function Laboratorio({ examId, resultados: res, updateField, isEditable, isFinalizado }: FormularioProps) {
    const disabled = isFieldDisabled(isEditable, isFinalizado)

    return (
        <div className="laboratorio-form card glass">
            {GRUPOS.map((grupo, gIdx) => (
                <div key={gIdx} className="form-section">
                    <h4 className="section-title">{grupo.titulo}</h4>
                    <div className="lab-grid">
                        {grupo.campos.map(({ field, label, ref }) => (
                            <div key={field} className="lab-item">
                                <label>{label}</label>
                                <input
                                    type="text"
                                    value={res[field] || ''}
                                    onChange={(e) => updateField(examId, field, e.target.value)}
                                    disabled={disabled}
                                    placeholder={`Ref: ${ref}`}
                                />
                                <span className="lab-ref">Ref: {ref}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div className="form-section">
                <h4 className="section-title">🧬 Test de Drogas</h4>
                <div className="lab-drogas-grid">
                    {['Marihuana', 'Cocaína', 'Anfetaminas', 'Benzodiacepinas', 'Opiáceos'].map(droga => {
                        const field = `lab_droga_${droga.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`
                        return (
                            <div key={droga} className="lab-droga-row">
                                <span>{droga}</span>
                                <div className="romberg-options">
                                    <button className={`romberg-btn ${res[field] === 'Negativo' ? 'active-ok' : ''}`} onClick={() => updateField(examId, field, 'Negativo')} disabled={disabled}>(-)</button>
                                    <button className={`romberg-btn ${res[field] === 'Positivo' ? 'active-alert' : ''}`} onClick={() => updateField(examId, field, 'Positivo')} disabled={disabled}>(+)</button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="form-section">
                <h4 className="section-title">📝 Observaciones</h4>
                <textarea
                    value={res.lab_obs || ''}
                    onChange={(e) => updateField(examId, 'lab_obs', e.target.value)}
                    disabled={disabled}
                    rows={2}
                    placeholder="Observaciones del laboratorio..."
                />
            </div>
        </div>
    )
}
