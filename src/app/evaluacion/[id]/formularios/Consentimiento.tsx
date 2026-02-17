'use client'
import { FormularioProps, isFieldDisabled } from './types'

/**
 * Consentimiento — Consentimiento Informado digital.
 * Captura la aceptación del paciente para los procedimientos.
 */

export default function Consentimiento({ examId, resultados: res, updateField, isEditable, isFinalizado }: FormularioProps) {
    const disabled = isFieldDisabled(isEditable, isFinalizado)

    return (
        <div className="consentimiento-form card glass">
            <div className="form-section">
                <h4 className="section-title">📋 Consentimiento Informado</h4>
                <div className="consent-text">
                    <p>Yo, el/la paciente, declaro que:</p>
                    <ul>
                        <li>He sido informado/a sobre los procedimientos médicos y exámenes que se me realizarán.</li>
                        <li>Se me ha explicado el propósito, los beneficios y los posibles riesgos.</li>
                        <li>He tenido la oportunidad de hacer preguntas y estas han sido respondidas satisfactoriamente.</li>
                        <li>Entiendo que los resultados serán utilizados con fines de evaluación ocupacional.</li>
                        <li>Autorizo la toma de muestras biológicas necesarias para los exámenes solicitados.</li>
                    </ul>
                </div>
            </div>

            <div className="form-section">
                <div className="consent-checks">
                    <label className="consent-check-item">
                        <input
                            type="checkbox"
                            checked={res.consent_info === 'SI'}
                            onChange={(e) => updateField(examId, 'consent_info', e.target.checked ? 'SI' : 'NO')}
                            disabled={disabled}
                        />
                        <span>He leído y comprendido la información anterior</span>
                    </label>
                    <label className="consent-check-item">
                        <input
                            type="checkbox"
                            checked={res.consent_voluntario === 'SI'}
                            onChange={(e) => updateField(examId, 'consent_voluntario', e.target.checked ? 'SI' : 'NO')}
                            disabled={disabled}
                        />
                        <span>Acepto voluntariamente someterme a los exámenes</span>
                    </label>
                    <label className="consent-check-item">
                        <input
                            type="checkbox"
                            checked={res.consent_datos === 'SI'}
                            onChange={(e) => updateField(examId, 'consent_datos', e.target.checked ? 'SI' : 'NO')}
                            disabled={disabled}
                        />
                        <span>Autorizo el tratamiento de mis datos personales de salud</span>
                    </label>
                </div>
            </div>

            <div className="form-section">
                <h4 className="section-title">📝 Observaciones del Paciente</h4>
                <textarea
                    value={res.consent_obs || ''}
                    onChange={(e) => updateField(examId, 'consent_obs', e.target.value)}
                    disabled={disabled}
                    rows={2}
                    placeholder="Si tiene alguna observación o restricción..."
                />
            </div>

            <div className="form-section">
                <h4 className="section-title">✍️ Firma Digital</h4>
                <div className="consent-firma-grid">
                    <div className="consent-firma-item">
                        <label>Nombre Completo del Paciente</label>
                        <input
                            type="text"
                            value={res.consent_nombre || ''}
                            onChange={(e) => updateField(examId, 'consent_nombre', e.target.value)}
                            disabled={disabled}
                            placeholder="Nombre y apellido..."
                        />
                    </div>
                    <div className="consent-firma-item">
                        <label>RUT</label>
                        <input
                            type="text"
                            value={res.consent_rut || ''}
                            onChange={(e) => updateField(examId, 'consent_rut', e.target.value)}
                            disabled={disabled}
                            placeholder="12.345.678-9"
                        />
                    </div>
                    <div className="consent-firma-item">
                        <label>Fecha</label>
                        <input
                            type="date"
                            value={res.consent_fecha || new Date().toISOString().split('T')[0]}
                            onChange={(e) => updateField(examId, 'consent_fecha', e.target.value)}
                            disabled={disabled}
                        />
                    </div>
                </div>
            </div>

            <div className={`romberg-result ${res.consent_info === 'SI' && res.consent_voluntario === 'SI' && res.consent_datos === 'SI' ? 'ok' : 'warn'}`}>
                {res.consent_info === 'SI' && res.consent_voluntario === 'SI' && res.consent_datos === 'SI'
                    ? '✅ Consentimiento completo'
                    : '⏳ Pendiente de aceptación'}
            </div>
        </div>
    )
}
