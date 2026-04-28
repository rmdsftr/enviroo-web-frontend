import React from "react";
import { FaCheck } from "react-icons/fa6";
import "../styles/filter-pill.css";

export interface FilterOption {
    label: string;
    value: any;
}

interface FilterPillProps {
    options: FilterOption[];
    activeValue: any;
    onChange: (value: any) => void;
}

const FilterPill: React.FC<FilterPillProps> = ({ options, activeValue, onChange }) => {
    return (
        <div className="n-filter-pills">
            {options.map((opt) => (
                <button
                    key={String(opt.value)}
                    className={`n-filter-pill ${activeValue === opt.value ? "active" : ""}`}
                    onClick={() => onChange(opt.value)}
                >
                    {activeValue === opt.value && <FaCheck className="n-filter-pill-check" />}
                    {opt.label}
                </button>
            ))}
        </div>
    );
};

export default FilterPill;
