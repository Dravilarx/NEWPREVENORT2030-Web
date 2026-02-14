"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { formatChileanPhone } from '@/lib/formatters'

interface Empresa {
    id: string;
    nombre: string;
    rut_empresa: string;
    giro?: string;
    direccion?: string;
    nombre_contacto?: string;
    email_contacto?: string;
    telefono_contacto?: string;
    faenas: { nombre_faena: string, altitud: number }[];
}

interface Cargo {
    id: string;
    nombre_cargo: string;
    es_gran_altura: boolean;
    limite_pa_sistolica: number;
    limite_pa_diastolica: number;
    limite_glicemia_max: number;
}

interface Prestacion {
    id: string;
    codigo: string;
    nombre: string;
    categoria: string;
    costo: number;
    descripcion?: string;
}

interface Bateria {
    id: string;
    nombre: string;
    descripcion?: string;
    bateria_items?: { prestacion_id: string }[];
}

interface PanelAssignment {
    id: string;
    empresa_id: string;
    cargo_id: string;
    bateria_id: string;
    empresas?: { nombre: string };
    cargos?: { nombre_cargo: string };
    baterias?: { nombre: string };
}

export default function ConfigPage() {
    const [activeTab, setActiveTab] = useState<'empresas' | 'protocolos'>('empresas')
    const [protocolosView, setProtocolosView] = useState<'catalogo' | 'cargos' | 'baterias' | 'paneles'>('catalogo')

    // Worklist filter & sort states
    const [wlSearch, setWlSearch] = useState('')
    const [wlCatFilter, setWlCatFilter] = useState('')
    const [wlSortCol, setWlSortCol] = useState<'codigo' | 'nombre' | 'categoria' | 'descripcion' | 'costo'>('codigo')
    const [wlSortDir, setWlSortDir] = useState<'asc' | 'desc'>('asc')
    const [batSearch, setBatSearch] = useState('')
    const [batSelectorSearch, setBatSelectorSearch] = useState('') // New search for selector

    const [showPrestacionPanel, setShowPrestacionPanel] = useState(false)
    const [editingPrestacion, setEditingPrestacion] = useState<Prestacion | null>(null)

    const [showBateriaPanel, setShowBateriaPanel] = useState(false)
    const [editingBateria, setEditingBateria] = useState<Bateria | null>(null)

    const [showEmpresaPanel, setShowEmpresaPanel] = useState(false)
    const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null)

    const [showCargoPanel, setShowCargoPanel] = useState(false)
    const [editingCargo, setEditingCargo] = useState<Cargo | null>(null)

    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [cargos, setCargos] = useState<Cargo[]>([])
    const [prestaciones, setPrestaciones] = useState<Prestacion[]>([])
    const [baterias, setBaterias] = useState<Bateria[]>([])
    const [paneles, setPaneles] = useState<PanelAssignment[]>([])
    const [loading, setLoading] = useState(false)

    const toggleSort = useCallback((col: typeof wlSortCol) => {
        if (wlSortCol === col) {
            setWlSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            setWlSortCol(col)
            setWlSortDir('asc')
        }
    }, [wlSortCol])

    const filteredPrestaciones = useMemo(() => {
        let data = [...prestaciones]
        if (wlSearch.trim()) {
            const q = wlSearch.toLowerCase()
            data = data.filter(p =>
                (p.codigo || '').toLowerCase().includes(q) ||
                (p.nombre || '').toLowerCase().includes(q) ||
                (p.descripcion || '').toLowerCase().includes(q)
            )
        }
        if (wlCatFilter) {
            data = data.filter(p => p.categoria === wlCatFilter)
        }
        data.sort((a, b) => {
            let va = a[wlSortCol] ?? ''
            let vb = b[wlSortCol] ?? ''
            if (wlSortCol === 'costo') {
                va = Number(va) || 0
                vb = Number(vb) || 0
            } else {
                va = String(va).toLowerCase()
                vb = String(vb).toLowerCase()
            }
            if (va < vb) return wlSortDir === 'asc' ? -1 : 1
            if (va > vb) return wlSortDir === 'asc' ? 1 : -1
            return 0
        })
        return data
    }, [prestaciones, wlSearch, wlCatFilter, wlSortCol, wlSortDir])

    // Form states
    const [empresaForm, setEmpresaForm] = useState({
        rut_empresa: '',
        nombre: '',
        giro: '',
        direccion: '',
        email_contacto: '',
        nombre_contacto: '',
        telefono_contacto: '',
        faenas: [] as { nombre_faena: string, altitud: number, latitud?: number, longitud?: number }[]
    })
    const [newFaena, setNewFaena] = useState({ nombre: '', altitud: 0, latitud: 0, longitud: 0 })

    const [newCargo, setNewCargo] = useState({
        nombre: '',
        es_gran_altura: false,
        pa_sistolica: 140,
        pa_diastolica: 90,
        glicemia: 126
    })

    const [newPrestacion, setNewPrestacion] = useState({
        codigo: '',
        nombre: '',
        categoria: '',
        costo: 0,
        descripcion: ''
    })

    const [newBateria, setNewBateria] = useState({
        nombre: '',
        descripcion: '',
        items: [] as string[]
    })

    const [assignmentForm, setAssignmentForm] = useState({
        empresa_id: '',
        cargo_id: '',
        bateria_id: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    const resetPrestacionForm = () => {
        setNewPrestacion({
            codigo: '',
            nombre: '',
            categoria: '',
            costo: 0,
            descripcion: ''
        })
        setEditingPrestacion(null)
    }

    const openPrestacionPanel = (p?: Prestacion) => {
        if (p) {
            setEditingPrestacion(p)
            setNewPrestacion({
                codigo: p.codigo,
                nombre: p.nombre,
                categoria: p.categoria,
                costo: p.costo,
                descripcion: p.descripcion || ''
            })
        } else {
            resetPrestacionForm()
        }
        setShowPrestacionPanel(true)
    }

    const closePrestacionPanel = () => {
        setShowPrestacionPanel(false)
        resetPrestacionForm()
    }

    // Control Empresa Panel
    const openEmpresaPanel = (e?: Empresa) => {
        if (e) {
            setEditingEmpresa(e)
            setEmpresaForm({
                rut_empresa: e.rut_empresa,
                nombre: e.nombre,
                giro: e.giro || '',
                direccion: e.direccion || '',
                email_contacto: e.email_contacto || '',
                nombre_contacto: e.nombre_contacto || '',
                telefono_contacto: e.telefono_contacto || '',
                faenas: e.faenas || []
            })
        } else {
            setEditingEmpresa(null)
            setEmpresaForm({ rut_empresa: '', nombre: '', giro: '', direccion: '', email_contacto: '', nombre_contacto: '', telefono_contacto: '', faenas: [] })
        }
        setShowEmpresaPanel(true)
    }
    const closeEmpresaPanel = () => { setShowEmpresaPanel(false); setEditingEmpresa(null); }

    // Control Cargo Panel
    const openCargoPanel = (c?: Cargo) => {
        if (c) {
            setEditingCargo(c)
            setNewCargo({ nombre: c.nombre_cargo, es_gran_altura: c.es_gran_altura, pa_sistolica: c.limite_pa_sistolica, pa_diastolica: c.limite_pa_diastolica, glicemia: c.limite_glicemia_max })
        } else {
            setEditingCargo(null)
            setNewCargo({ nombre: '', es_gran_altura: false, pa_sistolica: 140, pa_diastolica: 90, glicemia: 126 })
        }
        setShowCargoPanel(true)
    }
    const closeCargoPanel = () => { setShowCargoPanel(false); setEditingCargo(null); }

    // Control Bateria Panel
    const openBateriaPanel = (b?: Bateria) => {
        setBatSelectorSearch('') // Reset search in selector
        if (b) {
            setEditingBateria(b)
            setNewBateria({
                nombre: b.nombre,
                descripcion: b.descripcion || '',
                items: (b.bateria_items || []).map(i => i.prestacion_id)
            })
        } else {
            setEditingBateria(null)
            setNewBateria({ nombre: '', descripcion: '', items: [] })
        }
        setShowBateriaPanel(true)
    }
    const closeBateriaPanel = () => { setShowBateriaPanel(false); setEditingBateria(null); }

    async function fetchData() {
        setLoading(true)
        const { data: emp } = await supabase.from('empresas').select('*').order('nombre')
        const { data: car } = await supabase.from('cargos').select('*').order('nombre_cargo')
        const { data: pre } = await supabase.from('prestaciones').select('*').order('nombre')
        const { data: bat } = await supabase.from('baterias').select('*, bateria_items(prestacion_id)').order('nombre')
        const { data: ecb } = await supabase.from('empresa_cargo_baterias').select('*, empresas(nombre), cargos(nombre_cargo), baterias(nombre)')

        if (emp) setEmpresas(emp)
        if (car) setCargos(car)
        if (pre) setPrestaciones(pre)
        if (bat) setBaterias(bat)
        if (ecb) setPaneles(ecb)
        setLoading(false)
    }

    async function saveEmpresa() {
        if (!empresaForm.nombre || !empresaForm.rut_empresa) {
            alert('Nombre y RUT son obligatorios')
            return
        }

        let error;
        let empresaId = editingEmpresa?.id;
        if (editingEmpresa) {
            const { error: err } = await supabase.from('empresas').update({
                rut_empresa: empresaForm.rut_empresa,
                nombre: empresaForm.nombre,
                giro: empresaForm.giro,
                direccion: empresaForm.direccion,
                email_contacto: empresaForm.email_contacto,
                nombre_contacto: empresaForm.nombre_contacto,
                telefono_contacto: empresaForm.telefono_contacto,
                faenas: empresaForm.faenas
            }).eq('id', editingEmpresa.id)
            error = err
        } else {
            const { data, error: err } = await supabase.from('empresas').insert([{
                rut_empresa: empresaForm.rut_empresa,
                nombre: empresaForm.nombre,
                giro: empresaForm.giro,
                direccion: empresaForm.direccion,
                email_contacto: empresaForm.email_contacto,
                nombre_contacto: empresaForm.nombre_contacto,
                telefono_contacto: empresaForm.telefono_contacto,
                faenas: empresaForm.faenas
            }]).select()
            error = err
            if (data) empresaId = data[0].id
        }

        if (error) {
            console.error(error)
            alert('Error: ' + error.message)
            return
        }

        closeEmpresaPanel()
        fetchData()
    }

    async function deleteEmpresa(id: string) {
        if (!confirm('¿Eliminar esta empresa? Se perderán sus vínculos con cargos y baterías.')) return;
        const { error } = await supabase.from('empresas').delete().eq('id', id);
        if (error) alert('Error: ' + error.message);
        fetchData();
    }

    const addFaenaToLocal = () => {
        if (!newFaena.nombre) return
        setEmpresaForm({
            ...empresaForm,
            faenas: [...empresaForm.faenas, {
                nombre_faena: newFaena.nombre,
                altitud: newFaena.altitud,
                latitud: newFaena.latitud,
                longitud: newFaena.longitud
            }]
        })
        setNewFaena({ nombre: '', altitud: 0, latitud: 0, longitud: 0 })
    }

    const removeFaenaFromLocal = (index: number) => {
        setEmpresaForm({
            ...empresaForm,
            faenas: empresaForm.faenas.filter((_, i) => i !== index)
        })
    }

    async function saveCargo() {
        if (!newCargo.nombre) return

        let error;
        const payload = {
            nombre_cargo: newCargo.nombre,
            es_gran_altura: newCargo.es_gran_altura,
            limite_pa_sistolica: newCargo.pa_sistolica,
            limite_pa_diastolica: newCargo.pa_diastolica,
            limite_glicemia_max: newCargo.glicemia
        }

        if (editingCargo) {
            const { error: err } = await supabase.from('cargos').update(payload).eq('id', editingCargo.id)
            error = err
        } else {
            const { error: err } = await supabase.from('cargos').insert([payload])
            error = err
        }

        if (error) {
            alert('Error: ' + error.message)
            return
        }

        closeCargoPanel()
        fetchData()
    }

    async function deleteCargo(id: string) {
        if (!confirm('¿Eliminar este cargo?')) return;
        const { error } = await supabase.from('cargos').delete().eq('id', id);
        if (error) alert('Error: ' + error.message);
        fetchData();
    }

    async function savePrestacion() {
        if (!newPrestacion.nombre || !newPrestacion.codigo) {
            alert('Nombre y Código son obligatorios');
            return;
        }

        let error;
        if (editingPrestacion) {
            const { error: err } = await supabase
                .from('prestaciones')
                .update(newPrestacion)
                .eq('id', editingPrestacion.id);
            error = err;
        } else {
            const { error: err } = await supabase.from('prestaciones').insert([newPrestacion]);
            error = err;
        }

        if (error) {
            alert('Error: ' + error.message);
            return;
        }

        closePrestacionPanel();
        fetchData();
    }

    async function deletePrestacion(id: string) {
        if (!confirm('¿Está seguro de eliminar esta prestación?')) return;
        const { error } = await supabase.from('prestaciones').delete().eq('id', id);
        if (error) {
            alert('Error al eliminar: ' + error.message);
            return;
        }
        fetchData();
    }

    async function saveBateria() {
        if (!newBateria.nombre || newBateria.items.length === 0) {
            alert('Nombre y al menos una prestación son obligatorios');
            return;
        }

        let batteryId;
        if (editingBateria) {
            batteryId = editingBateria.id;
            const { error } = await supabase.from('baterias').update({
                nombre: newBateria.nombre,
                descripcion: newBateria.descripcion
            }).eq('id', batteryId);

            if (error) { alert('Error: ' + error.message); return; }

            // Borrar items antiguos
            await supabase.from('bateria_items').delete().eq('bateria_id', batteryId);
        } else {
            const { data, error } = await supabase.from('baterias').insert([{
                nombre: newBateria.nombre,
                descripcion: newBateria.descripcion
            }]).select();

            if (error) { alert('Error: ' + error.message); return; }
            batteryId = data[0].id;
        }

        // Insertar items (nuevos o actualizados)
        const items = newBateria.items.map(p_id => ({
            bateria_id: batteryId,
            prestacion_id: p_id
        }));
        await supabase.from('bateria_items').insert(items);

        closeBateriaPanel();
        fetchData();
    }

    async function assignBateria() {
        if (!assignmentForm.empresa_id || !assignmentForm.cargo_id || !assignmentForm.bateria_id) {
            alert('Todos los campos son obligatorios');
            return;
        }

        const { error } = await supabase.from('empresa_cargo_baterias').upsert([{
            empresa_id: assignmentForm.empresa_id,
            cargo_id: assignmentForm.cargo_id,
            bateria_id: assignmentForm.bateria_id
        }]);

        if (error) {
            alert('Error en la asignación: ' + error.message);
            return;
        }

        setAssignmentForm({ empresa_id: '', cargo_id: '', bateria_id: '' });
        fetchData();
    }

    async function deleteAssignment(id: string) {
        await supabase.from('empresa_cargo_baterias').delete().eq('id', id);
        fetchData();
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
                    Directorio Empresas
                </button>
                <button
                    className={`tab-btn ${activeTab === 'protocolos' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('protocolos'); setProtocolosView('catalogo'); }}
                >
                    Protocolos y Salud
                </button>
            </div>

            <div className="tab-content card">
                {activeTab === 'empresas' && (
                    <>
                        {/* Panel Lateral (Drawer) */}
                        <div className={`side-panel ${showEmpresaPanel ? 'open' : ''}`}>
                            <div className="side-panel-overlay" onClick={closeEmpresaPanel}></div>
                            <div className="side-panel-content">
                                <div className="side-panel-header">
                                    <h3>{editingEmpresa ? '✏️ Editar Empresa' : '🏢 Nueva Empresa'}</h3>
                                    <button className="btn-close" onClick={closeEmpresaPanel}>&times;</button>
                                </div>
                                <p className="section-hint">Gestiona los datos maestros de la empresa y sus faenas operativas.</p>

                                <div className="add-form vertical mt-4" style={{ overflowY: 'auto', flex: 1, paddingRight: '0.8rem' }}>
                                    <div className="form-group">
                                        <label>Nombre Empresa</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Minera Escondida"
                                            value={empresaForm.nombre}
                                            onChange={e => setEmpresaForm({ ...empresaForm, nombre: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>RUT Empresa</label>
                                        <input
                                            type="text"
                                            placeholder="12.345.678-9"
                                            value={empresaForm.rut_empresa}
                                            onChange={e => setEmpresaForm({ ...empresaForm, rut_empresa: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Giro / Actividad</label>
                                        <input
                                            type="text"
                                            placeholder="Minería, Transporte, etc."
                                            value={empresaForm.giro}
                                            onChange={e => setEmpresaForm({ ...empresaForm, giro: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Dirección Casa Matriz</label>
                                        <input
                                            type="text"
                                            placeholder="Av. Principal 123, Antofagasta"
                                            value={empresaForm.direccion}
                                            onChange={e => setEmpresaForm({ ...empresaForm, direccion: e.target.value })}
                                        />
                                    </div>

                                    <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        👤 Contacto Administrativo
                                    </div>

                                    <div className="form-group">
                                        <label>Nombre Contacto</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Juan Pérez"
                                            value={empresaForm.nombre_contacto}
                                            onChange={e => setEmpresaForm({ ...empresaForm, nombre_contacto: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label>Email</label>
                                            <input
                                                type="email"
                                                placeholder="juan@empresa.cl"
                                                value={empresaForm.email_contacto}
                                                onChange={e => setEmpresaForm({ ...empresaForm, email_contacto: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label>Teléfono</label>
                                            <input
                                                type="text"
                                                placeholder="+56 9..."
                                                value={empresaForm.telefono_contacto}
                                                onChange={e => setEmpresaForm({ ...empresaForm, telefono_contacto: formatChileanPhone(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        🏘️ Faenas Operativas
                                    </div>

                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                        <div className="form-group">
                                            <input
                                                type="text"
                                                placeholder="Nombre de la faena (Ej: Planta Coloso)"
                                                value={newFaena.nombre}
                                                onChange={e => setNewFaena({ ...newFaena, nombre: e.target.value })}
                                                style={{ marginBottom: '0.5rem' }}
                                            />
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group" style={{ flex: 1 }}>
                                                <label>Altitud (m)</label>
                                                <input
                                                    type="number"
                                                    value={newFaena.altitud}
                                                    onChange={e => setNewFaena({ ...newFaena, altitud: Number(e.target.value) })}
                                                />
                                            </div>
                                            <button className="btn btn-secondary" style={{ height: '42px', marginTop: '1.2rem' }} onClick={addFaenaToLocal}>Añadir</button>
                                        </div>
                                    </div>

                                    <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {empresaForm.faenas.map((f, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,107,44,0.1)' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{f.nombre_faena}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Altitud: {f.altitud}m</div>
                                                </div>
                                                <button className="btn-icon" onClick={() => removeFaenaFromLocal(i)}>✕</button>
                                            </div>
                                        ))}
                                    </div>

                                    <button className="btn btn-primary mt-8 full-width" onClick={saveEmpresa}>
                                        {editingEmpresa ? 'Guardar Cambios' : 'Registrar Empresa'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3>Empresas en Convenio</h3>
                                <p className="section-hint">Gestiona las compañías que operan con Prevenort.</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => openEmpresaPanel()}>
                                + Nueva Empresa
                            </button>
                        </div>

                        <div className="grid">
                            {empresas.map(e => (
                                <div key={e.id} className="card-item interactive-card" onClick={() => openEmpresaPanel(e)}>
                                    <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                                        <button
                                            className="btn-icon delete"
                                            onClick={(ev) => { ev.stopPropagation(); deleteEmpresa(e.id); }}
                                        >🗑️</button>
                                    </div>
                                    <div className="card-header">
                                        <h4>{e.nombre}</h4>
                                        <span className="badge">{e.rut_empresa}</span>
                                    </div>
                                    <div className="card-body">
                                        <p><small>{e.giro || 'Sin rubro especificado'}</small></p>
                                        <div className="card-stats mt-4">
                                            <div className="stat">
                                                <span className="label">Faenas</span>
                                                <span className="value">{(e.faenas || []).length}</span>
                                            </div>
                                            <div className="stat">
                                                <span className="label">Contacto</span>
                                                <span className="value" style={{ fontSize: '0.7rem' }}>{e.nombre_contacto || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>


                    </>
                )}

                {activeTab === 'protocolos' && (
                    <div className="protocolos-section">
                        <div className="sub-tabs">
                            <button
                                className={`sub-tab-btn ${protocolosView === 'catalogo' ? 'active' : ''}`}
                                onClick={() => setProtocolosView('catalogo')}
                            >
                                🧪 Exámenes
                            </button>
                            <button
                                className={`sub-tab-btn ${protocolosView === 'cargos' ? 'active' : ''}`}
                                onClick={() => setProtocolosView('cargos')}
                            >
                                👷 Cargos
                            </button>
                            <button
                                className={`sub-tab-btn ${protocolosView === 'baterias' ? 'active' : ''}`}
                                onClick={() => setProtocolosView('baterias')}
                            >
                                📦 Baterías
                            </button>
                            <button
                                className={`sub-tab-btn ${protocolosView === 'paneles' ? 'active' : ''}`}
                                onClick={() => setProtocolosView('paneles')}
                            >
                                📋 Paneles de Salud
                            </button>
                        </div>

                        {protocolosView === 'catalogo' && (
                            <>
                                {/* Panel Lateral (Drawer) para Prestaciones */}
                                <div className={`side-panel ${showPrestacionPanel ? 'open' : ''}`}>
                                    <div className="side-panel-overlay" onClick={closePrestacionPanel}></div>
                                    <div className="side-panel-content">
                                        <div className="side-panel-header">
                                            <h3>{editingPrestacion ? '✏️ Editar Prestación' : '✨ Nueva Prestación'}</h3>
                                            <button className="btn-close" onClick={closePrestacionPanel}>&times;</button>
                                        </div>
                                        <p className="section-hint">Gestiona los detalles técnicos y comerciales del examen.</p>

                                        <div className="add-form vertical mt-4">
                                            <div className="form-group">
                                                <label>Código Interno</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej: LAB-01"
                                                    value={newPrestacion.codigo}
                                                    onChange={e => setNewPrestacion({ ...newPrestacion, codigo: e.target.value.toUpperCase() })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Nombre de la Prestación</label>
                                                <input
                                                    type="text"
                                                    placeholder="Nombre descriptivo..."
                                                    value={newPrestacion.nombre}
                                                    onChange={e => setNewPrestacion({ ...newPrestacion, nombre: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Categoría</label>
                                                <select
                                                    value={newPrestacion.categoria}
                                                    onChange={e => setNewPrestacion({ ...newPrestacion, categoria: e.target.value })}
                                                >
                                                    <option value="">Seleccione Categoría...</option>
                                                    <option value="Laboratorio">Laboratorio</option>
                                                    <option value="Médico">Evaluación Médica</option>
                                                    <option value="Rayos X">Imágenes / Rayos X</option>
                                                    <option value="Psicotécnico">Psicotécnico</option>
                                                    <option value="Electro">Electrocardiograma</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Costo Unitario ($)</label>
                                                <input
                                                    type="number"
                                                    value={newPrestacion.costo}
                                                    onChange={e => setNewPrestacion({ ...newPrestacion, costo: Number(e.target.value) })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Descripción</label>
                                                <textarea
                                                    placeholder="Detalles adicionales..."
                                                    value={newPrestacion.descripcion}
                                                    onChange={e => setNewPrestacion({ ...newPrestacion, descripcion: e.target.value })}
                                                    rows={3}
                                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.8rem', color: 'white', resize: 'none' }}
                                                />
                                            </div>
                                            <button className="btn btn-primary mt-6 full-width" onClick={savePrestacion}>
                                                {editingPrestacion ? 'Actualizar Cambios' : 'Registrar Prestación'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="wl-header">
                                    <div className="wl-header-left">
                                        <h3>🧬 Catálogo Maestro</h3>
                                        <p className="wl-subtitle">Listado de todos los exámenes disponibles.</p>
                                    </div>
                                    <div className="wl-header-actions">
                                        <div className="wl-badge">{filteredPrestaciones.length} Exámenes</div>
                                        <button className="btn btn-primary" onClick={() => openPrestacionPanel()}>+ Nueva Prestación</button>
                                    </div>
                                </div>

                                <div className="wl-filters-bar">
                                    <div className="wl-filter-group wl-patient-search">
                                        <label>Búsqueda</label>
                                        <input
                                            type="text"
                                            placeholder="Filtrar por nombre o código..."
                                            value={wlSearch}
                                            onChange={e => setWlSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="wl-filter-group">
                                        <label>Categoría</label>
                                        <select value={wlCatFilter} onChange={e => setWlCatFilter(e.target.value)}>
                                            <option value="">Todas las categorías</option>
                                            <option value="Laboratorio">Laboratorio</option>
                                            <option value="Médico">Evaluación Médica</option>
                                            <option value="Rayos X">Rayos X</option>
                                            <option value="Psicotécnico">Psicotécnico</option>
                                            <option value="Electro">Electrocardiograma</option>
                                        </select>
                                    </div>
                                    {(wlSearch || wlCatFilter) && (
                                        <button className="wl-btn-reset" onClick={() => { setWlSearch(''); setWlCatFilter(''); }} title="Limpiar Filtros">
                                            🔄
                                        </button>
                                    )}
                                </div>

                                <div className="wl-table-wrapper">
                                    <table className="wl-table">
                                        <thead>
                                            <tr>
                                                <th className="wl-th-sortable" onClick={() => toggleSort('codigo')}>
                                                    Código {wlSortCol === 'codigo' && (wlSortDir === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th className="wl-th-sortable" onClick={() => toggleSort('nombre')}>
                                                    Nombre {wlSortCol === 'nombre' && (wlSortDir === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th className="wl-th-sortable" onClick={() => toggleSort('categoria')}>
                                                    Categoría {wlSortCol === 'categoria' && (wlSortDir === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th className="wl-th-sortable" style={{ textAlign: 'right' }} onClick={() => toggleSort('costo')}>
                                                    Costo {wlSortCol === 'costo' && (wlSortDir === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th>Gestión</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPrestaciones.length === 0 ? (
                                                <tr><td colSpan={5} className="wl-empty">No se encontraron exámenes con los filtros aplicados.</td></tr>
                                            ) : filteredPrestaciones.map(p => (
                                                <tr key={p.id} className="wl-row" onClick={() => openPrestacionPanel(p)}>
                                                    <td><span className="wl-code">{p.codigo}</span></td>
                                                    <td><strong>{p.nombre}</strong></td>
                                                    <td>
                                                        <span className={`wl-cat-badge wl-cat-${(p.categoria || '').toLowerCase().replace(/ /g, '-')}`}>
                                                            {p.categoria || '—'}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>
                                                        ${Number(p.costo).toLocaleString()}
                                                    </td>
                                                    <td>
                                                        <div className="wl-actions">
                                                            <button className="wl-action-btn edit" onClick={(e) => { e.stopPropagation(); openPrestacionPanel(p); }} title="Editar">✏️</button>
                                                            <button className="wl-action-btn delete" onClick={(e) => { e.stopPropagation(); deletePrestacion(p.id); }} title="Eliminar">🗑️</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {protocolosView === 'baterias' && (
                            <>
                                {/* Panel Lateral (Drawer) para Baterías */}
                                <div className={`side-panel ${showBateriaPanel ? 'open' : ''}`}>
                                    <div className="side-panel-overlay" onClick={closeBateriaPanel}></div>
                                    <div className="side-panel-content">
                                        <div className="side-panel-header">
                                            <h3>{editingBateria ? '✏️ Editar Batería' : '📦 Nueva Batería'}</h3>
                                            <button className="btn-close" onClick={closeBateriaPanel}>&times;</button>
                                        </div>
                                        <p className="section-hint">Define el conjunto de exámenes para un perfil ocupacional.</p>

                                        <div className="add-form vertical mt-4" style={{ overflowY: 'auto', flex: 1, paddingRight: '0.8rem' }}>
                                            <div className="form-group">
                                                <label>Nombre de la Batería</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej: Batería Gran Altura"
                                                    value={newBateria.nombre}
                                                    onChange={e => setNewBateria({ ...newBateria, nombre: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Descripción</label>
                                                <input
                                                    type="text"
                                                    placeholder="Propósito de esta batería..."
                                                    value={newBateria.descripcion}
                                                    onChange={e => setNewBateria({ ...newBateria, descripcion: e.target.value })}
                                                />
                                            </div>

                                            <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand-primary)' }}>Selección de Prestaciones</label>
                                                    <div className="search-mini">
                                                        <input
                                                            type="text"
                                                            placeholder="🔍 Buscar examen..."
                                                            value={batSelectorSearch}
                                                            onChange={e => setBatSelectorSearch(e.target.value)}
                                                            className="input-mini"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="prestaciones-selection-list">
                                                    {prestaciones
                                                        .filter(p =>
                                                            p.nombre.toLowerCase().includes(batSelectorSearch.toLowerCase()) ||
                                                            p.codigo.toLowerCase().includes(batSelectorSearch.toLowerCase())
                                                        )
                                                        .map(p => (
                                                            <label key={p.id} className={`bat-p-item ${newBateria.items.includes(p.id) ? 'selected' : ''}`}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={newBateria.items.includes(p.id)}
                                                                    onChange={e => {
                                                                        const newItems = e.target.checked
                                                                            ? [...newBateria.items, p.id]
                                                                            : newBateria.items.filter(id => id !== p.id);
                                                                        setNewBateria({ ...newBateria, items: newItems });
                                                                    }}
                                                                />
                                                                <div className="bat-p-info">
                                                                    <span className="bat-p-code">{p.codigo}</span>
                                                                    <span className="bat-p-name">{p.nombre}</span>
                                                                </div>
                                                                <span className="bat-p-cat">{p.categoria}</span>
                                                            </label>
                                                        ))}
                                                </div>
                                            </div>

                                            <button className="btn btn-primary mt-4 full-width" onClick={saveBateria}>
                                                {editingBateria ? 'Guardar Cambios' : 'Crear Batería'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h4>Baterías Configuradas</h4>
                                        <p className="section-hint">Paquetes de exámenes predefinidos.</p>
                                    </div>
                                    <button className="btn btn-primary" onClick={() => openBateriaPanel()}>+ Nueva Batería</button>
                                </div>

                                <div className="grid">
                                    {baterias.map(b => (
                                        <div key={b.id} className="card-item interactive-card" onClick={() => openBateriaPanel(b)}>
                                            <div className="card-header">
                                                <h5 style={{ margin: 0 }}>{b.nombre}</h5>
                                                <span className="badge">{b.bateria_items?.length || 0} ítems</span>
                                            </div>
                                            <p className="card-desc mt-2">{b.descripcion || 'Sin descripción'}</p>
                                            <div className="mt-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {b.bateria_items?.slice(0, 5).map(bi => {
                                                    const p = prestaciones.find(pr => pr.id === bi.prestacion_id);
                                                    return p ? <span key={bi.prestacion_id} className="badge-mini">{p.codigo}</span> : null;
                                                })}
                                                {(b.bateria_items?.length || 0) > 5 && <span className="badge-mini">...</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {protocolosView === 'cargos' && (
                            <>
                                {/* Panel Lateral (Drawer) para Cargos */}
                                <div className={`side-panel ${showCargoPanel ? 'open' : ''}`}>
                                    <div className="side-panel-overlay" onClick={closeCargoPanel}></div>
                                    <div className="side-panel-content">
                                        <div className="side-panel-header">
                                            <h3>{editingCargo ? '✏️ Editar Cargo' : '👷 Nuevo Cargo'}</h3>
                                            <button className="btn-close" onClick={closeCargoPanel}>&times;</button>
                                        </div>
                                        <p className="section-hint">Define los parámetros de salud críticos para este cargo.</p>

                                        <div className="add-form vertical mt-4">
                                            <div className="form-group">
                                                <label>Nombre del Cargo</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej: Operador CAEX"
                                                    value={newCargo.nombre}
                                                    onChange={e => setNewCargo({ ...newCargo, nombre: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.8rem', padding: '0.5rem 0' }}>
                                                <input
                                                    type="checkbox"
                                                    id="chk-altura"
                                                    checked={newCargo.es_gran_altura}
                                                    onChange={e => setNewCargo({ ...newCargo, es_gran_altura: e.target.checked })}
                                                    style={{ width: '18px', height: '18px' }}
                                                />
                                                <label htmlFor="chk-altura" style={{ marginBottom: 0, cursor: 'pointer' }}>Exposición a Gran Altura (&gt;3000 msnm)</label>
                                            </div>

                                            <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                🩺 Límites de Aptitud Médica
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label>PA Sistólica Máx</label>
                                                    <input
                                                        type="number"
                                                        value={newCargo.pa_sistolica}
                                                        onChange={e => setNewCargo({ ...newCargo, pa_sistolica: Number(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label>PA Diastólica Máx</label>
                                                    <input
                                                        type="number"
                                                        value={newCargo.pa_diastolica}
                                                        onChange={e => setNewCargo({ ...newCargo, pa_diastolica: Number(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label>Glicemia Máxima (mg/dL)</label>
                                                <input
                                                    type="number"
                                                    value={newCargo.glicemia}
                                                    onChange={e => setNewCargo({ ...newCargo, glicemia: Number(e.target.value) })}
                                                />
                                            </div>

                                            <button className="btn btn-primary mt-8 full-width" onClick={saveCargo}>
                                                {editingCargo ? 'Guardar Cambios' : 'Registrar Cargo'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h4>Catálogo Maestro de Cargos</h4>
                                        <p className="section-hint">Define los roles operativos globales y sus parámetros de salud.</p>
                                    </div>
                                    <button className="btn btn-primary" onClick={() => openCargoPanel()}>+ Nuevo Cargo</button>
                                </div>

                                <div className="grid">
                                    {cargos.map(c => (
                                        <div key={c.id} className="card-item interactive-card" onClick={() => openCargoPanel(c)}>
                                            <div className="card-header">
                                                <h5 style={{ margin: 0 }}>{c.nombre_cargo}</h5>
                                                {c.es_gran_altura && <span className="badge">🏔️ Gran Altura</span>}
                                            </div>
                                            <div className="mt-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    PA: <span style={{ color: 'white', fontWeight: 600 }}>{c.limite_pa_sistolica}/{c.limite_pa_diastolica}</span>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    Glicemia: <span style={{ color: 'white', fontWeight: 600 }}>{c.limite_glicemia_max}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {protocolosView === 'paneles' && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h4>Paneles de Evaluación Activos</h4>
                                        <p className="section-hint">Protocolos finales asignados (Empresa + Cargo = Batería).</p>
                                    </div>
                                </div>

                                <div className="assignment-form-row" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
                                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label>Empresa</label>
                                        <select value={assignmentForm.empresa_id} onChange={e => setAssignmentForm({ ...assignmentForm, empresa_id: e.target.value })}>
                                            <option value="">Seleccione Empresa...</option>
                                            {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label>Cargo Postulante</label>
                                        <select value={assignmentForm.cargo_id} onChange={e => setAssignmentForm({ ...assignmentForm, cargo_id: e.target.value })}>
                                            <option value="">Seleccione Cargo...</option>
                                            {cargos.map(c => <option key={c.id} value={c.id}>{c.nombre_cargo}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label>Batería / Protocolo</label>
                                        <select value={assignmentForm.bateria_id} onChange={e => setAssignmentForm({ ...assignmentForm, bateria_id: e.target.value })}>
                                            <option value="">Seleccione Batería...</option>
                                            {baterias.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                                        </select>
                                    </div>
                                    <button className="btn btn-primary" style={{ height: '42px' }} onClick={async () => {
                                        if (!assignmentForm.empresa_id || !assignmentForm.cargo_id || !assignmentForm.bateria_id) return
                                        const { error } = await supabase.from('empresa_cargo_baterias').insert([{
                                            empresa_id: assignmentForm.empresa_id,
                                            cargo_id: assignmentForm.cargo_id,
                                            bateria_id: assignmentForm.bateria_id
                                        }])
                                        if (error) alert(error.message)
                                        fetchData()
                                        setAssignmentForm({ empresa_id: '', cargo_id: '', bateria_id: '' })
                                    }}>
                                        + Crear Panel
                                    </button>
                                </div>

                                <div className="wl-table-wrapper card">
                                    <table className="wl-table">
                                        <thead>
                                            <tr>
                                                <th>🏢 Empresa</th>
                                                <th>👷 Cargo</th>
                                                <th>📦 Batería / Protocolo</th>
                                                <th style={{ textAlign: 'right' }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paneles.length === 0 ? (
                                                <tr><td colSpan={4} className="wl-empty">No hay paneles configurados.</td></tr>
                                            ) : (
                                                paneles.map(p => (
                                                    <tr key={p.id} className="wl-row">
                                                        <td><div style={{ fontWeight: 700 }}>{p.empresas?.nombre}</div></td>
                                                        <td><span className="badge-mini">{p.cargos?.nombre_cargo}</span></td>
                                                        <td><div style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>📦 {p.baterias?.nombre}</div></td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <button className="wl-action-btn delete" onClick={async () => {
                                                                if (!confirm('¿Eliminar este panel de evaluación?')) return
                                                                await supabase.from('empresa_cargo_baterias').delete().eq('id', p.id)
                                                                fetchData()
                                                            }}>🗑️</button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div >

            <style jsx>{`
                .config-page { display: flex; flex-direction: column; gap: 1.5rem; color: #fff; }
                
                /* Navigation Tabs */
                .tabs { 
                    display: flex; gap: 1rem; border-bottom: 2px solid var(--border-color); 
                    padding-bottom: 0.5rem; margin-bottom: 1.5rem;
                }
                .tab-btn { 
                    background: none; border: none; padding: 0.8rem 1.5rem; cursor: pointer; 
                    font-weight: 700; color: var(--text-muted); border-radius: 12px;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .tab-btn:hover { background: rgba(255,255,255,0.05); color: #fff; }
                .tab-btn.active { 
                    background: var(--brand-primary); color: white; 
                    box-shadow: 0 4px 15px rgba(255,107,44,0.3);
                }

                .sub-tabs {
                    display: flex; gap: 0.5rem; margin-bottom: 1.5rem;
                    background: rgba(255,255,255,0.02); padding: 0.4rem; border-radius: 12px;
                    border: 1px solid var(--border-color);
                }
                .sub-tab-btn {
                    flex: 1; padding: 0.75rem 1rem; border: none; border-radius: 10px;
                    background: transparent; color: var(--text-muted); font-weight: 700;
                    font-size: 0.85rem; cursor: pointer; transition: all 0.2s;
                }
                .sub-tab-btn.active { background: var(--brand-primary); color: white; }

                /* Grid & Cards */
                .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
                .card-item {
                    background: rgba(255,255,255,0.03); border: 1px solid var(--border-color);
                    border-radius: 18px; padding: 1.6rem; transition: all 0.3s ease;
                    position: relative; overflow: hidden;
                }
                .card-item:hover {
                    transform: translateY(-5px); background: rgba(255,255,255,0.05);
                    border-color: rgba(255,107,44,0.4); box-shadow: 0 10px 40px rgba(0,0,0,0.4);
                }
                .interactive-card { cursor: pointer; }
                .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
                .card-header h5 { margin: 0; font-size: 1.15rem; font-weight: 800; color: #fff; }
                .card-desc { font-size: 0.88rem; color: var(--text-muted); line-height: 1.6; }

                /* Sidebar / Drawer */
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
                    position: absolute; top: 0; right: -500px; width: 500px; height: 100%;
                    background: #0d0d0d; border-left: 1px solid var(--border-color);
                    padding: 2.5rem; box-shadow: -20px 0 70px rgba(0,0,0,0.6);
                    transition: right 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                    display: flex; flex-direction: column; overflow-y: auto;
                }
                .side-panel.open .side-panel-content { right: 0; }
                .side-panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
                .side-panel-header h3 { font-size: 1.6rem; font-weight: 900; color: #fff; margin: 0; }

                /* Forms & Controls */
                .form-group { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.25rem; }
                .form-group label { font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
                .form-group input, .form-group select, .form-group textarea {
                    background: rgba(255,255,255,0.03); border: 1.5px solid var(--border-color);
                    border-radius: 12px; padding: 0.9rem 1.1rem; color: #fff; font-size: 0.95rem;
                    transition: all 0.2s; outline: none;
                }
                .form-group input:focus { border-color: var(--brand-primary); background: rgba(255,107,44,0.02); }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }

                /* Premium Selection List */
                .search-mini {
                    background: rgba(255,255,255,0.05); border: 1px solid var(--border-color);
                    border-radius: 10px; padding: 0.4rem 0.8rem; display: flex; align-items: center;
                }
                .input-mini { background: transparent; border: none; color: #fff; font-size: 0.85rem; outline: none; width: 150px; }
                
                .prestaciones-selection-list {
                    background: rgba(0,0,0,0.25); border: 1px solid var(--border-color);
                    border-radius: 16px; max-height: 380px; overflow-y: auto;
                }
                .bat-p-item {
                    display: flex; align-items: center; gap: 14px; padding: 0.9rem 1.2rem;
                    border-bottom: 1px solid rgba(255,255,255,0.03); cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .bat-p-item:hover { background: rgba(255,255,255,0.04); }
                .bat-p-item.selected { background: rgba(255,107,44,0.08); border-left: 4px solid var(--brand-primary); }
                .bat-p-info { flex: 1; display: flex; flex-direction: column; gap: 3px; }
                .bat-p-code { font-size: 0.7rem; font-weight: 900; color: var(--brand-primary); text-transform: uppercase; letter-spacing: 0.02em; }
                .bat-p-name { font-size: 0.9rem; font-weight: 600; color: #f5f5f5; }
                .bat-p-cat { font-size: 0.62rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 6px; align-self: flex-start; }

                /* Global UI Components */
                .badge { font-size: 0.7rem; padding: 4px 12px; border-radius: 20px; font-weight: 800; background: rgba(255,107,44,0.18); color: var(--brand-primary); }
                .badge-mini { font-size: 0.65rem; padding: 3px 8px; border-radius: 6px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); font-family: 'JetBrains Mono', monospace; }
                
                .btn { 
                    padding: 0.85rem 1.6rem; border-radius: 12px; font-weight: 750; cursor: pointer; 
                    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); border: none;
                    display: flex; align-items: center; justify-content: center; gap: 0.6rem;
                }
                .btn-primary { background: var(--brand-primary); color: white; }
                .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(255,107,44,0.4); filter: brightness(1.1); }
                .btn-secondary { background: rgba(255,255,255,0.04); color: #fff; border: 1.2px solid var(--border-color); }
                .btn-secondary:hover { background: rgba(255,255,255,0.08); }

                .btn-close {
                    width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; 
                    border-radius: 10px; background: rgba(255,255,255,0.05); border: 1.5px solid var(--border-color);
                    color: #fff; cursor: pointer; transition: 0.25s; font-size: 1.3rem; line-height: 1;
                }
                .btn-close:hover { background: var(--brand-primary); border-color: var(--brand-primary); transform: rotate(90deg); }

                .full-width { width: 100%; }
                .mt-2 { margin-top: 0.6rem; }
                .mt-4 { margin-top: 1.2rem; }

                /* ═══ Premium WorkList — Catálogo de Exámenes ═══ */
                .wl-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 1.5rem 0; margin-bottom: 0;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .wl-header-left h3 { margin: 0; font-size: 1.2rem; font-weight: 900; }
                .wl-subtitle { font-size: 0.75rem; color: var(--text-muted); margin: 0.25rem 0 0 0; }
                .wl-header-actions { display: flex; align-items: center; gap: 1rem; }
                .wl-badge {
                    background: var(--brand-primary); color: white; padding: 0.25rem 0.8rem;
                    border-radius: 8px; font-size: 0.72rem; font-weight: 800;
                }

                /* Filters */
                .wl-filters-bar {
                    background: rgba(255,255,255,0.02); padding: 1.2rem 0;
                    display: flex; flex-wrap: wrap; gap: 1.2rem; align-items: flex-end;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .wl-filter-group {
                    display: flex; flex-direction: column; gap: 0.4rem;
                }
                .wl-filter-group label {
                    font-size: 0.65rem; text-transform: uppercase; font-weight: 700;
                    color: var(--brand-primary); letter-spacing: 0.05em;
                }
                .wl-filter-group input, .wl-filter-group select {
                    background: rgba(255,255,255,0.03); border: 1.5px solid var(--brand-primary);
                    border-radius: 10px; padding: 0.6rem 0.9rem; font-size: 0.85rem;
                    color: white; outline: none; transition: all 0.2s ease; min-height: 42px;
                }
                .wl-filter-group input:focus, .wl-filter-group select:focus {
                    background: rgba(255,255,255,0.08); border-color: #ff8c42;
                    box-shadow: 0 0 0 3px rgba(255, 107, 44, 0.15);
                }
                .wl-patient-search { flex: 1; min-width: 180px; }
                .wl-btn-reset {
                    background: rgba(255,100,100,0.1); border: 1px solid rgba(255,100,100,0.2);
                    padding: 0.5rem; border-radius: 8px; cursor: pointer; font-size: 0.9rem;
                    transition: 0.2s; height: 42px; width: 42px; display: flex;
                    align-items: center; justify-content: center;
                }
                .wl-btn-reset:hover { background: rgba(255,100,100,0.2); transform: rotate(-45deg); }

                /* Table */
                .wl-table-wrapper { overflow-x: auto; margin-top: 0; }
                .wl-table { width: 100%; border-collapse: collapse; }
                .wl-table th {
                    text-align: left; padding: 1rem 1.2rem; background: rgba(0,0,0,0.15);
                    color: var(--text-muted); font-size: 0.72rem; font-weight: 700;
                    text-transform: uppercase; letter-spacing: 0.06em;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                }
                .wl-th-sortable { cursor: pointer; user-select: none; }
                .wl-th-sortable:hover { color: var(--brand-primary); }
                .wl-table td {
                    padding: 1rem 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.04);
                    font-size: 0.88rem; vertical-align: middle;
                }
                .wl-row { cursor: pointer; transition: background 0.2s ease; }
                .wl-row:hover { background: rgba(255,107,44,0.04); }
                .wl-empty {
                    text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);
                    font-style: italic;
                }

                /* Code Badge */
                .wl-code {
                    font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; font-weight: 800;
                    color: var(--brand-primary); background: rgba(255,107,44,0.08);
                    padding: 0.2rem 0.6rem; border-radius: 6px;
                }

                /* Category Badges */
                .wl-cat-badge {
                    padding: 0.2rem 0.7rem; border-radius: 6px; font-size: 0.68rem;
                    font-weight: 800; display: inline-block; text-transform: uppercase;
                    letter-spacing: 0.03em;
                }
                .wl-cat-laboratorio { background: rgba(59,130,246,0.15); color: #60a5fa; }
                .wl-cat-médico { background: rgba(16,185,129,0.15); color: #34d399; }
                .wl-cat-rayos-x { background: rgba(168,85,247,0.15); color: #c084fc; }
                .wl-cat-psicotécnico { background: rgba(245,158,11,0.15); color: #fbbf24; }
                .wl-cat-electro { background: rgba(239,68,68,0.15); color: #f87171; }

                /* Action Buttons */
                .wl-actions { display: flex; gap: 0.4rem; justify-content: flex-end; }
                .wl-action-btn {
                    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 8px; width: 32px; height: 32px; display: flex;
                    align-items: center; justify-content: center; cursor: pointer;
                    transition: all 0.2s; font-size: 0.8rem;
                }
                .wl-action-btn:hover { background: rgba(255,255,255,0.1); transform: scale(1.1); }
                .wl-action-btn.delete:hover { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); }
                .wl-action-btn.edit:hover { background: rgba(59,130,246,0.15); border-color: rgba(59,130,246,0.3); }

                /* Section Dividers & Layout */
                .section-divider {
                    height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(255,107,44,0.3) 50%, transparent 100%);
                    margin: 2.5rem 0;
                }

                .global-manage-btn {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    background: none; border: 1px solid rgba(255,255,255,0.1);
                    color: var(--text-muted); font-size: 0.75rem; font-weight: 600;
                    padding: 0.5rem 1rem; border-radius: 20px; cursor: pointer;
                    transition: all 0.2s;
                }
                .global-manage-btn:hover {
                    background: rgba(255,255,255,0.05); color: white;
                    border-color: rgba(255,107,44,0.3);
                }

                @media (max-width: 600px) {
                    .side-panel-content { width: 100%; right: -100%; padding: 1.8rem; }
                    .form-row { grid-template-columns: 1fr; }
                    .grid { grid-template-columns: 1fr; }
                    .wl-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
                    .wl-filters-bar { flex-direction: column; }
                    .assignment-form-row { flex-direction: column; }
                }
            `}</style>
        </div >
    )
}
