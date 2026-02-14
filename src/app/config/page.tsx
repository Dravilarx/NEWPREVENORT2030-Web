"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ConfigPage() {
    const [activeTab, setActiveTab] = useState<'empresas' | 'cargos'>('empresas')
    const [empresas, setEmpresas] = useState<any[]>([])
    const [cargos, setCargos] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Form states
    const [empresaForm, setEmpresaForm] = useState({
        rut_empresa: '',
        nombre: '',
        giro: '',
        direccion: '',
        email_contacto: '',
        faenas: [] as { nombre_faena: string, altitud: number }[]
    })
    const [newFaena, setNewFaena] = useState({ nombre: '', altitud: 0 })

    const [newCargo, setNewCargo] = useState({
        nombre: '',
        es_gran_altura: false,
        pa_sistolica: 140,
        pa_diastolica: 90,
        glicemia: 126
    })

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        const { data: emp } = await supabase.from('empresas').select('*').order('nombre')
        const { data: car } = await supabase.from('cargos').select('*').order('nombre_cargo')
        if (emp) setEmpresas(emp)
        if (car) setCargos(car)
        setLoading(false)
    }

    async function addEmpresa() {
        if (!empresaForm.nombre || !empresaForm.rut_empresa) {
            alert('Nombre y RUT son obligatorios')
            return
        }

        const { error } = await supabase.from('empresas').insert([{
            rut_empresa: empresaForm.rut_empresa,
            nombre: empresaForm.nombre,
            giro: empresaForm.giro,
            direccion: empresaForm.direccion,
            email_contacto: empresaForm.email_contacto,
            faenas: empresaForm.faenas
        }])

        if (error) {
            console.error(error)
            alert('Error al agregar empresa: ' + error.message)
            return
        }

        setEmpresaForm({
            rut_empresa: '',
            nombre: '',
            giro: '',
            direccion: '',
            email_contacto: '',
            faenas: []
        })
        fetchData()
    }

    const addFaenaToLocal = () => {
        if (!newFaena.nombre) return
        setEmpresaForm({
            ...empresaForm,
            faenas: [...empresaForm.faenas, { nombre_faena: newFaena.nombre, altitud: newFaena.altitud }]
        })
        setNewFaena({ nombre: '', altitud: 0 })
    }

    const removeFaenaFromLocal = (index: number) => {
        setEmpresaForm({
            ...empresaForm,
            faenas: empresaForm.faenas.filter((_, i) => i !== index)
        })
    }

    async function addCargo() {
        if (!newCargo.nombre) return
        await supabase.from('cargos').insert([{
            nombre_cargo: newCargo.nombre,
            es_gran_altura: newCargo.es_gran_altura,
            limite_pa_sistolica: newCargo.pa_sistolica,
            limite_pa_diastolica: newCargo.pa_diastolica,
            limite_glicemia_max: newCargo.glicemia
        }])
        setNewCargo({ nombre: '', es_gran_altura: false, pa_sistolica: 140, pa_diastolica: 90, glicemia: 126 })
        fetchData()
    }

    return (
        <div className="config-page animate-fade">
            <header className="page-header">
                <h1>Configuración del Sistema</h1>
                <p>Gestión de baterías de exámenes, cargos y empresas clientes.</p>
            </header>

            <div className="tabs">
                <button
                    className={`tab-btn ${activeTab === 'empresas' ? 'active' : ''}`}
                    onClick={() => setActiveTab('empresas')}
                >
                    Empresas
                </button>
                <button
                    className={`tab-btn ${activeTab === 'cargos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('cargos')}
                >
                    Cargos y Baterías
                </button>
            </div>

            <div className="tab-content card">
                {activeTab === 'empresas' ? (
                    <div className="empresas-section">
                        <h3>Gestión de Empresas</h3>
                        <div className="add-form vertical">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>RUT Empresa</label>
                                    <input
                                        type="text"
                                        placeholder="12.345.678-9"
                                        value={empresaForm.rut_empresa}
                                        onChange={(e) => setEmpresaForm({ ...empresaForm, rut_empresa: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Nombre Fantasía</label>
                                    <input
                                        type="text"
                                        placeholder="Nombre de la empresa"
                                        value={empresaForm.nombre}
                                        onChange={(e) => setEmpresaForm({ ...empresaForm, nombre: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Giro</label>
                                    <input
                                        type="text"
                                        placeholder="Actividad económica"
                                        value={empresaForm.giro}
                                        onChange={(e) => setEmpresaForm({ ...empresaForm, giro: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email Contacto</label>
                                    <input
                                        type="email"
                                        placeholder="contacto@empresa.cl"
                                        value={empresaForm.email_contacto}
                                        style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                                        onChange={(e) => setEmpresaForm({ ...empresaForm, email_contacto: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Dirección Casa Matriz</label>
                                <input
                                    type="text"
                                    placeholder="Calle, Ciudad"
                                    value={empresaForm.direccion}
                                    onChange={(e) => setEmpresaForm({ ...empresaForm, direccion: e.target.value })}
                                />
                            </div>

                            <div className="faenas-builder mt-4">
                                <h4>Gestión de Faenas y Altitud</h4>
                                <div className="faena-input-row">
                                    <input
                                        type="text"
                                        placeholder="Nombre Faena (Ej: Los Pelambres)"
                                        value={newFaena.nombre}
                                        onChange={e => setNewFaena({ ...newFaena, nombre: e.target.value })}
                                    />
                                    <input
                                        type="number"
                                        placeholder="msnm"
                                        value={newFaena.altitud || ''}
                                        style={{ width: '100px', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                                        onChange={e => setNewFaena({ ...newFaena, altitud: Number(e.target.value) })}
                                    />
                                    <button className="btn btn-secondary" onClick={addFaenaToLocal} type="button">Añadir Faena</button>
                                </div>

                                <div className="faenas-list mt-2">
                                    {empresaForm.faenas.map((f, i) => (
                                        <div key={i} className="faena-tag">
                                            <span>{f.nombre_faena} ({f.altitud} msnm)</span>
                                            <button onClick={() => removeFaenaFromLocal(i)}>×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button className="btn btn-primary mt-4" onClick={addEmpresa}>Guardar Empresa Completa</button>
                        </div>

                        <div className="empresas-list-grid">
                            {empresas.map(e => (
                                <div key={e.id} className="empresa-item-card">
                                    <div className="empresa-main">
                                        <strong>{e.nombre}</strong>
                                        <span className="emp-rut">{e.rut_empresa}</span>
                                    </div>
                                    <div className="empresa-details">
                                        <span>{e.giro}</span>
                                        <span>{e.email_contacto}</span>
                                    </div>
                                    {e.faenas && e.faenas.length > 0 && (
                                        <div className="faenas-summary">
                                            {e.faenas.length} Faenas registradas
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="cargos-section">
                        <h3>Baterías por Cargo</h3>
                        <div className="add-form vertical">
                            <div className="form-group">
                                <label>Nombre del Cargo</label>
                                <input
                                    type="text"
                                    value={newCargo.nombre}
                                    onChange={(e) => setNewCargo({ ...newCargo, nombre: e.target.value })}
                                    placeholder="Ej: Operador de Perforadora"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Límite Sistólica</label>
                                    <input type="number" value={newCargo.pa_sistolica} onChange={e => setNewCargo({ ...newCargo, pa_sistolica: Number(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label>Límite Diastólica</label>
                                    <input type="number" value={newCargo.pa_diastolica} onChange={e => setNewCargo({ ...newCargo, pa_diastolica: Number(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label>Límite Glicemia</label>
                                    <input type="number" value={newCargo.glicemia} onChange={e => setNewCargo({ ...newCargo, glicemia: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div className="checkbox-group">
                                <input
                                    type="checkbox"
                                    id="gran-altura"
                                    checked={newCargo.es_gran_altura}
                                    onChange={e => setNewCargo({ ...newCargo, es_gran_altura: e.target.checked })}
                                />
                                <label htmlFor="gran-altura">Cargo en Gran Altura Geográfica (DS N°28)</label>
                            </div>
                            <button className="btn btn-primary" onClick={addCargo}>Crear Cargo y Batería</button>
                        </div>

                        <div className="items-grid mt-4">
                            {cargos.map(c => (
                                <div key={c.id} className="cargo-card">
                                    <div className="cargo-header">
                                        <strong>{c.nombre_cargo}</strong>
                                        {c.es_gran_altura && <span className="altitude-badge">🏔️ ALTURA</span>}
                                    </div>
                                    <div className="cargo-limits">
                                        <span>PA: {c.limite_pa_sistolica}/{c.limite_pa_diastolica}</span>
                                        <span>GLI: {c.limite_glicemia_max}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .config-page { display: flex; flex-direction: column; gap: 1.5rem; }
                .tabs { display: flex; gap: 1rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; }
                .tab-btn { 
                    background: none; border: none; padding: 0.75rem 1.5rem; cursor: pointer; 
                    font-weight: 600; color: var(--text-muted); border-radius: 8px 8px 0 0;
                    transition: all 0.2s;
                }
                .tab-btn.active { background: var(--brand-primary); color: white; }
                
                .add-form { display: flex; gap: 1rem; margin-bottom: 2rem; background: var(--bg-app); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border-color); }
                .add-form.vertical { flex-direction: column; }
                .add-form input[type="text"], .add-form input[type="number"] { 
                    padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border-color); flex: 1; 
                    background: var(--bg-card); color: var(--text-main);
                }
                
                .form-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
                .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
                .form-group label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); }

                .checkbox-group { display: flex; align-items: center; gap: 0.75rem; margin: 0.5rem 0; font-size: 0.9rem; font-weight: 600; }
                
                .faenas-builder { background: rgba(0,0,0,0.05); padding: 1.25rem; border-radius: 8px; border: 1px solid var(--border-color); }
                [data-theme='dark'] .faenas-builder { background: rgba(255,255,255,0.02); }
                .faena-input-row { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
                .faenas-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
                .faena-tag { 
                    background: var(--brand-primary-light); color: var(--brand-primary); 
                    padding: 0.4rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700;
                    display: flex; align-items: center; gap: 0.5rem;
                }
                .faena-tag button { background: none; border: none; color: var(--brand-primary); cursor: pointer; font-size: 1.1rem; padding: 0; line-height: 1; }
                
                .empresas-list-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; margin-top: 2rem; }
                .empresa-item-card { 
                    background: var(--bg-surface); border: 1px solid var(--border-color); 
                    padding: 1.5rem; border-radius: 12px; transition: var(--transition);
                }
                .empresa-item-card:hover { border-color: var(--brand-primary); transform: translateY(-2px); box-shadow: var(--shadow-md); }
                .empresa-main { display: flex; flex-direction: column; gap: 0.2rem; margin-bottom: 0.75rem; }
                .empresa-main strong { font-size: 1.1rem; color: var(--text-main); }
                .emp-rut { font-size: 0.8rem; color: var(--brand-primary); font-weight: 700; opacity: 0.8; }
                .empresa-details { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; color: var(--text-muted); }
                .faenas-summary { margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-dim); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--brand-primary); }

                .mt-2 { margin-top: 0.5rem; }
                .mt-4 { margin-top: 1.5rem; }
                .btn-secondary { background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); padding: 0.75rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600; }
                .btn-secondary:hover { background: var(--border-dim); }
            `}</style>
        </div>
    )
}
