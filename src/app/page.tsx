"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import WorkList from '@/components/WorkList'

export default function Dashboard() {
  const [stats, setStats] = useState({
    aptos: 0,
    remediacion: 0,
    no_aptos: 0,
    pendientes: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRealStats()
  }, [])

  async function fetchRealStats() {
    const { data: atenciones } = await supabase.from('atenciones').select('estado_aptitud')

    if (atenciones) {
      const counts = atenciones.reduce((acc: any, at: any) => {
        const estado = at.estado_aptitud || 'pendiente'
        acc[estado] = (acc[estado] || 0) + 1
        return acc
      }, { apto: 0, remediacion: 0, no_apto: 0, pendiente: 0 })

      setStats({
        aptos: counts.apto,
        remediacion: counts.remediacion,
        no_aptos: counts.no_apto,
        pendientes: counts.pendiente
      })
      setLoading(false)
    }
  }

  return (
    <div className="dashboard animate-fade">
      <header className="dashboard-header">
        <div className="header-info">
          <h1>Panel de Control</h1>
          <p>Bienvenido al Centro Médico Prevenort. Resumen operativo del día.</p>
        </div>
        <div className="header-actions">
          <Link href="/admision" className="btn btn-primary">
            <span>+</span> Nueva Atención
          </Link>
        </div>
      </header>

      <section className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Aptos</span>
          <span className="kpi-value text-success">{stats.aptos}</span>
          <span className="kpi-trend">↑ 12% vs ayer</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">En Remediación</span>
          <span className="kpi-value text-warning">{stats.remediacion}</span>
          <span className="kpi-trend">Rescate activo</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">No Aptos</span>
          <span className="kpi-value text-danger">{stats.no_aptos}</span>
          <span className="kpi-trend">Evaluación técnica</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Pendientes</span>
          <span className="kpi-value text-info">{stats.pendientes}</span>
          <span className="kpi-trend">Flujo Fast-Track</span>
        </div>
      </section>

      <div className="content-grid">
        <div className="table-area">
          <WorkList limit={10} />
        </div>

        <div className="card ai-card glass">
          <div className="ai-header">
            <span className="ai-icon">🤖</span>
            <h3>Asistente de IA</h3>
          </div>
          <p className="ai-prompt">Analizando última batería de exámenes de la faena "Esperanza"...</p>
          <div className="ai-insight">
            <span className="insight-tag">Sugerencia</span>
            <p>"Se detecta una tendencia alcista en la presión arterial de los trabajadores nocturnos de Delta Minería. Se recomienda adelantar controles preventivos."</p>
          </div>
        </div>
      </div>


      <style jsx>{`
        .dashboard {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        h1 {
          font-size: 2rem;
          margin-bottom: 0.25rem;
        }

        .dashboard-header p {
          color: var(--text-muted);
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .kpi-card {
          background: var(--bg-card);
          padding: 1.5rem;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border-color);
        }

        .kpi-label {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .kpi-value {
          font-size: 2.5rem;
          font-weight: 800;
          font-family: 'Outfit', sans-serif;
        }

        .kpi-trend {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--success);
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 1.5rem;
        }

        @media (max-width: 1200px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1.5rem;
        }

        .data-table th {
          text-align: left;
          padding: 1rem;
          font-size: 0.85rem;
          color: var(--text-muted);
          border-bottom: 2px solid var(--bg-app);
        }

        .data-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--bg-app);
        }

        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .badge-apto { background: var(--brand-primary-light); color: var(--brand-primary); }
        .badge-remediación { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
        .badge-pendiente { background: var(--bg-app); color: var(--text-muted); }

        .text-btn {
          background: none;
          border: none;
          color: var(--brand-primary);
          font-weight: 600;
          cursor: pointer;
        }

        .ai-card {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .ai-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .ai-icon {
          font-size: 1.5rem;
        }

        .ai-prompt {
          font-style: italic;
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .ai-insight {
          background: var(--brand-primary-light);
          padding: 1.25rem;
          border-radius: var(--radius-sm);
          border-left: 4px solid var(--brand-primary);
        }

        .insight-tag {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--brand-primary);
          text-transform: uppercase;
          margin-bottom: 0.5rem;
          display: block;
        }

        .text-success { color: var(--success); }
        .text-warning { color: var(--warning); }
        .text-danger { color: var(--danger); }
        .text-info { color: var(--info); }
      `}</style>
    </div>
  )
}
