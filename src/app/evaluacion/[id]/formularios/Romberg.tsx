'use client'
import { FormularioProps, isFieldDisabled } from './types'

/**
 * Romberg — Prueba de equilibrio y propiocepción.
 * Basado en el estándar clínico:
 * Fase 1: Ojos Abiertos
 * Fase 2: Ojos Cerrados
 * Resultado: Negativo (Normal) / Positivo (Alterado)
 */

export default function Romberg({ examId, resultados: res, updateField, isEditable, isFinalizado }: FormularioProps) {
    const disabled = isFieldDisabled(isEditable, isFinalizado)

    const updateValue = (field: string, value: string) => {
        if (disabled) return
        updateField(examId, field, value)
    }

    return (
        <div className="rb-container card glass">
            {/* Header */}
            <div className="rb-header">
                <div className="rb-icon-wrap">
                    <span className="rb-icon-main">⚖️</span>
                </div>
                <div className="rb-header-text">
                    <h3 className="rb-title">PRUEBA DE ROMBERG</h3>
                    <p className="rb-subtitle">Evaluación de equilibrio y propiocepción</p>
                </div>
            </div>

            <div className="rb-content">
                {/* Protocolo de Preparación */}
                <div className="rb-instruction-card">
                    <div className="rb-ins-header">
                        <span className="rb-ins-icon">📋</span>
                        <h4>PROTOCOLO DE PREPARACIÓN</h4>
                    </div>
                    <ul className="rb-ins-list">
                        <li>Paciente sin zapatos, de pie con los pies juntos.</li>
                        <li>Brazos a los lados o cruzados sobre el pecho.</li>
                        <li>Mantener la posición durante 30 segundos por fase.</li>
                    </ul>
                </div>

                {/* Fases de la Prueba */}
                <div className="rb-fases-grid">
                    {/* Fase 1 */}
                    <div className="rb-fase-card">
                        <div className="rb-fase-num">FASE 1</div>
                        <div className="rb-fase-title">OJOS ABIERTOS</div>
                        <p className="rb-fase-desc">El paciente permanece quieto 30 seg.</p>
                        <div className="rb-fase-actions">
                            <button
                                className={`rb-btn-fase ${res.r_fase1 === 'NORMAL' ? 'active-ok' : ''}`}
                                onClick={() => updateValue('r_fase1', 'NORMAL')}
                                disabled={disabled}
                            >
                                NORMAL
                            </button>
                            <button
                                className={`rb-btn-fase ${res.r_fase1 === 'ALTERADO' ? 'active-alt' : ''}`}
                                onClick={() => updateValue('r_fase1', 'ALTERADO')}
                                disabled={disabled}
                            >
                                ALTERADO
                            </button>
                        </div>
                    </div>

                    {/* Fase 2 */}
                    <div className="rb-fase-card">
                        <div className="rb-fase-num">FASE 2</div>
                        <div className="rb-fase-title">OJOS CERRADOS</div>
                        <p className="rb-fase-desc">El paciente cierra los ojos 30 seg.</p>
                        <div className="rb-fase-actions">
                            <button
                                className={`rb-btn-fase ${res.r_fase2 === 'NORMAL' ? 'active-ok' : ''}`}
                                onClick={() => updateValue('r_fase2', 'NORMAL')}
                                disabled={disabled}
                            >
                                NORMAL
                            </button>
                            <button
                                className={`rb-btn-fase ${res.r_fase2 === 'ALTERADO' ? 'active-alt' : ''}`}
                                onClick={() => updateValue('r_fase2', 'ALTERADO')}
                                disabled={disabled}
                            >
                                ALTERADO
                            </button>
                        </div>
                    </div>
                </div>

                {/* Resultado Final */}
                <div className="rb-result-section">
                    <h4 className="rb-section-label">INTERPRETACIÓN DE RESULTADOS</h4>
                    <div className="rb-result-toggles">
                        <button
                            className={`rb-res-btn neg ${res.r_resultado === 'NEGATIVO' ? 'active' : ''}`}
                            onClick={() => updateValue('r_resultado', 'NEGATIVO')}
                            disabled={disabled}
                        >
                            <span className="rb-res-icon">✅</span>
                            <div className="rb-res-texts">
                                <span className="rb-res-title">ROMBERG NEGATIVO</span>
                                <span className="rb-res-desc">Mantiene el equilibrio (Normal)</span>
                            </div>
                        </button>

                        <button
                            className={`rb-res-btn pos ${res.r_resultado === 'POSITIVO' ? 'active' : ''}`}
                            onClick={() => updateValue('r_resultado', 'POSITIVO')}
                            disabled={disabled}
                        >
                            <span className="rb-res-icon">⚠️</span>
                            <div className="rb-res-texts">
                                <span className="rb-res-title">ROMBERG POSITIVO</span>
                                <span className="rb-res-desc">Pierde el equilibrio al cerrar ojos</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Observaciones */}
                <div className="rb-obs-section">
                    <label>OBSERVACIONES CLÍNICAS</label>
                    <textarea
                        value={res.r_observaciones || ''}
                        onChange={(e) => updateValue('r_observaciones', e.target.value)}
                        disabled={disabled}
                        placeholder="Describa oscilaciones, pérdida de equilibrio o hallazgos relevantes..."
                        rows={3}
                    />
                </div>
            </div>

            <style jsx>{`
                .rb-container { padding: 2.5rem; }
                
                .rb-header { 
                    display: flex; 
                    align-items: center; 
                    gap: 1.5rem; 
                    margin-bottom: 2.5rem; 
                    padding-bottom: 2rem;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                .rb-icon-wrap {
                    width: 60px; height: 60px;
                    background: rgba(139, 92, 246, 0.2);
                    border-radius: 18px;
                    display: flex; align-items: center; justify-content: center;
                    border: 1px solid rgba(139, 92, 246, 0.3);
                }
                .rb-icon-main { font-size: 2rem; }
                .rb-title { font-size: 1.5rem; font-weight: 900; color: #fff; letter-spacing: -0.02em; margin: 0; }
                .rb-subtitle { font-size: 0.85rem; color: rgba(255,255,255,0.5); font-weight: 600; margin: 0.2rem 0 0; }

                .rb-instruction-card {
                    background: rgba(255,255,255,0.03);
                    padding: 1.5rem;
                    border-radius: 20px;
                    border: 1px solid rgba(255,255,255,0.05);
                    margin-bottom: 2rem;
                }
                .rb-ins-header { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1rem; }
                .rb-ins-header h4 { font-size: 0.75rem; font-weight: 900; color: #a78bfa; letter-spacing: 0.1em; margin: 0; }
                .rb-ins-list { margin: 0; padding-left: 1.2rem; display: flex; flex-direction: column; gap: 0.5rem; }
                .rb-ins-list li { font-size: 0.85rem; color: rgba(255,255,255,0.7); font-weight: 500; }

                .rb-fases-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2.5rem; }
                .rb-fase-card {
                    background: rgba(0,0,0,0.2);
                    padding: 1.5rem;
                    border-radius: 20px;
                    border: 1px solid rgba(255,255,255,0.05);
                    text-align: center;
                }
                .rb-fase-num { font-size: 0.65rem; font-weight: 900; opacity: 0.4; letter-spacing: 0.15em; margin-bottom: 0.5rem; }
                .rb-fase-title { font-size: 1rem; font-weight: 900; color: #fff; margin-bottom: 0.3rem; }
                .rb-fase-desc { font-size: 0.75rem; color: rgba(255,255,255,0.4); margin-bottom: 1.5rem; height: 1.5rem; }
                
                .rb-fase-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
                .rb-btn-fase {
                    padding: 0.8rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.4);
                    font-size: 0.75rem; font-weight: 900; cursor: pointer; transition: all 0.2s;
                }
                .rb-btn-fase.active-ok { background: #10b981; color: #fff; border-color: #10b981; box-shadow: 0 4px 15px rgba(16,185,129,0.3); }
                .rb-btn-fase.active-alt { background: #f59e0b; color: #fff; border-color: #f59e0b; box-shadow: 0 4px 15px rgba(245,158,11,0.3); }

                .rb-result-section { margin-bottom: 2.5rem; }
                .rb-section-label { font-size: 0.75rem; font-weight: 900; color: #a78bfa; letter-spacing: 0.1em; margin-bottom: 1.5rem; text-align: center; }
                .rb-result-toggles { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                
                .rb-res-btn {
                    display: flex; align-items: center; gap: 1.2rem; padding: 1.5rem;
                    background: rgba(0,0,0,0.3); border: 2px solid rgba(255,255,255,0.05);
                    border-radius: 24px; text-align: left; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .rb-res-btn:hover:not(:disabled) { transform: translateY(-3px); border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); }
                .rb-res-icon { font-size: 1.8rem; }
                .rb-res-texts { display: flex; flex-direction: column; gap: 0.2rem; }
                .rb-res-title { font-size: 0.9rem; font-weight: 900; color: rgba(255,255,255,0.6); }
                .rb-res-desc { font-size: 0.75rem; color: rgba(255,255,255,0.3); font-weight: 500; }
                
                .rb-res-btn.neg.active { background: rgba(16, 185, 129, 0.15); border-color: #10b981; }
                .rb-res-btn.neg.active .rb-res-title { color: #10b981; }
                .rb-res-btn.neg.active .rb-res-desc { color: rgba(16, 185, 129, 0.7); }
                
                .rb-res-btn.pos.active { background: rgba(239, 68, 68, 0.15); border-color: #ef4444; }
                .rb-res-btn.pos.active .rb-res-title { color: #ef4444; }
                .rb-res-btn.pos.active .rb-res-desc { color: rgba(239, 68, 68, 0.7); }

                .rb-obs-section { display: flex; flex-direction: column; gap: 0.8rem; }
                .rb-obs-section label { font-size: 0.7rem; font-weight: 900; opacity: 0.4; letter-spacing: 0.1em; padding-left: 0.5rem; }
                .rb-obs-section textarea {
                    background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 16px; padding: 1.2rem; color: #fff; font-size: 0.9rem;
                    resize: none; font-weight: 500; transition: all 0.2s;
                }
                .rb-obs-section textarea:focus { outline: none; border-color: #8b5cf6; background: rgba(255,255,255,0.02); }

                @media (max-width: 768px) {
                    .rb-fases-grid { grid-template-columns: 1fr; }
                    .rb-result-toggles { grid-template-columns: 1fr; }
                    .rb-header { flex-direction: column; text-align: center; }
                }
            `}</style>
        </div>
    )
}
