import type { ElementType } from "react";
import "../styles/statistik.css";

type Variant = "default" | "success" | "warning" | "danger" | "teal";

interface Props {
    icon: ElementType;
    angka: number | string;
    status: string;
    deskripsi?: string;
    variant?: Variant;
    satuan?: string;
    onClick?: () => void;
}

export default function StatistikLayout({
    icon: Icon,
    angka,
    status,
    deskripsi,
    variant = "default" as Variant,
    satuan,
    onClick,
}: Props) {
    const formattedAngka =
        typeof angka === "number" ? angka.toLocaleString("id-ID") : angka;

    return (
        <div
            className={`stat-card stat-card--${variant}${onClick ? " stat-card--clickable" : ""}`}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
        >
            <div className="stat-icon">
                <Icon />
            </div>

            <div className="stat-body">
                <div className="stat-number-row">
                    <span className="stat-number">{formattedAngka}</span>
                    {satuan && <span className="stat-satuan">{satuan}</span>}
                </div>
                <span className="stat-status">{status}</span>
                {deskripsi && <p className="stat-desc">{deskripsi}</p>}
            </div>
        </div>
    );
}