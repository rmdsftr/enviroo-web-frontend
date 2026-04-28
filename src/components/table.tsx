import { type ReactNode } from "react";
import "../styles/table.css";

// ── Column definition ──────────────────────────────────────
export type ColumnDef<T> = {
    key: string;
    header: string;
    width?: string;
    align?: "left" | "center" | "right";
    render: (row: T, index: number) => ReactNode;
};

// ── Table props ────────────────────────────────────────────
type TableProps<T> = {
    columns: ColumnDef<T>[];
    data: T[];
    rowKey: (row: T) => string | number;
    emptyMessage?: string;
    onRowClick?: (row: T) => void;
};

// ── Main component ─────────────────────────────────────────
export default function Table<T>({
    columns,
    data,
    rowKey,
    emptyMessage = "Tidak ada data.",
    onRowClick,
}: TableProps<T>) {
    return (
        <div className="table-wrapper">
            <table className="table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                style={{
                                    width: col.width,
                                    textAlign: col.align ?? "left",
                                }}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="table-empty"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((row, i) => (
                            <tr
                                key={rowKey(row)}
                                onClick={() => onRowClick?.(row)}
                                style={onRowClick ? { cursor: "pointer" } : undefined}
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        style={{ textAlign: col.align ?? "left" }}
                                    >
                                        {col.render(row, i)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

// ── Reusable cell helpers (export untuk dipakai di halaman) ─

/** Foto bulat */
export function TableAvatar({ src, alt }: { src?: string; alt: string }) {
    return (
        <div className="table-avatar">
            {src ? (
                <img src={src} alt={alt} />
            ) : (
                <span className="table-avatar-fallback">
                    {alt.charAt(0).toUpperCase()}
                </span>
            )}
        </div>
    );
}

/** Status badge */
export function TableBadge({
    label,
    active,
}: {
    label: string;
    active: boolean;
}) {
    return (
        <span className={`table-badge ${active ? "table-badge--active" : "table-badge--inactive"}`}>
            <span className="table-badge-dot" />
            {label}
        </span>
    );
}

/** Tombol aksi icon */
export function TableActionBtn({
    icon: Icon,
    onClick,
    title,
}: {
    icon: React.ElementType;
    onClick?: () => void;
    title?: string;
}) {
    return (
        <button
            className="table-action-btn"
            onClick={onClick}
            title={title}
            type="button"
        >
            <Icon />
        </button>
    );
}