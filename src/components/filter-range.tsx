import { useState, useRef, useEffect } from "react";
import "../styles/filter-range.css";

const MONTH_ID = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const NOW_YEAR = new Date().getFullYear();
const YEARS = [NOW_YEAR - 2, NOW_YEAR - 1, NOW_YEAR];

function parse(yyyymm: string) {
    const [y, m] = yyyymm.split("-").map(Number);
    return { y, m };
}
function fmt(y: number, m: number) {
    return `${y}-${String(m).padStart(2, "0")}`;
}

export function defaultMonthRange() {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth() + 1;
    const to = fmt(y, m);
    const fromDate = new Date(y, now.getMonth() - 2, 1);
    const from = fmt(fromDate.getFullYear(), fromDate.getMonth() + 1);
    return { from, to };
}

const ChevronIcon = () => (
    <svg viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

interface RangeSelectProps {
    options: { label: string; value: number }[];
    value: number;
    onChange: (v: number) => void;
}

function RangeSelect({ options, value, onChange }: RangeSelectProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const selected = options.find((o) => o.value === value);

    return (
        <div className="fr-select" ref={ref}>
            <button
                type="button"
                className={`fr-trigger${open ? " open" : ""}`}
                onClick={() => setOpen((v) => !v)}
            >
                {selected?.label}
                <ChevronIcon />
            </button>
            {open && (
                <div className="fr-dropdown">
                    {options.map((o) => (
                        <button
                            key={o.value}
                            type="button"
                            className={`fr-option${o.value === value ? " active" : ""}`}
                            onClick={() => { onChange(o.value); setOpen(false); }}
                        >
                            {o.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

const MONTH_OPTIONS = MONTH_ID.map((label, i) => ({ label, value: i + 1 }));
const YEAR_OPTIONS = YEARS.map((y) => ({ label: String(y), value: y }));

interface FilterRangeProps {
    from: string;
    to: string;
    onChange: (from: string, to: string) => void;
}

export default function FilterRange({ from, to, onChange }: FilterRangeProps) {
    const { y: fy, m: fm } = parse(from);
    const { y: ty, m: tm } = parse(to);

    const setFrom = (y: number, m: number) => {
        const next = fmt(y, m);
        onChange(next, next > to ? next : to);
    };
    const setTo = (y: number, m: number) => {
        const next = fmt(y, m);
        onChange(next < from ? next : from, next);
    };

    return (
        <div className="filter-range">
            <div className="filter-range-group">
                <RangeSelect options={MONTH_OPTIONS} value={fm} onChange={(m) => setFrom(fy, m)} />
                <RangeSelect options={YEAR_OPTIONS} value={fy} onChange={(y) => setFrom(y, fm)} />
            </div>
            <span className="filter-range-sep">—</span>
            <div className="filter-range-group">
                <RangeSelect options={MONTH_OPTIONS} value={tm} onChange={(m) => setTo(ty, m)} />
                <RangeSelect options={YEAR_OPTIONS} value={ty} onChange={(y) => setTo(y, tm)} />
            </div>
        </div>
    );
}
