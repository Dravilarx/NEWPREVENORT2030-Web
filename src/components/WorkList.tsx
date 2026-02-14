"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { formatearRUT } from '@/lib/skills/formateadorRUT'

interface WorkListProps {
    limit?: number;
    showTitle?: boolean;
    initialFilterEmpresa?: string;
}

export default function WorkList({ limit, showTitle = true, initialFilterEmpresa }: WorkListProps) {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [empresas, setEmpresas] = useState<any[]>([])

    // Estados de filtros
    const [searchPatient, setSearchPatient] = useState('')
    const [selectedEmpresa, setSelectedEmpresa] = useState(initialFilterEmpresa || '')
    const [selectedEstado, setSelectedEstado] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')

    // Cargar empresas para el select
    useEffect(() => {
        const fetchEmpresas = async () => {
            const { data: list } = await supabase.from('empresas').select('id, nombre').order('nombre')
            if (list) setEmpresas(list)
        }
        fetchEmpresas()
    }, [])

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('atenciones')
                .select(`
                    id,
                    created_at,
                    estado_aptitud,
                    aprobacion_empresa,
                    aprobacion_trabajador,
                    trabajadores!inner (nombres, apellido_paterno, apellido_materno, rut),
                    empresas (nombre),
                    cargos (nombre_cargo)
                `)
                .order('created_at', { ascending: false })

            if (limit) query = query.limit(limit)

            // Filtros Dinámicos
            if (selectedEmpresa) {
                query = query.eq('empresa_id', selectedEmpresa)
            }

            if (selectedEstado) {
                query = query.eq('estado_aptitud', selectedEstado)
            }

            if (searchPatient) {
                // Buscamos en nombres o RUT
                // Nota: Usamos or para buscar en múltiples campos del join
                query = query.or(`rut.ilike.%${searchPatient}%,nombres.ilike.%${searchPatient}%,apellido_paterno.ilike.%${searchPatient}%`, { foreignTable: "trabajadores" })
            }

            if (dateFrom) {
                query = query.gte('created_at', `${dateFrom}T00:00:00Z`)
            }

            if (dateTo) {
                query = query.lte('created_at', `${dateTo}T23:59:59Z`)
            }

            const { data: list, error } = await query

            if (list) setData(list)
        } catch (error) {
            console.error("Error fetching worklist:", error)
        } finally {
            setLoading(false)
        }
    }, [limit, selectedEmpresa, selectedEstado, searchPatient, dateFrom, dateTo])

    useEffect(() => {
        fetchData()

        // Realtime subscription
        const channel = supabase
            .channel('worklist_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'atenciones' }, () => {
                fetchData()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchData])

    const resetFilters = () => {
        setSearchPatient('')
        setSelectedEmpresa('')
        setSelectedEstado('')
        setDateFrom('')
        setDateTo('')
    }

    return (
        <div className="worklist-container card glass animate-fade">
            {showTitle && (
                <div className="worklist-header">
                    <div className="header-left">
                        <h3>📋 Hoja de Trabajo (WorkList)</h3>
                        <p className="subtitle">Gestión de atenciones y estados de pacientes</p>
                    </div>
                    <div className="worklist-badge">{data.length} Registros</div>
                </div>
            )}

            {/* Barra de Filtros */}
            <div className="filters-bar">
                <div className="filter-group patient-search">
                    <label>Paciente / RUT</label>
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchPatient}
                        onChange={(e) => setSearchPatient(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <label>Empresa</label>
                    <select value={selectedEmpresa} onChange={(e) => setSelectedEmpresa(e.target.value)}>
                        <option value="">Todas las empresas</option>
                        {empresas.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label>Estado</label>
                    <select value={selectedEstado} onChange={(e) => setSelectedEstado(e.target.value)}>
                        <option value="">Cualquier estado</option>
                        <option value="pendiente">PENDIENTE</option>
                        <option value="apto">APTO</option>
                        <option value="no_apto">NO APTO</option>
                        <option value="remediacion">REMEDIACIÓN</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Desde</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>

                <div className="filter-group">
                    <label>Hasta</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>

                <button className="btn-reset" onClick={resetFilters} title="Limpiar Filtros">
                    🔄
                </button>
            </div>

            <div className="table-wrapper">
                <table className="worklist-table">
                    <thead>
                        <tr>
                            <th>Fecha/Hora</th>
                            <th>Paciente</th>
                            <th>RUT</th>
                            <th>Empresa</th>
                            <th>Cargo</th>
                            <th>Aptitud</th>
                            <th>Gestión</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="text-center">Actualizando hoja de trabajo...</td></tr>
                        ) : data.length === 0 ? (
                            <tr><td colSpan={7} className="text-center">No se encontraron registros con los filtros aplicados.</td></tr>
                        ) : data.map((item) => (
                            <tr key={item.id}>
                                <td className="time-cell">
                                    <span className="date">{new Date(item.created_at).toLocaleDateString()}</span>
                                    <span className="time">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </td>
                                <td>
                                    <strong>{item.trabajadores?.nombres} {item.trabajadores?.apellido_paterno}</strong>
                                </td>
                                <td className="rut-cell">{formatearRUT(item.trabajadores?.rut)}</td>
                                <td>{item.empresas?.nombre}</td>
                                <td>{item.cargos?.nombre_cargo}</td>
                                <td>
                                    <span className={`badge badge-${item.estado_aptitud?.toLowerCase() || 'pendiente'}`}>
                                        {item.estado_aptitud?.toUpperCase() || 'PENDIENTE'}
                                    </span>
                                </td>
                                <td>
                                    <div className="approval-icons">
                                        <span title={`Empresa: ${item.aprobacion_empresa}`} className={`icon ${item.aprobacion_empresa}`}>🏢</span>
                                        <span title={`Trabajador: ${item.aprobacion_trabajador}`} className={`icon ${item.aprobacion_trabajador}`}>👤</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
                .worklist-container {
                    padding: 0;
                    overflow: hidden;
                    border: 1px solid rgba(255,255,255,0.1);
                    margin-top: 1.5rem;
                }
                .worklist-header {
                    padding: 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .header-left h3 { margin: 0; }
                .subtitle { 
                    font-size: 0.75rem; 
                    color: var(--text-muted); 
                    margin: 0.2rem 0 0 0;
                }
                .worklist-badge {
                    background: var(--brand-primary);
                    color: white;
                    padding: 0.2rem 0.6rem;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 700;
                }

                /* Filtros */
                .filters-bar {
                    background: rgba(255,255,255,0.02);
                    padding: 1rem 1.5rem;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1.2rem;
                    align-items: flex-end;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }
                .filter-group label {
                    font-size: 0.65rem;
                    text-transform: uppercase;
                    font-weight: 700;
                    color: var(--brand-primary);
                    letter-spacing: 0.05em;
                }
                .filter-group input, .filter-group select {
                    background: rgba(255,255,255,0.03);
                    border: 1.5px solid var(--brand-primary);
                    border-radius: 10px;
                    padding: 0.6rem 0.8rem;
                    font-size: 0.85rem;
                    color: white;
                    outline: none;
                    transition: all 0.2s ease;
                    min-height: 42px;
                }
                .filter-group input:focus, .filter-group select:focus {
                    background: rgba(255,255,255,0.08);
                    border-color: #ff8c42;
                    box-shadow: 0 0 0 3px rgba(255, 107, 44, 0.15);
                }
                .patient-search { flex: 1; min-width: 150px; }
                
                .btn-reset {
                    background: rgba(255,100,100,0.1);
                    border: 1px solid rgba(255,100,100,0.2);
                    padding: 0.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: 0.2s;
                    height: 38px;
                    width: 38px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .btn-reset:hover {
                    background: rgba(255,100,100,0.2);
                    transform: rotate(-45deg);
                }

                .table-wrapper {
                    overflow-x: auto;
                }
                .worklist-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .worklist-table th {
                    text-align: left;
                    padding: 1rem 1.5rem;
                    background: rgba(0,0,0,0.05);
                    color: var(--text-muted);
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .worklist-table td {
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    font-size: 0.85rem;
                }
                .time-cell {
                    display: flex;
                    flex-direction: column;
                }
                .time-cell .date { font-size: 0.75rem; color: var(--text-muted); }
                .time-cell .time { font-weight: 700; color: var(--brand-secondary); }
                
                .rut-cell { font-family: monospace; font-size: 0.8rem; }

                .badge {
                    padding: 0.25rem 0.7rem;
                    border-radius: 6px;
                    font-size: 0.65rem;
                    font-weight: 800;
                    display: inline-block;
                }
                .badge-apto { background: #059669; color: white; }
                .badge-no_apto { background: #dc2626; color: white; }
                .badge-remediacion { background: #d97706; color: white; }
                .badge-pendiente { background: #2563eb; color: white; }

                .approval-icons {
                    display: flex;
                    gap: 0.5rem;
                }
                .icon {
                    font-size: 1rem;
                    filter: grayscale(1);
                    opacity: 0.2;
                    transition: 0.3s;
                }
                .icon.aprobado {
                    filter: grayscale(0);
                    opacity: 1;
                }
                .icon.rechazado {
                    filter: hue-rotate(140deg) grayscale(0);
                    opacity: 1;
                }
            `}</style>
        </div>
    )
}
