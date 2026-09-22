import React, {
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import { ChevronDown } from 'lucide-react';
import type {
    MultiSelectProps,
    ValorMultiSelect
} from '../../interfaces/MultiSelect';
import './MultiSelect.css';

export const MultiSelect = <T extends ValorMultiSelect>({
    options,
    selected,
    onChange,
    placeholder = 'TODOS'
}: MultiSelectProps<T>) => {

    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleValue = (value: T) => {
        if (selected.includes(value)) {
            onChange(selected.filter(item => item !== value));
            return;
        }
        onChange([...selected, value]);
    };

    const texto = useMemo(() => {
        if (selected.length === 0) return placeholder;

        if (selected.length === 1) {
            const option = options.find(item => item.value === selected[0]);
            return option?.label ?? String(selected[0]);
        }

        if (selected.length === 2) {
            const labels = selected
                .map(value =>
                    options.find(option => option.value === value)?.label
                )
                .filter(Boolean);

            return labels.join(', ');
        }

        return `${selected.length} seleccionados`;
    }, [options, placeholder, selected]);

    return (
        <div className="multiselect" ref={containerRef}>
            <button
                type="button"
                className={`multiselect-trigger ${open ? 'open' : ''}`}
                onClick={() => setOpen(anterior => !anterior)}
            >
                <span>{texto}</span>
                <ChevronDown size={16} className={open ? 'rotated' : ''} />
            </button>

            {open && (
                <div className="multiselect-menu">
                    <button
                        type="button"
                        className={`multiselect-todos ${
                            selected.length === 0 ? 'active' : ''
                        }`}
                        onClick={() => onChange([])}
                    >
                        TODOS
                    </button>

                    {options.map(option => {
                        const checked = selected.includes(option.value);
                        return (
                            <label
                                key={String(option.value)}
                                className="multiselect-option"
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleValue(option.value)}
                                />
                                <span>{option.label}</span>
                            </label>
                        );
                    })}
                </div>
            )}
        </div>
    );
};