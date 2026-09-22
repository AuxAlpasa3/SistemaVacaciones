export type ValorMultiSelect = string | number;

export interface OpcionMultiSelect<T extends ValorMultiSelect> {
    value: T;
    label: string;
}

export interface MultiSelectProps<T extends ValorMultiSelect> {
    options: OpcionMultiSelect<T>[];
    selected: T[];
    onChange: (values: T[]) => void;
    placeholder?: string;
}