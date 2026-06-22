import { useState, useEffect, useCallback, useMemo } from "react";
import { StatistikService } from "../services/statistik.service";
import type { MasukSampahItem } from "../types/statistik.type";
import FilterRange, { defaultMonthRange } from "./filter-range";
import "../styles/setoran-dashboard.css";

const PALETTE = ["#94DF0C"];
const colorAt = (i: number) => PALETTE[i % PALETTE.length];

function fmtQty(n: number, satuan: string) {
    return `${(n ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })} ${satuan}`;
}

interface Props { bankId: string }

export default function MasukSampahSection({ bankId }: Props) {
    const { from: defFrom, to: defTo } = defaultMonthRange();
    const [from, setFrom] = useState(defFrom);
    const [to,   setTo]   = useState(defTo);
    const [items,   setItems]   = useState<MasukSampahItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    const PREVIEW_COUNT = 5;

    const [fromYear, fromMonth] = from.split("-").map(Number);
    const [toYear,   toMonth]   = to.split("-").map(Number);

    const fetchData = useCallback(async () => {
        if (!bankId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await StatistikService.getMasukSampah(bankId, fromMonth, fromYear, toMonth, toYear);
            setItems(res.data ?? []);
        } catch {
            setError("Gagal memuat data sampah masuk.");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [bankId, fromMonth, fromYear, toMonth, toYear]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const sorted = useMemo(() =>
        [...items].sort((a, b) => (b.total_masuk ?? 0) - (a.total_masuk ?? 0)),
    [items]);

    const maxMasuk = sorted[0]?.total_masuk ?? 1;

    return (
        <div className="ssd-section">
            {/* Header */}
            <div className="ssd-section-header">
                <div className="ssd-section-header-left">
                    <div>
                        <h2 className="ssd-title">Sampah Masuk</h2>
                        <p className="ssd-sub">Total sampah yang diterima dari nasabah beserta stok tersisa</p>
                    </div>
                </div>
                <div className="ssd-section-header-right">
                    <FilterRange from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
                </div>
            </div>
            <hr style={{ border: "none", borderTop: "1px solid #e8f0eb", margin: "0" }} />

            {/* Body */}
            {loading ? (
                <div className="ssd-state">Memuat data...</div>
            ) : error ? (
                <div className="ssd-state ssd-state--error">{error}</div>
            ) : sorted.length === 0 ? (
                <div className="ssd-state">Belum ada data sampah masuk pada periode ini.</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {(expanded ? sorted : sorted.slice(0, PREVIEW_COUNT)).map((item, i) => {
                        const pct     = maxMasuk > 0 ? ((item.total_masuk ?? 0) / maxMasuk) * 100 : 0;
                        const sisaPct = (item.total_masuk ?? 0) > 0
                            ? ((item.stok_tersisa ?? 0) / (item.total_masuk ?? 1)) * 100
                            : 0;
                        const color = colorAt(i);

                        return (
                            <div key={item.sampah_id} style={{
                                display: "grid",
                                gridTemplateColumns: "1fr auto",
                                gap: "14px",
                                alignItems: "center",
                                padding: "10px 14px",
                                borderRadius: "10px",
                                border: "1px solid #e8f0eb",
                            }}>
                                {/* Left */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#0f1f15",
                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {item.nama_sampah}
                                        </span>
                                        <span style={{ fontSize: "10px", color: "#7a9e8a",
                                            background: "rgba(78,167,113,0.08)", padding: "1px 6px",
                                            borderRadius: "99px", flexShrink: 0 }}>
                                            {item.kategori}
                                        </span>
                                    </div>

                                    {/* Bar track: total_masuk sebagai bar penuh, stok_tersisa overlay */}
                                    <div style={{ position: "relative", height: "10px", borderRadius: "99px",
                                        background: "#e8f0eb", overflow: "hidden" }}>
                                        {/* Total masuk bar */}
                                        <div style={{ position: "absolute", left: 0, top: 0,
                                            height: "100%", width: `${pct}%`,
                                            background: `${color}40`, borderRadius: "99px",
                                            transition: "width 0.4s ease" }} />
                                        {/* Stok tersisa overlay */}
                                        <div style={{ position: "absolute", left: 0, top: 0,
                                            height: "100%", width: `${(sisaPct / 100) * pct}%`,
                                            background: color, borderRadius: "99px",
                                            transition: "width 0.4s ease" }} />
                                    </div>

                                    <div style={{ display: "flex", gap: "12px" }}>
                                        <span style={{ fontSize: "10.5px", color: "#a0b5a8" }}>
                                            Masuk: <strong style={{ color: "#4a5f52" }}>{fmtQty(item.total_masuk, item.satuan)}</strong>
                                        </span>
                                        <span style={{ fontSize: "10.5px", color: "#a0b5a8" }}>
                                            Sisa: <strong style={{ color: "#4EA771" }}>{fmtQty(item.stok_tersisa, item.satuan)}</strong>
                                        </span>
                                    </div>
                                </div>

                                {/* Right: persentase tersisa */}
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#013236" }}>
                                        {sisaPct.toFixed(0)}%
                                    </span>
                                    <p style={{ margin: "1px 0 0", fontSize: "10px", color: "#a0b5a8" }}>tersisa</p>
                                </div>
                            </div>
                        );
                    })}
                    {sorted.length > PREVIEW_COUNT && (
                        <button
                            onClick={() => setExpanded(prev => !prev)}
                            style={{
                                alignSelf: "center", marginTop: "4px",
                                background: "none", border: "none", cursor: "pointer",
                                fontSize: "12px", color: "#4EA771", fontWeight: 600,
                                padding: "4px 8px", fontFamily: "inherit",
                            }}
                        >
                            {expanded
                                ? "Tampilkan lebih sedikit"
                                : `Tampilkan ${sorted.length - PREVIEW_COUNT} lainnya`}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
