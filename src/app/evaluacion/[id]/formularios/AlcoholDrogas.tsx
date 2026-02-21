'use client'
import { FormularioProps, isFieldDisabled } from './types'
import { useRef, useEffect, useState } from 'react'

/**
 * AlcoholDrogas — Formulario "DETECCIÓN DE ALCOHOL Y DROGAS EN ORINA" (LAB-0003)
 */

const DROGAS = [
    { id: 'ad_alcohol', label: 'ALCOHOL' },
    { id: 'ad_anfetamina', label: 'ANFETAMINA' },
    { id: 'ad_benzodiazepina', label: 'BENZODIAZEPINA' },
    { id: 'ad_barbituricos', label: 'BARBITURICOS' },
    { id: 'ad_cocaina', label: 'COCAÍNA' },
    { id: 'ad_marihuana', label: 'MARIHUANA' },
    { id: 'ad_opiaceos', label: 'OPIACEOS' },
]

function getFechaFormateada(): string {
    const hoy = new Date()
    return hoy.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}

export default function AlcoholDrogas({ examId, resultados: res, updateField, isEditable, isFinalizado }: FormularioProps) {
    const disabled = isFieldDisabled(isEditable, isFinalizado)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasFirma, setHasFirma] = useState(false)

    useEffect(() => {
        if (res.ad_firma_data) {
            setHasFirma(true)
            loadSavedSignature()
        }
    }, [])

    const getCtx = () => canvasRef.current?.getContext('2d') || null

    const loadSavedSignature = () => {
        if (!res.ad_firma_data || !canvasRef.current) return
        const img = new Image()
        img.onload = () => {
            const ctx = getCtx()
            if (ctx && canvasRef.current) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
                ctx.drawImage(img, 0, 0)
            }
        }
        img.src = res.ad_firma_data
    }

    const initCanvas = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.strokeStyle = '#8b5cf6'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
    }

    useEffect(() => {
        initCanvas()
        if (res.ad_firma_data) loadSavedSignature()
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
        if (canvas) updateField(examId, 'ad_firma_data', canvas.toDataURL('image/png'))
    }
    const limpiarFirma = () => {
        const canvas = canvasRef.current; if (!canvas) return
        const ctx = canvas.getContext('2d'); if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height); setHasFirma(false)
        updateField(examId, 'ad_firma_data', '')
    }

    return (
        <div className="ad-content card glass">
            {/* Cabecera */}
            <div className="ad-header">
                <h3 className="ad-title">DETECCIÓN DE ALCOHOL Y DROGAS EN ORINA</h3>
                <div className="ad-header-divider" />
            </div>

            {/* Resultados */}
            <div className="ad-section">
                <div className="ad-section-header">
                    <span className="ad-section-icon">📊</span>
                    <h4 className="ad-section-title">RESULTADOS DE SCREENING</h4>
                </div>

                <div className="ad-table">
                    <div className="ad-table-head">
                        <div>DESCRIPCIÓN DE LA DROGA</div>
                        <div className="text-center">RESULTADO FINAL</div>
                    </div>

                    {DROGAS.map(droga => (
                        <div key={droga.id} className="ad-table-row">
                            <div className="ad-droga-name">{droga.label}</div>
                            <div className="ad-droga-btns">
                                <div className="ad-toggle-group">
                                    <button
                                        className={`ad-toggle-btn btn-neg ${res[droga.id] === 'Negativo' ? 'active' : ''}`}
                                        onClick={() => updateField(examId, droga.id, 'Negativo')}
                                        disabled={disabled}
                                    >
                                        NEGATIVO
                                    </button>
                                    <button
                                        className={`ad-toggle-btn btn-pos ${res[droga.id] === 'Positivo' ? 'active' : ''}`}
                                        onClick={() => updateField(examId, droga.id, 'Positivo')}
                                        disabled={disabled}
                                    >
                                        POSITIVO
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Observaciones */}
            <div className="ad-section">
                <div className="ad-section-header">
                    <span className="ad-section-icon">📝</span>
                    <h4 className="ad-section-title">OBSERVACIONES Y NOTAS</h4>
                </div>
                <textarea
                    value={res.ad_obs || ''}
                    onChange={e => updateField(examId, 'ad_obs', e.target.value)}
                    disabled={disabled}
                    placeholder="Ingrese observaciones si existen resultados positivos o hallazgos relevantes..."
                    rows={3}
                />
            </div>

            {/* Firma y Responsable */}
            <div className="ad-section ad-responsable-box">
                <h4 className="ad-section-title">FIRMA DEL RESPONSABLE</h4>
                <div className="ad-resp-grid">
                    <div className="ad-field">
                        <label>NOMBRE PROFESIONAL</label>
                        <input type="text" value={res.ad_resp_nombre || ''} onChange={e => updateField(examId, 'ad_resp_nombre', e.target.value)} disabled={disabled} />
                    </div>
                    <div className="ad-field">
                        <label>RUT/CARGO</label>
                        <input type="text" value={res.ad_resp_rut || ''} onChange={e => updateField(examId, 'ad_resp_rut', e.target.value)} disabled={disabled} />
                    </div>
                </div>

                <div className="ad-firma-wrap">
                    <div className="consent-firma-canvas-wrap">
                        <canvas
                            ref={canvasRef}
                            width={400}
                            height={120}
                            className={`consent-canvas ${disabled ? 'disabled' : ''}`}
                            onMouseDown={startDraw}
                            onMouseMove={draw}
                            onMouseUp={stopDraw}
                            onMouseLeave={stopDraw}
                            onTouchStart={startDraw}
                            onTouchMove={draw}
                            onTouchEnd={stopDraw}
                        />
                        {!hasFirma && !disabled && (
                            <div className="consent-firma-placeholder">RECUADRO PARA FIRMA DIGITAL</div>
                        )}
                    </div>
                    {!disabled && hasFirma && (
                        <button className="consent-btn-clear" onClick={limpiarFirma}>BORRAR FIRMA</button>
                    )}
                </div>
            </div>

            {isFinalizado && (
                <div className="ad-finalizado">
                    <span>EXAMEN FINALIZADO ✅</span>
                </div>
            )}

            <style jsx>{`
                .ad-content { padding: 2rem; }
                
                .ad-header { text-align: center; margin-bottom: 2.5rem; }
                .ad-title { font-size: 1.4rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; margin-bottom: 0.5rem; }
                .ad-header-divider { height: 2px; width: 60px; background: #8b5cf6; margin: 1.5rem auto 0; border-radius: 2px; opacity: 0.5; }

                .ad-section { margin-bottom: 2.5rem; }
                .ad-section-header { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1.2rem; }
                .ad-section-icon { font-size: 1rem; opacity: 0.6; }
                .ad-section-title { font-size: 0.75rem; font-weight: 900; opacity: 0.5; letter-spacing: 0.1em; text-transform: uppercase; }

                .ad-grid { display: grid; gap: 1rem; background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
                .ad-grid-2 { grid-template-columns: 1fr 1fr; }
                .ad-field.full-width { grid-column: span 2; }
                .ad-field label { font-size: 0.65rem; font-weight: 800; opacity: 0.4; display: block; margin-bottom: 0.4rem; padding-left: 0.2rem; }
                .ad-field input { 
                    background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; 
                    padding: 0.8rem 1rem; color: #fff; width: 100%; font-size: 0.95rem; font-weight: 600;
                    transition: all 0.2s;
                }
                .ad-field input:focus { border-color: #8b5cf6; background: rgba(0,0,0,0.5); outline: none; box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1); }

                .ad-table { border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
                .ad-table-head { 
                    display: grid; grid-template-columns: 1fr 280px; background: rgba(139, 92, 246, 0.2);
                    padding: 1rem 1.5rem; font-size: 0.75rem; font-weight: 900; color: #a78bfa; letter-spacing: 0.1em;
                }
                .ad-table-row { 
                    display: grid; grid-template-columns: 1fr 280px; 
                    border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.01);
                }
                .ad-table-row:last-child { border-bottom: none; }
                .ad-droga-name { padding: 1.2rem 1.5rem; font-size: 0.95rem; font-weight: 800; color: #fff; display: flex; align-items: center; border-right: 1px solid rgba(255,255,255,0.05); }
                .ad-droga-btns { padding: 0.6rem; display: flex; align-items: center; justify-content: center; }

                /* Toggle Group Design */
                .ad-toggle-group {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.5rem;
                    width: 100%;
                }
                .ad-toggle-btn {
                    padding: 0.6rem;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 900;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(0,0,0,0.3);
                    color: rgba(255,255,255,0.3);
                    letter-spacing: 0.05em;
                    text-align: center;
                }
                .ad-toggle-btn:hover:not(:disabled) {
                    background: rgba(255,255,255,0.05);
                    border-color: rgba(255,255,255,0.2);
                }
                .ad-toggle-btn.active.btn-neg {
                    background: #10b981;
                    color: #fff;
                    border-color: #10b981;
                    box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
                }
                .ad-toggle-btn.active.btn-pos {
                    background: #ef4444;
                    color: #fff;
                    border-color: #ef4444;
                    box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
                }
                .ad-toggle-btn:disabled {
                    cursor: not-allowed;
                    opacity: 0.5;
                }

                textarea { 
                    background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; 
                    padding: 1.2rem; color: #fff; width: 100%; font-family: inherit; font-size: 0.9rem; resize: none;
                    transition: all 0.2s;
                }
                textarea:focus { border-color: #8b5cf6; outline: none; }

                .ad-responsable-box { background: rgba(139, 92, 246, 0.05); padding: 1.5rem; border-radius: 20px; border: 1px solid rgba(139, 92, 246, 0.1); }
                .ad-resp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
                
                .ad-firma-wrap { display: flex; flex-direction: column; align-items: center; }
                .consent-firma-canvas-wrap { position: relative; width: 100%; max-width: 400px; background: #000; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); }
                .consent-canvas { width: 100%; height: 120px; cursor: crosshair; touch-action: none; border-radius: 16px; }
                .consent-firma-placeholder { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.7rem; font-weight: 800; opacity: 0.2; pointer-events: none; letter-spacing: 0.2em; }
                .consent-btn-clear { margin-top: 1rem; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); padding: 0.4rem 1.2rem; border-radius: 8px; font-size: 0.7rem; font-weight: 800; cursor: pointer; text-transform: uppercase; }

                .ad-finalizado { margin-top: 3rem; text-align: center; background: rgba(16, 185, 129, 0.2); padding: 1rem; border-radius: 12px; border: 1px solid #10b981; color: #10b981; font-weight: 900; letter-spacing: 0.1em; }

                @media (max-width: 768px) {
                    .ad-grid-2, .ad-resp-grid { grid-template-columns: 1fr; }
                    .ad-field.full-width { grid-column: span 1; }
                    .ad-table-head, .ad-table-row { grid-template-columns: 1fr 200px; }
                }
            `}</style>
        </div>
    )
}
