'use client'
import { useRef, useState } from 'react'

/**
 * FotoUpload — Componente reutilizable para subir fotos como fallback.
 * Puede usarse en cualquier formulario cuando no se puede llenar digitalmente.
 * Soporta múltiples imágenes con preview.
 */

interface FotoUploadProps {
    examId: string
    fotos: string[] // URLs de fotos ya subidas (base64 o URLs reales)
    onAddFoto: (examId: string, fotoBase64: string) => void
    onRemoveFoto: (examId: string, index: number) => void
    disabled: boolean
    label?: string
}

export default function FotoUpload({ examId, fotos, onAddFoto, onRemoveFoto, disabled, label }: FotoUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setUploading(true)
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            if (!file.type.startsWith('image/')) continue

            const reader = new FileReader()
            reader.onload = () => {
                const base64 = reader.result as string
                onAddFoto(examId, base64)
            }
            reader.readAsDataURL(file)
        }
        setUploading(false)

        // Reset input para permitir re-seleccionar el mismo archivo
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <div className="photo-upload-section">
            <div style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                📷 {label || 'Subir fotografía (alternativa al llenado digital)'}
            </div>

            {fotos.length > 0 && (
                <div className="photo-preview">
                    {fotos.map((foto, idx) => (
                        <div key={idx} style={{ position: 'relative' }}>
                            <img src={foto} alt={`Foto ${idx + 1}`} />
                            {!disabled && (
                                <button
                                    onClick={() => onRemoveFoto(examId, idx)}
                                    style={{
                                        position: 'absolute', top: -6, right: -6,
                                        width: 20, height: 20, borderRadius: '50%',
                                        background: '#ef4444', color: '#fff', border: 'none',
                                        fontSize: '0.7rem', cursor: 'pointer', fontWeight: 900,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >×</button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {!disabled && (
                <>
                    <button
                        className="photo-upload-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        {uploading ? '⏳ Procesando...' : '📷 Tomar foto o seleccionar imagen'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                </>
            )}
        </div>
    )
}
