"use client"

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { evaluarParametrosClinicos } from '@/lib/skills/evaluadorClinico'
import { formatearRUT } from '@/lib/skills/formateadorRUT'
import { getFormComponent } from './formularios'

export default function EvaluacionDetallePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const searchParams = useSearchParams()
    const stationParam = searchParams.get('station')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [atencion, setAtencion] = useState<any>(null)
    const [examenes, setExamenes] = useState<any[]>([])
    const [veredicto, setVeredicto] = useState<any>(null)
    const [analizando, setAnalizando] = useState<Record<string, boolean>>({})

    // Form values for exams (id_examen -> { resultado, documento_url, observaciones })
    const [resultados, setResultados] = useState<Record<string, any>>({})
    const [currentRol, setCurrentRol] = useState<string>('Clínico') // Estación inicial sugerida

    const estaciones = [
        { id: 'Clínico', nombre: 'Clínico (TENS)', icon: '🩺' },
        { id: 'Audiometría', nombre: 'Audiometría', icon: '🦻' },
        { id: 'Psicotécnico', nombre: 'Psicotécnico (TENS)', icon: '🚦' },
        { id: 'Psicológico', nombre: 'Psicológico (Psicólogo)', icon: '🧠' },
        { id: 'Radiología', nombre: 'Radiología (Tec. Médico)', icon: '🩻' },
        { id: 'Laboratorio', nombre: 'Laboratorio (Automático)', icon: '🧪' },
        { id: 'Médico', nombre: 'Médico (Médico)', icon: '👨‍⚕️' },
        { id: 'Admin', nombre: 'Administración', icon: '🏢' },
    ]

    useEffect(() => {
        if (stationParam) {
            setCurrentRol(stationParam)
        }
        fetchData()
    }, [id, stationParam])

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
                if (ex.resultado?.startsWith('{')) {
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
            const tipoForm = ex?.prestaciones?.tipo_formulario || 'default'

            if (tipoForm === 'signos_vitales') {
                updateExamField(exId, 'pa_sistolica', '118')
                updateExamField(exId, 'pa_diastolica', '76')
                updateExamField(exId, 'pulso', '72')
                updateExamField(exId, 'peso', '75')
                updateExamField(exId, 'talla', '1.75')
                updateExamField(exId, 'saturometria', '98')
                updateExamField(exId, 'resultado', 'Analizado: PA 118/76, Pulso 72, IMC 24.5')
            } else if (tipoForm === 'laboratorio') {
                updateExamField(exId, 'resultado', '95')
            } else if (tipoForm === 'psicologico' || tipoForm === 'psicotecnico') {
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

        const tipoForm = ex?.prestaciones?.tipo_formulario || 'default'

        // Si es Signos Vitales, recalculamos el summary y preparamos JSON
        if (tipoForm === 'signos_vitales') {
            const valP1 = Number(res.p1) || 0
            const valP2 = Number(res.p2) || 0
            const valP3 = Number(res.p3) || 0
            const ruffier = (res.p1 && res.p2 && res.p3) ? ((valP1 + valP2 + valP3 - 200) / 10).toFixed(1) : '--'
            const imc = (res.peso && res.talla) ? (Number(res.peso) / (Number(res.talla) * Number(res.talla))).toFixed(1) : '--'

            const summary = `PA: ${res.pa_sistolica}/${res.pa_diastolica}, Pulso: ${res.pulso}, IMC: ${imc}, Ruffier: ${ruffier}, Sat: ${res.saturometria}%`
            finalResultado = JSON.stringify({
                ...extraFieldsToSave,
                imc,
                ruffier,
                resultado: summary
            })
        }

        // Si es Test Visual, recalculamos el summary
        if (tipoForm === 'test_visual') {
            const summary = `VA Lejos: ${res.lejos_od || '-'}/${res.lejos_oi || '-'} | VA Cerca: ${res.cerca_od || '-'}/${res.cerca_oi || '-'}`
            finalResultado = JSON.stringify({
                ...extraFieldsToSave,
                resultado: summary
            })
        }

        // Si es Estilo de Vida
        if (tipoForm === 'estilo_vida') {
            const summary = `Fuma: ${res.fuma || 'NO'} (${res.fuma_cantidad || 0}), Alcohol: ${res.alcohol_frecuencia || 'N/A'}, Act. Física: ${res.actividad_horas || 0}h/sem`
            finalResultado = JSON.stringify({
                ...extraFieldsToSave,
                resultado: summary
            })
        }

        // Si es Audiometría
        if (tipoForm === 'audiometria') {
            const hasHearingLoss = Object.keys(res).some(k => k.startsWith('audio_') && Number(res[k]) > 25)
            const summary = hasHearingLoss ? '⚠️ Requiere eval. especialista' : '✅ Audición Normal'
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
                    <div className="station-selector-grid">
                        {estaciones.map(est => {
                            const examsInStation = examenes.filter(ex => ex.rol_asignado === est.id)
                            const completedInStation = examsInStation.filter(ex => ex.estado === 'finalizado').length
                            const totalInStation = examsInStation.length
                            const isDone = totalInStation > 0 && completedInStation === totalInStation

                            return (
                                <button
                                    key={est.id}
                                    className={`station-card ${currentRol === est.id ? 'active' : ''} ${isDone ? 'done' : ''}`}
                                    onClick={() => setCurrentRol(est.id)}
                                >
                                    <span className="st-icon">{est.icon}</span>
                                    <div className="st-info">
                                        <div className="st-name-row">
                                            <span className="st-name">{est.nombre}</span>
                                            {isDone && <span className="st-check">✅</span>}
                                        </div>
                                        <span className="st-status">
                                            {completedInStation}/{totalInStation} LISTO
                                        </span>
                                    </div>
                                    <div className="st-progress">
                                        <div className="st-progress-bar" style={{ width: totalInStation > 0 ? `${(completedInStation / totalInStation) * 100}%` : '0%' }}></div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    {totalCount === 0 ? (
                        <div className="empty-state card glass">
                            <span className="empty-icon">📂</span>
                            <h3>No hay prestaciones asignadas</h3>
                            <p>Esta evaluación no registra exámenes pendientes en la base de datos.</p>
                        </div>
                    ) : Object.entries(examenesPorGrupo).map(([grupo, items]: [string, any]) => {
                        const filteredItems = currentRol === 'Médico' || currentRol === 'Admin'
                            ? items
                            : items.filter((ex: any) => {
                                if (currentRol === 'Clínico' && (ex.rol_asignado === 'Clínico' || ex.rol_asignado === 'Paramédico')) return true
                                if (currentRol === 'Audiometría' && (ex.rol_asignado === 'Fonoaudiólogo' || ex.prestaciones?.nombre?.toLowerCase().includes('audio'))) return true
                                if (currentRol === 'Radiología' && ex.rol_asignado === 'Tecnólogo') return true
                                if (currentRol === 'Psicotécnico' && ex.rol_asignado === 'Psicotécnico') return true
                                return ex.rol_asignado === currentRol
                            })

                        if (filteredItems.length === 0) return null

                        return (
                            <section key={grupo} className="group-section card glass">
                                <div className="group-header-flex">
                                    <h3 className="group-title">{grupo}</h3>
                                    {currentRol === 'Laboratorio' && (
                                        <button
                                            className="btn-auto-fill"
                                            onClick={() => alert("Simulando conexión con Sistema de Laboratorio (LIS)...")}
                                        >
                                            🚀 Importar Resultados LIS
                                        </button>
                                    )}
                                </div>
                                <div className="exams-list">
                                    {filteredItems.map((ex: any) => {
                                        const isEditable = (ex.rol_asignado === currentRol) ||
                                            (currentRol === 'Clínico' && ex.rol_asignado === 'Paramédico') ||
                                            (currentRol === 'Médico')

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
                                                                    <span className="file-name">Documento Escaneado</span>
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
                                                                        <span>Analizando...</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="dz-content">
                                                                        <span className="icon">📄</span>
                                                                        <p>Arrastrar o <strong>Click</strong> para subir</p>
                                                                        <input
                                                                            type="file"
                                                                            id={`file-${ex.id}`}
                                                                            hidden
                                                                            onChange={(e) => e.target.files && handleFileDrop(ex.id, e.target.files)}
                                                                            disabled={!isEditable}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="data-entry-area">
                                                        {(() => {
                                                            const FormComponent = getFormComponent(ex.prestaciones?.tipo_formulario)
                                                            return (
                                                                <FormComponent
                                                                    examId={ex.id}
                                                                    resultados={res}
                                                                    updateField={updateExamField}
                                                                    isEditable={isEditable}
                                                                    isFinalizado={ex.estado === 'finalizado'}
                                                                />
                                                            )
                                                        })()}
                                                    </div>
                                                </div>

                                                <div className="save-action-area">
                                                    {isEditable && ex.estado !== 'finalizado' && (
                                                        <button
                                                            className="btn-save-row"
                                                            onClick={() => guardarExamen(ex.id)}
                                                            disabled={!res.resultado && !res.documento_url && !res.pulso && !res.lejos_od && !res.fuma && !res.audio_od_1000}
                                                        >
                                                            Guardar
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </section>
                        )
                    })}

                    <div className="form-actions-footer card glass">
                        <div className="ready-checks">
                            <h4>Veredicto Final</h4>
                            <p className={isComplete ? 'text-success' : 'text-warning'}>
                                {isComplete ? '✅ Todo listo' : '⚠ Pendiente'}
                            </p>
                        </div>
                        <div className="footer-btns">
                            <button className="btn btn-secondary" onClick={procesarIA} disabled={!isComplete}>Analizar con IA</button>
                            <button
                                className="btn btn-primary"
                                onClick={finalizarAtencionMedica}
                                disabled={saving || !isComplete || currentRol !== 'Médico'}
                            >
                                {saving ? 'Cerrando...' : 'Finalizar y Cerrar Ficha'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="ai-status-column">
                    {veredicto ? (
                        <div className={`ai-veredict-card ${veredicto.estado_sugerido}`}>
                            <h3>Veredicto IA</h3>
                            <div className="veredict-status">{veredicto.estado_sugerido}</div>
                            <p>{veredicto.justificacion}</p>
                        </div>
                    ) : (
                        <div className="ai-placeholder-card card glass">
                            <p>El asistente IA analizará la aptitud al finalizar.</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .evaluacion-detalle { 
                    padding: 2rem; 
                    max-width: 1600px; 
                    margin: 0 auto; 
                    color: #fff; 
                    min-height: 100vh;
                    background: #000;
                }

                .page-header {
                    margin-bottom: 3rem;
                }

                .header-flex {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    gap: 2rem;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    padding-bottom: 2rem;
                }

                .status-row {
                    margin-bottom: 0.5rem;
                }

                .progress-badge {
                    background: rgba(255,255,255,0.05);
                    padding: 0.4rem 1rem;
                    border-radius: 100px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: rgba(255,255,255,0.6);
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .progress-badge.done {
                    background: rgba(16, 185, 129, 0.1);
                    color: #10b981;
                    border-color: rgba(16, 185, 129, 0.2);
                }

                h1 { 
                    font-size: 3rem; 
                    font-weight: 950; 
                    margin: 0.5rem 0; 
                    letter-spacing: -0.04em; 
                    line-height: 1;
                    color: var(--brand-primary);
                }

                .subtitle { 
                    font-size: 1.1rem; 
                    opacity: 0.7; 
                    margin: 0;
                }

                .cargo-badge {
                    text-align: right;
                    background: rgba(255,255,255,0.03);
                    padding: 1rem 1.5rem;
                    border-radius: 20px;
                    border: 1px solid rgba(255,255,255,0.05);
                }

                .cargo-badge .label {
                    display: block;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    font-weight: 800;
                    opacity: 0.5;
                    margin-bottom: 0.3rem;
                }

                .cargo-badge .value {
                    font-size: 1.2rem;
                    font-weight: 900;
                    color: #fff;
                }

                .evaluation-layout { 
                    display: grid; 
                    grid-template-columns: 1fr 380px; 
                    gap: 3rem; 
                }

                .station-selector-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); 
                    gap: 1rem; 
                    margin-bottom: 3rem; 
                }

                .station-card {
                    background: #0a0a0a;
                    border: 1px solid rgba(255,255,255,0.05);
                    padding: 1.5rem;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    gap: 1.2rem;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    text-align: left;
                    position: relative;
                    overflow: hidden;
                    width: 100%;
                }

                .station-card:hover {
                    background: #111;
                    border-color: rgba(255,107,44,0.3);
                    transform: translateY(-2px);
                }

                .station-card.active {
                    background: rgba(255,107,44,0.1);
                    border-color: var(--brand-primary);
                    box-shadow: 0 10px 30px rgba(255,107,44,0.15);
                }

                .st-icon {
                    font-size: 1.8rem;
                    filter: drop-shadow(0 0 10px rgba(255,255,255,0.1));
                }

                .st-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.2rem;
                }

                .st-name {
                    font-size: 0.9rem;
                    font-weight: 800;
                    color: #fff;
                }

                .st-status {
                    font-size: 0.7rem;
                    font-weight: 700;
                    opacity: 0.4;
                    text-transform: uppercase;
                }

                .st-progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: rgba(255,255,255,0.05);
                }

                .st-progress-bar {
                    height: 100%;
                    background: var(--brand-primary);
                    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .group-section {
                    margin-bottom: 2rem;
                    padding: 2rem;
                    border-radius: 32px;
                }

                .group-title {
                    font-size: 1.4rem;
                    font-weight: 900;
                    margin-bottom: 2rem;
                    letter-spacing: -0.02em;
                }

                .exam-row {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 20px;
                    padding: 1.5rem;
                    margin-bottom: 1.2rem;
                }

                .exam-info-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .name-box label {
                    font-size: 1.1rem;
                    font-weight: 800;
                    display: block;
                }

                .rol-tag {
                    font-size: 0.65rem;
                    font-weight: 900;
                    background: rgba(255,255,255,0.05);
                    padding: 0.2rem 0.6rem;
                    border-radius: 6px;
                    opacity: 0.5;
                    margin-top: 0.3rem;
                    display: inline-block;
                }

                .exam-grid-container {
                    display: grid;
                    grid-template-columns: 280px 1fr;
                    gap: 1.5rem;
                }

                .dropzone {
                    border: 2px dashed rgba(255,255,255,0.1);
                    border-radius: 16px;
                    padding: 1rem;
                    text-align: center;
                    cursor: pointer;
                    background: rgba(255,255,255,0.01);
                    height: 160px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }

                .dropzone:hover { border-color: var(--brand-primary); background: rgba(255,107,44,0.02); }
                .dropzone.analizando { border-color: #3b82f6; overflow: hidden; }
                
                .dz-content .icon { font-size: 1.5rem; margin-bottom: 0.5rem; display: block; }
                .dz-content p { font-size: 0.8rem; margin: 0.5rem 0; color: rgba(255,255,255,0.4); }

                .ai-analysing { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
                .scanner-line { width: 100%; height: 2px; background: #3b82f6; position: absolute; top: 0; left: 0; animation: scan 2s linear infinite; box-shadow: 0 0 15px #3b82f6; }
                @keyframes scan { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }

                .file-preview { 
                    background: #0f172a; 
                    border-radius: 16px; 
                    padding: 1.2rem; 
                    border: 1px solid rgba(255,255,255,0.1); 
                    height: 160px; 
                    display: flex; 
                    flex-direction: column; 
                    justify-content: space-between; 
                }

                .data-entry-area { display: flex; flex-direction: column; gap: 1rem; }
                
                .vital-signs-table, .visual-test-table, .audiovestibular-table, .lifestyle-table {
                    background: #050505;
                    padding: 1.2rem;
                    border-radius: 16px;
                    border: 1px solid rgba(255,107,44,0.1);
                }

                .vital-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 1rem; }
                .vital-item label { font-size: 0.65rem; font-weight: 800; opacity: 0.5; text-transform: uppercase; margin-bottom: 0.4rem; display: block; }
                .vital-item input { background: #111; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.6rem; color: #fff; width: 100%; font-weight: 700; }

                .form-actions-footer { 
                    padding: 2.5rem; 
                    border-radius: 32px; 
                    margin-top: 4rem; 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    background: rgba(255,255,255,0.02);
                }

                .ai-status-column { position: sticky; top: 2rem; height: fit-content; }
                
                .ai-veredict-card { 
                    padding: 2rem; 
                    border-radius: 32px; 
                    border: 1px solid rgba(255,255,255,0.1); 
                    background: #0a0a0a;
                }

                .veredict-status { font-size: 2rem; font-weight: 950; margin: 1rem 0; color: var(--brand-primary); }
                
                .btn { 
                    padding: 1.2rem 2.5rem; 
                    border-radius: 16px; 
                    font-weight: 900; 
                    border: none; 
                    cursor: pointer; 
                    transition: 0.2s; 
                }
                .btn-primary { background: #fff; color: #000; }
                .btn-secondary { background: rgba(255,255,255,0.1); color: #fff; }
                .btn:disabled { opacity: 0.2; cursor: not-allowed; }

                @media (max-width: 1200px) {
                    .evaluation-layout { grid-template-columns: 1fr; }
                    .ai-status-column { position: static; }
                }

                .empty-state {
                    padding: 5rem 2rem;
                    text-align: center;
                    background: rgba(255,255,255,0.01);
                    border-radius: 40px;
                    border: 1px solid rgba(255,255,255,0.05);
                    margin-top: 2rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 1.5rem;
                }
                .empty-icon { font-size: 4rem; filter: grayscale(1); opacity: 0.15; }
                .empty-state h3 { font-size: 1.8rem; font-weight: 900; margin: 0; color: rgba(255,255,255,0.9); letter-spacing: -0.02em; }
                .empty-state p { opacity: 0.4; max-width: 320px; margin: 0; line-height: 1.8; font-size: 1rem; }

                .dz-content .formats { font-size: 0.6rem; opacity: 0.3; text-transform: uppercase; letter-spacing: 0.15em; margin-top: 0.5rem; display: block; font-weight: 800; }
                
                .glass {
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                }
            `}</style>
        </div >
    )
}
