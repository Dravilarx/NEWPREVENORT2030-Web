'use client'
import { FormularioProps, isFieldDisabled } from './types'
import { useState, useRef, useCallback } from 'react'

/**
 * Psicotecnico — Evaluación Psicotécnica (CLI-0010)
 * 
 * Los resultados llegan desde un tercero (Petrinovic/Prevenorsalud) en PDF.
 * Este componente permite:
 * 1. Arrastrar/cargar el PDF del informe
 * 2. Extraer automáticamente los resultados via Gemini Vision
 * 3. Mostrar y editar manualmente cada test
 * 4. Guardar en el sistema independientemente de qué prestaciones se pidieron
 */

// Todos los tests posibles que pueden aparecer en el informe
const TODOS_LOS_TESTS = [
    { campo: 'psico_velocidad_anticipacion', label: 'Test de Velocidad de Anticipación' },
    { campo: 'psico_coordinacion_bimanual', label: 'Test de Coordinación Bimanual' },
    { campo: 'psico_reacciones_multiples', label: 'Test de Reacciones Múltiples' },
    { campo: 'psico_reactimetria', label: 'Test de Reactimetría Simple' },
    { campo: 'psico_resistencia_monotonia', label: 'Test Resistencia a la Monotonía' },
    { campo: 'psico_vision_audicion', label: 'Test de Visión y Audición' },
    { campo: 'psico_palancas', label: 'Test de Palancas' },
    { campo: 'psico_punteado', label: 'Test de Punteado' },
]

type ExtractedTest = {
    nombre: string
    campo: string
    resultado: 'APROBADO' | 'REPROBADO'
    detalle?: string
}

type ExtractedData = {
    resultado_general?: string
    nombre_paciente?: string
    rut_paciente?: string
    fecha_examen?: string
    tipo_examen?: string
    tests: ExtractedTest[]
}

export default function Psicotecnico({ examId, resultados: res, updateField, isEditable, isFinalizado }: FormularioProps) {
    const disabled = isFieldDisabled(isEditable, isFinalizado)
    const [isDragging, setIsDragging] = useState(false)
    const [isExtracting, setIsExtracting] = useState(false)
    const [extractError, setExtractError] = useState<string | null>(null)
    const [extractedMeta, setExtractedMeta] = useState<Omit<ExtractedData, 'tests'> | null>(null)
    const [pdfFileName, setPdfFileName] = useState<string>(res.psico_pdf_nombre || '')
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Determina qué tests mostrar: los que ya tienen resultado + los estándar
    const testsConResultado = Object.keys(res)
        .filter(k => k.startsWith('psico_') && !['psico_obs', 'psico_conclusion', 'psico_pdf_nombre', 'psico_pdf_fecha'].includes(k) && !TODOS_LOS_TESTS.find(t => t.campo === k))
        .map(campo => ({
            campo,
            label: campo.replace('psico_', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        }))

    const todosLosTests = [...TODOS_LOS_TESTS, ...testsConResultado]

    const processFile = useCallback(async (file: File) => {
        if (!file) return

        // Validar tipo
        if (!file.type.includes('pdf') && !file.type.includes('image')) {
            setExtractError('Solo se aceptan archivos PDF o imágenes (JPG, PNG)')
            return
        }

        setIsExtracting(true)
        setExtractError(null)
        setPdfFileName(file.name)
        updateField(examId, 'psico_pdf_nombre', file.name)
        updateField(examId, 'psico_pdf_fecha', new Date().toISOString())

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/extract-psicotecnico', {
                method: 'POST',
                body: formData
            })

            const json = await response.json()

            if (!response.ok || !json.success) {
                throw new Error(json.error || 'Error al extraer datos del PDF')
            }

            const data: ExtractedData = json.data

            // Guardar metadata del informe
            setExtractedMeta({
                resultado_general: data.resultado_general,
                nombre_paciente: data.nombre_paciente,
                rut_paciente: data.rut_paciente,
                fecha_examen: data.fecha_examen,
                tipo_examen: data.tipo_examen,
            })

            // Guardar cada test extraído en el sistema
            if (data.tests && Array.isArray(data.tests)) {
                data.tests.forEach(test => {
                    if (test.campo && test.resultado) {
                        updateField(examId, test.campo, test.resultado)
                        if (test.detalle) {
                            updateField(examId, `${test.campo}_detalle`, test.detalle)
                        }
                    }
                })
            }

            // Guardar resultado general
            if (data.resultado_general) {
                updateField(examId, 'psico_conclusion', data.resultado_general)
            }

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error desconocido'
            setExtractError(msg)
        } finally {
            setIsExtracting(false)
        }
    }, [examId, updateField])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) processFile(file)
    }, [processFile])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) processFile(file)
    }

    // Contar resultados
    const aprobados = todosLosTests.filter(t => res[t.campo] === 'APROBADO').length
    const reprobados = todosLosTests.filter(t => res[t.campo] === 'REPROBADO').length
    const sinResultado = todosLosTests.filter(t => !res[t.campo]).length

    const conclusionGeneral = res.psico_conclusion

    return (
        <div className="psico-container card glass">
            {/* Header */}
            <div className="psico-header">
                <div className="psico-icon">🚦</div>
                <div className="psico-title-group">
                    <h3>Evaluación Psicotécnica</h3>
                    <p>Informe de tercero — Extracción automática desde PDF (CLI-0010)</p>
                </div>
                {conclusionGeneral && (
                    <div className={`psico-badge-general ${conclusionGeneral === 'APROBADO' ? 'aprobado' : 'reprobado'}`}>
                        {conclusionGeneral === 'APROBADO' ? '✅' : '❌'} {conclusionGeneral}
                    </div>
                )}
            </div>

            {/* Zona de carga del PDF */}
            {!disabled && (
                <div
                    className={`psico-dropzone ${isDragging ? 'dragging' : ''} ${isExtracting ? 'extracting' : ''} ${pdfFileName ? 'has-file' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => !isExtracting && fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />

                    {isExtracting ? (
                        <div className="psico-extracting">
                            <div className="psico-spinner"></div>
                            <p>Analizando informe con IA...</p>
                            <span>Extrayendo resultados de cada test</span>
                        </div>
                    ) : pdfFileName ? (
                        <div className="psico-file-loaded">
                            <span className="psico-file-icon">📄</span>
                            <div>
                                <p className="psico-file-name">{pdfFileName}</p>
                                <span>Haz clic o arrastra para reemplazar</span>
                            </div>
                        </div>
                    ) : (
                        <div className="psico-drop-hint">
                            <span className="psico-drop-icon">📋</span>
                            <p>Arrastra el PDF del informe psicotécnico aquí</p>
                            <span>o haz clic para seleccionar archivo</span>
                            <div className="psico-formats">PDF · JPG · PNG</div>
                        </div>
                    )}
                </div>
            )}

            {/* Metadata extraída del informe */}
            {extractedMeta && (
                <div className="psico-meta-card">
                    <div className="psico-meta-row">
                        {extractedMeta.nombre_paciente && <span><strong>Paciente:</strong> {extractedMeta.nombre_paciente}</span>}
                        {extractedMeta.rut_paciente && <span><strong>RUT:</strong> {extractedMeta.rut_paciente}</span>}
                        {extractedMeta.fecha_examen && <span><strong>Fecha examen:</strong> {extractedMeta.fecha_examen}</span>}
                        {extractedMeta.tipo_examen && <span><strong>Tipo:</strong> {extractedMeta.tipo_examen}</span>}
                    </div>
                </div>
            )}

            {/* Error */}
            {extractError && (
                <div className="psico-error">
                    <span>⚠️</span>
                    <div>
                        <strong>Error al procesar el PDF</strong>
                        <p>{extractError}</p>
                        <small>Puedes ingresar los resultados manualmente abajo.</small>
                    </div>
                </div>
            )}

            {/* Resumen de resultados */}
            {(aprobados > 0 || reprobados > 0) && (
                <div className="psico-summary">
                    <div className="psico-summary-item aprobado">
                        <span className="psico-summary-num">{aprobados}</span>
                        <span>Aprobados</span>
                    </div>
                    <div className="psico-summary-item reprobado">
                        <span className="psico-summary-num">{reprobados}</span>
                        <span>Reprobados</span>
                    </div>
                    <div className="psico-summary-item pendiente">
                        <span className="psico-summary-num">{sinResultado}</span>
                        <span>Sin resultado</span>
                    </div>
                </div>
            )}

            {/* Tabla de resultados por test */}
            <div className="psico-tests-grid">
                {todosLosTests.map(({ campo, label }) => {
                    const resultado = res[campo] as string | undefined
                    const detalle = res[`${campo}_detalle`] as string | undefined
                    return (
                        <div key={campo} className={`psico-test-row ${resultado === 'APROBADO' ? 'aprobado' : resultado === 'REPROBADO' ? 'reprobado' : 'pendiente'}`}>
                            <div className="psico-test-info">
                                <span className="psico-test-label">{label}</span>
                                {detalle && <span className="psico-test-detalle">{detalle}</span>}
                            </div>
                            <div className="psico-test-btns">
                                <button
                                    className={`psico-btn-resultado ${resultado === 'APROBADO' ? 'active-aprobado' : ''}`}
                                    onClick={() => updateField(examId, campo, 'APROBADO')}
                                    disabled={disabled}
                                >
                                    ✓ Aprobado
                                </button>
                                <button
                                    className={`psico-btn-resultado ${resultado === 'REPROBADO' ? 'active-reprobado' : ''}`}
                                    onClick={() => updateField(examId, campo, 'REPROBADO')}
                                    disabled={disabled}
                                >
                                    ✗ Reprobado
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Observaciones */}
            <div className="psico-obs-section">
                <label>Observaciones</label>
                <textarea
                    value={res.psico_obs || ''}
                    onChange={(e) => updateField(examId, 'psico_obs', e.target.value)}
                    disabled={disabled}
                    placeholder="Observaciones adicionales del evaluador..."
                    rows={3}
                />
            </div>

            {/* Conclusión general manual */}
            <div className="psico-conclusion-section">
                <label>Conclusión General</label>
                <div className="psico-conclusion-btns">
                    <button
                        className={`psico-btn-conclusion aprobado ${conclusionGeneral === 'APROBADO' ? 'active' : ''}`}
                        onClick={() => updateField(examId, 'psico_conclusion', 'APROBADO')}
                        disabled={disabled}
                    >
                        ✅ APROBADO
                    </button>
                    <button
                        className={`psico-btn-conclusion reprobado ${conclusionGeneral === 'REPROBADO' ? 'active' : ''}`}
                        onClick={() => updateField(examId, 'psico_conclusion', 'REPROBADO')}
                        disabled={disabled}
                    >
                        ❌ REPROBADO
                    </button>
                </div>
            </div>

            <style jsx>{`
                .psico-container {
                    padding: 24px;
                    border-radius: 16px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: white;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                /* Header */
                .psico-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                .psico-icon {
                    font-size: 28px;
                    background: rgba(234,179,8,0.15);
                    width: 56px; height: 56px;
                    display: flex; align-items: center; justify-content: center;
                    border-radius: 12px;
                    border: 1px solid rgba(234,179,8,0.3);
                    flex-shrink: 0;
                }
                .psico-title-group { flex: 1; }
                .psico-title-group h3 { margin: 0; font-size: 18px; font-weight: 700; }
                .psico-title-group p { margin: 4px 0 0; font-size: 12px; color: #94a3b8; }
                .psico-badge-general {
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                }
                .psico-badge-general.aprobado { background: rgba(16,185,129,0.2); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
                .psico-badge-general.reprobado { background: rgba(239,68,68,0.2); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }

                /* Dropzone */
                .psico-dropzone {
                    border: 2px dashed rgba(255,255,255,0.15);
                    border-radius: 12px;
                    padding: 32px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: rgba(0,0,0,0.1);
                }
                .psico-dropzone:hover, .psico-dropzone.dragging {
                    border-color: #8b5cf6;
                    background: rgba(139,92,246,0.08);
                }
                .psico-dropzone.has-file {
                    border-style: solid;
                    border-color: rgba(16,185,129,0.4);
                    background: rgba(16,185,129,0.05);
                }
                .psico-dropzone.extracting {
                    border-color: #f59e0b;
                    background: rgba(245,158,11,0.05);
                    cursor: default;
                }
                .psico-drop-hint { display: flex; flex-direction: column; align-items: center; gap: 8px; }
                .psico-drop-icon { font-size: 36px; }
                .psico-drop-hint p { margin: 0; font-size: 15px; color: #e2e8f0; font-weight: 500; }
                .psico-drop-hint span { font-size: 13px; color: #64748b; }
                .psico-formats {
                    margin-top: 8px;
                    padding: 4px 12px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 20px;
                    font-size: 11px;
                    color: #64748b;
                    letter-spacing: 0.1em;
                }
                .psico-extracting { display: flex; flex-direction: column; align-items: center; gap: 12px; }
                .psico-extracting p { margin: 0; font-size: 15px; color: #f59e0b; font-weight: 600; }
                .psico-extracting span { font-size: 13px; color: #94a3b8; }
                .psico-spinner {
                    width: 36px; height: 36px;
                    border: 3px solid rgba(245,158,11,0.2);
                    border-top-color: #f59e0b;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .psico-file-loaded { display: flex; align-items: center; gap: 16px; }
                .psico-file-icon { font-size: 32px; }
                .psico-file-name { margin: 0; font-size: 14px; font-weight: 600; color: #10b981; }
                .psico-file-loaded span { font-size: 12px; color: #64748b; }

                /* Meta */
                .psico-meta-card {
                    background: rgba(139,92,246,0.08);
                    border: 1px solid rgba(139,92,246,0.2);
                    border-radius: 10px;
                    padding: 12px 16px;
                }
                .psico-meta-row { display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; color: #cbd5e1; }
                .psico-meta-row strong { color: white; }

                /* Error */
                .psico-error {
                    display: flex; gap: 12px; align-items: flex-start;
                    background: rgba(239,68,68,0.1);
                    border: 1px solid rgba(239,68,68,0.3);
                    border-radius: 10px;
                    padding: 14px 16px;
                    font-size: 13px;
                }
                .psico-error span { font-size: 20px; flex-shrink: 0; }
                .psico-error strong { display: block; color: #ef4444; margin-bottom: 4px; }
                .psico-error p { margin: 0; color: #fca5a5; }
                .psico-error small { color: #94a3b8; }

                /* Summary */
                .psico-summary {
                    display: flex; gap: 12px;
                }
                .psico-summary-item {
                    flex: 1; display: flex; flex-direction: column; align-items: center;
                    padding: 12px; border-radius: 10px; gap: 4px;
                }
                .psico-summary-item.aprobado { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); }
                .psico-summary-item.reprobado { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); }
                .psico-summary-item.pendiente { background: rgba(100,116,139,0.1); border: 1px solid rgba(100,116,139,0.2); }
                .psico-summary-num { font-size: 28px; font-weight: 800; line-height: 1; }
                .psico-summary-item.aprobado .psico-summary-num { color: #10b981; }
                .psico-summary-item.reprobado .psico-summary-num { color: #ef4444; }
                .psico-summary-item.pendiente .psico-summary-num { color: #64748b; }
                .psico-summary-item span:last-child { font-size: 12px; color: #94a3b8; }

                /* Tests Grid */
                .psico-tests-grid { display: flex; flex-direction: column; gap: 2px; }
                .psico-test-row {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 14px 16px; border-radius: 10px; gap: 16px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    transition: all 0.2s;
                }
                .psico-test-row.aprobado { border-left: 3px solid #10b981; background: rgba(16,185,129,0.04); }
                .psico-test-row.reprobado { border-left: 3px solid #ef4444; background: rgba(239,68,68,0.04); }
                .psico-test-row.pendiente { border-left: 3px solid rgba(255,255,255,0.1); }
                .psico-test-info { flex: 1; }
                .psico-test-label { display: block; font-size: 14px; color: #e2e8f0; font-weight: 500; }
                .psico-test-detalle { display: block; font-size: 11px; color: #64748b; margin-top: 2px; }
                .psico-test-btns { display: flex; gap: 6px; flex-shrink: 0; }
                .psico-btn-resultado {
                    padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600;
                    cursor: pointer; border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.05); color: #94a3b8;
                    transition: all 0.15s;
                }
                .psico-btn-resultado:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: white; }
                .psico-btn-resultado.active-aprobado { background: #10b981; border-color: #10b981; color: white; }
                .psico-btn-resultado.active-reprobado { background: #ef4444; border-color: #ef4444; color: white; }
                .psico-btn-resultado:disabled { opacity: 0.5; cursor: not-allowed; }

                /* Observaciones */
                .psico-obs-section { display: flex; flex-direction: column; gap: 8px; }
                .psico-obs-section label { font-size: 13px; color: #94a3b8; font-weight: 500; }
                .psico-obs-section textarea {
                    background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px; color: white; padding: 12px; font-size: 14px;
                    resize: vertical; font-family: inherit;
                }
                .psico-obs-section textarea:focus { outline: none; border-color: #8b5cf6; }

                /* Conclusión */
                .psico-conclusion-section { display: flex; flex-direction: column; gap: 10px; }
                .psico-conclusion-section label { font-size: 13px; color: #94a3b8; font-weight: 500; }
                .psico-conclusion-btns { display: flex; gap: 12px; }
                .psico-btn-conclusion {
                    flex: 1; padding: 14px; border-radius: 10px; font-size: 15px; font-weight: 700;
                    cursor: pointer; border: 2px solid transparent; transition: all 0.2s;
                    letter-spacing: 0.05em;
                }
                .psico-btn-conclusion.aprobado { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.3); color: #10b981; }
                .psico-btn-conclusion.aprobado.active { background: #10b981; border-color: #10b981; color: white; box-shadow: 0 4px 20px rgba(16,185,129,0.3); }
                .psico-btn-conclusion.reprobado { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #ef4444; }
                .psico-btn-conclusion.reprobado.active { background: #ef4444; border-color: #ef4444; color: white; box-shadow: 0 4px 20px rgba(239,68,68,0.3); }
                .psico-btn-conclusion:disabled { opacity: 0.5; cursor: not-allowed; }

                @media (max-width: 640px) {
                    .psico-test-row { flex-direction: column; align-items: flex-start; }
                    .psico-summary { flex-direction: column; }
                }
            `}</style>
        </div>
    )
}
