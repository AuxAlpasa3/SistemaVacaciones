// helpers/date.ts

export const formatDate = (date: Date | string | undefined): string => {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
};

export const formatDateToSpanish = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
        let date: Date;
        if (dateString.includes('-') && dateString.length === 10) {
            const parts = dateString.split('-');
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const day = parseInt(parts[2]);
            date = new Date(year, month, day);
        } else {
            date = new Date(dateString);
        }
        if (isNaN(date.getTime())) return 'N/A';
        const day = date.getDate();
        const month = date.getMonth();
        const year = date.getFullYear();
        const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return `${day} de ${monthNames[month]} de ${year}`;
    } catch {
        return 'N/A';
    }
};

export const formatDateForInput = (date: Date | string | undefined): string => {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};

export const parseDateFromInput = (dateString: string): Date => {
    if (!dateString) {
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        return today;
    }
    
    const [year, month, day] = dateString.split('-').map(Number);
    
    const date = new Date(year, month - 1, day);
    date.setHours(12, 0, 0, 0);
    
    return date;
};

export const getTodayDate = (): string => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return formatDateForInput(today);
};

export const formatTime = (date: Date | string, format: string = 'HH:mm:ss'): string => {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    const hours12 = d.getHours() % 12 || 12;
    const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
    
    return format
        .replace('HH', hours)
        .replace('hh', String(hours12).padStart(2, '0'))
        .replace('mm', minutes)
        .replace('ss', seconds)
        .replace('a', ampm)
        .replace('A', ampm);
};

export const formatTime12Hour = (date: Date | string): string => {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const hours = d.getHours() % 12 || 12;
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
    
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};

export const getCurrentTime = (): string => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
};

export const formatDateTime = (date: Date | undefined, time: Date | undefined): string => {
    if (!date || !time) return '-';
    
    try {
        const combinedDate = new Date(date);
        const timeDate = new Date(time);
        
        combinedDate.setHours(
            timeDate.getHours(),
            timeDate.getMinutes(),
            timeDate.getSeconds()
        );
        
        return combinedDate.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false 
        });
    } catch (error) {
        console.error('Error al formatear fecha y hora:', error);
        return '-';
    }
};

export const getYearFromDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.getFullYear().toString();
};

export const parseDateString = (dateString: string): Date | null => {
    try {
        const isoDate = new Date(dateString);
        if (!isNaN(isoDate.getTime())) {
            isoDate.setHours(12, 0, 0, 0);
            return isoDate;
        }

        const parts = dateString.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            const date = new Date(year, month, day);
            date.setHours(12, 0, 0, 0);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }

        const parts2 = dateString.split('/');
        if (parts2.length === 3) {
            const month = parseInt(parts2[0], 10) - 1;
            const day = parseInt(parts2[1], 10);
            const year = parseInt(parts2[2], 10);
            const date = new Date(year, month, day);
            date.setHours(12, 0, 0, 0);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }

        return null;
    } catch (error) {
        console.error('Error parsing date:', error);
        return null;
    }
};

export const isValidDate = (date: Date | string): boolean => {
    const d = new Date(date);
    return !isNaN(d.getTime());
};

export const formatDateForServer = (date: Date | string | undefined): string => {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};

export const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        return dateString;
    }
    
    const [year, month, day] = dateString.split('-');
    if (year && month && day) {
        return `${day}/${month}/${year}`;
    }
    
    return dateString;
};

export const parseLocalDate = (
    value: Date | string | null | undefined
): Date | null => {

    if (!value) {
        return null;
    }

    if (value instanceof Date) {

        if (isNaN(value.getTime())) {
            return null;
        }

        const result = new Date(value);

        result.setHours(12, 0, 0, 0);

        return result;
    }

    const texto =
        String(value)
            .trim();

    if (!texto) {
        return null;
    }

    const isoMatch =
        texto.match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );

    if (isoMatch) {

        const year =
            Number(isoMatch[1]);

        const month =
            Number(isoMatch[2]);

        const day =
            Number(isoMatch[3]);

        if (
            year <= 0 ||
            month < 1 ||
            month > 12 ||
            day < 1 ||
            day > 31
        ) {
            return null;
        }

        const date =
            new Date(
                year,
                month - 1,
                day,
                12,
                0,
                0,
                0
            );

        if (
            date.getFullYear() !== year ||
            date.getMonth() + 1 !== month ||
            date.getDate() !== day
        ) {
            return null;
        }

        return date;
    }

    const slashMatch =
        texto.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
        );

    if (slashMatch) {

        const day =
            Number(slashMatch[1]);

        const month =
            Number(slashMatch[2]);

        const year =
            Number(slashMatch[3]);

        const date =
            new Date(
                year,
                month - 1,
                day,
                12,
                0,
                0,
                0
            );

        if (
            date.getFullYear() !== year ||
            date.getMonth() + 1 !== month ||
            date.getDate() !== day
        ) {
            return null;
        }

        return date;
    }

    const date =
        new Date(texto);

    if (
        isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    date.setHours(
        12,
        0,
        0,
        0
    );

    return date;
};


export const getYearNumberFromDate = (
    value: Date | string | null | undefined
): number | null => {

    const date =
        parseLocalDate(
            value
        );

    if (!date) {
        return null;
    }

    const year =
        date.getFullYear();

    if (
        !Number.isFinite(year) ||
        year <= 0
    ) {
        return null;
    }

    return year;
};


export const getMonthNumberFromDate = (
    value: Date | string | null | undefined
): number | null => {

    const date =
        parseLocalDate(
            value
        );

    if (!date) {
        return null;
    }

    return (
        date.getMonth() + 1
    );
};


export const formatLocalDate = (
    value: Date | string | null | undefined
): string => {

    const date =
        parseLocalDate(
            value
        );

    if (!date) {
        return 'N/A';
    }

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            '0'
        );

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            '0'
        );

    const year =
        date.getFullYear();

    return `${day}/${month}/${year}`;
};
