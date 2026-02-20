"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatearRUT } from '@/lib/skills/formateadorRUT'

export default function PortalEmpresaPage() {
    const [empresas, setEmpresas] = useState<any[]>([])
    const [empresaId, setEmpresaId] = useState('')
    const [stats, setStats] = useState({ aptos: 0, no_aptos: 0, remediacion: 0, total: 0 })
    const [statsByCargo, setStatsByCargo] = useState<any[]>([])
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
            }, { apto: 0, no__apto: 0, remediacion: 0 })

            setStats({
                aptos: counts.apto || 0,
                no_aptos: counts.no_apto || 0,
                remediacion: counts.remediacion || 0,
                total: atenciones.length
            })
        }

        // 2. Historial de trabajadores y Agregación por Cargo
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

        if (list) {
            setHistorial(list)

            // Calcular cumplimiento por cargo
            const cargoMap: any = {}
            list.forEach((at: any) => {
                const cName = at.cargos?.nombre_cargo || 'Sin Cargo'
                if (!cargoMap[cName]) {
                    cargoMap[cName] = { total: 0, aptos: 0 }
                }
                cargoMap[cName].total++
                if (at.estado_aptitud === 'apto') cargoMap[cName].aptos++
            })

            const cargoStatsArr = Object.entries(cargoMap).map(([name, data]: [string, any]) => ({
                name,
                total: data.total,
                aptos: data.aptos,
                percentage: Math.round((data.aptos / data.total) * 100)
            })).sort((a, b) => b.percentage - a.percentage)

            setStatsByCargo(cargoStatsArr)
        }
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
            const header = lines[0].toLowerCase().replace(/\s/g, '')
            const cols = header.split(',').map(c => c.trim())

            // Detect if CSV has rut_empresa column
            const rutEmpresaIdx = cols.findIndex(c => ['rut_empresa', 'rutempresa', 'empresa_rut'].includes(c))
            const rutIdx = cols.findIndex(c => c === 'rut')
            const nomIdx = cols.findIndex(c => ['nombres', 'nombre'].includes(c))
            const apPIdx = cols.findIndex(c => ['apellido_paterno', 'appaterno', 'ap_paterno'].includes(c))
            const apMIdx = cols.findIndex(c => ['apellido_materno', 'apmaterno', 'ap_materno'].includes(c))
            const emailIdx = cols.findIndex(c => c === 'email')
            const fNacIdx = cols.findIndex(c => ['fecha_nacimiento', 'fechanac', 'fnac'].includes(c))
            const sxIdx = cols.findIndex(c => c === 'sexo')
            const cargoIdx = cols.findIndex(c => c === 'cargo')

            const dataLines = lines.slice(1).filter(l => l.trim().length > 0)
            if (dataLines.length === 0) {
                alert('El archivo CSV no contiene datos.')
                setLoading(false)
                return
            }

            // Import normalizarRUT dynamically for RUT matching
            const { normalizarRUT } = await import('@/lib/skills/formateadorRUT')

            // Cache: RUT empresa normalizado -> empresa record
            const empresaCache: Record<string, any> = {}
            // Pre-load all empresas for matching
            const { data: allEmpresas } = await supabase.from('empresas').select('*')
            if (allEmpresas) {
                allEmpresas.forEach(emp => {
                    empresaCache[normalizarRUT(emp.rut_empresa)] = emp
                })
            }

            // Pre-load all cargos for name matching
            const { data: allCargos } = await supabase.from('cargos').select('id, nombre_cargo')

            // Generate next empresa code helper
            let maxCode = 0
            if (allEmpresas) {
                allEmpresas.forEach(emp => {
                    if (emp.codigo) {
                        const n = parseInt(emp.codigo.replace('EMP-', ''), 10)
                        if (n > maxCode) maxCode = n
                    }
                })
            }

            let created = 0, updated = 0, atencionesCreated = 0, empresasCreated = 0
            const errors: string[] = []

            for (const line of dataLines) {
                const parts = line.split(',').map(s => s.trim())
                const rut = rutIdx >= 0 ? formatearRUT(parts[rutIdx] || '') : ''
                if (!rut) continue

                const nom = nomIdx >= 0 ? parts[nomIdx] : ''
                const apP = apPIdx >= 0 ? parts[apPIdx] : ''
                const apM = apMIdx >= 0 ? parts[apMIdx] : ''
                const email = emailIdx >= 0 ? parts[emailIdx] : null
                const fNac = fNacIdx >= 0 ? parts[fNacIdx] : null
                const sx = sxIdx >= 0 ? parts[sxIdx] : null
                const cargoNombre = cargoIdx >= 0 ? parts[cargoIdx] : null

                // 1. Determine empresa for this row
                let empresaRecord: any = null
                if (rutEmpresaIdx >= 0 && parts[rutEmpresaIdx]) {
                    // CSV has empresa RUT — normalize and match
                    const rutEmpNorm = normalizarRUT(parts[rutEmpresaIdx])
                    if (empresaCache[rutEmpNorm]) {
                        empresaRecord = empresaCache[rutEmpNorm]
                    } else {
                        // Auto-create empresa with this RUT
                        maxCode++
                        const newCodigo = 'EMP-' + String(maxCode).padStart(4, '0')
                        const { data: newEmp, error: empErr } = await supabase.from('empresas').insert([{
                            rut_empresa: rutEmpNorm,
                            nombre: `Empresa ${rutEmpNorm}`,
                            codigo: newCodigo,
                            faenas: []
                        }]).select().single()
                        if (newEmp) {
                            empresaCache[rutEmpNorm] = newEmp
                            empresaRecord = newEmp
                            empresasCreated++
                        } else if (empErr) {
                            errors.push(`Error creando empresa ${rutEmpNorm}: ${empErr.message}`)
                        }
                    }
                } else if (empresaId) {
                    // No empresa RUT in CSV — use the selected empresa
                    empresaRecord = empresas.find(emp => emp.id === empresaId)
                }

                if (!empresaRecord) {
                    errors.push(`Fila con RUT ${rut}: no se pudo determinar la empresa.`)
                    continue
                }

                // 2. Upsert trabajador by RUT
                const workerData: any = {
                    rut: normalizarRUT(rut),
                    nombres: nom,
                    apellido_paterno: apP,
                    apellido_materno: apM,
                    nombre_completo: `${nom} ${apP} ${apM}`.trim(),
                    email: email || null,
                    fecha_nacimiento: fNac || null,
                    sexo: sx || null,
                    cargo: cargoNombre || null
                }

                const { data: workerResult, error: wErr } = await supabase
                    .from('trabajadores')
                    .upsert(workerData, { onConflict: 'rut' })
                    .select('id')
                    .single()

                if (wErr || !workerResult) {
                    errors.push(`Error con trabajador ${rut}: ${wErr?.message || 'sin resultado'}`)
                    continue
                }

                // 3. Match cargo by name (fuzzy)
                let cargoId: string | null = null
                if (cargoNombre && allCargos) {
                    const cargoLower = cargoNombre.toLowerCase().trim()
                    const match = allCargos.find(c => c.nombre_cargo.toLowerCase().trim() === cargoLower)
                    if (match) cargoId = match.id
                }

                // 4. Check if there's already an active atencion for this worker+empresa
                const { data: existingAt } = await supabase
                    .from('atenciones')
                    .select('id')
                    .eq('trabajador_id', workerResult.id)
                    .eq('empresa_id', empresaRecord.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                if (existingAt) {
                    updated++
                } else {
                    // 5. Create atencion (admission request)
                    const { error: atErr } = await supabase.from('atenciones').insert([{
                        trabajador_id: workerResult.id,
                        empresa_id: empresaRecord.id,
                        cargo_id: cargoId,
                        estado_aptitud: 'pendiente'
                    }])
                    if (atErr) {
                        errors.push(`Error creando atención para ${rut}: ${atErr.message}`)
                    } else {
                        atencionesCreated++
                    }
                }
                created++
            }

            // Summary
            let summary = `✅ Carga completada:\n`
            summary += `• ${created} trabajadores procesados\n`
            summary += `• ${atencionesCreated} solicitudes de admisión creadas\n`
            if (updated > 0) summary += `• ${updated} ya tenían atención activa\n`
            if (empresasCreated > 0) summary += `• ${empresasCreated} empresas nuevas auto-creadas\n`
            if (errors.length > 0) summary += `\n⚠️ ${errors.length} errores:\n${errors.slice(0, 5).join('\n')}`

            alert(summary)
            setBulkFile(null)
            if (empresaId) fetchEmpresaData()
            fetchEmpresas()
            setLoading(false)
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
                    <div className="main-dashboard">
                        <div className="stats-row">
                            <div className="stat-card">
                                <span className="stat-icon">👥</span>
                                <span className="value">{stats.total}</span>
                                <span className="label">Evaluaciones Totales</span>
                            </div>
                            <div className="stat-card success">
                                <span className="stat-icon">✅</span>
                                <span className="value">{stats.aptos}</span>
                                <span className="label">Personal Apto</span>
                            </div>
                            <div className="stat-card warning">
                                <span className="stat-icon">⚠️</span>
                                <span className="value">{stats.remediacion}</span>
                                <span className="label">En Remedación</span>
                            </div>
                            <div className="stat-card danger">
                                <span className="stat-icon">🚫</span>
                                <span className="value">{stats.no_aptos}</span>
                                <span className="label">No Aptos</span>
                            </div>
                        </div>

                        {/* Cumplimiento por Cargo */}
                        <div className="card glass mt-4 compliance-section">
                            <h3>Cumplimiento por Cargo Operativo</h3>
                            <div className="compliance-grid">
                                {statsByCargo.map(c => (
                                    <div key={c.name} className="compliance-item">
                                        <div className="compliance-info">
                                            <span className="cargo-name">{c.name}</span>
                                            <span className="cargo-stat">{c.aptos}/{c.total} Aptos ({c.percentage}%)</span>
                                        </div>
                                        <div className="progress-bar-bg">
                                            <div
                                                className={`progress-bar-fill ${c.percentage > 80 ? 'high' : c.percentage > 50 ? 'med' : 'low'}`}
                                                style={{ width: `${c.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                                {statsByCargo.length === 0 && <p className="empty-msg">No hay datos suficientes para generar estadísticas por cargo.</p>}
                            </div>
                        </div>

                        <div className="card glass mt-4">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3>Gestión de Dotación y Decisiones</h3>
                                <div className="legend">
                                    <span className="legend-item"><span className="dot dot-apto"></span> Apto</span>
                                    <span className="legend-item"><span className="dot dot-no_apto"></span> No Apto</span>
                                    <span className="legend-item"><span className="dot dot-remediacion"></span> Remediación</span>
                                </div>
                            </div>
                            {loading ? (
                                <p>Cargando datos...</p>
                            ) : historial.length === 0 ? (
                                <p>No hay registros de atenciones para esta empresa.</p>
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
                                                    {at.estado_aptitud === 'remediacion' ? (
                                                        at.aprobacion_empresa === 'pendiente' ? (
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
                                                        )
                                                    ) : at.estado_aptitud === 'no_apto' ? (
                                                        <span className={`decision-${at.aprobacion_empresa}`}>
                                                            {at.aprobacion_empresa?.toUpperCase()}
                                                        </span>
                                                    ) : null}
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
                            <p className="bulk-text">Suba su nómina de trabajadores para agilizar el proceso de ingreso en centro médico. El sistema identifica la empresa automáticamente por RUT.</p>
                            <p className="bulk-text" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CSV: RUT, Nombres, ApPaterno, ApMaterno, Email, FechaNac, Sexo, Cargo, <strong style={{ color: 'var(--brand-primary)' }}>RUT_Empresa</strong> (opcional).</p>

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
                                <li><strong>RUT_Empresa</strong>: si el CSV lo incluye, el sistema identifica automáticamente la empresa. Si no, usa la empresa seleccionada arriba.</li>
                                <li>Si la empresa no existe, se crea automáticamente con un código EMP-XXXX.</li>
                                <li>Se crean las solicitudes de admisión por cada trabajador.</li>
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

                .stat-card .label { font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
                .stat-card .value { font-size: 2.2rem; font-weight: 900; font-family: 'Outfit', sans-serif; color: var(--text-main); line-height: 1; }
                .stat-icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
                
                .stat-card.success .value { color: #22c55e; }
                .stat-card.warning .value { color: #f59e0b; }
                .stat-card.danger .value { color: #ef4444; }

                .compliance-section { padding: 1.5rem; }
                .compliance-section h3 { margin-bottom: 1.5rem; font-size: 1.1rem; }
                .compliance-grid { display: grid; gap: 1.2rem; }
                .compliance-item { display: flex; flex-direction: column; gap: 0.5rem; }
                .compliance-info { display: flex; justify-content: space-between; align-items: flex-end; }
                .cargo-name { font-size: 0.95rem; font-weight: 700; color: var(--text-main); }
                .cargo-stat { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }
                
                .progress-bar-bg { height: 8px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; }
                .progress-bar-fill { height: 100%; border-radius: 10px; transition: width 1s ease-out; }
                .progress-bar-fill.high { background: linear-gradient(90deg, #22c55e, #4ade80); box-shadow: 0 0 10px rgba(34, 197, 94, 0.2); }
                .progress-bar-fill.med { background: linear-gradient(90deg, #f59e0b, #fbbf24); box-shadow: 0 0 10px rgba(245, 158, 11, 0.2); }
                .progress-bar-fill.low { background: linear-gradient(90deg, #ef4444, #f87171); box-shadow: 0 0 10px rgba(239, 68, 68, 0.2); }

                .legend { display: flex; gap: 1rem; }
                .legend-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); }
                .dot { width: 8px; height: 8px; border-radius: 50%; }
                .dot-apto { background: #22c55e; }
                .dot-no_apto { background: #ef4444; }
                .dot-remediacion { background: #f59e0b; }
                .empty-msg { font-style: italic; color: var(--text-muted); font-size: 0.9rem; }

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
                .badge-apto { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
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
