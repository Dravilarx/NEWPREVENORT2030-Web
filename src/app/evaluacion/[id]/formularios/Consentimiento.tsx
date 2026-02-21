'use client'
import { FormularioProps, isFieldDisabled } from './types'
import { useRef, useEffect, useState } from 'react'

/**
 * Consentimiento — Carta de Consentimiento Para Examen de Drogas.
 * Documento oficial de Prevenort Centro Médico.
 * - Texto legal fijo (lectura obligatoria)
 * - Declaración de medicamentos (hasta 4)
 * - Fecha automática del día
 * - Firma digital del paciente (canvas)
 * Aplicado por: Administración
 */

function getFechaFormateada(): string {
    const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ]
    const hoy = new Date()
    return `Antofagasta, ${hoy.getDate()} de ${meses[hoy.getMonth()]} año ${hoy.getFullYear()}`
}

export default function Consentimiento({ examId, resultados: res, updateField, isEditable, isFinalizado }: FormularioProps) {
    const disabled = isFieldDisabled(isEditable, isFinalizado)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasFirma, setHasFirma] = useState(false)

    // Auto-set fecha al montar
    useEffect(() => {
        if (!res.consent_fecha) {
            updateField(examId, 'consent_fecha', getFechaFormateada())
        }
        // Si ya tiene firma guardada, marcar
        if (res.consent_firma_data) {
            setHasFirma(true)
            loadSavedSignature()
        }
    }, [])

    // --- Canvas Signature Logic ---
    const getCtx = () => canvasRef.current?.getContext('2d') || null

    const loadSavedSignature = () => {
        if (!res.consent_firma_data || !canvasRef.current) return
        const img = new Image()
        img.onload = () => {
            const ctx = getCtx()
            if (ctx && canvasRef.current) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
                ctx.drawImage(img, 0, 0)
            }
        }
        img.src = res.consent_firma_data
    }

    const initCanvas = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.strokeStyle = '#1a365d'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
    }

    useEffect(() => {
        initCanvas()
        if (res.consent_firma_data) loadSavedSignature()
    }, [canvasRef.current])

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return { x: 0, y: 0 }
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        if ('touches' in e) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY
            }
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        }
    }

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return
        e.preventDefault()
        const ctx = getCtx()
        if (!ctx) return
        const pos = getPos(e)
        ctx.beginPath()
        ctx.moveTo(pos.x, pos.y)
        setIsDrawing(true)
    }

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || disabled) return
        e.preventDefault()
        const ctx = getCtx()
        if (!ctx) return
        const pos = getPos(e)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
    }

    const stopDraw = () => {
        if (!isDrawing) return
        setIsDrawing(false)
        setHasFirma(true)
        // Guardar la firma como data URL
        const canvas = canvasRef.current
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/png')
            updateField(examId, 'consent_firma_data', dataUrl)
        }
    }

    const limpiarFirma = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        setHasFirma(false)
        updateField(examId, 'consent_firma_data', '')
    }

    return (
        <div className="consentimiento-form card glass">
            {/* ─── Encabezado del documento ─── */}
            <div className="consent-header">
                <h3 className="consent-title">Carta de Consentimiento Para Examen de Drogas</h3>
            </div>

            {/* ─── Texto Legal (solo lectura) ─── */}
            <div className="consent-legal-text">
                <p>
                    No ser consumidor de sustancias psicotrópicas (drogas) y acepto realizarme un test
                    en muestra de orina tomada con la supervisión directa del personal de Prevenort, lo
                    que implica su compañía en la realización de la toma de muestra para dar fe que la
                    toma de muestra cumple con los requisitos exigidos de la misma.
                </p>
                <p>
                    Cabe señalar que la información generada a partir de dicho Examen, será entregada
                    exclusivamente a la empresa que me ha enviado a evaluar, y que solo ella es la
                    única responsable de retirar la información obtenida del Análisis efectuado.
                </p>
                <p>
                    Si el análisis ha sido solicitado en forma particular, su resultado será entregado
                    exclusivamente a la persona individualizada en el documento o su tutor legal.
                </p>
                <p>
                    Por su parte, la Empresa Prevenort spa., se compromete a tratar los resultados con
                    la más absoluta confidencialidad. Esto con la finalidad de dar cumplimiento a la
                    normativa legal vigente y en concordancia con el código ético de salud.
                </p>
                <p>
                    La adulteración o falsificación de este certificado y el uso de un certificado falso,
                    constituye &quot;DELITO&quot; penado por la ley, descrito en los artículos 193, 17, 198 del
                    código del trabajo.
                </p>
                <p>
                    A continuación deberá informar si por indicación de algún profesional de la salud,
                    está en tratamiento medicamentoso, lo que declaro a continuación.
                </p>
            </div>

            {/* ─── Declaración de Medicamentos ─── */}
            <div className="consent-meds-section">
                {[1, 2, 3, 4].map(n => (
                    <div key={n} className="consent-med-row">
                        <span className="consent-med-num">{n}.</span>
                        <input
                            type="text"
                            value={res[`consent_med_${n}`] || ''}
                            onChange={(e) => updateField(examId, `consent_med_${n}`, e.target.value)}
                            disabled={disabled}
                            placeholder="Medicamento..."
                            className="consent-med-input"
                        />
                    </div>
                ))}
            </div>

            {/* ─── Fecha ─── */}
            <div className="consent-fecha-section">
                <span className="consent-fecha-text">
                    {res.consent_fecha || getFechaFormateada()}
                </span>
            </div>

            {/* ─── Firma Digital ─── */}
            <div className="consent-firma-section">
                <div className="consent-firma-canvas-wrap">
                    <canvas
                        ref={canvasRef}
                        width={460}
                        height={140}
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
                        <div className="consent-firma-placeholder">
                            ✍️ Firme aquí
                        </div>
                    )}
                </div>
                <p className="consent-firma-caption">Firma de la persona antes individualizada</p>
                {!disabled && hasFirma && (
                    <button className="consent-btn-clear" onClick={limpiarFirma}>
                        Limpiar firma
                    </button>
                )}
            </div>

            {/* ─── Estado ─── */}
            <div className={`romberg-result ${hasFirma ? 'ok' : 'warn'}`}>
                {hasFirma
                    ? '✅ Consentimiento firmado'
                    : '⏳ Pendiente de firma del paciente'}
            </div>

            <style jsx>{`
                .consent-header {
                    text-align: center;
                    margin-bottom: 2rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 2px solid rgba(255,255,255,0.08);
                }

                .consent-title {
                    font-size: 1.1rem;
                    font-weight: 800;
                    letter-spacing: 0.02em;
                    color: #fff;
                    margin: 0;
                }

                .consent-legal-text {
                    padding: 1.5rem;
                    border-radius: 16px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    margin-bottom: 1.5rem;
                    line-height: 1.7;
                }

                .consent-legal-text p {
                    font-size: 0.85rem;
                    margin: 0 0 0.8rem 0;
                    opacity: 0.85;
                    text-align: justify;
                }

                .consent-legal-text p:last-child {
                    margin-bottom: 0;
                }

                .consent-meds-section {
                    padding: 1rem 1.5rem;
                    margin-bottom: 1.5rem;
                }

                .consent-med-row {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    margin-bottom: 0.6rem;
                }

                .consent-med-num {
                    font-weight: 800;
                    font-size: 0.85rem;
                    opacity: 0.5;
                    width: 20px;
                }

                .consent-med-input {
                    flex: 1;
                    background: rgba(255,255,255,0.04) !important;
                    border: none !important;
                    border-bottom: 1px solid rgba(255,255,255,0.12) !important;
                    border-radius: 0 !important;
                    padding: 0.5rem 0.3rem !important;
                    font-size: 0.85rem;
                    color: #fff !important;
                    outline: none;
                    transition: border-color 0.2s;
                }

                .consent-med-input:focus {
                    border-bottom-color: var(--brand-primary, #ff6b2c) !important;
                }

                .consent-fecha-section {
                    margin-bottom: 2rem;
                    padding: 0 1.5rem;
                }

                .consent-fecha-text {
                    font-size: 0.9rem;
                    font-weight: 600;
                    font-style: italic;
                    opacity: 0.7;
                }

                .consent-firma-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .consent-firma-canvas-wrap {
                    position: relative;
                    width: 100%;
                    max-width: 460px;
                }

                .consent-canvas {
                    width: 100%;
                    height: 140px;
                    border: 2px dashed rgba(255,255,255,0.15);
                    border-radius: 12px;
                    cursor: crosshair;
                    background: rgba(255,255,255,0.02);
                    touch-action: none;
                    transition: border-color 0.3s;
                }

                .consent-canvas:hover:not(.disabled) {
                    border-color: var(--brand-primary, #ff6b2c);
                }

                .consent-canvas.disabled {
                    cursor: not-allowed;
                    opacity: 0.6;
                }

                .consent-firma-placeholder {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 1.1rem;
                    opacity: 0.3;
                    pointer-events: none;
                    font-weight: 600;
                }

                .consent-firma-caption {
                    font-size: 0.75rem;
                    font-weight: 700;
                    opacity: 0.4;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    margin-top: 0.6rem;
                    text-align: center;
                }

                .consent-btn-clear {
                    margin-top: 0.5rem;
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    padding: 0.4rem 1rem;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .consent-btn-clear:hover {
                    background: rgba(239, 68, 68, 0.2);
                }
            `}</style>
        </div>
    )
}
