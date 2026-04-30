import { apiService } from '../api/apiService';

interface GenerarPDFResponse {
    status: boolean;
    message?: string;
    pdfContent?: string;
    fileName?: string;
}

interface BoletaPDF {
    IdBoletasEnc: number | string;
    IdBoletas: string;
}

export const generarPDFBoleta = async (idBoletaEnc: number | string): Promise<Blob | null> => {
    try {
        const id = typeof idBoletaEnc === 'string' ? parseInt(idBoletaEnc, 10) : idBoletaEnc;
        
        const response = await apiService.post<GenerarPDFResponse>('/ReporteBoletas/generarPDFBoleta.php', {
            idBoletaEnc: id
        });

        if (response.status && response.pdfContent) {
            const byteCharacters = atob(response.pdfContent);
            const byteNumbers = new Array(byteCharacters.length);
            
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            return new Blob([byteArray], { type: 'application/pdf' });
        }
        
        return null;
    } catch (error) {
        console.error('Error generando PDF:', error);
        return null;
    }
};

export const generarPDFsBoletas = async (
    boletas: Array<{ IdBoletasEnc: number | string; IdBoletas: string }>
): Promise<Map<number | string, Blob>> => {
    const pdfsMap = new Map<number | string, Blob>();
    
    const chunkSize = 5;
    for (let i = 0; i < boletas.length; i += chunkSize) {
        const chunk = boletas.slice(i, i + chunkSize);
        const promises = chunk.map(async (boleta) => {
            const pdfBlob = await generarPDFBoleta(boleta.IdBoletasEnc);
            if (pdfBlob) {
                pdfsMap.set(boleta.IdBoletasEnc, pdfBlob);
            }
        });
        
        await Promise.all(promises);
    }
    
    return pdfsMap;
};