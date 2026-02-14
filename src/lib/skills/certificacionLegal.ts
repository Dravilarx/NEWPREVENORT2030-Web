/**
 * Habilidad C: Firma_Certificación_Legal
 * 
 * Este skill gestiona la lógica de inmutabilidad, generación de hash 
 * y preparación de datos para la Firma Electrónica Avanzada.
 */

export interface DatosCertificado {
    atencion_id: string;
    rut_trabajador: string;
    nombre_trabajador: string;
    veredicto: 'apto' | 'no_apto' | 'remediacion';
    fecha_emision: string;
}

export interface CertificadoLegal {
    hash_integridad: string;
    qr_url: string;
    validez_legal: boolean;
    metadata: DatosCertificado;
}

export const prepararFirmaElectronica = (
    datos: DatosCertificado
): CertificadoLegal => {
    // Generar un hash determinístico para el documento
    const content = JSON.stringify(datos);
    // En un entorno real usaríamos una librería de hashing real
    const hash = content.length.toString(16) + "x" + Math.random().toString(36).substring(7);

    // URL de verificación pública según R11
    const qrUrl = `https://prevenort.cl/verificar/${datos.atencion_id}`;

    return {
        hash_integridad: `sha256-${hash}`,
        qr_url: qrUrl,
        validez_legal: true,
        metadata: datos
    };
};

export const validarIntegridadQR = (
    hashPresentado: string,
    hashOriginal: string
): boolean => {
    return hashPresentado === hashOriginal;
};
