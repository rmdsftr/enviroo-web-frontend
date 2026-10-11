import React, { useMemo, useState } from "react";
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
    maxVisible?: number;
}

const FilterPill: React.FC<FilterPillProps> = ({ options, activeValue, onChange, maxVisible }) => {
    const [expanded, setExpanded] = useState(false);

    const hiddenCount = maxVisible === undefined ? 0 : Math.max(0, options.length - maxVisible);
    const isLimited = hiddenCount > 0;

    const visibleOptions = useMemo(() => {
        if (maxVisible === undefined || expanded || options.length <= maxVisible) return options;

        const head = options.slice(0, maxVisible);
        if (head.some((opt) => opt.value === activeValue)) return head;

        const active = options.find((opt) => opt.value === activeValue);
        return active ? [...head.slice(0, maxVisible - 1), active] : head;
    }, [options, activeValue, expanded, maxVisible]);

    return (
        <div className="n-filter-pills">
            {visibleOptions.map((opt) => (
                <button
                    key={String(opt.value)}
                    className={`n-filter-pill ${activeValue === opt.value ? "active" : ""}`}
                    onClick={() => onChange(opt.value)}
                >
                    {activeValue === opt.value && <FaCheck className="n-filter-pill-check" />}
                    {opt.label}
                </button>
            ))}
            {isLimited && (
                <button
                    type="button"
                    className="n-filter-pill n-filter-pill-more"
                    onClick={() => setExpanded((prev) => !prev)}
                    aria-expanded={expanded}
                >
                    {expanded ? "Sembunyikan" : `+${hiddenCount} lainnya`}
                </button>
            )}
        </div>
    );
};

export default FilterPill;
