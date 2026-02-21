"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatearRUT, normalizarRUT } from '@/lib/skills/formateadorRUT'

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
    faena_nombre?: string;
    cargo_id: string;
    bateria_id: string;
    baterias?: Bateria;
}

interface Atencion {
    id: string;
    created_at: string;
    fecha_atencion?: string;
    nro_ot?: string;
    url_cedula?: string;
    url_licencia?: string;
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
    const [verArchivados, setVerArchivados] = useState(false)

    // Admission form state
    const [rut, setRut] = useState('')
    const [nombres, setNombres] = useState('')
    const [apellidoPaterno, setApellidoPaterno] = useState('')
    const [apellidoMaterno, setApellidoMaterno] = useState('')
    const [fechaNacimiento, setFechaNacimiento] = useState('')
    const [sexo, setSexo] = useState('')
    const [email, setEmail] = useState('')
    const [empresaId, setEmpresaId] = useState('')
    const [faena, setFaena] = useState('')
    const [cargoId, setCargoId] = useState('')
    const [workerFound, setWorkerFound] = useState(false)

    // Bulk upload state
    const [bulkFile, setBulkFile] = useState<File | null>(null)

    // Search in recent admissions
    const [searchRecent, setSearchRecent] = useState('')

    const stats = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0]
        return {
            enAgenda: recentAdmisions.filter(at => ['en_espera', 'en_atencion', 'pendiente', 'remediacion'].includes(at.estado_aptitud)).length,
            aptosHoy: recentAdmisions.filter(at => ['apto', 'apto_r'].includes(at.estado_aptitud) && (at.fecha_atencion?.startsWith(todayStr) || at.created_at.startsWith(todayStr))).length,
            noAptos: recentAdmisions.filter(at => ['no_apto', 'no_apto_r'].includes(at.estado_aptitud)).length
        }
    }, [recentAdmisions])

    const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatearRUT(e.target.value)
        setRut(formatted)
    }

    const handleRutBlur = () => {
        if (!rut) return
        const normalized = normalizarRUT(rut)
        setRut(normalized)
        // La búsqueda se hace después de la normalización
        setTimeout(() => buscarTrabajador(), 0)
    }

    useEffect(() => {
        fetchMaestros()
        fetchRecentAdmisions()
    }, [])

    // Battery auto-suggestion
    useEffect(() => {
        if (empresaId && cargoId && faena) {
            const match = asignaciones.find(a =>
                a.empresa_id === empresaId &&
                a.cargo_id === cargoId &&
                (a.faena_nombre === faena || !a.faena_nombre)
            )
            setBateriaSugerida(match?.baterias || null)
        } else {
            setBateriaSugerida(null)
        }
    }, [empresaId, cargoId, faena, asignaciones])

    async function fetchMaestros() {
        const { data: emp } = await supabase.from('empresas').select('id, nombre, rut_empresa, faenas')
        const { data: car } = await supabase.from('cargos').select('id, nombre_cargo, es_gran_altura')
        const { data: asig } = await supabase.from('empresa_cargo_baterias').select('*, baterias(*, bateria_items(*, prestaciones(*)))')

        if (emp) setEmpresas(emp as any)
        if (car) setCargos(car as Cargo[])
        if (asig) setAsignaciones(asig as Asignacion[])
    }

    async function fetchRecentAdmisions() {
        const { data } = await supabase
            .from('atenciones')
            .select(`
                id,
                created_at,
                fecha_atencion,
                nro_ot,
                url_cedula,
                url_licencia,
                estado_aptitud,
                trabajadores (nombre_completo, rut),
                cargos (nombre_cargo),
                empresas (nombre)
            `)
            .order('created_at', { ascending: false })
            .limit(100)

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

            if (data.cargo && cargos.length > 0) {
                const matchedCargo = cargos.find(c =>
                    c.nombre_cargo.toLowerCase() === data.cargo.toLowerCase()
                )
                if (matchedCargo) setCargoId(matchedCargo.id)
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

    async function iniciarAtencion(atId: string) {
        setLoading(true)
        try {
            const { data: ot, error } = await supabase.rpc('iniciar_atencion_proceso', { p_atencion_id: atId })
            if (error) throw error

            fetchRecentAdmisions()
            alert(`Atención iniciada. N° OT generado: ${ot}`)
        } catch (err: any) {
            alert('Error al iniciar atención: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleFileUpload(atId: string, field: 'url_cedula' | 'url_licencia', file: File) {
        setLoading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${atId}_${field}.${fileExt}`
            const { error: uploadError } = await supabase.storage
                .from('documentos-admision')
                .upload(fileName, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage.from('documentos-admision').getPublicUrl(fileName)

            const { error: updateError } = await supabase
                .from('atenciones')
                .update({ [field]: publicUrl })
                .eq('id', atId)

            if (updateError) throw updateError
            fetchRecentAdmisions()
        } catch (err: any) {
            alert('Error al subir documento: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const filteredAdmisions = useMemo(() => {
        return recentAdmisions.filter(at => {
            const q = searchRecent.toLowerCase()
            const matchesSearch =
                (at.trabajadores?.nombre_completo || '').toLowerCase().includes(q) ||
                (at.trabajadores?.rut || '').includes(q) ||
                (at.empresas?.nombre || '').toLowerCase().includes(q) ||
                (at.nro_ot || '').toLowerCase().includes(q)

            const isFinalizado = ['apto', 'no_apto', 'apto_r', 'no_apto_r'].includes(at.estado_aptitud)

            if (verArchivados) return matchesSearch && isFinalizado
            return matchesSearch && !isFinalizado
        })
    }, [recentAdmisions, searchRecent, verArchivados])

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
                const { data: newWorker, error: wError } = await supabase.from('trabajadores').insert([workerData]).select().single()
                if (wError) throw wError
                currentWorkerId = newWorker.id
            } else {
                const { data: updatedWorker, error: uError } = await supabase.from('trabajadores').update(workerData).eq('rut', rut).select().single()
                if (uError) throw uError
                currentWorkerId = updatedWorker.id
            }

            const { data: newAtencion, error: aError } = await supabase.from('atenciones').insert([{
                trabajador_id: currentWorkerId,
                empresa_id: empresaId,
                cargo_id: cargoId,
                estado_aptitud: 'en_espera'
            }]).select().single()

            if (aError) throw aError

            if (bateriaSugerida && bateriaSugerida.bateria_items) {
                const examsToInsert = bateriaSugerida.bateria_items.map((bi: BateriaItem) => ({
                    atencion_id: newAtencion.id,
                    prestacion_id: bi.prestacion_id,
                    estado: 'nuevo',
                    rol_asignado: bi.prestaciones?.rol_responsable || 'General'
                }));
                if (examsToInsert.length > 0) {
                    await supabase.from('atencion_examenes').insert(examsToInsert);
                }
            }

            closeAdmisionPanel()
            fetchRecentAdmisions()
        } catch (err: any) {
            console.error('Error en Admisión:', err)
            alert('Error al crear la admisión: ' + (err.message || 'Error desconocido'))
        } finally {
            setLoading(false)
        }
    }

    async function handleBulkProcess() {
        if (!bulkFile) return
        setLoading(true)
        try {
            const text = await bulkFile.text()
            const lines = text.split('\n').map(l => l.trim()).filter(l => l)
            if (lines.length <= 1) throw new Error('El archivo está vacío o solo contiene encabezados.')

            const headers = lines[0].toLowerCase().split(',')
            const colIdx = {
                rut: headers.indexOf('rut'),
                nombre: headers.indexOf('nombre'),
                paterno: headers.indexOf('paterno'),
                materno: headers.indexOf('materno'),
                email: headers.indexOf('email'),
                empresa: headers.indexOf('empresa'),
                cargo: headers.indexOf('cargo')
            }

            let successCount = 0
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',')
                const rowRut = values[colIdx.rut]?.trim()
                if (!rowRut) continue

                const rowEmpresa = values[colIdx.empresa]?.trim().toLowerCase()
                const rowCargo = values[colIdx.cargo]?.trim().toLowerCase()

                const matchedEmpresa = empresas.find(e => e.nombre.toLowerCase() === rowEmpresa)
                const matchedCargo = cargos.find(c => c.nombre_cargo.toLowerCase() === rowCargo)

                if (!matchedEmpresa || !matchedCargo) continue

                const nombreCompleto = `${values[colIdx.nombre] || ''} ${values[colIdx.paterno] || ''} ${values[colIdx.materno] || ''}`.trim()

                // Update / Insert Worker
                const { data: worker, error: wError } = await supabase
                    .from('trabajadores')
                    .upsert({
                        rut: rowRut,
                        nombre_completo: nombreCompleto,
                        nombres: values[colIdx.nombre] || '',
                        apellido_paterno: values[colIdx.paterno] || '',
                        apellido_materno: values[colIdx.materno] || '',
                        email: values[colIdx.email] || null,
                        cargo: matchedCargo.nombre_cargo
                    }, { onConflict: 'rut' })
                    .select().single()

                if (wError) continue

                if (worker) {
                    const { data: newAtencion, error: aError } = await supabase.from('atenciones').insert({
                        trabajador_id: worker.id,
                        empresa_id: matchedEmpresa.id,
                        cargo_id: matchedCargo.id,
                        estado_aptitud: 'en_espera'
                    }).select().single()

                    if (aError) continue

                    if (newAtencion) {
                        const asig = asignaciones.find(a => a.empresa_id === matchedEmpresa.id && a.cargo_id === matchedCargo.id)
                        if (asig && asig.baterias?.bateria_items) {
                            const examsToInsert = asig.baterias.bateria_items.map((bi: any) => ({
                                atencion_id: newAtencion.id,
                                prestacion_id: bi.prestacion_id,
                                estado: 'nuevo',
                                rol_asignado: bi.prestaciones?.rol_responsable || 'General'
                            }));
                            if (examsToInsert.length > 0) {
                                await supabase.from('atencion_examenes').insert(examsToInsert);
                            }
                        }
                    }
                    successCount++
                }
            }
            alert(`Carga completada. ${successCount} admisiones creadas.`)
            closeBulkPanel()
            fetchRecentAdmisions()
        } catch (err: any) {
            alert('Error en carga masiva: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    // ── Render ──────────────────────────────────────────────
    return (
        <div className="admision-page animate-fade">
            <header className="page-header">
                <div className="header-content">
                    <div>
                        <h1>Admisión & Agenda Operativa</h1>
                        <p className="header-subtitle">Gestión de pacientes en proceso y solicitudes de ingreso.</p>
                    </div>
                    <div className="header-actions">
                        <button className={`btn ${verArchivados ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setVerArchivados(!verArchivados)}>
                            {verArchivados ? '📂 Ver Agenda Activa' : '🗄️ Ver Archivo Finalizados'}
                        </button>
                        <button className="btn btn-secondary" onClick={openBulkPanel}>
                            📤 Carga Masiva
                        </button>
                        <button className="btn btn-primary" onClick={openAdmisionPanel}>
                            + Nueva Admisión
                        </button>
                    </div>
                </div>
            </header>

            <div className="stats-grid mt-6">
                <div className="stat-card card glass">
                    <span className="label">En Agenda</span>
                    <span className="value">{stats.enAgenda}</span>
                </div>
                <div className="stat-card card glass success">
                    <span className="label">Aptos Hoy</span>
                    <span className="value">{stats.aptosHoy}</span>
                </div>
                <div className="stat-card card glass danger">
                    <span className="label">No Aptos</span>
                    <span className="value">{stats.noAptos}</span>
                </div>
            </div>

            <div className="admission-content card glass mt-6">
                <div className="search-bar">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, RUT, empresa u OT..."
                        value={searchRecent}
                        onChange={(e) => setSearchRecent(e.target.value)}
                    />
                </div>

                <div className="table-wrapper mt-4">
                    <table className="wl-table">
                        <colgroup>
                            <col style={{ width: '120px' }} />
                            <col style={{ width: '25%' }} />
                            <col style={{ width: '25%' }} />
                            <col style={{ width: '120px' }} />
                            <col style={{ width: '120px' }} />
                            <col style={{ width: '150px' }} />
                            <col style={{ width: '200px' }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>N° OT</th>
                                <th>Paciente</th>
                                <th>Empresa / Cargo</th>
                                <th>Registro</th>
                                <th>Atención</th>
                                <th>Estado</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAdmisions.length === 0 ? (
                                <tr><td colSpan={7} className="wl-empty">No hay pacientes {verArchivados ? 'archivados' : 'en agenda'}.</td></tr>
                            ) : filteredAdmisions.map(at => (
                                <tr key={at.id} className="wl-row" onClick={() => { setSelectedAtencion(at); setShowDetailPanel(true); }}>
                                    <td>
                                        <span className="ot-tag">{at.nro_ot || '—'}</span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 700 }}>{at.trabajadores?.nombre_completo}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{at.trabajadores?.rut}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{at.empresas?.nombre}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{at.cargos?.nombre_cargo}</div>
                                    </td>
                                    <td>{new Date(at.created_at).toLocaleDateString()}</td>
                                    <td>{at.fecha_atencion ? new Date(at.fecha_atencion).toLocaleDateString() : <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Pendiente</span>}</td>
                                    <td>
                                        <span className={`badge badge-${at.estado_aptitud.toLowerCase()}`}>
                                            {at.estado_aptitud === 'apto_r' ? 'APTO (R)' : at.estado_aptitud === 'no_apto_r' ? 'NO APTO (R)' : at.estado_aptitud.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                                            {!at.nro_ot ? (
                                                <button className="btn-mini btn-success" onClick={(e) => { e.stopPropagation(); iniciarAtencion(at.id); }}>
                                                    Iniciar Atención ⚡
                                                </button>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <label className="btn-mini btn-secondary" style={{ cursor: 'pointer' }} onClick={e => e.stopPropagation()}>
                                                        🪪 CI
                                                        <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(at.id, 'url_cedula', e.target.files[0])} />
                                                        {at.url_cedula && ' ✅'}
                                                    </label>
                                                    <label className="btn-mini btn-secondary" style={{ cursor: 'pointer' }} onClick={e => e.stopPropagation()}>
                                                        🚗 Lic
                                                        <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(at.id, 'url_licencia', e.target.files[0])} />
                                                        {at.url_licencia && ' ✅'}
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── MODAL ADMISION ─── */}
            {showAdmisionPanel && (
                <div className="side-panel-overlay" onClick={closeAdmisionPanel}>
                    <div className="side-panel animate-slide-in" onClick={e => e.stopPropagation()}>
                        <div className="panel-header">
                            <h2>Nueva Admisión</h2>
                            <button className="close-btn" onClick={closeAdmisionPanel}>×</button>
                        </div>
                        <form onSubmit={handleAdmision} className="add-form vertical mt-4">
                            <div className="form-group">
                                <label>RUT Trabajador</label>
                                <input type="text" value={rut} onChange={handleRutChange} onBlur={handleRutBlur} placeholder="12.345.678-9" required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nombres</label>
                                    <input type="text" value={nombres} onChange={e => setNombres(e.target.value)} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Apellido Paterno</label>
                                    <input type="text" value={apellidoPaterno} onChange={e => setApellidoPaterno(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>Apellido Materno</label>
                                    <input type="text" value={apellidoMaterno} onChange={e => setApellidoMaterno(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Empresa</label>
                                <select value={empresaId} onChange={e => setEmpresaId(e.target.value)} required>
                                    <option value="">Seleccione...</option>
                                    {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Cargo</label>
                                <select value={cargoId} onChange={e => setCargoId(e.target.value)} required>
                                    <option value="">Seleccione...</option>
                                    {cargos.map(c => <option key={c.id} value={c.id}>{c.nombre_cargo}</option>)}
                                </select>
                            </div>
                            {bateriaSugerida && (
                                <div className="suggestion-badge">
                                    ⚡ Batería detectada: <strong>{bateriaSugerida.nombre}</strong>
                                </div>
                            )}
                            <div className="panel-footer mt-4" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={closeAdmisionPanel}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Procesando...' : 'Confirmar Ingreso'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── MODAL CARGA MASIVA ─── */}
            {showBulkPanel && (
                <div className="side-panel-overlay" onClick={closeBulkPanel}>
                    <div className="side-panel animate-slide-in" onClick={e => e.stopPropagation()}>
                        <div className="panel-header">
                            <h2>Carga Masiva</h2>
                            <button className="close-btn" onClick={closeBulkPanel}>×</button>
                        </div>
                        <div className="mt-4">
                            <p className="text-muted text-sm">Sube un archivo CSV con los datos de los pacientes para ingreso masivo.</p>

                            <div className="form-group mt-6">
                                <label className="dropzone-label">
                                    <div className="dropzone-inner">
                                        <span>📁</span>
                                        <strong>{bulkFile ? bulkFile.name : 'Seleccionar archivo CSV'}</strong>
                                        <p className="text-xs opacity-50">RUT, Nombre, Apellido, Email, Empresa, Cargo</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        className="hidden"
                                        onChange={e => setBulkFile(e.target.files?.[0] || null)}
                                    />
                                </label>
                            </div>

                            <div className="panel-footer mt-6" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={closeBulkPanel}>Cancelar</button>
                                <button
                                    className="btn btn-primary"
                                    disabled={!bulkFile || loading}
                                    onClick={handleBulkProcess}
                                >
                                    {loading ? 'Procesando...' : 'Iniciar Carga'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── MODAL DETALLE ─── */}
            {showDetailPanel && selectedAtencion && (
                <div className="side-panel-overlay" onClick={() => setShowDetailPanel(false)}>
                    <div className="side-panel animate-slide-in" onClick={e => e.stopPropagation()}>
                        <div className="panel-header">
                            <h2>Detalle del Paciente</h2>
                            <button className="close-btn" onClick={() => setShowDetailPanel(false)}>×</button>
                        </div>

                        <div className="detail-body mt-6">
                            <div className="detail-hero">
                                <div className="detail-avatar">
                                    {selectedAtencion.trabajadores?.nombre_completo?.charAt(0)}
                                </div>
                                <div className="detail-hero-info">
                                    <h3 className="detail-name">{selectedAtencion.trabajadores?.nombre_completo}</h3>
                                    <span className="detail-rut">{selectedAtencion.trabajadores?.rut}</span>
                                </div>
                            </div>

                            <div className="detail-grid">
                                <div className="detail-card">
                                    <span className="detail-card-label">Empresa</span>
                                    <span className="detail-card-value">{selectedAtencion.empresas?.nombre}</span>
                                </div>
                                <div className="detail-card">
                                    <span className="detail-card-label">Cargo</span>
                                    <span className="detail-card-value">{selectedAtencion.cargos?.nombre_cargo}</span>
                                </div>
                                <div className="detail-card">
                                    <span className="detail-card-label">N° OT</span>
                                    <span className="detail-card-value">{selectedAtencion.nro_ot || 'Pendiente'}</span>
                                </div>
                                <div className="detail-card">
                                    <span className="detail-card-label">Estado</span>
                                    <span className={`badge badge-${selectedAtencion.estado_aptitud.toLowerCase()}`}>
                                        {selectedAtencion.estado_aptitud === 'apto_r' ? 'APTO (R)' : selectedAtencion.estado_aptitud === 'no_apto_r' ? 'NO APTO (R)' : selectedAtencion.estado_aptitud.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div className="detail-actions mt-auto">
                                <button
                                    className="btn btn-primary full-width"
                                    onClick={() => router.push(`/evaluacion/${selectedAtencion.id}`)}
                                >
                                    Ir a Evaluación Médica 🩺
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .admision-page { padding: 2rem 3rem 1.5rem 1.5rem; width: 100%; color: #fff; }
                .page-header { margin-bottom: 2.5rem; }
                .header-content { display: flex; justify-content: space-between; align-items: flex-end; }
                .header-subtitle { color: var(--text-muted); margin-top: 0.5rem; opacity: 0.8; }
                .header-actions { display: flex; gap: 1rem; }

                .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
                .stat-card { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; position: relative; overflow: hidden; }
                .stat-card .label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; }
                .stat-card .value { font-size: 2.5rem; font-weight: 900; color: #fff; }
                .stat-card.success .value { color: #22c55e; }
                .stat-card.danger .value { color: #ef4444; }

                .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; }
                .glass { backdrop-filter: blur(12px); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }

                .admission-content { padding: 0; margin-top: 1.5rem; width: 100%; }
                .search-bar { display: flex; align-items: center; gap: 1rem; padding: 1.2rem 2rem; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05); }
                .search-bar input { background: transparent; border: none; color: #fff; width: 100%; font-size: 1.1rem; outline: none; }
                
                .wl-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                .wl-table th { text-align: left; padding: 1.2rem 1.5rem; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); border-bottom: 2px solid rgba(255,255,255,0.1); }
                .wl-table td { padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); word-wrap: break-word; }
                .wl-row:hover { background: rgba(255,255,255,0.02); cursor: pointer; }

                .ot-tag { font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: var(--brand-primary); font-weight: 700; background: rgba(255,107,44,0.1); padding: 0.3rem 0.6rem; border-radius: 6px; }
                
                .badge { font-size: 0.7rem; font-weight: 800; padding: 0.3rem 0.8rem; border-radius: 20px; }
                .badge-en_espera { background: rgba(255,255,255,0.1); color: #fff; }
                .badge-pendiente { background: rgba(255,165,0,0.15); color: #ffa500; }
                .badge-en_atencion { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
                .badge-apto { background: rgba(34,197,94,0.15); color: #22c55e; }
                .badge-apto_r { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.4); }
                .badge-no_apto { background: rgba(239,68,68,0.15); color: #ef4444; }
                .badge-no_apto_r { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.4); }
                .badge-remediacion { background: rgba(168,85,247,0.15); color: #a855f7; }

                .btn-mini { padding: 0.4rem 0.8rem; font-size: 0.75rem; font-weight: 700; border-radius: 8px; border: none; cursor: pointer; transition: 0.2s; }
                .btn-success { background: #22c55e; color: #fff; }
                .btn-secondary { background: rgba(255,255,255,0.1); color: #fff; }

                .side-panel-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); z-index: 1000; }
                .side-panel { position: absolute; top: 0; right: 0; width: 450px; height: 100%; background: #0a0a0a; padding: 2.5rem; border-left: 1px solid rgba(255,255,255,0.1); box-shadow: -20px 0 60px rgba(0,0,0,0.5); display: flex; flex-direction: column; }
                .panel-header { display: flex; justify-content: space-between; align-items: center; }
                .close-btn { background: transparent; border: none; color: #fff; font-size: 2rem; cursor: pointer; }

                .form-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.2rem; }
                .form-group label { font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
                .form-group input, .form-group select { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 0.8rem; color: #fff; }
                
                .suggestion-badge { background: rgba(255,107,44,0.15); color: var(--brand-primary); padding: 1rem; border-radius: 12px; margin: 1rem 0; border: 1px dashed var(--brand-primary); font-size: 0.85rem; }

                .detail-hero { display: flex; align-items: center; gap: 1.5rem; padding: 1.5rem; background: rgba(255,255,255,0.03); border-radius: 16px; margin-bottom: 2rem; }
                .detail-avatar { width: 64px; height: 64px; border-radius: 20px; background: var(--brand-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 900; }
                .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .detail-card { padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
                .detail-card-label { font-size: 0.6rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; display: block; margin-bottom: 0.2rem; }
                .detail-card-value { font-size: 1rem; font-weight: 700; color: #fff; }

                .hidden { display: none; }
                .animate-fade { animation: fadeIn 0.4s ease-out; }
                .animate-slide-in { animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }

                @media (max-width: 768px) {
                    .stats-grid { grid-template-columns: 1fr; }
                    .side-panel { width: 100%; }
                }
            `}</style>
        </div>
    )
}
