"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { formatearRUT } from '@/lib/skills/formateadorRUT'

export default function EvaluacionListaPage() {
    const [atenciones, setAtenciones] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentStation, setCurrentStation] = useState<string>('Clínico')

    const estaciones = [
        { id: 'Admin', nombre: 'Admin / Flujo', icon: '🏢' },
        { id: 'Clínico', nombre: 'Clínico (TENS)', icon: '🩺' },
        { id: 'Psicotécnico', nombre: 'Psicotécnico (TENS)', icon: '🚦' },
        { id: 'Psicológico', nombre: 'Psicología', icon: '🧠' },
        { id: 'Radiología', nombre: 'Rayos X / Tec.', icon: '🩻' },
        { id: 'Laboratorio', nombre: 'Laboratorio', icon: '🧪' },
        { id: 'Médico', nombre: 'Médico (Veredicto)', icon: '👨‍⚕️' },
    ]

    useEffect(() => {
        fetchAtenciones()
    }, [])

    async function fetchAtenciones() {
        setLoading(true)
        const { data, error } = await supabase
            .from('atenciones')
            .select(`
                id,
                nro_ficha,
                estado_aptitud,
                trabajadores (nombre_completo, rut),
                empresas (nombre),
                cargos (nombre_cargo),
                atencion_examenes (
                    id,
                    estado,
                    rol_asignado
                )
            `)
            .eq('estado_aptitud', 'pendiente')
            .order('created_at', { ascending: false })

        if (data) setAtenciones(data)
        setLoading(false)
    }

    // Filtrar atenciones según la estación seleccionada
    const atencionesFiltradas = atenciones.filter(at => {
        const exams = at.atencion_examenes || [];

        if (currentStation === 'Admin') {
            return true; // Admin ve todo el flujo
        }

        if (currentStation === 'Médico') {
            // El médico ve pacientes que tienen todos sus exámenes finalizados
            // pero que aún no tienen aptitud emitida (pendiente)
            const allFinished = exams.every((ex: any) => ex.estado === 'finalizado');
            return allFinished && exams.length > 0;
        } else {
            // Otras estaciones ven pacientes que tienen al menos un examen pendiente en su rol
            return exams.some((ex: any) =>
                ex.rol_asignado === currentStation && ex.estado !== 'finalizado'
            );
        }
    });

    const getProgreso = (at: any) => {
        const exams = at.atencion_examenes || [];
        const completed = exams.filter((ex: any) => ex.estado === 'finalizado').length;
        const total = exams.length;
        if (total === 0) return { percent: 0, text: '0/0' };
        return {
            percent: (completed / total) * 100,
            text: `${completed}/${total}`
        };
    };

    return (
        <div className="evaluacion-container animate-fade">
            <header className="page-header">
                <h1>Consola de Estaciones Médicas</h1>
                <p>Gestiona la cola de pacientes según tu área de atención.</p>
            </header>

            <div className="station-nav">
                {estaciones.map(st => (
                    <button
                        key={st.id}
                        className={`station-pill ${currentStation === st.id ? 'active' : ''}`}
                        onClick={() => setCurrentStation(st.id)}
                    >
                        <span className="st-icon">{st.icon}</span>
                        <span className="st-name">{st.nombre}</span>
                        <span className="st-count">
                            {atenciones.filter(at => {
                                const exams = at.atencion_examenes || [];
                                if (st.id === 'Admin') return true;
                                if (st.id === 'Médico') {
                                    return exams.every((ex: any) => ex.estado === 'finalizado') && exams.length > 0;
                                }
                                return exams.some((ex: any) => ex.rol_asignado === st.id && ex.estado !== 'finalizado');
                            }).length}
                        </span>
                    </button>
                ))}
            </div>

            <div className="card table-card">
                <h3>Pacientes en Espera: {currentStation}</h3>
                {loading ? (
                    <p className="loading-text">Sincronizando con base de datos...</p>
                ) : atencionesFiltradas.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">☕</div>
                        <p className="empty-text">Sin pacientes pendientes en esta estación.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Paciente</th>
                                <th>RUT</th>
                                <th>Empresa / Cargo</th>
                                <th>Progreso Total</th>
                                <th>Flujo Vital</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {atencionesFiltradas.map((at) => {
                                const progreso = getProgreso(at);
                                const examenesEstacion = at.atencion_examenes.filter((ex: any) => ex.rol_asignado === currentStation);
                                const pendientesEstacion = examenesEstacion.filter((ex: any) => ex.estado !== 'finalizado').length;

                                return (
                                    <tr key={at.id}>
                                        <td>
                                            <span className="tr-name">{at.trabajadores?.nombre_completo}</span>
                                            <span className="tr-sub">Ficha: {at.nro_ficha}</span>
                                        </td>
                                        <td>{at.trabajadores?.rut ? formatearRUT(at.trabajadores.rut) : ''}</td>
                                        <td>
                                            <span className="tr-name">{at.empresas?.nombre}</span>
                                            <span className="tr-sub">{at.cargos?.nombre_cargo}</span>
                                        </td>
                                        <td>
                                            <div className="progress-cell">
                                                <div className="progress-bar-bg">
                                                    <div className="progress-bar-fill" style={{ width: `${progreso.percent}%` }}></div>
                                                </div>
                                                <span className="progress-text">{progreso.text} completados</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="station-dots">
                                                {estaciones.filter(e => e.id !== 'Médico').map(st => {
                                                    const stationExams = at.atencion_examenes.filter((ex: any) => ex.rol_asignado === st.id);
                                                    if (stationExams.length === 0) return null;
                                                    const isDone = stationExams.every((ex: any) => ex.estado === 'finalizado');
                                                    return (
                                                        <div key={st.id} className={`st-dot ${isDone ? 'done' : ''}`} title={`${st.nombre}: ${isDone ? 'Completo' : 'Pendiente'}`}>
                                                            {st.icon}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                        <td>
                                            <Link href={`/evaluacion/${at.id}?station=${currentStation}`} className="btn-evaluar">
                                                {currentStation === 'Médico' ? 'Emitir Acta ✍️' : 'Atender 💉'}
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <style jsx>{`
                .evaluacion-container { padding: 2rem; max-width: 1400px; margin: 0 auto; color: #fff; }
                .page-header { margin-bottom: 2.5rem; }
                h1 { font-size: 2.8rem; font-weight: 950; letter-spacing: -0.02em; margin: 0; }
                .page-header p { color: var(--text-muted); font-size: 1.1rem; margin-top: 0.5rem; }
                
                .station-nav {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 2.5rem;
                    overflow-x: auto;
                    padding-bottom: 1rem;
                }

                .station-pill {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.05);
                    padding: 0.8rem 1.5rem;
                    border-radius: 100px;
                    display: flex;
                    align-items: center;
                    gap: 0.8rem;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    white-space: nowrap;
                    color: rgba(255,255,255,0.7);
                }

                .station-pill:hover {
                    background: rgba(255,255,255,0.08);
                    border-color: rgba(255,255,255,0.1);
                    transform: translateY(-2px);
                }

                .station-pill.active {
                    background: rgba(255,102,0,0.1);
                    border-color: var(--brand-primary);
                    color: var(--brand-primary);
                }

                .st-icon { font-size: 1.2rem; }
                .st-name { font-weight: 800; font-size: 0.9rem; }
                .st-count {
                    background: rgba(255,102,0,0.2);
                    padding: 0.2rem 0.6rem;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 900;
                }
                .station-pill.active .st-count {
                    background: var(--brand-primary);
                    color: #fff;
                }

                .table-card { padding: 2rem; border-radius: 24px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.03); }
                h3 { font-size: 1rem; font-weight: 800; margin-bottom: 2rem; color: var(--brand-primary); text-transform: uppercase; letter-spacing: 0.1em; }

                .empty-state {
                    padding: 6rem;
                    text-align: center;
                    color: var(--text-muted);
                }
                .empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.3; }

                .data-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0 0.8rem;
                }

                .data-table th {
                    text-align: left;
                    padding: 0 1.5rem 1rem;
                    color: var(--text-muted);
                    font-size: 0.7rem;
                    font-weight: 800;
                    text-transform: uppercase;
                }

                .data-table tbody tr {
                    background: rgba(255,255,255,0.02);
                    transition: all 0.2s;
                    border: 1px solid rgba(255,255,255,0.03);
                }

                .data-table tbody tr:hover {
                    background: rgba(255,255,255,0.05);
                    transform: translateX(5px);
                }

                .data-table td {
                    padding: 1.2rem 1.5rem;
                    font-size: 0.9rem;
                }

                .data-table td:first-child { border-radius: 16px 0 0 16px; }
                .data-table td:last-child { border-radius: 0 16px 16px 0; }

                .tr-name { font-weight: 800; display: block; color: #fff; }
                .tr-sub { font-size: 0.75rem; color: var(--text-muted); }

                .progress-cell { width: 151px; }
                .progress-bar-bg { height: 6px; background: rgba(255,255,255,0.05); border-radius: 100px; margin-bottom: 0.4rem; overflow: hidden; }
                .progress-bar-fill { height: 100%; background: var(--brand-primary); transition: width 0.4s ease; }
                .progress-text { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }

                .station-dots { display: flex; gap: 0.5rem; }
                .st-dot {
                    width: 32px;
                    height: 32px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                    filter: grayscale(1);
                    opacity: 0.4;
                    transition: all 0.3s;
                }
                .st-dot.done {
                    filter: grayscale(0);
                    opacity: 1;
                    background: rgba(16, 185, 129, 0.1);
                    border-color: rgba(16, 185, 129, 0.2);
                }

                .badge-pendiente {
                    background: rgba(255,255,255,0.05);
                    color: #fff;
                    padding: 0.4rem 0.8rem;
                    border-radius: 8px;
                    font-size: 0.7rem;
                    font-weight: 800;
                    text-transform: uppercase;
                }

                .badge-ready {
                    background: rgba(16, 185, 129, 0.1);
                    color: #10b981;
                    padding: 0.4rem 0.8rem;
                    border-radius: 8px;
                    font-size: 0.7rem;
                    font-weight: 800;
                    text-transform: uppercase;
                }

                .btn-evaluar {
                    background: var(--brand-primary);
                    color: #fff;
                    padding: 0.6rem 1.4rem;
                    border-radius: 100px;
                    font-weight: 800;
                    text-decoration: none;
                    font-size: 0.8rem;
                    transition: all 0.2s;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    box-shadow: 0 4px 15px rgba(255, 102, 0, 0.2);
                }

                .btn-evaluar:hover {
                    box-shadow: 0 6px 20px rgba(255, 102, 0, 0.3);
                    filter: brightness(1.1);
                    transform: scale(1.05);
                }
            `}</style>
        </div>
    )
}
