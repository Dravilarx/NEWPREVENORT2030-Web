import React from 'react'
import type { FormularioProps } from './types'

export default function EncuestaBuceo({ examId, resultados, updateField, isEditable, isFinalizado }: FormularioProps) {
    // Utility to toggle "Si/No" or "V/F"
    const setOption = (key: string, val: string) => {
        if (!isEditable || isFinalizado) return
        updateField(examId, key, val)
    }

    const antecedentesSI = [
        { key: 'hipertension', label: 'Hipertensión Arterial' },
        { key: 'resfrios', label: 'Resfríos con frecuencia' },
        { key: 'otitis', label: 'Otitis Aguda' },
        { key: 'dolor_articulaciones', label: 'Dolores a las articulaciones' },
        { key: 'alergias', label: 'Alergias' },
        { key: 'fuma', label: 'Fuma' },
        { key: 'bebe_alcohol', label: 'Bebe Alcohol' },
        { key: 'hospitalizado', label: '¿Ha estado Hospitalizado?' },
        { key: 'operado', label: '¿Ha sido operado?' },
        { key: 'fracturas', label: '¿Ha tenido fracturas?' },
        { key: 'epilepsia', label: 'Epilepsia' },
        { key: 'enf_buceo', label: 'Enfermedades por Buceo' },
        { key: 'tratamiento_recompresion', label: 'Tratamiento de recompresión' },
        { key: 'duerme_bien', label: 'Duerme bien' },
        { key: 'capacitacion_buceo', label: 'Tuvo capacitación de buceo' },
        { key: 'conoce_tablas', label: 'Conoce las Tablas de descompresión' },
        { key: 'sabe_usar_tablas', label: 'Sabe usarlas' },
    ]

    return (
        <div className="encuesta-buceo-form">
            <h3 className="section-title">ANTECEDENTES MÉDICOS</h3>
            <p className="form-subtitle">Ha presentado lo siguiente:</p>

            <div className="enfermedades-grid">
                {antecedentesSI.map(item => (
                    <div key={item.key} className="enf-row">
                        <label className="enf-label">{item.label}</label>
                        <div className="flex-si-no">
                            <button
                                className={resultados[item.key] === 'SI' ? 'active alert' : ''}
                                onClick={() => setOption(item.key, 'SI')}
                                disabled={!isEditable || isFinalizado}
                            >SÍ</button>
                            <button
                                className={resultados[item.key] === 'NO' ? 'active ok' : ''}
                                onClick={() => setOption(item.key, 'NO')}
                                disabled={!isEditable || isFinalizado}
                            >NO</button>
                        </div>
                    </div>
                ))}

                <div className="enf-row standalone-input">
                    <label className="enf-label">Donde aprendió a bucear</label>
                    <input
                        type="text"
                        value={resultados.donde_aprendio || ''}
                        onChange={e => updateField(examId, 'donde_aprendio', e.target.value)}
                        disabled={!isEditable || isFinalizado}
                        placeholder="Lugar de aprendizaje..."
                    />
                </div>

                <div className="enf-row" style={{ flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label className="enf-label">Toma remedios</label>
                        <div className="flex-si-no">
                            <button
                                className={resultados.toma_remedios === 'SI' ? 'active alert' : ''}
                                onClick={() => setOption('toma_remedios', 'SI')}
                                disabled={!isEditable || isFinalizado}
                            >SÍ</button>
                            <button
                                className={resultados.toma_remedios === 'NO' ? 'active ok' : ''}
                                onClick={() => setOption('toma_remedios', 'NO')}
                                disabled={!isEditable || isFinalizado}
                            >NO</button>
                        </div>
                    </div>
                    {resultados.toma_remedios === 'SI' && (
                        <div style={{ width: '100%', marginTop: '0.8rem' }}>
                            <input
                                type="text"
                                value={resultados.cuales_remedios || ''}
                                onChange={e => updateField(examId, 'cuales_remedios', e.target.value)}
                                disabled={!isEditable || isFinalizado}
                                placeholder="Indique cuáles remedios toma..."
                                style={{ width: '100%', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.8rem', color: '#fff', fontSize: '0.85rem' }}
                            />
                        </div>
                    )}
                </div>
            </div>

            <hr className="divider" />

            <div className="declaracion-legal-box">
                <p><strong>DECLARO QUE MIS RESPUESTAS SON VERDADERAS</strong>, ESTOY CONSCIENTE QUE EL OCULTAR O FALSEAR INFORMACIÓN PUEDE CAUSAR DAÑO Y ASUMO LA RESPONSABILIDAD DE ELLO.</p>
                <div className="firma-box">
                    <label className="checkbox-declaration">
                        <input type="checkbox" checked={resultados.declara_verdad === 'true'} onChange={e => updateField(examId, 'declara_verdad', e.target.checked ? 'true' : 'false')} disabled={!isEditable || isFinalizado} />
                        FIRMA TRABAJADOR (Acepto los términos y confiero mi firma digital)
                    </label>
                </div>
            </div>

            <hr className="divider" />

            <h3 className="section-title">Autoevaluación técnica elemental</h3>

            <div className="eval-question">
                <label>1.- El aire tiene varios gases, mencione los 2 más importantes</label>
                <input
                    type="text"
                    value={resultados.auto_preg_1 || ''}
                    onChange={e => updateField(examId, 'auto_preg_1', e.target.value)}
                    disabled={!isEditable || isFinalizado}
                />
            </div>

            <div className="eval-question">
                <div className="asev-header">
                    <label>2.- La presión del agua sobre el buzo cada 10mts de profundidad equivale a 1 atmosfera</label>
                    <div className="flex-si-no vf">
                        <button className={resultados.auto_preg_2 === 'V' ? 'active' : ''} onClick={() => setOption('auto_preg_2', 'V')} disabled={!isEditable || isFinalizado}>V</button>
                        <button className={resultados.auto_preg_2 === 'F' ? 'active alert' : ''} onClick={() => setOption('auto_preg_2', 'F')} disabled={!isEditable || isFinalizado}>F</button>
                    </div>
                </div>
            </div>

            <div className="eval-question">
                <div className="asev-header">
                    <label>3.- El motor del compresor puede contaminar el aire que respira el buzo con monoxido de carbono que es tóxico</label>
                    <div className="flex-si-no vf">
                        <button className={resultados.auto_preg_3 === 'V' ? 'active' : ''} onClick={() => setOption('auto_preg_3', 'V')} disabled={!isEditable || isFinalizado}>V</button>
                        <button className={resultados.auto_preg_3 === 'F' ? 'active alert' : ''} onClick={() => setOption('auto_preg_3', 'F')} disabled={!isEditable || isFinalizado}>F</button>
                    </div>
                </div>
            </div>

            <div className="eval-question">
                <div className="asev-header">
                    <label>5.- El ascenso lento protege al buzo de las embolías gaseosas</label>
                    <div className="flex-si-no vf">
                        <button className={resultados.auto_preg_5 === 'V' ? 'active' : ''} onClick={() => setOption('auto_preg_5', 'V')} disabled={!isEditable || isFinalizado}>V</button>
                        <button className={resultados.auto_preg_5 === 'F' ? 'active alert' : ''} onClick={() => setOption('auto_preg_5', 'F')} disabled={!isEditable || isFinalizado}>F</button>
                    </div>
                </div>
            </div>

            <div className="eval-question">
                <label>4.- Que gas se acumula en el cuerpo del buzo y puede causar la enfermedad de la presión</label>
                <input
                    type="text"
                    value={resultados.auto_preg_4 || ''}
                    onChange={e => updateField(examId, 'auto_preg_4', e.target.value)}
                    disabled={!isEditable || isFinalizado}
                />
            </div>

            <style jsx>{`
                .encuesta-buceo-form { background: #050505; padding: 1.5rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); color: #fff; }
                .section-title { font-size: 1rem; font-weight: 900; color: var(--brand-primary, #ff6b2c); margin: 0 0 0.2rem 0; letter-spacing: -0.02em; text-transform: uppercase; }
                .form-subtitle { font-size: 0.75rem; opacity: 0.6; font-weight: 700; margin-bottom: 1.2rem; }
                .divider { border: 0; height: 1px; background: rgba(255,255,255,0.1); margin: 2rem 0; }
                
                .enfermedades-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
                .enf-row { display: flex; justify-content: space-between; align-items: center; padding: 0.8rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
                .enf-label { font-size: 0.85rem; font-weight: 700; flex: 1; padding-right: 1rem; }
                
                .standalone-input { flex-direction: column; align-items: flex-start; gap: 0.6rem; }
                .standalone-input input { width: 100%; background: #111; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.8rem; color: #fff; font-size: 0.85rem; }

                .eval-question { background: rgba(255,255,255,0.02); padding: 1.2rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 1rem; }
                .eval-question > label { display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 0.8rem; line-height: 1.4; color: #fff; }
                .eval-question input { width: 100%; background: #111; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.8rem; color: #fff; font-size: 0.9rem; }
                
                .asev-header { display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; }
                .asev-header label { font-size: 0.85rem; font-weight: 700; flex: 1; line-height: 1.4; margin: 0; }

                .flex-si-no { display: flex; gap: 4px; min-width: 100px; flex-shrink: 0; }
                .flex-si-no button { flex: 1; padding: 0.5rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: #111; color: #fff; font-weight: 800; cursor: pointer; transition: 0.2s; font-size: 0.8rem; }
                .flex-si-no button.active { background: var(--brand-primary, #ff6b2c); border-color: var(--brand-primary, #ff6b2c); color: #000; }
                .flex-si-no button.active.ok { background: #10b981; border-color: #10b981; color: #000; }
                .flex-si-no button.active.alert { background: #ef4444; border-color: #ef4444; color: #fff; }

                .flex-si-no.vf button.active { background: #3b82f6; border-color: #3b82f6; color: #fff; }
                .flex-si-no.vf button.active.alert { background: #ef4444; border-color: #ef4444; color: #fff; }

                .declaracion-legal-box { background: rgba(255,107,44,0.05); border: 1px solid rgba(255,107,44,0.2); border-radius: 12px; padding: 1.5rem; text-align: center; }
                .declaracion-legal-box p { font-size: 0.85rem; opacity: 0.8; line-height: 1.5; margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 0.02em; }
                
                .firma-box { display: inline-block; background: #000; padding: 1rem 1.5rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
                .checkbox-declaration { display: flex; align-items: center; gap: 0.8rem; font-size: 0.9rem; font-weight: 800; cursor: pointer; color: var(--brand-primary, #ff6b2c); }
                .checkbox-declaration input { width: 24px; height: 24px; accent-color: var(--brand-primary, #ff6b2c); }

                @media (max-width: 768px) {
                    .enfermedades-grid { grid-template-columns: 1fr; }
                    .asev-header { flex-direction: column; align-items: flex-start; }
                    .flex-si-no { width: 100%; margin-top: 0.8rem; }
                }
            `}</style>
        </div>
    )
}
