import { useState, useEffect, useCallback, useMemo } from "react";
import { StatistikService } from "../services/statistik.service";
import type { PenjualanSampahItem } from "../types/statistik.type";
import FilterRange, { defaultMonthRange } from "./filter-range";
import FilterPill from "./filter-pill";
import "../styles/setoran-dashboard.css";

const PALETTE = [
    // "#013236",
    // "#025C5B",
    // "#4EA771",
    // "#7DC468",
    "#94DF0C",
    // "#B8F04A",
    // "#1B6E5A",
    // "#CAEC8A",
];
const colorAt = (i: number) => PALETTE[i % PALETTE.length];

function fmtNilai(nilai: number, satuan: string): string {
    const n = nilai ?? 0;
    if (satuan === "Rp") {
        if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
        if (n >= 1_000)     return `Rp ${(n / 1_000).toFixed(0)}rb`;
        return `Rp ${n.toLocaleString("id-ID")}`;
    }
    return `${n.toLocaleString("id-ID")} poin`;
}

interface Props { bankId: string }

export default function PenjualanSampahSection({ bankId }: Props) {
    const { from: defFrom, to: defTo } = defaultMonthRange();
    const [from, setFrom] = useState(defFrom);
    const [to,   setTo]   = useState(defTo);
    const [filterSatuan, setFilterSatuan] = useState<"Rp" | "poin">("Rp");
    const [items,   setItems]   = useState<PenjualanSampahItem[]>([]);
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
            const res = await StatistikService.getPenjualanSampah(bankId, fromMonth, fromYear, toMonth, toYear);
            setItems(res.data ?? []);
        } catch {
            setError("Gagal memuat data penjualan sampah.");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [bankId, fromMonth, fromYear, toMonth, toYear]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = useMemo(() => {
        if (filterSatuan === "Rp") return items.filter(i => i.satuan_nilai === "Rp");
        return items.filter(i => i.satuan_nilai !== "Rp");
    }, [items, filterSatuan]);

    const sorted = useMemo(() =>
        [...filtered].sort((a, b) => (b.total_nilai ?? 0) - (a.total_nilai ?? 0)),
    [filtered]);

    const maxNilai = sorted[0]?.total_nilai ?? 1;

    const totalRp   = items.filter(i => i.satuan_nilai === "Rp").reduce((s, i) => s + (i.total_nilai ?? 0), 0);
    const totalPoin = items.filter(i => i.satuan_nilai !== "Rp").reduce((s, i) => s + (i.total_nilai ?? 0), 0);

    return (
        <div className="ssd-section">
            {/* Header */}
            <div className="ssd-section-header">
                <div className="ssd-section-header-left">
                    <div>
                        <h2 className="ssd-title">Tren Penjualan Sampah</h2>
                        <p className="ssd-sub">Rekap hasil penjualan reward berdasarkan jenis sampah</p>
                    </div>
                </div>
                <div className="ssd-section-header-right">
                    <FilterRange from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
                </div>
            </div>
            <hr style={{ border: "none", borderTop: "1px solid #e8f0eb", margin: "0" }} />

            {/* Summary chips + filter pill */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                {!loading && items.length > 0 && (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        {[
                            ...(totalRp   > 0 ? [{ label: "Nilai Uang",    val: fmtNilai(totalRp,   "Rp")   }] : []),
                            ...(totalPoin > 0 ? [{ label: "Nilai Sembako", val: fmtNilai(totalPoin, "poin") }] : []),
                        ].map(({ label, val }) => (
                            <div key={label} style={{
                                background: "rgba(78,167,113,0.07)",
                                border: "1px solid rgba(78,167,113,0.2)",
                                borderRadius: "10px",
                                padding: "8px 14px",
                            }}>
                                <p style={{ margin: 0, fontSize: "10px", fontWeight: 600, color: "#013236",
                                    textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</p>
                                <p style={{ margin: "2px 0 0", fontSize: "14px", fontWeight: 700, color:  "#699c0a" }}>{val}</p>
                            </div>
                        ))}
                    </div>
                )}
                <FilterPill
                    options={[
                        { label: "Uang",    value: "Rp"   },
                        { label: "Sembako", value: "poin" },
                    ]}
                    activeValue={filterSatuan}
                    onChange={(v) => setFilterSatuan(v as typeof filterSatuan)}
                />
            </div>

            {/* Body */}
            {loading ? (
                <div className="ssd-state">Memuat data...</div>
            ) : error ? (
                <div className="ssd-state ssd-state--error">{error}</div>
            ) : sorted.length === 0 ? (
                <div className="ssd-state">Belum ada data penjualan sampah pada periode ini.</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {(expanded ? sorted : sorted.slice(0, PREVIEW_COUNT)).map((item, i) => {
                        const pct   = maxNilai > 0 ? ((item.total_nilai ?? 0) / maxNilai) * 100 : 0;
                        const color = colorAt(i);
                        return (
                            <div key={`${item.sampah_id}-${item.satuan_nilai}`} style={{
                                display: "grid",
                                gridTemplateColumns: "1fr auto",
                                gap: "12px",
                                alignItems: "center",
                                padding: "10px 14px",
                                borderRadius: "10px",
                                background: "transparent",
                                border: "1px solid #e8f0eb",
                            }}>
                                {/* Left: name + bar */}
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
                                    <div style={{ width: "100%", height: "10px", borderRadius: "99px",
                                        background: "#e8f0eb", overflow: "hidden" }}>
                                        <div style={{ height: "100%", width: `${pct}%`,
                                            background: color, borderRadius: "99px",
                                            transition: "width 0.4s ease" }} />
                                    </div>
                                </div>

                                {/* Right: nilai */}
                                <span style={{ fontSize: "13px", fontWeight: 700, color: "#013236",
                                    whiteSpace: "nowrap", textAlign: "right" }}>
                                    {fmtNilai(item.total_nilai ?? 0, item.satuan_nilai)}
                                </span>
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
