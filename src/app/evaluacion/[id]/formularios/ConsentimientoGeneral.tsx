'use client'
import { FormularioProps, isFieldDisabled } from './types'
import { useRef, useEffect, useState } from 'react'

/**
 * Consentimiento General de Ingreso — Anexo N°1.
 * Documento oficial de Prevenort Centro Médico.
 * 
 * Basado en el documento físico:
 * - Autorización Ley N° 19628 para entrega de resultados al empleador
 * - Autorización a PREVENORT para informar resultados
 * - Derechos del paciente (copia de certificado, 24hrs)
 * - Condiciones de retiro (personal o poder notarial)
 * - "Tomo Conocimiento" + Firma + Fecha
 * 
 * Aplicado por: Administración (ADM-0003)
 */

function getFechaFormateada(): string {
    const hoy = new Date()
    const dd = String(hoy.getDate()).padStart(2, '0')
    const mm = String(hoy.getMonth() + 1).padStart(2, '0')
    const yyyy = hoy.getFullYear()
    return `${dd}/${mm}/${yyyy}`
}

export default function ConsentimientoGeneral({ examId, resultados: res, updateField, isEditable, isFinalizado }: FormularioProps) {
    const disabled = isFieldDisabled(isEditable, isFinalizado)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasFirma, setHasFirma] = useState(false)

    // Auto-set fecha al montar
    useEffect(() => {
        if (!res.cgi_fecha) {
            updateField(examId, 'cgi_fecha', getFechaFormateada())
        }
        if (res.cgi_firma_data) {
            setHasFirma(true)
            loadSavedSignature()
        }
    }, [])

    // --- Canvas Signature Logic ---
    const getCtx = () => canvasRef.current?.getContext('2d') || null

    const loadSavedSignature = () => {
        if (!res.cgi_firma_data || !canvasRef.current) return
        const img = new Image()
        img.onload = () => {
            const ctx = getCtx()
            if (ctx && canvasRef.current) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
                ctx.drawImage(img, 0, 0)
            }
        }
        img.src = res.cgi_firma_data
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
        if (res.cgi_firma_data) loadSavedSignature()
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
        const canvas = canvasRef.current
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/png')
            updateField(examId, 'cgi_firma_data', dataUrl)
        }
    }

    const limpiarFirma = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        setHasFirma(false)
        updateField(examId, 'cgi_firma_data', '')
    }

    return (
        <div className="consentimiento-form card glass">
            {/* ─── Encabezado del documento (idéntico al Consentimiento de Drogas) ─── */}
            <div className="consent-header">
                <div className="consent-logo">
                    <span className="consent-logo-icon">⚕</span>
                    <div>
                        <span className="consent-logo-name">PREVENORT</span>
                        <span className="consent-logo-sub">Centro Médico</span>
                    </div>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, opacity: 0.7, display: 'block' }}>ÁREA MÉDICA</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>Pasaje Isaac Arce #209 · Fono: 2467600</span>
                </div>
                <h3 className="consent-title">Consentimiento Informado</h3>
                <span style={{ fontSize: '0.72rem', opacity: 0.4, fontStyle: 'italic' }}>Anexo N°1 — Ley N° 19.628 sobre Protección de Datos</span>
            </div>

            {/* ─── Texto Legal 1: Autorización Ley 19628 ─── */}
            <div className="consent-legal-text">
                <p>
                    Para dar cumplimiento a lo dispuesto en la ley n° 19.628, se solicita a ud. su autorización
                    para dar a su empleador el o los resultados de los exámenes médicos y/o de Laboratorio que
                    se realice, si estos fueran requeridos.
                </p>
            </div>

            {/* ─── Identificación del paciente ─── */}
            <div className="consent-id-section">
                <div className="consent-id-row">
                    <span className="consent-label-inline">Yo:</span>
                    <span className="consent-value-line">{res.cgi_nombre || '___________________________'}</span>
                </div>
                <div className="consent-id-row">
                    <span className="consent-label-inline">Rut.:</span>
                    <span className="consent-value-line">{res.cgi_rut || '_______________'}</span>
                </div>
            </div>

            {/* ─── Texto Legal 2: Autorización entrega de resultados ─── */}
            <div className="consent-legal-text">
                <p>
                    Autorizo a PREVENORT, a que haga entrega del informe de los resultados de mi examen médico
                    y/o Laboratorio a mi empleador, en caso que fueran requeridos por este.
                </p>
            </div>

            {/* ─── Texto Legal 3: Derechos del paciente ─── */}
            <div className="consent-legal-text">
                <p>
                    Para dar cumplimiento a la Normativa de los derechos del paciente se le informa lo siguiente:
                    Usted tiene derecho a una copia de su certificado y exámenes complementarios, los que estarán
                    disponibles 24 horas después de realizada su evaluación.
                </p>
            </div>

            {/* ─── Texto Legal 4: Condiciones de retiro ─── */}
            <div className="consent-legal-text">
                <p>
                    Debe ser retirado solo por usted, en caso contrario debe entregar un poder notarial para ser
                    entregado a otra persona, donde señale que retira exámenes realizados en nuestro centro en la
                    fecha indicada.
                </p>
            </div>

            {/* ─── Tomo Conocimiento ─── */}
            <div style={{ padding: '1rem 1.5rem', fontWeight: 700, fontSize: '0.95rem', fontStyle: 'italic', opacity: 0.8 }}>
                Tomo Conocimiento
            </div>

            {/* ─── Firma y Fecha ─── */}
            <div className="consent-firma-fecha-row">
                <div className="consent-firma-col">
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
                    <p className="consent-firma-caption">Firma:</p>
                    {!disabled && hasFirma && (
                        <button className="consent-btn-clear" onClick={limpiarFirma}>
                            Limpiar firma
                        </button>
                    )}
                </div>
                <div className="consent-fecha-col">
                    <div className="consent-fecha-value">
                        {res.cgi_fecha || getFechaFormateada()}
                    </div>
                    <p className="consent-firma-caption">Fecha:</p>
                </div>
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

                .consent-logo {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.8rem;
                    margin-bottom: 1.2rem;
                }

                .consent-logo-icon {
                    font-size: 2rem;
                    background: rgba(255,107,44,0.15);
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid rgba(255,107,44,0.3);
                }

                .consent-logo-name {
                    font-size: 1.4rem;
                    font-weight: 900;
                    letter-spacing: 0.15em;
                    display: block;
                    color: var(--brand-primary, #ff6b2c);
                }

                .consent-logo-sub {
                    font-size: 0.75rem;
                    font-weight: 600;
                    opacity: 0.5;
                    letter-spacing: 0.08em;
                    display: block;
                }

                .consent-title {
                    font-size: 1.1rem;
                    font-weight: 800;
                    letter-spacing: 0.02em;
                    color: #fff;
                    margin: 0.8rem 0 0.3rem 0;
                    text-decoration: underline;
                    text-underline-offset: 4px;
                }

                .consent-id-section {
                    margin-bottom: 1.5rem;
                    padding: 1rem;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.02);
                }

                .consent-id-row {
                    display: flex;
                    align-items: baseline;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                    flex-wrap: wrap;
                }

                .consent-label-inline {
                    font-weight: 700;
                    font-size: 0.9rem;
                    white-space: nowrap;
                }

                .consent-value-line {
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: var(--brand-primary, #ff6b2c);
                    border-bottom: 1px solid rgba(255,255,255,0.15);
                    padding-bottom: 2px;
                    min-width: 180px;
                }

                .consent-legal-text {
                    padding: 1.5rem;
                    border-radius: 16px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    margin-bottom: 1rem;
                    line-height: 1.7;
                }

                .consent-legal-text p {
                    font-size: 0.85rem;
                    margin: 0;
                    opacity: 0.85;
                    text-align: justify;
                }

                .consent-firma-fecha-row {
                    display: flex;
                    gap: 2rem;
                    margin-bottom: 1.5rem;
                    flex-wrap: wrap;
                    padding: 0 1rem;
                }

                .consent-firma-col {
                    flex: 1.3;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-width: 240px;
                }

                .consent-fecha-col {
                    flex: 0.7;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-end;
                    min-width: 140px;
                }

                .consent-fecha-value {
                    font-size: 1rem;
                    font-weight: 700;
                    color: #fff;
                    padding: 0.5rem 0;
                    border-bottom: 1px solid rgba(255,255,255,0.15);
                    width: 100%;
                    text-align: center;
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
