"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatearRUT } from '@/lib/skills/formateadorRUT'

// ── Interfaces ──────────────────────────────────────────────
interface Empresa {
    id: string;
    nombre: string;
    rut_empresa?: string;
}

interface Cargo {
    id: string;
    nombre_cargo: string;
    es_gran_altura: boolean;
}

interface Prestacion {
    id: string;
    codigo: string;
    nombre: string;
    categoria: string;
    rol_responsable?: string;
    grupo_examen?: string;
}

interface BateriaItem {
    prestacion_id: string;
    prestaciones?: Prestacion;
}

interface Bateria {
    id: string;
    nombre: string;
    descripcion?: string;
    bateria_items?: BateriaItem[];
}

interface Asignacion {
    id: string;
    empresa_id: string;
    cargo_id: string;
    bateria_id: string;
    baterias?: Bateria;
}

interface Atencion {
    id: string;
    created_at: string;
    estado_aptitud: string;
    trabajadores?: {
        nombre_completo: string;
        rut: string;
    };
    cargos?: {
        nombre_cargo: string;
    };
    empresas?: {
        nombre: string;
    };
}

// ── Component ───────────────────────────────────────────────
export default function AdmisionPage() {
    const [loading, setLoading] = useState(false)
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [cargos, setCargos] = useState<Cargo[]>([])
    const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
    const [recentAdmisions, setRecentAdmisions] = useState<Atencion[]>([])
    const [bateriaSugerida, setBateriaSugerida] = useState<Bateria | null>(null)

    const router = useRouter()

    // Panel states
    const [showAdmisionPanel, setShowAdmisionPanel] = useState(false)
    const [showBulkPanel, setShowBulkPanel] = useState(false)
    const [showDetailPanel, setShowDetailPanel] = useState(false)
    const [selectedAtencion, setSelectedAtencion] = useState<Atencion | null>(null)

    // Admission form state
    const [rut, setRut] = useState('')
    const [nombres, setNombres] = useState('')
    const [apellidoPaterno, setApellidoPaterno] = useState('')
    const [apellidoMaterno, setApellidoMaterno] = useState('')
    const [fechaNacimiento, setFechaNacimiento] = useState('')
    const [sexo, setSexo] = useState('')
    const [email, setEmail] = useState('')
    const [empresaId, setEmpresaId] = useState('')
    const [cargoId, setCargoId] = useState('')
    const [workerFound, setWorkerFound] = useState(false)

    // Bulk upload state
    const [bulkFile, setBulkFile] = useState<File | null>(null)

    // Search in recent admissions
    const [searchRecent, setSearchRecent] = useState('')

    const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatearRUT(e.target.value)
        setRut(formatted)
    }

    useEffect(() => {
        fetchMaestros()
        fetchRecentAdmisions()
    }, [])

    // Battery auto-suggestion
    useEffect(() => {
        if (empresaId && cargoId) {
            const match = asignaciones.find(a => a.empresa_id === empresaId && a.cargo_id === cargoId)
            setBateriaSugerida(match?.baterias || null)
        } else {
            setBateriaSugerida(null)
        }
    }, [empresaId, cargoId, asignaciones])

    async function fetchMaestros() {
        const { data: emp } = await supabase.from('empresas').select('id, nombre, rut_empresa')
        const { data: car } = await supabase.from('cargos').select('id, nombre_cargo, es_gran_altura')
        const { data: asig } = await supabase.from('empresa_cargo_baterias').select('*, baterias(*, bateria_items(*, prestaciones(*)))')

        if (emp) setEmpresas(emp)
        if (car) setCargos(car as Cargo[])
        if (asig) setAsignaciones(asig as Asignacion[])
    }

    async function fetchRecentAdmisions() {
        const { data } = await supabase
            .from('atenciones')
            .select(`
                id,
                created_at,
                estado_aptitud,
                trabajadores (nombre_completo, rut),
                cargos (nombre_cargo),
                empresas (nombre)
            `)
            .order('created_at', { ascending: false })
            .limit(30)

        if (data) setRecentAdmisions(data as unknown as Atencion[])
    }

    // ── Panel Controls ──────────────────────────────────────
    function openAdmisionPanel() {
        resetAdmisionForm()
        setShowAdmisionPanel(true)
    }

    function closeAdmisionPanel() {
        setShowAdmisionPanel(false)
        resetAdmisionForm()
    }

    function openBulkPanel() {
        setBulkFile(null)
        setShowBulkPanel(true)
    }

    function closeBulkPanel() {
        setShowBulkPanel(false)
        setBulkFile(null)
    }

    function resetAdmisionForm() {
        setRut('')
        setNombres('')
        setApellidoPaterno('')
        setApellidoMaterno('')
        setFechaNacimiento('')
        setSexo('')
        setEmail('')
        setEmpresaId('')
        setCargoId('')
        setWorkerFound(false)
        setBateriaSugerida(null)
    }

    // ── Core Logic ──────────────────────────────────────────
    async function buscarTrabajador() {
        if (!rut) return
        setLoading(true)
        const { data } = await supabase
            .from('trabajadores')
            .select('*')
            .eq('rut', rut)
            .single()

        if (data) {
            setNombres(data.nombres || data.nombre_completo || '')
            setApellidoPaterno(data.apellido_paterno || '')
            setApellidoMaterno(data.apellido_materno || '')
            setFechaNacimiento(data.fecha_nacimiento || '')
            setSexo(data.sexo || '')
            setEmail(data.email || '')
            setWorkerFound(true)

            // ✨ Intelligent Suggestion: Try to auto-select Cargo based on pre-loaded data
            if (data.cargo && cargos.length > 0) {
                const matchedCargo = cargos.find(c =>
                    c.nombre_cargo.toLowerCase() === data.cargo.toLowerCase()
                )
                if (matchedCargo) {
                    setCargoId(matchedCargo.id)
                }
            }
        } else {
            setWorkerFound(false)
            setNombres('')
            setApellidoPaterno('')
            setApellidoMaterno('')
            setFechaNacimiento('')
            setSexo('')
            setEmail('')
            setCargoId('')
        }
        setLoading(false)
    }

    async function handleAdmision(e: React.FormEvent) {
        e.preventDefault()
        if (!empresaId || !cargoId) {
            alert('Debe seleccionar empresa y cargo.')
            return
        }
        setLoading(true)

        try {
            let currentWorkerId = ''
            const nombreCompleto = `${nombres} ${apellidoPaterno} ${apellidoMaterno}`.trim();

            const workerData = {
                rut,
                nombre_completo: nombreCompleto,
                nombres,
                apellido_paterno: apellidoPaterno,
                apellido_materno: apellidoMaterno,
                fecha_nacimiento: fechaNacimiento || null,
                sexo: sexo || null,
                email: email || null,
                cargo: cargos.find(c => c.id === cargoId)?.nombre_cargo || null
            }

            if (!workerFound) {
                const { data: newWorker, error: wError } = await supabase
                    .from('trabajadores')
                    .insert([workerData])
                    .select()
                    .single()

                if (wError) throw wError
                currentWorkerId = newWorker.id
            } else {
                const { data: updatedWorker, error: uError } = await supabase
                    .from('trabajadores')
                    .update(workerData)
                    .eq('rut', rut)
                    .select()
                    .single()

                if (uError) throw uError
                currentWorkerId = updatedWorker.id
            }

            const { data: newAtencion, error: aError } = await supabase
                .from('atenciones')
                .insert([{
                    trabajador_id: currentWorkerId,
                    empresa_id: empresaId,
                    cargo_id: cargoId,
                    estado_aptitud: 'pendiente'
                }])
                .select()
                .single()

            if (aError) throw aError

            if (bateriaSugerida && bateriaSugerida.bateria_items) {
                const examsToInsert = bateriaSugerida.bateria_items.map((bi: BateriaItem) => ({
                    atencion_id: newAtencion.id,
                    prestacion_id: bi.prestacion_id,
                    estado: 'nuevo',
                    rol_asignado: bi.prestaciones?.rol_responsable || 'General'
                }));

                if (examsToInsert.length > 0) {
                    const { error: iError } = await supabase
                        .from('atencion_examenes')
                        .insert(examsToInsert);

                    if (iError) console.error('Error insertando exámenes de batería:', iError);
                }
            }

            closeAdmisionPanel()
            fetchRecentAdmisions()
            alert('¡Admisión exitosa! El flujo Fast-Track ha comenzado.')
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Error desconocido'
            alert('Error en admisión: ' + msg)
        } finally {
            setLoading(false)
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
                const [csvRut, nom, apP, apM, csvEmail, fNac, sx, cargo] = parts
                return {
                    rut: formatearRUT(csvRut),
                    nombres: nom,
                    apellido_paterno: apP,
                    apellido_materno: apM,
                    nombre_completo: `${nom} ${apP} ${apM}`.trim(),
                    email: csvEmail || null,
                    fecha_nacimiento: fNac || null,
                    sexo: sx || null,
                    cargo: cargo || null
                }
            })

            try {
                const { error } = await supabase
                    .from('trabajadores')
                    .upsert(workersToRegister, { onConflict: 'rut' })

                if (error) throw error
                alert(`¡Se han cargado ${workersToRegister.length} trabajadores exitosamente!`)
                closeBulkPanel()
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Error desconocido'
                alert('Error en carga masiva: ' + msg)
            } finally {
                setLoading(false)
            }
        }
        reader.readAsText(bulkFile)
    }

    // ── Computed Values ─────────────────────────────────────
    const stats = useMemo(() => {
        const totals = { pendiente: 0, apto: 0, no_apto: 0, remediacion: 0 }
        recentAdmisions.forEach(a => {
            const estado = (a.estado_aptitud || 'pendiente') as keyof typeof totals
            if (estado in totals) totals[estado]++
        })
        return { ...totals, total: recentAdmisions.length }
    }, [recentAdmisions])

    const filteredAdmisions = useMemo(() => {
        if (!searchRecent.trim()) return recentAdmisions
        const q = searchRecent.toLowerCase()
        return recentAdmisions.filter(a =>
            (a.trabajadores?.nombre_completo || '').toLowerCase().includes(q) ||
            (a.trabajadores?.rut || '').toLowerCase().includes(q) ||
            (a.cargos?.nombre_cargo || '').toLowerCase().includes(q) ||
            (a.empresas?.nombre || '').toLowerCase().includes(q)
        )
    }, [recentAdmisions, searchRecent])

    const selectedCargo = useMemo(() => cargos.find(c => c.id === cargoId), [cargos, cargoId])
    const selectedEmpresa = useMemo(() => empresas.find(e => e.id === empresaId), [empresas, empresaId])

    // ── Render ──────────────────────────────────────────────
    return (
        <div className="admision-page animate-fade">
            {/* ─── Header ─── */}
            <header className="page-header">
                <div className="header-content">
                    <div>
                        <h1>Admisión de Trabajadores</h1>
                        <p className="header-subtitle">Centro de ingreso Fast-Track y seguimiento de evaluaciones ocupacionales.</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-secondary" onClick={openBulkPanel}>
                            📂 Carga Masiva
                        </button>
                        <button className="btn btn-primary" onClick={openAdmisionPanel}>
                            + Nueva Admisión
                        </button>
                    </div>
                </div>
            </header>

            {/* ─── Stats Row ─── */}
            <section className="stats-row">
                <div className="stat-card">
                    <span className="stat-number">{stats.total}</span>
                    <span className="stat-label">Total</span>
                </div>
                <div className="stat-card stat-success">
                    <span className="stat-number">{stats.apto}</span>
                    <span className="stat-label">Aptos</span>
                </div>
                <div className="stat-card stat-warning">
                    <span className="stat-number">{stats.pendiente}</span>
                    <span className="stat-label">Pendientes</span>
                </div>
                <div className="stat-card stat-danger">
                    <span className="stat-number">{stats.no_apto}</span>
                    <span className="stat-label">No Aptos</span>
                </div>
                <div className="stat-card stat-remed">
                    <span className="stat-number">{stats.remediacion}</span>
                    <span className="stat-label">Remediación</span>
                </div>
            </section>

            {/* ─── Search Bar ─── */}
            <div className="search-bar">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    placeholder="Buscar por nombre, RUT, cargo o empresa..."
                    value={searchRecent}
                    onChange={e => setSearchRecent(e.target.value)}
                    className="search-input"
                />
                {searchRecent && (
                    <button className="search-clear" onClick={() => setSearchRecent('')}>✕</button>
                )}
            </div>

            {/* ─── Admissions Table ─── */}
            <div className="table-container">
                <table className="admision-table">
                    <thead>
                        <tr>
                            <th>Trabajador</th>
                            <th>RUT</th>
                            <th>Empresa</th>
                            <th>Cargo</th>
                            <th>Fecha Ingreso</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAdmisions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="empty-state">
                                    <div className="empty-icon">📋</div>
                                    <p>No hay admisiones registradas aún.</p>
                                    <button className="btn btn-primary btn-sm" onClick={openAdmisionPanel}>
                                        Crear primera admisión
                                    </button>
                                </td>
                            </tr>
                        ) : (
                            filteredAdmisions.map(a => (
                                <tr key={a.id} className="clickable-row" onClick={() => { setSelectedAtencion(a); setShowDetailPanel(true); }}>
                                    <td className="td-worker">
                                        <div className="worker-avatar">{(a.trabajadores?.nombre_completo || '?')[0]}</div>
                                        <strong>{a.trabajadores?.nombre_completo}</strong>
                                    </td>
                                    <td className="td-mono">{a.trabajadores?.rut ? formatearRUT(a.trabajadores.rut) : '—'}</td>
                                    <td>{a.empresas?.nombre || '—'}</td>
                                    <td>{a.cargos?.nombre_cargo || '—'}</td>
                                    <td className="td-date">{new Date(a.created_at).toLocaleDateString('es-CL')}</td>
                                    <td>
                                        <span className={`status-badge status-${a.estado_aptitud?.toLowerCase() || 'pendiente'}`}>
                                            {a.estado_aptitud?.toUpperCase() || 'PENDIENTE'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ═══════════════════════════════════════════════════════
                PANEL LATERAL: Nueva Admisión
               ═══════════════════════════════════════════════════════ */}
            <div className={`side-panel ${showAdmisionPanel ? 'open' : ''}`}>
                <div className="side-panel-overlay" onClick={closeAdmisionPanel}></div>
                <div className="side-panel-content">
                    <div className="side-panel-header">
                        <h3>🏥 Nueva Admisión</h3>
                        <button className="btn-close" onClick={closeAdmisionPanel}>&times;</button>
                    </div>
                    <p className="section-hint">Inicie el proceso Fast-Track asignando empresa y batería de exámenes al trabajador.</p>

                    <form className="panel-form" onSubmit={handleAdmision}>
                        {/* RUT Search */}
                        <div className="form-group">
                            <label>RUT del Trabajador</label>
                            <div className="rut-search-row">
                                <input
                                    type="text"
                                    placeholder="12.345.678-9"
                                    value={rut}
                                    onChange={handleRutChange}
                                    onBlur={buscarTrabajador}
                                    autoFocus
                                />
                                <button type="button" className="btn-rut-search" onClick={buscarTrabajador} disabled={loading}>
                                    {loading ? '⏳' : '🔍'}
                                </button>
                            </div>
                            {workerFound && (
                                <span className="rut-found-badge">✅ Trabajador encontrado en sistema</span>
                            )}
                        </div>

                        {/* Worker Data */}
                        <div className="form-group">
                            <label>Nombres</label>
                            <input
                                type="text"
                                placeholder="Ej: Juan Pablo"
                                value={nombres}
                                onChange={e => setNombres(e.target.value)}
                                disabled={workerFound && !!nombres}
                                required
                            />
                        </div>

                        <div className="form-row-2">
                            <div className="form-group">
                                <label>Apellido Paterno</label>
                                <input
                                    type="text"
                                    placeholder="Pérez"
                                    value={apellidoPaterno}
                                    onChange={e => setApellidoPaterno(e.target.value)}
                                    disabled={workerFound && !!apellidoPaterno}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Apellido Materno</label>
                                <input
                                    type="text"
                                    placeholder="González"
                                    value={apellidoMaterno}
                                    onChange={e => setApellidoMaterno(e.target.value)}
                                    disabled={workerFound && !!apellidoMaterno}
                                />
                            </div>
                        </div>

                        <div className="form-row-2">
                            <div className="form-group">
                                <label>Fecha de Nacimiento</label>
                                <input
                                    type="date"
                                    value={fechaNacimiento}
                                    onChange={e => setFechaNacimiento(e.target.value)}
                                    disabled={workerFound && !!fechaNacimiento}
                                />
                            </div>
                            <div className="form-group">
                                <label>Sexo</label>
                                <select
                                    value={sexo}
                                    onChange={e => setSexo(e.target.value)}
                                    disabled={workerFound && !!sexo}
                                >
                                    <option value="">Seleccione...</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Correo Electrónico</label>
                            <input
                                type="email"
                                placeholder="ejemplo@correo.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                disabled={workerFound && !!email}
                            />
                        </div>

                        {/* Divider */}
                        <div className="panel-divider">
                            <span>Asignación Ocupacional</span>
                        </div>

                        <div className="form-row-2">
                            <div className="form-group">
                                <label>Empresa</label>
                                <select value={empresaId} onChange={e => setEmpresaId(e.target.value)} required>
                                    <option value="">Seleccione...</option>
                                    {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Cargo</label>
                                <select value={cargoId} onChange={e => setCargoId(e.target.value)} required>
                                    <option value="">Seleccione...</option>
                                    {cargos.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.nombre_cargo} {c.es_gran_altura ? '🏔️' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* AI Intelligence Card */}
                        <div className={`ai-card ${bateriaSugerida ? 'ai-card-glow' : ''}`}>
                            <div className="ai-card-header">
                                <span className="ai-spark animate-pulse">✨</span>
                                <span className="ai-title">Motor de Inteligencia</span>
                            </div>
                            {bateriaSugerida ? (
                                <div className="ai-body">
                                    <p className="ai-match">✅ Batería: <strong>{bateriaSugerida.nombre}</strong></p>
                                    {bateriaSugerida.descripcion && (
                                        <p className="ai-desc">{bateriaSugerida.descripcion}</p>
                                    )}
                                    <div className="ai-items">
                                        <span className="ai-items-label">Exámenes incluidos:</span>
                                        {bateriaSugerida.bateria_items?.map((bi: BateriaItem, i: number) => (
                                            <span key={i} className="ai-exam-tag">{bi.prestaciones?.nombre}</span>
                                        ))}
                                    </div>
                                    {selectedCargo?.es_gran_altura && (
                                        <span className="ai-altitude">🏔️ Perfil Gran Altura Activo</span>
                                    )}
                                </div>
                            ) : cargoId && empresaId ? (
                                <div className="ai-body">
                                    <p className="ai-warn">⚠️ No hay batería configurada para esta combinación empresa-cargo.</p>
                                    {selectedCargo?.es_gran_altura && (
                                        <span className="ai-altitude">🏔️ Requiere evaluación de Gran Altura</span>
                                    )}
                                </div>
                            ) : (
                                <p className="ai-placeholder">Seleccione empresa y cargo para activar detección automática.</p>
                            )}
                        </div>

                        <button type="submit" className="btn btn-primary full-width mt-4" disabled={loading}>
                            {loading ? '⏳ Procesando...' : '🚀 Confirmar Admisión Fast-Track'}
                        </button>
                    </form>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
                PANEL LATERAL: Carga Masiva
               ═══════════════════════════════════════════════════════ */}
            <div className={`side-panel ${showBulkPanel ? 'open' : ''}`}>
                <div className="side-panel-overlay" onClick={closeBulkPanel}></div>
                <div className="side-panel-content">
                    <div className="side-panel-header">
                        <h3>📂 Carga Masiva</h3>
                        <button className="btn-close" onClick={closeBulkPanel}>&times;</button>
                    </div>
                    <p className="section-hint">Suba su nómina de trabajadores en formato CSV para registrarlos de forma automática en el sistema.</p>

                    <div className="panel-form">
                        <div className="bulk-instructions">
                            <h4>📋 Formato del CSV</h4>
                            <div className="csv-columns">
                                {['RUT', 'Nombres', 'Ap. Paterno', 'Ap. Materno', 'Email', 'F. Nacimiento', 'Sexo', 'Cargo'].map((col, i) => (
                                    <span key={col} className="csv-col-tag">
                                        <span className="csv-col-num">{i + 1}</span>
                                        {col}
                                    </span>
                                ))}
                            </div>
                            <div className="csv-notes">
                                <p>• Use RUT con puntos y guion (12.345.678-9)</p>
                                <p>• Fecha en formato YYYY-MM-DD</p>
                                <p>• Sexo: Masculino / Femenino</p>
                                <p>• La primera fila (encabezados) será ignorada</p>
                            </div>
                        </div>

                        <div className="panel-divider">
                            <span>Seleccionar Archivo</span>
                        </div>

                        <div className="bulk-dropzone">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={e => setBulkFile(e.target.files?.[0] || null)}
                                id="bulk-file-input"
                                className="hidden-input"
                            />
                            <label htmlFor="bulk-file-input" className="dropzone-label">
                                {bulkFile ? (
                                    <div className="file-selected">
                                        <span className="file-icon">📄</span>
                                        <span className="file-name">{bulkFile.name}</span>
                                        <span className="file-size">{(bulkFile.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                ) : (
                                    <div className="dropzone-empty">
                                        <span className="drop-icon">📁</span>
                                        <span className="drop-text">Seleccionar archivo .csv</span>
                                        <span className="drop-hint">Click o arrastre aquí</span>
                                    </div>
                                )}
                            </label>
                        </div>

                        {bulkFile && (
                            <button
                                className="btn btn-primary full-width mt-4"
                                onClick={handleBulkUpload}
                                disabled={loading}
                            >
                                {loading ? '⏳ Procesando...' : '🚀 Procesar Carga Masiva'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
                PANEL LATERAL: Detalle del Paciente
               ═══════════════════════════════════════════════════════ */}
            <div className={`side-panel ${showDetailPanel ? 'open' : ''}`}>
                <div className="side-panel-overlay" onClick={() => { setShowDetailPanel(false); setSelectedAtencion(null); }}></div>
                <div className="side-panel-content">
                    <div className="side-panel-header">
                        <h3>📋 Ficha del Paciente</h3>
                        <button className="btn-close" onClick={() => { setShowDetailPanel(false); setSelectedAtencion(null); }}>&times;</button>
                    </div>

                    {selectedAtencion && (
                        <div className="detail-body">
                            {/* Avatar & Name */}
                            <div className="detail-hero">
                                <div className="detail-avatar">
                                    {(selectedAtencion.trabajadores?.nombre_completo || '?')[0]}
                                </div>
                                <div className="detail-hero-info">
                                    <h2 className="detail-name">{selectedAtencion.trabajadores?.nombre_completo}</h2>
                                    <span className="detail-rut">
                                        {selectedAtencion.trabajadores?.rut ? formatearRUT(selectedAtencion.trabajadores.rut) : '—'}
                                    </span>
                                </div>
                            </div>

                            {/* Info Cards */}
                            <div className="detail-grid">
                                <div className="detail-card">
                                    <span className="detail-card-label">Empresa</span>
                                    <span className="detail-card-value">{selectedAtencion.empresas?.nombre || '—'}</span>
                                </div>
                                <div className="detail-card">
                                    <span className="detail-card-label">Cargo</span>
                                    <span className="detail-card-value">{selectedAtencion.cargos?.nombre_cargo || '—'}</span>
                                </div>
                                <div className="detail-card">
                                    <span className="detail-card-label">Fecha de Ingreso</span>
                                    <span className="detail-card-value">
                                        {new Date(selectedAtencion.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="detail-card">
                                    <span className="detail-card-label">Hora</span>
                                    <span className="detail-card-value">
                                        {new Date(selectedAtencion.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="detail-status-section">
                                <span className="detail-card-label">Estado de Aptitud</span>
                                <span className={`detail-status-pill status-${selectedAtencion.estado_aptitud?.toLowerCase() || 'pendiente'}`}>
                                    {selectedAtencion.estado_aptitud?.toUpperCase() || 'PENDIENTE'}
                                </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="detail-actions">
                                <button
                                    className="btn btn-primary full-width detail-eval-btn"
                                    onClick={() => router.push(`/evaluacion/${selectedAtencion.id}`)}
                                >
                                    🩺 Ir a Evaluación Médica
                                </button>
                                <button
                                    className="btn btn-secondary full-width"
                                    onClick={() => { setShowDetailPanel(false); setSelectedAtencion(null); }}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
                CSS Styles
               ═══════════════════════════════════════════════════════ */}
            <style jsx>{`
                .admision-page { display: flex; flex-direction: column; gap: 1.5rem; color: #fff; }

                /* Header */
                .page-header { margin-bottom: 0.5rem; }
                .header-content { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
                .header-content h1 { font-size: 2rem; font-weight: 900; color: var(--text-main); margin: 0; }
                .header-subtitle { font-size: 0.95rem; color: var(--text-muted); margin-top: 0.3rem; }
                .header-actions { display: flex; gap: 0.75rem; }

                /* Stats */
                .stats-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; }
                .stat-card {
                    background: rgba(255,255,255,0.03); border: 1px solid var(--border-color);
                    border-radius: 16px; padding: 1.3rem 1.5rem; display: flex; flex-direction: column;
                    gap: 0.2rem; transition: all 0.3s ease;
                }
                .stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
                .stat-number { font-size: 2rem; font-weight: 900; font-family: 'Outfit', sans-serif; color: var(--text-main); }
                .stat-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.04em; }
                .stat-success .stat-number { color: #22c55e; }
                .stat-warning .stat-number { color: #f59e0b; }
                .stat-danger .stat-number { color: #ef4444; }
                .stat-remed .stat-number { color: #a855f7; }

                /* Search */
                .search-bar {
                    display: flex; align-items: center; gap: 0.75rem;
                    background: rgba(255,255,255,0.03); border: 1.5px solid var(--border-color);
                    border-radius: 14px; padding: 0.75rem 1.2rem; transition: all 0.2s;
                }
                .search-bar:focus-within { border-color: var(--brand-primary); background: rgba(255,107,44,0.02); }
                .search-icon { font-size: 1.1rem; opacity: 0.5; }
                .search-input { flex: 1; background: transparent; border: none; color: #fff; font-size: 0.95rem; outline: none; }
                .search-clear { background: rgba(255,255,255,0.08); border: none; color: #fff; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; transition: 0.2s; }
                .search-clear:hover { background: rgba(255,107,44,0.2); }

                /* Table */
                .table-container {
                    background: rgba(255,255,255,0.015); border: 1px solid var(--border-color);
                    border-radius: 16px; overflow: hidden;
                }
                .admision-table { width: 100%; border-collapse: collapse; }
                .admision-table th {
                    text-align: left; padding: 1rem 1.2rem; font-size: 0.7rem; font-weight: 800;
                    text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted);
                    background: rgba(255,255,255,0.03); border-bottom: 2px solid var(--border-color);
                }
                .admision-table td { padding: 0.9rem 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 0.9rem; }
                .admision-table tbody tr { transition: all 0.15s; }
                .admision-table tbody tr:hover { background: rgba(255,255,255,0.025); }
                .admision-table tbody tr.clickable-row { cursor: pointer; }
                .admision-table tbody tr.clickable-row:hover { background: rgba(255,107,44,0.04); }

                .td-worker { display: flex; align-items: center; gap: 0.75rem; }
                .worker-avatar {
                    width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center;
                    justify-content: center; font-weight: 800; font-size: 0.85rem;
                    background: linear-gradient(135deg, rgba(255,107,44,0.2), rgba(255,107,44,0.05));
                    color: var(--brand-primary); border: 1px solid rgba(255,107,44,0.2);
                }
                .td-mono { font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; color: var(--text-muted); }
                .td-date { font-size: 0.82rem; color: var(--text-muted); }

                .status-badge {
                    font-size: 0.68rem; font-weight: 800; padding: 0.25rem 0.7rem;
                    border-radius: 20px; letter-spacing: 0.03em;
                }
                .status-pendiente { background: rgba(255,255,255,0.06); color: var(--text-muted); }
                .status-apto { background: rgba(34,197,94,0.12); color: #22c55e; }
                .status-no_apto { background: rgba(239,68,68,0.12); color: #ef4444; }
                .status-remediacion { background: rgba(168,85,247,0.12); color: #a855f7; }

                .empty-state { text-align: center; padding: 3rem 1rem; color: var(--text-muted); }
                .empty-icon { font-size: 2.5rem; margin-bottom: 0.5rem; opacity: 0.4; }
                .empty-state p { margin-bottom: 1rem; }

                /* ── Side Panel (Drawer) ── */
                .side-panel {
                    position: fixed; top: 0; right: 0; width: 100%; height: 100%;
                    z-index: 3000; visibility: hidden; transition: all 0.3s;
                }
                .side-panel.open { visibility: visible; }
                .side-panel-overlay {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);
                    opacity: 0; transition: opacity 0.3s;
                }
                .side-panel.open .side-panel-overlay { opacity: 1; }
                .side-panel-content {
                    position: absolute; top: 0; right: -540px; width: 540px; height: 100%;
                    background: #0d0d0d; border-left: 1px solid var(--border-color);
                    padding: 2.5rem; box-shadow: -20px 0 70px rgba(0,0,0,0.6);
                    transition: right 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                    display: flex; flex-direction: column; overflow-y: auto;
                }
                .side-panel.open .side-panel-content { right: 0; }
                .side-panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
                .side-panel-header h3 { font-size: 1.5rem; font-weight: 900; color: #fff; margin: 0; }

                .section-hint { font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1.5rem; }

                .btn-close {
                    width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
                    border-radius: 10px; background: rgba(255,255,255,0.05); border: 1.5px solid var(--border-color);
                    color: #fff; cursor: pointer; transition: 0.25s; font-size: 1.4rem; line-height: 1;
                }
                .btn-close:hover { background: var(--brand-primary); border-color: var(--brand-primary); transform: rotate(90deg); }

                /* Panel Form */
                .panel-form { display: flex; flex-direction: column; gap: 0.25rem; flex: 1; overflow-y: auto; padding-right: 0.5rem; }
                .form-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
                .form-group label { font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
                .form-group input, .form-group select {
                    background: rgba(255,255,255,0.03); border: 1.5px solid var(--border-color);
                    border-radius: 12px; padding: 0.8rem 1rem; color: #fff; font-size: 0.92rem;
                    transition: all 0.2s; outline: none;
                }
                .form-group input:focus, .form-group select:focus { border-color: var(--brand-primary); background: rgba(255,107,44,0.02); }
                .form-group input:disabled, .form-group select:disabled { opacity: 0.5; cursor: not-allowed; }
                .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

                /* RUT Search */
                .rut-search-row { display: flex; gap: 0.5rem; }
                .rut-search-row input { flex: 1; }
                .btn-rut-search {
                    width: 48px; display: flex; align-items: center; justify-content: center;
                    background: rgba(255,255,255,0.05); border: 1.5px solid var(--border-color);
                    border-radius: 12px; cursor: pointer; font-size: 1.2rem; transition: 0.2s;
                }
                .btn-rut-search:hover { border-color: var(--brand-primary); background: rgba(255,107,44,0.1); }
                .rut-found-badge {
                    font-size: 0.75rem; font-weight: 700; color: #22c55e;
                    background: rgba(34,197,94,0.1); padding: 0.3rem 0.8rem; border-radius: 8px;
                    align-self: flex-start; margin-top: 0.25rem;
                }

                /* Divider */
                .panel-divider {
                    display: flex; align-items: center; gap: 1rem; margin: 1.25rem 0;
                }
                .panel-divider::before, .panel-divider::after {
                    content: ''; flex: 1; height: 1px; background: var(--border-color);
                }
                .panel-divider span {
                    font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
                    color: var(--brand-primary); letter-spacing: 0.06em; white-space: nowrap;
                }

                /* AI Card */
                .ai-card {
                    background: rgba(255,255,255,0.02); border: 1px solid var(--border-color);
                    border-radius: 14px; padding: 1.2rem; margin-top: 0.5rem;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .ai-card-glow {
                    background: rgba(34, 197, 94, 0.03);
                    border-color: rgba(34, 197, 94, 0.4);
                    box-shadow: 0 0 20px rgba(34, 197, 94, 0.05);
                }
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: .7; transform: scale(1.1); }
                }
                .ai-card-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
                .ai-spark { font-size: 1.2rem; }
                .ai-title { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.04em; }
                .ai-match { font-size: 0.9rem; margin: 0 0 0.4rem 0; color: #22c55e; }
                .ai-desc { font-size: 0.8rem; color: var(--text-muted); margin: 0 0 0.6rem 0; }
                .ai-items { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.5rem; }
                .ai-items-label { font-size: 0.68rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; display: block; width: 100%; margin-bottom: 0.2rem; }
                .ai-exam-tag {
                    font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem;
                    border-radius: 6px; background: rgba(255,107,44,0.1); color: var(--brand-primary);
                }
                .ai-altitude { font-size: 0.8rem; font-weight: 700; color: var(--brand-primary); margin-top: 0.5rem; display: block; }
                .ai-warn { font-size: 0.85rem; color: #f59e0b; margin: 0; }
                .ai-placeholder { font-size: 0.82rem; color: var(--text-muted); margin: 0; font-style: italic; }
                .ai-body { display: flex; flex-direction: column; }

                /* Bulk Upload */
                .bulk-instructions { background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 14px; padding: 1.2rem; }
                .bulk-instructions h4 { margin: 0 0 0.8rem 0; font-size: 0.95rem; }
                .csv-columns { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.8rem; }
                .csv-col-tag {
                    display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 600;
                    background: rgba(255,255,255,0.04); border: 1px solid var(--border-color);
                    padding: 0.3rem 0.6rem; border-radius: 8px; color: var(--text-main);
                }
                .csv-col-num {
                    width: 18px; height: 18px; border-radius: 5px; display: flex; align-items: center;
                    justify-content: center; font-size: 0.6rem; font-weight: 800;
                    background: var(--brand-primary); color: white;
                }
                .csv-notes { font-size: 0.78rem; color: var(--text-muted); line-height: 1.7; }
                .csv-notes p { margin: 0; }

                .bulk-dropzone { margin-top: 0.5rem; }
                .hidden-input { display: none; }
                .dropzone-label {
                    display: block; cursor: pointer; border: 2px dashed var(--border-color);
                    border-radius: 14px; padding: 1.5rem; text-align: center;
                    transition: all 0.2s;
                }
                .dropzone-label:hover { border-color: var(--brand-primary); background: rgba(255,107,44,0.02); }
                .dropzone-empty { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; }
                .drop-icon { font-size: 2rem; opacity: 0.5; }
                .drop-text { font-size: 0.9rem; font-weight: 600; color: var(--text-main); }
                .drop-hint { font-size: 0.72rem; color: var(--text-muted); }

                .file-selected { display: flex; align-items: center; gap: 0.75rem; }
                .file-icon { font-size: 1.5rem; }
                .file-name { font-size: 0.9rem; font-weight: 700; color: var(--brand-primary); }
                .file-size { font-size: 0.75rem; color: var(--text-muted); }

                /* Buttons */
                .btn {
                    padding: 0.8rem 1.4rem; border-radius: 12px; font-weight: 750; cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); border: none;
                    display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
                    font-size: 0.9rem;
                }
                .btn-primary { background: var(--brand-primary); color: white; }
                .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(255,107,44,0.4); filter: brightness(1.1); }
                .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
                .btn-secondary { background: rgba(255,255,255,0.04); color: #fff; border: 1.5px solid var(--border-color); }
                .btn-secondary:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); }
                .btn-sm { padding: 0.5rem 1rem; font-size: 0.82rem; }

                .full-width { width: 100%; }
                .mt-4 { margin-top: 1rem; }

                /* Detail Side Panel */
                .detail-body { display: flex; flex-direction: column; gap: 1.5rem; flex: 1; }
                .detail-hero { display: flex; align-items: center; gap: 1.2rem; padding: 1.5rem; background: rgba(255,107,44,0.04); border-radius: 16px; border: 1px solid rgba(255,107,44,0.1); }
                .detail-avatar {
                    width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center;
                    justify-content: center; font-weight: 900; font-size: 1.5rem;
                    background: linear-gradient(135deg, rgba(255,107,44,0.25), rgba(255,107,44,0.08));
                    color: var(--brand-primary); border: 2px solid rgba(255,107,44,0.3);
                }
                .detail-hero-info { display: flex; flex-direction: column; gap: 0.2rem; }
                .detail-name { font-size: 1.3rem; font-weight: 900; color: #fff; margin: 0; }
                .detail-rut { font-size: 0.85rem; font-family: 'JetBrains Mono', monospace; color: var(--text-muted); }

                .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
                .detail-card {
                    display: flex; flex-direction: column; gap: 0.3rem; padding: 1rem;
                    background: rgba(255,255,255,0.025); border: 1px solid var(--border-color);
                    border-radius: 12px; transition: 0.2s;
                }
                .detail-card:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); }
                .detail-card-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); }
                .detail-card-value { font-size: 0.95rem; font-weight: 700; color: #fff; }

                .detail-status-section { display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid var(--border-color); }
                .detail-status-pill {
                    font-size: 0.85rem; font-weight: 900; padding: 0.5rem 1.2rem;
                    border-radius: 12px; text-align: center; letter-spacing: 0.06em;
                }

                .detail-actions { display: flex; flex-direction: column; gap: 0.75rem; margin-top: auto; padding-top: 1rem; }
                .detail-eval-btn { font-size: 1rem; padding: 1.1rem; border-radius: 14px; }

                /* Responsive */
                @media (max-width: 768px) {
                    .stats-row { grid-template-columns: repeat(2, 1fr); }
                    .header-content { flex-direction: column; align-items: flex-start; }
                    .side-panel-content { width: 100%; right: -100%; padding: 1.5rem; }
                    .form-row-2 { grid-template-columns: 1fr; }
                    .detail-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    )
}
