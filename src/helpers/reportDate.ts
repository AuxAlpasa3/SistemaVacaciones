export const parseReportDate = (
    value: string | Date | null | undefined
): Date | null => {

    if (!value) {
        return null;
    }

    if (value instanceof Date) {

        if (isNaN(value.getTime())) {
            return null;
        }

        return new Date(
            value.getFullYear(),
            value.getMonth(),
            value.getDate(),
            12,
            0,
            0,
            0
        );
    }

    const text =
        String(value)
            .trim();

    if (!text) {
        return null;
    }

    const iso =
        text.match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );

    if (iso) {

        const year =
            Number(iso[1]);

        const month =
            Number(iso[2]);

        const day =
            Number(iso[3]);

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

    const normal =
        new Date(text);

    if (
        isNaN(
            normal.getTime()
        )
    ) {
        return null;
    }

    normal.setHours(
        12,
        0,
        0,
        0
    );

    return normal;
};


export const getReportYear = (
    value: string | Date | null | undefined
): number | null => {

    const date =
        parseReportDate(
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


export const getReportMonth = (
    value: string | Date | null | undefined
): number | null => {

    const date =
        parseReportDate(
            value
        );

    if (!date) {
        return null;
    }

    return (
        date.getMonth() + 1
    );
};


export const formatReportDate = (
    value: string | Date | null | undefined
): string => {

    const date =
        parseReportDate(
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