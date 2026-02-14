"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { formatearRUT } from '@/lib/skills/formateadorRUT'

export default function CertificadosListaPage() {
    const [atenciones, setAtenciones] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchListosParaFirma()
    }, [])

    async function fetchListosParaFirma() {
        const { data } = await supabase
            .from('atenciones')
            .select(`
        id,
        created_at,
        estado_aptitud,
        ia_evaluacion,
        trabajadores (nombre_completo, rut),
        empresas (nombre),
        cargos (nombre_cargo)
      `)
            .in('estado_aptitud', ['apto', 'no_apto', 'remediacion'])
            .order('created_at', { ascending: false })

        if (data) setAtenciones(data)
        setLoading(false)
    }

    return (
        <div className="certificados-container animate-fade">
            <header className="page-header">
                <h1>Cierre Médico y Certificación</h1>
                <p>Emisión de certificados legales con firma electrónica y código QR.</p>
            </header>

            <div className="card table-card">
                <h3>Pendientes de Firma y Emitidos</h3>
                {loading ? (
                    <p className="loading-text">Cargando...</p>
                ) : atenciones.length === 0 ? (
                    <p className="empty-text">No hay certificados listos para procesar.</p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Trabajador</th>
                                <th>Estado IA</th>
                                <th>Empresa</th>
                                <th>Fecha</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {atenciones.map((at) => (
                                <tr key={at.id}>
                                    <td>
                                        <div className="worker-cell">
                                            <strong>{at.trabajadores?.nombre_completo}</strong>
                                            <span>{at.trabajadores?.rut ? formatearRUT(at.trabajadores.rut) : ''}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge-status ${at.estado_aptitud}`}>
                                            {at.estado_aptitud.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>{at.empresas?.nombre}</td>
                                    <td>{new Date(at.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <Link href={`/evaluacion/${at.id}/firma`} className="btn-firma">
                                            Revisar y Firmar 🖋️
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <style jsx>{`
        .page-header { margin-bottom: 2rem; }
        h1 { color: var(--brand-secondary); font-size: 2rem; }
        
        .worker-cell { display: flex; flex-direction: column; }
        .worker-cell span { font-size: 0.8rem; color: var(--text-muted); }

        .badge-status {
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .badge-status.apto { background: #D1FAE5; color: #065F46; }
        .badge-status.no_apto { background: #FEE2E2; color: #991B1B; }
        .badge-status.remediacion { background: #FEF3C7; color: #92400E; }

        .data-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        .data-table th { text-align: left; padding: 1rem; color: var(--text-muted); font-size: 0.85rem; border-bottom: 2px solid var(--bg-app); }
        .data-table td { padding: 1rem; border-bottom: 1px solid var(--bg-app); font-size: 0.95rem; }

        .btn-firma {
          color: var(--brand-primary);
          font-weight: 700;
          text-decoration: none;
        }
        .btn-firma:hover { text-decoration: underline; }
      `}</style>
        </div>
    )
}
