"use client"

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'

export default function PublicVerificationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [atencion, setAtencion] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [id])

    async function fetchData() {
        const { data } = await supabase
            .from('atenciones')
            .select(`
                *,
                trabajadores (nombre_completo, rut),
                empresas (nombre),
                cargos (nombre_cargo)
            `)
            .eq('id', id)
            .single()

        if (data) setAtencion(data)
        setLoading(false)
    }

    if (loading) return <div className="loading-public">Verificando firma en servidor seguro...</div>

    if (!atencion || !atencion.integrity_hash) {
        return (
            <div className="verify-failed animate-fade">
                <div className="error-card">
                    <span className="error-icon">❌</span>
                    <h1>Sin Registro de Firma</h1>
                    <p>Este ID de atención no cuenta con un certificado digital emitido o válido en nuestros registros.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="verification-public animate-fade">
            <div className="verify-card card glass">
                <div className="verify-header">
                    <span className="success-icon">🛡️</span>
                    <div className="badge-valid">CERTIFICADO VÁLIDO</div>
                </div>

                <div className="verify-body">
                    <div className="worker-cert-info">
                        <h2>{atencion.trabajadores?.nombre_completo}</h2>
                        <span className="rut-text">{atencion.trabajadores?.rut}</span>
                    </div>

                    <div className="cert-details">
                        <div className="detail-item">
                            <label>Empresa</label>
                            <span>{atencion.empresas?.nombre}</span>
                        </div>
                        <div className="detail-item">
                            <label>Cargo</label>
                            <span>{atencion.cargos?.nombre_cargo}</span>
                        </div>
                        <div className="detail-item">
                            <label>Resultado Aptitud</label>
                            <span className={`aptitud-text ${atencion.estado_aptitud}`}>
                                {atencion.estado_aptitud?.toUpperCase()}
                            </span>
                        </div>
                        <div className="detail-item">
                            <label>Fecha de Firma</label>
                            <span>{new Date(atencion.fecha_firma).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="integrity-footer">
                        <label>Hash de Integridad SHA-256</label>
                        <code>{atencion.integrity_hash}</code>
                    </div>
                </div>

                <div className="footer-notice">
                    <p>Este documento cuenta con Firma Electrónica Avanzada bajo la Ley 19.799. Validado por Centro Médico Prevenort.</p>
                </div>
            </div>

            <style jsx>{`
                .verification-public {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-app);
                    padding: 1.5rem;
                }
                
                .verify-card {
                    max-width: 450px;
                    width: 100%;
                    padding: 2.5rem;
                    text-align: center;
                    border-top: 6px solid var(--success);
                }

                .verify-header { margin-bottom: 2rem; }
                .success-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
                .badge-valid { 
                    display: inline-block;
                    background: #D1FAE5;
                    color: #065F46;
                    padding: 0.5rem 1.5rem;
                    border-radius: 20px;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                }

                .worker-cert-info { margin-bottom: 2rem; }
                .worker-cert-info h2 { font-size: 1.5rem; color: var(--brand-secondary); margin-bottom: 0.25rem; }
                .rut-text { color: var(--text-muted); font-weight: 600; font-size: 0.9rem; }

                .cert-details { display: grid; gap: 1.25rem; text-align: left; margin-bottom: 2rem; border-top: 1px solid #eee; padding-top: 1.5rem; }
                .detail-item label { display: block; font-size: 0.7rem; color: #999; font-weight: 800; text-transform: uppercase; margin-bottom: 0.25rem; }
                .detail-item span { font-size: 1rem; color: var(--text-main); font-weight: 600; }

                .aptitud-text.apto { color: var(--success); }
                .aptitud-text.no_apto { color: var(--danger); }
                .aptitud-text.remediacion { color: var(--warning); }

                .integrity-footer {
                    background: #f9fafb;
                    padding: 1rem;
                    border-radius: 8px;
                    font-size: 0.7rem;
                    border: 1px solid #eee;
                }
                .integrity-footer label { display: block; color: #999; font-weight: 700; margin-bottom: 0.5rem; text-transform: uppercase; }
                code { word-break: break-all; color: var(--brand-secondary); font-family: monospace; }

                .footer-notice { margin-top: 2rem; font-size: 0.75rem; color: #999; line-height: 1.4; }

                .loading-public { height: 100vh; display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--brand-secondary); }
                
                .error-card { background: white; padding: 3rem; border-radius: 12px; text-align: center; max-width: 400px; border-top: 6px solid var(--danger); box-shadow: var(--shadow-xl); }
                .error-icon { font-size: 3rem; display: block; margin-bottom: 1.5rem; }
            `}</style>
        </div>
    )
}
