import { useState, useRef, useEffect, type SelectHTMLAttributes } from "react";
import { FaChevronDown, FaCheck } from "react-icons/fa6";
import "../styles/dropdown.css";

interface DropdownProps extends SelectHTMLAttributes<HTMLSelectElement> {
    options: { label: string; value: string | number }[];
    placeholder?: string;
    fullWidth?: boolean;
    dropdownSize?: "default" | "large";
    isRounded?: boolean;
}

export default function Dropdown({
    options,
    placeholder = "Pilih salah satu...",
    fullWidth = false,
    dropdownSize = "default",
    isRounded = false,
    className = "",
    value,
    onChange,
    disabled = false,
    ...rest
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleOptionSelect = (val: string | number) => {
        if (onChange) {
            const event = {
                target: { value: val.toString(), name: rest.name },
                currentTarget: { value: val.toString(), name: rest.name }
            } as React.ChangeEvent<HTMLSelectElement>;
            onChange(event);
        }
        setIsOpen(false);
    };

    const selectedOption = options.find((opt) => opt.value === value);

    const classes = [
        "custom-dropdown-container",
        `dropdown--${dropdownSize}`,
        isRounded ? "dropdown--rounded" : "",
        fullWidth ? "dropdown--full" : "",
        disabled ? "dropdown--disabled" : "",
        isOpen ? "dropdown--open" : "",
        className,
    ].filter(Boolean).join(" ");

    return (
        <div className={classes} ref={containerRef}>
            <div 
                className="custom-dropdown-header" 
                onClick={() => !disabled && setIsOpen(!isOpen)}
                tabIndex={disabled ? -1 : 0}
            >
                <span className={`custom-dropdown-value ${!selectedOption ? "placeholder" : ""}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <span className="dropdown-icon">
                    <FaChevronDown />
                </span>
            </div>
            
            <div className={`custom-dropdown-menu-wrapper ${isOpen ? "open" : ""}`}>
                <div className="custom-dropdown-menu">
                    {options.length > 0 ? (
                        options.map((opt) => {
                            const isSelected = opt.value === value;
                            return (
                                <div
                                    key={opt.value}
                                    className={`custom-dropdown-item ${isSelected ? "selected" : ""}`}
                                    onClick={() => handleOptionSelect(opt.value)}
                                >
                                    <span className="item-label">{opt.label}</span>
                                    {isSelected && <FaCheck className="item-check" />}
                                </div>
                            );
                        })
                    ) : (
                        <div className="custom-dropdown-empty">Tidak ada pilihan</div>
                    )}
                </div>
            </div>

            {/* Hidden select for form compatibility */}
            <select 
                style={{ display: 'none' }} 
                value={value} 
                disabled={disabled} 
                onChange={onChange} 
                {...rest}
            >
                <option value="" disabled hidden>{placeholder}</option>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}
