import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import "../styles/searchable-input.css";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SearchableOption<T> {
    value: T;
    label: string;
    raw?: unknown;
}

interface SearchableInputProps<T> {
    value: string;
    onChange: (text: string) => void;
    onSelect: (option: SearchableOption<T> | null) => void;
    onSearch: (query: string) => Promise<SearchableOption<T>[]>;

    debounceMs?: number;
    placeholder?: string;
    inputSize?: "small" | "default" | "large";
    isRounded?: boolean;
    fullWidth?: boolean;
    disabled?: boolean;
    className?: string;
    renderOption?: (option: SearchableOption<T>) => React.ReactNode;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SearchableInput<T>({
    value,
    onChange,
    onSelect,
    onSearch,
    debounceMs = 400,
    placeholder = "Ketik untuk mencari...",
    inputSize = "default",
    isRounded = false,
    fullWidth = false,
    disabled = false,
    className = "",
    renderOption,
}: SearchableInputProps<T>) {
    const [options, setOptions] = useState<SearchableOption<T>[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // ── Posisi menu (sama seperti Dropdown pakai portal) ──────────────────────
    const updateMenuPos = () => {
        if (!wrapperRef.current) return;
        const rect = wrapperRef.current.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    };

    useEffect(() => {
        if (isOpen) updateMenuPos();
    }, [isOpen]);

    // ── Debounce search ───────────────────────────────────────────────────────
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!value.trim()) {
            setOptions([]);
            setIsOpen(false);
            setActiveIndex(-1);
            onSelect(null);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const results = await onSearch(value);
                setOptions(results);
                setIsOpen(results.length > 0);
                setActiveIndex(-1);
                updateMenuPos();
            } catch {
                setOptions([]);
                setIsOpen(false);
            } finally {
                setLoading(false);
            }
        }, debounceMs);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [value, debounceMs]);

    // ── Tutup kalau klik di luar ──────────────────────────────────────────────
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            const inWrapper = wrapperRef.current?.contains(target);
            const inMenu = menuRef.current?.contains(target);
            if (!inWrapper && !inMenu) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        onSelect(null);
    };

    const handleSelect = useCallback((option: SearchableOption<T>) => {
        onChange(option.label);
        onSelect(option);
        setIsOpen(false);
        setActiveIndex(-1);
    }, [onChange, onSelect]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex(prev => Math.min(prev + 1, options.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === "Enter" && activeIndex >= 0) {
            e.preventDefault();
            handleSelect(options[activeIndex]);
        } else if (e.key === "Escape") {
            setIsOpen(false);
            setActiveIndex(-1);
        }
    };

    // ── Classes ───────────────────────────────────────────────────────────────
    const containerClass = [
        "si-container",
        `si--${inputSize}`,
        isRounded ? "si--rounded" : "",
        fullWidth ? "si--full" : "",
        disabled ? "si--disabled" : "",
        className,
    ].filter(Boolean).join(" ");

    const inputClass = [
        "si-input",
        loading ? "si-input--loading" : "",
    ].filter(Boolean).join(" ");

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className={containerClass} ref={wrapperRef}>
            <div className="si-input-wrapper">
                <input
                    className={inputClass}
                    placeholder={placeholder}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    disabled={disabled}
                />

                {loading && (
                    <span className="si-loading-indicator">
                        <span className="si-spinner" />
                        Mencari...
                    </span>
                )}
            </div>

            {isOpen && createPortal(
                <div
                    ref={menuRef}
                    className="si-menu-wrapper open"
                    style={{
                        position: "fixed",
                        top: menuPos.top,
                        left: menuPos.left,
                        width: menuPos.width,
                        zIndex: 99999,
                    }}
                >
                    <div className="si-menu">
                        {options.length > 0 ? (
                            options.map((option, index) => (
                                <div
                                    key={String(option.value)}
                                    className={`si-item ${index === activeIndex ? "active" : ""}`}
                                    onMouseDown={() => handleSelect(option)}
                                    onMouseEnter={() => setActiveIndex(index)}
                                >
                                    <span className="si-item-label">
                                        {renderOption ? renderOption(option) : option.label}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="si-empty">Tidak ada hasil</div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}