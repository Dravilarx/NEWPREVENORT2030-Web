/**
 * Habilidad E: Formateador_RUT_Chile
 * 
 * Este skill gestiona el formato visual de los RUTs chilenos (XX.XXX.XXX-X)
 * asegurando la limpieza de los datos ingresados y su estandarización.
 */

/**
 * Limpia y formatea un RUT chileno de forma continua.
 * Ejemplo: "123456789" -> "12.345.678-9"
 */
export const formatearRUT = (value: string): string => {
    // 1. Limpiar el valor (dejar solo números y la letra K)
    let cleanValue = value.replace(/[^0-9kK]/g, '').toUpperCase();

    if (cleanValue.length === 0) return '';

    // 2. Separar el dígito verificador y la parte numérica
    const dv = cleanValue.slice(-1);
    let cuerpo = cleanValue.slice(0, -1);

    // 3. Formatear el cuerpo con puntos (si tiene contenido)
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
 * Valida si un RUT es válido (algoritmo módulo 11)
 */
export const validarRUT = (rut: string): boolean => {
    const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
    if (cleanRut.length < 8) return false;

    const dv = cleanRut.slice(-1);
    const cuerpo = cleanRut.slice(0, -1);

    let suma = 0;
    let multiplo = 2;

    for (let i = 1; i <= cuerpo.length; i++) {
        const index = multiplo * parseInt(cleanRut.charAt(cuerpo.length - i));
        suma = suma + index;
        if (multiplo < 7) {
            multiplo = multiplo + 1;
        } else {
            multiplo = 2;
        }
    }

    const dvEsperado = 11 - (suma % 11);
    let dvRes = '';
    if (dvEsperado === 11) dvRes = '0';
    else if (dvEsperado === 10) dvRes = 'K';
    else dvRes = dvEsperado.toString();

    return dvRes === dv;
};
