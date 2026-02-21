import React, { useMemo } from 'react'
import type { FormularioProps } from './types'

export default function EncuestaAltura({ examId, resultados, updateField, isEditable, isFinalizado }: FormularioProps) {
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

    const inputField = (key: string, placeholder: string = '', type: string = 'text', additionalClass: string = '') => (
        <input
            type={type}
            value={resultados[key] || ''}
            onChange={e => updateField(examId, key, e.target.value)}
            disabled={!isEditable || isFinalizado}
            placeholder={placeholder}
            className={`std-input ${additionalClass}`}
        />
    )

    const sintomaOptions = [
        { label: 'Leve', value: '1' },
        { label: 'Moderado', value: '2' },
        { label: 'Incapacitante', value: '3' }
    ]
    const dormirOptions = [
        { label: 'Leve', value: '1' },
        { label: 'Moderado', value: '2' },
        { label: 'Incapacitante (No duerme)', value: '3' }
    ]

    const renderSintoma = (key: string, label: string, isDormir: boolean = false) => {
        const options = isDormir ? dormirOptions : sintomaOptions;
        return (
            <div className="sym-row">
                <label>{label}</label>
                <div className="flex-si-no mini-opts">
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            className={resultados[key] === opt.value ? 'active' : ''}
                            onClick={() => setOption(key, opt.value)}
                            disabled={!isEditable || isFinalizado}
                        >
                            {opt.label}
                        </button>
                    ))}
                    {resultados[key] && (
                        <button
                            className="clear-btn"
                            onClick={() => setOption(key, '')}
                            disabled={!isEditable || isFinalizado}
                            title="Limpiar"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>
        )
    }

    // Auto calculate Score
    const puntajeTotal = useMemo(() => {
        const keys = ['sint_cefalea', 'sint_nausea', 'sint_fatiga', 'sint_mareo', 'sint_dormir'];
        let total = 0;
        keys.forEach(k => {
            if (resultados[k]) {
                total += parseInt(resultados[k], 10);
            }
        });
        return total;
    }, [resultados]);

    return (
        <div className="altura-form">
            <h3 className="section-title">Encuesta de Exposición a Gran Altitud</h3>

            <div className="card-group">
                <h4 className="card-title">EXPERIENCIA PREVIA EN GRAN ALTITUD (Sobre 3.000 mts sobre el nivel del mar)</h4>
                <div className="grid-1">
                    <div className="field-group row-align fw">
                        <label>¿Tiene experiencia previa?</label>
                        {renderSiNo('exp_previa_altura')}
                    </div>
                </div>

                {resultados.exp_previa_altura === 'SI' && (
                    <div className="grid-2 mt-1">
                        <div className="field-group fw">
                            <label>Dónde:</label>
                            {inputField('exp_previa_donde')}
                        </div>
                        <div className="field-group">
                            <label>Año:</label>
                            {inputField('exp_previa_ano', 'Ej: 2021', 'number')}
                        </div>
                    </div>
                )}
            </div>

            <div className="card-group">
                <h4 className="card-title">TIPO DE EXPOSICIÓN Y ALTURA MÁXIMA</h4>
                <div className="grid-2">
                    <div className="field-group fw">
                        <label>Tipo de Exposición:</label>
                        <div className="flex-si-no">
                            {['Intermitente', 'Permanente', 'Esporádica'].map(tipo => (
                                <button key={tipo} className={resultados.tipo_exposicion === tipo ? 'active' : ''} onClick={() => setOption('tipo_exposicion', tipo)} disabled={!isEditable || isFinalizado}>{tipo}</button>
                            ))}
                        </div>
                    </div>

                    <div className="field-group fw mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                        <label style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Altura Máxima Alcanzada</label>
                        <div className="grid-3">
                            <div className="field-group">
                                <label>Altitud (mts):</label>
                                {inputField('altura_max_altitud', '', 'number')}
                            </div>
                            <div className="field-group">
                                <label>Lugar:</label>
                                {inputField('altura_max_lugar')}
                            </div>
                            <div className="field-group">
                                <label>Tiempo Permanencia:</label>
                                {inputField('altura_max_tiempo')}
                            </div>
                        </div>
                    </div>

                    <div className="field-group fw mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                        <label style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Último Ascenso</label>
                        <div className="grid-4">
                            <div className="field-group">
                                <label>Año:</label>
                                {inputField('ultimo_ascenso_ano', '', 'number')}
                            </div>
                            <div className="field-group">
                                <label>Altitud Alcanzada:</label>
                                {inputField('ultimo_ascenso_altitud', '', 'number')}
                            </div>
                            <div className="field-group">
                                <label>Lugar:</label>
                                {inputField('ultimo_ascenso_lugar')}
                            </div>
                            <div className="field-group">
                                <label>Tiempo:</label>
                                {inputField('ultimo_ascenso_tiempo')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card-group">
                <h4 className="card-title">SÍNTOMAS EN ALTURA</h4>
                <div className="grid-1">
                    <div className="field-group row-align p-blue">
                        <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>¿Ha presentado síntomas en altura?</label>
                        {renderSiNo('sintomas_altura')}
                    </div>

                    {resultados.sintomas_altura === 'SI' && (
                        <div className="sintomas-container">
                            <p className="form-subtitle" style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1rem' }}>
                                Marque la intensidad de los siguientes síntomas:
                            </p>

                            <div className="grid-1 gap-mid text-sm">
                                {renderSintoma('sint_cefalea', 'Dolor de Cabeza (Cefalea)')}
                                {renderSintoma('sint_nausea', 'Disminución de apetito, nausea o vómito')}
                                {renderSintoma('sint_fatiga', 'Fatiga, debilidad')}
                                {renderSintoma('sint_mareo', 'Mareo, vértigo')}
                                {renderSintoma('sint_dormir', 'Dificultad para dormir', true)}
                            </div>

                            <div className="score-summary">
                                <span>Puntaje Total (Auto-calculado interno):</span>
                                <span className="score-val">{puntajeTotal}</span>
                            </div>

                            <div className="field-group fw mt-1">
                                <label>Otros síntomas (describir):</label>
                                {inputField('sint_otros_desc')}
                            </div>

                            <div className="grid-2 mt-2 pt-2 border-t">
                                <div className="field-group row-align">
                                    <label>¿Requirió atención médica?</label>
                                    {renderSiNo('req_atencion')}
                                </div>
                                <div className="field-group row-align">
                                    <label>¿Requirió descenso?</label>
                                    {renderSiNo('req_descenso')}
                                </div>
                                <div className="field-group row-align">
                                    <label>¿Requirió hospitalización?</label>
                                    {renderSiNo('req_hospitalizacion')}
                                </div>
                                <div className="field-group row-align">
                                    <label>¿Hizo ascensos posteriores a estos síntomas?</label>
                                    {renderSiNo('ascensos_posteriores')}
                                </div>
                                <div className="field-group row-align fw">
                                    <label>¿Usa Premedicación (Acetazolamida) para ascender?</label>
                                    {renderSiNo('usa_premedicacion')}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="legal-box mt-2">
                <p>DECLARO QUE MIS RESPUESTAS SON VERDADERAS, ESTOY CONSCIENTE QUE EL OCULTAR O FALSEAR INFORMACIÓN PUEDE CAUSAR DAÑO Y ASUMO LA RESPONSABILIDAD DE ELLO.</p>
                <div className="sig-block">
                    {renderSiNo('acepta_declaracion')}
                    <span className="sig-text">{resultados.acepta_declaracion === 'SI' ? 'Declaración Aceptada' : 'Firma del Trabajador'}</span>
                </div>
            </div>

            <style jsx global>{`
                .altura-form { background: #050505; padding: 1.5rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); color: #fff; }
                .altura-form .section-title { font-size: 1.1rem; font-weight: 900; color: #8b5cf6; margin: 0 0 1.5rem 0; letter-spacing: -0.02em; text-transform: uppercase; }
                
                .altura-form .card-group { background: rgba(255,255,255,0.02); padding: 1.2rem; border-radius: 12px; margin-bottom: 1.2rem; border: 1px solid rgba(255,255,255,0.05); }
                .altura-form .card-title { font-size: 0.85rem; font-weight: 800; margin: 0 0 1.2rem 0; color: #94a3b8; letter-spacing: 0.05em; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem; }
                
                .altura-form .grid-1 { display: grid; grid-template-columns: 1fr; gap: 1rem; }
                .altura-form .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .altura-form .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
                .altura-form .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 1rem; }
                .altura-form .fw { grid-column: 1 / -1; }
                .altura-form .mt-1 { margin-top: 1rem; }
                .altura-form .mt-2 { margin-top: 2rem; }
                .altura-form .pt-2 { padding-top: 1.5rem; }
                .altura-form .border-t { border-top: 1px dashed rgba(255,255,255,0.1); }
                
                .altura-form .field-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .altura-form .field-group label { font-size: 0.8rem; font-weight: 600; color: #cbd5e1; }
                .altura-form .field-group.row-align { flex-direction: row; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.5rem; background: rgba(255,255,255,0.02); border-radius: 8px;}
                
                .altura-form .std-input { background: #111; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.7rem 1rem; color: #fff; font-size: 0.85rem; width: 100%; transition: 0.2s; }
                .altura-form .std-input:focus { outline: none; border-color: #8b5cf6; background: #000; }
                
                .altura-form .flex-si-no { display: flex; gap: 4px; }
                .altura-form .flex-si-no button { flex: 1; min-width: 60px; padding: 0.6rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: #111; color: #fff; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: 0.2s; }
                .altura-form .flex-si-no button.active { background: #8b5cf6; border-color: #8b5cf6; color: #fff; }
                .altura-form .flex-si-no.mini-opts button { font-size: 0.75rem; padding: 0.5rem 0.8rem; white-space: nowrap;}
                .altura-form .flex-si-no .clear-btn { flex: 0 0 auto; min-width: 0; padding: 0.5rem; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #ef4444; border-radius: 8px; font-weight: 400; }
                .altura-form .flex-si-no .clear-btn:hover { background: rgba(239, 68, 68, 0.1); }

                .altura-form .p-blue { background: rgba(139, 92, 246, 0.05); padding: 1rem; border-radius: 8px; border: 1px solid rgba(139, 92, 246, 0.2); }
                
                .altura-form .sintomas-container { margin-top: 1.5rem; padding: 1.5rem; background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
                .altura-form .sym-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.6rem 1rem; background: rgba(255,255,255,0.01); border-radius: 8px; border: 1px solid rgba(255,255,255,0.02); }
                .altura-form .sym-row label { font-size: 0.85rem; font-weight: 600; flex: 1; color: #cbd5e1; margin: 0;}
                .altura-form .text-sm label { font-size: 0.8rem; color: #94a3b8;}

                .altura-form .score-summary { margin-top: 1.5rem; padding: 1rem; display: flex; align-items: center; justify-content: space-between; background: rgba(139, 92, 246, 0.1); border-radius: 8px; border: 1px solid rgba(139, 92, 246, 0.3); }
                .altura-form .score-summary span { font-weight: 700; color: #c4b5fd; font-size: 0.9rem;}
                .altura-form .score-summary .score-val { font-size: 1.2rem; color: #fff; background: rgba(0,0,0,0.5); padding: 0.2rem 1rem; border-radius: 6px; }

                .altura-form .legal-box { border: 1px solid rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 12px; background: rgba(255,255,255,0.02); text-align: center; }
                .altura-form .legal-box p { font-size: 0.75rem; color: #94a3b8; font-weight: 700; margin-bottom: 1.5rem; line-height: 1.5; }
                .altura-form .sig-block { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
                .altura-form .sig-text { font-size: 0.8rem; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }

                @media (max-width: 768px) {
                    .altura-form .grid-2, .altura-form .grid-3, .altura-form .grid-4 { grid-template-columns: 1fr; }
                    .altura-form .sym-row { flex-wrap: wrap; flex-direction: column; align-items: flex-start; gap: 0.5rem;}
                    .altura-form .sym-row .flex-si-no { width: 100%; }
                }
            `}</style>
        </div>
    )
}
