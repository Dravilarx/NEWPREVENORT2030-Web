"use client"

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { formatearRUT } from '@/lib/skills/formateadorRUT'
import Link from 'next/link'

export default function ListaTrabajoPage() {
    const [examenes, setExamenes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filterRol, setFilterRol] = useState('Todos')
    const [filterEstado, setFilterEstado] = useState('Todos')

    useEffect(() => {
        fetchExamenes()
    }, [])

    async function fetchExamenes() {
        setLoading(true)
        console.log('📡 Fetching Work List...')

        const { data, error } = await supabase
            .from('atencion_examenes')
            .select(`
                id,
                estado,
                rol_asignado,
                atencion_id,
                created_at,
                prestaciones (id, nombre, grupo_examen),
                atenciones (
                    id,
                    nro_ficha,
                    trabajadores (
                        id,
                        nombre_completo,
                        rut,
                        fecha_nacimiento
                    )
                )
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('❌ Supabase Error:', error)
            alert('Error cargando lista: ' + error.message)
        } else {
            console.log('✅ Datos:', data)
            setExamenes(data || [])
        }
        setLoading(false)
    }

    const calculateAge = (birthDate: string) => {
        if (!birthDate) return '—'
        try {
            const today = new Date()
            const birth = new Date(birthDate)
            if (isNaN(birth.getTime())) return '—'
            let age = today.getFullYear() - birth.getFullYear()
            const m = today.getMonth() - birth.getMonth()
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
            return age + 'A'
        } catch { return '—' }
    }

    const filteredExamenes = useMemo(() => {
        if (!examenes) return []
        return examenes.filter(ex => {
            const matchesRol = filterRol === 'Todos' || ex.rol_asignado === filterRol
            const matchesEstado = filterEstado === 'Todos' || ex.estado === filterEstado
            return matchesRol && matchesEstado
        })
    }, [examenes, filterRol, filterEstado])

    const roles = ['Todos', ...Array.from(new Set(examenes.map(ex => ex.rol_asignado)))]

    return (
        <div className="lista-trabajo-container animate-fade">
            <header className="page-header">
                <div className="breadcrumb">Principal / Gestión / Lista Trabajo</div>
                <h1>Lista de Trabajo General</h1>
                <p>Monitoreo en tiempo real de estaciones de evaluación y toma de muestras.</p>
            </header>

            <div className="filters-card card glass">
                <div className="filter-group">
                    <label>Rol / Estación</label>
                    <select value={filterRol} onChange={(e) => setFilterRol(e.target.value)}>
                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Estado</label>
                    <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
                        <option value="Todos">Todos</option>
                        <option value="nuevo">Nuevo</option>
                        <option value="en_proceso">En Proceso</option>
                        <option value="finalizado">Finalizado</option>
                    </select>
                </div>
                <button className="btn-refresh" onClick={fetchExamenes}>🔄 Actualizar</button>
            </div>

            <div className="table-card card glass">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Sincronizando con estaciones...</p>
                    </div>
                ) : (
                    <table className="work-table">
                        <thead>
                            <tr>
                                <th>#OT</th>
                                <th>Fecha</th>
                                <th>Trabajador</th>
                                <th>Edad</th>
                                <th>Evaluación</th>
                                <th>Rol / Responsable</th>
                                <th>Estado</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExamenes.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="empty-row">
                                        No hay exámenes pendientes para esta selección.
                                    </td>
                                </tr>
                            ) : (
                                filteredExamenes.map((ex) => {
                                    const tr = ex.atenciones?.trabajadores
                                    return (
                                        <tr key={ex.id}>
                                            <td className="ot-cell">#{ex.atenciones?.nro_ficha || ex.atenciones?.id.split('-')[0]}</td>
                                            <td className="date-cell">{new Date(ex.created_at).toLocaleString('es-CL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</td>
                                            <td>
                                                <div className="worker-info">
                                                    <strong>{tr?.nombre_completo || 'Sin nombre'}</strong>
                                                    <span className="rut-sub">{tr?.rut ? formatearRUT(tr.rut) : ''}</span>
                                                </div>
                                            </td>
                                            <td>{calculateAge(tr?.fecha_nacimiento)}</td>
                                            <td>
                                                <div className="exam-info">
                                                    <span className="exam-name">{ex.prestaciones?.nombre}</span>
                                                    <span className="exam-group">{ex.prestaciones?.grupo_examen}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`rol-tag rol-${ex.rol_asignado?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, '-')}`}>
                                                    {ex.rol_asignado}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-pill status-${ex.estado}`}>
                                                    {ex.estado.toUpperCase()}
                                                </span>
                                            </td>
                                            <td>
                                                <Link href={`/evaluacion/${ex.atencion_id}`} className="btn-action">
                                                    {ex.estado === 'finalizado' ? 'Ver' : 'Ingresar'}
                                                </Link>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <style jsx>{`
                .lista-trabajo-container { padding: 1rem; color: #fff; }
                .breadcrumb { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem; letter-spacing: 0.05em; }
                h1 { font-size: 2.2rem; font-weight: 900; margin: 0; background: linear-gradient(to right, #fff, #999); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .page-header p { color: var(--text-muted); margin-top: 0.5rem; }

                .filters-card { display: flex; gap: 2rem; padding: 1.5rem; margin: 2rem 0; align-items: flex-end; }
                .filter-group { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
                .filter-group label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--brand-primary); }
                .filter-group select { background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: #fff; padding: 0.8rem; border-radius: 12px; font-weight: 600; outline: none; }
                .btn-refresh { background: var(--brand-primary); color: #fff; border: none; padding: 0.8rem 1.5rem; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.3s; }
                .btn-refresh:hover { transform: scale(1.05); box-shadow: 0 0 20px rgba(255,107,44,0.3); }

                .work-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                .work-table th { text-align: left; padding: 1.2rem; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 2px solid var(--border-color); }
                .work-table td { padding: 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem; }
                
                .ot-cell { font-family: 'JetBrains Mono', monospace; font-weight: 800; color: var(--brand-primary); }
                .date-cell { font-size: 0.8rem; color: var(--text-muted); }
                
                .worker-info { display: flex; flex-direction: column; }
                .rut-sub { font-size: 0.75rem; color: var(--text-muted); font-family: monospace; }
                
                .exam-info { display: flex; flex-direction: column; }
                .exam-name { font-weight: 700; color: #fff; }
                .exam-group { font-size: 0.7rem; color: var(--brand-primary); text-transform: uppercase; font-weight: 800; }

                .rol-tag { padding: 0.3rem 0.8rem; border-radius: 8px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.1); }
                .rol-secretaria { background: rgba(59, 130, 246, 0.1); color: #60a5fa; border-color: #3b82f644; }
                .rol-paramedico { background: rgba(16, 185, 129, 0.1); color: #34d399; border-color: #10b98144; }
                .rol-medico { background: rgba(249, 115, 22, 0.1); color: #fb923c; border-color: #f9731644; }
                .rol-psicologo { background: rgba(168, 85, 247, 0.1); color: #c084fc; border-color: #a855f744; }
                .empty-row { text-align: center; padding: 3rem !important; color: var(--text-muted); font-style: italic; background: rgba(255,255,255,0.02); }

                .status-pill { padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.65rem; font-weight: 900; letter-spacing: 0.05em; }
                .status-nuevo { background: transparent; border: 1px solid #ccc; color: #ccc; }
                .status-en_proceso { background: #E0F2FE; color: #0369a1; }
                .status-finalizado { background: #DCFCE7; color: #15803d; }

                .btn-action { color: var(--brand-primary); font-weight: 800; text-decoration: none; font-size: 0.85rem; }
                .btn-action:hover { text-decoration: underline; }

                .loading-state { padding: 4rem; text-align: center; color: var(--text-muted); }
                .spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); border-top-color: var(--brand-primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}
