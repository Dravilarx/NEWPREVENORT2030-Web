"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatearRUT } from '@/lib/skills/formateadorRUT'
import WorkList from '@/components/WorkList'

export default function AdmisionPage() {
    const [loading, setLoading] = useState(false)
    const [empresas, setEmpresas] = useState<any[]>([])
    const [cargos, setCargos] = useState<any[]>([])

    // Form State
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
    const [bulkFile, setBulkFile] = useState<File | null>(null)

    const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatearRUT(e.target.value)
        setRut(formatted)
    }

    useEffect(() => {
        fetchMaestros()
    }, [])

    async function fetchMaestros() {
        const { data: emp } = await supabase.from('empresas').select('*')
        const { data: car } = await supabase.from('cargos').select('*')
        if (emp) setEmpresas(emp)
        if (car) setCargos(car)
    }

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
        } else {
            setWorkerFound(false)
            setNombres('')
            setApellidoPaterno('')
            setApellidoMaterno('')
            setFechaNacimiento('')
            setSexo('')
            setEmail('')
        }
        setLoading(false)
    }

    async function handleAdmision(e: React.FormEvent) {
        e.preventDefault()
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
                email: email || null
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

            // 2. Crear la atención (Admisión)
            const { error: aError } = await supabase
                .from('atenciones')
                .insert([{
                    trabajador_id: currentWorkerId,
                    empresa_id: empresaId,
                    cargo_id: cargoId,
                    estado_aptitud: 'pendiente'
                }])

            if (aError) throw aError

            alert('¡Admisión exitosa! El flujo Fast-Track ha comenzado.')
            // Reset form
            setRut('')
            setNombres('')
            setApellidoPaterno('')
            setApellidoMaterno('')
            setFechaNacimiento('')
            setSexo('')
            setEmail('')
            setWorkerFound(false)
        } catch (error: any) {
            alert('Error en admisión: ' + error.message)
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
        <div className="admision-container animate-fade">
            <header className="page-header">
                <h1>Admisión de Trabajadores</h1>
                <p>Inicia el proceso Fast-Track asignando empresa y batería de exámenes.</p>
            </header>

            <div className="content-grid">
                <form className="card form-card" onSubmit={handleAdmision}>
                    <div className="form-group">
                        <label>RUT del Trabajador</label>
                        <div className="input-search">
                            <input
                                type="text"
                                placeholder="12.345.678-9"
                                value={rut}
                                onChange={handleRutChange}
                                onBlur={buscarTrabajador}
                            />
                            <button type="button" onClick={buscarTrabajador} disabled={loading}>
                                {loading ? '...' : '🔍'}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Nombres</label>
                        <input
                            type="text"
                            placeholder="Ej: Juan Pablo"
                            value={nombres}
                            onChange={(e) => setNombres(e.target.value)}
                            disabled={workerFound && !!nombres}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Apellido Paterno</label>
                            <input
                                type="text"
                                placeholder="Ej: Pérez"
                                value={apellidoPaterno}
                                onChange={(e) => setApellidoPaterno(e.target.value)}
                                disabled={workerFound && !!apellidoPaterno}
                            />
                        </div>
                        <div className="form-group">
                            <label>Apellido Materno</label>
                            <input
                                type="text"
                                placeholder="Ej: González"
                                value={apellidoMaterno}
                                onChange={(e) => setApellidoMaterno(e.target.value)}
                                disabled={workerFound && !!apellidoMaterno}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Fecha de Nacimiento</label>
                            <input
                                type="date"
                                value={fechaNacimiento}
                                onChange={(e) => setFechaNacimiento(e.target.value)}
                                disabled={workerFound && !!fechaNacimiento}
                            />
                        </div>
                        <div className="form-group">
                            <label>Sexo</label>
                            <select
                                value={sexo}
                                onChange={(e) => setSexo(e.target.value)}
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
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={workerFound && !!email}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Empresa Contratista</label>
                            <select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} required>
                                <option value="">Seleccione Empresa...</option>
                                {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Cargo Postulante</label>
                            <select value={cargoId} onChange={(e) => setCargoId(e.target.value)} required>
                                <option value="">Seleccione Cargo...</option>
                                {cargos.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.nombre_cargo} {c.es_gran_altura ? '🏔️' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Procesando...' : 'Confirmar Admisión Fast-Track'}
                    </button>
                </form>

                <div className="info-side">
                    <div className="card glass bulk-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                        <div className="bulk-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <span className="bulk-icon" style={{ fontSize: '1.5rem' }}>📂</span>
                            <h3 style={{ margin: 0 }}>Carga Masiva</h3>
                        </div>
                        <p className="bulk-text" style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>CSV: RUT, Nombres, ApPaterno, ApMaterno, Email, FechaNac, Sexo.</p>

                        <div className="bulk-upload-zone" style={{ border: '2px dashed var(--border-color)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                                id="bulk-file-input"
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="bulk-file-input" style={{ cursor: 'pointer', display: 'block', padding: '0.5rem', background: 'var(--bg-app)', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                                {bulkFile ? bulkFile.name : '📁 Seleccionar .csv'}
                            </label>
                            {bulkFile && (
                                <button
                                    onClick={handleBulkUpload}
                                    className="btn btn-secondary btn-full"
                                    disabled={loading}
                                    style={{ marginTop: '0.8rem', width: '100%' }}
                                >
                                    🚀 Procesar Carga
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="card glass ai-info" style={{ padding: '1.5rem' }}>
                        <div className="ai-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <span className="ai-icon" style={{ fontSize: '1.5rem' }}>✨</span>
                            <h3 style={{ margin: 0 }}>Inteligencia de Admisión</h3>
                        </div>
                        {cargoId ? (
                            <p className="ai-text" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                                Detectado cargo de <strong>{cargos.find(c => c.id === cargoId)?.nombre_cargo}</strong>.
                                {cargos.find(c => c.id === cargoId)?.es_gran_altura && (
                                    <span style={{ color: 'var(--brand-primary)', fontWeight: 'bold', display: 'block', marginTop: '0.5rem' }}> ⚠️ Requiere Batería de Gran Altura Geográfica.</span>
                                )}
                            </p>
                        ) : (
                            <p className="ai-text">Seleccione un cargo para visualizar la batería de exámenes sugerida.</p>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <WorkList limit={5} />
            </div>

            <style jsx>{`
                .page-header { margin-bottom: 2rem; }
                h1 { color: var(--brand-secondary); font-size: 2rem; }
                .content-grid {
                    display: grid;
                    grid-template-columns: 1fr 340px;
                    gap: 2rem;
                }
                .form-card {
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                label {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-main);
                }
                input, select {
                    padding: 0.75rem;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    font-size: 1rem;
                    background: var(--bg-card);
                    color: var(--text-main);
                    transition: var(--transition);
                }
                input:focus, select:focus {
                    outline: none;
                    border-color: var(--brand-primary);
                    box-shadow: 0 0 0 2px var(--brand-primary-light);
                }
                .input-search {
                    display: flex;
                    gap: 0.5rem;
                }
                .input-search input { flex: 1; }
                .input-search button {
                    background: var(--bg-app);
                    border: 1px solid var(--border-color);
                    padding: 0 1rem;
                    border-radius: 8px;
                    cursor: pointer;
                    color: var(--text-main);
                }
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                }
                .btn-full { width: 100%; border: none; padding: 0.8rem; border-radius: 8px; cursor: pointer; font-weight: bold; transition: var(--transition); }
                .btn-primary { background: var(--brand-primary); color: white; }
                .btn-primary:hover { background: var(--brand-primary-hover); transform: translateY(-1px); }
                .btn-secondary { background: var(--brand-secondary); color: white; }
            `}</style>
        </div>
    )
}
