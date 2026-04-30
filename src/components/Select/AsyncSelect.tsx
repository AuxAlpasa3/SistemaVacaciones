import AsyncSelect from 'react-select/async';
import type { StylesConfig, SingleValue, MultiValue, MenuPlacement } from 'react-select';
import type { OptionType } from '../../interfaces/OptionType';

const modalMenuStyles: StylesConfig<OptionType> = {
    menuPortal: (base) => ({
        ...base,
        zIndex: 99999
    }),
    menu: (base) => ({
        ...base,
        maxHeight: 'none',
        height: 'auto'
    }),
    menuList: (base) => ({
        ...base,
        maxHeight: '220px'
    })
};



type ReactAsyncSelectProps = {
    handleChange: (selected: SingleValue<OptionType> | MultiValue<OptionType> | null) => void;
    selectedOption: SingleValue<OptionType> | MultiValue<OptionType>;
    isMulti?: boolean;
    isClearable?: boolean;
    placeholder?: string;
    fetchUrl: string;
    menuPlacement?: MenuPlacement;
    isRequired?: boolean;
    tamanoParaBuscar?: number;
};

const ReactAsyncSelect = ({
    handleChange,
    selectedOption,
    placeholder = "Buscar...",
    isMulti = false,
    isClearable = true,
    fetchUrl,
    menuPlacement = 'auto',
    isRequired = false,
    tamanoParaBuscar = 4
}: ReactAsyncSelectProps) => {

    const loadOptions = (inputValue: string, callback: (options: OptionType[]) => void) => {

        
        if (inputValue.length < tamanoParaBuscar) {
            callback([]);
            return;
        }

        fetch(`${fetchUrl}?search=${encodeURIComponent(inputValue)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(result => {
                if (result.status && result.data) {
                    const formattedOptions: OptionType[] = result.data.map((item: any) => ({
                        ...item,
                        label: item.label,
                        value: item.value
                    }));
                    callback(formattedOptions);
                } else {
                    callback([]);
                }
            })
            .catch(() => {
                callback([]);
            });
    };

    return (
        <div style={{ width: "100%" }}>
            <AsyncSelect
                value={selectedOption}
                onChange={(newValue) => {
                    handleChange(newValue);
                }}
                isMulti={isMulti}
                isClearable={isClearable}
                closeMenuOnSelect={!isMulti}
                loadOptions={loadOptions}
                cacheOptions
                defaultOptions={false}
                placeholder={placeholder}
                loadingMessage={() => "Buscando..."}
                noOptionsMessage={({ inputValue }) =>
                    inputValue.length < tamanoParaBuscar ? "Escribe para buscar" : "No se encontraron opciones"
                }
                menuPortalTarget={document.body}
                menuPlacement={menuPlacement}
                styles={modalMenuStyles}
                required={isRequired}
            />
        </div>
    );
};

export default ReactAsyncSelect;