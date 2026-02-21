'use client'
import { FormularioProps, isFieldDisabled } from './types'

/**
 * TestVisual — Formulario "TEST VISUAL MÉDICO" (CLI-0009)
 * Incluye: Uso de lentes, Agudeza Visual, Visión de Profundidad (Flechas/Animales) 
 * y Discriminación de colores.
 */

export default function TestVisual({ examId, resultados: res, updateField, isEditable, isFinalizado }: FormularioProps) {
    const disabled = isFieldDisabled(isEditable, isFinalizado)

    const toggleField = (field: string) => {
        if (disabled) return
        const current = res[field]
        updateField(examId, field, current === 'SI' ? '' : 'SI')
    }

    const FLECHAS = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    const ANIMALES_ROWS = ['A', 'B', 'C']
    const ANIMALES_COLS = [1, 2, 3, 4, 5]
    const COLORES_ROWS = [1, 2, 3, 4, 5]

    return (
        <div className="vt-content card glass">
            {/* Cabecera */}
            <div className="vt-header">
                <h3 className="vt-title">TEST VISUAL MÉDICO</h3>
                <div className="vt-header-divider" />
            </div>

            {/* I. Datos Personales y Lentes */}
            <div className="vt-section">

                <div className="vt-lentes-container">
                    <span className="vt-lentes-label">USO DE LENTES:</span>
                    <div className="vt-lentes-grid">
                        {[
                            { id: 'v_lentes_no', label: 'NO USA' },
                            { id: 'v_lentes_lejos', label: 'VISIÓN LEJOS' },
                            { id: 'v_lentes_cerca', label: 'VISIÓN CERCA' },
                            { id: 'v_lentes_bifocales', label: 'BIFOCALES' },
                            { id: 'v_lentes_monocular_od', label: 'MONOCULAR OD' },
                            { id: 'v_lentes_monocular_oi', label: 'MONOCULAR OI' },
                            { id: 'v_lentes_contacto', label: 'CONTACTO' },
                        ].map(opt => (
                            <button
                                key={opt.id}
                                className={`vt-check-btn ${res[opt.id] === 'SI' ? 'active' : ''}`}
                                onClick={() => updateField(examId, opt.id, res[opt.id] === 'SI' ? '' : 'SI')}
                                disabled={disabled}
                            >
                                <span className="vt-checkbox">{res[opt.id] === 'SI' ? '✓' : ''}</span>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="vt-field-inline mt-4">
                    <label>OBSERVACIONES LENTES:</label>
                    <input
                        type="text"
                        value={res.v_lentes_obs || ''}
                        onChange={e => updateField(examId, 'v_lentes_obs', e.target.value)}
                        disabled={disabled}
                        placeholder="Ej: Permanentes, solo lectura..."
                    />
                </div>
            </div>

            {/* II. Agudeza Visual */}
            <div className="vt-section">
                <div className="vt-section-header">
                    <span className="vt-section-icon">📈</span>
                    <h4 className="vt-section-title">II. AGUDEZA VISUAL</h4>
                </div>

                <div className="vt-table-modern">
                    <div className="vt-tm-head">
                        <div>TEST</div>
                        <div className="text-center">OD</div>
                        <div className="text-center">OI</div>
                        <div className="text-center">AMBOS</div>
                        <div className="text-center">FORIA</div>
                    </div>

                    <div className="vt-tm-row">
                        <div className="vt-tm-label">VISIÓN LEJOS</div>
                        <input type="text" value={res.v_lejos_od || ''} onChange={e => updateField(examId, 'v_lejos_od', e.target.value)} disabled={disabled} />
                        <input type="text" value={res.v_lejos_oi || ''} onChange={e => updateField(examId, 'v_lejos_oi', e.target.value)} disabled={disabled} />
                        <input type="text" value={res.v_lejos_ambos || ''} onChange={e => updateField(examId, 'v_lejos_ambos', e.target.value)} disabled={disabled} />
                        <input type="text" value={res.v_lejos_foria || ''} onChange={e => updateField(examId, 'v_lejos_foria', e.target.value)} disabled={disabled} />
                    </div>

                    <div className="vt-tm-row">
                        <div className="vt-tm-label">VISIÓN CERCA</div>
                        <input type="text" value={res.v_cerca_od || ''} onChange={e => updateField(examId, 'v_cerca_od', e.target.value)} disabled={disabled} />
                        <input type="text" value={res.v_cerca_oi || ''} onChange={e => updateField(examId, 'v_cerca_oi', e.target.value)} disabled={disabled} />
                        <input type="text" value={res.v_cerca_ambos || ''} onChange={e => updateField(examId, 'v_cerca_ambos', e.target.value)} disabled={disabled} />
                        <input type="text" value={res.v_cerca_foria || ''} onChange={e => updateField(examId, 'v_cerca_foria', e.target.value)} disabled={disabled} />
                    </div>
                </div>
            </div>

            {/* III. Visión de Profundidad */}
            <div className="vt-section">
                <div className="vt-section-header">
                    <span className="vt-section-icon">🦋</span>
                    <h4 className="vt-section-title">III. VISIÓN DE PROFUNDIDAD</h4>
                </div>

                <div className="vt-mariposa-row">
                    <span className="vt-mariposa-label">MARIPOSA:</span>
                    <div className="vt-toggle-box">
                        <button className={`vt-t-btn ${res.v_prof_mariposa === 'SI' ? 'active-si' : ''}`} onClick={() => updateField(examId, 'v_prof_mariposa', 'SI')} disabled={disabled}>SI</button>
                        <button className={`vt-t-btn ${res.v_prof_mariposa === 'NO' ? 'active-no' : ''}`} onClick={() => updateField(examId, 'v_prof_mariposa', 'NO')} disabled={disabled}>NO</button>
                    </div>
                </div>

                <div className="vt-depth-grid mt-6">
                    <div className="vt-box-wrap">
                        <label className="vt-box-title">FLECHAS</label>
                        <div className="vt-arrows-table-v2">
                            {FLECHAS.map(num => (
                                <button
                                    key={num}
                                    className={`vt-arrow-btn-v2 ${res[`v_prof_flecha_${num}`] === 'SI' ? 'active' : ''}`}
                                    onClick={() => toggleField(`v_prof_flecha_${num}`)}
                                    disabled={disabled}
                                >
                                    <span className="vt-arrow-num-v2">{num}</span>
                                    <span className="vt-arrow-check-v2">{res[`v_prof_flecha_${num}`] === 'SI' ? '✓' : ''}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="vt-box-wrap">
                        <label className="vt-box-title">ANIMALES</label>
                        <div className="vt-animals-table-v2">
                            <div className="vt-at-header-v2">
                                <div />
                                {ANIMALES_COLS.map(c => <div key={c}>{c}</div>)}
                            </div>
                            {ANIMALES_ROWS.map(row => (
                                <div key={row} className="vt-at-row-v2">
                                    <div className="vt-at-row-label-v2">{row}</div>
                                    {ANIMALES_COLS.map(col => (
                                        <button
                                            key={col}
                                            className={`vt-animal-btn-v2 ${res[`v_prof_animal_${row}_${col}`] === 'SI' ? 'active' : ''}`}
                                            onClick={() => toggleField(`v_prof_animal_${row}_${col}`)}
                                            disabled={disabled}
                                        >
                                            {res[`v_prof_animal_${row}_${col}`] === 'SI' ? '✓' : ''}
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* IV. Discriminación de colores y números */}
            <div className="vt-section">
                <div className="vt-section-header">
                    <span className="vt-section-icon">🎨</span>
                    <h4 className="vt-section-title">IV. DISCRIMINACIÓN DE COLORES Y NÚMEROS</h4>
                </div>

                <div className="vt-colores-table">
                    <div className="vt-ct-head">
                        <div>NÚMERO / LÁMINA</div>
                        <div className="text-center">SI</div>
                        <div className="text-center">NO</div>
                    </div>
                    {COLORES_ROWS.map(num => (
                        <div key={num} className="vt-ct-row">
                            <div className="vt-ct-label">LÁMINA {num}</div>
                            <div className="vt-ct-action">
                                <button
                                    className={`vt-ct-check si ${res[`v_color_${num}`] === 'SI' ? 'active' : ''}`}
                                    onClick={() => updateField(examId, `v_color_${num}`, 'SI')}
                                    disabled={disabled}
                                >✓</button>
                            </div>
                            <div className="vt-ct-action">
                                <button
                                    className={`vt-ct-check no ${res[`v_color_${num}`] === 'NO' ? 'active' : ''}`}
                                    onClick={() => updateField(examId, `v_color_${num}`, 'NO')}
                                    disabled={disabled}
                                >✕</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {isFinalizado && (
                <div className="vt-finalizado">
                    <span>EXAMEN VALIDADO ✅</span>
                </div>
            )}

            <style jsx>{`
                .vt-content { padding: 2.5rem; }
                
                .vt-header { text-align: center; margin-bottom: 3rem; }
                .vt-logo-wrap { display: flex; align-items: center; justify-content: center; gap: 0.8rem; margin-bottom: 1rem; }
                .vt-logo-icon { font-size: 2.5rem; filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.4)); }
                .vt-logo-main { display: block; font-size: 1.4rem; font-weight: 900; letter-spacing: 0.1em; color: #fff; }
                .vt-logo-sub { display: block; font-size: 0.7rem; font-weight: 700; opacity: 0.5; text-transform: uppercase; }
                .vt-title { font-size: 1.6rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; margin-bottom: 0.5rem; }
                .vt-header-divider { height: 3px; width: 80px; background: #8b5cf6; margin: 1.5rem auto 0; border-radius: 2px; opacity: 0.6; }

                .vt-section { margin-bottom: 3.5rem; }
                .vt-section-header { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1.5rem; }
                .vt-section-icon { font-size: 1.2rem; opacity: 0.7; }
                .vt-section-title { font-size: 0.8rem; font-weight: 900; opacity: 0.6; letter-spacing: 0.12em; text-transform: uppercase; color: #a78bfa; }

                /* Personal Data Grid */
                .vt-section-title { font-size: 0.8rem; font-weight: 900; opacity: 0.6; letter-spacing: 0.12em; text-transform: uppercase; color: #a78bfa; }

                /* Lentes */
                .vt-lentes-container { background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
                .vt-lentes-label { display: block; font-size: 0.75rem; font-weight: 900; opacity: 0.4; margin-bottom: 1rem; letter-spacing: 0.1em; }
                .vt-lentes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.6rem; }
                
                .vt-check-btn {
                    display: flex; align-items: center; gap: 0.8rem; padding: 0.7rem 1rem; background: rgba(0,0,0,0.2);
                    border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; color: rgba(255,255,255,0.5);
                    font-size: 0.75rem; font-weight: 800; cursor: pointer; transition: all 0.2s;
                }
                .vt-check-btn:hover:not(:disabled) { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.2); }
                .vt-check-btn.active { background: rgba(139, 92, 246, 0.15); border-color: #8b5cf6; color: #fff; }
                .vt-checkbox { width: 1.2rem; height: 1.2rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #8b5cf6; }
                .vt-check-btn.active .vt-checkbox { background: #8b5cf6; color: #fff; border-color: #8b5cf6; }

                .vt-field-inline { display: flex; align-items: center; gap: 1rem; background: rgba(255,255,255,0.02); padding: 1rem 1.5rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
                .vt-field-inline label { font-size: 0.7rem; font-weight: 900; opacity: 0.4; white-space: nowrap; }
                .vt-field-inline input { background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,0.1); color: #fff; width: 100%; padding: 0.4rem 0; font-size: 0.9rem; font-weight: 600; }
                .vt-field-inline input:focus { outline: none; border-color: #8b5cf6; }

                /* Tables */
                .vt-table-modern { border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; background: rgba(255,255,255,0.01); }
                .vt-tm-head { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; background: rgba(139, 92, 246, 0.1); padding: 1rem 1.5rem; font-size: 0.75rem; font-weight: 900; color: #a78bfa; letter-spacing: 0.1em; }
                .vt-tm-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; border-bottom: 1px solid rgba(255,255,255,0.05); padding: 0.5rem 1rem; align-items: center; gap: 0.5rem; }
                .vt-tm-label { padding-left: 0.5rem; font-size: 0.85rem; font-weight: 800; color: #fff; }
                .vt-tm-row input { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 0.6rem; color: #fff; text-align: center; font-weight: 700; width: 100%; }
                .vt-tm-row input:focus { border-color: #8b5cf6; outline: none; background: rgba(0,0,0,0.4); }

                /* Depth Section */
                .vt-mariposa-row { display: flex; align-items: center; gap: 2rem; background: rgba(255,255,255,0.02); padding: 1.2rem 2rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
                .vt-mariposa-label { font-size: 1rem; font-weight: 900; color: #fff; letter-spacing: 0.05em; }
                .vt-toggle-box { display: flex; gap: 0.5rem; background: rgba(0,0,0,0.3); padding: 0.4rem; border-radius: 12px; }
                .vt-t-btn { padding: 0.5rem 1.5rem; border-radius: 8px; border: none; background: transparent; color: rgba(255,255,255,0.3); font-size: 0.8rem; font-weight: 900; cursor: pointer; transition: all 0.2s; }
                .vt-t-btn.active-si { background: #10b981; color: #fff; box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
                .vt-t-btn.active-no { background: #ef4444; color: #fff; box-shadow: 0 4px 12px rgba(239,68,68,0.3); }

                .vt-depth-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; }
                .vt-box-wrap { background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
                .vt-box-title { display: block; font-size: 0.8rem; font-weight: 900; opacity: 0.5; margin-bottom: 1.5rem; text-align: center; letter-spacing: 0.2em; color: #a78bfa; }
                
                /* Arrows V2 */
                .vt-arrows-table-v2 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
                .vt-arrow-btn-v2 { 
                    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.4rem;
                    background: rgba(0,0,0,0.3); border: 2px solid rgba(99, 102, 241, 0.2); border-radius: 16px;
                    padding: 1rem; cursor: pointer; transition: all 0.2s ease; aspect-ratio: 1;
                }
                .vt-arrow-btn-v2:hover:not(:disabled) { border-color: rgba(99, 102, 241, 0.5); transform: scale(1.05); }
                .vt-arrow-btn-v2.active { border-color: #8b5cf6; background: rgba(139, 92, 246, 0.2); box-shadow: 0 8px 20px rgba(139, 92, 246, 0.2); }
                .vt-arrow-num-v2 { font-size: 1.2rem; font-weight: 900; color: #a78bfa; }
                .vt-arrow-check-v2 { font-size: 1.4rem; font-weight: 900; color: #fff; min-height: 1.8rem; }

                /* Animals V2 */
                .vt-animals-table-v2 { width: 100%; }
                .vt-at-header-v2 { display: grid; grid-template-columns: 40px repeat(5, 1fr); text-align: center; font-size: 0.8rem; font-weight: 900; color: #8b5cf6; margin-bottom: 1rem; }
                .vt-at-row-v2 { display: grid; grid-template-columns: 40px repeat(5, 1fr); gap: 0.6rem; align-items: center; margin-bottom: 0.6rem; }
                .vt-at-row-label-v2 { font-size: 1.2rem; font-weight: 900; color: #a78bfa; text-align: center; }
                .vt-animal-btn-v2 { 
                    aspect-ratio: 1.2; background: rgba(0,0,0,0.3); border: 2px solid rgba(255,255,255,0.05); 
                    border-radius: 12px; cursor: pointer; transition: all 0.2s; color: #fff; font-size: 1.2rem; font-weight: 900;
                    display: flex; align-items: center; justify-content: center;
                }
                .vt-animal-btn-v2:hover:not(:disabled) { border-color: rgba(255,255,255,0.2); }
                .vt-animal-btn-v2.active { border-color: #8b5cf6; background: rgba(139, 92, 246, 0.15); }

                /* Colors Table */
                .vt-colores-table { border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; background: rgba(255,255,255,0.01); }
                .vt-ct-head { display: grid; grid-template-columns: 3fr 1fr 1fr; background: rgba(139, 92, 246, 0.1); padding: 1rem 1.5rem; font-size: 0.75rem; font-weight: 900; color: #a78bfa; }
                .vt-ct-row { display: grid; grid-template-columns: 3fr 1fr 1fr; border-bottom: 1px solid rgba(255,255,255,0.05); align-items: center; }
                .vt-ct-label { padding: 1rem 1.5rem; font-size: 0.9rem; font-weight: 800; color: #fff; }
                .vt-ct-action { display: flex; justify-content: center; padding: 0.5rem; }
                .vt-ct-check { 
                    width: 2.2rem; height: 2.2rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);
                    background: rgba(0,0,0,0.2); color: rgba(255,255,255,0.2); font-size: 1rem; cursor: pointer; transition: all 0.2s;
                }
                .vt-ct-check.si.active { background: #10b981; color: #fff; border-color: #10b981; box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
                .vt-ct-check.no.active { background: #ef4444; color: #fff; border-color: #ef4444; box-shadow: 0 4px 12px rgba(239,68,68,0.3); }

                .vt-finalizado { margin-top: 4rem; text-align: center; background: rgba(16, 185, 129, 0.2); padding: 1.2rem; border-radius: 16px; border: 1px solid #10b981; color: #10b981; font-weight: 900; letter-spacing: 0.15em; }

                @media (max-width: 900px) {
                    .vt-depth-grid { grid-template-columns: 1fr; }
                    .vt-tm-head, .vt-tm-row { grid-template-columns: 1.5fr repeat(4, 1fr); padding: 0.5rem; }
                    .vt-tm-label { font-size: 0.75rem; }
                }
            `}</style>
        </div>
    )
}
