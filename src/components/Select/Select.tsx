import Select from "react-select";
import type { OptionType } from "../../interfaces/OptionType";

const ReactSelect = ({ optionsData, handleChange, selectedOption, isClearable = true, isSearchable = true }: { optionsData: OptionType[], handleChange: any, selectedOption: OptionType, isClearable?: boolean, isSearchable?: boolean }) => {

    return (
        <div style={{ width: "100%" }}>
            <Select
                value={selectedOption}
                onChange={handleChange}
                options={optionsData}
                isClearable={isClearable} // Permite limpiar la selección
                isSearchable={isSearchable} // Habilita el buscador
                placeholder="Buscar..."
                noOptionsMessage={() => "No hay opciones"} // Mensaje si no hay resultados
            />
        </div>
    );
};

export default ReactSelect;