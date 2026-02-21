import React from 'react'
import type { FormularioProps } from './types'

export default function ExposicionSilice({ examId, resultados, updateField, isEditable, isFinalizado }: FormularioProps) {
    const setOption = (key: string, val: string) => {
        if (!isEditable || isFinalizado) return
        updateField(examId, key, val)
    }

    const renderSiNo = (key: string) => (
        <div className="flex-si-no">
            <button className={resultados[key] === 'SI' ? 'active' : ''} onClick={() => setOption(key, 'SI')} disabled={!isEditable || isFinalizado}>SÍ</button>
            <button className={resultados[key] === 'NO' ? 'active' : ''} onClick={() => setOption(key, 'NO')} disabled={!isEditable || isFinalizado}>NO</button>
        </div>
    )

    const inputField = (key: string, placeholder: string = '', type: string = 'text') => (
        <input
            type={type}
            value={resultados[key] || ''}
            onChange={e => updateField(examId, key, e.target.value)}
            disabled={!isEditable || isFinalizado}
            placeholder={placeholder}
            className="std-input"
        />
    )

    const antecedentesGrid = [
        { key: 'ant_tuberculosis', label: 'Tuberculosis' },
        { key: 'ant_pleuritis', label: 'Pleuritis' },
        { key: 'ant_bronquitis', label: 'Bronquitis Crónica' },
        { key: 'ant_epoc', label: 'EPOC' },
        { key: 'ant_asma', label: 'Asma Bronquial' },
        { key: 'ant_hipertension', label: 'Hipertensión Arterial' },
    ]

    return (
        <div className="silice-form">
            <h3 className="section-title">Encuesta Exposición a Sílice</h3>

            <div className="card-group">
                <h4 className="card-title">HISTORIA LABORAL ACTUAL</h4>
                <div className="grid-2">
                    <div className="field-group">
                        <label>Cargo:</label>
                        {inputField('hl_cargo')}
                    </div>
                    <div className="field-group">
                        <label>Puesto de Trabajo:</label>
                        {inputField('hl_puesto')}
                    </div>
                    <div className="field-group">
                        <label>Fecha inicio en el puesto:</label>
                        {inputField('hl_fecha_inicio', '', 'date')}
                    </div>
                    <div className="field-group fw">
                        <label>Descripción de las tareas desarrolladas:</label>
                        {inputField('hl_tareas')}
                    </div>
                </div>
            </div>

            <div className="card-group">
                <h4 className="card-title">EVALUACIÓN DEL RIESGO</h4>
                <div className="grid-2">
                    <div className="field-group fw">
                        <label>Con medición de Sílice Ambiental:</label>
                        <div className="flex-si-no">
                            {['I', 'II', 'III', 'IV'].map(grado => (
                                <button key={grado} className={resultados.eval_con_med === grado ? 'active' : ''} onClick={() => setOption('eval_con_med', grado)} disabled={!isEditable || isFinalizado}>{grado}</button>
                            ))}
                        </div>
                    </div>
                    <div className="field-group fw">
                        <label>Sin medición de Sílice Ambiental:</label>
                        <div className="flex-si-no">
                            {['I', 'II', 'III', 'IV'].map(grado => (
                                <button key={grado} className={resultados.eval_sin_med === grado ? 'active' : ''} onClick={() => setOption('eval_sin_med', grado)} disabled={!isEditable || isFinalizado}>{grado}</button>
                            ))}
                        </div>
                    </div>
                    <div className="field-group fw">
                        <label>Trabaja con chorro de arena:</label>
                        {inputField('eval_chorro_arena')}
                    </div>
                </div>
            </div>

            <div className="card-group">
                <h4 className="card-title">EQUIPO DE PROTECCIÓN INDIVIDUAL</h4>
                <div className="grid-2">
                    <div className="field-group fw">
                        <label>Tipo:</label>
                        {inputField('epi_tipo')}
                    </div>
                    <div className="field-group">
                        <label>Existe Programa de Mantención:</label>
                        {renderSiNo('epi_mantencion')}
                    </div>
                    <div className="field-group">
                        <label>Frecuencia de uso:</label>
                        <div className="flex-si-no">
                            {['Nunca', 'A veces', 'Siempre'].map(freq => (
                                <button key={freq} className={resultados.epi_frecuencia === freq ? 'active' : ''} onClick={() => setOption('epi_frecuencia', freq)} disabled={!isEditable || isFinalizado}>{freq}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card-group">
                <h4 className="card-title">ACTIVIDADES EXTRALABORALES (Aparato Respiratorio)</h4>
                <div className="field-group fw">
                    <label>Describir actividades con riesgo:</label>
                    {inputField('act_extralaborales')}
                </div>
            </div>

            <div className="card-group">
                <h4 className="card-title">HISTORIA LABORAL ANTERIOR (Riesgo Neumoconiosis)</h4>
                <div className="history-grid">
                    <div className="col-hist">
                        <h5>1ª Empresa</h5>
                        {inputField('emp1_nombre', 'Nombre')}
                        {inputField('emp1_rut', 'RUT')}
                        {inputField('emp1_inicio', 'Año Inicio')}
                        {inputField('emp1_cese', 'Año Cese')}
                        {inputField('emp1_ocupacion', 'Ocupación Principal')}
                    </div>
                    <div className="col-hist">
                        <h5>2ª Empresa</h5>
                        {inputField('emp2_nombre', 'Nombre')}
                        {inputField('emp2_rut', 'RUT')}
                        {inputField('emp2_inicio', 'Año Inicio')}
                        {inputField('emp2_cese', 'Año Cese')}
                        {inputField('emp2_ocupacion', 'Ocupación Principal')}
                    </div>
                    <div className="col-hist">
                        <h5>3ª Empresa</h5>
                        {inputField('emp3_nombre', 'Nombre')}
                        {inputField('emp3_rut', 'RUT')}
                        {inputField('emp3_inicio', 'Año Inicio')}
                        {inputField('emp3_cese', 'Año Cese')}
                        {inputField('emp3_ocupacion', 'Ocupación Principal')}
                    </div>
                </div>
            </div>

            <div className="card-group">
                <h4 className="card-title">EXAMENES DE SALUD ESPECIFICOS PREVIOS</h4>
                <div className="grid-2">
                    <div className="field-group fw">
                        <label>Causa de evaluación médica con RX tórax por:</label>
                        {inputField('exam_causa_rx')}
                    </div>
                    <div className="field-group">
                        <label>Prog. Vigilancia Neumoconiosis:</label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {renderSiNo('exam_prog_neumo')}
                            {resultados.exam_prog_neumo === 'SI' && inputField('exam_prog_neumo_ano', 'Año', 'number')}
                        </div>
                    </div>
                    <div className="field-group">
                        <label>Evaluación Médico-Legal:</label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {renderSiNo('exam_medico_legal')}
                            {resultados.exam_medico_legal === 'SI' && inputField('exam_medico_legal_ano', 'Año', 'number')}
                        </div>
                    </div>
                    <div className="field-group fw">
                        <label>Patología respiratoria Dg.:</label>
                        {inputField('exam_patologia_dg')}
                    </div>
                    <div className="field-group fw p-blue">
                        <label>RESOLUCIÓN EV. MEDICO LEGAL POR SILICOSIS:</label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {renderSiNo('exam_resolucion_silicosis')}
                            {resultados.exam_resolucion_silicosis === 'SI' && (
                                <>
                                    {inputField('exam_resolucion_ano', 'Año', 'number')}
                                    {inputField('exam_resolucion_pcg', '%PCG')}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card-group">
                <h4 className="card-title">HÁBITOS</h4>
                <div className="field-section">
                    <h5>TABACO</h5>
                    <div className="grid-3">
                        <div className="field-group">
                            <label>No fumador:</label>
                            {renderSiNo('habito_tabaco_no')}
                        </div>
                        <div className="field-group">
                            <label>Ex Fumador ({'>'}6 meses):</label>
                            {inputField('habito_tabaco_ex', 'Años')}
                        </div>
                        <div className="field-group">
                            <label>Cigarrillos / Pipas:</label>
                            {inputField('habito_tabaco_nro', 'Nº al día')}
                            {inputField('habito_tabaco_anos', 'Años fumando', 'number')}
                        </div>
                    </div>
                </div>
                <div className="field-section">
                    <h5>ALCOHOL</h5>
                    <div className="grid-3">
                        <div className="field-group">
                            <label>No Bebedor:</label>
                            {renderSiNo('habito_alcohol_no')}
                        </div>
                        <div className="field-group">
                            <label>Ex Bebedor:</label>
                            {renderSiNo('habito_alcohol_ex')}
                        </div>
                        <div className="field-group">
                            <label>Años Ex-Bebedor:</label>
                            {inputField('habito_alcohol_ex_anos', 'Años', 'number')}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card-group">
                <h4 className="card-title">ANTECEDENTES PERSONALES (Diagnosticado por Médico)</h4>
                <div className="grid-2">
                    {antecedentesGrid.map(ant => (
                        <div key={ant.key} className="field-group row-align">
                            <label className="ant-label">{ant.label}:</label>
                            {renderSiNo(ant.key)}
                            {resultados[ant.key] === 'SI' && (
                                <input
                                    type="text"
                                    value={resultados[`${ant.key}_ano`] || ''}
                                    onChange={e => updateField(examId, `${ant.key}_ano`, e.target.value)}
                                    disabled={!isEditable || isFinalizado}
                                    placeholder="Año"
                                    className="std-input small-input"
                                />
                            )}
                        </div>
                    ))}
                    <div className="field-group fw">
                        <label>OTRAS ENFERMEDADES:</label>
                        {inputField('ant_otras_enf')}
                    </div>
                </div>
            </div>

            <div className="card-group">
                <h4 className="card-title">MEDICACIÓN ACTUAL</h4>
                <div className="field-group">
                    {renderSiNo('med_actual')}
                </div>
                {resultados.med_actual === 'SI' && (
                    <div className="field-group fw mt-1" style={{ marginTop: '0.8rem' }}>
                        <label>Especificar medicación:</label>
                        {inputField('med_actual_esp')}
                    </div>
                )}
            </div>

            <div className="card-group">
                <h4 className="card-title">SINTOMATOLOGÍA RESPIRATORIA</h4>
                <div className="grid-1 gap-mid">
                    <div className="sym-row">
                        <label>Disnea:</label>
                        {renderSiNo('sint_disnea')}
                        {resultados.sint_disnea === 'SI' && (
                            <>
                                <div className="flex-si-no mini-opts">
                                    {['Poco esfuerzo', 'Mediano esfuerzo', 'Gran esfuerzo'].map(g => (
                                        <button key={g} className={resultados.sint_disnea_grado === g ? 'active' : ''} onClick={() => setOption('sint_disnea_grado', g)} disabled={!isEditable || isFinalizado}>{g}</button>
                                    ))}
                                </div>
                                <input type="text" className="std-input small-input" placeholder="Inicio" value={resultados.sint_disnea_inicio || ''} onChange={e => updateField(examId, 'sint_disnea_inicio', e.target.value)} disabled={!isEditable || isFinalizado} />
                            </>
                        )}
                    </div>

                    <div className="sym-row">
                        <label>Dolor toráxico:</label>
                        {renderSiNo('sint_dolor')}
                        {resultados.sint_dolor === 'SI' && <input type="text" className="std-input small-input" placeholder="Inicio" value={resultados.sint_dolor_inicio || ''} onChange={e => updateField(examId, 'sint_dolor_inicio', e.target.value)} disabled={!isEditable || isFinalizado} />}
                    </div>

                    <div className="sym-row">
                        <label>Exp. Hemoptoica:</label>
                        {renderSiNo('sint_hemoptoica')}
                        {resultados.sint_hemoptoica === 'SI' && <input type="text" className="std-input small-input" placeholder="Inicio" value={resultados.sint_hemoptoica_inicio || ''} onChange={e => updateField(examId, 'sint_hemoptoica_inicio', e.target.value)} disabled={!isEditable || isFinalizado} />}
                    </div>

                    <div className="sym-row">
                        <label>Tos: (más de 2 sem)</label>
                        {renderSiNo('sint_tos')}
                        {resultados.sint_tos === 'SI' && <input type="text" className="std-input small-input" placeholder="Inicio" value={resultados.sint_tos_inicio || ''} onChange={e => updateField(examId, 'sint_tos_inicio', e.target.value)} disabled={!isEditable || isFinalizado} />}
                    </div>

                    <div className="sym-row">
                        <label>Expectoración: (más de 2 sem)</label>
                        {renderSiNo('sint_expectoracion')}
                        {resultados.sint_expectoracion === 'SI' && <input type="text" className="std-input small-input" placeholder="Inicio" value={resultados.sint_expectoracion_inicio || ''} onChange={e => updateField(examId, 'sint_expectoracion_inicio', e.target.value)} disabled={!isEditable || isFinalizado} />}
                    </div>

                    <div className="sym-row wrap-lbl">
                        <label>Ha presentado expectoración mucosa, usualmente con tos, durante 3 meses consecutivos y sin evidencia de otra enfermedad respiratoria:</label>
                        {renderSiNo('sint_exp_mucosa')}
                    </div>

                    <div className="sym-row wrap-lbl" style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                        <label>OTRA SINTOMATOLOGÍA DE IMPORTANCIA:</label>
                        {inputField('sint_otras')}
                    </div>
                </div>
            </div>


            <style jsx global>{`
                .silice-form { background: #050505; padding: 1.5rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); color: #fff; }
                .silice-form .section-title { font-size: 1.1rem; font-weight: 900; color: #3b82f6; margin: 0 0 1.5rem 0; letter-spacing: -0.02em; text-transform: uppercase; }
                
                .silice-form .card-group { background: rgba(255,255,255,0.02); padding: 1.2rem; border-radius: 12px; margin-bottom: 1.2rem; border: 1px solid rgba(255,255,255,0.05); }
                .silice-form .card-title { font-size: 0.85rem; font-weight: 800; margin: 0 0 1.2rem 0; color: #94a3b8; letter-spacing: 0.05em; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem; }
                
                .silice-form .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .silice-form .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
                .silice-form .grid-1 { display: grid; grid-template-columns: 1fr; gap: 1rem; }
                .silice-form .fw { grid-column: 1 / -1; }
                
                .silice-form .field-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .silice-form .field-group label { font-size: 0.8rem; font-weight: 600; color: #cbd5e1; }
                .silice-form .field-group.row-align { flex-direction: row; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.5rem; background: rgba(255,255,255,0.02); border-radius: 8px;}
                .silice-form .ant-label { flex: 1; }

                .silice-form .std-input { background: #111; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.7rem 1rem; color: #fff; font-size: 0.85rem; width: 100%; transition: 0.2s; }
                .silice-form .std-input:focus { outline: none; border-color: #3b82f6; background: #000; }
                .silice-form .small-input { max-width: 120px; }

                .silice-form .flex-si-no { display: flex; gap: 4px; }
                .silice-form .flex-si-no button { flex: 1; min-width: 60px; padding: 0.6rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: #111; color: #fff; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: 0.2s; }
                .silice-form .flex-si-no button.active { background: #3b82f6; border-color: #3b82f6; color: #fff; }
                .silice-form .flex-si-no.mini-opts button { font-size: 0.7rem; padding: 0.5rem; }

                .silice-form .history-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
                .silice-form .col-hist { display: flex; flex-direction: column; gap: 0.8rem; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px; border: 1px dashed rgba(255,255,255,0.08); }
                .silice-form .col-hist h5 { margin: 0; font-size: 0.8rem; color: #3b82f6; font-weight: 800; text-align: center; }

                .silice-form .field-section { margin-bottom: 1.5rem; }
                .silice-form .field-section:last-child { margin-bottom: 0; }
                .silice-form .field-section h5 { font-size: 0.8rem; color: #cbd5e1; margin: 0 0 0.8rem 0; font-weight: 700; }

                .silice-form .p-blue { background: rgba(59,130,246,0.05); padding: 1rem; border-radius: 8px; border: 1px solid rgba(59,130,246,0.2); }

                .silice-form .sym-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.6rem; background: rgba(255,255,255,0.01); border-radius: 8px; }
                .silice-form .sym-row label { font-size: 0.85rem; font-weight: 600; flex: 1; color: #cbd5e1; }
                .silice-form .sym-row.wrap-lbl { flex-direction: column; align-items: flex-start; }

                @media (max-width: 768px) {
                    .silice-form .grid-2, .silice-form .grid-3, .silice-form .history-grid { grid-template-columns: 1fr; }
                    .silice-form .sym-row { flex-wrap: wrap; }
                }
            `}</style>
        </div>
    )
}
