'use client'
import { FormularioProps, isFieldDisabled } from './types'

/**
 * EscalaEpworth — Escala de Somnolencia de Epworth.
 * 8 situaciones, cada una de 0 a 3.
 * Puntuación total 0-24. ≥10 = somnolencia excesiva.
 */

const SITUACIONES = [
    'Sentado leyendo',
    'Viendo televisión',
    'Sentado inactivo en lugar público (cine, reunión)',
    'Pasajero en auto durante 1 hora sin parar',
    'Acostado descansando por la tarde',
    'Sentado conversando con alguien',
    'Sentado después de comer (sin alcohol)',
    'En un auto detenido por tráfico unos minutos',
]

const OPCIONES = [
    { value: '0', label: '0 - Nunca' },
    { value: '1', label: '1 - Leve' },
    { value: '2', label: '2 - Moderada' },
    { value: '3', label: '3 - Alta' },
]

export default function EscalaEpworth({ examId, resultados: res, updateField, isEditable, isFinalizado }: FormularioProps) {
    const disabled = isFieldDisabled(isEditable, isFinalizado)

    const total = SITUACIONES.reduce((sum, _, i) => {
        const val = res[`epworth_${i}`]
        return sum + (val ? Number(val) : 0)
    }, 0)

    const allAnswered = SITUACIONES.every((_, i) => res[`epworth_${i}`] !== undefined && res[`epworth_${i}`] !== '')

    const getInterpretacion = (score: number) => {
        if (score <= 5) return { text: 'Normal - Sin somnolencia', color: '#10b981' }
        if (score <= 9) return { text: 'Somnolencia leve', color: '#f59e0b' }
        if (score <= 15) return { text: 'Somnolencia moderada', color: '#f97316' }
        return { text: 'Somnolencia severa', color: '#ef4444' }
    }

    const interp = getInterpretacion(total)

    return (
        <div className="epworth-form card glass">
            <div className="form-subtitle">Probabilidad de quedarse dormido en cada situación (0-3)</div>
            <div className="epworth-grid">
                {SITUACIONES.map((sit, i) => (
                    <div key={i} className="epworth-row">
                        <span className="epworth-label">{i + 1}. {sit}</span>
                        <div className="epworth-options">
                            {OPCIONES.map(opt => (
                                <button
                                    key={opt.value}
                                    className={`epworth-btn ${res[`epworth_${i}`] === opt.value ? 'active' : ''}`}
                                    onClick={() => updateField(examId, `epworth_${i}`, opt.value)}
                                    disabled={disabled}
                                    title={opt.label}
                                >
                                    {opt.value}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="epworth-result" style={{ borderColor: interp.color }}>
                <span className="epworth-score">Puntaje: <strong>{allAnswered ? total : '--'}</strong> / 24</span>
                {allAnswered && (
                    <span className="epworth-interp" style={{ color: interp.color }}>{interp.text}</span>
                )}
            </div>
        </div>
    )
}
