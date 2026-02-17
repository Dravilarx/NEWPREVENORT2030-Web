'use client'
import { FormularioProps, isFieldDisabled } from './types'

/**
 * Psicotecnico — Evaluación Psicotécnica para trabajo en altura / maquinaria.
 * Evalúa: atención, coordinación, tiempo reacción, visión periférica.
 */

const PRUEBAS = [
    { field: 'psico_atencion', label: 'Atención Concentrada', desc: 'Capacidad de mantener el foco' },
    { field: 'psico_coordinacion', label: 'Coordinación Viso-Motora', desc: 'Ojo-mano y destreza manual' },
    { field: 'psico_reaccion', label: 'Tiempo de Reacción', desc: 'Velocidad de respuesta a estímulos' },
    { field: 'psico_percepcion', label: 'Percepción Espacial', desc: 'Orientación y distancia' },
    { field: 'psico_resistencia', label: 'Resistencia a la Monotonía', desc: 'Mantención de rendimiento' },
    { field: 'psico_vision_periferica', label: 'Visión Periférica', desc: 'Campo visual funcional' },
]

const NIVELES = [
    { value: 'Apto', label: 'Apto', color: '#10b981' },
    { value: 'Apto con restricción', label: 'Con Restricción', color: '#f59e0b' },
    { value: 'No apto', label: 'No Apto', color: '#ef4444' },
]

export default function Psicotecnico({ examId, resultados: res, updateField, isEditable, isFinalizado }: FormularioProps) {
    const disabled = isFieldDisabled(isEditable, isFinalizado)

    const respondidos = PRUEBAS.filter(p => res[p.field]).length
    const noAptos = PRUEBAS.filter(p => res[p.field] === 'No apto').length
    const restricciones = PRUEBAS.filter(p => res[p.field] === 'Apto con restricción').length

    return (
        <div className="psicotecnico-form card glass">
            <div className="form-subtitle">Evaluación de aptitudes psicomotoras para el cargo</div>

            <div className="psico-grid">
                {PRUEBAS.map(({ field, label, desc }) => (
                    <div key={field} className="psico-row">
                        <div className="psico-info">
                            <span className="psico-label">{label}</span>
                            <span className="psico-desc">{desc}</span>
                        </div>
                        <div className="psico-options">
                            {NIVELES.map(n => (
                                <button
                                    key={n.value}
                                    className={`psico-btn ${res[field] === n.value ? 'active' : ''}`}
                                    style={res[field] === n.value ? { backgroundColor: n.color, borderColor: n.color } : {}}
                                    onClick={() => updateField(examId, field, n.value)}
                                    disabled={disabled}
                                >
                                    {n.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="form-section">
                <h4 className="section-title">📝 Observaciones</h4>
                <textarea
                    value={res.psico_obs || ''}
                    onChange={(e) => updateField(examId, 'psico_obs', e.target.value)}
                    disabled={disabled}
                    placeholder="Observaciones del evaluador..."
                    rows={3}
                />
            </div>

            <div className="form-section">
                <h4 className="section-title">📋 Conclusión General</h4>
                <div className="psico-options" style={{ justifyContent: 'center' }}>
                    {NIVELES.map(n => (
                        <button
                            key={n.value}
                            className={`psico-btn ${res.psico_conclusion === n.value ? 'active' : ''}`}
                            style={res.psico_conclusion === n.value ? { backgroundColor: n.color, borderColor: n.color } : {}}
                            onClick={() => updateField(examId, 'psico_conclusion', n.value)}
                            disabled={disabled}
                        >
                            {n.label}
                        </button>
                    ))}
                </div>
            </div>

            {respondidos > 0 && (
                <div className={`romberg-result ${noAptos > 0 ? 'alert' : restricciones > 0 ? 'warn' : 'ok'}`}>
                    {noAptos > 0 ? `❌ ${noAptos} prueba(s) No Apto` :
                        restricciones > 0 ? `⚠️ ${restricciones} prueba(s) con restricción` :
                            '✅ Todas las pruebas aptas'}
                </div>
            )}
        </div>
    )
}
