'use client'
import { FormularioProps, isFieldDisabled } from './types'

/**
 * Framingham — Score de Riesgo Cardiovascular simplificado.
 * Captura factores de riesgo y calcula riesgo a 10 años.
 */

export default function Framingham({ examId, resultados: res, updateField, isEditable, isFinalizado }: FormularioProps) {
    const disabled = isFieldDisabled(isEditable, isFinalizado)

    const calcularRiesgo = () => {
        const edad = Number(res.fram_edad) || 0
        const colTotal = Number(res.fram_colesterol) || 0
        const hdl = Number(res.fram_hdl) || 0
        const paSis = Number(res.fram_pa_sistolica) || 0
        const fuma = res.fram_fuma === 'SI'
        const diabetes = res.fram_diabetes === 'SI'

        if (!edad || !colTotal || !hdl || !paSis) return null

        let puntos = 0
        // Edad
        if (edad < 35) puntos += 0
        else if (edad < 40) puntos += 2
        else if (edad < 45) puntos += 5
        else if (edad < 50) puntos += 6
        else if (edad < 55) puntos += 8
        else if (edad < 60) puntos += 10
        else if (edad < 65) puntos += 11
        else if (edad < 70) puntos += 12
        else puntos += 14

        // Colesterol
        if (colTotal < 160) puntos += 0
        else if (colTotal < 200) puntos += 1
        else if (colTotal < 240) puntos += 2
        else if (colTotal < 280) puntos += 3
        else puntos += 4

        // HDL
        if (hdl >= 60) puntos -= 2
        else if (hdl >= 50) puntos -= 1
        else if (hdl >= 40) puntos += 0
        else puntos += 2

        // PA Sistólica
        if (paSis < 120) puntos += 0
        else if (paSis < 130) puntos += 1
        else if (paSis < 140) puntos += 2
        else if (paSis < 160) puntos += 3
        else puntos += 4

        if (fuma) puntos += 4
        if (diabetes) puntos += 3

        // Interpretación
        let riesgo = '<5%'
        let color = '#10b981'
        if (puntos >= 20) { riesgo = '>30%'; color = '#dc2626' }
        else if (puntos >= 16) { riesgo = '20-30%'; color = '#ef4444' }
        else if (puntos >= 12) { riesgo = '10-20%'; color = '#f97316' }
        else if (puntos >= 8) { riesgo = '5-10%'; color = '#f59e0b' }

        return { puntos, riesgo, color }
    }

    const resultado = calcularRiesgo()

    return (
        <div className="framingham-form card glass">
            <div className="form-subtitle">Factores de Riesgo Cardiovascular</div>

            <div className="fram-grid">
                <div className="fram-item">
                    <label>Edad (años)</label>
                    <input type="number" value={res.fram_edad || ''} onChange={(e) => updateField(examId, 'fram_edad', e.target.value)} disabled={disabled} />
                </div>
                <div className="fram-item">
                    <label>Sexo</label>
                    <div className="flex-si-no">
                        <button className={res.fram_sexo === 'M' ? 'active' : ''} onClick={() => updateField(examId, 'fram_sexo', 'M')} disabled={disabled}>Masculino</button>
                        <button className={res.fram_sexo === 'F' ? 'active' : ''} onClick={() => updateField(examId, 'fram_sexo', 'F')} disabled={disabled}>Femenino</button>
                    </div>
                </div>
                <div className="fram-item">
                    <label>Colesterol Total (mg/dL)</label>
                    <input type="number" value={res.fram_colesterol || ''} onChange={(e) => updateField(examId, 'fram_colesterol', e.target.value)} disabled={disabled} />
                </div>
                <div className="fram-item">
                    <label>HDL (mg/dL)</label>
                    <input type="number" value={res.fram_hdl || ''} onChange={(e) => updateField(examId, 'fram_hdl', e.target.value)} disabled={disabled} />
                </div>
                <div className="fram-item">
                    <label>PA Sistólica (mmHg)</label>
                    <input type="number" value={res.fram_pa_sistolica || ''} onChange={(e) => updateField(examId, 'fram_pa_sistolica', e.target.value)} disabled={disabled} />
                </div>
                <div className="fram-item">
                    <label>¿Fuma?</label>
                    <div className="flex-si-no">
                        <button className={res.fram_fuma === 'SI' ? 'active' : ''} onClick={() => updateField(examId, 'fram_fuma', 'SI')} disabled={disabled}>SI</button>
                        <button className={res.fram_fuma === 'NO' ? 'active' : ''} onClick={() => updateField(examId, 'fram_fuma', 'NO')} disabled={disabled}>NO</button>
                    </div>
                </div>
                <div className="fram-item">
                    <label>¿Diabetes?</label>
                    <div className="flex-si-no">
                        <button className={res.fram_diabetes === 'SI' ? 'active' : ''} onClick={() => updateField(examId, 'fram_diabetes', 'SI')} disabled={disabled}>SI</button>
                        <button className={res.fram_diabetes === 'NO' ? 'active' : ''} onClick={() => updateField(examId, 'fram_diabetes', 'NO')} disabled={disabled}>NO</button>
                    </div>
                </div>
                <div className="fram-item">
                    <label>¿Trata HTA?</label>
                    <div className="flex-si-no">
                        <button className={res.fram_trata_hta === 'SI' ? 'active' : ''} onClick={() => updateField(examId, 'fram_trata_hta', 'SI')} disabled={disabled}>SI</button>
                        <button className={res.fram_trata_hta === 'NO' ? 'active' : ''} onClick={() => updateField(examId, 'fram_trata_hta', 'NO')} disabled={disabled}>NO</button>
                    </div>
                </div>
            </div>

            {resultado && (
                <div className="fram-result" style={{ borderColor: resultado.color }}>
                    <div className="fram-score">
                        <span>Puntos: <strong>{resultado.puntos}</strong></span>
                    </div>
                    <div className="fram-riesgo" style={{ color: resultado.color }}>
                        Riesgo CV a 10 años: <strong>{resultado.riesgo}</strong>
                    </div>
                </div>
            )}
        </div>
    )
}
