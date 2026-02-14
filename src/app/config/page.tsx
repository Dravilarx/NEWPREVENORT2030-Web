"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ConfigPage() {
    const [activeTab, setActiveTab] = useState<'empresas' | 'cargos'>('empresas')
    const [empresas, setEmpresas] = useState<any[]>([])
    const [cargos, setCargos] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Form states
    const [newEmpresa, setNewEmpresa] = useState('')
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
        if (!newEmpresa) return
        await supabase.from('empresas').insert([{ nombre: newEmpresa }])
        setNewEmpresa('')
        fetchData()
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
                <h1>⚙️ Configuración del Sistema</h1>
                <p>Gestión de baterías de exámenes, cargos y empresas clientes.</p>
            </header>

            <div className="tabs">
                <button
                    className={`tab-btn ${activeTab === 'empresas' ? 'active' : ''}`}
                    onClick={() => setActiveTab('empresas')}
                >
                    🏢 Empresas
                </button>
                <button
                    className={`tab-btn ${activeTab === 'cargos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('cargos')}
                >
                    🔧 Cargos y Baterías
                </button>
            </div>

            <div className="tab-content card">
                {activeTab === 'empresas' ? (
                    <div className="empresas-section">
                        <h3>Gestión de Empresas</h3>
                        <div className="add-form">
                            <input
                                type="text"
                                placeholder="Nombre de la nueva empresa"
                                value={newEmpresa}
                                onChange={(e) => setNewEmpresa(e.target.value)}
                            />
                            <button className="btn btn-primary" onClick={addEmpresa}>Agregar Empresa</button>
                        </div>

                        <ul className="list">
                            {empresas.map(e => (
                                <li key={e.id} className="list-item">
                                    <span>{e.nombre}</span>
                                    <span className="badge-id">ID: {e.id.slice(0, 8)}</span>
                                </li>
                            ))}
                        </ul>
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
                
                .list { list-style: none; padding: 0; }
                .list-item { display: flex; justify-content: space-between; padding: 1rem; border-bottom: 1px solid var(--border-dim); }
                .badge-id { font-size: 0.7rem; color: var(--text-muted); font-family: monospace; opacity: 0.6; }
                
                .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; }
                .cargo-card { background: var(--bg-surface); border: 1px solid var(--border-color); padding: 1rem; border-radius: 8px; transition: var(--transition); }
                .cargo-card:hover { border-color: var(--brand-primary); }
                .cargo-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
                .altitude-badge { font-size: 0.65rem; background: var(--brand-primary-light); color: var(--brand-primary); padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 800; }
                .cargo-limits { font-size: 0.85rem; color: var(--text-muted); display: flex; gap: 1rem; font-weight: 600; }
                
                .mt-4 { margin-top: 2rem; }
            `}</style>
        </div>
    )
}
