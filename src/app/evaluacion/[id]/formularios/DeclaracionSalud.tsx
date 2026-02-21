import React from 'react'
import type { FormularioProps } from './types'

export default function DeclaracionSalud({ examId, resultados, updateField, isEditable, isFinalizado }: FormularioProps) {
    // Utility to toggle "Si/No"
    const setSiNo = (key: string, val: string) => {
        if (!isEditable || isFinalizado) return
        updateField(examId, key, val)
    }

    // List of personal background conditions
    const enfermedades = [
        { key: 'enf_corazon', label: 'Enfermedades al corazón' },
        { key: 'enf_higado', label: 'Enfermedades al hígado' },
        { key: 'tuberculosis', label: 'Tuberculosis' },
        { key: 'arritmias', label: 'Arritmias' },
        { key: 'enf_psiquiatricas', label: 'Enfermedades Psiquiátricas' },
        { key: 'asmas', label: 'Asmas' },
        { key: 'diabetes', label: 'Diabetes (Azúcar en la Sangre)' },
        { key: 'presion_alta', label: 'Presión Arterial Alta' },
        { key: 'enf_rinon', label: 'Enfermedades al Riñón' },
        { key: 'vertigo', label: 'Vértigo (Miedo a la Altura)' },
        { key: 'anemia', label: 'Anemia' },
        { key: 'cancer_tumores', label: 'Cáncer o Tumores' },
        { key: 'bronquitis', label: 'Bronquitis Crónica' },
        { key: 'epilepsia', label: 'Epilepsia' }
    ]

    return (
        <div className="declaracion-salud-form">
            <h3 className="section-title">Antecedentes Personales</h3>
            <p className="form-subtitle">¿Padece o ha padecido alguna de estas enfermedades?</p>

            <div className="enfermedades-grid">
                {enfermedades.map(enf => (
                    <div key={enf.key} className="enf-row">
                        <label className="enf-label">{enf.label}</label>
                        <div className="flex-si-no">
                            <button
                                className={resultados[enf.key] === 'SI' ? 'active alert' : ''}
                                onClick={() => setSiNo(enf.key, 'SI')}
                                disabled={!isEditable || isFinalizado}
                            >SÍ</button>
                            <button
                                className={resultados[enf.key] === 'NO' ? 'active ok' : ''}
                                onClick={() => setSiNo(enf.key, 'NO')}
                                disabled={!isEditable || isFinalizado}
                            >NO</button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="form-section">
                <label>Otras enfermedades (Especifique)</label>
                <input
                    type="text"
                    value={resultados.otras_enfermedades || ''}
                    onChange={e => updateField(examId, 'otras_enfermedades', e.target.value)}
                    disabled={!isEditable || isFinalizado}
                    placeholder="Detalle otras dolencias..."
                />
            </div>

            <hr className="divider" />

            <h3 className="section-title">Antecedentes Generales</h3>
            <p className="form-subtitle">Ante las siguientes aseveraciones, indique SI o NO conforme a su historial.</p>

            {/* Operado */}
            <div className="aseveracion-card">
                <div className="asev-header">
                    <label>¿Ha sido operado alguna vez?</label>
                    <div className="flex-si-no">
                        <button className={resultados.ha_sido_operado === 'SI' ? 'active' : ''} onClick={() => setSiNo('ha_sido_operado', 'SI')} disabled={!isEditable || isFinalizado}>SÍ</button>
                        <button className={resultados.ha_sido_operado === 'NO' ? 'active' : ''} onClick={() => setSiNo('ha_sido_operado', 'NO')} disabled={!isEditable || isFinalizado}>NO</button>
                    </div>
                </div>
                {resultados.ha_sido_operado === 'SI' && (
                    <div className="asev-details">
                        <input type="text" placeholder="¿De qué?" value={resultados.op_deque || ''} onChange={e => updateField(examId, 'op_deque', e.target.value)} disabled={!isEditable || isFinalizado} />
                        <input type="text" placeholder="Fecha" value={resultados.op_fecha || ''} onChange={e => updateField(examId, 'op_fecha', e.target.value)} disabled={!isEditable || isFinalizado} />
                    </div>
                )}
            </div>

            {/* Hospitalizado */}
            <div className="aseveracion-card">
                <div className="asev-header">
                    <label>¿Ha sido hospitalizado alguna vez?</label>
                    <div className="flex-si-no">
                        <button className={resultados.ha_sido_hospitalizado === 'SI' ? 'active' : ''} onClick={() => setSiNo('ha_sido_hospitalizado', 'SI')} disabled={!isEditable || isFinalizado}>SÍ</button>
                        <button className={resultados.ha_sido_hospitalizado === 'NO' ? 'active' : ''} onClick={() => setSiNo('ha_sido_hospitalizado', 'NO')} disabled={!isEditable || isFinalizado}>NO</button>
                    </div>
                </div>
                {resultados.ha_sido_hospitalizado === 'SI' && (
                    <div className="asev-details">
                        <input type="text" placeholder="¿Por qué?" value={resultados.hosp_porque || ''} onChange={e => updateField(examId, 'hosp_porque', e.target.value)} disabled={!isEditable || isFinalizado} />
                        <input type="text" placeholder="Fecha" value={resultados.hosp_fecha || ''} onChange={e => updateField(examId, 'hosp_fecha', e.target.value)} disabled={!isEditable || isFinalizado} />
                    </div>
                )}
            </div>

            {/* Cambiar de trabajo */}
            <div className="aseveracion-card">
                <div className="asev-header">
                    <label>¿Le han dicho que debe cambiar de trabajo por razones de salud?</label>
                    <div className="flex-si-no">
                        <button className={resultados.cambio_trabajo_salud === 'SI' ? 'active' : ''} onClick={() => setSiNo('cambio_trabajo_salud', 'SI')} disabled={!isEditable || isFinalizado}>SÍ</button>
                        <button className={resultados.cambio_trabajo_salud === 'NO' ? 'active' : ''} onClick={() => setSiNo('cambio_trabajo_salud', 'NO')} disabled={!isEditable || isFinalizado}>NO</button>
                    </div>
                </div>
                {resultados.cambio_trabajo_salud === 'SI' && (
                    <div className="asev-details">
                        <input type="text" placeholder="¿Por qué?" value={resultados.cts_porque || ''} onChange={e => updateField(examId, 'cts_porque', e.target.value)} disabled={!isEditable || isFinalizado} />
                        <input type="text" placeholder="Fecha" value={resultados.cts_fecha || ''} onChange={e => updateField(examId, 'cts_fecha', e.target.value)} disabled={!isEditable || isFinalizado} />
                    </div>
                )}
            </div>

            {/* Remedios habituales */}
            <div className="aseveracion-card">
                <div className="asev-header">
                    <label>¿Toma algún remedio en forma habitual?</label>
                    <div className="flex-si-no">
                        <button className={resultados.toma_remedio_habitual === 'SI' ? 'active' : ''} onClick={() => setSiNo('toma_remedio_habitual', 'SI')} disabled={!isEditable || isFinalizado}>SÍ</button>
                        <button className={resultados.toma_remedio_habitual === 'NO' ? 'active' : ''} onClick={() => setSiNo('toma_remedio_habitual', 'NO')} disabled={!isEditable || isFinalizado}>NO</button>
                    </div>
                </div>
                {resultados.toma_remedio_habitual === 'SI' && (
                    <div className="asev-details tri-col">
                        <input type="text" placeholder="¿Cuál?" value={resultados.rem_cual || ''} onChange={e => updateField(examId, 'rem_cual', e.target.value)} disabled={!isEditable || isFinalizado} />
                        <input type="text" placeholder="¿Cómo (Dosis)?" value={resultados.rem_como || ''} onChange={e => updateField(examId, 'rem_como', e.target.value)} disabled={!isEditable || isFinalizado} />
                        <input type="text" placeholder="Fecha inicio" value={resultados.rem_fecha || ''} onChange={e => updateField(examId, 'rem_fecha', e.target.value)} disabled={!isEditable || isFinalizado} />
                    </div>
                )}
            </div>

            {/* Alcohol */}
            <div className="aseveracion-card">
                <div className="asev-header">
                    <label>¿Consume Alcohol?</label>
                    <div className="flex-si-no">
                        <button className={resultados.consume_alcohol === 'SI' ? 'active' : ''} onClick={() => setSiNo('consume_alcohol', 'SI')} disabled={!isEditable || isFinalizado}>SÍ</button>
                        <button className={resultados.consume_alcohol === 'NO' ? 'active' : ''} onClick={() => setSiNo('consume_alcohol', 'NO')} disabled={!isEditable || isFinalizado}>NO</button>
                    </div>
                </div>
                {resultados.consume_alcohol === 'SI' && (
                    <div className="asev-details">
                        <input type="text" placeholder="¿Con qué frecuencia?" value={resultados.alc_frecuencia || ''} onChange={e => updateField(examId, 'alc_frecuencia', e.target.value)} disabled={!isEditable || isFinalizado} />
                        <input type="text" placeholder="¿Qué cantidad?" value={resultados.alc_cantidad || ''} onChange={e => updateField(examId, 'alc_cantidad', e.target.value)} disabled={!isEditable || isFinalizado} />
                    </div>
                )}
            </div>

            {/* Fuma */}
            <div className="aseveracion-card">
                <div className="asev-header">
                    <label>¿Fuma o ha fumado alguna vez?</label>
                    <div className="flex-si-no">
                        <button className={resultados.fuma_alguna_vez === 'SI' ? 'active' : ''} onClick={() => setSiNo('fuma_alguna_vez', 'SI')} disabled={!isEditable || isFinalizado}>SÍ</button>
                        <button className={resultados.fuma_alguna_vez === 'NO' ? 'active' : ''} onClick={() => setSiNo('fuma_alguna_vez', 'NO')} disabled={!isEditable || isFinalizado}>NO</button>
                    </div>
                </div>
                {resultados.fuma_alguna_vez === 'SI' && (
                    <div className="asev-details tri-col">
                        <input type="text" placeholder="¿Años que NO fuma?" value={resultados.fuma_anos_no || ''} onChange={e => updateField(examId, 'fuma_anos_no', e.target.value)} disabled={!isEditable || isFinalizado} />
                        <input type="text" placeholder="¿Cigarros al día?" value={resultados.fuma_cigarros_dia || ''} onChange={e => updateField(examId, 'fuma_cigarros_dia', e.target.value)} disabled={!isEditable || isFinalizado} />
                        <input type="text" placeholder="¿Años que fuma?" value={resultados.fuma_anos_fuma || ''} onChange={e => updateField(examId, 'fuma_anos_fuma', e.target.value)} disabled={!isEditable || isFinalizado} />
                    </div>
                )}
            </div>

            {/* Drogas */}
            <div className="aseveracion-card">
                <div className="asev-header">
                    <label>¿Consume habitualmente drogas?</label>
                    <div className="flex-si-no">
                        <button className={resultados.consume_drogas === 'SI' ? 'active alert' : ''} onClick={() => setSiNo('consume_drogas', 'SI')} disabled={!isEditable || isFinalizado}>SÍ</button>
                        <button className={resultados.consume_drogas === 'NO' ? 'active ok' : ''} onClick={() => setSiNo('consume_drogas', 'NO')} disabled={!isEditable || isFinalizado}>NO</button>
                    </div>
                </div>
                {resultados.consume_drogas === 'SI' && (
                    <div className="form-section checks-group">
                        <label className="checkbox-item">
                            <input type="checkbox" checked={resultados.droga_marihuana === 'true'} onChange={e => updateField(examId, 'droga_marihuana', e.target.checked ? 'true' : 'false')} disabled={!isEditable || isFinalizado} /> Marihuana
                        </label>
                        <label className="checkbox-item">
                            <input type="checkbox" checked={resultados.droga_cocaina === 'true'} onChange={e => updateField(examId, 'droga_cocaina', e.target.checked ? 'true' : 'false')} disabled={!isEditable || isFinalizado} /> Cocaína
                        </label>
                        <label className="checkbox-item">
                            <input type="checkbox" checked={resultados.droga_pastabase === 'true'} onChange={e => updateField(examId, 'droga_pastabase', e.target.checked ? 'true' : 'false')} disabled={!isEditable || isFinalizado} /> Pasta Base
                        </label>
                        <input type="text" placeholder="Otra..." value={resultados.droga_otra || ''} onChange={e => updateField(examId, 'droga_otra', e.target.value)} disabled={!isEditable || isFinalizado} />
                    </div>
                )}
            </div>

            {/* Dolencia no mencionada */}
            <div className="aseveracion-card">
                <div className="asev-header">
                    <label>¿Padece actualmente de alguna enfermedad o dolencia no mencionada?</label>
                    <div className="flex-si-no">
                        <button className={resultados.padece_no_mencionada === 'SI' ? 'active' : ''} onClick={() => setSiNo('padece_no_mencionada', 'SI')} disabled={!isEditable || isFinalizado}>SÍ</button>
                        <button className={resultados.padece_no_mencionada === 'NO' ? 'active' : ''} onClick={() => setSiNo('padece_no_mencionada', 'NO')} disabled={!isEditable || isFinalizado}>NO</button>
                    </div>
                </div>
                {resultados.padece_no_mencionada === 'SI' && (
                    <div className="form-section">
                        <input type="text" placeholder="¿Cuál?" value={resultados.no_mencionada_cual || ''} onChange={e => updateField(examId, 'no_mencionada_cual', e.target.value)} disabled={!isEditable || isFinalizado} style={{ marginTop: '0.5rem' }} />
                    </div>
                )}
            </div>

            <hr className="divider" />

            <h3 className="section-title">Antecedentes Familiares</h3>
            <p className="form-subtitle">En su familia consanguínea (padres, hermanos, abuelos) ¿alguien tiene o ha tenido presión alta, diabetes, cáncer u otra?</p>
            {(() => {
                let famList: Array<{ parentesco: string; enfermedad: string }> = []
                try { famList = JSON.parse(resultados.fam_lista || '[]') } catch { }
                if (!Array.isArray(famList) || famList.length === 0) {
                    famList = [{
                        parentesco: resultados.fam_parentesco || '',
                        enfermedad: resultados.fam_enfermedad || ''
                    }]
                }

                return (
                    <div className="family-container">
                        {famList.map((fam, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '0.8rem', marginBottom: idx < famList.length - 1 ? '0.8rem' : '0' }}>
                                <div className="form-section family-grid tri-col" style={{ flex: 1, margin: 0 }}>
                                    <input type="text" placeholder="Parentesco" value={fam.parentesco} onChange={e => {
                                        const newList = [...famList]
                                        newList[idx] = { ...newList[idx], parentesco: e.target.value }
                                        updateField(examId, 'fam_lista', JSON.stringify(newList))
                                    }} disabled={!isEditable || isFinalizado} />
                                    <input type="text" placeholder="Enfermedad" value={fam.enfermedad} onChange={e => {
                                        const newList = [...famList]
                                        newList[idx] = { ...newList[idx], enfermedad: e.target.value }
                                        updateField(examId, 'fam_lista', JSON.stringify(newList))
                                    }} disabled={!isEditable || isFinalizado} style={{ gridColumn: 'span 2' }} />
                                </div>
                                {idx > 0 && isEditable && !isFinalizado && (
                                    <button
                                        style={{ width: '42px', height: '42px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', fontSize: '1.4rem', fontWeight: 'bold' }}
                                        onClick={() => {
                                            const newList = [...famList]
                                            newList.splice(idx, 1)
                                            updateField(examId, 'fam_lista', JSON.stringify(newList))
                                        }}
                                        title="Eliminar registro"
                                    >×</button>
                                )}
                            </div>
                        ))}
                        {isEditable && !isFinalizado && (
                            <button
                                onClick={() => {
                                    const newList = [...famList, { parentesco: '', enfermedad: '' }]
                                    updateField(examId, 'fam_lista', JSON.stringify(newList))
                                }}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    padding: '6px 14px', background: 'rgba(255,107,44,0.1)', color: 'var(--brand-primary)',
                                    borderRadius: '8px', border: '1px solid rgba(255,107,44,0.3)', cursor: 'pointer',
                                    fontWeight: '800', fontSize: '0.75rem', marginTop: '1rem', textTransform: 'uppercase'
                                }}
                            >
                                + Agregar otro antecedente
                            </button>
                        )}
                    </div>
                )
            })()}

            <hr className="divider" />

            <h3 className="section-title">Antecedentes de Origen Laboral</h3>
            <div className="aseveracion-card">
                <div className="asev-header">
                    <label>¿Le han indicado que tiene enfermedad profesional o ha sufrido accidente laboral?</label>
                    <div className="flex-si-no">
                        <button className={resultados.origen_laboral === 'SI' ? 'active' : ''} onClick={() => setSiNo('origen_laboral', 'SI')} disabled={!isEditable || isFinalizado}>SÍ</button>
                        <button className={resultados.origen_laboral === 'NO' ? 'active' : ''} onClick={() => setSiNo('origen_laboral', 'NO')} disabled={!isEditable || isFinalizado}>NO</button>
                    </div>
                </div>
                {resultados.origen_laboral === 'SI' && (
                    <div className="laboral-details-box" style={{ background: 'rgba(0,0,0,0.2)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, opacity: 0.6, textTransform: 'uppercase', marginBottom: '0.6rem' }}>Detalle del Evento</label>
                        <div className="asev-details dual-row" style={{ marginTop: 0 }}>
                            <input type="text" placeholder="¿Qué tipo de Acc./Enf.?" value={resultados.lab_tipo || ''} onChange={e => updateField(examId, 'lab_tipo', e.target.value)} disabled={!isEditable || isFinalizado} />
                            <input type="text" placeholder="¿Qué año?" value={resultados.lab_ano || ''} onChange={e => updateField(examId, 'lab_ano', e.target.value)} disabled={!isEditable || isFinalizado} />
                        </div>

                        <div className="asev-header" style={{ marginTop: '1.5rem', marginBottom: '0.8rem' }}>
                            <label style={{ fontSize: '0.85rem' }}>¿Fue indemnizado o pensionado?</label>
                            <div className="flex-si-no">
                                <button className={resultados.lab_indem === 'SI' ? 'active' : ''} onClick={() => setSiNo('lab_indem', 'SI')} disabled={!isEditable || isFinalizado}>SÍ</button>
                                <button className={resultados.lab_indem === 'NO' ? 'active' : ''} onClick={() => setSiNo('lab_indem', 'NO')} disabled={!isEditable || isFinalizado}>NO</button>
                            </div>
                        </div>

                        <div className="form-section">
                            <input type="text" placeholder="¿Mutualidad?" value={resultados.lab_mutualidad || ''} onChange={e => updateField(examId, 'lab_mutualidad', e.target.value)} disabled={!isEditable || isFinalizado} />
                        </div>
                    </div>
                )}
            </div>

            <hr className="divider" />

            <h3 className="section-title">Solo para Mujeres</h3>
            <div className="aseveracion-card">
                <div className="asev-header">
                    <label>¿Cree usted que podría estar embarazada?</label>
                    <div className="flex-si-no">
                        <button className={resultados.embarazada === 'SI' ? 'active alert' : ''} onClick={() => setSiNo('embarazada', 'SI')} disabled={!isEditable || isFinalizado}>SÍ</button>
                        <button className={resultados.embarazada === 'NO' ? 'active ok' : ''} onClick={() => setSiNo('embarazada', 'NO')} disabled={!isEditable || isFinalizado}>NO</button>
                    </div>
                </div>
                <div className="form-section">
                    <label>Fecha última regla:</label>
                    <input type="text" placeholder="DD/MM/AAAA" value={resultados.fecha_regla || ''} onChange={e => updateField(examId, 'fecha_regla', e.target.value)} disabled={!isEditable || isFinalizado} />
                </div>
            </div>

            <hr className="divider" />

            <div className="declaracion-legal-box">
                <p><strong>DECLARO QUE MIS RESPUESTAS SON VERDADERAS</strong>, ESTOY CONSCIENTE QUE EL OCULTAR O FALSEAR INFORMACIÓN PUEDE CAUSAR DAÑO Y ASUMO LA RESPONSABILIDAD DE ELLO.</p>

                <div className="firma-box">
                    <label className="checkbox-declaration">
                        <input type="checkbox" checked={resultados.declara_verdad === 'true'} onChange={e => updateField(examId, 'declara_verdad', e.target.checked ? 'true' : 'false')} disabled={!isEditable || isFinalizado} />
                        ACEPTO LOS TÉRMINOS Y CONFIERO MI FIRMA DIGITAL
                    </label>
                </div>
            </div>

            <style jsx>{`
                .declaracion-salud-form { background: #050505; padding: 1.5rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); color: #fff; }
                .section-title { font-size: 1rem; font-weight: 900; color: var(--brand-primary, #ff6b2c); margin: 0 0 0.2rem 0; letter-spacing: -0.02em; }
                .form-subtitle { font-size: 0.75rem; opacity: 0.6; font-weight: 700; margin-bottom: 1.2rem; }
                .divider { border: 0; height: 1px; background: rgba(255,255,255,0.1); margin: 2rem 0; }
                
                .enfermedades-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
                .enf-row { display: flex; justify-content: space-between; align-items: center; padding: 0.8rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
                .enf-label { font-size: 0.85rem; font-weight: 700; flex: 1; }
                
                .form-section label { display: block; font-size: 0.7rem; font-weight: 800; opacity: 0.6; text-transform: uppercase; margin-bottom: 0.4rem; }
                .form-section input { width: 100%; background: #111; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.8rem; color: #fff; font-size: 0.9rem; }
                
                .flex-si-no { display: flex; gap: 4px; min-width: 100px; }
                .flex-si-no button { flex: 1; padding: 0.5rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: #111; color: #fff; font-weight: 800; cursor: pointer; transition: 0.2s; font-size: 0.8rem; }
                .flex-si-no button.active { background: var(--brand-primary, #ff6b2c); border-color: var(--brand-primary, #ff6b2c); color: #000; }
                .flex-si-no button.active.ok { background: #10b981; border-color: #10b981; color: #000; }
                .flex-si-no button.active.alert { background: #ef4444; border-color: #ef4444; color: #fff; }
                
                .aseveracion-card { background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 1rem; }
                .asev-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
                .asev-header label { font-size: 0.85rem; font-weight: 700; flex: 1; line-height: 1.4; }
                
                .asev-details { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 1rem; }
                .asev-details.tri-col { grid-template-columns: 1fr 1fr 1fr; }
                .asev-details.dual-row { grid-template-columns: 1fr 1fr; }
                .asev-details input, .family-grid input { background: #111; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.8rem; color: #fff; font-size: 0.85rem; width: 100%; }
                
                .family-grid { display: grid; gap: 0.5rem; }
                
                .checks-group { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; margin-top: 1rem; }
                .checkbox-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; cursor: pointer; text-transform: none !important; opacity: 1 !important; }
                .checkbox-item input { width: 18px; height: 18px; accent-color: var(--brand-primary, #ff6b2c); }
                
                .declaracion-legal-box { background: rgba(255,107,44,0.05); border: 1px solid rgba(255,107,44,0.2); border-radius: 12px; padding: 1.5rem; text-align: center; }
                .declaracion-legal-box p { font-size: 0.85rem; opacity: 0.8; line-height: 1.5; margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 0.02em; }
                
                .firma-box { display: inline-block; background: #000; padding: 1rem 1.5rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
                .checkbox-declaration { display: flex; align-items: center; gap: 0.8rem; font-size: 0.9rem; font-weight: 800; cursor: pointer; color: var(--brand-primary, #ff6b2c); }
                .checkbox-declaration input { width: 24px; height: 24px; accent-color: var(--brand-primary, #ff6b2c); }

                @media (max-width: 768px) {
                    .enfermedades-grid { grid-template-columns: 1fr; }
                    .asev-header { flex-direction: column; align-items: flex-start; }
                    .flex-si-no { width: 100%; margin-top: 0.5rem; }
                    .asev-details, .asev-details.tri-col, .asev-details.dual-row, .family-grid { grid-template-columns: 1fr; }
                    .family-grid input[style] { grid-column: auto !important; }
                }
            `}</style>
        </div>
    )
}
