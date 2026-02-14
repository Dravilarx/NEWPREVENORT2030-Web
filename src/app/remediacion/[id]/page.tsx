"use client"

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { diseñarPlanRemediacion } from '@/lib/skills/gestorRemediacion'
import { formatearRUT } from '@/lib/skills/formateadorRUT'

export default function RemediacionDetallePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [atencion, setAtencion] = useState<any>(null)
    const [planIA, setPlanIA] = useState<any>(null)

    // Plan State
    const [progreso, setProgreso] = useState(0)
    const [comentarios, setComentarios] = useState('')

    useEffect(() => {
        fetchData()
    }, [id])

    async function fetchData() {
        // Obtenemos atención, resultados y plan si existe
        const { data, error } = await supabase
            .from('atenciones')
            .select(`
        *,
        trabajadores (*),
        empresas (*),
        cargos (*),
        resultados_clinicos (*),
        planes_remediacion (*)
      `)
            .eq('id', id)
            .single()

        if (data) {
            setAtencion(data)
            setProgreso(data.planes_remediacion?.[0]?.progreso_actual || 0)

            // Generar plan sugerido por IA basado en resultados de alerta
            const hallazgosAlerta = data.resultados_clinicos
                ?.filter((r: any) => r.es_alerta)
                .map((r: any) => ({
                    item: r.item_nombre,
                    valor: r.valor_encontrado,
                })) || []

            const plan = diseñarPlanRemediacion(hallazgosAlerta)
            setPlanIA(plan)
        }
        setLoading(false)
    }

    async function handleWorkerDecision(decision: 'aprobado' | 'rechazado') {
        setSaving(true)
        const { error } = await supabase
            .from('atenciones')
            .update({
                aprobacion_trabajador: decision,
                fecha_aprobacion_trabajador: new Date().toISOString(),
                estado_aptitud: decision === 'rechazado' ? 'no_apto' : 'remediacion'
            })
            .eq('id', id)

        if (!error) {
            fetchData()
        }
        setSaving(false)
    }

    async function actualizarPlan() {
        setSaving(true)
        try {
            const planExistente = atencion.planes_remediacion?.[0]

            const payload = {
                atencion_id: id,
                progreso_actual: progreso,
                plan_accion: planIA.plan_accion.join(', '),
                hallazgo_principal: planIA.hallazgo_principal,
                probabilidad_exito: planIA.probabilidad_exito,
                fecha_estimada_alta: new Date(Date.now() + planIA.dias_estimados * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }

            if (planExistente) {
                await supabase.from('planes_remediacion').update(payload).eq('id', planExistente.id)
            } else {
                await supabase.from('planes_remediacion').insert([payload])
            }

            // Si el progreso llega a 100, podríamos sugerir volver a evaluar
            if (progreso === 100) {
                alert('Plan completado al 100%. El trabajador está listo para re-evaluación final.')
            }

            alert('Plan de remediación actualizado.')
            router.push('/remediacion')
        } catch (err) {
            alert('Error al guardar: ' + (err as any).message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-10">Cargando expediente de remediación...</div>

    return (
        <div className="remediacion-detalle animate-fade">
            <header className="page-header">
                <button onClick={() => router.back()} className="back-link">← Volver al Listado</button>
                <h1>Gestión de Plan: {atencion?.trabajadores?.nombre_completo}</h1>
                <div className="header-meta">
                    <span className="badge-rut">RUT: {atencion?.trabajadores?.rut ? formatearRUT(atencion.trabajadores.rut) : ''}</span>
                    <span className="badge-empresa">{atencion?.empresas?.nombre}</span>
                    <span className="badge-cargo">{atencion?.cargos?.nombre_cargo}</span>
                </div>
            </header>

            <div className="content-grid">
                <div className="main-column">
                    <div className="card plan-card">
                        <div className="card-header">
                            <span className="icon">📋</span>
                            <h3>Plan de Acción de Rescate</h3>
                        </div>

                        <div className="plan-summary">
                            <div className="summary-item">
                                <label>Hallazgo Principal</label>
                                <p>{planIA?.hallazgo_principal}</p>
                            </div>
                            <div className="summary-item">
                                <label>Probabilidad de Éxito</label>
                                <p className="success-text">{planIA?.probabilidad_exito}%</p>
                            </div>
                            <div className="summary-item">
                                <label>Tiempo Estimado</label>
                                <p>{planIA?.dias_estimados} días</p>
                            </div>
                        </div>

                        <div className="actions-list">
                            <label>Acciones Requeridas:</label>
                            <ul>
                                {planIA?.plan_accion.map((action: string, i: number) => (
                                    <li key={i}>{action}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="control-section">
                            <label>Progreso del Plan: {progreso}%</label>
                            <input
                                type="range"
                                min="0" max="100"
                                value={progreso}
                                onChange={(e) => setProgreso(parseInt(e.target.value))}
                                className="progress-slider"
                            />
                            <div className="slider-labels">
                                <span>Inicio</span>
                                <span>En Proceso</span>
                                <span>Listo para Alta</span>
                            </div>
                        </div>

                        <div className="form-group mt-4">
                            <label>Notas de Seguimiento Médico</label>
                            <textarea
                                placeholder="Describa la evolución del trabajador..."
                                value={comentarios}
                                onChange={(e) => setComentarios(e.target.value)}
                            ></textarea>
                        </div>

                        <button className="btn btn-primary btn-full mt-4" onClick={actualizarPlan} disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar y Actualizar Estado'}
                        </button>
                    </div>

                    {atencion?.aprobacion_empresa === 'aprobado' && (
                        <div className="card worker-decision mt-4">
                            <div className="card-header">
                                <span className="icon">✍️</span>
                                <h3>Consentimiento del Trabajador</h3>
                            </div>

                            {atencion.aprobacion_trabajador === 'pendiente' ? (
                                <div className="decision-actions">
                                    <p className="mb-4">Como trabajador, ¿acepta participar en este plan de remediación de salud para alcanzar su aptitud laboral?</p>
                                    <div className="btn-group-full">
                                        <button
                                            className="btn btn-success flex-1"
                                            onClick={() => handleWorkerDecision('aprobado')}
                                        >
                                            Aceptar Plan ✅
                                        </button>
                                        <button
                                            className="btn btn-danger flex-1"
                                            onClick={() => handleWorkerDecision('rechazado')}
                                        >
                                            Rechazar (Quedar No Apto) ❌
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className={`decision-result ${atencion.aprobacion_trabajador}`}>
                                    <p>El trabajador {atencion.aprobacion_trabajador === 'aprobado' ? 'ACEPTÓ' : 'RECHAZÓ'} formalmente el plan el {new Date(atencion.fecha_aprobacion_trabajador).toLocaleDateString()}.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="side-column">
                    <div className="card history-card">
                        <h3>Hallazgos Detectados</h3>
                        <div className="hallazgos-list">
                            {atencion?.resultados_clinicos?.filter((r: any) => r.es_alerta).map((r: any, i: number) => (
                                <div key={i} className="hallazgo-item">
                                    <span className="dot warning"></span>
                                    <div className="hallazgo-content">
                                        <strong>{r.item_nombre}</strong>
                                        <span>{r.valor_encontrado}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card ai-tip glass">
                        <div className="ai-header">
                            <span className="ai-icon">💡</span>
                            <h3>Tip de Rescate IA</h3>
                        </div>
                        <p>"La adherencia al tratamiento nutricional en trabajadores de {atencion?.empresas?.nombre} suele mejorar si se coordina con el servicio de alimentación de la faena."</p>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .page-header { margin-bottom: 2rem; }
        .back-link { background: none; border: none; color: var(--brand-primary); cursor: pointer; margin-bottom: 1rem; font-weight: 600; }
        .header-meta { display: flex; gap: 1rem; margin-top: 0.5rem; }
        .badge-rut { background: var(--bg-app); color: var(--text-main); padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; font-weight: 700; border: 1px solid var(--border-color); }
        .badge-empresa { background: var(--brand-primary-light); color: var(--brand-primary); padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }
        .badge-cargo { background: var(--bg-app); color: var(--text-muted); padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600; border: 1px solid var(--border-color); }

        .content-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; }
        
        .card-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
        .plan-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; background: var(--bg-app); padding: 1.25rem; border-radius: 8px; margin-bottom: 1.5rem; border: 1px solid var(--border-color); }
        .summary-item label { font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; display: block; }
        .summary-item p { font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-top: 0.25rem; }
        .success-text { color: var(--success) !important; }

        .actions-list { margin-bottom: 2rem; }
        .actions-list label { font-weight: 700; margin-bottom: 0.75rem; display: block; font-size: 0.9rem; }
        .actions-list ul { padding-left: 1.25rem; color: var(--text-main); line-height: 1.6; }

        .progress-slider { width: 100%; height: 6px; background: var(--border-color); border-radius: 5px; appearance: none; outline: none; margin: 1rem 0; }
        .progress-slider::-webkit-slider-thumb { appearance: none; width: 22px; height: 22px; background: var(--brand-primary); border: 4px solid var(--bg-card); border-radius: 50%; cursor: pointer; box-shadow: var(--shadow-md); }
        .slider-labels { display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted); font-weight: 600; }

        textarea { width: 100%; min-height: 100px; padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.95rem; margin-top: 0.5rem; background: var(--bg-card); color: var(--text-main); }

        .hallazgo-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot.warning { background: var(--warning); }
        .hallazgo-content { display: flex; flex-direction: column; }
        .hallazgo-content strong { font-size: 0.9rem; }
        .hallazgo-content span { font-size: 0.8rem; color: var(--text-muted); }

        .ai-tip { display: flex; flex-direction: column; gap: 1rem; }
        .ai-tip p { font-size: 0.9rem; font-style: italic; line-height: 1.5; color: var(--text-main); }

        .btn-full { width: 100%; }
        .mt-4 { margin-top: 1.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        .flex-1 { flex: 1; }
        .btn-group-full { display: flex; gap: 1rem; }
        
        .worker-decision { border-left: 6px solid var(--brand-primary); }
        .decision-result { padding: 1rem; border-radius: 8px; font-weight: 700; text-align: center; }
        .decision-result.aprobado { background: #D1FAE5; color: #065F46; }
        .decision-result.rechazado { background: #FEE2E2; color: #991B1B; }

        .btn-success { background: var(--success); color: white; border: none; padding: 1rem; border-radius: 8px; font-weight: 700; cursor: pointer; }
        .btn-danger { background: var(--danger); color: white; border: none; padding: 1rem; border-radius: 8px; font-weight: 700; cursor: pointer; }
      `}</style>
        </div>
    )
}
