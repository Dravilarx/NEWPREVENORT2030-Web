/**
 * Habilidad E: Formateador_RUT_Chile
 * 
 * Este skill gestiona el formato visual de los RUTs chilenos (XX.XXX.XXX-X)
 * asegurando la limpieza de los datos ingresados y su estandarización.
 */

/**
 * Limpia y formatea un RUT chileno de forma continua (para onChange).
 * Ejemplo: "12345678" -> "1.234.567-8"
 */
export const formatearRUT = (value: string): string => {
    let clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (clean.length === 0) return '';
    if (clean.length === 1) return clean;

    const dv = clean.slice(-1);
    let cuerpo = clean.slice(0, -1);

    if (cuerpo.length > 0) {
        let formattedCuerpo = '';
        while (cuerpo.length > 3) {
            formattedCuerpo = '.' + cuerpo.slice(-3) + formattedCuerpo;
            cuerpo = cuerpo.slice(0, -3);
        }
        formattedCuerpo = cuerpo + formattedCuerpo;
        return `${formattedCuerpo}-${dv}`;
    }

    return dv;
};

/**
 * Normaliza un RUT al estándar oficial del proyecto (XX.XXX.XXX-X).
 * Incluye acolchado con ceros a la izquierda y cálculo de DV si falta.
 * Ejemplo: "6089115" -> "06.089.115-0"
 */
export const normalizarRUT = (value: string): string => {
    if (!value) return '';

    const clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (clean.length === 0) return '';

    let body = '';
    let dv = '';

    // Lógica de separación
    if (value.includes('-')) {
        const parts = value.split('-');
        body = parts[0].replace(/\D/g, '');
        dv = parts[1].trim().toUpperCase().charAt(0);
    } else if (clean.length >= 8) {
        dv = clean.slice(-1);
        body = clean.slice(0, -1);
    } else {
        body = clean;
        dv = calcularDV(body);
    }

    // Acolchar cuerpo a 8 dígitos (06089115)
    const paddedBody = body.padStart(8, '0');

    return `${paddedBody.slice(0, 2)}.${paddedBody.slice(2, 5)}.${paddedBody.slice(5, 8)}-${dv}`;
};

/**
 * Calcula el dígito verificador de un cuerpo de RUT
 */
export const calcularDV = (cuerpo: string): string => {
    let suma = 0;
    let multiplo = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo.charAt(i)) * multiplo;
        multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }

    const valor = 11 - (suma % 11);
    if (valor === 11) return '0';
    if (valor === 10) return 'K';
    return valor.toString();
};

/**
 * Valida si un RUT es válido (algoritmo módulo 11)
 */
export const validarRUT = (rut: string): boolean => {
    const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
    if (cleanRut.length < 2) return false;

    const dv = cleanRut.slice(-1);
    const cuerpo = cleanRut.slice(0, -1);

    return calcularDV(cuerpo) === dv;
};
