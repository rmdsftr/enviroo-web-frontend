import { useState, useEffect, useCallback, useMemo } from "react";
import { StatistikService } from "../services/statistik.service";
import type { PenjualanSampahItem } from "../types/statistik.type";
import FilterRange, { defaultMonthRange } from "./filter-range";
import FilterPill from "./filter-pill";
import Pagination from "./pagination";
import { formatCompact, formatNominal } from "../utils/number.utils";
import "../styles/setoran-dashboard.css";

const PALETTE = [
    "#94DF0C",
];
const colorAt = (i: number) => PALETTE[i % PALETTE.length];

function fmtNilai(nilai: number, satuan: string): string {
    return satuan === "Rp" ? formatCompact(nilai, satuan) : formatNominal(nilai, satuan);
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
    const [page,    setPage]    = useState(1);

    const LIMIT = 5;

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

    const totalPages   = Math.max(1, Math.ceil(sorted.length / LIMIT));
    const globalOffset = (page - 1) * LIMIT;
    const paged        = sorted.slice(globalOffset, globalOffset + LIMIT);

    const totalRp   = items.filter(i => i.satuan_nilai === "Rp").reduce((s, i) => s + (i.total_nilai ?? 0), 0);
    const totalPoin = items.filter(i => i.satuan_nilai !== "Rp").reduce((s, i) => s + (i.total_nilai ?? 0), 0);

    return (
        <div className="ssd-section">
            <div className="ssd-section-header">
                <div className="ssd-section-header-left">
                    <div>
                        <h2 className="ssd-title">Penjualan per Jenis Sampah</h2>
                        <p className="ssd-sub">Rekap hasil penjualan reward berdasarkan jenis sampah</p>
                    </div>
                </div>
                <div className="ssd-section-header-right">
                    <FilterRange from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); setPage(1); }} />
                </div>
            </div>
            <hr style={{ border: "none", borderTop: "1px solid #e8f0eb", margin: "0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                {!loading && items.length > 0 && (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        {[
                            ...(totalRp   > 0 ? [{ label: "Nilai Uang",    val: fmtNilai(totalRp,   "Rp")   }] : []),
                            ...(totalPoin > 0 ? [{ label: "Nilai Barang", val: fmtNilai(totalPoin, "poin") }] : []),
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
                        { label: "Barang", value: "poin" },
                    ]}
                    activeValue={filterSatuan}
                    onChange={(v) => { setFilterSatuan(v as typeof filterSatuan); setPage(1); }}
                />
            </div>

            {loading ? (
                <div className="ssd-state">Memuat data...</div>
            ) : error ? (
                <div className="ssd-state ssd-state--error">{error}</div>
            ) : sorted.length === 0 ? (
                <div className="ssd-state">Belum ada data penjualan sampah pada periode ini.</div>
            ) : (
                <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {paged.map((item, i) => {
                            const pct   = maxNilai > 0 ? ((item.total_nilai ?? 0) / maxNilai) * 100 : 0;
                            const color = colorAt(i);
                            const rank  = globalOffset + i + 1;
                            return (
                                <div key={`${item.sampah_id}-${item.satuan_nilai}`} style={{
                                    display: "grid",
                                    gridTemplateColumns: "auto 1fr auto",
                                    gap: "12px",
                                    alignItems: "center",
                                    padding: "10px 14px",
                                    borderRadius: "10px",
                                    background: "transparent",
                                    border: "1px solid #e8f0eb",
                                }}>
                                    <span className={`kns-rank ${rank <= 3 ? `kns-rank--${rank}` : "kns-rank--other"}`}>{rank}</span>
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

                                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#013236",
                                        whiteSpace: "nowrap", textAlign: "right" }}>
                                        {fmtNilai(item.total_nilai ?? 0, item.satuan_nilai)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        variant="compact"
                    />
                </>
            )}
        </div>
    );
}
