'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

// ============================================================
// TYPES
// ============================================================

interface CampoFormulario {
    id?: string
    plantilla_id?: string
    nombre_campo: string
    etiqueta: string
    tipo_campo: string
    placeholder?: string
    obligatorio: boolean
    orden: number
    grupo?: string
    ancho: string
    opciones: any[]
    validacion: Record<string, any>
    valor_default?: string
}

interface Plantilla {
    id?: string
    prestacion_id: string
    nombre: string
    descripcion?: string
    icono: string
    orden: number
    activo: boolean
    campos: CampoFormulario[]
}

interface FormBuilderProps {
    prestacionId: string
    prestacionNombre: string
    onClose: () => void
    showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void
}

// ============================================================
// FIELD TYPES CONFIG
// ============================================================

const TIPOS_CAMPO: Record<string, { label: string; icon: string; desc: string }> = {
    text: { label: 'Texto', icon: '📝', desc: 'Campo de texto corto' },
    number: { label: 'Número', icon: '🔢', desc: 'Valor numérico' },
    textarea: { label: 'Texto largo', icon: '📄', desc: 'Área de texto multi-línea' },
    select: { label: 'Selección', icon: '📋', desc: 'Lista desplegable de opciones' },
    checkbox: { label: 'Casilla', icon: '☑️', desc: 'Sí / No (verdadero/falso)' },
    radio: { label: 'Opción múltiple', icon: '🔘', desc: 'Selección única entre opciones' },
    date: { label: 'Fecha', icon: '📅', desc: 'Selector de fecha' },
    photo: { label: 'Foto / Archivo', icon: '📸', desc: 'Subida de imagen o documento' },
    heading: { label: 'Encabezado', icon: '🏷️', desc: 'Título de sección (sin dato)' },
    calculated: { label: 'Calculado', icon: '🧮', desc: 'Valor calculado automáticamente' },
}

const ANCHOS: Record<string, string> = {
    full: '100%',
    half: '50%',
    third: '33%',
}

const ICONOS_DISPONIBLES = ['📋', '🩺', '👁️', '🦻', '🏃', '😴', '⚖️', '❤️', '💓', '🚦', '🧠', '🧪', '🩻', '👨‍⚕️', '📸', '📊', '📝', '💉', '🫀', '🫁', '🦴', '🦷', '👂', '🧬', '🔬']

// ============================================================
// DEFAULT EMPTY FIELD
// ============================================================

function newEmptyCampo(orden: number): CampoFormulario {
    return {
        nombre_campo: '',
        etiqueta: '',
        tipo_campo: 'text',
        placeholder: '',
        obligatorio: false,
        orden,
        grupo: '',
        ancho: 'full',
        opciones: [],
        validacion: {},
        valor_default: '',
    }
}

// ============================================================
// COMPONENT
// ============================================================

export default function FormBuilder({ prestacionId, prestacionNombre, onClose, showToast }: FormBuilderProps) {
    const [plantillas, setPlantillas] = useState<Plantilla[]>([])
    const [activePlantilla, setActivePlantilla] = useState<number>(0)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [editingCampo, setEditingCampo] = useState<number | null>(null)
    const [showAddField, setShowAddField] = useState(false)
    const [dragIdx, setDragIdx] = useState<number | null>(null)
    const [newOpcion, setNewOpcion] = useState('')
    const scrollRef = useRef<HTMLDivElement>(null)

    // ---- LOAD ----
    const loadPlantillas = useCallback(async () => {
        setLoading(true)
        const { data: plantillasData, error } = await supabase
            .from('formulario_plantillas')
            .select('*')
            .eq('prestacion_id', prestacionId)
            .order('orden')

        if (error) {
            showToast('Error cargando plantillas: ' + error.message, 'error')
            setLoading(false)
            return
        }

        if (!plantillasData || plantillasData.length === 0) {
            setPlantillas([])
            setLoading(false)
            return
        }

        // Load campos for each plantilla
        const fullPlantillas: Plantilla[] = []
        for (const p of plantillasData) {
            const { data: campos } = await supabase
                .from('formulario_campos')
                .select('*')
                .eq('plantilla_id', p.id)
                .order('orden')

            fullPlantillas.push({
                ...p,
                campos: campos || []
            })
        }

        setPlantillas(fullPlantillas)
        setLoading(false)
    }, [prestacionId, showToast])

    useEffect(() => { loadPlantillas() }, [loadPlantillas])

    // ---- ADD NEW PLANTILLA ----
    const addPlantilla = () => {
        setPlantillas(prev => [...prev, {
            prestacion_id: prestacionId,
            nombre: `Formulario ${prev.length + 1}`,
            icono: '📋',
            orden: prev.length,
            activo: true,
            campos: []
        }])
        setActivePlantilla(plantillas.length)
    }

    // ---- DELETE PLANTILLA ----
    const deletePlantilla = async (idx: number) => {
        const p = plantillas[idx]
        if (p.id) {
            const { error } = await supabase.from('formulario_plantillas').delete().eq('id', p.id)
            if (error) { showToast('Error eliminando: ' + error.message, 'error'); return }
        }
        setPlantillas(prev => prev.filter((_, i) => i !== idx))
        if (activePlantilla >= plantillas.length - 1) setActivePlantilla(Math.max(0, plantillas.length - 2))
        showToast('Formulario eliminado', 'success')
    }

    // ---- UPDATE PLANTILLA METADATA ----
    const updatePlantillaMeta = (field: string, value: any) => {
        setPlantillas(prev => prev.map((p, i) => i === activePlantilla ? { ...p, [field]: value } : p))
    }

    // ---- CAMPOS MANAGEMENT ----
    const currentPlantilla = plantillas[activePlantilla] || null

    const addCampo = (tipo: string) => {
        if (!currentPlantilla) return
        const campo = newEmptyCampo(currentPlantilla.campos.length)
        campo.tipo_campo = tipo
        campo.etiqueta = TIPOS_CAMPO[tipo]?.label || tipo
        campo.nombre_campo = `campo_${Date.now()}`

        setPlantillas(prev => prev.map((p, i) =>
            i === activePlantilla ? { ...p, campos: [...p.campos, campo] } : p
        ))
        setEditingCampo(currentPlantilla.campos.length)
        setShowAddField(false)
    }

    const updateCampo = (campoIdx: number, field: string, value: any) => {
        setPlantillas(prev => prev.map((p, i) =>
            i === activePlantilla ? {
                ...p,
                campos: p.campos.map((c, ci) => ci === campoIdx ? { ...c, [field]: value } : c)
            } : p
        ))
    }

    const deleteCampo = (campoIdx: number) => {
        setPlantillas(prev => prev.map((p, i) =>
            i === activePlantilla ? {
                ...p,
                campos: p.campos.filter((_, ci) => ci !== campoIdx).map((c, ci) => ({ ...c, orden: ci }))
            } : p
        ))
        setEditingCampo(null)
    }

    const moveCampo = (from: number, to: number) => {
        if (!currentPlantilla || to < 0 || to >= currentPlantilla.campos.length) return
        setPlantillas(prev => prev.map((p, i) => {
            if (i !== activePlantilla) return p
            const campos = [...p.campos]
            const [moved] = campos.splice(from, 1)
            campos.splice(to, 0, moved)
            return { ...p, campos: campos.map((c, ci) => ({ ...c, orden: ci })) }
        }))
        setEditingCampo(to)
    }

    // ---- ADD/REMOVE OPTIONS (for select/radio) ----
    const addOption = (campoIdx: number) => {
        if (!newOpcion.trim()) return
        updateCampo(campoIdx, 'opciones', [
            ...(currentPlantilla?.campos[campoIdx]?.opciones || []),
            { value: newOpcion.trim().toLowerCase().replace(/\s+/g, '_'), label: newOpcion.trim() }
        ])
        setNewOpcion('')
    }

    const removeOption = (campoIdx: number, optIdx: number) => {
        const opts = [...(currentPlantilla?.campos[campoIdx]?.opciones || [])]
        opts.splice(optIdx, 1)
        updateCampo(campoIdx, 'opciones', opts)
    }

    // ---- SAVE ALL ----
    const saveAll = async () => {
        setSaving(true)
        try {
            for (const plantilla of plantillas) {
                let plantillaId = plantilla.id

                if (plantillaId) {
                    // Update existing
                    const { error } = await supabase
                        .from('formulario_plantillas')
                        .update({
                            nombre: plantilla.nombre,
                            descripcion: plantilla.descripcion,
                            icono: plantilla.icono,
                            orden: plantilla.orden,
                            activo: plantilla.activo,
                        })
                        .eq('id', plantillaId)
                    if (error) throw error

                    // Delete old campos and re-insert
                    await supabase.from('formulario_campos').delete().eq('plantilla_id', plantillaId)
                } else {
                    // Insert new plantilla
                    const { data, error } = await supabase
                        .from('formulario_plantillas')
                        .insert({
                            prestacion_id: plantilla.prestacion_id,
                            nombre: plantilla.nombre,
                            descripcion: plantilla.descripcion,
                            icono: plantilla.icono,
                            orden: plantilla.orden,
                            activo: plantilla.activo,
                        })
                        .select('id')
                        .single()
                    if (error) throw error
                    plantillaId = data.id
                }

                // Insert all campos
                if (plantilla.campos.length > 0) {
                    const camposToInsert = plantilla.campos.map((c, idx) => ({
                        plantilla_id: plantillaId,
                        nombre_campo: c.nombre_campo,
                        etiqueta: c.etiqueta,
                        tipo_campo: c.tipo_campo,
                        placeholder: c.placeholder || null,
                        obligatorio: c.obligatorio,
                        orden: idx,
                        grupo: c.grupo || null,
                        ancho: c.ancho,
                        opciones: c.opciones,
                        validacion: c.validacion,
                        valor_default: c.valor_default || null,
                    }))
                    const { error } = await supabase.from('formulario_campos').insert(camposToInsert)
                    if (error) throw error
                }
            }

            showToast(`✅ ${plantillas.length} formulario(s) guardado(s) correctamente`, 'success')
            await loadPlantillas()
        } catch (err: any) {
            showToast('Error guardando: ' + err.message, 'error')
        }
        setSaving(false)
    }

    // ---- RENDER ----
    return (
        <div className="fb-overlay">
            <div className="fb-container">
                {/* ===== HEADER ===== */}
                <div className="fb-header">
                    <div className="fb-header-title">
                        <span className="fb-header-icon">🔧</span>
                        <div>
                            <h2>Constructor de Formularios</h2>
                            <p className="fb-subtitle">Prestación: <strong>{prestacionNombre}</strong></p>
                        </div>
                    </div>
                    <div className="fb-header-actions">
                        <button className="fb-btn fb-btn-save" onClick={saveAll} disabled={saving}>
                            {saving ? '⏳ Guardando...' : '💾 Guardar Todo'}
                        </button>
                        <button className="fb-btn fb-btn-close" onClick={onClose}>✕</button>
                    </div>
                </div>

                <div className="fb-body">
                    {/* ===== LEFT: PLANTILLAS LIST ===== */}
                    <div className="fb-sidebar">
                        <div className="fb-sidebar-header">
                            <h3>📂 Formularios</h3>
                            <button className="fb-btn fb-btn-add" onClick={addPlantilla}>+ Nuevo</button>
                        </div>

                        {loading ? (
                            <div className="fb-loading">Cargando...</div>
                        ) : plantillas.length === 0 ? (
                            <div className="fb-empty">
                                <span className="fb-empty-icon">📋</span>
                                <p>No hay formularios definidos</p>
                                <p className="fb-empty-hint">Crea tu primer formulario para esta prestación</p>
                                <button className="fb-btn fb-btn-primary" onClick={addPlantilla}>+ Crear Formulario</button>
                            </div>
                        ) : (
                            <div className="fb-plantilla-list">
                                {plantillas.map((p, idx) => (
                                    <div
                                        key={idx}
                                        className={`fb-plantilla-item ${idx === activePlantilla ? 'active' : ''}`}
                                        onClick={() => { setActivePlantilla(idx); setEditingCampo(null) }}
                                    >
                                        <span className="fb-plantilla-icon">{p.icono}</span>
                                        <div className="fb-plantilla-info">
                                            <strong>{p.nombre}</strong>
                                            <span className="fb-plantilla-count">{p.campos.length} campo{p.campos.length !== 1 ? 's' : ''}</span>
                                        </div>
                                        <button
                                            className="fb-btn-icon fb-btn-delete-sm"
                                            onClick={(e) => { e.stopPropagation(); deletePlantilla(idx) }}
                                            title="Eliminar formulario"
                                        >🗑️</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ===== CENTER: FORM CANVAS ===== */}
                    <div className="fb-canvas" ref={scrollRef}>
                        {currentPlantilla ? (
                            <>
                                {/* Plantilla metadata */}
                                <div className="fb-meta-bar">
                                    <div className="fb-meta-icon-picker">
                                        <button className="fb-icon-btn" onClick={() => {
                                            const icons = ICONOS_DISPONIBLES
                                            const current = icons.indexOf(currentPlantilla.icono)
                                            updatePlantillaMeta('icono', icons[(current + 1) % icons.length])
                                        }}>
                                            <span className="fb-big-icon">{currentPlantilla.icono}</span>
                                        </button>
                                    </div>
                                    <input
                                        className="fb-meta-name"
                                        value={currentPlantilla.nombre}
                                        onChange={e => updatePlantillaMeta('nombre', e.target.value)}
                                        placeholder="Nombre del formulario..."
                                    />
                                    <input
                                        className="fb-meta-desc"
                                        value={currentPlantilla.descripcion || ''}
                                        onChange={e => updatePlantillaMeta('descripcion', e.target.value)}
                                        placeholder="Descripción breve (opcional)..."
                                    />
                                </div>

                                {/* Campos list */}
                                {currentPlantilla.campos.length === 0 ? (
                                    <div className="fb-empty-canvas">
                                        <span className="fb-empty-canvas-icon">🧩</span>
                                        <p>Este formulario está vacío</p>
                                        <p className="fb-empty-hint">Agrega campos usando el botón de abajo</p>
                                    </div>
                                ) : (
                                    <div className="fb-campos-list">
                                        {currentPlantilla.campos.map((campo, idx) => (
                                            <div
                                                key={idx}
                                                className={`fb-campo-card ${editingCampo === idx ? 'editing' : ''} ${campo.tipo_campo === 'heading' ? 'is-heading' : ''}`}
                                                draggable
                                                onDragStart={() => setDragIdx(idx)}
                                                onDragOver={e => e.preventDefault()}
                                                onDrop={() => { if (dragIdx !== null && dragIdx !== idx) moveCampo(dragIdx, idx); setDragIdx(null) }}
                                            >
                                                <div className="fb-campo-header" onClick={() => setEditingCampo(editingCampo === idx ? null : idx)}>
                                                    <span className="fb-campo-drag">⠿</span>
                                                    <span className="fb-campo-type-icon">{TIPOS_CAMPO[campo.tipo_campo]?.icon || '❓'}</span>
                                                    <div className="fb-campo-label-info">
                                                        <strong>{campo.etiqueta || '(sin etiqueta)'}</strong>
                                                        <span className="fb-campo-type-badge">{TIPOS_CAMPO[campo.tipo_campo]?.label || campo.tipo_campo}</span>
                                                        {campo.obligatorio && <span className="fb-campo-required">*Obligatorio</span>}
                                                    </div>
                                                    <div className="fb-campo-width-badge">{campo.ancho === 'full' ? '▬▬▬' : campo.ancho === 'half' ? '▬▬' : '▬'}</div>
                                                    <div className="fb-campo-actions">
                                                        <button className="fb-btn-icon" onClick={(e) => { e.stopPropagation(); moveCampo(idx, idx - 1) }} title="Subir" disabled={idx === 0}>▲</button>
                                                        <button className="fb-btn-icon" onClick={(e) => { e.stopPropagation(); moveCampo(idx, idx + 1) }} title="Bajar" disabled={idx === currentPlantilla.campos.length - 1}>▼</button>
                                                        <button className="fb-btn-icon fb-btn-delete-sm" onClick={(e) => { e.stopPropagation(); deleteCampo(idx) }} title="Eliminar">✕</button>
                                                    </div>
                                                </div>

                                                {/* Expanded editor */}
                                                {editingCampo === idx && (
                                                    <div className="fb-campo-editor">
                                                        <div className="fb-editor-grid">
                                                            <div className="fb-editor-field">
                                                                <label>Etiqueta visible</label>
                                                                <input value={campo.etiqueta} onChange={e => updateCampo(idx, 'etiqueta', e.target.value)} placeholder="Ej: Pulso (bpm)" />
                                                            </div>
                                                            <div className="fb-editor-field">
                                                                <label>Clave interna</label>
                                                                <input value={campo.nombre_campo} onChange={e => updateCampo(idx, 'nombre_campo', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))} placeholder="Ej: pulso" />
                                                            </div>
                                                            <div className="fb-editor-field">
                                                                <label>Tipo de campo</label>
                                                                <select value={campo.tipo_campo} onChange={e => updateCampo(idx, 'tipo_campo', e.target.value)}>
                                                                    {Object.entries(TIPOS_CAMPO).map(([key, { label, icon }]) => (
                                                                        <option key={key} value={key}>{icon} {label}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div className="fb-editor-field">
                                                                <label>Ancho</label>
                                                                <select value={campo.ancho} onChange={e => updateCampo(idx, 'ancho', e.target.value)}>
                                                                    <option value="full">Completo (100%)</option>
                                                                    <option value="half">Mitad (50%)</option>
                                                                    <option value="third">Tercio (33%)</option>
                                                                </select>
                                                            </div>
                                                            {campo.tipo_campo !== 'heading' && campo.tipo_campo !== 'checkbox' && (
                                                                <div className="fb-editor-field">
                                                                    <label>Placeholder</label>
                                                                    <input value={campo.placeholder || ''} onChange={e => updateCampo(idx, 'placeholder', e.target.value)} placeholder="Texto de ayuda..." />
                                                                </div>
                                                            )}
                                                            <div className="fb-editor-field">
                                                                <label>Grupo</label>
                                                                <input value={campo.grupo || ''} onChange={e => updateCampo(idx, 'grupo', e.target.value)} placeholder="Ej: Presión Arterial" />
                                                            </div>
                                                        </div>

                                                        {/* Options editor for select/radio */}
                                                        {(campo.tipo_campo === 'select' || campo.tipo_campo === 'radio') && (
                                                            <div className="fb-options-editor">
                                                                <label>📋 Opciones</label>
                                                                <div className="fb-options-list">
                                                                    {(campo.opciones || []).map((opt: any, oi: number) => (
                                                                        <div key={oi} className="fb-option-item">
                                                                            <span className="fb-option-label">{opt.label}</span>
                                                                            <span className="fb-option-value">({opt.value})</span>
                                                                            <button className="fb-btn-icon fb-btn-delete-sm" onClick={() => removeOption(idx, oi)}>✕</button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div className="fb-option-add">
                                                                    <input
                                                                        value={newOpcion}
                                                                        onChange={e => setNewOpcion(e.target.value)}
                                                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption(idx) } }}
                                                                        placeholder="Nueva opción..."
                                                                    />
                                                                    <button className="fb-btn fb-btn-add-sm" onClick={() => addOption(idx)}>+ Agregar</button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Validation for number */}
                                                        {campo.tipo_campo === 'number' && (
                                                            <div className="fb-validation-editor">
                                                                <label>📏 Validación</label>
                                                                <div className="fb-validation-row">
                                                                    <div className="fb-editor-field">
                                                                        <label>Mínimo</label>
                                                                        <input type="number" value={campo.validacion.min ?? ''} onChange={e => updateCampo(idx, 'validacion', { ...campo.validacion, min: e.target.value ? Number(e.target.value) : undefined })} />
                                                                    </div>
                                                                    <div className="fb-editor-field">
                                                                        <label>Máximo</label>
                                                                        <input type="number" value={campo.validacion.max ?? ''} onChange={e => updateCampo(idx, 'validacion', { ...campo.validacion, max: e.target.value ? Number(e.target.value) : undefined })} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="fb-editor-toggles">
                                                            <label className="fb-toggle">
                                                                <input type="checkbox" checked={campo.obligatorio} onChange={e => updateCampo(idx, 'obligatorio', e.target.checked)} />
                                                                <span>Campo obligatorio</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add field button */}
                                <div className="fb-add-field-section">
                                    {showAddField ? (
                                        <div className="fb-field-type-grid">
                                            <h4>Selecciona el tipo de campo:</h4>
                                            <div className="fb-type-cards">
                                                {Object.entries(TIPOS_CAMPO).map(([key, { label, icon, desc }]) => (
                                                    <button key={key} className="fb-type-card" onClick={() => addCampo(key)}>
                                                        <span className="fb-type-card-icon">{icon}</span>
                                                        <strong>{label}</strong>
                                                        <span className="fb-type-card-desc">{desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <button className="fb-btn fb-btn-ghost" onClick={() => setShowAddField(false)}>Cancelar</button>
                                        </div>
                                    ) : (
                                        <button className="fb-btn fb-btn-add-field" onClick={() => setShowAddField(true)}>
                                            + Agregar Campo
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="fb-no-plantilla">
                                <span className="fb-empty-canvas-icon">👈</span>
                                <p>Selecciona o crea un formulario</p>
                            </div>
                        )}
                    </div>

                    {/* ===== RIGHT: PREVIEW ===== */}
                    {currentPlantilla && currentPlantilla.campos.length > 0 && (
                        <div className="fb-preview">
                            <h3>👁️ Vista Previa</h3>
                            <div className="fb-preview-form">
                                <div className="fb-preview-header">
                                    <span>{currentPlantilla.icono}</span> {currentPlantilla.nombre}
                                </div>
                                <div className="fb-preview-fields">
                                    {currentPlantilla.campos.map((campo, idx) => (
                                        <div key={idx} className={`fb-preview-field fb-preview-${campo.ancho}`}>
                                            {campo.tipo_campo === 'heading' ? (
                                                <h4 className="fb-preview-heading">{campo.etiqueta}</h4>
                                            ) : campo.tipo_campo === 'checkbox' ? (
                                                <label className="fb-preview-checkbox">
                                                    <input type="checkbox" disabled /> {campo.etiqueta}
                                                    {campo.obligatorio && <span className="fb-req">*</span>}
                                                </label>
                                            ) : campo.tipo_campo === 'select' ? (
                                                <>
                                                    <label>{campo.etiqueta}{campo.obligatorio && <span className="fb-req">*</span>}</label>
                                                    <select disabled>
                                                        <option>{campo.placeholder || 'Seleccionar...'}</option>
                                                        {(campo.opciones || []).map((o: any, i: number) => <option key={i}>{o.label}</option>)}
                                                    </select>
                                                </>
                                            ) : campo.tipo_campo === 'radio' ? (
                                                <>
                                                    <label>{campo.etiqueta}{campo.obligatorio && <span className="fb-req">*</span>}</label>
                                                    <div className="fb-preview-radios">
                                                        {(campo.opciones || []).map((o: any, i: number) => (
                                                            <label key={i} className="fb-preview-radio"><input type="radio" disabled name={`preview_${campo.nombre_campo}`} /> {o.label}</label>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : campo.tipo_campo === 'textarea' ? (
                                                <>
                                                    <label>{campo.etiqueta}{campo.obligatorio && <span className="fb-req">*</span>}</label>
                                                    <textarea disabled placeholder={campo.placeholder || ''} rows={3} />
                                                </>
                                            ) : campo.tipo_campo === 'photo' ? (
                                                <>
                                                    <label>{campo.etiqueta}{campo.obligatorio && <span className="fb-req">*</span>}</label>
                                                    <div className="fb-preview-photo">📸 Subir archivo</div>
                                                </>
                                            ) : campo.tipo_campo === 'calculated' ? (
                                                <>
                                                    <label>{campo.etiqueta}</label>
                                                    <div className="fb-preview-calc">🧮 Auto-calculado</div>
                                                </>
                                            ) : (
                                                <>
                                                    <label>{campo.etiqueta}{campo.obligatorio && <span className="fb-req">*</span>}</label>
                                                    <input type={campo.tipo_campo === 'number' ? 'number' : campo.tipo_campo === 'date' ? 'date' : 'text'} disabled placeholder={campo.placeholder || ''} />
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ===== STYLES ===== */}
            <style jsx>{`
                .fb-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fbFadeIn 0.2s ease; }
                @keyframes fbFadeIn { from { opacity: 0 } to { opacity: 1 } }
                .fb-container { background: #0a0a0a; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); width: 100%; max-width: 1400px; height: 90vh; display: flex; flex-direction: column; overflow: hidden; }

                /* HEADER */
                .fb-header { display: flex; justify-content: space-between; align-items: center; padding: 1.2rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); }
                .fb-header-title { display: flex; align-items: center; gap: 0.8rem; }
                .fb-header-icon { font-size: 1.8rem; }
                .fb-header h2 { font-size: 1.1rem; font-weight: 800; color: #fff; margin: 0; }
                .fb-subtitle { font-size: 0.78rem; color: rgba(255,255,255,0.45); margin: 0.15rem 0 0; }
                .fb-header-actions { display: flex; gap: 0.5rem; align-items: center; }

                /* BODY */
                .fb-body { display: flex; flex: 1; overflow: hidden; }

                /* SIDEBAR */
                .fb-sidebar { width: 250px; border-right: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; background: rgba(255,255,255,0.015); }
                .fb-sidebar-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.04); }
                .fb-sidebar-header h3 { margin: 0; font-size: 0.85rem; font-weight: 700; color: rgba(255,255,255,0.7); }

                .fb-plantilla-list { flex: 1; overflow-y: auto; padding: 0.5rem; }
                .fb-plantilla-item { display: flex; align-items: center; gap: 0.6rem; padding: 0.7rem 0.8rem; border-radius: 10px; cursor: pointer; transition: all 0.15s; border: 1px solid transparent; margin-bottom: 0.3rem; }
                .fb-plantilla-item:hover { background: rgba(255,255,255,0.04); }
                .fb-plantilla-item.active { background: rgba(99,102,241,0.12); border-color: rgba(99,102,241,0.3); }
                .fb-plantilla-icon { font-size: 1.3rem; }
                .fb-plantilla-info { flex: 1; min-width: 0; }
                .fb-plantilla-info strong { display: block; font-size: 0.82rem; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .fb-plantilla-count { font-size: 0.68rem; color: rgba(255,255,255,0.35); }

                /* CANVAS */
                .fb-canvas { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }

                .fb-meta-bar { display: flex; align-items: center; gap: 0.8rem; padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 14px; border: 1px solid rgba(255,255,255,0.06); }
                .fb-icon-btn { background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.25); border-radius: 12px; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; }
                .fb-icon-btn:hover { transform: scale(1.1); }
                .fb-big-icon { font-size: 1.5rem; }
                .fb-meta-name { flex: 1; background: transparent; border: none; color: #fff; font-size: 1.1rem; font-weight: 700; outline: none; padding: 0.4rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
                .fb-meta-name:focus { border-color: rgba(99,102,241,0.5); }
                .fb-meta-desc { flex: 1; background: transparent; border: none; color: rgba(255,255,255,0.5); font-size: 0.82rem; outline: none; padding: 0.4rem; border-bottom: 1px solid rgba(255,255,255,0.04); }

                /* EMPTY STATES */
                .fb-empty, .fb-empty-canvas, .fb-no-plantilla { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; text-align: center; color: rgba(255,255,255,0.4); gap: 0.5rem; flex: 1; }
                .fb-empty-icon, .fb-empty-canvas-icon { font-size: 3rem; opacity: 0.4; }
                .fb-empty-hint { font-size: 0.72rem; color: rgba(255,255,255,0.25); }
                .fb-loading { padding: 2rem; text-align: center; color: rgba(255,255,255,0.4); }

                /* CAMPOS */
                .fb-campos-list { display: flex; flex-direction: column; gap: 0.4rem; }
                .fb-campo-card { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; transition: all 0.15s; }
                .fb-campo-card:hover { border-color: rgba(255,255,255,0.1); }
                .fb-campo-card.editing { border-color: rgba(99,102,241,0.4); background: rgba(99,102,241,0.05); }
                .fb-campo-card.is-heading { border-left: 3px solid rgba(99,102,241,0.6); }

                .fb-campo-header { display: flex; align-items: center; gap: 0.5rem; padding: 0.7rem 0.8rem; cursor: pointer; }
                .fb-campo-drag { color: rgba(255,255,255,0.2); cursor: grab; font-size: 0.9rem; user-select: none; }
                .fb-campo-type-icon { font-size: 1.1rem; }
                .fb-campo-label-info { flex: 1; display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
                .fb-campo-label-info strong { font-size: 0.82rem; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .fb-campo-type-badge { font-size: 0.62rem; padding: 0.15rem 0.4rem; background: rgba(255,255,255,0.06); border-radius: 4px; color: rgba(255,255,255,0.4); white-space: nowrap; }
                .fb-campo-required { font-size: 0.6rem; color: #f43f5e; font-weight: 700; }
                .fb-campo-width-badge { font-size: 0.65rem; color: rgba(255,255,255,0.2); letter-spacing: 1px; }
                .fb-campo-actions { display: flex; gap: 0.2rem; }

                /* EDITOR */
                .fb-campo-editor { padding: 0.8rem; border-top: 1px solid rgba(255,255,255,0.04); animation: fbSlideDown 0.15s ease; }
                @keyframes fbSlideDown { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: translateY(0) } }
                .fb-editor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
                .fb-editor-field { display: flex; flex-direction: column; gap: 0.25rem; }
                .fb-editor-field label { font-size: 0.68rem; color: rgba(255,255,255,0.4); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
                .fb-editor-field input, .fb-editor-field select { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.5rem 0.7rem; color: #fff; font-size: 0.82rem; outline: none; transition: border-color 0.15s; }
                .fb-editor-field input:focus, .fb-editor-field select:focus { border-color: rgba(99,102,241,0.5); }

                /* OPTIONS EDITOR */
                .fb-options-editor { margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px solid rgba(255,255,255,0.04); }
                .fb-options-editor > label { font-size: 0.72rem; font-weight: 700; color: rgba(255,255,255,0.5); margin-bottom: 0.4rem; display: block; }
                .fb-options-list { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 0.4rem; }
                .fb-option-item { display: flex; align-items: center; gap: 0.3rem; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); border-radius: 6px; padding: 0.25rem 0.5rem; font-size: 0.75rem; }
                .fb-option-label { color: #fff; }
                .fb-option-value { color: rgba(255,255,255,0.3); font-size: 0.6rem; }
                .fb-option-add { display: flex; gap: 0.3rem; }
                .fb-option-add input { flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.4rem 0.6rem; color: #fff; font-size: 0.78rem; outline: none; }

                /* VALIDATION */
                .fb-validation-editor { margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px solid rgba(255,255,255,0.04); }
                .fb-validation-editor > label { font-size: 0.72rem; font-weight: 700; color: rgba(255,255,255,0.5); margin-bottom: 0.4rem; display: block; }
                .fb-validation-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }

                /* TOGGLES */
                .fb-editor-toggles { margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px solid rgba(255,255,255,0.04); }
                .fb-toggle { display: flex; align-items: center; gap: 0.5rem; font-size: 0.78rem; color: rgba(255,255,255,0.6); cursor: pointer; }
                .fb-toggle input { accent-color: #6366f1; }

                /* ADD FIELD */
                .fb-add-field-section { margin-top: 0.5rem; }
                .fb-field-type-grid h4 { font-size: 0.82rem; color: rgba(255,255,255,0.5); margin-bottom: 0.6rem; }
                .fb-type-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.5rem; margin-bottom: 0.8rem; }
                .fb-type-card { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; padding: 0.8rem 0.5rem; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; cursor: pointer; transition: all 0.15s; text-align: center; }
                .fb-type-card:hover { background: rgba(99,102,241,0.08); border-color: rgba(99,102,241,0.3); transform: translateY(-2px); }
                .fb-type-card-icon { font-size: 1.5rem; }
                .fb-type-card strong { font-size: 0.78rem; color: #fff; }
                .fb-type-card-desc { font-size: 0.62rem; color: rgba(255,255,255,0.3); line-height: 1.2; }

                /* PREVIEW */
                .fb-preview { width: 300px; border-left: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.01); overflow-y: auto; padding: 1rem; }
                .fb-preview h3 { font-size: 0.85rem; color: rgba(255,255,255,0.5); margin: 0 0 0.8rem; }
                .fb-preview-form { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; overflow: hidden; }
                .fb-preview-header { padding: 0.8rem 1rem; background: rgba(99,102,241,0.1); border-bottom: 1px solid rgba(99,102,241,0.15); font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; }
                .fb-preview-fields { padding: 0.8rem; display: flex; flex-wrap: wrap; gap: 0.6rem; }
                .fb-preview-full { width: 100%; }
                .fb-preview-half { width: calc(50% - 0.3rem); }
                .fb-preview-third { width: calc(33.33% - 0.4rem); }
                .fb-preview-field label { display: block; font-size: 0.68rem; color: rgba(255,255,255,0.5); font-weight: 600; margin-bottom: 0.2rem; }
                .fb-preview-field input, .fb-preview-field select, .fb-preview-field textarea { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.4rem 0.6rem; color: rgba(255,255,255,0.3); font-size: 0.75rem; }
                .fb-preview-heading { font-size: 0.82rem; color: rgba(99,102,241,0.8); margin: 0.5rem 0 0.2rem; padding-bottom: 0.3rem; border-bottom: 1px solid rgba(99,102,241,0.15); width: 100%; }
                .fb-preview-checkbox { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; color: rgba(255,255,255,0.5); }
                .fb-preview-radios { display: flex; flex-direction: column; gap: 0.2rem; }
                .fb-preview-radio { display: flex; align-items: center; gap: 0.3rem; font-size: 0.72rem; color: rgba(255,255,255,0.4); }
                .fb-preview-photo { padding: 1rem; border: 2px dashed rgba(255,255,255,0.08); border-radius: 10px; text-align: center; font-size: 0.78rem; color: rgba(255,255,255,0.3); }
                .fb-preview-calc { padding: 0.4rem 0.6rem; background: rgba(99,102,241,0.08); border-radius: 8px; font-size: 0.75rem; color: rgba(99,102,241,0.6); text-align: center; }
                .fb-req { color: #f43f5e; margin-left: 0.2rem; }

                /* BUTTONS */
                .fb-btn { padding: 0.5rem 1rem; border-radius: 10px; border: none; cursor: pointer; font-size: 0.78rem; font-weight: 600; transition: all 0.15s; }
                .fb-btn:hover { transform: translateY(-1px); }
                .fb-btn-save { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; }
                .fb-btn-save:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
                .fb-btn-close { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); font-size: 1rem; width: 36px; height: 36px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 10px; }
                .fb-btn-close:hover { background: rgba(244,63,94,0.15); color: #f43f5e; }
                .fb-btn-add, .fb-btn-add-sm { background: rgba(99,102,241,0.12); color: #818cf8; border: 1px solid rgba(99,102,241,0.2); }
                .fb-btn-add:hover, .fb-btn-add-sm:hover { background: rgba(99,102,241,0.2); }
                .fb-btn-add-sm { padding: 0.3rem 0.6rem; font-size: 0.7rem; border-radius: 6px; }
                .fb-btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 0.6rem 1.2rem; }
                .fb-btn-ghost { background: transparent; color: rgba(255,255,255,0.4); }
                .fb-btn-add-field { width: 100%; padding: 0.8rem; background: rgba(99,102,241,0.06); border: 2px dashed rgba(99,102,241,0.2); border-radius: 14px; color: #818cf8; font-size: 0.85rem; font-weight: 700; }
                .fb-btn-add-field:hover { background: rgba(99,102,241,0.12); border-color: rgba(99,102,241,0.35); }
                .fb-btn-icon { background: transparent; border: none; cursor: pointer; font-size: 0.75rem; padding: 0.2rem 0.35rem; border-radius: 6px; transition: all 0.15s; color: rgba(255,255,255,0.35); }
                .fb-btn-icon:hover { background: rgba(255,255,255,0.06); color: #fff; }
                .fb-btn-icon:disabled { opacity: 0.2; cursor: not-allowed; }
                .fb-btn-delete-sm { color: rgba(244,63,94,0.5) !important; }
                .fb-btn-delete-sm:hover { background: rgba(244,63,94,0.1) !important; color: #f43f5e !important; }

                /* RESPONSIVE */
                @media (max-width: 900px) {
                    .fb-sidebar { width: 200px; }
                    .fb-preview { display: none; }
                }
                @media (max-width: 600px) {
                    .fb-body { flex-direction: column; }
                    .fb-sidebar { width: 100%; height: auto; max-height: 150px; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.06); }
                }
            `}</style>
        </div>
    )
}
