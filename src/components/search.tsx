import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { FaMagnifyingGlass, FaXmark } from "react-icons/fa6";
import "../styles/search.css";

type SearchBarProps = {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    onSearch?: (value: string) => void;
    onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    width?: string;
};

export default function SearchBar({
    placeholder = "Cari sesuatu...",
    value,
    onChange,
    onSearch,
    onKeyDown,
    onFocus,
    onBlur,
    width,
}: SearchBarProps) {
    const [internal, setInternal] = useState("");
    const isControlled = value !== undefined;
    const current = isControlled ? value : internal;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        if (!isControlled) setInternal(v);
        onChange?.(v);
    };

    const handleClear = () => {
        if (!isControlled) setInternal("");
        onChange?.("");
    };

    const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") onSearch?.(current);
        onKeyDown?.(e);
    };

    return (
        <div className="searchbar" style={width ? { width } : undefined}>
            <span className="searchbar-icon">
                <FaMagnifyingGlass />
            </span>
            <input
                type="text"
                className="searchbar-input"
                placeholder={placeholder}
                value={current}
                onChange={handleChange}
                onKeyDown={handleKey}
                onFocus={onFocus}
                onBlur={onBlur}
                aria-label={placeholder}
            />
            {current && (
                <button
                    className="searchbar-clear"
                    onClick={handleClear}
                    aria-label="Clear search"
                    type="button"
                >
                    <FaXmark />
                </button>
            )}
        </div>
    );
}