"use client"

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { evaluarParametrosClinicos } from '@/lib/skills/evaluadorClinico'
import { formatearRUT } from '@/lib/skills/formateadorRUT'

export default function EvaluacionDetallePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [atencion, setAtencion] = useState<any>(null)
    const [examenes, setExamenes] = useState<any[]>([])
    const [veredicto, setVeredicto] = useState<any>(null)
    const [analizando, setAnalizando] = useState<Record<string, boolean>>({})

    // Form values for exams (id_examen -> { resultado, documento_url, observaciones })
    const [resultados, setResultados] = useState<Record<string, any>>({})
    const [currentRol, setCurrentRol] = useState<string>('Médico') // Simulador de rol

    useEffect(() => {
        fetchData()
    }, [id])

    async function fetchData() {
        setLoading(true)
        const { data: atData } = await supabase
            .from('atenciones')
            .select('*, trabajadores (*), empresas (*), cargos (*)')
            .eq('id', id)
            .single()

        const { data: exData } = await supabase
            .from('atencion_examenes')
            .select('*, prestaciones (*)')
            .eq('atencion_id', id)

        if (atData) setAtencion(atData)
        if (exData) {
            setExamenes(exData)
            const initialRes: Record<string, any> = {}
            exData.forEach(ex => {
                let parsedResultado = ex.resultado || ''
                let extraFields: any = {}

                // Si es Signos Vitales o Test Visual, intentamos parsear JSON
                const exNombre = ex.prestaciones.nombre.toLowerCase()
                if ((exNombre.includes('signos vitales') || exNombre.includes('test visual')) && ex.resultado?.startsWith('{')) {
                    try {
                        extraFields = JSON.parse(ex.resultado)
                        parsedResultado = extraFields.resultado // El resumen human-readable
                    } catch (e) {
                        console.error("Error parsing JSON result", e)
                    }
                }

                initialRes[ex.id] = {
                    resultado: parsedResultado || '',
                    documento_url: ex.documento_url || '',
                    observaciones: ex.observaciones || '',
                    ...extraFields
                }
            })
            setResultados(initialRes)
        }
        setLoading(false)
    }

    const updateExamField = (exId: string, field: string, val: string) => {
        setResultados(prev => ({
            ...prev,
            [exId]: { ...prev[exId], [field]: val }
        }))
    }

    const handleFileDrop = async (exId: string, files: FileList) => {
        const file = files[0]
        if (!file) return

        setAnalizando(prev => ({ ...prev, [exId]: true }))

        // 1. Simular subida a Storage
        const fakeUrl = `https://storage.prevenort.cl/docs/${id}/${exId}_${file.name}`
        updateExamField(exId, 'documento_url', fakeUrl)

        // 2. Simular Análisis IA Premium
        setTimeout(() => {
            const ex = examenes.find(e => e.id === exId)
            const exNombre = ex?.prestaciones.nombre.toLowerCase() || ""

            if (exNombre.includes("signos")) {
                updateExamField(exId, 'pa_sistolica', '118')
                updateExamField(exId, 'pa_diastolica', '76')
                updateExamField(exId, 'pulso', '72')
                updateExamField(exId, 'peso', '75')
                updateExamField(exId, 'talla', '1.75')
                updateExamField(exId, 'saturometria', '98')
                updateExamField(exId, 'resultado', 'Analizado: PA 118/76, Pulso 72, IMC 24.5')
            } else if (exNombre.includes("glicemia")) {
                updateExamField(exId, 'resultado', '95')
            } else if (exNombre.includes("psic")) {
                updateExamField(exId, 'resultado', 'Perfil Compatible')
            } else {
                updateExamField(exId, 'resultado', 'Normal')
            }

            setAnalizando(prev => ({ ...prev, [exId]: false }))
        }, 2000)
    }

    const procesarIA = () => {
        if (!atencion?.cargos) return

        const findVal = (name: string) => {
            const ex = examenes.find(e => e.prestaciones.nombre.toLowerCase().includes(name.toLowerCase()))
            return ex ? Number(resultados[ex.id]?.resultado) : 0
        }

        const paFull = examenes.find(e => e.prestaciones.nombre.toLowerCase().includes('presión arterial'))?.id
        let paSist = 0; let paDiast = 0
        if (paFull && resultados[paFull]?.resultado) {
            const parts = resultados[paFull].resultado.split('/')
            paSist = Number(parts[0])
            paDiast = Number(parts[1])
        }

        const parametros = [
            { nombre: 'Presión Arterial Sistólica', valor: paSist || findVal('Sistólica'), unidad: 'mmHg' },
            { nombre: 'Presión Arterial Diastólica', valor: paDiast || findVal('Diastólica'), unidad: 'mmHg' },
            { nombre: 'Glicemia', valor: findVal('Glicemia'), unidad: 'mg/dL' },
            { nombre: 'Peso', valor: findVal('Peso'), unidad: 'kg' },
            { nombre: 'Talla', valor: findVal('Talla'), unidad: 'm' }
        ]

        const limites = {
            nombre_cargo: atencion.cargos.nombre_cargo,
            es_gran_altura: atencion.cargos.es_gran_altura,
            pa_sistolica_max: atencion.cargos.limite_pa_sistolica,
            pa_diastolica_max: atencion.cargos.limite_pa_diastolica,
            glicemia_max: atencion.cargos.limite_glicemia_max
        }

        const resultado = evaluarParametrosClinicos(parametros, limites)
        setVeredicto(resultado)
    }

    async function guardarExamen(exId: string) {
        setSaving(true)
        const res = resultados[exId]
        const ex = examenes.find(e => e.id === exId)

        let finalResultado = res.resultado
        let extraFieldsToSave = { ...res }

        // Si es Signos Vitales, recalculamos el summary y preparamos JSON
        if (ex?.prestaciones.nombre.toLowerCase().includes('signos vitales')) {
            const imc = (res.peso && res.talla) ? (Number(res.peso) / (Number(res.talla) * Number(res.talla))).toFixed(1) : '--'
            const summary = `PA: ${res.pa_sistolica}/${res.pa_diastolica}, Pulso: ${res.pulso}, IMC: ${imc}, Sat: ${res.saturometria}%`
            finalResultado = JSON.stringify({
                ...extraFieldsToSave,
                resultado: summary
            })
        }

        // Si es Test Visual, recalculamos el summary
        if (ex?.prestaciones.nombre.toLowerCase().includes('test visual')) {
            const summary = `VA Lejos: ${res.lejos_od || '-'}/${res.lejos_oi || '-'} | VA Cerca: ${res.cerca_od || '-'}/${res.cerca_oi || '-'}`
            finalResultado = JSON.stringify({
                ...extraFieldsToSave,
                resultado: summary
            })
        }

        // Si es Estilo de Vida
        if (ex?.prestaciones.nombre.toLowerCase().includes('estilo de vida')) {
            const summary = `Fuma: ${res.fuma || 'NO'} (${res.fuma_cantidad || 0}), Alcohol: ${res.alcohol_frecuencia || 'N/A'}, Act. Física: ${res.actividad_horas || 0}h/sem`
            finalResultado = JSON.stringify({
                ...extraFieldsToSave,
                resultado: summary
            })
        }

        const { error } = await supabase
            .from('atencion_examenes')
            .update({
                resultado: finalResultado,
                documento_url: res.documento_url,
                observaciones: res.observaciones,
                estado: 'finalizado'
            })
            .eq('id', exId)

        if (error) alert('Error: ' + error.message)
        else fetchData()
        setSaving(false)
    }

    async function finalizarAtencionMedica() {
        if (!veredicto) return
        setSaving(true)
        try {
            await supabase
                .from('atenciones')
                .update({
                    estado_aptitud: veredicto.estado_sugerido,
                    ia_evaluacion: veredicto.justificacion,
                    estado_atencion: 'completado'
                })
                .eq('id', id)

            alert('Atención Médica Finalizada.')
            router.push('/lista-trabajo')
        } catch (err: any) {
            alert('Error: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="loading-container">Cargando Ficha Médica...</div>

    const examenesPorGrupo = examenes.reduce((acc: any, ex) => {
        const grupo = ex.prestaciones.grupo_examen || 'Otros'
        if (!acc[grupo]) acc[grupo] = []
        acc[grupo].push(ex)
        return acc
    }, {})

    const completedCount = examenes.filter(e => e.estado === 'finalizado').length
    const totalCount = examenes.length
    const isComplete = completedCount === totalCount

    return (
        <div className="evaluacion-detalle animate-fade">
            <header className="page-header">
                <button onClick={() => router.back()} className="back-link">← Volver a Lista</button>
                <div className="header-flex">
                    <div className="worker-core-info">
                        <div className="status-row">
                            <span className={`progress-badge ${isComplete ? 'done' : ''}`}>
                                {completedCount} de {totalCount} Prestaciones Realizadas
                            </span>
                        </div>
                        <h1>{atencion?.trabajadores?.nombre_completo}</h1>
                        <p className="subtitle">
                            RUT: <strong>{atencion?.trabajadores?.rut ? formatearRUT(atencion.trabajadores.rut) : ''}</strong> |
                            Empresa: <strong>{atencion?.empresas?.nombre}</strong>
                        </p>
                    </div>
                    <div className="cargo-badge">
                        <span className="label">Evaluación para</span>
                        <span className="value">{atencion?.cargos?.nombre_cargo}</span>
                    </div>
                </div>
            </header>

            <div className="evaluation-layout">
                <div className="exams-column">
                    <div className="role-selector card glass">
                        <label>Estación de Trabajo:</label>
                        <select value={currentRol} onChange={(e) => setCurrentRol(e.target.value)}>
                            <option value="Paramédico">Paramédico / Laboratorio</option>
                            <option value="Psicólogo">Psicología</option>
                            <option value="Médico">Médico Examinador</option>
                        </select>
                    </div>

                    {Object.entries(examenesPorGrupo).map(([grupo, items]: [string, any]) => (
                        <section key={grupo} className="group-section card glass">
                            <h3 className="group-title">{grupo}</h3>
                            <div className="exams-list">
                                {items.map((ex: any) => {
                                    const isEditable = ex.rol_asignado === currentRol
                                    const res = resultados[ex.id] || {}
                                    const isAnalizando = analizando[ex.id]

                                    return (
                                        <div key={ex.id} className={`exam-row ${ex.estado === 'finalizado' ? 'row-finalizado' : ''}`}>
                                            <div className="exam-info-header">
                                                <div className="name-box">
                                                    <label>{ex.prestaciones.nombre}</label>
                                                    <span className="rol-tag">{ex.rol_asignado}</span>
                                                </div>
                                                <div className="status-tag-mini">
                                                    {ex.estado === 'finalizado' ? '✅ COMPLETO' : '⏳ PENDIENTE'}
                                                </div>
                                            </div>

                                            <div className="exam-grid-container">
                                                <div className="dropzone-area">
                                                    {res.documento_url ? (
                                                        <div className="file-preview">
                                                            <div className="file-info-row">
                                                                <span className="file-icon">📄</span>
                                                                <span className="file-name">Documento_Escaneado.pdf</span>
                                                            </div>
                                                            <div className="file-actions">
                                                                <a href={res.documento_url} target="_blank" className="btn-view">Ver Archivo</a>
                                                                {isEditable && <button className="btn-reset" onClick={() => updateExamField(ex.id, 'documento_url', '')}>Cambiar</button>}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className={`dropzone ${isAnalizando ? 'analizando' : ''}`}
                                                            onDragOver={(e) => e.preventDefault()}
                                                            onDrop={(e) => { e.preventDefault(); handleFileDrop(ex.id, e.dataTransfer.files) }}
                                                            onClick={() => isEditable && document.getElementById(`file-${ex.id}`)?.click()}
                                                        >
                                                            {isAnalizando ? (
                                                                <div className="ai-analysing">
                                                                    <div className="scanner-line"></div>
                                                                    <span>Analizando Imagen con IA...</span>
                                                                </div>
                                                            ) : (
                                                                <div className="dz-content">
                                                                    <span className="icon">📄</span>
                                                                    <p>Arrastrar o <strong>Click</strong> para subir</p>
                                                                    <span className="formats">PDF, JPG, PNG</span>
                                                                    <input
                                                                        type="file"
                                                                        id={`file-${ex.id}`}
                                                                        hidden
                                                                        onChange={(e) => e.target.files && handleFileDrop(ex.id, e.target.files)}
                                                                        disabled={!isEditable}
                                                                        accept="image/*,application/pdf"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="data-entry-area">
                                                    {ex.prestaciones.nombre.toLowerCase().includes('signos vitales') ? (
                                                        <div className="vital-signs-table card glass">
                                                            <div className="vital-grid">
                                                                <div className="vital-item">
                                                                    <label>Pulso</label>
                                                                    <input type="number" value={res.pulso || ''} onChange={(e) => updateExamField(ex.id, 'pulso', e.target.value)} disabled={!isEditable && ex.estado === 'finalizado'} />
                                                                </div>
                                                                <div className="vital-item pa-group">
                                                                    <label>P.A (Sis/Dia)</label>
                                                                    <div className="flex-pa">
                                                                        <input type="number" placeholder="Sis" value={res.pa_sistolica || ''} onChange={(e) => updateExamField(ex.id, 'pa_sistolica', e.target.value)} disabled={!isEditable && ex.estado === 'finalizado'} />
                                                                        <span>/</span>
                                                                        <input type="number" placeholder="Dia" value={res.pa_diastolica || ''} onChange={(e) => updateExamField(ex.id, 'pa_diastolica', e.target.value)} disabled={!isEditable && ex.estado === 'finalizado'} />
                                                                    </div>
                                                                </div>
                                                                <div className="vital-item">
                                                                    <label>Peso (kg)</label>
                                                                    <input type="number" value={res.peso || ''} onChange={(e) => updateExamField(ex.id, 'peso', e.target.value)} disabled={!isEditable && ex.estado === 'finalizado'} />
                                                                </div>
                                                                <div className="vital-item">
                                                                    <label>Talla (m)</label>
                                                                    <input type="number" step="0.01" value={res.talla || ''} onChange={(e) => updateExamField(ex.id, 'talla', e.target.value)} disabled={!isEditable && ex.estado === 'finalizado'} />
                                                                </div>
                                                                <div className="vital-item">
                                                                    <label>Cintura</label>
                                                                    <input type="number" value={res.cintura || ''} onChange={(e) => updateExamField(ex.id, 'cintura', e.target.value)} disabled={!isEditable && ex.estado === 'finalizado'} />
                                                                </div>
                                                                <div className="vital-item">
                                                                    <label>Sat %</label>
                                                                    <input type="number" value={res.saturometria || ''} onChange={(e) => updateExamField(ex.id, 'saturometria', e.target.value)} disabled={!isEditable && ex.estado === 'finalizado'} />
                                                                </div>
                                                                <div className="vital-item highlight">
                                                                    <label>IMC</label>
                                                                    <div className="calc-val">
                                                                        {(res.peso && res.talla) ? (Number(res.peso) / (Number(res.talla) * Number(res.talla))).toFixed(1) : '--'}
                                                                    </div>
                                                                </div>
                                                                <div className="vital-item">
                                                                    <label>Pulso Post</label>
                                                                    <input type="number" value={res.pulso_post || ''} onChange={(e) => updateExamField(ex.id, 'pulso_post', e.target.value)} disabled={!isEditable && ex.estado === 'finalizado'} />
                                                                </div>
                                                                <div className="vital-item">
                                                                    <label>Pulso Recup</label>
                                                                    <input type="number" value={res.pulso_recuperacion || ''} onChange={(e) => updateExamField(ex.id, 'pulso_recuperacion', e.target.value)} disabled={!isEditable && ex.estado === 'finalizado'} />
                                                                </div>
                                                                <div className="vital-item highlight">
                                                                    <label>Test Ruffier</label>
                                                                    <div className="calc-val">
                                                                        {(res.pulso && res.pulso_post && res.pulso_recuperacion) ?
                                                                            ((Number(res.pulso) + Number(res.pulso_post) + Number(res.pulso_recuperacion) - 200) / 10).toFixed(1) : '--'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : ex.prestaciones.nombre.toLowerCase().includes('test visual') ? (
                                                        <div className="visual-test-table card glass">
                                                            <div className="vt-section">
                                                                <label className="vt-title">I. Uso de Lentes</label>
                                                                <div className="vt-lentes-grid">
                                                                    {['No usa', 'Visión Lejos', 'Visión Cerca', 'Bifocales', 'Monocular OD', 'Monocular OI', 'Contacto'].map(opt => (
                                                                        <label key={opt} className="vt-check">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={res.lentes === opt}
                                                                                onChange={() => updateExamField(ex.id, 'lentes', opt)}
                                                                                disabled={!isEditable && ex.estado === 'finalizado'}
                                                                            />
                                                                            <span>{opt}</span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="vt-section mt">
                                                                <label className="vt-title">II. Agudeza Visual</label>
                                                                <div className="vt-acuity-grid">
                                                                    <div className="vta-header">
                                                                        <span>Tipo</span><span>OD</span><span>OI</span><span>Ambos</span><span>Foria</span>
                                                                    </div>
                                                                    <div className="vta-row">
                                                                        <span className="vta-label">Lejos</span>
                                                                        <input type="text" placeholder="OD" value={res.lejos_od || ''} onChange={(e) => updateExamField(ex.id, 'lejos_od', e.target.value)} disabled={!isEditable && ex.estado === 'finalizado'} />
                                                                        <input type="text" placeholder="OI" value={res.lejos_oi || ''} onChange={(e) => updateExamField(ex.id, 'lejos_oi', e.target.value)} disabled={!isEditable && ex.estado === 'finalizado'} />
                                                                        <input type="text" placeholder="Ambos" value={res.lejos_ambos || ''} onChange={(e) => updateExamField(ex.id, 'lejos_ambos', e.target.value)} disabled={!isEditable && ex.estado === 'finalizado'} />
                                                                        <input type="text" placeholder="Foria" value={res.lejos_foria || ''} onChange={(e) => updateExamField(ex.id, 'lejos_foria', e.target.value)} disabled={!isEditable && ex.estado === 'finalizado'} />
                                                                    </div>
                                                                    <div className="vta-row">
                                                                        <span className="vta-label">Cerca</span>
                                                                        <input type="text" placeholder="OD" value={res.cerca_od || ''} onChange={(e) => updateExamField(ex.id, 'cerca_od', e.target.value)} disabled={!isEditable && ex.estado === 'finalizado'} />
                                                                        <input type="text" placeholder="OI" value={res.cerca_oi || ''} onChange={(e) => updateExamField(ex.id, 'cerca_oi', e.target.value)} disabled={!isEditable && ex.estado === 'finalizado'} />
                                                                        <input type="text" placeholder="Ambos" value={res.cerca_ambos || ''} onChange={(e) => updateExamField(ex.id, 'cerca_ambos', e.target.value)} disabled={!isEditable && ex.estado === 'finalizado'} />
                                                                        <input type="text" placeholder="Foria" value={res.cerca_foria || ''} onChange={(e) => updateExamField(ex.id, 'cerca_foria', e.target.value)} disabled={!isEditable && ex.estado === 'finalizado'} />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="vt-section mt">
                                                                <label className="vt-title">III. Profundidad & Flechas</label>
                                                                <div className="vt-misc-grid">
                                                                    <div className="vt-misc-item">
                                                                        <label>Mariposa</label>
                                                                        <div className="flex-si-no">
                                                                            <button className={res.mariposa === 'SI' ? 'active' : ''} onClick={() => updateExamField(ex.id, 'mariposa', 'SI')} disabled={!isEditable && ex.estado === 'finalizado'}>SI</button>
                                                                            <button className={res.mariposa === 'NO' ? 'active' : ''} onClick={() => updateExamField(ex.id, 'mariposa', 'NO')} disabled={!isEditable && ex.estado === 'finalizado'}>NO</button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="vt-misc-item flechas-block">
                                                                        <label>Flechas</label>
                                                                        <div className="number-line">
                                                                            <div className="number-line-track">
                                                                                <div className="number-line-fill" style={{ width: res.flechas ? `${((Number(res.flechas) - 1) / 8) * 100}%` : '0%' }}></div>
                                                                            </div>
                                                                            <div className="number-line-points">
                                                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                                                                    <button
                                                                                        key={n}
                                                                                        className={`nl-point ${Number(res.flechas) === n ? 'selected' : ''} ${Number(res.flechas) >= n ? 'filled' : ''}`}
                                                                                        onClick={() => updateExamField(ex.id, 'flechas', String(n))}
                                                                                        disabled={!isEditable && ex.estado === 'finalizado'}
                                                                                    >
                                                                                        <span className="nl-dot"></span>
                                                                                        <span className="nl-label">{n}</span>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="vt-section mt">
                                                                <label className="vt-title">IV. Animales & Colores</label>
                                                                <div className="vt-animal-color-flex">
                                                                    <div className="vt-animales-box">
                                                                        <label>Animales (A-C / 1-5)</label>
                                                                        <div className="vt-color-table">
                                                                            <div className="vt-color-header animal-header">
                                                                                <span>#</span>
                                                                                {[1, 2, 3, 4, 5].map(n => <span key={n}>{n}</span>)}
                                                                            </div>
                                                                            {['A', 'B', 'C'].map(row => (
                                                                                <div key={row} className="vt-color-row animal-row">
                                                                                    <span className="row-num">{row}</span>
                                                                                    {[1, 2, 3, 4, 5].map(col => (
                                                                                        <div key={col} className="check-cell">
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={res[`animal_${row}${col}`] === 'true'}
                                                                                                onChange={(e) => updateExamField(ex.id, `animal_${row}${col}`, e.target.checked ? 'true' : 'false')}
                                                                                                disabled={!isEditable && ex.estado === 'finalizado'}
                                                                                            />
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div className="vt-colores-box">
                                                                        <label>Discriminación de Colores</label>
                                                                        <div className="vt-color-table">
                                                                            <div className="vt-color-header">
                                                                                <span>#</span>
                                                                                <span>SI</span>
                                                                                <span>NO</span>
                                                                            </div>
                                                                            {[1, 2, 3, 4, 5].map(n => (
                                                                                <div key={n} className="vt-color-row">
                                                                                    <span className="row-num">{n}</span>
                                                                                    <div className="check-cell">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={res[`color_${n}_si`] === 'true'}
                                                                                            onChange={(e) => updateExamField(ex.id, `color_${n}_si`, e.target.checked ? 'true' : 'false')}
                                                                                            disabled={!isEditable && ex.estado === 'finalizado'}
                                                                                        />
                                                                                    </div>
                                                                                    <div className="check-cell">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={res[`color_${n}_no`] === 'true'}
                                                                                            onChange={(e) => updateExamField(ex.id, `color_${n}_no`, e.target.checked ? 'true' : 'false')}
                                                                                            disabled={!isEditable && ex.estado === 'finalizado'}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : ex.prestaciones.nombre.toLowerCase().includes('estilo de vida') ? (
                                                        <div className="lifestyle-table card glass">
                                                            <div className="ls-grid">
                                                                <div className="ls-item group-horizontal">
                                                                    <div className="ls-field">
                                                                        <label>¿Fuma?</label>
                                                                        <div className="flex-si-no">
                                                                            <button className={res.fuma === 'SI' ? 'active' : ''} onClick={() => updateExamField(ex.id, 'fuma', 'SI')} disabled={!isEditable && ex.estado === 'finalizado'}>SI</button>
                                                                            <button className={res.fuma === 'NO' ? 'active' : ''} onClick={() => updateExamField(ex.id, 'fuma', 'NO')} disabled={!isEditable && ex.estado === 'finalizado'}>NO</button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="ls-field">
                                                                        <label>Cigarrillos/Día</label>
                                                                        <input type="number" placeholder="0" value={res.fuma_cantidad || ''} onChange={(e) => updateExamField(ex.id, 'fuma_cantidad', e.target.value)} disabled={!isEditable && ex.estado === 'finalizado'} />
                                                                    </div>
                                                                </div>

                                                                <div className="ls-item">
                                                                    <label>Consumo Alcohol</label>
                                                                    <div className="ls-select-group">
                                                                        {['Nunca', 'Social', 'Semanal', 'Diario'].map(opt => (
                                                                            <button key={opt} className={res.alcohol_frecuencia === opt ? 'active' : ''} onClick={() => updateExamField(ex.id, 'alcohol_frecuencia', opt)} disabled={!isEditable && ex.estado === 'finalizado'}>{opt}</button>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <div className="ls-item group-horizontal">
                                                                    <div className="ls-field">
                                                                        <label>¿Actividad Física?</label>
                                                                        <div className="flex-si-no">
                                                                            <button className={res.actividad_fisica === 'SI' ? 'active' : ''} onClick={() => updateExamField(ex.id, 'actividad_fisica', 'SI')} disabled={!isEditable && ex.estado === 'finalizado'}>SI</button>
                                                                            <button className={res.actividad_fisica === 'NO' ? 'active' : ''} onClick={() => updateExamField(ex.id, 'actividad_fisica', 'NO')} disabled={!isEditable && ex.estado === 'finalizado'}>NO</button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="ls-field">
                                                                        <label>Horas/Semana</label>
                                                                        <input type="number" placeholder="0" value={res.actividad_horas || ''} onChange={(e) => updateExamField(ex.id, 'actividad_horas', e.target.value)} disabled={!isEditable && ex.estado === 'finalizado'} />
                                                                    </div>
                                                                </div>

                                                                <div className="ls-item">
                                                                    <label>Calidad de Sueño (Horas)</label>
                                                                    <input type="number" placeholder="hrs" value={res.sueno_horas || ''} onChange={(e) => updateExamField(ex.id, 'sueno_horas', e.target.value)} disabled={!isEditable && ex.estado === 'finalizado'} />
                                                                </div>

                                                                <div className="ls-item">
                                                                    <label>Nivel de Estrés Percibido</label>
                                                                    <div className="ls-select-group">
                                                                        {['Bajo', 'Medio', 'Alto'].map(opt => (
                                                                            <button key={opt} className={res.estres_nivel === opt ? 'active' : ''} onClick={() => updateExamField(ex.id, 'estres_nivel', opt)} disabled={!isEditable && ex.estado === 'finalizado'}>{opt}</button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="input-group">
                                                                <label>Resultado / Hallazgo</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Ingrese valor manual o detectado..."
                                                                    value={res.resultado || ''}
                                                                    onChange={(e) => updateExamField(ex.id, 'resultado', e.target.value)}
                                                                    disabled={!isEditable && ex.estado === 'finalizado'}
                                                                />
                                                            </div>
                                                            <div className="input-group">
                                                                <label>Observaciones</label>
                                                                <textarea
                                                                    placeholder="..."
                                                                    value={res.observaciones || ''}
                                                                    onChange={(e) => updateExamField(ex.id, 'observaciones', e.target.value)}
                                                                    disabled={!isEditable && ex.estado === 'finalizado'}
                                                                />
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="save-action-area">
                                                    {isEditable && ex.estado !== 'finalizado' && (
                                                        <button
                                                            className="btn-save-row"
                                                            onClick={() => guardarExamen(ex.id)}
                                                            disabled={!res.resultado && !res.documento_url && !res.pulso && !res.lejos_od && !res.fuma}
                                                        >
                                                            Guardar
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </section>
                    ))}

                    <div className="form-actions-footer card glass">
                        <div className="ready-checks">
                            <h4>Veredicto Final del Médico</h4>
                            <p className={isComplete ? 'text-success' : 'text-warning'}>
                                {isComplete ? '✅ Batería de exámenes lista para cierre.' : '⚠ Pendiente completar todos los exámenes.'}
                            </p>
                        </div>
                        <div className="footer-btns">
                            <button className="btn btn-secondary" onClick={procesarIA} disabled={!isComplete}>
                                Analizar con IA 🤖
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={finalizarAtencionMedica}
                                disabled={saving || !isComplete || currentRol !== 'Médico'}
                            >
                                {saving ? 'Cerrando...' : 'Emitir Alta y Cerrar Ficha'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="ai-status-column">
                    {veredicto ? (
                        <div className={`ai-veredict-card animate-slide-in ${veredicto.estado_sugerido}`}>
                            <div className="ai-card-header">
                                <span className="ai-brain-icon">🧠</span>
                                <h3>Veredicto IA</h3>
                            </div>
                            <div className="veredict-status">
                                {veredicto.estado_sugerido.toUpperCase().replace('_', ' ')}
                            </div>
                            <p className="ai-justification">{veredicto.justificacion}</p>
                        </div>
                    ) : (
                        <div className="ai-placeholder-card card glass">
                            <span className="icon">🛡</span>
                            <p>El asistente IA analizará la aptitud una vez que todos los componentes de la batería hayan sido ingresados por sus respectivos especialistas.</p>
                        </div>
                    )}
                </div>
            </div >

            <style jsx>{`
                .evaluacion-detalle { padding: 2rem; max-width: 1400px; margin: 0 auto; color: #fff; }
                .back-link { background: none; border: none; color: var(--brand-primary); cursor: pointer; font-weight: 800; margin-bottom: 2rem; font-size: 0.9rem; }
                .header-flex { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 3rem; }
                h1 { font-size: 3rem; font-weight: 950; margin: 0; letter-spacing: -0.02em; }
                .subtitle { color: var(--text-muted); margin-top: 0.5rem; font-size: 1.1rem; }
                
                .role-selector { padding: 1.5rem; margin-bottom: 2rem; display: flex; align-items: center; gap: 1.5rem; }
                .role-selector label { font-weight: 800; color: var(--brand-primary); text-transform: uppercase; font-size: 0.75rem; }
                .role-selector select { background: #1e293b; color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 0.8rem 1.2rem; border-radius: 12px; font-weight: 700; outline: none; }

                .group-section { margin-bottom: 2.5rem; padding: 2rem; border-radius: 24px; }
                .group-title { margin-bottom: 2rem; font-size: 1.1rem; text-transform: uppercase; font-weight: 900; color: var(--brand-primary); border-bottom: 1px solid rgba(255,107,44,0.1); padding-bottom: 1rem; }

                .exams-list { display: flex; flex-direction: column; gap: 1.5rem; }
                .exam-row { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 1.5rem; }
                .row-finalizado { border-left: 5px solid #10b981; }

                .exam-info-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
                .name-box label { font-size: 1.2rem; font-weight: 800; display: block; margin-bottom: 0.3rem; }
                .rol-tag { font-size: 0.6rem; background: rgba(255,107,44,0.15); color: var(--brand-primary); padding: 0.2rem 0.6rem; border-radius: 6px; font-weight: 900; text-transform: uppercase; }

                .exam-grid-container { display: grid; grid-template-columns: 320px 1fr 100px; gap: 2rem; align-items: start; }
                
                .dropzone { 
                    border: 2px dashed rgba(255,255,255,0.1); border-radius: 16px; padding: 2rem 1rem; text-align: center; cursor: pointer; transition: 0.3s;
                    background: rgba(255,255,255,0.01); height: 160px; display: flex; align-items: center; justify-content: center;
                }
                .dropzone:hover { border-color: var(--brand-primary); background: rgba(255,107,44,0.02); }
                .dropzone.analizando { border-color: #3b82f6; overflow: hidden; position: relative; }
                .dz-content .icon { font-size: 1.5rem; margin-bottom: 0.5rem; display: block; }
                .dz-content p { font-size: 0.8rem; margin: 0.5rem 0; color: var(--text-muted); }
                .dz-content .formats { font-size: 0.6rem; opacity: 0.4; text-transform: uppercase; letter-spacing: 0.1em; }

                .ai-analysing { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
                .scanner-line { width: 100%; height: 2px; background: #3b82f6; position: absolute; top: 0; left: 0; animation: scan 2s linear infinite; box-shadow: 0 0 15px #3b82f6; }
                @keyframes scan { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }

                .file-preview { background: #0f172a; border-radius: 12px; padding: 1.5rem; border: 1px solid rgba(255,255,255,0.1); height: 160px; display: flex; flex-direction: column; justify-content: space-between; }
                .file-info-row { display: flex; align-items: center; gap: 0.75rem; }
                .file-icon { font-size: 1.5rem; }
                .file-name { font-size: 0.8rem; font-weight: 600; }
                .file-actions { display: flex; gap: 0.5rem; }
                .btn-view { flex: 1; background: #1e293b; color: #fff; text-align: center; padding: 0.6rem; border-radius: 8px; font-size: 0.75rem; text-decoration: none; border: 1px solid rgba(255,255,255,0.1); }
                .btn-reset { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); padding: 0.6rem; border-radius: 8px; font-size: 0.75rem; cursor: pointer; }

                .data-entry-area { display: flex; flex-direction: column; gap: 1rem; }
                .input-group label { font-size: 0.75rem; font-weight: 800; color:rgba(255,255,255,0.5); text-transform: uppercase; margin-bottom: 0.5rem; display: block; }
                .input-group input, .input-group textarea { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; padding: 0.8rem; width: 100%; outline: none; }
                .input-group textarea { height: 75px; resize: none; }

                .btn-save-row { background: var(--brand-primary); color: #fff; border: none; padding: 1rem; border-radius: 12px; font-weight: 800; cursor: pointer; font-size: 0.8rem; margin-top: 1.6rem; }
                .btn-save-row:disabled { opacity: 0.3; cursor: not-allowed; }

                .evaluation-layout { display: grid; grid-template-columns: 1fr 380px; gap: 3rem; }
                .ai-status-column { position: sticky; top: 2rem; height: fit-content; display: flex; flex-direction: column; gap: 2rem; }
                
                .ai-veredict-card { padding: 2.5rem; border-radius: 32px; border: 2px solid; }
                .ai-veredict-card.apto { background: linear-gradient(135deg, #064e3b, #0d0d0d); border-color: #10b981; }
                .ai-veredict-card.remediacion { background: linear-gradient(135deg, #451a03, #0d0d0d); border-color: #f59e0b; }
                .ai-veredict-card.no_apto { background: linear-gradient(135deg, #450a0a, #0d0d0d); border-color: #ef4444; }
                
                .veredict-status { font-size: 2.5rem; font-weight: 950; margin: 1rem 0; letter-spacing: -0.03em; }
                .ai-justification { line-height: 1.7; opacity: 0.8; font-size: 1rem; }

                .form-actions-footer { padding: 2.5rem; border-radius: 32px; margin-top: 4rem; display: flex; justify-content: space-between; align-items: center; }
                .footer-btns { display: flex; gap: 1rem; }
                .btn { padding: 1.2rem 2.5rem; border-radius: 16px; font-weight: 900; border: none; cursor: pointer; transition: 0.3s; }
                .btn-primary { background: #fff; color: #000; }
                .btn-secondary { background: rgba(255,255,255,0.1); color: #fff; }
                .btn-primary:disabled { opacity: 0.2; }

                /* Vital Signs Specialized Table */
                .vital-signs-table { background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 16px; border: 1px solid rgba(255,107,44,0.1); width: 100%; }
                .vital-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 1rem; }
                .vital-item { display: flex; flex-direction: column; gap: 0.5rem; }
                .vital-item label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; white-space: nowrap; }
                .vital-item input { background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.5rem; color: #fff; font-size: 0.9rem; font-weight: 700; text-align: center; width: 100%; }
                .vital-item input:focus { border-color: var(--brand-primary); outline: none; }
                
                .pa-group { grid-column: span 2; }
                .flex-pa { display: flex; align-items: center; gap: 0.4rem; }
                .flex-pa span { opacity: 0.5; font-weight: 900; }
                
                .vital-item.highlight { background: rgba(255,107,44,0.05); padding: 0.5rem; border-radius: 10px; border: 1px solid rgba(255,107,44,0.2); }
                .calc-val { font-size: 1.1rem; font-weight: 950; color: var(--brand-primary); text-align: center; padding: 0.3rem; }

                /* Visual Test Styles */
                .visual-test-table { background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 16px; border: 1px solid rgba(255,107,44,0.1); width: 100%; font-family: 'Inter', sans-serif; }
                .vt-section { display: flex; flex-direction: column; gap: 0.8rem; }
                .vt-title { font-size: 0.7rem; font-weight: 900; color: var(--brand-primary); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.4rem; }
                .vt-lentes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.5rem; }
                .vt-check { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; cursor: pointer; color: #fff; }
                .vt-check input { width: 14px; height: 14px; accent-color: var(--brand-primary); }
                
                .vt-acuity-grid { display: flex; flex-direction: column; gap: 0.4rem; }
                .vta-header { display: grid; grid-template-columns: 80px 1fr 1fr 1fr 1fr; gap: 0.5rem; font-size: 0.6rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; text-align: center; }
                .vta-row { display: grid; grid-template-columns: 80px 1fr 1fr 1fr 1fr; gap: 0.5rem; align-items: center; }
                .vta-label { font-size: 0.75rem; font-weight: 800; color: #fff; }
                .vta-row input { background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 0.4rem; color: #fff; font-size: 0.8rem; text-align: center; width: 100%; outline: none; }
                .vta-row input:focus { border-color: var(--brand-primary); }

                .vt-misc-grid { display: grid; grid-template-columns: 140px 1fr; gap: 1.5rem; }
                .vt-misc-item label { font-size: 0.6rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.4rem; display: block; }
                
                .vt-mini-inputs { display: grid; grid-template-columns: repeat(9, 1fr); gap: 0.3rem; }
                .vt-tiny { background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 0.3rem; color: #fff; font-size: 0.7rem; text-align: center; width: 100%; outline: none; }
                
                .flex-si-no { display: flex; gap: 0.3rem; }
                .flex-si-no button { flex: 1; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); color: #fff; padding: 0.4rem; border-radius: 6px; font-size: 0.7rem; font-weight: 800; cursor: pointer; transition: 0.2s; }
                .flex-si-no button.active { background: var(--brand-primary); border-color: var(--brand-primary); }

                /* Number Line (Recta Numérica) */
                .number-line { position: relative; padding: 1.2rem 0.5rem 0.5rem; }
                .number-line-track { position: absolute; top: 1.55rem; left: 0.5rem; right: 0.5rem; height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; }
                .number-line-fill { height: 100%; background: var(--brand-primary); border-radius: 2px; transition: width 0.25s ease; }
                .number-line-points { display: flex; justify-content: space-between; position: relative; z-index: 1; }
                .nl-point { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; background: none; border: none; cursor: pointer; padding: 0; transition: 0.2s; }
                .nl-point:disabled { cursor: not-allowed; opacity: 0.4; }
                .nl-dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); background: #0f172a; transition: 0.25s; }
                .nl-point.filled .nl-dot { border-color: var(--brand-primary); background: rgba(255,107,44,0.15); }
                .nl-point.selected .nl-dot { border-color: var(--brand-primary); background: var(--brand-primary); box-shadow: 0 0 10px rgba(255,107,44,0.4); transform: scale(1.3); }
                .nl-label { font-size: 0.7rem; font-weight: 800; color: rgba(255,255,255,0.35); transition: 0.2s; }
                .nl-point.selected .nl-label { color: var(--brand-primary); font-size: 0.8rem; }
                .nl-point.filled .nl-label { color: rgba(255,255,255,0.6); }
                .nl-point:hover:not(:disabled) .nl-dot { border-color: var(--brand-primary); transform: scale(1.15); }
                
                .vt-animal-color-flex { display: flex; gap: 2rem; }
                .vt-animales-box, .vt-colores-box { flex: 1; }
                .vt-animales-box label, .vt-colores-box label { font-size: 0.6rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.4rem; display: block; }
                
                .vt-animal-rows { display: flex; flex-direction: column; gap: 0.3rem; }
                .vt-a-row { display: flex; align-items: center; gap: 0.4rem; }
                .row-id { font-size: 0.7rem; font-weight: 900; width: 12px; opacity: 0.5; }
                .vt-tiny-sq { background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 0.2rem; color: #fff; font-size: 0.7rem; text-align: center; width: 25px; outline: none; }
                
                .vt-col-grid { display: flex; gap: 0.5rem; }
                .vt-col-item { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; }
                .vt-col-item span { font-size: 0.6rem; opacity: 0.5; font-weight: 900; }
                .mini-btn button { padding: 0.2rem 0.4rem; font-size: 0.6rem; min-width: 20px; }

                /* Color Discrimination Table */
                .vt-color-table { background: rgba(255,107,44,0.03); border: 1px solid rgba(255,107,44,0.1); border-radius: 12px; overflow: hidden; }
                .vt-color-header { display: grid; grid-template-columns: 40px 1fr 1fr; background: rgba(255,107,44,0.1); padding: 0.5rem; border-bottom: 1px solid rgba(255,107,44,0.2); }
                .vt-color-header span { font-size: 0.65rem; font-weight: 900; color: var(--brand-primary); text-align: center; }
                .vt-color-row { display: grid; grid-template-columns: 40px 1fr 1fr; border-bottom: 1px solid rgba(255,107,44,0.1); align-items: center; }
                .vt-color-row:last-child { border-bottom: none; }
                .row-num { font-size: 0.75rem; font-weight: 800; color: #fff; text-align: center; background: rgba(255,255,255,0.02); height: 100%; display: flex; align-items: center; justify-content: center; border-right: 1px solid rgba(255,107,44,0.1); }
                .check-cell { display: flex; justify-content: center; align-items: center; padding: 0.6rem; border-right: 1px solid rgba(255,107,44,0.05); }
                .check-cell:last-child { border-right: none; }
                .check-cell input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; accent-color: var(--brand-primary); appearance: none; -webkit-appearance: none; background: #0f172a; border: 2px solid rgba(255,255,255,0.15); border-radius: 4px; transition: 0.2s; position: relative; }
                .check-cell input[type="checkbox"]:checked { background: var(--brand-primary); border-color: var(--brand-primary); }
                .check-cell input[type="checkbox"]:checked::after { content: '✓'; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); color: #fff; font-size: 12px; font-weight: 900; }
                .check-cell input[type="checkbox"]:hover:not(:disabled) { border-color: var(--brand-primary); }

                /* Animal Table (6 columns: label + 5 checks) */
                .animal-header { grid-template-columns: 40px repeat(5, 1fr); }
                .animal-row { grid-template-columns: 40px repeat(5, 1fr); }

                .mt { margin-top: 1rem; }

                /* Lifestyle / Estilo de Vida Styles */
                .lifestyle-table { background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 16px; border: 1px solid rgba(255,107,44,0.1); width: 100%; }
                .ls-grid { display: flex; flex-direction: column; gap: 1.2rem; }
                .ls-item { display: flex; flex-direction: column; gap: 0.5rem; }
                .group-horizontal { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .ls-field label, .ls-item label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
                .ls-item input { background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.5rem; color: #fff; font-size: 0.9rem; font-weight: 700; width: 100%; outline: none; }
                .ls-item input:focus { border-color: var(--brand-primary); }
                
                .ls-select-group { display: flex; gap: 0.4rem; }
                .ls-select-group button { flex: 1; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.5rem; border-radius: 8px; font-size: 0.7rem; font-weight: 800; cursor: pointer; transition: 0.2s; }
                .ls-select-group button.active { background: var(--brand-primary); border-color: var(--brand-primary); }

                @media (max-width: 1200px) {
                    .exam-grid-container { grid-template-columns: 1fr; }
                    .dropzone-area { max-width: 100%; }
                    .evaluation-layout { grid-template-columns: 1fr; }
                    .ai-status-column { position: static; }
                }
            `}</style>
        </div >
    )
}
