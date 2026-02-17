'use client'
import { FormularioProps, isFieldDisabled } from './types'

/**
 * Romberg — Prueba de Equilibrio / Coordinación.
 * Evalúa el equilibrio estático (ojos abiertos/cerrados),
 * marcha, dedo-nariz y dismetría.
 */

const PRUEBAS_EQUILIBRIO = [
    { field: 'romberg_ojos_abiertos', label: 'Romberg ojos abiertos (30s)' },
    { field: 'romberg_ojos_cerrados', label: 'Romberg ojos cerrados (30s)' },
    { field: 'romberg_sensibilizado', label: 'Romberg sensibilizado (tándem)' },
]

const PRUEBAS_COORDINACION = [
    { field: 'dedo_nariz_der', label: 'Dedo-Nariz derecha' },
    { field: 'dedo_nariz_izq', label: 'Dedo-Nariz izquierda' },
    { field: 'marcha_tandem', label: 'Marcha en tándem (línea recta)' },
    { field: 'nistagmo', label: 'Nistagmo espontáneo' },
]

const RESULTADOS = ['Normal', 'Alterado']

export default function Romberg({ examId, resultados: res, updateField, isEditable, isFinalizado }: FormularioProps) {
    const disabled = isFieldDisabled(isEditable, isFinalizado)

    const allFields = [...PRUEBAS_EQUILIBRIO, ...PRUEBAS_COORDINACION]
    const alterados = allFields.filter(p => res[p.field] === 'Alterado').length
    const respondidos = allFields.filter(p => res[p.field]).length

    return (
        <div className="romberg-form card glass">
            <div className="form-section">
                <h4 className="section-title">⚖️ Equilibrio Estático</h4>
                <div className="romberg-grid">
                    {PRUEBAS_EQUILIBRIO.map(({ field, label }) => (
                        <div key={field} className="romberg-row">
                            <span className="romberg-label">{label}</span>
                            <div className="romberg-options">
                                {RESULTADOS.map(r => (
                                    <button
                                        key={r}
                                        className={`romberg-btn ${res[field] === r ? (r === 'Normal' ? 'active-ok' : 'active-alert') : ''}`}
                                        onClick={() => updateField(examId, field, r)}
                                        disabled={disabled}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="form-section">
                <h4 className="section-title">🎯 Coordinación y Marcha</h4>
                <div className="romberg-grid">
                    {PRUEBAS_COORDINACION.map(({ field, label }) => (
                        <div key={field} className="romberg-row">
                            <span className="romberg-label">{label}</span>
                            <div className="romberg-options">
                                {RESULTADOS.map(r => (
                                    <button
                                        key={r}
                                        className={`romberg-btn ${res[field] === r ? (r === 'Normal' ? 'active-ok' : 'active-alert') : ''}`}
                                        onClick={() => updateField(examId, field, r)}
                                        disabled={disabled}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="form-section">
                <h4 className="section-title">📝 Observaciones</h4>
                <textarea
                    className="romberg-obs"
                    value={res.romberg_obs || ''}
                    onChange={(e) => updateField(examId, 'romberg_obs', e.target.value)}
                    disabled={disabled}
                    placeholder="Observaciones clínicas adicionales..."
                    rows={3}
                />
            </div>

            {respondidos > 0 && (
                <div className={`romberg-result ${alterados > 0 ? 'alert' : 'ok'}`}>
                    {alterados === 0 ? '✅ Todas las pruebas normales' : `⚠️ ${alterados} prueba(s) alterada(s)`}
                </div>
            )}
        </div>
    )
}
