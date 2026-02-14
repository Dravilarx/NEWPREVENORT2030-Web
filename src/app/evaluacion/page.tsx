"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { formatearRUT } from '@/lib/skills/formateadorRUT'

export default function EvaluacionListaPage() {
    const [atenciones, setAtenciones] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAtenciones()
    }, [])

    async function fetchAtenciones() {
        const { data, error } = await supabase
            .from('atenciones')
            .select(`
        id,
        nro_ficha,
        estado_aptitud,
        trabajadores (nombre_completo, rut),
        empresas (nombre),
        cargos (nombre_cargo)
      `)
            .eq('estado_aptitud', 'pendiente')
            .order('created_at', { ascending: false })

        if (data) setAtenciones(data)
        setLoading(false)
    }

    return (
        <div className="evaluacion-container animate-fade">
            <header className="page-header">
                <h1>Gestión de Evaluación Clínica</h1>
                <p>Trabajadores en espera de toma de signos vitales y exámenes.</p>
            </header>

            <div className="card table-card">
                <h3>Lista de Espera Fast-Track</h3>
                {loading ? (
                    <p className="loading-text">Cargando pacientes...</p>
                ) : atenciones.length === 0 ? (
                    <p className="empty-text">No hay atenciones pendientes en este momento.</p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Trabajador</th>
                                <th>RUT</th>
                                <th>Empresa</th>
                                <th>Cargo</th>
                                <th>Estado</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {atenciones.map((at) => (
                                <tr key={at.id}>
                                    <td><strong>{at.trabajadores?.nombre_completo}</strong></td>
                                    <td>{at.trabajadores?.rut ? formatearRUT(at.trabajadores.rut) : ''}</td>
                                    <td>{at.empresas?.nombre}</td>
                                    <td>{at.cargos?.nombre_cargo}</td>
                                    <td><span className="badge badge-pendiente">En Espera</span></td>
                                    <td>
                                        <Link href={`/evaluacion/${at.id}`} className="btn-evaluar">
                                            Iniciar Evaluación 🩺
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
        
        .loading-text, .empty-text {
          padding: 2rem;
          text-align: center;
          color: var(--text-muted);
        }

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

        .badge-pendiente {
          background: #E0F2FE;
          color: #075985;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .btn-evaluar {
          color: var(--brand-primary);
          font-weight: 700;
          text-decoration: none;
          transition: var(--transition);
        }

        .btn-evaluar:hover {
          text-decoration: underline;
        }
      `}</style>
        </div>
    )
}
