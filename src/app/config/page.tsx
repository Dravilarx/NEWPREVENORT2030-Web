"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { formatChileanPhone } from '@/lib/formatters'
import { formatearRUT, normalizarRUT } from '@/lib/skills/formateadorRUT'
import { FORM_REGISTRY, DefaultForm } from '@/app/evaluacion/[id]/formularios'


interface Empresa {
    id: string;
    codigo: string;
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
    codigo_fonasa?: string;
    nombre: string;
    categoria: string;
    costo: number;
    descripcion?: string;
    tipo_formulario?: string;
    estado?: string;
}

const TIPOS_FORMULARIO: Record<string, { label: string; icon: string; color: string }> = {
    default: { label: 'Texto Libre', icon: '📝', color: '#64748b' },
    signos_vitales: { label: 'Signos Vitales', icon: '🩺', color: '#10b981' },
    test_visual: { label: 'Test Visual', icon: '👁️', color: '#8b5cf6' },
    audiometria: { label: 'Audiometría', icon: '🦻', color: '#f59e0b' },
    estilo_vida: { label: 'Estilo de Vida', icon: '🏃', color: '#06b6d4' },
    escala_epworth: { label: 'Calidad de Sueño', icon: '😴', color: '#6366f1' },
    romberg: { label: 'Prueba de Romberg', icon: '⚖️', color: '#8b5cf6' },
    framingham: { label: 'Riesgo Cardiovascular', icon: '❤️', color: '#ef4444' },
    ecg: { label: 'Electrocardiograma', icon: '💓', color: '#f43f5e' },
    psicotecnico: { label: 'Psicotécnico', icon: '🚦', color: '#22c55e' },
    psicologico: { label: 'Psicológico', icon: '🧠', color: '#a855f7' },
    laboratorio: { label: 'Laboratorio', icon: '🧪', color: '#0ea5e9' },
    radiologia: { label: 'Radiología', icon: '🩻', color: '#78716c' },
    consulta_medica: { label: 'Consulta Médica', icon: '👨‍⚕️', color: '#14b8a6' },
    consentimiento: { label: 'Consentimiento', icon: '📋', color: '#94a3b8' },
    consentimiento_general: { label: 'Consentimiento General', icon: '📄', color: '#64748b' },
    alcohol_drogas: { label: 'Alcohol y Drogas', icon: '🍺', color: '#8b5cf6' },
    declaracion_salud: { label: 'Declaración de Salud', icon: '🏥', color: '#0ea5e9' },
    sintomas_respiratorios: { label: 'Síntomas Respiratorios', icon: '🫁', color: '#10b981' },
    encuesta_buceo: { label: 'Encuesta de Buceo', icon: '🤿', color: '#3b82f6' },
}

interface Bateria {
    id: string;
    nombre: string;
    descripcion?: string;
    bateria_items?: { prestacion_id: string }[];
    prestacion_id: string;
    empresa_id?: string;
    cargo_id?: string;
    riesgo_id?: string;
    activa?: boolean;
}

interface Riesgo {
    id: string;
    nombre: string;
    codigo: string;
    grupo: string;
    descripcion?: string;
    activo: boolean;
    orden: number;
}


interface PrestacionCategoria {
    id: string;
    nombre: string;
    prefijo: string;
}

interface PanelAssignment {
    id: string;
    empresa_id: string;
    faena_nombre?: string;
    cargo_id: string;
    bateria_id: string;
    empresas?: { nombre: string };
    cargos?: { nombre_cargo: string };
    baterias?: { nombre: string };
}

// --- Toast notification type ---
interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
}

export default function ConfigPage() {
    const [activeTab, setActiveTab] = useState<'empresas' | 'protocolos'>('empresas')
    const [protocolosView, setProtocolosView] = useState<'catalogo' | 'cargos' | 'baterias' | 'riesgos' | 'categorias'>('catalogo')

    // Worklist filter & sort states
    const [wlSearch, setWlSearch] = useState('')
    const [wlCatFilter, setWlCatFilter] = useState('')
    const [wlSortCol, setWlSortCol] = useState<'codigo' | 'codigo_fonasa' | 'nombre' | 'categoria' | 'descripcion' | 'costo'>('codigo')
    const [wlSortDir, setWlSortDir] = useState<'asc' | 'desc'>('asc')
    const [batSearch, setBatSearch] = useState('')
    const [batSelectorSearch, setBatSelectorSearch] = useState('')

    // Section-specific worklist states
    const [empSearch, setEmpSearch] = useState('')
    const [empSortCol, setEmpSortCol] = useState<'nombre' | 'rut_empresa' | 'faenas'>('nombre')
    const [empSortDir, setEmpSortDir] = useState<'asc' | 'desc'>('asc')

    const [cargoSearch, setCargoSearch] = useState('')
    const [cargoSortCol, setCargoSortCol] = useState<'nombre_cargo' | 'es_gran_altura'>('nombre_cargo')
    const [cargoSortDir, setCargoSortDir] = useState<'asc' | 'desc'>('asc')

    const [bateriaSearch, setBateriaSearch] = useState('')
    const [bateriaSortCol, setBateriaSortCol] = useState<'nombre' | 'descripcion'>('nombre')
    const [bateriaSortDir, setBateriaSortDir] = useState<'asc' | 'desc'>('asc')

    const [panelSearch, setPanelSearch] = useState('')
    const [panelSortCol, setPanelSortCol] = useState<'empresa' | 'faena' | 'cargo' | 'bateria'>('empresa')
    const [panelSortDir, setPanelSortDir] = useState<'asc' | 'desc'>('asc')

    const [showPrestacionPanel, setShowPrestacionPanel] = useState(false)
    const [showPrestacionBulkPanel, setShowPrestacionBulkPanel] = useState(false)
    const [editingPrestacion, setEditingPrestacion] = useState<Prestacion | null>(null)
    const [bulkFile, setBulkFile] = useState<File | null>(null)


    const [showBateriaPanel, setShowBateriaPanel] = useState(false)
    const [editingBateria, setEditingBateria] = useState<Bateria | null>(null)

    const [showEmpresaPanel, setShowEmpresaPanel] = useState(false)
    const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null)

    const [showCargoPanel, setShowCargoPanel] = useState(false)
    const [editingCargo, setEditingCargo] = useState<Cargo | null>(null)

    const [showCategoriaPanel, setShowCategoriaPanel] = useState(false)
    const [editingCategoria, setEditingCategoria] = useState<PrestacionCategoria | null>(null)
    const [newCategoria, setNewCategoria] = useState({ nombre: '', prefijo: '' })

    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [cargos, setCargos] = useState<Cargo[]>([])
    const [prestaciones, setPrestaciones] = useState<Prestacion[]>([])
    const [categorias, setCategorias] = useState<PrestacionCategoria[]>([])
    const [baterias, setBaterias] = useState<Bateria[]>([])
    const [paneles, setPaneles] = useState<PanelAssignment[]>([])
    const [riesgos, setRiesgos] = useState<Riesgo[]>([])
    const [loading, setLoading] = useState(false)

    // --- Toast & Confirmation Modal State ---
    const [toasts, setToasts] = useState<Toast[]>([])
    const toastIdRef = useRef(0)
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; nombre: string; type: 'prestacion' | 'cargo' | 'empresa' | 'bateria' | 'categoria' | 'panel' | 'riesgo'; warning: string } | null>(null)

    const [catSearch, setCatSearch] = useState('')
    const [catSortCol, setCatSortCol] = useState<'nombre' | 'prefijo'>('nombre')
    const [catSortDir, setCatSortDir] = useState<'asc' | 'desc'>('asc')

    const [batViewMode, setBatViewMode] = useState<'cards' | 'list'>('cards')
    const [empViewMode, setEmpViewMode] = useState<'cards' | 'list'>('cards')
    const [cargoViewMode, setCargoViewMode] = useState<'cards' | 'list'>('cards')

    const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        const id = ++toastIdRef.current
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 4500)
    }, [])

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

    const filteredEmpresas = useMemo(() => {
        let data = [...empresas]
        if (empSearch.trim()) {
            const q = empSearch.toLowerCase()
            data = data.filter(e =>
                (e.nombre || '').toLowerCase().includes(q) ||
                (e.rut_empresa || '').toLowerCase().includes(q)
            )
        }
        data.sort((a, b) => {
            let va: any = a[empSortCol] ?? ''
            let vb: any = b[empSortCol] ?? ''
            if (empSortCol === 'faenas') {
                va = (a.faenas || []).length
                vb = (b.faenas || []).length
            } else {
                va = String(va).toLowerCase()
                vb = String(vb).toLowerCase()
            }
            if (va < vb) return empSortDir === 'asc' ? -1 : 1
            if (va > vb) return empSortDir === 'asc' ? 1 : -1
            return 0
        })
        return data
    }, [empresas, empSearch, empSortCol, empSortDir])

    const filteredCargos = useMemo(() => {
        let data = [...cargos]
        if (cargoSearch.trim()) {
            const q = cargoSearch.toLowerCase()
            data = data.filter(c => (c.nombre_cargo || '').toLowerCase().includes(q))
        }
        data.sort((a, b) => {
            let va: any = a[cargoSortCol] ?? ''
            let vb: any = b[cargoSortCol] ?? ''
            if (typeof va === 'string') va = va.toLowerCase()
            if (typeof vb === 'string') vb = vb.toLowerCase()
            if (va < vb) return cargoSortDir === 'asc' ? -1 : 1
            if (va > vb) return cargoSortDir === 'asc' ? 1 : -1
            return 0
        })
        return data
    }, [cargos, cargoSearch, cargoSortCol, cargoSortDir])

    const filteredBaterias = useMemo(() => {
        let data = [...baterias]
        if (bateriaSearch.trim()) {
            const q = bateriaSearch.toLowerCase()
            data = data.filter(b =>
                (b.nombre || '').toLowerCase().includes(q) ||
                (b.descripcion || '').toLowerCase().includes(q)
            )
        }
        data.sort((a, b) => {
            let va = (a[bateriaSortCol] || '').toLowerCase()
            let vb = (b[bateriaSortCol] || '').toLowerCase()
            if (va < vb) return bateriaSortDir === 'asc' ? -1 : 1
            if (va > vb) return bateriaSortDir === 'asc' ? 1 : -1
            return 0
        })
        return data
    }, [baterias, bateriaSearch, bateriaSortCol, bateriaSortDir])

    const filteredPaneles = useMemo(() => {
        let data = [...paneles]
        if (panelSearch.trim()) {
            const q = panelSearch.toLowerCase()
            data = data.filter(p =>
                (p.empresas?.nombre || '').toLowerCase().includes(q) ||
                (p.faena_nombre || '').toLowerCase().includes(q) ||
                (p.cargos?.nombre_cargo || '').toLowerCase().includes(q) ||
                (p.baterias?.nombre || '').toLowerCase().includes(q)
            )
        }
        data.sort((a, b) => {
            let va = ''
            let vb = ''
            if (panelSortCol === 'empresa') {
                va = (a.empresas?.nombre || '').toLowerCase()
                vb = (b.empresas?.nombre || '').toLowerCase()
            } else if (panelSortCol === 'faena') {
                va = (a.faena_nombre || '').toLowerCase()
                vb = (b.faena_nombre || '').toLowerCase()
            } else if (panelSortCol === 'cargo') {
                va = (a.cargos?.nombre_cargo || '').toLowerCase()
                vb = (b.cargos?.nombre_cargo || '').toLowerCase()
            } else if (panelSortCol === 'bateria') {
                va = (a.baterias?.nombre || '').toLowerCase()
                vb = (b.baterias?.nombre || '').toLowerCase()
            }
            if (va < vb) return panelSortDir === 'asc' ? -1 : 1
            if (va > vb) return panelSortDir === 'asc' ? 1 : -1
            return 0
        })
        return data
    }, [paneles, panelSearch, panelSortCol, panelSortDir])

    const filteredCategorias = useMemo(() => {
        let data = [...categorias]
        if (catSearch.trim()) {
            const q = catSearch.toLowerCase()
            data = data.filter(c =>
                (c.nombre || '').toLowerCase().includes(q) ||
                (c.prefijo || '').toLowerCase().includes(q)
            )
        }
        data.sort((a, b) => {
            let va = (a[catSortCol] || '').toLowerCase()
            let vb = (b[catSortCol] || '').toLowerCase()
            if (va < vb) return catSortDir === 'asc' ? -1 : 1
            if (va > vb) return catSortDir === 'asc' ? 1 : -1
            return 0
        })
        return data
    }, [categorias, catSearch, catSortCol, catSortDir])

    // Form states
    const [empresaForm, setEmpresaForm] = useState({
        codigo: '',
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

    const [assignmentForm, setAssignmentForm] = useState({
        empresa_id: '',
        faena_nombre: '',
        cargo_id: '',
        bateria_id: ''
    })

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
        descripcion: '',
        tipo_formulario: 'default'
    })

    const [previewResultados, setPreviewResultados] = useState<Record<string, string>>({
        consent_nombre: 'Juan Pérez Ejemplo',
        consent_rut: '12.345.678-9',
    })

    const [newBateria, setNewBateria] = useState({
        nombre: '',
        descripcion: '',
        items: [] as string[],
        empresa_id: '' as string,
        cargo_id: '' as string,
        riesgo_id: '' as string
    })

    const [newRiesgo, setNewRiesgo] = useState({
        codigo: '',
        nombre: '',
        grupo: 'quimico'
    })
    const [showRiesgoPanel, setShowRiesgoPanel] = useState(false)
    const [editingRiesgo, setEditingRiesgo] = useState<Riesgo | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const resetPrestacionForm = () => {
        setNewPrestacion({
            codigo: '',
            nombre: '',
            categoria: '',
            costo: 0,
            descripcion: '',
            tipo_formulario: 'default'
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
                descripcion: p.descripcion || '',
                tipo_formulario: p.tipo_formulario || 'default'
            })
        } else {
            resetPrestacionForm()
            // Proponer categoría si hay al menos una
            if (categorias.length > 0) {
                const defaultCat = categorias[0];
                handleCategoryChange(defaultCat.nombre);
            }
        }
        setShowPrestacionPanel(true)
    }

    const handleCategoryChange = (catName: string) => {
        const cat = categorias.find(c => c.nombre === catName);
        if (!cat) {
            setNewPrestacion(prev => ({ ...prev, categoria: catName }));
            return;
        }

        const prefix = cat.prefijo.endsWith('-') ? cat.prefijo : `${cat.prefijo}-`;
        const numericParts = prestaciones
            .filter(p => p.categoria === catName)
            .map(p => {
                const regex = new RegExp(`${prefix}(\\d+)`);
                const match = (p.codigo || '').match(regex);
                return match ? parseInt(match[1]) : 0;
            })
            .filter(n => n > 0);

        const nextNum = numericParts.length > 0 ? Math.max(...numericParts) + 1 : 1;
        const nextCode = `${prefix}${String(nextNum).padStart(4, '0')}`;

        setNewPrestacion(prev => ({
            ...prev,
            categoria: catName,
            codigo: nextCode
        }));
    }

    const closePrestacionPanel = () => {
        setShowPrestacionPanel(false)
        resetPrestacionForm()
    }

    const openPrestacionBulkPanel = () => setShowPrestacionBulkPanel(true)
    const closePrestacionBulkPanel = () => {
        setShowPrestacionBulkPanel(false)
        setBulkFile(null)
    }

    async function handlePrestacionBulkUpload() {
        if (!bulkFile) return
        setLoading(true)

        const reader = new FileReader()
        reader.onload = async (e) => {
            const text = e.target?.result as string
            const lines = text.split('\n')

            const itemsToRegister = lines.slice(1).filter(l => l.trim().length > 0).map((line, idx) => {
                const parts = line.split(',')
                const codigoFonasa = parts[0]?.trim() || ''
                const nombre = parts[1]?.trim() || ''
                const categoria = parts[2]?.trim() || 'General'
                const costo = Number(parts[3]?.trim()) || 0
                const descripcion = parts.slice(4).join(',').trim() || ''

                // Generar código interno único
                const internalCode = `BULK-${new Date().getTime().toString().slice(-6)}-${idx.toString().padStart(3, '0')}`

                return {
                    codigo: internalCode,
                    codigo_fonasa: codigoFonasa,
                    nombre: nombre,
                    categoria: categoria,
                    costo: costo,
                    descripcion: descripcion,
                    estado: 'En revisión'
                }
            })

            try {
                const { error } = await supabase
                    .from('prestaciones')
                    .upsert(itemsToRegister, { onConflict: 'codigo' })

                if (error) throw error
                alert(`¡Se han cargado ${itemsToRegister.length} exámenes exitosamente! (En estado de revisión)`)
                fetchData()
                closePrestacionBulkPanel()
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Error desconocido'
                alert('Error en carga masiva: ' + msg)
            } finally {
                setLoading(false)
            }
        }
        reader.readAsText(bulkFile)
    }

    // Control Empresa Panel
    const openEmpresaPanel = (e?: Empresa) => {
        if (e) {
            setEditingEmpresa(e)
            setEmpresaForm({
                codigo: e.codigo || '',
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
            setEmpresaForm({ codigo: '(se genera automáticamente)', rut_empresa: '', nombre: '', giro: '', direccion: '', email_contacto: '', nombre_contacto: '', telefono_contacto: '', faenas: [] })
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
                items: (b.bateria_items || []).map((i: { prestacion_id: string }) => i.prestacion_id),
                empresa_id: b.empresa_id || '',
                cargo_id: b.cargo_id || '',
                riesgo_id: b.riesgo_id || ''
            })
        } else {
            setEditingBateria(null)
            setNewBateria({ nombre: '', descripcion: '', items: [], empresa_id: '', cargo_id: '', riesgo_id: '' })
        }
        setShowBateriaPanel(true)
    }
    const closeBateriaPanel = () => { setShowBateriaPanel(false); setEditingBateria(null); }

    const grupoPrefix: Record<string, string> = {
        quimico: 'RQUI',
        fisico: 'RFIS',
        ergonomico: 'RERG',
        altura_geografica: 'RAGEO',
        altura_fisica: 'RAFIS',
        biologico: 'RBIO',
        psicosocial: 'RPSI'
    }

    const generarCodigoRiesgo = (grupo: string) => {
        const prefix = grupoPrefix[grupo] || 'RGEN'
        const existentes = riesgos.filter(r => r.codigo?.startsWith(prefix + '-')).length
        const nextNum = (existentes + 1).toString().padStart(4, '0')
        return `${prefix}-${nextNum}`
    }

    const openRiesgoPanel = (r?: Riesgo) => {
        if (r) {
            setEditingRiesgo(r)
            setNewRiesgo({
                codigo: r.codigo,
                nombre: r.nombre,
                grupo: r.grupo
            })
        } else {
            setEditingRiesgo(null)
            const grupo = 'quimico'
            setNewRiesgo({
                codigo: generarCodigoRiesgo(grupo),
                nombre: '',
                grupo
            })
        }
        setShowRiesgoPanel(true)
    }
    const closeRiesgoPanel = () => { setShowRiesgoPanel(false); setEditingRiesgo(null); }

    async function fetchData() {
        setLoading(true)
        const { data: emp } = await supabase.from('empresas').select('*').order('nombre')
        const { data: car } = await supabase.from('cargos').select('*').order('nombre_cargo')
        const { data: pre } = await supabase.from('prestaciones').select('*').order('nombre')
        const { data: bat } = await supabase.from('baterias').select('*, bateria_items(prestacion_id)').order('nombre')
        const { data: ecb } = await supabase.from('empresa_cargo_baterias').select('*, empresas(nombre), cargos(nombre_cargo), baterias(nombre)')
        const { data: cat } = await supabase.from('prestacion_categorias').select('*').order('nombre')
        const { data: rie } = await (supabase.from('riesgos') as any).select('*').order('orden')

        if (emp) setEmpresas(emp)
        if (car) setCargos(car)
        if (pre) setPrestaciones(pre)
        if (bat) setBaterias(bat)
        if (ecb) setPaneles(ecb)
        if (cat) setCategorias(cat)
        if (rie) setRiesgos(rie)
        setLoading(false)
    }

    async function generateEmpresaCodigo(): Promise<string> {
        const { data } = await supabase.from('empresas').select('codigo').order('codigo', { ascending: false }).limit(1);
        if (data && data.length > 0 && data[0].codigo) {
            const num = parseInt(data[0].codigo.replace('EMP-', ''), 10);
            return 'EMP-' + String(num + 1).padStart(4, '0');
        }
        return 'EMP-0001';
    }

    async function saveEmpresa() {
        if (!empresaForm.nombre || !empresaForm.rut_empresa) {
            showToast('Nombre y RUT son obligatorios', 'warning');
            return;
        }

        const rutNormalizado = normalizarRUT(empresaForm.rut_empresa);
        const payload: any = {
            rut_empresa: rutNormalizado,
            nombre: empresaForm.nombre,
            giro: empresaForm.giro,
            direccion: empresaForm.direccion,
            email_contacto: empresaForm.email_contacto,
            nombre_contacto: empresaForm.nombre_contacto,
            telefono_contacto: empresaForm.telefono_contacto,
            faenas: empresaForm.faenas
        };

        if (editingEmpresa) {
            // Updating existing empresa
            const { error } = await supabase.from('empresas').update(payload).eq('id', editingEmpresa.id);
            if (error) {
                if (error.message.includes('empresas_rut_empresa_unique')) {
                    showToast('Ya existe otra empresa con ese RUT. El RUT es el identificador único.', 'error');
                } else {
                    showToast('Error: ' + error.message, 'error');
                }
                return;
            }
            showToast('Empresa actualizada correctamente', 'success');
        } else {
            // Check if RUT already exists — if so, update that empresa instead of duplicating
            const { data: existing } = await supabase.from('empresas').select('id, nombre, codigo').eq('rut_empresa', rutNormalizado).maybeSingle();
            if (existing) {
                // RUT already exists — update the existing empresa with new data
                const { error } = await supabase.from('empresas').update(payload).eq('id', existing.id);
                if (error) {
                    showToast('Error al actualizar empresa existente: ' + error.message, 'error');
                    return;
                }
                showToast(`RUT ya registrado como "${existing.nombre}" (${existing.codigo}). Datos actualizados.`, 'info');
            } else {
                // New empresa — generate code
                const codigo = await generateEmpresaCodigo();
                payload.codigo = codigo;
                const { error } = await supabase.from('empresas').insert([payload]);
                if (error) {
                    showToast('Error: ' + error.message, 'error');
                    return;
                }
                showToast(`Empresa creada con código ${codigo}`, 'success');
            }
        }

        closeEmpresaPanel();
        fetchData();
    }

    function requestDelete(id: string, nombre: string, type: 'prestacion' | 'cargo' | 'empresa' | 'bateria' | 'categoria' | 'panel' | 'riesgo', warning?: string) {
        const defaultWarnings: Record<string, string> = {
            prestacion: 'Esta acción no se puede deshacer y fallará si el examen está en una batería activa.',
            cargo: 'Esta acción fallará si el cargo está asignado a una empresa en Paneles.',
            empresa: 'Se perderán sus vínculos con cargos y baterías.',
            bateria: 'Esta acción fallará si la batería está asignada en Paneles.',
            categoria: 'Fallará si hay exámenes asociados a esta categoría.',
            panel: 'Se eliminará esta asignación de evaluación.',
            riesgo: 'Se perderán las vinculaciones con baterías y cargos asociados.',
        };
        setDeleteConfirm({ id, nombre, type, warning: warning || defaultWarnings[type] || 'Esta acción no se puede deshacer.' });
    }

    async function executeDelete() {
        if (!deleteConfirm) return;
        const { id, type } = deleteConfirm;
        setDeleteConfirm(null);

        const tableMap: Record<string, string> = {
            prestacion: 'prestaciones',
            cargo: 'cargos',
            empresa: 'empresas',
            bateria: 'baterias',
            categoria: 'prestacion_categorias',
            panel: 'empresa_cargo_baterias',
            riesgo: 'riesgos',
        };
        const labelMap: Record<string, string> = {
            prestacion: 'Prestación',
            cargo: 'Cargo',
            empresa: 'Empresa',
            bateria: 'Batería',
            categoria: 'Categoría',
            panel: 'Panel',
            riesgo: 'Riesgo',
        };

        try {
            const { error } = await supabase.from(tableMap[type]).delete().eq('id', id);
            if (error) {
                if (error.code === '23503') {
                    showToast(`No se puede eliminar: ${labelMap[type]} está en uso. Elimine las dependencias primero.`, 'error');
                } else {
                    showToast(`Error al eliminar: ${error.message}`, 'error');
                }
                return;
            }
            showToast(`${labelMap[type]} eliminado/a correctamente.`, 'success');
            await fetchData();
        } catch (err: any) {
            showToast('Error crítico: ' + (err.message || 'Error desconocido'), 'error');
        }
    }

    function deleteEmpresa(id: string, nombre: string = 'esta empresa') {
        requestDelete(id, nombre, 'empresa');
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
            showToast('Error: ' + error.message, 'error')
            return
        }

        showToast(editingCargo ? 'Cargo actualizado correctamente' : 'Cargo creado correctamente', 'success');
        closeCargoPanel()
        fetchData()
    }

    function deleteCargo(id: string, nombre: string = 'este cargo') {
        if (!id) return;
        requestDelete(id, nombre, 'cargo');
    }

    const openCategoriaPanel = (c?: PrestacionCategoria) => {
        if (c) {
            setEditingCategoria(c)
            setNewCategoria({ nombre: c.nombre, prefijo: c.prefijo })
        } else {
            setEditingCategoria(null)
            setNewCategoria({ nombre: '', prefijo: '' })
        }
        setShowCategoriaPanel(true)
    }
    const closeCategoriaPanel = () => {
        setShowCategoriaPanel(false)
        setEditingCategoria(null)
        setNewCategoria({ nombre: '', prefijo: '' })
    }

    async function saveCategoria() {
        if (!newCategoria.nombre || !newCategoria.prefijo) {
            alert('Nombre y Prefijo son obligatorios');
            return;
        }
        let error;
        if (editingCategoria) {
            const { error: err } = await supabase
                .from('prestacion_categorias')
                .update(newCategoria)
                .eq('id', editingCategoria.id);
            error = err;
        } else {
            const { error: err } = await supabase.from('prestacion_categorias').insert([newCategoria]);
            error = err;
        }
        if (error) {
            alert('Error al guardar categoría: ' + error.message);
            return;
        }
        closeCategoriaPanel();
        fetchData();
    }

    function deleteCategoria(id: string, nombre: string = 'esta categoría') {
        requestDelete(id, nombre, 'categoria');
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
            // Usar upsert con onConflict: 'codigo' para evitar errores de duplicidad si el correlativo fallara por concurrencia
            const { error: err } = await supabase
                .from('prestaciones')
                .upsert([newPrestacion], { onConflict: 'codigo' });
            error = err;
        }

        if (error) {
            console.error('Error saving prestacion:', error);
            alert('Error al guardar: ' + (error.message || 'Error desconocido del servidor'));
            return;
        }

        closePrestacionPanel();
        fetchData();
    }

    // Opens the confirmation modal instead of using native confirm()
    function requestDeletePrestacion(id: string, nombre: string) {
        requestDelete(id, nombre, 'prestacion');
    }

    async function saveBateria() {
        if (!newBateria.nombre || newBateria.items.length === 0) {
            showToast('Nombre y al menos una prestación son obligatorios', 'warning');
            return;
        }

        let batteryId;
        const bateriaPayload: any = {
            nombre: newBateria.nombre,
            descripcion: newBateria.descripcion,
            activa: true,
            empresa_id: newBateria.empresa_id || null,
            cargo_id: newBateria.cargo_id || null,
            riesgo_id: newBateria.riesgo_id || null
        };

        if (editingBateria) {
            batteryId = editingBateria.id;
            const { error } = await supabase.from('baterias').update(bateriaPayload).eq('id', batteryId);
            if (error) { showToast('Error: ' + error.message, 'error'); return; }
            // Borrar items antiguos
            await supabase.from('bateria_items').delete().eq('bateria_id', batteryId);
        } else {
            const { data, error } = await supabase.from('baterias').insert([bateriaPayload]).select();
            if (error) { showToast('Error: ' + error.message, 'error'); return; }
            batteryId = data[0].id;
        }

        // Insertar items
        const items = newBateria.items.map(p_id => ({
            bateria_id: batteryId,
            prestacion_id: p_id
        }));
        await supabase.from('bateria_items').insert(items);

        showToast(editingBateria ? 'Batería actualizada correctamente' : 'Batería creada correctamente', 'success');
        closeBateriaPanel();
        fetchData();
    }

    async function saveRiesgo() {
        if (!newRiesgo.codigo || !newRiesgo.nombre) {
            showToast('Código y Nombre son obligatorios', 'warning');
            return;
        }

        const payload = {
            codigo: newRiesgo.codigo,
            nombre: newRiesgo.nombre,
            grupo: newRiesgo.grupo,
            activo: true,
            orden: 0
        };

        if (editingRiesgo) {
            const { error } = await (supabase.from('riesgos') as any).update(payload).eq('id', editingRiesgo.id);
            if (error) { showToast('Error: ' + error.message, 'error'); return; }
            showToast('Riesgo actualizado correctamente', 'success');
        } else {
            const { error } = await (supabase.from('riesgos') as any).insert([payload]);
            if (error) { showToast('Error: ' + error.message, 'error'); return; }
            showToast('Riesgo creado correctamente', 'success');
        }

        closeRiesgoPanel();
        fetchData();
    }

    function deleteBateria(id: string, nombre: string = 'esta batería') {
        if (!id) return;
        requestDelete(id, nombre, 'bateria');
    }

    async function assignBateria() {
        if (!assignmentForm.empresa_id || !assignmentForm.cargo_id || !assignmentForm.bateria_id) {
            alert('Todos los campos son obligatorios');
            return;
        }

        const { error } = await supabase.from('empresa_cargo_baterias').upsert([{
            empresa_id: assignmentForm.empresa_id,
            faena_nombre: assignmentForm.faena_nombre,
            cargo_id: assignmentForm.cargo_id,
            bateria_id: assignmentForm.bateria_id
        }]);

        if (error) {
            alert('Error en la asignación: ' + error.message);
            return;
        }

        setAssignmentForm({ empresa_id: '', faena_nombre: '', cargo_id: '', bateria_id: '' });
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
                                    {/* Código automático */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,107,44,0.08)', border: '1px solid rgba(255,107,44,0.2)' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Código</span>
                                        <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-primary)', letterSpacing: '1px' }}>{empresaForm.codigo || '(automático)'}</span>
                                    </div>
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
                                            onChange={e => setEmpresaForm({ ...empresaForm, rut_empresa: formatearRUT(e.target.value) })}
                                            onBlur={() => setEmpresaForm({ ...empresaForm, rut_empresa: normalizarRUT(empresaForm.rut_empresa) })}
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
                                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFaenaToLocal(); } }}
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
                                        {empresaForm.faenas.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                No hay faenas registradas
                                            </div>
                                        ) : (
                                            empresaForm.faenas.map((f, i) => (
                                                <div key={i} className="faena-item-local">
                                                    <div>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{f.nombre_faena}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📍 Altitud: {f.altitud}m</div>
                                                    </div>
                                                    <button className="btn-icon-remove" onClick={() => removeFaenaFromLocal(i)}>✕</button>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <button className="btn btn-primary mt-8 full-width" onClick={saveEmpresa}>
                                        {editingEmpresa ? 'Guardar Cambios' : 'Registrar Empresa'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="wl-header">
                            <div className="wl-header-left">
                                <h3>🏢 Directorio de Empresas</h3>
                                <p className="wl-subtitle">Gestiona las compañías que operan con Prevenort.</p>
                            </div>
                            <div className="wl-header-actions">
                                <div className="view-toggle">
                                    <button
                                        className={`view-toggle-btn ${empViewMode === 'cards' ? 'active' : ''}`}
                                        onClick={() => setEmpViewMode('cards')}
                                        title="Vista Tarjetas"
                                    >
                                        🎴
                                    </button>
                                    <button
                                        className={`view-toggle-btn ${empViewMode === 'list' ? 'active' : ''}`}
                                        onClick={() => setEmpViewMode('list')}
                                        title="Vista Lista"
                                    >
                                        📋
                                    </button>
                                </div>
                                <button className="btn btn-primary" onClick={() => openEmpresaPanel()}>
                                    + Nueva Empresa
                                </button>
                            </div>
                        </div>

                        <div className="wl-controls card">
                            <div className="wl-search-wrapper">
                                <span className="wl-search-icon">🔍</span>
                                <input
                                    type="text"
                                    className="wl-search-input"
                                    placeholder="Buscar por nombre o RUT..."
                                    value={empSearch}
                                    onChange={e => setEmpSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {empViewMode === 'list' ? (
                            <div className="wl-table-wrapper card">
                                <table className="wl-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '90px' }}>Código</th>
                                            <th onClick={() => {
                                                if (empSortCol === 'nombre') setEmpSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                                else { setEmpSortCol('nombre'); setEmpSortDir('asc'); }
                                            }} style={{ cursor: 'pointer' }}>
                                                Razón Social {empSortCol === 'nombre' && (empSortDir === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th onClick={() => {
                                                if (empSortCol === 'rut_empresa') setEmpSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                                else { setEmpSortCol('rut_empresa'); setEmpSortDir('asc'); }
                                            }} style={{ cursor: 'pointer' }}>
                                                RUT {empSortCol === 'rut_empresa' && (empSortDir === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th>Contacto Administrativo</th>
                                            <th onClick={() => {
                                                if (empSortCol === 'faenas') setEmpSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                                else { setEmpSortCol('faenas'); setEmpSortDir('asc'); }
                                            }} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                                Faenas {empSortCol === 'faenas' && (empSortDir === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th style={{ textAlign: 'right' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEmpresas.length === 0 ? (
                                            <tr><td colSpan={6} className="wl-empty">No se encontraron empresas con los filtros aplicados.</td></tr>
                                        ) : filteredEmpresas.map(e => (
                                            <tr key={e.id} className="wl-row" onClick={() => openEmpresaPanel(e)}>
                                                <td>
                                                    <span className="wl-code" style={{ fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-primary)' }}>{e.codigo}</span>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 700 }}>{e.nombre}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.giro || '—'}</div>
                                                </td>
                                                <td><span className="wl-code">{e.rut_empresa}</span></td>
                                                <td>
                                                    <div style={{ fontSize: '0.85rem' }}>{e.nombre_contacto || '—'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.email_contacto || ''}</div>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className="badge-mini" style={{ background: 'rgba(255,107,44,0.1)', color: 'var(--brand-primary)' }}>
                                                        {(e.faenas || []).length} faenas
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="wl-actions" style={{ justifyContent: 'flex-end' }}>
                                                        <button className="btn-icon-sq edit" onClick={(ev) => { ev.stopPropagation(); openEmpresaPanel(e); }}>✏️</button>
                                                        <button className="btn-icon-sq delete" onClick={(ev) => { ev.stopPropagation(); deleteEmpresa(e.id, e.nombre); }}>🗑️</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="grid mt-6">
                                {filteredEmpresas.length === 0 ? (
                                    <div className="wl-empty card" style={{ gridColumn: '1/-1' }}>No se encontraron empresas.</div>
                                ) : filteredEmpresas.map(e => (
                                    <div key={e.id} className="card-item interactive-card animate-fade" onClick={() => openEmpresaPanel(e)}>
                                        <div className="card-actions-top">
                                            <button className="btn-icon-sq edit" onClick={(ev) => { ev.stopPropagation(); openEmpresaPanel(e); }}>✏️</button>
                                            <button className="btn-icon-sq delete" onClick={(ev) => { ev.stopPropagation(); deleteEmpresa(e.id, e.nombre); }}>🗑️</button>
                                        </div>
                                        <div className="card-header">
                                            <h5>{e.nombre}</h5>
                                            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)', marginTop: '2px' }}>{e.codigo}</span>
                                        </div>
                                        <div style={{ marginBottom: '1.2rem' }}>
                                            <span className="wl-code">{e.rut_empresa}</span>
                                        </div>
                                        <p className="card-desc" style={{ marginBottom: '1.2rem' }}>{e.giro || 'Sin giro registrado.'}</p>

                                        <div className="card-stats">
                                            <div className="stat">
                                                <span className="label">FAENAS</span>
                                                <span className="value">{(e.faenas || []).length}</span>
                                            </div>
                                            {e.nombre_contacto && (
                                                <div className="stat">
                                                    <span className="label">CONTACTO</span>
                                                    <span className="value" style={{ fontSize: '0.8rem' }}>{e.nombre_contacto}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}


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
                                className={`sub-tab-btn ${protocolosView === 'riesgos' ? 'active' : ''}`}
                                onClick={() => setProtocolosView('riesgos')}
                            >
                                ⚠️ Riesgos
                            </button>
                            <button
                                className={`sub-tab-btn ${protocolosView === 'categorias' ? 'active' : ''}`}
                                onClick={() => setProtocolosView('categorias')}
                            >
                                🏷️ Categorías
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

                                        <div className="add-form vertical mt-4" style={{ overflowY: 'auto', flex: 1, paddingRight: '0.8rem', paddingBottom: '5rem' }}>
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
                                                    onChange={e => handleCategoryChange(e.target.value)}
                                                >
                                                    <option value="">Seleccione Categoría...</option>
                                                    {categorias.map(c => (
                                                        <option key={c.id} value={c.nombre}>{c.nombre} ({c.prefijo})</option>
                                                    ))}
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
                                                <label>Tipo de Formulario</label>
                                                <select
                                                    value={newPrestacion.tipo_formulario || 'default'}
                                                    onChange={e => setNewPrestacion({ ...newPrestacion, tipo_formulario: e.target.value })}
                                                >
                                                    {Object.entries(TIPOS_FORMULARIO).map(([key, val]) => (
                                                        <option key={key} value={key}>{val.icon} {val.label}</option>
                                                    ))}
                                                </select>
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

                                            {/* ===== VISTA PREVIA DEL FORMULARIO ===== */}
                                            {editingPrestacion && (() => {
                                                const tipoForm = newPrestacion.tipo_formulario || 'default'
                                                const FormComponent = FORM_REGISTRY[tipoForm]
                                                const tipoInfo = TIPOS_FORMULARIO[tipoForm] || TIPOS_FORMULARIO['default']

                                                return (
                                                    <div className="form-group" style={{ marginTop: '0.5rem' }}>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span>{tipoInfo.icon}</span>
                                                            Vista Previa del Formulario
                                                            <span style={{
                                                                fontSize: '0.65rem',
                                                                padding: '2px 8px',
                                                                borderRadius: '6px',
                                                                background: `${tipoInfo.color}22`,
                                                                color: tipoInfo.color,
                                                                fontWeight: 600
                                                            }}>
                                                                {tipoInfo.label}
                                                            </span>
                                                        </label>
                                                        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', margin: '-0.3rem 0 0.8rem', lineHeight: 1.3 }}>
                                                            Así se ve el formulario que completará el profesional durante la evaluación.
                                                        </p>

                                                        {FormComponent ? (
                                                            <div style={{
                                                                border: '1px dashed rgba(255,255,255,0.12)',
                                                                borderRadius: '14px',
                                                                padding: '1rem',
                                                                background: 'rgba(0,0,0,0.2)',
                                                                position: 'relative'
                                                            }}>
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    top: '8px',
                                                                    right: '10px',
                                                                    fontSize: '0.62rem',
                                                                    color: '#000',
                                                                    background: 'var(--brand-primary)',
                                                                    fontWeight: 900,
                                                                    padding: '4px 10px',
                                                                    borderRadius: '6px',
                                                                    zIndex: 10,
                                                                    letterSpacing: '0.5px',
                                                                    textTransform: 'uppercase',
                                                                    boxShadow: '0 4px 12px rgba(255,107,44,0.3)'
                                                                }}>
                                                                    ✨ MODO DE PRUEBA ACTIVA
                                                                </div>
                                                                <div style={{ transform: 'scale(0.88)', transformOrigin: 'top left', width: '113.6%', opacity: 1, paddingBottom: '2rem' }}>
                                                                    <FormComponent
                                                                        examId="preview"
                                                                        resultados={previewResultados}
                                                                        updateField={(id, key, val) => setPreviewResultados(prev => ({ ...prev, [key]: val }))}
                                                                        isEditable={true}
                                                                        isFinalizado={false}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div style={{
                                                                border: '1px dashed rgba(255,255,255,0.08)',
                                                                borderRadius: '14px',
                                                                padding: '2rem',
                                                                textAlign: 'center',
                                                                background: 'rgba(0,0,0,0.15)'
                                                            }}>
                                                                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📝</span>
                                                                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                                                                    Formulario de texto libre (por defecto)
                                                                </p>
                                                                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', margin: '0.3rem 0 0' }}>
                                                                    El profesional verá un campo de resultado libre y observaciones.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })()}

                                            <div style={{
                                                position: 'sticky',
                                                bottom: 0,
                                                paddingTop: '1rem',
                                                paddingBottom: '0.5rem',
                                                background: 'linear-gradient(to top, rgba(15,15,25,1) 60%, rgba(15,15,25,0))',
                                                zIndex: 10,
                                                marginTop: '1.5rem'
                                            }}>
                                                <button className="btn btn-primary full-width" onClick={savePrestacion}>
                                                    {editingPrestacion ? 'Actualizar Cambios' : 'Registrar Prestación'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Panel Lateral: Carga Masiva de Prestaciones */}
                                <div className={`side-panel ${showPrestacionBulkPanel ? 'open' : ''}`}>
                                    <div className="side-panel-overlay" onClick={closePrestacionBulkPanel}></div>
                                    <div className="side-panel-content">
                                        <div className="side-panel-header">
                                            <h3>📂 Carga Masiva de Exámenes</h3>
                                            <button className="btn-close" onClick={closePrestacionBulkPanel}>&times;</button>
                                        </div>
                                        <p className="section-hint">Sube el catálogo de exámenes en formato CSV.</p>

                                        <div className="panel-form mt-4">
                                            <div className="bulk-instructions">
                                                <h4>📋 Formato del CSV</h4>
                                                <div className="csv-columns" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1rem' }}>
                                                    {['Código FONASA', 'Nombre', 'Categoría', 'Costo', 'Descripción'].map((col, i) => (
                                                        <span key={col} className="csv-col-tag" style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem' }}>
                                                            <strong style={{ color: 'var(--brand-primary)', marginRight: '4px' }}>{i + 1}</strong>
                                                            {col}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="csv-notes" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    <p>• La primera fila (encabezados) será ignorada.</p>
                                                    <p>• Categorías sugeridas: Laboratorio, Médico, Rayos X, Psicotécnico, Electro.</p>
                                                    <p>• Costo debe ser un valor numérico sin puntos ni símbolos.</p>
                                                    <button
                                                        className="global-manage-btn mt-2"
                                                        style={{ background: 'rgba(255,107,44,0.1)', color: 'var(--brand-primary)', borderColor: 'rgba(255,107,44,0.2)' }}
                                                        onClick={() => {
                                                            const content = "Código_FONASA,Nombre,Categoría,Costo,Descripción\nLAB-01,Hemograma Completo,Laboratorio,15000,Examen de sangre completo\nMED-01,Evaluación Médica General,Médico,25000,Evaluación clínica por profesional\nRX-01,Radiografía de Tórax,Rayos X,35000,Estudio de tórax AP/LAT\nPSI-01,Test Psicotécnico Riguroso,Psicotécnico,45000,Batería de tests para conducción\nECG-01,Electrocardiograma Reposo,Electro,18000,Registro de actividad eléctrica cardiaca";
                                                            const blob = new Blob([content], { type: 'text/csv' });
                                                            const url = window.URL.createObjectURL(blob);
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = 'plantilla_examenes_prevenort.csv';
                                                            a.click();
                                                        }}
                                                    >
                                                        📥 Descargar Plantilla Ejemplo
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="bulk-dropzone mt-6" style={{ border: '2px dashed var(--border-color)', borderRadius: '16px', padding: '2rem', textAlign: 'center' }}>
                                                <input
                                                    type="file"
                                                    accept=".csv"
                                                    onChange={e => setBulkFile(e.target.files?.[0] || null)}
                                                    id="p-bulk-file"
                                                    style={{ display: 'none' }}
                                                />
                                                <label htmlFor="p-bulk-file" style={{ cursor: 'pointer', display: 'block' }}>
                                                    {bulkFile ? (
                                                        <div>
                                                            <span style={{ fontSize: '2rem' }}>📄</span>
                                                            <p style={{ margin: '0.5rem 0', fontWeight: 700 }}>{bulkFile.name}</p>
                                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{(bulkFile.size / 1024).toFixed(1)} KB</span>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <span style={{ fontSize: '2rem', opacity: 0.5 }}>📁</span>
                                                            <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>Seleccionar archivo .csv</p>
                                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click para explorar</span>
                                                        </div>
                                                    )}
                                                </label>
                                            </div>

                                            {bulkFile && (
                                                <button
                                                    className="btn btn-primary full-width mt-6"
                                                    onClick={handlePrestacionBulkUpload}
                                                    disabled={loading}
                                                >
                                                    {loading ? '⏳ Procesando...' : '🚀 Iniciar Carga'}
                                                </button>
                                            )}
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
                                        <button className="btn btn-secondary" onClick={openPrestacionBulkPanel}>📂 Carga Masiva</button>
                                        <button className="btn btn-primary" onClick={() => openPrestacionPanel()}>+ Nueva Prestación</button>
                                    </div>
                                </div>

                                <div className="wl-controls card" style={{ marginTop: '1.5rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <div className="wl-search-wrapper" style={{ flex: '2', minWidth: '280px' }}>
                                            <span className="wl-search-icon">🔍</span>
                                            <input
                                                type="text"
                                                className="wl-search-input"
                                                placeholder="Filtrar por nombre o código..."
                                                value={wlSearch}
                                                onChange={e => setWlSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="wl-search-wrapper" style={{ flex: '1.2', minWidth: '220px' }}>
                                            <span className="wl-search-icon">📁</span>
                                            <select
                                                className="wl-search-input"
                                                value={wlCatFilter}
                                                onChange={e => setWlCatFilter(e.target.value)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <option value="" style={{ background: '#000' }}>Todas las categorías</option>
                                                <option value="Laboratorio" style={{ background: '#000' }}>Laboratorio</option>
                                                <option value="Médico" style={{ background: '#000' }}>Evaluación Médica</option>
                                                <option value="Rayos X" style={{ background: '#000' }}>Rayos X</option>
                                                <option value="Psicotécnico" style={{ background: '#000' }}>Psicotécnico</option>
                                                <option value="Electro" style={{ background: '#000' }}>Electrocardiograma</option>
                                            </select>
                                        </div>
                                        {(wlSearch || wlCatFilter) && (
                                            <button
                                                className="btn-icon-sq"
                                                onClick={() => { setWlSearch(''); setWlCatFilter(''); }}
                                                title="Limpiar Filtros"
                                                style={{ width: '48px', height: '48px' }}
                                            >
                                                🔄
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="wl-table-wrapper">
                                    <table className="wl-table">
                                        <thead>
                                            <tr>
                                                <th className="wl-th-sortable" onClick={() => toggleSort('codigo')}>
                                                    Cód. Interno {wlSortCol === 'codigo' && (wlSortDir === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th className="wl-th-sortable" onClick={() => toggleSort('codigo_fonasa')}>
                                                    Cód. FONASA {wlSortCol === 'codigo_fonasa' && (wlSortDir === 'asc' ? '▲' : '▼')}
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
                                                <th>Formulario</th>
                                                <th>Gestión</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPrestaciones.length === 0 ? (
                                                <tr><td colSpan={7} className="wl-empty">No se encontraron exámenes con los filtros aplicados.</td></tr>
                                            ) : filteredPrestaciones.map(p => (
                                                <tr key={p.id} className="wl-row" onClick={() => openPrestacionPanel(p)}>
                                                    <td><span className="wl-code">{p.codigo}</span></td>
                                                    <td><span className="wl-code" style={{ color: '#6366f1' }}>{p.codigo_fonasa || '---'}</span></td>
                                                    <td>
                                                        <strong>{p.nombre}</strong>
                                                        {p.estado === 'En revisión' && (
                                                            <span style={{ marginLeft: '8px', fontSize: '0.7rem', background: 'rgba(234, 179, 8, 0.2)', color: '#eab308', padding: '2px 6px', borderRadius: '4px' }}>En revisión</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={`wl-cat-badge wl-cat-${(p.categoria || '').toLowerCase().replace(/ /g, '-')}`}>
                                                            {p.categoria || '—'}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>
                                                        ${Number(p.costo).toLocaleString()}
                                                    </td>
                                                    <td>

                                                    </td>
                                                    <td>
                                                        <div className="wl-actions" style={{ justifyContent: 'flex-end' }}>
                                                            <button className="btn-icon-sq edit" style={{ width: '32px', height: '32px', fontSize: '0.9rem' }} onClick={(e) => { e.stopPropagation(); openPrestacionPanel(p); }} title="Editar">✏️</button>
                                                            <button className="btn-icon-sq delete" style={{ width: '32px', height: '32px', fontSize: '0.9rem' }} onClick={(e) => {
                                                                e.stopPropagation();
                                                                requestDeletePrestacion(p.id, p.nombre);
                                                            }} title="Eliminar">🗑️</button>
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

                                            {/* === ASIGNACIÓN DIRECTA === */}
                                            <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                🔗 Asignación
                                            </div>
                                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                                Asocia esta batería a una empresa, cargo y/o riesgo.
                                            </p>

                                            <div className="form-group">
                                                <label>🏢 Empresa</label>
                                                <select
                                                    value={newBateria.empresa_id}
                                                    onChange={e => setNewBateria({ ...newBateria, empresa_id: e.target.value })}
                                                >
                                                    <option value="">— Todas las empresas —</option>
                                                    {empresas.map(emp => (
                                                        <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label>👷 Cargo</label>
                                                <select
                                                    value={newBateria.cargo_id}
                                                    onChange={e => setNewBateria({ ...newBateria, cargo_id: e.target.value })}
                                                >
                                                    <option value="">— Todos los cargos —</option>
                                                    {cargos.map(c => (
                                                        <option key={c.id} value={c.id}>{c.nombre_cargo}{c.es_gran_altura ? ' 🏔️' : ''}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label>⚠️ Riesgo</label>
                                                <select
                                                    value={newBateria.riesgo_id}
                                                    onChange={e => setNewBateria({ ...newBateria, riesgo_id: e.target.value })}
                                                >
                                                    <option value="">— Sin riesgo específico —</option>
                                                    {riesgos.map(r => (
                                                        <option key={r.id} value={r.id}>{r.codigo} — {r.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="flex-fill" style={{ marginTop: '1.5rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', minHeight: '0' }}>
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

                                                <div className="prestaciones-selection-list flex-fill">
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

                                <div className="wl-header">
                                    <div className="wl-header-left">
                                        <h4>📦 Baterías Configuradas</h4>
                                        <p className="wl-subtitle">Paquetes de exámenes predefinidos para perfiles ocupacionales.</p>
                                    </div>
                                    <div className="wl-header-actions">
                                        <div className="view-toggle">
                                            <button
                                                className={`view-toggle-btn ${batViewMode === 'cards' ? 'active' : ''}`}
                                                onClick={() => setBatViewMode('cards')}
                                                title="Vista Tarjetas"
                                            >
                                                🎴
                                            </button>
                                            <button
                                                className={`view-toggle-btn ${batViewMode === 'list' ? 'active' : ''}`}
                                                onClick={() => setBatViewMode('list')}
                                                title="Vista Lista"
                                            >
                                                📋
                                            </button>
                                        </div>
                                        <button className="btn btn-primary" onClick={() => openBateriaPanel()}>+ Nueva Batería</button>
                                    </div>
                                </div>

                                <div className="wl-controls card">
                                    <div className="wl-search-wrapper">
                                        <span className="wl-search-icon">🔍</span>
                                        <input
                                            type="text"
                                            className="wl-search-input"
                                            placeholder="Buscar batería por nombre o descripción..."
                                            value={bateriaSearch}
                                            onChange={e => setBateriaSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {batViewMode === 'list' ? (
                                    <div className="wl-table-wrapper card">
                                        <table className="wl-table">
                                            <thead>
                                                <tr>
                                                    <th onClick={() => {
                                                        if (bateriaSortCol === 'nombre') setBateriaSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                                        else { setBateriaSortCol('nombre'); setBateriaSortDir('asc'); }
                                                    }} style={{ cursor: 'pointer' }}>
                                                        Nombre de la Batería {bateriaSortCol === 'nombre' && (bateriaSortDir === 'asc' ? '↑' : '↓')}
                                                    </th>
                                                    <th onClick={() => {
                                                        if (bateriaSortCol === 'descripcion') setBateriaSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                                        else { setBateriaSortCol('descripcion'); setBateriaSortDir('asc'); }
                                                    }} style={{ cursor: 'pointer' }}>
                                                        Descripción {bateriaSortCol === 'descripcion' && (bateriaSortDir === 'asc' ? '↑' : '↓')}
                                                    </th>
                                                    <th style={{ textAlign: 'center' }}>Criterio</th>
                                                    <th style={{ textAlign: 'center' }}>Prestaciones</th>
                                                    <th style={{ textAlign: 'right' }}>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredBaterias.length === 0 ? (
                                                    <tr><td colSpan={5} className="wl-empty">No se encontraron baterías con los filtros aplicados.</td></tr>
                                                ) : filteredBaterias.map(b => (
                                                    <tr key={b.id} className="wl-row" onClick={() => openBateriaPanel(b)}>
                                                        <td><strong>{b.nombre}</strong></td>
                                                        <td><div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{b.descripcion || '—'}</div></td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                                {b.empresa_id && <span className="badge-mini" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '0.7rem' }}>🏢 {empresas.find(e => e.id === b.empresa_id)?.nombre || 'Empresa'}</span>}
                                                                {b.cargo_id && <span className="badge-mini" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', fontSize: '0.7rem' }}>👷 {cargos.find(c => c.id === b.cargo_id)?.nombre_cargo || 'Cargo'}</span>}
                                                                {b.riesgo_id && <span className="badge-mini" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '0.7rem' }}>⚠️ {riesgos.find(r => r.id === b.riesgo_id)?.codigo || 'Riesgo'}</span>}
                                                                {!b.empresa_id && !b.cargo_id && !b.riesgo_id && <span className="badge-mini" style={{ background: 'rgba(100,116,139,0.1)', color: '#64748b', fontSize: '0.7rem' }}>📋 General</span>}
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                                                                {b.bateria_items?.slice(0, 4).map(bi => {
                                                                    const p = prestaciones.find(pr => pr.id === bi.prestacion_id);
                                                                    return p ? <span key={bi.prestacion_id} className="badge-mini">{p.codigo}</span> : null;
                                                                })}
                                                                {(b.bateria_items?.length || 0) > 4 && <span className="badge-mini">+{b.bateria_items!.length - 4}</span>}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="wl-actions" style={{ justifyContent: 'flex-end' }}>
                                                                <button className="btn-icon-sq edit" onClick={(e) => { e.stopPropagation(); openBateriaPanel(b); }}>✏️</button>
                                                                <button className="btn-icon-sq delete" onClick={(e) => { e.stopPropagation(); deleteBateria(b.id, b.nombre); }}>🗑️</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="grid mt-6">
                                        {filteredBaterias.length === 0 ? (
                                            <div className="wl-empty card" style={{ gridColumn: '1/-1' }}>No se encontraron baterías.</div>
                                        ) : filteredBaterias.map(b => (
                                            <div key={b.id} className="card-item interactive-card animate-fade" onClick={() => openBateriaPanel(b)}>
                                                <div className="card-actions-top">
                                                    <button className="btn-icon-sq edit" onClick={(e) => { e.stopPropagation(); openBateriaPanel(b); }}>✏️</button>
                                                    <button className="btn-icon-sq delete" onClick={(e) => { e.stopPropagation(); deleteBateria(b.id, b.nombre); }}>🗑️</button>
                                                </div>
                                                <div className="card-header">
                                                    <h5>{b.nombre}</h5>
                                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                                                        {b.empresa_id && <span className="badge-mini" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.65rem' }}>🏢 {empresas.find(e => e.id === b.empresa_id)?.nombre || 'Empresa'}</span>}
                                                        {b.cargo_id && <span className="badge-mini" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1', fontSize: '0.65rem' }}>👷 {cargos.find(c => c.id === b.cargo_id)?.nombre_cargo || 'Cargo'}</span>}
                                                        {b.riesgo_id && <span className="badge-mini" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '0.65rem' }}>⚠️ {riesgos.find(r => r.id === b.riesgo_id)?.codigo || 'Riesgo'}</span>}
                                                        {!b.empresa_id && !b.cargo_id && !b.riesgo_id && <span className="badge-mini" style={{ background: 'rgba(100,116,139,0.15)', color: '#64748b', fontSize: '0.65rem' }}>📋 General</span>}
                                                    </div>
                                                </div>
                                                <p className="card-desc" style={{ marginBottom: '1.5rem' }}>{b.descripcion || 'Sin descripción.'}</p>

                                                <div className="card-stats">
                                                    <div className="stat">
                                                        <span className="label">EXÁMENES INCLUIDOS</span>
                                                        <span className="value">{b.bateria_items?.length || 0}</span>
                                                    </div>
                                                </div>

                                                <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                    {b.bateria_items?.slice(0, 8).map(bi => {
                                                        const p = prestaciones.find(pr => pr.id === bi.prestacion_id);
                                                        return p ? <span key={bi.prestacion_id} className="badge-mini" style={{ opacity: 0.7 }}>{p.codigo}</span> : null;
                                                    })}
                                                    {(b.bateria_items?.length || 0) > 8 && (
                                                        <span className="badge-mini" style={{ background: 'var(--brand-primary-light)', color: 'var(--brand-primary)' }}>
                                                            +{b.bateria_items!.length - 8} más
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                <div className="wl-header">
                                    <div className="wl-header-left">
                                        <h4>👷 Catálogo Maestro de Cargos</h4>
                                        <p className="wl-subtitle">Define los roles operativos globales y sus parámetros de salud.</p>
                                    </div>
                                    <div className="wl-header-actions">
                                        <div className="view-toggle">
                                            <button
                                                className={`view-toggle-btn ${cargoViewMode === 'cards' ? 'active' : ''}`}
                                                onClick={() => setCargoViewMode('cards')}
                                                title="Vista Tarjetas"
                                            >
                                                🎴
                                            </button>
                                            <button
                                                className={`view-toggle-btn ${cargoViewMode === 'list' ? 'active' : ''}`}
                                                onClick={() => setCargoViewMode('list')}
                                                title="Vista Lista"
                                            >
                                                📋
                                            </button>
                                        </div>
                                        <button className="btn btn-primary" onClick={() => openCargoPanel()}>+ Nuevo Cargo</button>
                                    </div>
                                </div>

                                <div className="wl-controls card">
                                    <div className="wl-search-wrapper">
                                        <span className="wl-search-icon">🔍</span>
                                        <input
                                            type="text"
                                            className="wl-search-input"
                                            placeholder="Buscar cargo por nombre..."
                                            value={cargoSearch}
                                            onChange={e => setCargoSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {cargoViewMode === 'list' ? (
                                    <div className="wl-table-wrapper card">
                                        <table className="wl-table">
                                            <thead>
                                                <tr>
                                                    <th onClick={() => {
                                                        if (cargoSortCol === 'nombre_cargo') setCargoSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                                        else { setCargoSortCol('nombre_cargo'); setCargoSortDir('asc'); }
                                                    }} style={{ cursor: 'pointer' }}>
                                                        Nombre del Cargo {cargoSortCol === 'nombre_cargo' && (cargoSortDir === 'asc' ? '↑' : '↓')}
                                                    </th>
                                                    <th onClick={() => {
                                                        if (cargoSortCol === 'es_gran_altura') setCargoSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                                        else { setCargoSortCol('es_gran_altura'); setCargoSortDir('asc'); }
                                                    }} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                                        Especialidad {cargoSortCol === 'es_gran_altura' && (cargoSortDir === 'asc' ? '↑' : '↓')}
                                                    </th>
                                                    <th style={{ textAlign: 'center' }}>Límites PA (Sm/Dm)</th>
                                                    <th style={{ textAlign: 'center' }}>Glicemia Máx.</th>
                                                    <th style={{ textAlign: 'right' }}>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredCargos.length === 0 ? (
                                                    <tr><td colSpan={5} className="wl-empty">No se encontraron cargos con los filtros aplicados.</td></tr>
                                                ) : filteredCargos.map(c => (
                                                    <tr key={c.id} className="wl-row" onClick={() => openCargoPanel(c)}>
                                                        <td><strong>{c.nombre_cargo}</strong></td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            {c.es_gran_altura ? (
                                                                <span className="badge-mini" style={{ background: 'rgba(255,107,44,0.1)', color: 'var(--brand-primary)' }}>🏔️ Gran Altura</span>
                                                            ) : (
                                                                <span className="badge-mini">Estándar</span>
                                                            )}
                                                        </td>
                                                        <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>{c.limite_pa_sistolica}/{c.limite_pa_diastolica}</td>
                                                        <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>{c.limite_glicemia_max} mg/dL</td>
                                                        <td>
                                                            <div className="wl-actions" style={{ justifyContent: 'flex-end' }}>
                                                                <button className="btn-icon-sq edit" onClick={(e) => { e.stopPropagation(); openCargoPanel(c); }}>✏️</button>
                                                                <button className="btn-icon-sq delete" onClick={(e) => { e.stopPropagation(); deleteCargo(c.id, c.nombre_cargo); }}>🗑️</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="grid mt-6">
                                        {filteredCargos.length === 0 ? (
                                            <div className="wl-empty card" style={{ gridColumn: '1/-1' }}>No se encontraron cargos.</div>
                                        ) : filteredCargos.map(c => (
                                            <div key={c.id} className="card-item interactive-card animate-fade" onClick={() => openCargoPanel(c)}>
                                                <div className="card-actions-top">
                                                    <button className="btn-icon-sq edit" onClick={(e) => { e.stopPropagation(); openCargoPanel(c); }}>✏️</button>
                                                    <button className="btn-icon-sq delete" onClick={(e) => { e.stopPropagation(); deleteCargo(c.id, c.nombre_cargo); }}>🗑️</button>
                                                </div>
                                                <div className="card-header">
                                                    <h5>{c.nombre_cargo}</h5>
                                                </div>
                                                <div style={{ marginBottom: '1.2rem' }}>
                                                    {c.es_gran_altura ? (
                                                        <span className="badge" style={{ background: 'rgba(255,107,44,0.15)' }}>🏔️ Gran Altura</span>
                                                    ) : (
                                                        <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>Estándar</span>
                                                    )}
                                                </div>

                                                <div className="card-stats">
                                                    <div className="stat">
                                                        <span className="label">PA MÁXIMA</span>
                                                        <span className="value">{c.limite_pa_sistolica}/{c.limite_pa_diastolica}</span>
                                                    </div>
                                                    <div className="stat">
                                                        <span className="label">GLICEMIA MÁX</span>
                                                        <span className="value">{c.limite_glicemia_max} mg/dL</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {protocolosView === 'riesgos' && (
                            <>
                                {/* Panel Lateral para Riesgos */}
                                <div className={`side-panel ${showRiesgoPanel ? 'open' : ''}`}>
                                    <div className="side-panel-overlay" onClick={closeRiesgoPanel}></div>
                                    <div className="side-panel-content">
                                        <div className="side-panel-header">
                                            <h3>{editingRiesgo ? '✏️ Editar Riesgo' : '⚠️ Nuevo Riesgo'}</h3>
                                            <button className="btn-close" onClick={closeRiesgoPanel}>&times;</button>
                                        </div>
                                        <p className="section-hint">Define factores de riesgo para automatizar la asignación de baterías.</p>

                                        <div className="add-form vertical mt-4">
                                            <div className="form-group">
                                                <label>Código del Riesgo (Automático)</label>
                                                <input
                                                    type="text"
                                                    disabled
                                                    style={{ background: 'rgba(255,107,44,0.05)', cursor: 'not-allowed', color: 'var(--text-muted)' }}
                                                    value={newRiesgo.codigo}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Nombre del Riesgo</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej: Sílice Libre Cristalizada"
                                                    value={newRiesgo.nombre}
                                                    onChange={e => setNewRiesgo({ ...newRiesgo, nombre: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Grupo / Categoría</label>
                                                <select
                                                    value={newRiesgo.grupo}
                                                    onChange={e => {
                                                        const nuevoGrupo = e.target.value;
                                                        setNewRiesgo({
                                                            ...newRiesgo,
                                                            grupo: nuevoGrupo as any,
                                                            codigo: editingRiesgo ? newRiesgo.codigo : generarCodigoRiesgo(nuevoGrupo)
                                                        })
                                                    }}
                                                >
                                                    <option value="quimico">🧪 Químico</option>
                                                    <option value="fisico">🔊 Físico</option>
                                                    <option value="ergonomico">🏋️ Ergonómico</option>
                                                    <option value="altura_geografica">🏔️ Altura Geográfica</option>
                                                    <option value="altura_fisica">🪜 Altura Física</option>
                                                    <option value="biologico">🦠 Biológico</option>
                                                    <option value="psicosocial">🧠 Psicosocial</option>
                                                </select>
                                            </div>
                                            <button className="btn btn-primary mt-6 full-width" onClick={saveRiesgo}>
                                                {editingRiesgo ? 'Guardar Cambios' : 'Crear Riesgo'}
                                            </button>

                                            {editingRiesgo && (
                                                <button
                                                    className="btn btn-outline mt-2 full-width"
                                                    style={{ color: '#ef4444', borderColor: '#ef4444' }}
                                                    onClick={() => requestDelete(editingRiesgo.id, editingRiesgo.nombre, 'riesgo')}
                                                >
                                                    Eliminar Riesgo
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="wl-header">
                                    <div className="wl-header-left">
                                        <h4>⚠️ Catálogo de Riesgos Ocupacionales</h4>
                                        <p className="wl-subtitle">Factores de riesgo que determinan qué baterías se aplican automáticamente.</p>
                                    </div>
                                    <div className="wl-header-actions">
                                        <button className="btn btn-primary" onClick={() => openRiesgoPanel()}>+ Nuevo Riesgo</button>
                                    </div>
                                </div>

                                {(() => {
                                    const gruposOrder = ['quimico', 'fisico', 'ergonomico', 'altura', 'biologico', 'psicosocial'];
                                    const gruposPresentes = [...new Set(riesgos.map(r => r.grupo))].sort((a, b) => {
                                        return gruposOrder.indexOf(a) - gruposOrder.indexOf(b);
                                    });

                                    return gruposPresentes.map(grupo => (
                                        <div key={grupo} className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                                            <h5 style={{ marginBottom: '1rem', color: 'var(--brand-primary)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px' }}>
                                                {grupo === 'quimico' ? '🧪 Químico' :
                                                    grupo === 'fisico' ? '🔊 Físico' :
                                                        grupo === 'ergonomico' ? '🏋️ Ergonómico' :
                                                            grupo === 'altura_geografica' ? '🏔️ Altura Geográfica' :
                                                                grupo === 'altura_fisica' ? '🪜 Altura Física' :
                                                                    grupo === 'biologico' ? '🦠 Biológico' :
                                                                        grupo === 'psicosocial' ? '🧠 Psicosocial' :
                                                                            `📋 ${grupo}`}
                                            </h5>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {riesgos.filter(r => r.grupo === grupo).sort((a, b) => (a.orden || 0) - (b.orden || 0)).map(r => {
                                                    const bateriasAsociadas = baterias.filter(b => b.riesgo_id === r.id).length
                                                    return (
                                                        <div key={r.id}
                                                            onClick={() => openRiesgoPanel(r)}
                                                            className="interactive-item"
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                                padding: '8px 14px', borderRadius: '10px',
                                                                background: r.activo ? 'rgba(255,107,44,0.08)' : 'rgba(100,116,139,0.08)',
                                                                border: `1px solid ${r.activo ? 'rgba(255,107,44,0.25)' : 'rgba(100,116,139,0.2)'}`,
                                                                opacity: r.activo ? 1 : 0.5,
                                                                transition: 'all 0.2s ease',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: r.activo ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                                                {r.codigo}
                                                            </span>
                                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>
                                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{r.nombre}</span>
                                                            {bateriasAsociadas > 0 && (
                                                                <span className="badge-mini" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '0.7rem' }}>
                                                                    📦 {bateriasAsociadas}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))
                                })()}

                                {riesgos.length === 0 && (
                                    <div className="wl-empty card" style={{ textAlign: 'center', padding: '3rem' }}>
                                        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>No hay riesgos configurados aún.</p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Haz clic en "+ Nuevo Riesgo" para comenzar a poblar el catálogo.</p>
                                        <button className="btn btn-outline mt-4" onClick={() => openRiesgoPanel()}>+ Agregar el Primer Riesgo</button>
                                    </div>
                                )}
                            </>
                        )}

                        {protocolosView === 'categorias' && (
                            <>
                                <div className="side-panel open" style={{ display: showCategoriaPanel ? 'block' : 'none' }}>
                                    <div className="side-panel-overlay" onClick={closeCategoriaPanel}></div>
                                    <div className="side-panel-content">
                                        <div className="side-panel-header">
                                            <h3>{editingCategoria ? '✏️ Editar Categoría' : '🏷️ Nueva Categoría'}</h3>
                                            <button className="btn-close" onClick={closeCategoriaPanel}>&times;</button>
                                        </div>
                                        <div className="add-form vertical mt-4">
                                            <div className="form-group">
                                                <label>Nombre de Categoría</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej: Laboratorio"
                                                    value={newCategoria.nombre}
                                                    onChange={e => setNewCategoria({ ...newCategoria, nombre: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Prefijo del Código</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej: LAB"
                                                    value={newCategoria.prefijo}
                                                    onChange={e => setNewCategoria({ ...newCategoria, prefijo: e.target.value.toUpperCase() })}
                                                />
                                                <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                                    Se usará para generar códigos tipo PRE-0001 (ej: LAB-0001)
                                                </small>
                                            </div>
                                            <button className="btn btn-primary mt-6 full-width" onClick={saveCategoria}>
                                                {editingCategoria ? 'Guardar Cambios' : 'Registrar Categoría'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="wl-header">
                                    <div className="wl-header-left">
                                        <h3>🏷️ Gestión de Categorías</h3>
                                        <p className="wl-subtitle">Configura los tipos de exámenes y sus prefijos de codificación.</p>
                                    </div>
                                    <button className="btn btn-primary" onClick={() => openCategoriaPanel()}>+ Nueva Categoría</button>
                                </div>

                                <div className="wl-controls card">
                                    <div className="wl-search-wrapper">
                                        <span className="wl-search-icon">🔍</span>
                                        <input
                                            type="text"
                                            className="wl-search-input"
                                            placeholder="Buscar categoría o prefijo..."
                                            value={catSearch}
                                            onChange={e => setCatSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="wl-table-wrapper card">
                                    <table className="wl-table">
                                        <thead>
                                            <tr>
                                                <th onClick={() => {
                                                    if (catSortCol === 'nombre') setCatSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                                    else { setCatSortCol('nombre'); setCatSortDir('asc'); }
                                                }} style={{ cursor: 'pointer' }}>
                                                    Nombre de la Categoría {catSortCol === 'nombre' && (catSortDir === 'asc' ? '↑' : '↓')}
                                                </th>
                                                <th onClick={() => {
                                                    if (catSortCol === 'prefijo') setCatSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                                    else { setCatSortCol('prefijo'); setCatSortDir('asc'); }
                                                }} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                                    Prefijo de Código {catSortCol === 'prefijo' && (catSortDir === 'asc' ? '↑' : '↓')}
                                                </th>
                                                <th style={{ textAlign: 'center' }}>Ejemplo</th>
                                                <th style={{ textAlign: 'right' }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCategorias.length === 0 ? (
                                                <tr><td colSpan={4} className="wl-empty">No se encontraron categorías con los filtros aplicados.</td></tr>
                                            ) : filteredCategorias.map(c => (
                                                <tr key={c.id} className="wl-row" onClick={() => openCategoriaPanel(c)}>
                                                    <td><strong>{c.nombre}</strong></td>
                                                    <td style={{ textAlign: 'center' }}><span className="badge-mini">{c.prefijo}</span></td>
                                                    <td style={{ textAlign: 'center' }}><span className="wl-code">{c.prefijo}-0001</span></td>
                                                    <td>
                                                        <div className="wl-actions" style={{ justifyContent: 'flex-end' }}>
                                                            <button className="btn-icon-sq edit" onClick={(e) => { e.stopPropagation(); openCategoriaPanel(c); }}>✏️</button>
                                                            <button className="btn-icon-sq delete" onClick={(e) => { e.stopPropagation(); deleteCategoria(c.id, c.nombre); }}>🗑️</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div >

            {/* ═══ Toast Notifications ═══ */}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type}`}>
                        <span className="toast-icon">
                            {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : t.type === 'warning' ? '⚠️' : 'ℹ️'}
                        </span>
                        <span className="toast-msg">{t.message}</span>
                        <button className="toast-close" onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>×</button>
                    </div>
                ))}
            </div>

            {/* ═══ Confirmation Modal ═══ */}
            {deleteConfirm && (
                <div className="confirm-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="confirm-icon">🗑️</div>
                        <h3>Confirmar Eliminación</h3>
                        <p>¿Estás seguro de eliminar <strong>{deleteConfirm.nombre}</strong>?</p>
                        <p className="confirm-warning">{deleteConfirm.warning}</p>
                        <div className="confirm-actions">
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
                            <button className="btn btn-danger" onClick={executeDelete}>Sí, Eliminar</button>
                        </div>
                    </div>
                </div>
            )}

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
                .card-stats { display: flex; flex-direction: column; gap: 0.5rem; }
                .stat { display: flex; justify-content: space-between; align-items: center; }
                .stat .label { color: var(--text-muted); font-size: 0.75rem; font-weight: 600; }
                .stat .value { color: #fff; font-weight: 700; }

                .faena-item-local {
                    display: flex; justify-content: space-between; align-items: center; 
                    background: rgba(255,255,255,0.03); padding: 0.6rem 1rem; 
                    borderRadius: 10px; border: 1.2px solid rgba(255,107,44,0.12);
                    transition: all 0.2s;
                }
                .faena-item-local:hover { background: rgba(255,107,44,0.05); border-color: var(--brand-primary); }
                .btn-icon-remove {
                    background: rgba(255,0,0,0.1); color: #ff4444; border: none;
                    width: 24px; height: 24px; border-radius: 6px; display: flex;
                    align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;
                }
                .btn-icon-remove:hover { background: #ff4444; color: white; transform: rotate(90deg); }

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
                    position: fixed; top: 0 !important; right: -950px; width: 950px; height: 100vh !important;
                    background: #0d0d0d; border-left: 1px solid var(--border-color);
                    padding: 2.5rem; box-shadow: -20px 0 70px rgba(0,0,0,0.6);
                    transition: right 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                    display: flex; flex-direction: column; overflow: hidden;
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
                    border-radius: 16px; overflow-y: auto;
                }
                .flex-fill { flex: 1; min-height: 0; }
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

                /* Search & Worklist Controls */
                .wl-controls { 
                    margin-bottom: 1.5rem; padding: 1rem; 
                    background: rgba(255,255,255,0.02);
                }
                .wl-search-wrapper {
                    position: relative; display: flex; align-items: center; 
                    background: #000000 !important; 
                    border: 1.5px solid var(--border-color);
                    border-radius: 12px; padding: 0 1.2rem; transition: all 0.3s ease;
                    height: 48px;
                }
                .wl-search-wrapper:focus-within {
                    border-color: var(--brand-primary);
                    box-shadow: 0 0 0 4px rgba(255,107,44,0.1);
                }
                .wl-search-icon { color: var(--text-muted); font-size: 1rem; margin-right: 0.8rem; }
                .wl-search-input {
                    background: #000000 !important; border: none !important; 
                    color: #ffffff !important; padding: 0.9rem 0 !important; width: 100%;
                    font-size: 0.95rem; outline: none !important;
                    appearance: none;
                }
                .wl-search-input::placeholder { color: rgba(255,255,255,0.3); }

                /* View Toggles */
                .view-toggle {
                    display: flex; background: rgba(255,255,255,0.05);
                    padding: 4px; border-radius: 10px; border: 1px solid var(--border-color);
                }
                .view-toggle-btn {
                    padding: 0.4rem 0.8rem; border-radius: 6px; border: none;
                    background: transparent; color: var(--text-muted); font-size: 1.1rem;
                    cursor: pointer; transition: all 0.2s;
                }
                .view-toggle-btn:hover { background: rgba(255,255,255,0.05); color: #fff; }
                .view-toggle-btn.active {
                    background: var(--brand-primary); color: white;
                    box-shadow: 0 4px 12px rgba(255,107,44,0.25);
                }

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

                /* Premium Square Action Buttons (matching screenshot) */
                .card-actions-top {
                    position: absolute; top: 1.2rem; right: 1.2rem;
                    display: flex; gap: 0.6rem; z-index: 50;
                }
                .btn-icon-sq {
                    width: 38px; height: 38px; border-radius: 10px;
                    background: #1a1a1a; border: 1.5px solid rgba(255,255,255,0.08);
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    font-size: 1.1rem; box-shadow: 0 4px 15px rgba(0,0,0,0.4);
                    backdrop-filter: blur(5px);
                }
                .btn-icon-sq:hover {
                    transform: translateY(-3px); background: #252525;
                    border-color: rgba(255,107,44,0.4);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.6);
                }
                .btn-icon-sq.delete:hover { border-color: #ef4444; color: #ef4444; }
                .btn-icon-sq.edit:hover { border-color: #3b82f6; color: #3b82f6; }

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
                    .wl-controls > div { flex-direction: column; }
                    .assignment-form-row { flex-direction: column; }
                }

                /* ═══ Toast Notifications ═══ */
                .toast-container {
                    position: fixed; top: 1.5rem; right: 1.5rem; z-index: 9999;
                    display: flex; flex-direction: column; gap: 0.8rem;
                    pointer-events: none;
                }
                .toast {
                    pointer-events: auto;
                    display: flex; align-items: center; gap: 0.8rem;
                    padding: 1rem 1.4rem; border-radius: 14px;
                    background: rgba(20,20,20,0.95); backdrop-filter: blur(12px);
                    border: 1px solid rgba(255,255,255,0.08);
                    box-shadow: 0 12px 40px rgba(0,0,0,0.5);
                    color: #fff; font-size: 0.88rem; font-weight: 600;
                    animation: toast-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    min-width: 320px; max-width: 480px;
                }
                @keyframes toast-in {
                    from { opacity: 0; transform: translateX(60px) scale(0.95); }
                    to { opacity: 1; transform: translateX(0) scale(1); }
                }
                .toast-success { border-left: 4px solid #22c55e; }
                .toast-error { border-left: 4px solid #ef4444; }
                .toast-warning { border-left: 4px solid #f59e0b; }
                .toast-info { border-left: 4px solid #3b82f6; }
                .toast-icon { font-size: 1.2rem; }
                .toast-msg { flex: 1; line-height: 1.4; }
                .toast-close {
                    background: none; border: none; color: rgba(255,255,255,0.4);
                    font-size: 1.3rem; cursor: pointer; padding: 0 4px;
                    transition: color 0.2s;
                }
                .toast-close:hover { color: #fff; }

                /* ═══ Confirmation Modal ═══ */
                .confirm-overlay {
                    position: fixed; inset: 0; z-index: 8000;
                    background: rgba(0,0,0,0.75); backdrop-filter: blur(8px);
                    display: flex; align-items: center; justify-content: center;
                    animation: fade-in 0.2s ease;
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .confirm-modal {
                    background: #141414; border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 20px; padding: 2.5rem; text-align: center;
                    max-width: 420px; width: 90%;
                    box-shadow: 0 25px 80px rgba(0,0,0,0.7);
                    animation: modal-pop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes modal-pop {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .confirm-icon { font-size: 3rem; margin-bottom: 1rem; }
                .confirm-modal h3 {
                    font-size: 1.3rem; font-weight: 900; margin: 0 0 0.8rem 0; color: #fff;
                }
                .confirm-modal p {
                    font-size: 0.9rem; color: var(--text-muted); line-height: 1.5;
                    margin: 0 0 0.5rem 0;
                }
                .confirm-warning {
                    font-size: 0.78rem !important; color: #f87171 !important;
                    background: rgba(239,68,68,0.08); padding: 0.6rem 1rem;
                    border-radius: 10px; margin-top: 0.8rem !important;
                }
                .confirm-actions {
                    display: flex; gap: 1rem; margin-top: 1.5rem;
                    justify-content: center;
                }
                .btn-danger {
                    background: #ef4444; color: white;
                    padding: 0.85rem 1.6rem; border-radius: 12px;
                    font-weight: 750; cursor: pointer; border: none;
                    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .btn-danger:hover {
                    background: #dc2626; transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(239,68,68,0.4);
                }
            `}</style>


        </div >
    )
}
