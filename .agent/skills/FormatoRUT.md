---
name: Estandarización de RUT Chileno
description: Skill para formatear RUTs chilenos al estándar oficial del proyecto (00.000.000-0), manejando entradas con o sin puntos, guiones y dígito verificador.
---

# Estandarización de RUT Chileno

Este skill define la norma para el manejo y formateo de RUTs (Rol Único Tributario) en la plataforma Prevenort. El objetivo es asegurar que todos los RUTs almacenados y mostrados sigan el formato premium de 12 caracteres.

## 1. Formato Objetivo
El formato estándar es: `XX.XXX.XXX-X`
*   **Acolchado**: Siempre debe tener 8 dígitos antes del guion (usando un cero inicial si es necesario).
*   **Separadores**: Puntos para los miles y guion para el dígito verificador.
*   **Dígito Verificador (DV)**: Siempre en mayúscula (si es 'K').

**Ejemplo**: `06.089.115-0`

## 2. Lógica de Procesamiento
Cada vez que un asistente o el sistema procese un RUT, debe seguir este algoritmo:

1.  **Limpieza**: Eliminar cualquier carácter que no sea número o la letra 'K' (mayúscula o minúscula).
2.  **Identificación del DV**:
    *   Si el RUT ingresado tiene un guion, el carácter después del guion es el DV.
    *   Si no tiene guion y tiene 8 o 9 caracteres, el último es el DV.
    *   Si tiene 7 caracteres o menos y no hay guion, se asume que falta el DV y se debe calcular usando el algoritmo de Módulo 11.
3.  **Normalización**:
    *   Cuerpo del RUT: Los dígitos antes del DV.
    *   Acolchado: Rellenar con ceros a la izquierda hasta que el cuerpo tenga 8 dígitos.
4.  **Ensamblado**: Aplicar los puntos y el guion.

## 3. Implementación de Referencia (JS/TS)

```typescript
export function formatRUT(rut: string): string {
    if (!rut) return '';
    
    // 1. Limpieza
    let clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (clean.length === 0) return '';

    let body: string;
    let dv: string;

    // 2. Lógica de separación (heurística simple)
    if (rut.includes('-')) {
        const parts = rut.split('-');
        body = parts[0].replace(/\D/g, '');
        dv = parts[1].trim().toUpperCase().charAt(0);
    } else if (clean.length >= 8) {
        dv = clean.slice(-1);
        body = clean.slice(0, -1);
    } else {
        body = clean;
        dv = calculateChileanDV(body);
    }

    // 3. Normalización y Acolchado
    const paddedBody = body.padStart(8, '0');

    // 4. Formateo final
    return `${paddedBody.slice(0, 2)}.${paddedBody.slice(2, 5)}.${paddedBody.slice(5, 8)}-${dv}`;
}

function calculateChileanDV(body: string): string {
    let sum = 0;
    let multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const res = 11 - (sum % 11);
    if (res === 11) return '0';
    if (res === 10) return 'K';
    return res.toString();
}
```

## 4. Uso en Formularios
En los componentes de React (`admision/page.tsx`, `config/page.tsx`), se recomienda aplicar este formato en el evento `onBlur` o antes de enviar los datos a Supabase para mantener la integridad de la base de datos.
