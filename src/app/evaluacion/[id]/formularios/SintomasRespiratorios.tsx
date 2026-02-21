import React from 'react'
import type { FormularioProps } from './types'

export default function SintomasRespiratorios({ examId, resultados, updateField, isEditable, isFinalizado }: FormularioProps) {
    const setScore = (key: string, val: string) => {
        if (!isEditable || isFinalizado) return
        updateField(examId, key, val)
    }

    const setSiNoScore = (key: string, val: string, scoreVal: string) => {
        if (!isEditable || isFinalizado) return
        updateField(examId, key, val)
        updateField(examId, key + '_score', scoreVal)
    }

    const renderButtons = (key: string, options: { label: string, val: string, score: string }[]) => (
        <div className="flex-score">
            {options.map(opt => (
                <button
                    key={opt.val}
                    className={resultados[key] === opt.val ? 'active' : ''}
                    onClick={() => setSiNoScore(key, opt.val, opt.score)}
                    disabled={!isEditable || isFinalizado}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    )

    return (
        <div className="sintomas-resp-form">
            <h3 className="section-title">Encuesta sobre Síntomas Respiratorios (ADM-00-005)</h3>

            {/* SIBILANCIas */}
            <div className="q-group">
                <h4>1. ¿HA SENTIDO QUE LE SILBE EL PECHO?</h4>
                <div className="sub-q">
                    <label>a. ¿Alguna vez cuando está resfriado?</label>
                    {renderButtons('q1a', [{ label: 'SÍ', val: 'SI', score: '1' }, { label: 'NO', val: 'NO', score: '0' }])}
                </div>
                <div className="sub-q">
                    <label>b. ¿Alguna vez sin estar resfriado?</label>
                    {renderButtons('q1b', [{ label: 'SÍ', val: 'SI', score: '2' }, { label: 'NO', val: 'NO', score: '0' }])}
                </div>
                <div className="sub-q">
                    <label>c. ¿La mayor parte de los días o de las noches?</label>
                    {renderButtons('q1c', [{ label: 'SÍ', val: 'SI', score: '3' }, { label: 'NO', val: 'NO', score: '0' }])}
                </div>
            </div>

            <div className="q-group">
                <div className="sub-q">
                    <label>2. ¿POR CUÁNTOS AÑOS HA TENIDO ESTOS SILBIDOS?</label>
                    <input type="number" value={resultados.q2 || ''} onChange={e => setScore('q2', e.target.value)} disabled={!isEditable || isFinalizado} placeholder="Años" />
                </div>
                <div className="sub-q">
                    <label>3. ¿LOS SILBIDOS LOS TIENE DESDE ANTES DE LA EXPOSICIÓN?</label>
                    {renderButtons('q3', [{ label: 'SÍ', val: 'SI', score: '0' }, { label: 'NO', val: 'NO', score: '2' }])}
                </div>
                <div className="sub-q">
                    <label>4. ¿HA TENIDO ALGUNA VEZ UN ATAQUE DE SILBIDOS JUNTO CON LA SENSACIÓN DE QUE LE FALTA EL AIRE?</label>
                    {renderButtons('q4', [{ label: 'SÍ', val: 'SI', score: '1' }, { label: 'NO', val: 'NO', score: '0' }])}
                </div>
                <div className="sub-q">
                    <label>5. ¿HA TENIDO USTED 2 O MÁS ATAQUES SIMILARES?</label>
                    {renderButtons('q5', [{ label: 'SÍ', val: 'SI', score: '1' }, { label: 'NO', val: 'NO', score: '0' }])}
                </div>
                <div className="sub-q">
                    <label>6. ¿HA NECESITADO TRATAMIENTO MÉDICO PARA ESTOS ATAQUES ALGUNA VEZ?</label>
                    {renderButtons('q6', [{ label: 'SÍ', val: 'SI', score: '1' }, { label: 'NO', val: 'NO', score: '0' }])}
                </div>
            </div>

            {/* RESFRÍOS */}
            <h3 className="section-title mt">Preguntas sobre RESFRÍOS</h3>

            <div className="q-group">
                <div className="sub-q">
                    <label>7. ¿CUÁNTO LE DURAN LOS RESFRÍOS?</label>
                    {renderButtons('q7', [{ label: 'días', val: 'dias', score: '0' }, { label: 'semanas', val: 'semanas', score: '1' }, { label: 'meses', val: 'meses', score: '2' }])}
                </div>
                <div className="sub-q">
                    <label>8. ¿CUÁNTAS VECES SE RESFRÍA AL AÑO?</label>
                    {renderButtons('q8', [{ label: '1 vez', val: '1', score: '0' }, { label: '2 a 3', val: '2-3', score: '1' }, { label: '4 o más', val: '4+', score: '2' }])}
                </div>
                <div className="sub-q">
                    <label>9. ¿SE RESFRÍA USTED EN VERANO?</label>
                    {renderButtons('q9', [{ label: 'SÍ', val: 'SI', score: '1' }, { label: 'NO', val: 'NO', score: '2' }])}
                </div>
                <div className="sub-q">
                    <label>11. SI USTED SE RESFRÍA, ¿ES HABITUAL QUE EL RESFRÍO SE LE PASE A LOS BRONQUIOS?</label>
                    {renderButtons('q11', [{ label: 'SÍ', val: 'SI', score: '1' }, { label: 'NO', val: 'NO', score: '0' }])}
                </div>
                <div className="sub-q">
                    <label>12. ¿HA TENIDO ALGUNA VEZ ATAQUES DE ESTORNUDOS?</label>
                    {renderButtons('q12', [{ label: 'SÍ', val: 'SI', score: '1' }, { label: 'NO', val: 'NO', score: '0' }])}
                </div>
                <div className="sub-q">
                    <label>13. AL FINAL DE UN ATAQUE DE ESTORNUDOS, ¿SE SALE AGUA POR LA NARIZ?</label>
                    {renderButtons('q13', [{ label: 'SÍ', val: 'SI', score: '1' }, { label: 'NO', val: 'NO', score: '0' }])}
                </div>
            </div>

            {/* TOS */}
            <h3 className="section-title mt">Preguntas sobre TOS</h3>
            <div className="q-group">
                <div className="sub-q">
                    <label>14. ¿TOSE USTED?</label>
                    {renderButtons('q14', [{ label: 'SÍ', val: 'SI', score: '1' }, { label: 'NO', val: 'NO', score: '0' }, { label: 'SÍ, sólo cuando estoy resfriado', val: 'SI_resf', score: '0' }])}
                </div>
                <div className="sub-q">
                    <label>15. ¿TOSE AL LEVANTARSE?</label>
                    {renderButtons('q15', [{ label: 'SÍ', val: 'SI', score: '1' }, { label: 'NO', val: 'NO', score: '0' }])}
                </div>
                <div className="sub-q">
                    <label>16. ¿CUÁNTOS DÍAS A LA SEMANA PRESENTA ESA TOS?</label>
                    {renderButtons('q16', [{ label: '1 día', val: '1', score: '0' }, { label: '2 a 3 días', val: '2-3', score: '1' }, { label: '4 o más', val: '4+', score: '2' }])}
                </div>
                <div className="sub-q">
                    <label>17. ¿CUÁNTAS VECES AL DÍA TIENE TOS?</label>
                    {renderButtons('q17', [{ label: '1 a 3 días', val: '1-3', score: '0' }, { label: '4 a 6 días', val: '4-6', score: '1' }, { label: '7 o más', val: '7+', score: '2' }])}
                </div>
                <div className="sub-q">
                    <label>20. ¿DESDE HACE CUÁNTOS AÑOS QUE USTED TOSE ASÍ?</label>
                    <input type="number" value={resultados.q20 || ''} onChange={e => setScore('q20', e.target.value)} disabled={!isEditable || isFinalizado} placeholder="Años" />
                </div>
                <div className="sub-q">
                    <label>21. ¿LA TOS LA TIENE DESDE ANTES DEL INICIO DE LA EXPOSICIÓN LABORAL?</label>
                    {renderButtons('q21', [{ label: 'SÍ', val: 'SI', score: '0' }, { label: 'NO', val: 'NO', score: '2' }])}
                </div>
            </div>

            {/* EXPECTORACIÓN */}
            <h3 className="section-title mt">Preguntas sobre EXPECTORACIÓN</h3>
            <div className="q-group">
                <div className="sub-q">
                    <label>22. ¿TIENE USTED EXPECTORACIÓN?</label>
                    {renderButtons('q22', [{ label: 'SÍ', val: 'SI', score: '1' }, { label: 'NO', val: 'NO', score: '0' }, { label: 'SÍ, sólo cuando estoy resfriado', val: 'SI_resf', score: '0' }])}
                </div>
                <div className="sub-q">
                    <label>23. ¿TIENE EXPECTORACIÓN AL LEVANTARSE?</label>
                    {renderButtons('q23', [{ label: 'SÍ', val: 'SI', score: '1' }, { label: 'NO', val: 'NO', score: '0' }])}
                </div>
                <div className="sub-q">
                    <label>24. ¿CUÁNTOS DÍAS A LA SEMANA PRESENTA EXPECTORACIÓN?</label>
                    {renderButtons('q24', [{ label: '1 día', val: '1', score: '0' }, { label: '2 a 3 días', val: '2-3', score: '1' }, { label: '4 o más', val: '4+', score: '2' }])}
                </div>
                <div className="sub-q">
                    <label>25. ¿CUÁNTAS VECES AL DÍA TIENE EXPECTORACIÓN?</label>
                    {renderButtons('q25', [{ label: '1 a 3 días', val: '1-3', score: '0' }, { label: '4 a 6 días', val: '4-6', score: '1' }, { label: '7 o más', val: '7+', score: '2' }])}
                </div>
                <div className="sub-q">
                    <label>28. ¿DESDE HACE CUÁNTOS AÑOS QUE USTED EXPECTORA?</label>
                    <input type="number" value={resultados.q28 || ''} onChange={e => setScore('q28', e.target.value)} disabled={!isEditable || isFinalizado} placeholder="Años" />
                </div>
                <div className="sub-q">
                    <label>29. ¿LA EXPECTORACIÓN LA TIENE DESDE ANTES DEL INICIO DE LA EXPOSICIÓN LABORAL?</label>
                    {renderButtons('q29', [{ label: 'SÍ', val: 'SI', score: '0' }, { label: 'NO', val: 'NO', score: '2' }])}
                </div>
            </div>

            {/* TOS Y EXPECTORACIÓN */}
            <h3 className="section-title mt">Preguntas sobre TOS Y EXPECTORACIÓN</h3>
            <p className="form-subtitle" style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '-0.8rem', marginBottom: '1.5rem' }}>
                El encuestado debe entender que la pregunta se refiere a períodos de enfermedad, como resfríos, bronquitis o neumonías, en los que APARECE o AUMENTA la tos y expectoración.
            </p>
            <div className="q-group">
                <div className="sub-q">
                    <label>30. ¿HA TENIDO BROTES DE TOS Y EXPECTORACIÓN EN LOS ÚLTIMOS AÑOS?</label>
                    {renderButtons('q30', [{ label: 'SÍ', val: 'SI', score: '1' }, { label: 'NO', val: 'NO', score: '0' }])}
                </div>
                <div className="sub-q">
                    <label>31. ¿CUÁNTOS BROTES HA TENIDO EN LOS ÚLTIMOS DOS AÑOS?</label>
                    {renderButtons('q31', [{ label: '1 a 2', val: '1-2', score: '0' }, { label: '3 a 4', val: '3-4', score: '1' }, { label: '5 a 6', val: '5-6', score: '2' }, { label: '7 o más', val: '7+', score: '3' }])}
                </div>
                <div className="sub-q">
                    <label>32. NORMALMENTE, ¿CUÁNTAS SEMANAS LE DURAN ESTOS BROTES?</label>
                    {renderButtons('q32', [{ label: '0 a 1', val: '0-1', score: '0' }, { label: '2 a 3', val: '2-3', score: '1' }, { label: '4 o más', val: '4+', score: '2' }])}
                </div>
            </div>

            <style jsx global>{`
                .sintomas-resp-form { background: #050505; padding: 1.5rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); color: #fff; }
                .sintomas-resp-form .section-title { font-size: 1rem; font-weight: 900; color: #10b981; margin: 0 0 1rem 0; letter-spacing: -0.02em; text-transform: uppercase; }
                .sintomas-resp-form .mt { margin-top: 2rem; }
                .sintomas-resp-form .q-group { background: rgba(255,255,255,0.02); padding: 1.2rem; border-radius: 12px; margin-bottom: 1rem; border: 1px solid rgba(255,255,255,0.05); }
                .sintomas-resp-form h4 { font-size: 0.9rem; margin: 0 0 1.2rem 0; color: #e2e8f0; }
                .sintomas-resp-form .sub-q { display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 1.5rem; }
                .sintomas-resp-form .sub-q:last-child { margin-bottom: 0; }
                .sintomas-resp-form .sub-q label { font-size: 0.85rem; font-weight: 600; color: #cbd5e1; line-height: 1.4; }
                .sintomas-resp-form .sub-q input { background: #111; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.8rem 1rem; color: #fff; width: 100%; max-width: 200px; font-size: 0.9rem; }
                .sintomas-resp-form .flex-score { display: flex; flex-wrap: wrap; gap: 0.5rem; }
                .sintomas-resp-form .flex-score button { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.8rem 1rem; background: #111; border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 8px; font-weight: 800; font-size: 0.85rem; cursor: pointer; transition: 0.2s; min-width: 100px; text-transform: uppercase; }
                .sintomas-resp-form .flex-score button:hover { background: rgba(255,255,255,0.05); }
                .sintomas-resp-form .flex-score button.active { background: #10b981; color: #000; border-color: #10b981; }
            `}</style>
        </div>
    )
}
