import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/extract-psicotecnico
 * 
 * Recibe un PDF de informe psicotécnico (Petrinovic / Prevenorsalud),
 * lo envía a Gemini Vision y extrae los resultados de cada test.
 * 
 * Body: FormData con campo "file" (PDF o imagen)
 * Returns: JSON con los resultados extraídos
 */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
        }

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 500 })
        }

        // Convertir el archivo a base64
        const bytes = await file.arrayBuffer()
        const base64 = Buffer.from(bytes).toString('base64')
        const mimeType = file.type || 'application/pdf'

        // Prompt estructurado para extraer resultados del informe psicotécnico
        const prompt = `Eres un extractor de datos médicos. Analiza este informe psicotécnico y extrae los resultados de CADA test que aparezca.

Para cada test, identifica:
1. El nombre del test
2. El resultado final (APROBADO o REPROBADO)
3. Datos numéricos relevantes si los hay (opcional)

Los tests posibles en este tipo de informe son (pero puede haber otros):
- Test de velocidad de anticipación
- Test de coordinación bimanual  
- Test de reacciones múltiples
- Test de reactimetría simple
- Test resistencia a la monotonía
- Test de visión y audición (o Test de visión y audición técnico)
- Test de palancas (o Test palanca)
- Test de punteado (o Test punteo)

IMPORTANTE: Extrae TODOS los tests que aparezcan en el documento, aunque no estén en la lista anterior.

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "resultado_general": "APROBADO" | "REPROBADO",
  "nombre_paciente": "nombre si aparece",
  "rut_paciente": "RUT si aparece",
  "fecha_examen": "fecha si aparece",
  "tipo_examen": "tipo si aparece",
  "tests": [
    {
      "nombre": "nombre exacto del test",
      "campo": "campo_normalizado",
      "resultado": "APROBADO" | "REPROBADO",
      "detalle": "datos numéricos relevantes en una línea"
    }
  ]
}

Para el campo "campo_normalizado" usa estos valores según el test:
- "psico_velocidad_anticipacion" para test de velocidad de anticipación
- "psico_coordinacion_bimanual" para coordinación bimanual
- "psico_reacciones_multiples" para reacciones múltiples
- "psico_reactimetria" para reactimetría simple
- "psico_resistencia_monotonia" para resistencia a la monotonía
- "psico_vision_audicion" para visión y audición
- "psico_palancas" para test de palancas
- "psico_punteado" para test de punteado
- Para otros tests, usa "psico_" + nombre_en_snake_case

No incluyas explicaciones, solo el JSON.`

        // Llamar a Gemini Vision API
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: base64
                                }
                            },
                            { text: prompt }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 2048,
                    }
                })
            }
        )

        if (!geminiResponse.ok) {
            const errText = await geminiResponse.text()
            console.error('Gemini error:', errText)
            return NextResponse.json({ error: 'Error al procesar con Gemini', detail: errText }, { status: 502 })
        }

        const geminiData = await geminiResponse.json()
        const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || ''

        // Limpiar el texto y parsear JSON
        const jsonMatch = rawText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            return NextResponse.json({ error: 'No se pudo extraer JSON de la respuesta', raw: rawText }, { status: 422 })
        }

        const extracted = JSON.parse(jsonMatch[0])
        return NextResponse.json({ success: true, data: extracted })

    } catch (err: unknown) {
        console.error('Error en extract-psicotecnico:', err)
        const message = err instanceof Error ? err.message : 'Error desconocido'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
