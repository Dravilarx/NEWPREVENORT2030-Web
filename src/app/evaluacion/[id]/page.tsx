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
    const [veredicto, setVeredicto] = useState<any>(null)

    // Parametros Form
    const [paSistolica, setPaSistolica] = useState('')
    const [paDiastolica, setPaDiastolica] = useState('')
    const [glicemia, setGlicemia] = useState('')
    const [peso, setPeso] = useState('')
    const [talla, setTalla] = useState('')

    useEffect(() => {
        fetchData()
    }, [id])

    async function fetchData() {
        const { data, error } = await supabase
            .from('atenciones')
            .select(`
        *,
        trabajadores (*),
        empresas (*),
        cargos (*)
      `)
            .eq('id', id)
            .single()

        if (data) setAtencion(data)
        setLoading(false)
    }

    const procesarIA = () => {
        if (!atencion?.cargos) return

        const parametros = [
            { nombre: 'Presión Arterial Sistólica', valor: Number(paSistolica), unidad: 'mmHg' },
            { nombre: 'Presión Arterial Diastólica', valor: Number(paDiastolica), unidad: 'mmHg' },
            { nombre: 'Glicemia', valor: Number(glicemia), unidad: 'mg/dL' }
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

    async function guardarEvaluacion() {
        setSaving(true)
        try {
            // 1. Guardar resultados individuales
            const resultados = [
                { atencion_id: id, item_nombre: 'Presión Arterial', valor_encontrado: `${paSistolica}/${paDiastolica} mmHg` },
                { atencion_id: id, item_nombre: 'Glicemia', valor_encontrado: `${glicemia} mg/dL` },
                { atencion_id: id, item_nombre: 'IMC', valor_encontrado: (Number(peso) / (Number(talla) * Number(talla))).toFixed(2) }
            ]

            await supabase.from('resultados_clinicos').insert(resultados)

            // 2. Actualizar atención con veredicto IA
            await supabase
                .from('atenciones')
                .update({
                    estado_aptitud: veredicto?.estado_sugerido || 'pendiente',
                    ia_evaluacion: veredicto?.justificacion,
                    justificacion_normativa: atencion.cargos.es_gran_altura ? 'Cumple Guía Técnica Hipobaria' : 'Cumple Estándar General'
                })
                .eq('id', id)

            alert('Evaluación guardada con éxito.')
            router.push('/evaluacion')
        } catch (err) {
            alert('Error al guardar')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-10">Cargando datos de atención...</div>

    return (
        <div className="evaluacion-detalle animate-fade">
            <header className="page-header">
                <button onClick={() => router.back()} className="back-link">← Volver</button>
                <h1>Evaluación: {atencion?.trabajadores?.nombre_completo}</h1>
                <p>RUT: <strong>{atencion?.trabajadores?.rut ? formatearRUT(atencion.trabajadores.rut) : ''}</strong> | Cargo: <strong>{atencion?.cargos?.nombre_cargo}</strong> | Empresa: {atencion?.empresas?.nombre}</p>
            </header>

            <div className="content-grid">
                <div className="card form-container">
                    <h3>Ingreso de Signos Vitales</h3>
                    <div className="params-grid">
                        <div className="form-group">
                            <label>P.A. Sistólica (mmHg)</label>
                            <input type="number" value={paSistolica} onChange={e => setPaSistolica(e.target.value)} placeholder="120" />
                        </div>
                        <div className="form-group">
                            <label>P.A. Diastólica (mmHg)</label>
                            <input type="number" value={paDiastolica} onChange={e => setPaDiastolica(e.target.value)} placeholder="80" />
                        </div>
                        <div className="form-group">
                            <label>Glicemia (mg/dL)</label>
                            <input type="number" value={glicemia} onChange={e => setGlicemia(e.target.value)} placeholder="95" />
                        </div>
                        <div className="form-group">
                            <label>Peso (kg)</label>
                            <input type="number" value={peso} onChange={e => setPeso(e.target.value)} placeholder="75" />
                        </div>
                        <div className="form-group">
                            <label>Talla (mts)</label>
                            <input type="number" step="0.01" value={talla} onChange={e => setTalla(e.target.value)} placeholder="1.75" />
                        </div>
                    </div>

                    <button className="btn btn-secondary btn-full" onClick={procesarIA}>
                        Analizar con IA Prevenort 🤖
                    </button>
                </div>

                <div className="side-panels">
                    {veredicto && (
                        <div className={`card veredicto-card ${veredicto.es_alerta ? 'alerta' : 'success'}`}>
                            <div className="ai-header">
                                <span className="ai-icon">{veredicto.es_alerta ? '⚠️' : '✅'}</span>
                                <h3>Veredicto Sugerido IA</h3>
                            </div>
                            <div className="estado-badge">
                                {veredicto.estado_sugerido.toUpperCase()}
                            </div>
                            <p className="justificacion">{veredicto.justificacion}</p>

                            <button
                                className="btn btn-primary btn-full mt-4"
                                onClick={guardarEvaluacion}
                                disabled={saving}
                            >
                                {saving ? 'Guardando...' : 'Confirmar y Guardar'}
                            </button>
                        </div>
                    )}

                    <div className="card info-normativa">
                        <h3>Normativa Aplicable</h3>
                        <ul>
                            {atencion.cargos.es_gran_altura && <li>DS N°28 (Hipobaria)</li>}
                            <li>Ley 20.584 (Derechos Paciente)</li>
                            <li>Protocolo Interno Prevenort</li>
                        </ul>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .page-header { margin-bottom: 2rem; }
        .back-link { background: none; border: none; color: var(--brand-primary); cursor: pointer; margin-bottom: 1rem; }
        
        .params-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin: 1.5rem 0;
        }

        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        label { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
        input { padding: 0.8rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1.1rem; }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 2rem;
        }

        .side-panels { display: flex; flex-direction: column; gap: 1.5rem; }

        .veredicto-card {
          padding: 2rem;
          border-left: 6px solid #ddd;
        }

        .veredicto-card.alerta { 
          border-left-color: var(--warning); 
          background: #FFFBEB;
        }

        .veredicto-card.success { 
          border-left-color: var(--success);
          background: #F0FDF4;
        }

        .estado-badge {
          display: inline-block;
          margin: 1rem 0;
          padding: 0.5rem 1.5rem;
          border-radius: 4px;
          background: var(--brand-secondary);
          color: white;
          font-weight: 800;
          font-family: 'Outfit', sans-serif;
        }

        .justificacion { font-size: 0.9rem; line-height: 1.5; color: var(--text-main); }
        
        .info-normativa ul { padding-left: 1.2rem; margin-top: 1rem; font-size: 0.85rem; }
        .btn-secondary { background: #f3f4f6; color: var(--brand-secondary); border: 1px solid #ddd; }
        .btn-full { width: 100%; margin-top: 1rem; }
        .mt-4 { margin-top: 1rem; }
      `}</style>
        </div>
    )
}
