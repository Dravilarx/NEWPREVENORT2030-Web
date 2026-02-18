'use client'
import { FormularioProps, isFieldDisabled } from './types'
import { useRef, useEffect, useState } from 'react'

/**
 * CalidadSueno — Cuestionario de Calidad de Sueño (Reemplazo de Epworth)
 * 7 preguntas sobre el último mes + Firma del trabajador.
 */

const PREGUNTAS = [
    {
        id: 'cs_calidad',
        texto: '1. Durante el mes pasado, ¿Cómo consideras la calidad de tu sueño?',
        opciones: ['Muy buena', 'Aceptablemente buena', 'Ligeramente pobre', 'Muy pobre']
    },
    {
        id: 'cs_minutos_dormir',
        texto: '2. ¿Cuántos minutos necesitaste usualmente para dormirte una vez que decidiste ir a dormir?',
        opciones: ['0-20 minutos', '21-30 minutos', '31-60 minutos', 'Más de 60 minutos']
    },
    {
        id: 'cs_despertares',
        texto: '3. Durante los últimos 30 días, ¿Cuántas veces te has despertado cada noche?',
        opciones: ['Ninguna', '1-3 veces', '4-5 veces', 'Más de 5']
    },
    {
        id: 'cs_horas_dormidas',
        texto: '4. ¿Cuántas horas has dormido realmente, sin contar el tiempo que estuviste despierto?',
        opciones: ['8 horas', '6-7 horas', '5-6 horas', 'Menos de 5 horas']
    },
    {
        id: 'cs_sueno_dia',
        texto: '5. Durante el pasado mes, ¿Te sentiste con sueño durante el día?',
        opciones: ['Nunca', 'Un poco', 'Bastante', 'Todo el tiempo']
    },
    {
        id: 'cs_productos_libres',
        texto: '6. ¿Cuántas veces tuviste que tomar algún producto de venta libre para poder dormir?',
        opciones: ['Nunca', '1-7 veces', '8-20 veces', 'Más de 20 veces']
    },
    {
        id: 'cs_sedantes_receta',
        texto: '7. ¿Cuántas veces has tomado medicamentos sedantes de venta bajo receta médica?',
        opciones: ['Ninguna', '1-7 veces', '8-20 veces', 'Más de 20 veces']
    }
]

export default function CalidadSueno({ examId, resultados: res, updateField, isEditable, isFinalizado }: FormularioProps) {
    const disabled = isFieldDisabled(isEditable, isFinalizado)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasFirma, setHasFirma] = useState(false)

    useEffect(() => {
        if (res.cs_firma_worker) {
            setHasFirma(true)
            loadSavedSignature()
        }
    }, [])

    const getCtx = () => canvasRef.current?.getContext('2d') || null

    const loadSavedSignature = () => {
        if (!res.cs_firma_worker || !canvasRef.current) return
        const img = new Image()
        img.onload = () => {
            const ctx = getCtx()
            if (ctx && canvasRef.current) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
                ctx.drawImage(img, 0, 0)
            }
        }
        img.src = res.cs_firma_worker
    }

    const initCanvas = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.strokeStyle = '#6366f1' // Indigo para la firma del trabajador
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
    }

    useEffect(() => {
        initCanvas()
        if (res.cs_firma_worker) loadSavedSignature()
    }, [canvasRef.current])

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return { x: 0, y: 0 }
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        if ('touches' in e) {
            return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
        }
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
    }

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return; e.preventDefault()
        const ctx = getCtx(); if (!ctx) return
        const pos = getPos(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); setIsDrawing(true)
    }
    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || disabled) return; e.preventDefault()
        const ctx = getCtx(); if (!ctx) return
        const pos = getPos(e); ctx.lineTo(pos.x, pos.y); ctx.stroke()
    }
    const stopDraw = () => {
        if (!isDrawing) return; setIsDrawing(false); setHasFirma(true)
        const canvas = canvasRef.current
        if (canvas) updateField(examId, 'cs_firma_worker', canvas.toDataURL('image/png'))
    }
    const limpiarFirma = () => {
        const canvas = canvasRef.current; if (!canvas) return
        const ctx = canvas.getContext('2d'); if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height); setHasFirma(false)
        updateField(examId, 'cs_firma_worker', '')
    }

    return (
        <div className="cs-container card glass">
            <div className="cs-header">
                <span className="cs-icon-main">🌙</span>
                <h3 className="cs-title">CUESTIONARIO DE CALIDAD DE SUEÑO</h3>
                <p className="cs-desc">Responda considerando su actividad durante el último mes.</p>
            </div>

            <div className="cs-questions">
                {PREGUNTAS.map((q) => (
                    <div key={q.id} className="cs-q-block">
                        <label className="cs-q-text">{q.texto}</label>
                        <div className="cs-options-grid">
                            {q.opciones.map((opt) => (
                                <button
                                    key={opt}
                                    className={`cs-opt-btn ${res[q.id] === opt ? 'active' : ''}`}
                                    onClick={() => updateField(examId, q.id, opt)}
                                    disabled={disabled}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="cs-footer">
                <div className="cs-firma-section">
                    <h4 className="cs-firma-title">FIRMA TRABAJADOR</h4>
                    <div className="cs-canvas-wrap">
                        <canvas
                            ref={canvasRef}
                            width={400}
                            height={120}
                            className={`cs-canvas ${disabled ? 'disabled' : ''}`}
                            onMouseDown={startDraw}
                            onMouseMove={draw}
                            onMouseUp={stopDraw}
                            onMouseLeave={stopDraw}
                            onTouchStart={startDraw}
                            onTouchMove={draw}
                            onTouchEnd={stopDraw}
                        />
                        {!hasFirma && !disabled && (
                            <div className="cs-canvas-placeholder">FIRME AQUÍ</div>
                        )}
                    </div>
                    {!disabled && hasFirma && (
                        <button className="cs-btn-clear" onClick={limpiarFirma}>BORRAR FIRMA</button>
                    )}
                </div>
            </div>

            <style jsx>{`
                .cs-container { padding: 2.5rem; }
                
                .cs-header { text-align: center; margin-bottom: 3rem; }
                .cs-icon-main { font-size: 2.5rem; display: block; margin-bottom: 1rem; filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.4)); }
                .cs-title { font-size: 1.5rem; font-weight: 900; color: #fff; letter-spacing: -0.02em; margin-bottom: 0.5rem; }
                .cs-desc { font-size: 0.85rem; opacity: 0.5; font-weight: 600; }

                .cs-questions { display: flex; flex-direction: column; gap: 2.5rem; margin-bottom: 4rem; }
                .cs-q-block { display: flex; flex-direction: column; gap: 1rem; }
                .cs-q-text { font-size: 1rem; font-weight: 700; color: #fff; line-height: 1.4; }
                
                .cs-options-grid { 
                    display: grid; 
                    grid-template-columns: repeat(2, 1fr); 
                    gap: 0.8rem; 
                }

                .cs-opt-btn {
                    padding: 0.8rem 1rem;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-align: left;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                }

                .cs-opt-btn:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                }

                .cs-opt-btn.active {
                    background: #6366f1;
                    color: #fff;
                    border-color: #6366f1;
                    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
                }

                .cs-opt-btn:disabled { cursor: not-allowed; opacity: 0.6; }

                .cs-footer { 
                    border-top: 1px solid rgba(255, 255, 255, 0.1); 
                    padding-top: 3rem; 
                    display: flex; 
                    justify-content: center; 
                }

                .cs-firma-section { text-align: center; width: 100%; max-width: 400px; }
                .cs-firma-title { font-size: 0.7rem; font-weight: 900; opacity: 0.4; letter-spacing: 0.2em; margin-bottom: 1.5rem; text-transform: uppercase; }
                
                .cs-canvas-wrap { 
                    position: relative; 
                    background: #000; 
                    border-radius: 20px; 
                    border: 2px solid rgba(255, 255, 255, 0.05);
                    overflow: hidden;
                    box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);
                }
                
                .cs-canvas { 
                    display: block; 
                    width: 100%; 
                    height: 120px; 
                    cursor: crosshair; 
                    touch-action: none; 
                }

                .cs-canvas-placeholder {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 0.8rem;
                    font-weight: 900;
                    opacity: 0.1;
                    letter-spacing: 0.5em;
                    pointer-events: none;
                }

                .cs-btn-clear {
                    margin-top: 1.5rem;
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    padding: 0.5rem 1.5rem;
                    border-radius: 10px;
                    font-size: 0.7rem;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .cs-btn-clear:hover { background: rgba(239, 68, 68, 0.2); }

                @media (max-width: 600px) {
                    .cs-container { padding: 1.5rem; }
                    .cs-options-grid { grid-template-columns: 1fr; }
                    .cs-title { font-size: 1.2rem; }
                }
            `}</style>
        </div>
    )
}
