'use client'
import { FormularioProps, isFieldDisabled } from './types'
import { useRef, useEffect, useState } from 'react'

/**
 * SignosVitales — "CONTROL DE SIGNOS VITALES" (CLI-0002)
 * 
 * Replica la ficha física de Prevenort con tabla de campos:
 * PESO, TALLA, SATURACIÓN, PRESIÓN ARTERIAL, PULSO, GLICEMIA EN HGT
 * 
 * Cálculos automáticos:
 * - IMC = Peso (kg) / Talla (m)²
 * - PAM = (Sistólica + 2 × Diastólica) / 3
 * 
 * Incluye: Test Ruffier (C.) con cálculo automático
 * Sección de Responsable con firma y nombre
 */

function getFechaFormateada(): string {
    const hoy = new Date()
    const dd = String(hoy.getDate()).padStart(2, '0')
    const mm = String(hoy.getMonth() + 1).padStart(2, '0')
    const yyyy = hoy.getFullYear()
    return `${dd}/${mm}/${yyyy}`
}

function clasificarIMC(imc: number): { label: string; color: string; bg: string } {
    if (imc < 18.5) return { label: 'Bajo peso', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' }
    if (imc < 25) return { label: 'Normal', color: '#10b981', bg: 'rgba(16,185,129,0.1)' }
    if (imc < 30) return { label: 'Sobrepeso', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' }
    if (imc < 35) return { label: 'Obesidad I', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
    if (imc < 40) return { label: 'Obesidad II', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
    return { label: 'Obesidad III', color: '#dc2626', bg: 'rgba(220,38,38,0.15)' }
}

function clasificarPA(sis: number, dia: number): { label: string; color: string } {
    if (sis < 120 && dia < 80) return { label: 'Normal', color: '#10b981' }
    if (sis < 130 && dia < 80) return { label: 'Elevada', color: '#f59e0b' }
    if (sis < 140 || dia < 90) return { label: 'HTA Etapa 1', color: '#f97316' }
    if (sis >= 140 || dia >= 90) return { label: 'HTA Etapa 2', color: '#ef4444' }
    return { label: '--', color: '#64748b' }
}

function clasificarRuffier(score: number): { label: string; color: string } {
    if (score < 0) return { label: 'Excelente', color: '#10b981' }
    if (score <= 5) return { label: 'Bueno', color: '#22c55e' }
    if (score <= 10) return { label: 'Regular', color: '#f59e0b' }
    if (score <= 15) return { label: 'Insuficiente', color: '#f97316' }
    return { label: 'Malo', color: '#ef4444' }
}

export default function SignosVitales({ examId, resultados: res, updateField, isEditable, isFinalizado }: FormularioProps) {
    const disabled = isFieldDisabled(isEditable, isFinalizado)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasFirma, setHasFirma] = useState(false)

    // ─── Cálculos automáticos ───
    const peso = Number(res.peso) || 0
    const talla = Number(res.talla) || 0
    const imcVal = (peso > 0 && talla > 0) ? peso / (talla * talla) : 0
    const imcStr = imcVal > 0 ? imcVal.toFixed(1) : '--'
    const imcClasif = imcVal > 0 ? clasificarIMC(imcVal) : null

    const paSis = Number(res.pa_sistolica) || 0
    const paDia = Number(res.pa_diastolica) || 0
    const pamVal = (paSis > 0 && paDia > 0) ? (paSis + 2 * paDia) / 3 : 0
    const pamStr = pamVal > 0 ? pamVal.toFixed(0) : '--'
    const paClasif = (paSis > 0 && paDia > 0) ? clasificarPA(paSis, paDia) : null

    const p1 = Number(res.pulso) || 0
    const p2 = Number(res.pulso_post) || 0
    const p3 = Number(res.pulso_recuperacion) || 0
    const ruffierVal = (p1 > 0 && p2 > 0 && p3 > 0) ? (p1 + p2 + p3 - 200) / 10 : null
    const ruffierStr = ruffierVal !== null ? ruffierVal.toFixed(1) : '--'
    const ruffierClasif = ruffierVal !== null ? clasificarRuffier(ruffierVal) : null

    // ─── Firma lógica ───
    useEffect(() => {
        if (res.sv_firma_data) {
            setHasFirma(true)
            loadSavedSignature()
        }
    }, [])

    const getCtx = () => canvasRef.current?.getContext('2d') || null

    const loadSavedSignature = () => {
        if (!res.sv_firma_data || !canvasRef.current) return
        const img = new Image()
        img.onload = () => {
            const ctx = getCtx()
            if (ctx && canvasRef.current) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
                ctx.drawImage(img, 0, 0)
            }
        }
        img.src = res.sv_firma_data
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
        if (res.sv_firma_data) loadSavedSignature()
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
        if (canvas) updateField(examId, 'sv_firma_data', canvas.toDataURL('image/png'))
    }
    const limpiarFirma = () => {
        const canvas = canvasRef.current; if (!canvas) return
        const ctx = canvas.getContext('2d'); if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height); setHasFirma(false)
        updateField(examId, 'sv_firma_data', '')
    }

    return (
        <div className="vital-signs-table card glass">
            {/* ─── Encabezado ─── */}
            <div className="sv-header">
                <h3 className="sv-title">Control de Signos Vitales</h3>
            </div>

            {/* ─── Tabla principal de signos vitales ─── */}
            <div className="sv-table">
                {/* Header de tabla */}
                <div className="sv-row sv-row-header">
                    <div className="sv-col-desc">DESCRIPCIÓN</div>
                    <div className="sv-col-res">RESULTADO</div>
                    <div className="sv-col-obs">OBSERVACIÓN</div>
                </div>

                {/* Peso */}
                <div className="sv-row">
                    <div className="sv-col-desc">
                        <span className="sv-field-icon">⚖️</span> PESO
                    </div>
                    <div className="sv-col-res">
                        <input type="number" placeholder="kg" value={res.peso || ''} onChange={e => updateField(examId, 'peso', e.target.value)} disabled={disabled} />
                        <span className="sv-unit">kg</span>
                    </div>
                    <div className="sv-col-obs">
                        <input type="text" placeholder="—" value={res.peso_obs || ''} onChange={e => updateField(examId, 'peso_obs', e.target.value)} disabled={disabled} />
                    </div>
                </div>

                {/* Talla */}
                <div className="sv-row">
                    <div className="sv-col-desc">
                        <span className="sv-field-icon">📏</span> TALLA
                    </div>
                    <div className="sv-col-res">
                        <input type="number" step="0.01" placeholder="m" value={res.talla || ''} onChange={e => updateField(examId, 'talla', e.target.value)} disabled={disabled} />
                        <span className="sv-unit">m</span>
                    </div>
                    <div className="sv-col-obs">
                        <input type="text" placeholder="—" value={res.talla_obs || ''} onChange={e => updateField(examId, 'talla_obs', e.target.value)} disabled={disabled} />
                    </div>
                </div>

                {/* IMC (calculado automáticamente) */}
                <div className="sv-row sv-row-calc">
                    <div className="sv-col-desc">
                        <span className="sv-field-icon">📊</span> IMC
                        <span className="sv-auto-badge">AUTO</span>
                    </div>
                    <div className="sv-col-res">
                        <div className="sv-calc-value" style={imcClasif ? { color: imcClasif.color } : undefined}>
                            {imcStr}
                        </div>
                    </div>
                    <div className="sv-col-obs">
                        {imcClasif && (
                            <span className="sv-clasif-badge" style={{ background: imcClasif.bg, color: imcClasif.color }}>
                                {imcClasif.label}
                            </span>
                        )}
                    </div>
                </div>

                {/* Saturación */}
                <div className="sv-row">
                    <div className="sv-col-desc">
                        <span className="sv-field-icon">💨</span> SATURACIÓN
                    </div>
                    <div className="sv-col-res">
                        <input type="number" placeholder="%" value={res.saturometria || ''} onChange={e => updateField(examId, 'saturometria', e.target.value)} disabled={disabled} />
                        <span className="sv-unit">%</span>
                    </div>
                    <div className="sv-col-obs">
                        <input type="text" placeholder="—" value={res.saturacion_obs || ''} onChange={e => updateField(examId, 'saturacion_obs', e.target.value)} disabled={disabled} />
                    </div>
                </div>

                {/* Presión Arterial */}
                <div className="sv-row">
                    <div className="sv-col-desc">
                        <span className="sv-field-icon">❤️</span> PRESIÓN ARTERIAL
                    </div>
                    <div className="sv-col-res">
                        <div className="sv-pa-wrap">
                            <input type="number" placeholder="Sis" value={res.pa_sistolica || ''} onChange={e => updateField(examId, 'pa_sistolica', e.target.value)} disabled={disabled} className="sv-pa-input" />
                            <span className="sv-pa-sep">/</span>
                            <input type="number" placeholder="Dia" value={res.pa_diastolica || ''} onChange={e => updateField(examId, 'pa_diastolica', e.target.value)} disabled={disabled} className="sv-pa-input" />
                        </div>
                    </div>
                    <div className="sv-col-obs">
                        {paClasif && (
                            <span className="sv-clasif-badge" style={{ color: paClasif.color, background: `${paClasif.color}18` }}>
                                {paClasif.label}
                            </span>
                        )}
                    </div>
                </div>

                {/* PAM (calculada automáticamente) */}
                <div className="sv-row sv-row-calc">
                    <div className="sv-col-desc">
                        <span className="sv-field-icon">🫀</span> P.A. MEDIA
                        <span className="sv-auto-badge">AUTO</span>
                    </div>
                    <div className="sv-col-res">
                        <div className="sv-calc-value" style={paClasif ? { color: paClasif.color } : undefined}>
                            {pamStr}
                            {pamVal > 0 && <span className="sv-unit" style={{ marginLeft: '4px' }}>mmHg</span>}
                        </div>
                    </div>
                    <div className="sv-col-obs">
                        {pamVal > 0 && (
                            <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>
                                = (Sis + 2×Dia) / 3
                            </span>
                        )}
                    </div>
                </div>

                {/* Pulso */}
                <div className="sv-row">
                    <div className="sv-col-desc">
                        <span className="sv-field-icon">💓</span> PULSO
                    </div>
                    <div className="sv-col-res">
                        <input type="number" placeholder="lpm" value={res.pulso || ''} onChange={e => updateField(examId, 'pulso', e.target.value)} disabled={disabled} />
                        <span className="sv-unit">lpm</span>
                    </div>
                    <div className="sv-col-obs">
                        <input type="text" placeholder="—" value={res.pulso_obs || ''} onChange={e => updateField(examId, 'pulso_obs', e.target.value)} disabled={disabled} />
                    </div>
                </div>

                {/* Glicemia */}
                <div className="sv-row">
                    <div className="sv-col-desc">
                        <span className="sv-field-icon">🩸</span> GLICEMIA EN HGT
                    </div>
                    <div className="sv-col-res">
                        <input type="text" placeholder="mg/dl" value={res.glicemia || ''} onChange={e => updateField(examId, 'glicemia', e.target.value)} disabled={disabled} />
                        <span className="sv-unit">mg/dl</span>
                    </div>
                    <div className="sv-col-obs">
                        <input type="text" placeholder="—" value={res.glicemia_obs || ''} onChange={e => updateField(examId, 'glicemia_obs', e.target.value)} disabled={disabled} />
                    </div>
                </div>
            </div>

            {/* ─── Test Ruffier ─── */}
            <div className="sv-ruffier-section">
                <div className="sv-section-title">
                    <span>🏃</span> Test de Ruffier (Cardíaco)
                    <span className="sv-auto-badge">CÁLCULO AUTO</span>
                </div>
                <div className="sv-ruffier-grid">
                    <div className="sv-ruf-item">
                        <label>P1 — Reposo</label>
                        <input type="number" placeholder="lpm" value={res.pulso || ''} disabled
                            style={{ opacity: 0.5, cursor: 'not-allowed' }}
                        />
                        <span className="sv-ruf-hint">= Pulso en reposo</span>
                    </div>
                    <div className="sv-ruf-item">
                        <label>P2 — Post esfuerzo</label>
                        <input type="number" placeholder="lpm" value={res.pulso_post || ''} onChange={e => updateField(examId, 'pulso_post', e.target.value)} disabled={disabled} />
                    </div>
                    <div className="sv-ruf-item">
                        <label>P3 — Recuperación</label>
                        <input type="number" placeholder="lpm" value={res.pulso_recuperacion || ''} onChange={e => updateField(examId, 'pulso_recuperacion', e.target.value)} disabled={disabled} />
                    </div>
                    <div className="sv-ruf-item sv-ruf-result">
                        <label>Resultado</label>
                        <div className="sv-calc-value" style={ruffierClasif ? { color: ruffierClasif.color } : undefined}>
                            {ruffierStr}
                        </div>
                        {ruffierClasif && (
                            <span className="sv-clasif-badge" style={{ color: ruffierClasif.color, background: `${ruffierClasif.color}18` }}>
                                {ruffierClasif.label}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Responsable ─── */}
            <div className="sv-responsable-section">
                <div className="sv-section-title">
                    <span>👩‍⚕️</span> Responsable
                </div>
                <div className="sv-resp-grid">
                    <div className="sv-resp-col">
                        <label>Nombre</label>
                        <input type="text" placeholder="Nombre del profesional" value={res.sv_responsable_nombre || ''} onChange={e => updateField(examId, 'sv_responsable_nombre', e.target.value)} disabled={disabled} />
                    </div>
                    <div className="sv-resp-col">
                        <label>RUT</label>
                        <input type="text" placeholder="12.345.678-9" value={res.sv_responsable_rut || ''} onChange={e => updateField(examId, 'sv_responsable_rut', e.target.value)} disabled={disabled} />
                    </div>
                    <div className="sv-resp-col">
                        <label>Cargo</label>
                        <input type="text" placeholder="Técnico en Atención de Enfermería" value={res.sv_responsable_cargo || ''} onChange={e => updateField(examId, 'sv_responsable_cargo', e.target.value)} disabled={disabled} />
                    </div>
                </div>

                <div className="sv-firma-row">
                    <div className="sv-firma-col">
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
                                <div className="consent-firma-placeholder">✍️ Firma del responsable</div>
                            )}
                        </div>
                        <p className="consent-firma-caption">Firma:</p>
                        {!disabled && hasFirma && (
                            <button className="consent-btn-clear" onClick={limpiarFirma}>Limpiar firma</button>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .sv-header {
                    text-align: center;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1.2rem;
                    border-bottom: 2px solid rgba(255,255,255,0.08);
                }
                .sv-title {
                    font-size: 1.1rem;
                    font-weight: 800;
                    letter-spacing: 0.03em;
                    color: #fff;
                    margin: 0.8rem 0 0.3rem 0;
                    text-transform: uppercase;
                }
                .sv-subtitle {
                    font-size: 0.65rem;
                    opacity: 0.35;
                    letter-spacing: 0.06em;
                    display: block;
                }

                /* ─── Tabla estilo ficha clínica ─── */
                .sv-table {
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    overflow: hidden;
                    margin-bottom: 1.5rem;
                }
                .sv-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    transition: background 0.15s;
                }
                .sv-row:last-child { border-bottom: none; }
                .sv-row:hover:not(.sv-row-header) { background: rgba(255,255,255,0.02); }

                .sv-row-header {
                    background: rgba(255,107,44,0.08);
                    border-bottom: 2px solid rgba(255,107,44,0.15);
                }
                .sv-row-header > div {
                    font-size: 0.65rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: var(--brand-primary, #ff6b2c);
                    padding: 0.7rem 1rem;
                }

                .sv-row-calc {
                    background: rgba(255,255,255,0.02);
                }

                .sv-col-desc {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.7rem 1rem;
                    font-size: 0.8rem;
                    font-weight: 700;
                    border-right: 1px solid rgba(255,255,255,0.06);
                }
                .sv-col-res {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.5rem 0.8rem;
                    border-right: 1px solid rgba(255,255,255,0.06);
                }
                .sv-col-obs {
                    display: flex;
                    align-items: center;
                    padding: 0.5rem 0.8rem;
                }

                .sv-col-res input, .sv-col-obs input {
                    background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 10px;
                    padding: 0.6rem 0.8rem;
                    color: #fff;
                    font-weight: 600;
                    font-size: 0.9rem;
                    width: 100%;
                    transition: all 0.2s;
                    font-family: inherit;
                }
                .sv-col-res input:focus, .sv-col-obs input:focus {
                    border-color: #8b5cf6;
                    background: rgba(0,0,0,0.5);
                    outline: none;
                    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
                }
                .sv-col-res input:disabled, .sv-col-obs input:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .sv-unit {
                    font-size: 0.7rem;
                    opacity: 0.4;
                    font-weight: 600;
                    white-space: nowrap;
                    min-width: 30px;
                }

                .sv-field-icon {
                    font-size: 0.9rem;
                }
                .sv-auto-badge {
                    font-size: 0.55rem;
                    padding: 1px 6px;
                    border-radius: 4px;
                    background: rgba(16,185,129,0.1);
                    color: #10b981;
                    font-weight: 800;
                    letter-spacing: 0.06em;
                    margin-left: 0.5rem;
                }

                .sv-calc-value {
                    font-size: 1.1rem;
                    font-weight: 900;
                    font-variant-numeric: tabular-nums;
                    display: flex;
                    align-items: center;
                }

                .sv-clasif-badge {
                    font-size: 0.7rem;
                    font-weight: 800;
                    padding: 3px 10px;
                    border-radius: 6px;
                    white-space: nowrap;
                }

                .sv-pa-wrap {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    width: 100%;
                }
                .sv-pa-input { max-width: 80px !important; text-align: center; }
                .sv-pa-sep {
                    font-size: 1.2rem;
                    font-weight: 900;
                    opacity: 0.3;
                }

                /* ─── Test Ruffier ─── */
                .sv-ruffier-section {
                    margin-bottom: 1.5rem;
                    padding: 1.2rem;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.06);
                }
                .sv-section-title {
                    font-size: 0.75rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    opacity: 0.7;
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .sv-ruffier-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1rem;
                }
                .sv-ruf-item { display: flex; flex-direction: column; gap: 4px; }
                .sv-ruf-item label {
                    font-size: 0.65rem;
                    font-weight: 800;
                    opacity: 0.5;
                    text-transform: uppercase;
                }
                .sv-ruf-item input {
                    background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 10px;
                    padding: 0.8rem 1rem;
                    color: #fff;
                    font-weight: 600;
                    font-size: 0.95rem;
                    width: 100%;
                    transition: all 0.2s;
                    font-family: inherit;
                }
                .sv-ruf-item input:focus {
                    border-color: #8b5cf6;
                    background: rgba(0,0,0,0.5);
                    outline: none;
                    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
                }
                .sv-ruf-item input:disabled { opacity: 0.5; cursor: not-allowed; }
                .sv-ruf-hint { font-size: 0.6rem; opacity: 0.3; font-style: italic; }
                .sv-ruf-result {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    padding: 0.6rem;
                }

                /* ─── Responsable ─── */
                .sv-responsable-section {
                    padding: 1.2rem;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.06);
                }
                .sv-resp-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                .sv-resp-col { display: flex; flex-direction: column; gap: 4px; }
                .sv-resp-col label {
                    font-size: 0.65rem;
                    font-weight: 800;
                    opacity: 0.5;
                    text-transform: uppercase;
                }
                .sv-resp-col input {
                    background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 10px;
                    padding: 0.8rem 1rem;
                    color: #fff;
                    font-weight: 600;
                    font-size: 0.95rem;
                    width: 100%;
                    transition: all 0.2s;
                    font-family: inherit;
                }
                .sv-resp-col input:focus {
                    border-color: #8b5cf6;
                    background: rgba(0,0,0,0.5);
                    outline: none;
                    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
                }
                .sv-resp-col input:disabled { opacity: 0.5; cursor: not-allowed; }

                .sv-firma-row {
                    display: flex;
                    justify-content: center;
                    margin-top: 0.5rem;
                }
                .sv-firma-col {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                /* ─── Shared consent classes reuse ─── */
                .consent-firma-canvas-wrap { position: relative; width: 100%; max-width: 400px; }
                .consent-canvas {
                    width: 100%; height: 120px; border: 2px dashed rgba(255,255,255,0.15);
                    border-radius: 12px; cursor: crosshair; background: rgba(255,255,255,0.02);
                    touch-action: none; transition: border-color 0.3s;
                }
                .consent-canvas:hover:not(.disabled) { border-color: var(--brand-primary, #ff6b2c); }
                .consent-canvas.disabled { cursor: not-allowed; opacity: 0.6; }
                .consent-firma-placeholder {
                    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    font-size: 1rem; opacity: 0.3; pointer-events: none; font-weight: 600;
                }
                .consent-firma-caption {
                    font-size: 0.75rem; font-weight: 700; opacity: 0.4; text-transform: uppercase;
                    letter-spacing: 0.04em; margin-top: 0.6rem; text-align: center;
                }
                .consent-btn-clear {
                    margin-top: 0.5rem; background: rgba(239, 68, 68, 0.1); color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.2); padding: 0.4rem 1rem;
                    border-radius: 8px; font-size: 0.75rem; font-weight: 700;
                    cursor: pointer; transition: all 0.2s;
                }
                .consent-btn-clear:hover { background: rgba(239, 68, 68, 0.2); }

                @media (max-width: 700px) {
                    .sv-row { grid-template-columns: 1fr; }
                    .sv-col-desc, .sv-col-res, .sv-col-obs { border-right: none; }
                    .sv-ruffier-grid { grid-template-columns: 1fr 1fr; }
                    .sv-resp-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    )
}
