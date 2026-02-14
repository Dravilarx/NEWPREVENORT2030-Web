"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatearRUT } from '@/lib/skills/formateadorRUT'

export default function PortalEmpresaPage() {
    const [empresas, setEmpresas] = useState<any[]>([])
    const [empresaId, setEmpresaId] = useState('')
    const [stats, setStats] = useState({ aptos: 0, no_aptos: 0, remediacion: 0, total: 0 })
    const [historial, setHistorial] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [bulkFile, setBulkFile] = useState<File | null>(null)

    useEffect(() => {
        fetchEmpresas()
    }, [])

    useEffect(() => {
        if (empresaId) {
            fetchEmpresaData()
        }
    }, [empresaId])

    async function fetchEmpresas() {
        const { data } = await supabase.from('empresas').select('*')
        if (data) setEmpresas(data)
    }

    async function fetchEmpresaData() {
        setLoading(true)
        // 1. Estadísticas
        const { data: atenciones } = await supabase
            .from('atenciones')
            .select('estado_aptitud')
            .eq('empresa_id', empresaId)

        if (atenciones) {
            const counts = atenciones.reduce((acc: any, at: any) => {
                const estado = at.estado_aptitud || 'pendiente'
                acc[estado] = (acc[estado] || 0) + 1
                return acc
            }, { apto: 0, no_apto: 0, remediacion: 0 })

            setStats({
                aptos: counts.apto,
                no_aptos: counts.no_apto,
                remediacion: counts.remediacion,
                total: atenciones.length
            })
        }

        // 2. Historial de trabajadores
        const { data: list } = await supabase
            .from('atenciones')
            .select(`
                id,
                created_at,
                estado_aptitud,
                aprobacion_empresa,
                aprobacion_trabajador,
                trabajadores (nombre_completo, rut),
                cargos (nombre_cargo)
            `)
            .eq('empresa_id', empresaId)
            .order('created_at', { ascending: false })

        if (list) setHistorial(list)
        setLoading(false)
    }

    async function handleCompanyDecision(atencionId: string, decision: 'aprobado' | 'rechazado') {
        const updates: any = {
            aprobacion_empresa: decision,
            fecha_aprobacion_empresa: new Date().toISOString()
        }

        if (decision === 'rechazado') {
            updates.estado_aptitud = 'no_apto'
        }

        const { error } = await supabase
            .from('atenciones')
            .update(updates)
            .eq('id', atencionId)

        if (!error) {
            fetchEmpresaData()
        }
    }

    async function handleBulkUpload() {
        if (!bulkFile) return
        setLoading(true)

        const reader = new FileReader()
        reader.onload = async (e) => {
            const text = e.target?.result as string
            const lines = text.split('\n')

            const workersToRegister = lines.slice(1).filter(l => l.trim().length > 0).map(line => {
                const parts = line.split(',').map(s => s.trim())
                const [rut, nom, apP, apM, email, fNac, sx] = parts
                return {
                    rut: formatearRUT(rut),
                    nombres: nom,
                    apellido_paterno: apP,
                    apellido_materno: apM,
                    nombre_completo: `${nom} ${apP} ${apM}`.trim(),
                    email: email || null,
                    fecha_nacimiento: fNac || null,
                    sexo: sx || null
                }
            })

            try {
                const { error } = await supabase
                    .from('trabajadores')
                    .upsert(workersToRegister, { onConflict: 'rut' })

                if (error) throw error
                alert(`¡Se han cargado ${workersToRegister.length} trabajadores exitosamente!`)
                setBulkFile(null)
            } catch (err: any) {
                alert('Error en carga masiva: ' + err.message)
            } finally {
                setLoading(false)
            }
        }
        reader.readAsText(bulkFile)
    }

    return (
        <div className="portal-empresa animate-fade">
            <header className="page-header">
                <h1>Portal Corporativo</h1>
                <p>Visualización de cumplimiento y aptitud de su personal.</p>
            </header>

            <div className="selector-card card glass">
                <label>Seleccione Empresa para visualizar:</label>
                <select
                    value={empresaId}
                    onChange={(e) => setEmpresaId(e.target.value)}
                    className="company-select"
                >
                    <option value="">-- Seleccione una empresa --</option>
                    {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
            </div>

            {empresaId && (
                <div className="portal-content-grid">
                    <div className="main-side">
                        <section className="stats-row">
                            <div className="stat-card">
                                <span className="label">Total Evaluados</span>
                                <span className="value">{stats.total}</span>
                            </div>
                            <div className="stat-card success">
                                <span className="label">Aptos</span>
                                <span className="value">{stats.aptos}</span>
                            </div>
                            <div className="stat-card warning">
                                <span className="label">En Remediación</span>
                                <span className="value">{stats.remediacion}</span>
                            </div>
                            <div className="stat-card danger">
                                <span className="label">No Aptos</span>
                                <span className="value">{stats.no_aptos}</span>
                            </div>
                        </section>

                        <div className="card mt-4">
                            <h3>Gestión de Dotación</h3>
                            {loading ? (
                                <p className="p-4">Cargando datos...</p>
                            ) : (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Trabajador</th>
                                            <th>RUT</th>
                                            <th>Cargo</th>
                                            <th>Última Evaluación</th>
                                            <th>Estado</th>
                                            <th>Decisión Empresa</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historial.map(at => (
                                            <tr key={at.id}>
                                                <td><strong>{at.trabajadores?.nombre_completo}</strong></td>
                                                <td>{at.trabajadores?.rut ? formatearRUT(at.trabajadores.rut) : ''}</td>
                                                <td>{at.cargos?.nombre_cargo}</td>
                                                <td>{new Date(at.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <span className={`badge badge-${at.estado_aptitud?.toLowerCase() || 'pendiente'}`}>
                                                        {at.estado_aptitud?.toUpperCase() || 'PENDIENTE'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {at.estado_aptitud === 'remediacion' && at.aprobacion_empresa === 'pendiente' ? (
                                                        <div className="btn-group">
                                                            <button
                                                                className="btn-mini btn-success"
                                                                onClick={() => handleCompanyDecision(at.id, 'aprobado')}
                                                            >
                                                                Aprobar ✅
                                                            </button>
                                                            <button
                                                                className="btn-mini btn-danger"
                                                                onClick={() => handleCompanyDecision(at.id, 'rechazado')}
                                                            >
                                                                Rechazar ❌
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className={`decision-${at.aprobacion_empresa}`}>
                                                            {at.aprobacion_empresa?.toUpperCase()}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    <div className="side-panel">
                        <div className="card glass bulk-card">
                            <div className="bulk-header">
                                <h3>Pre-carga de Dotación</h3>
                            </div>
                            <p className="bulk-text">Suba su nómina de trabajadores para agilizar el proceso de ingreso en centro médico.</p>
                            <p className="bulk-text" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CSV: RUT, Nombres, ApPaterno, ApMaterno, Email, FechaNac, Sexo.</p>

                            <div className="bulk-upload-zone">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                                    id="bulk-file-input"
                                    className="hidden"
                                />
                                <label htmlFor="bulk-file-input" className="bulk-label">
                                    {bulkFile ? bulkFile.name : '📁 Seleccionar .csv'}
                                </label>
                                {bulkFile && (
                                    <button
                                        onClick={handleBulkUpload}
                                        className="btn-mini btn-success"
                                        style={{ marginTop: '1rem', width: '100%', padding: '0.8rem' }}
                                        disabled={loading}
                                    >
                                        🚀 Procesar Carga Masiva
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="card glass info-panel mt-4">
                            <h4>Instrucciones</h4>
                            <ul className="info-list">
                                <li>Use RUT con puntos y guion.</li>
                                <li>FechaNac en formato YYYY-MM-DD.</li>
                                <li>Sexo: Masculino / Femenino.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .portal-empresa { display: flex; flex-direction: column; gap: 1rem; }
                .company-select { 
                    width: 100%; 
                    margin-top: 0.5rem; 
                    padding: 0.8rem; 
                    border-radius: 8px; 
                    border: 1px solid var(--border-color); 
                    font-size: 1.1rem;
                    background: var(--bg-card);
                    color: var(--text-main);
                }
                
                .portal-content-grid {
                    display: grid;
                    grid-template-columns: 1fr 300px;
                    gap: 1.5rem;
                    margin-top: 2rem;
                }

                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1.5rem;
                }

                .stat-card {
                    background: var(--bg-card);
                    padding: 1.5rem;
                    border-radius: 12px;
                    box-shadow: var(--shadow-sm);
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                    border: 1px solid var(--border-color);
                }

                .stat-card .label { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
                .stat-card .value { font-size: 2rem; font-weight: 800; font-family: 'Outfit', sans-serif; color: var(--text-main); }
                
                .stat-card.success .value { color: var(--success); }
                .stat-card.warning .value { color: var(--warning); }
                .stat-card.danger .value { color: var(--danger); }

                .mt-4 { margin-top: 2rem; }

                .data-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                .data-table th { text-align: left; padding: 1rem; color: var(--text-muted); font-size: 0.85rem; border-bottom: 2px solid var(--bg-app); }
                .data-table td { padding: 1rem; border-bottom: 1px solid var(--bg-app); font-size: 0.95rem; }

                .badge {
                    padding: 0.3rem 0.8rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 700;
                }
                .badge-apto { background: var(--brand-primary-light); color: var(--brand-primary); }
                .badge-no_apto { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
                .badge-remediacion { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
                .badge-pendiente { background: var(--bg-app); color: var(--text-muted); }

                .btn-group { display: flex; gap: 0.5rem; }
                .btn-mini { padding: 0.4rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer; border: none; transition: 0.2s; }
                .btn-mini:hover { opacity: 0.8; transform: translateY(-1px); }
                .btn-success { background: var(--success); color: white; }
                .btn-danger { background: var(--danger); color: white; }

                .decision-aprobado { color: var(--success); font-weight: 800; font-size: 0.8rem; }
                .decision-rechazado { color: var(--danger); font-weight: 800; font-size: 0.8rem; }
                .decision-pendiente { color: var(--text-muted); font-style: italic; font-size: 0.8rem; }

                .bulk-card {
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .bulk-header { display: flex; align-items: center; gap: 0.5rem; }
                .bulk-text { font-size: 0.8rem; line-height: 1.4; color: var(--text-main); }
                .bulk-upload-zone {
                    border: 2px dashed var(--border-color);
                    padding: 1rem;
                    border-radius: 8px;
                    text-align: center;
                }
                .bulk-label { 
                    display: block; 
                    padding: 0.5rem; 
                    background: var(--bg-app); 
                    border-radius: 4px; 
                    cursor: pointer; 
                    font-size: 0.9rem;
                    color: var(--text-main);
                    border: 1px solid var(--border-color);
                }
                .hidden { display: none; }
                .info-panel { padding: 1.5rem; }
                .info-list { font-size: 0.8rem; padding-left: 1.2rem; color: var(--text-muted); }
            `}</style>
        </div>
    )
}
