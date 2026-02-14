"use client"

import { useState, useEffect } from 'react'

export default function Dashboard() {
  const [stats, setStats] = useState({
    aptos: 0,
    remediacion: 0,
    no_aptos: 0,
    pendientes: 0
  })

  useEffect(() => {
    // Simulación de carga de datos inicial
    setStats({
      aptos: 154,
      remediacion: 28,
      no_aptos: 12,
      pendientes: 45
    })
  }, [])

  return (
    <div className="dashboard animate-fade">
      <header className="dashboard-header">
        <div className="header-info">
          <h1>Panel de Control</h1>
          <p>Bienvenido al Centro Médico Prevenort. Resumen operativo del día.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary">
            <span>+</span> Nueva Atención
          </button>
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
        <div className="card table-card">
          <h3>Últimas Atenciones</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Trabajador</th>
                <th>Cargo</th>
                <th>Empresa</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Juan Pérez', cargo: 'Operador CAEX', empresa: 'Delta Minería', status: 'Apto' },
                { name: 'María González', cargo: 'Mantenedor', empresa: 'Servicios Norte', status: 'Remediación' },
                { name: 'Roberto Díaz', cargo: 'Eléctrico', empresa: 'ConstruMining', status: 'Pendiente' },
                { name: 'Ana Silva', cargo: 'Administrativo', empresa: 'Delta Minería', status: 'Apto' },
              ].map((row, i) => (
                <tr key={i}>
                  <td><strong>{row.name}</strong></td>
                  <td>{row.cargo}</td>
                  <td>{row.empresa}</td>
                  <td>
                    <span className={`badge badge-${row.status.toLowerCase()}`}>
                      {row.status}
                    </span>
                  </td>
                  <td><button className="text-btn">Ver Detalle</button></td>
                </tr>
              ))}
            </tbody>
          </table>
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
          color: var(--brand-secondary);
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
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          box-shadow: var(--shadow-sm);
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

        .badge-apto { background: #D1FAE5; color: #065F46; }
        .badge-remediación { background: #FEF3C7; color: #92400E; }
        .badge-pendiente { background: #E0F2FE; color: #075985; }

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
