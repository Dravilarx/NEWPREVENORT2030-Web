"use client"

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { prepararFirmaElectronica } from '@/lib/skills/certificacionLegal'

export default function FirmaCertificadoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [signing, setSigning] = useState(false)

    const [atencion, setAtencion] = useState<any>(null)
    const [certificado, setCertificado] = useState<any>(null)

    useEffect(() => {
        fetchData()
    }, [id])

    async function fetchData() {
        const { data } = await supabase
            .from('atenciones')
            .select(`
        *,
        trabajadores (*),
        empresas (*),
        cargos (*),
        resultados_clinicos (*)
      `)
            .eq('id', id)
            .single()

        if (data) setAtencion(data)
        setLoading(false)
    }

    const procesarFirma = async () => {
        setSigning(true)

        // Preparar datos para el Skill de Firma
        const datosParaFirma = {
            atencion_id: id,
            rut_trabajador: atencion.trabajadores.rut,
            nombre_trabajador: atencion.trabajadores.nombre_completo,
            veredicto: atencion.estado_aptitud,
            fecha_emision: new Date().toISOString()
        }

        // Ejecutar Skill Legal
        const certLegal = prepararFirmaElectronica(datosParaFirma)
        setCertificado(certLegal)

        // 3. Guardar en Base de Datos
        await supabase
            .from('atenciones')
            .update({
                integrity_hash: certLegal.hash_integridad,
                fecha_firma: new Date().toISOString()
            })
            .eq('id', id)

        setTimeout(() => {
            setSigning(false)
            alert('Certificado firmado legalmente. Hash de integridad generado y guardado.')
        }, 1000)
    }

    if (loading) return <div className="p-10">Preparando expediente para firma...</div>

    return (
        <div className="firma-container animate-fade">
            <header className="page-header">
                <button onClick={() => router.back()} className="back-link">← Volver</button>
                <h1>Cierre Médico y Firma Digital</h1>
                <p>Revise el veredicto final antes de emitir la certificación legal.</p>
            </header>

            <div className="content-grid">
                <div className="main-column">
                    <div className="card overview-card">
                        <div className="card-header">
                            <span className="icon">📄</span>
                            <h3>Resumen de Atención</h3>
                        </div>

                        <div className="summary-details">
                            <div className="detail-row">
                                <label>Veredicto Técnico IA:</label>
                                <span className={`badge-status ${atencion.estado_aptitud}`}>
                                    {atencion.estado_aptitud.toUpperCase()}
                                </span>
                            </div>
                            <div className="detail-row">
                                <label>Justificación IA:</label>
                                <p className="ai-text">{atencion.ia_evaluacion}</p>
                            </div>
                        </div>

                        <div className="results-preview">
                            <label>Resultados Clínicos:</label>
                            <div className="results-grid">
                                {atencion.resultados_clinicos?.map((r: any, i: number) => (
                                    <div key={i} className="result-item">
                                        <span>{r.item_nombre}</span>
                                        <strong>{r.valor_encontrado}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {!certificado ? (
                            <div className="signature-actions">
                                <div className="legal-notice">
                                    <input type="checkbox" id="confirm" />
                                    <label htmlFor="confirm">
                                        Certifico que he revisado los antecedentes clínicos y confirmo el estado de aptitud según la normativa vigente (Ley 19.799).
                                    </label>
                                </div>
                                <button className="btn btn-primary btn-full mt-4" onClick={procesarFirma} disabled={signing}>
                                    {signing ? 'Firmando con Token FEA...' : 'Firmar Certificado Electrónico'}
                                </button>
                            </div>
                        ) : (
                            <div className="success-signature animate-fade">
                                <div className="success-banner">
                                    <span className="success-icon">🛡️</span>
                                    <div>
                                        <h4>Documento Firmado con Éxito</h4>
                                        <p>Integridad SHA-256: <code>{certificado.hash_integridad}</code></p>
                                    </div>
                                </div>
                                <div className="certificate-actions">
                                    <button className="btn btn-secondary">📥 Descargar PDF</button>
                                    <button className="btn btn-secondary">📧 Enviar a Empresa</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="side-column">
                    {certificado && (
                        <div className="card qr-card animate-fade">
                            <h3>Validación Pública QR</h3>
                            <p>Este código permite a la empresa contratista validar la autenticidad del certificado en terreno.</p>
                            <div className="qr-placeholder">
                                <div className="qr-sim">
                                    {/* Simulación visual de QR */}
                                    <div className="qr-pattern"></div>
                                </div>
                            </div>
                            <a href={certificado.qr_url} target="_blank" className="qr-link">
                                {certificado.qr_url}
                            </a>
                        </div>
                    )}

                    <div className="card compliance-info">
                        <h3>Validez Legal</h3>
                        <p className="info-text">
                            Este proceso cumple con los estándares de la <strong>Firma Electrónica Avanzada (FEA)</strong> bajo la Ley 19.799 de la República de Chile.
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .page-header { margin-bottom: 2rem; }
        .back-link { background: none; border: none; color: var(--brand-primary); cursor: pointer; margin-bottom: 1rem; font-weight: 600; }
        
        .content-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; }

        .detail-row { margin-bottom: 1.5rem; }
        .detail-row label { display: block; font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; margin-bottom: 0.5rem; }
        .ai-text { font-style: italic; font-size: 0.95rem; color: var(--brand-secondary); border-left: 3px solid #eee; padding-left: 1rem; }

        .results-preview { margin: 2rem 0; padding-top: 2rem; border-top: 1px solid #eee; }
        .results-preview label { font-weight: 800; font-size: 0.9rem; margin-bottom: 1rem; display: block; }
        .results-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .result-item { background: var(--bg-app); padding: 0.75rem 1rem; border-radius: 6px; display: flex; justify-content: space-between; font-size: 0.85rem; }

        .badge-status { padding: 0.4rem 1rem; border-radius: 4px; font-weight: 800; display: inline-block; }
        .badge-status.apto { background: #D1FAE5; color: #065F46; }
        .badge-status.no_apto { background: #FEE2E2; color: #991B1B; }
        .badge-status.remediacion { background: #FEF3C7; color: #92400E; }

        .legal-notice { display: flex; gap: 1rem; align-items: flex-start; background: #FFFBEB; padding: 1.25rem; border-radius: 8px; border: 1px solid #FEF3C7; }
        .legal-notice label { font-size: 0.85rem; color: #92400E; font-weight: 500; cursor: pointer; }

        .success-banner { display: flex; gap: 1.5rem; align-items: center; background: #F0FDF4; border: 1px solid #DCFCE7; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; }
        .success-icon { font-size: 2.5rem; }
        .success-banner h4 { color: #166534; font-size: 1.1rem; }
        .success-banner p { font-size: 0.8rem; color: #15803D; margin-top: 0.25rem; }
        .certificate-actions { display: flex; gap: 1rem; }

        .qr-card { text-align: center; display: flex; flex-direction: column; gap: 1rem; }
        .qr-placeholder { background: #f9fafb; padding: 1.5rem; border-radius: 12px; border: 2px dashed #e5e7eb; }
        .qr-sim { width: 150px; height: 150px; margin: 0 auto; background: white; border: 8px solid white; box-shadow: var(--shadow-md); }
        .qr-pattern { width: 100%; height: 100%; background: repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 50% / 10px 10px; }
        .qr-link { font-size: 0.7rem; color: var(--brand-primary); word-break: break-all; }

        .compliance-info h3 { font-size: 0.9rem; margin-bottom: 0.75rem; }
        .info-text { font-size: 0.8rem; line-height: 1.5; color: var(--text-muted); }

        .btn-full { width: 100%; }
        .btn-secondary { background: white; border: 1px solid #ddd; color: var(--text-main); flex: 1; font-size: 0.85rem; }
        .mt-4 { margin-top: 1.5rem; }
      `}</style>
        </div>
    )
}
