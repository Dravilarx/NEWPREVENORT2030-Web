"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { formatearRUT } from '@/lib/skills/formateadorRUT'

export default function RemediacionListaPage() {
    const [casos, setCasos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCasos()
    }, [])

    async function fetchCasos() {
        // Buscamos atenciones en estado 'remediacion'
        const { data, error } = await supabase
            .from('atenciones')
            .select(`
        id,
        created_at,
        trabajadores (nombre_completo, rut),
        empresas (nombre),
        cargos (nombre_cargo),
        aprobacion_empresa,
        planes_remediacion (progreso_actual, fecha_estimada_alta)
      `)
            .eq('estado_aptitud', 'remediacion')
            .order('created_at', { ascending: false })

        if (data) setCasos(data)
        setLoading(false)
    }

    return (
        <div className="remediacion-container animate-fade">
            <header className="page-header">
                <h1>Gestión de Remediación (Worker Rescue)</h1>
                <p>Seguimiento de trabajadores en proceso de nivelación de salud para aptitud.</p>
            </header>

            <div className="card table-card">
                <h3>Casos Activos</h3>
                {loading ? (
                    <p className="loading-text">Cargando casos...</p>
                ) : casos.length === 0 ? (
                    <div className="empty-state">
                        <p>No hay casos de remediación activos.</p>
                        <p className="sub">Los casos aparecen aquí cuando la IA detecta desviaciones tratables.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Trabajador</th>
                                <th>Empresa</th>
                                <th>Cargo</th>
                                <th>Progreso</th>
                                <th>Fecha Estimada Alta</th>
                                <th>Empresa Aprob.</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {casos.map((caso) => (
                                <tr key={caso.id}>
                                    <td>
                                        <div className="worker-info">
                                            <strong>{caso.trabajadores?.nombre_completo}</strong>
                                            <span>{caso.trabajadores?.rut ? formatearRUT(caso.trabajadores.rut) : ''}</span>
                                        </div>
                                    </td>
                                    <td>{caso.empresas?.nombre}</td>
                                    <td>{caso.cargos?.nombre_cargo}</td>
                                    <td>
                                        <div className="progress-container">
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${caso.planes_remediacion?.[0]?.progreso_actual || 0}%` }}
                                                ></div>
                                            </div>
                                            <span className="progress-text">
                                                {caso.planes_remediacion?.[0]?.progreso_actual || 0}%
                                            </span>
                                        </div>
                                    </td>
                                    <td>{caso.planes_remediacion?.[0]?.fecha_estimada_alta || 'Pendiente'}</td>
                                    <td>
                                        <span className={`status-dot ${caso.aprobacion_empresa}`}></span>
                                        <span className="status-text">{caso.aprobacion_empresa?.toUpperCase()}</span>
                                    </td>
                                    <td>
                                        <Link href={`/remediacion/${caso.id}`} className="btn-gestionar">
                                            Gestionar Plan 🛠️
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
        
        .empty-state {
          padding: 4rem 2rem;
          text-align: center;
          color: var(--text-muted);
        }

        .empty-state .sub { font-size: 0.85rem; margin-top: 0.5rem; }

        .worker-info { display: flex; flex-direction: column; }
        .worker-info span { font-size: 0.8rem; color: var(--text-muted); }

        .progress-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 120px;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--brand-primary);
          transition: width 0.3s ease;
        }

        .progress-text { font-size: 0.75rem; font-weight: 700; color: var(--brand-primary); }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }

        .data-table th {
          text-align: left;
          padding: 1rem;
          color: var(--text-muted);
          font-size: 0.85rem;
          border-bottom: 2px solid var(--bg-app);
        }

        .data-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--bg-app);
          font-size: 0.95rem;
        }

        .btn-gestionar {
          color: var(--brand-primary);
          font-weight: 700;
          text-decoration: none;
        }

        .btn-gestionar:hover { text-decoration: underline; }
        .btn-gestionar:hover { text-decoration: underline; }

        .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 0.5rem; }
        .status-dot.aprobado { background: var(--success); }
        .status-dot.rechazado { background: var(--danger); }
        .status-dot.pendiente { background: var(--warning); }
        .status-text { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
      `}</style>
        </div>
    )
}
