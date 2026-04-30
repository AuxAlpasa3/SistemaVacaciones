// helpers/excelDate.ts
import { parseDateString, formatDateForInput } from './date';

export const parseExcelDate = (excelDate: any): Date => {
    if (!excelDate || excelDate === '00/01/1900') {
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        return today;
    }

    let fecha: Date | null = null;

    // CASO 1: Número serial de Excel
    if (typeof excelDate === 'number' || (!isNaN(Number(excelDate)) && typeof excelDate !== 'string')) {
        const serial = Number(excelDate);
        // Excel fecha base: 1900-01-01
        const excelEpoch = new Date(1899, 11, 31); // 1899-12-31
        const adjustedSerial = serial > 60 ? serial - 1 : serial; // Bug de Excel
        fecha = new Date(excelEpoch);
        fecha.setDate(excelEpoch.getDate() + adjustedSerial);
        fecha.setHours(12, 0, 0, 0);
    }
    // CASO 2: String en formato DD/MM/YYYY (el más común en Excel)
    else if (typeof excelDate === 'string' && excelDate.includes('/')) {
        const partes = excelDate.split('/');
        if (partes.length === 3) {
            let dia = parseInt(partes[0], 10);
            let mes = parseInt(partes[1], 10) - 1;
            let año = parseInt(partes[2], 10);
            
            // CORRECCIÓN CRÍTICA: Convertir años 19xx a 20xx
            if (año >= 0 && año < 100) {
                año = 2000 + año; // 25 -> 2025
            } else if (año >= 1900 && año < 2000) {
                año = 2000 + (año - 1900); // 1926 -> 2026
            }
            
            fecha = new Date(año, mes, dia, 12, 0, 0);
        }
    }
    // CASO 3: String en formato DD-MM-YYYY
    else if (typeof excelDate === 'string' && excelDate.includes('-')) {
        const partes = excelDate.split('-');
        if (partes.length === 3) {
            let dia = parseInt(partes[0], 10);
            let mes = parseInt(partes[1], 10) - 1;
            let año = parseInt(partes[2], 10);
            
            if (año >= 0 && año < 100) {
                año = 2000 + año;
            } else if (año >= 1900 && año < 2000) {
                año = 2000 + (año - 1900);
            }
            
            fecha = new Date(año, mes, dia, 12, 0, 0);
        }
    }

    // Si no se pudo parsear, intentar con el helper existente
    if (!fecha || isNaN(fecha.getTime())) {
        const parsed = parseDateString(excelDate?.toString() || '');
        if (parsed) {
            parsed.setHours(12, 0, 0, 0);
            return parsed;
        }
        
        console.warn(`Fecha inválida: ${excelDate}, usando fecha actual`);
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        return today;
    }

    return fecha;
};

/**
 * Formatea una fecha para enviar al servidor en formato YYYY-MM-DD
 * Asegura que se envíe la fecha correcta sin problemas de zona horaria
 */
export const formatDateForServer = (date: Date | string | undefined): string => {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    
    // Usar el helper existente pero asegurar que sea YYYY-MM-DD
    return formatDateForInput(d);
};

/**
 * Convierte un array de boletas formateando todas las fechas para el servidor
 */
export const prepareBoletasForServer = (boletas: any[]): any[] => {
    return boletas.map(boleta => ({
        ...boleta,
        FechaCita: boleta.FechaCita ? formatDateForServer(boleta.FechaCita) : null,
        FechaFinalEmbarque: boleta.FechaFinalEmbarque ? formatDateForServer(boleta.FechaFinalEmbarque) : null,
        FechaLlegada: boleta.FechaLlegada ? formatDateForServer(boleta.FechaLlegada) : null,
        FechaIngreso: boleta.FechaIngreso ? formatDateForServer(boleta.FechaIngreso) : null,
        FechaEgreso: boleta.FechaEgreso ? formatDateForServer(boleta.FechaEgreso) : null,
    }));
};