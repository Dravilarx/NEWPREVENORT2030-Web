'use client'
import { FormularioProps, isFieldDisabled } from './types'

/**
 * Psicologico — Evaluación Psicológica Ocupacional.
 * Cuestionario estructurado de salud mental y factores psicosociales.
 */

const AREAS = [
    {
        titulo: '🧠 Estado Emocional',
        preguntas: [
            { field: 'psi_animo', label: '¿Cómo describe su estado de ánimo habitual?' },
            { field: 'psi_ansiedad', label: '¿Experimenta ansiedad o nerviosismo frecuente?' },
            { field: 'psi_sueno', label: '¿Tiene dificultades para dormir?' },
            { field: 'psi_irritabilidad', label: '¿Se irrita con facilidad?' },
        ]
    },
    {
        titulo: '👥 Relaciones y Adaptación',
        preguntas: [
            { field: 'psi_relaciones', label: '¿Cómo son sus relaciones interpersonales en el trabajo?' },
            { field: 'psi_adaptacion', label: '¿Se adapta fácil a cambios de rutina?' },
            { field: 'psi_conflictos', label: '¿Cómo maneja los conflictos laborales?' },
        ]
    },
    {
        titulo: '⚡ Factores de Riesgo',
        preguntas: [
            { field: 'psi_alcohol', label: '¿Consume alcohol? ¿Con qué frecuencia?' },
            { field: 'psi_drogas', label: '¿Consume sustancias psicoactivas?' },
            { field: 'psi_estres', label: '¿Presenta síntomas de estrés laboral?' },
            { field: 'psi_antecedentes', label: '¿Tiene antecedentes de trastornos psiquiátricos?' },
        ]
    }
]

const CONCLUSIONES = [
    'Apto sin restricciones',
    'Apto con observaciones',
    'Apto con seguimiento',
    'No apto temporalmente',
    'No apto',
    'Requiere derivación a especialista',
]

export default function Psicologico({ examId, resultados: res, updateField, isEditable, isFinalizado }: FormularioProps) {
    const disabled = isFieldDisabled(isEditable, isFinalizado)

    return (
        <div className="psicologico-form card glass">
            {AREAS.map((area, aIdx) => (
                <div key={aIdx} className="form-section">
                    <h4 className="section-title">{area.titulo}</h4>
                    <div className="psi-grid">
                        {area.preguntas.map(({ field, label }) => (
                            <div key={field} className="psi-item">
                                <label>{label}</label>
                                <textarea
                                    value={res[field] || ''}
                                    onChange={(e) => updateField(examId, field, e.target.value)}
                                    disabled={disabled}
                                    rows={2}
                                    placeholder="Respuesta del evaluado..."
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div className="form-section">
                <h4 className="section-title">📝 Observaciones del Profesional</h4>
                <textarea
                    value={res.psi_obs || ''}
                    onChange={(e) => updateField(examId, 'psi_obs', e.target.value)}
                    disabled={disabled}
                    rows={3}
                    placeholder="Análisis clínico, impresión diagnóstica..."
                />
            </div>

            <div className="form-section">
                <h4 className="section-title">📋 Conclusión</h4>
                <select
                    value={res.psi_conclusion || ''}
                    onChange={(e) => updateField(examId, 'psi_conclusion', e.target.value)}
                    disabled={disabled}
                    style={{ width: '100%' }}
                >
                    <option value="">Seleccionar conclusión...</option>
                    {CONCLUSIONES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
        </div>
    )
}
