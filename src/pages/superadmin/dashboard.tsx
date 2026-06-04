import { useState, useEffect } from "react";
import { StatistikService } from "../../services/statistik.service";
import type { GetSuperadminRingkasanResponse, TrenPenjualanBulan, RankingBankItem } from "../../types/statistik.type";
import FilterPill from "../../components/filter-pill";
import Dropdown from "../../components/dropdown";
import "../../styles/layout.css";
import "../../styles/setoran-dashboard.css";

// ─── Warna ──────────────────────────────────────────────
const BANK_COLORS = {
    bsi: "#4EA771",
    bsu: "#3B82F6",
    bsm: "#F59E0B",
};

const NASABAH_COLORS = {
    aktif:    "#22C55E",
    pending:  "#F59E0B",
    nonaktif: "#F43F5E",
};

// ─── Donut Chart (bank by type) ──────────────────────────
interface Slice { label: string; value: number; color: string }

function DonutChart({ slices, size = 180 }: { slices: Slice[]; size?: number }) {
    const total = slices.reduce((s, i) => s + i.value, 0);
    const cx = size / 2, cy = size / 2;
    const strokeWidth = size * 0.22;
    const r = cx - strokeWidth / 2;
    const circ = 2 * Math.PI * r;

    if (total === 0) return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e6ece8" strokeWidth={strokeWidth} />
        </svg>
    );

    const nonZeroSlices = slices.filter(s => s.value > 0);
    let cumulative = 0;
    const arcs = nonZeroSlices.map(s => {
        const dash = (s.value / total) * circ;
        const arc = { ...s, dash, offset: cumulative };
        cumulative += dash;
        return arc;
    });

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
            style={{ transform: "rotate(-90deg)" }}>
            {arcs.map((arc, i) => (
                <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                    stroke={arc.color} strokeWidth={strokeWidth}
                    strokeDasharray={`${arc.dash} ${circ - arc.dash}`}
                    strokeDashoffset={-arc.offset}
                    strokeLinecap="butt"
                />
            ))}
        </svg>
    );
}

// ─── Pie Chart (nasabah by status) ──────────────────────
function PieChart({ slices, size = 180 }: { slices: Slice[]; size?: number }) {
    const nonZero = slices.filter(s => s.value > 0);
    const total = nonZero.reduce((s, i) => s + i.value, 0);
    const cx = size / 2, cy = size / 2;
    const r = size / 2 - 3;

    if (total === 0) return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={cx} cy={cy} r={r} fill="#e6ece8" />
        </svg>
    );

    // Satu slice 100% → arc start=end, tidak bisa dirender → pakai circle biasa
    if (nonZero.length === 1) return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={cx} cy={cy} r={r} fill={nonZero[0].color} />
        </svg>
    );

    let angle = -Math.PI / 2;
    const paths = nonZero.map(s => {
        const sweep = (s.value / total) * 2 * Math.PI;
        const x1 = cx + r * Math.cos(angle);
        const y1 = cy + r * Math.sin(angle);
        angle += sweep;
        const x2 = cx + r * Math.cos(angle);
        const y2 = cy + r * Math.sin(angle);
        const large = sweep > Math.PI ? 1 : 0;
        return { ...s, d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z` };
    });

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {paths.map((p, i) => (
                <path key={i} d={p.d} fill={p.color} stroke="white" strokeWidth={2} />
            ))}
        </svg>
    );
}

// ─── Legend Item ─────────────────────────────────────────
function LegendItem({ color, label, value, pct }: {
    color: string; label: string; value: number; pct?: number
}) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0",
            borderBottom: "1px solid #f0f4f1" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: color,
                flexShrink: 0, display: "inline-block" }} />
            <span style={{ flex: 1, fontSize: "12.5px", color: "#4a5f52", fontWeight: 500 }}>
                {label}
            </span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f1f15" }}>
                {value.toLocaleString("id-ID")}
            </span>
            {pct !== undefined && (
                <span style={{ fontSize: "11px", color: "#7a9e8a", minWidth: "40px", textAlign: "right" }}>
                    {pct.toFixed(1)}%
                </span>
            )}
        </div>
    );
}

// ─── Helpers ─────────────────────────────────────────────
const MONTH_ABBR = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

function fmtCompact(n: number | undefined | null): string {
    const v = n ?? 0;
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}M`;
    if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)}jt`;
    if (v >= 1_000)         return `${(v / 1_000).toFixed(0)}rb`;
    return v.toLocaleString("id-ID");
}

// ─── Bar Chart ───────────────────────────────────────────
function BarChart({ values, color, formatLabel }: {
    values: number[];
    color: string;
    formatLabel: (n: number) => string;
}) {
    const max = Math.max(...values, 1);
    const W = 600, H = 200;
    const padL = 4, padR = 4, padTop = 28, padBottom = 32;
    const chartW = W - padL - padR;
    const chartH = H - padTop - padBottom;
    const slotW = chartW / 12;
    const barW = slotW * 0.52;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
            {/* Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                const y = padTop + chartH * (1 - t);
                return (
                    <line key={t} x1={padL} x2={W - padR} y1={y} y2={y}
                        stroke="#e8f0eb" strokeWidth={1} />
                );
            })}

            {values.map((val, i) => {
                const barH = Math.max((val / max) * chartH, val > 0 ? 3 : 0);
                const x = padL + i * slotW + (slotW - barW) / 2;
                const y = padTop + chartH - barH;
                return (
                    <g key={i}>
                        <rect x={x} y={y} width={barW} height={barH}
                            fill={val > 0 ? color : "#e8f0eb"} rx={4} />
                        {val > 0 && barH > 18 && (
                            <text x={x + barW / 2} y={y - 5}
                                textAnchor="middle" fontSize={8.5}
                                fill={color} fontWeight={700}>
                                {formatLabel(val)}
                            </text>
                        )}
                        <text x={x + barW / 2} y={H - 8}
                            textAnchor="middle" fontSize={9.5} fill="#a0b5a8">
                            {MONTH_ABBR[i]}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

// ─── Card Wrapper ────────────────────────────────────────
function InsightCard({ children, title, subtitle }: {
    children: React.ReactNode; title: string; subtitle: string
}) {
    return (
        <div style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #e8f0eb",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            flex: 1,
        }}>
            <div>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#0f1f15" }}>{title}</p>
                <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "#7a9e8a" }}>{subtitle}</p>
            </div>
            {children}
        </div>
    );
}

// ─── Page ────────────────────────────────────────────────
export default function DashboardSuperadminPage() {
    const [data, setData] = useState<GetSuperadminRingkasanResponse | null>(null);

    const currentYear = new Date().getFullYear();
    const [trenData, setTrenData] = useState<TrenPenjualanBulan[]>([]);
    const [trenYear, setTrenYear] = useState(currentYear);
    const [trenMetric, setTrenMetric] = useState<"uang" | "sembako">("uang");

    const [rankingData, setRankingData] = useState<RankingBankItem[]>([]);
    const [rankingYear, setRankingYear] = useState(currentYear);
    const [rankingLimit, setRankingLimit] = useState(10);
    const [rankingMetric, setRankingMetric] = useState<"TotalUang" | "TotalSembako" | "JumlahPenjualan">("TotalUang");

    useEffect(() => {
        StatistikService.getSuperadminRingkasan()
            .then(res => setData(res))
            .catch(err => console.error("Failed to fetch ringkasan superadmin", err));
    }, []);

    useEffect(() => {
        StatistikService.getRankingBank(rankingYear, rankingLimit)
            .then(res => setRankingData(res.data ?? []))
            .catch(err => console.error("Failed to fetch ranking bank", err));
    }, [rankingYear, rankingLimit]);

    useEffect(() => {
        StatistikService.getTrenPenjualanSuperadmin(trenYear)
            .then(res => setTrenData(res.data ?? []))
            .catch(err => console.error("Failed to fetch tren penjualan", err));
    }, [trenYear]);

    const bank = data?.bank;
    const nasabah = data?.nasabah;

    const bankSlices: Slice[] = bank ? [
        { label: "Bank Sampah Induk",   value: bank.bsi.total, color: BANK_COLORS.bsi },
        { label: "Bank Sampah Unit",    value: bank.bsu.total, color: BANK_COLORS.bsu },
        { label: "Bank Sampah Mandiri", value: bank.bsm.total, color: BANK_COLORS.bsm },
    ] : [];

    const totalBank = bank ? bank.bsi.total + bank.bsu.total + bank.bsm.total : 0;
    const totalAktifBank = bank ? bank.bsi.aktif + bank.bsu.aktif + bank.bsm.aktif : 0;

    const nasabahSlices: Slice[] = nasabah ? [
        { label: "Aktif",    value: nasabah.aktif,    color: NASABAH_COLORS.aktif    },
        { label: "Pending",  value: nasabah.pending,  color: NASABAH_COLORS.pending  },
        { label: "Nonaktif", value: nasabah.nonaktif, color: NASABAH_COLORS.nonaktif },
    ] : [];

    const pct = (n: number, t: number) => t > 0 ? (n / t) * 100 : 0;

    return (
        <div className="dash-admin">
            <div className="dash-admin-header">
                <h1>Dashboard</h1>
                <p>Ringkasan dan statistik seluruh bank sampah terdaftar</p>
            </div>

            {/* ── 1 Row, 2 Kolom ── */}
            <div style={{ display: "flex", gap: "20px", alignItems: "stretch" }}>

                {/* ── Kolom Kiri: Bank Sampah (Donut) ── */}
                <InsightCard
                    title="Sebaran Bank Sampah"
                    subtitle="Komposisi BSI, BSU, dan BSM berdasarkan total terdaftar"
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                        {/* Chart */}
                        <div style={{ position: "relative", flexShrink: 0 }}>
                            <DonutChart slices={bankSlices} size={160} />
                            <div style={{
                                position: "absolute", inset: 0,
                                display: "flex", flexDirection: "column",
                                alignItems: "center", justifyContent: "center",
                                pointerEvents: "none",
                            }}>
                                <span style={{ fontSize: "22px", fontWeight: 800, color: "#0f1f15", lineHeight: 1 }}>
                                    {totalBank}
                                </span>
                                <span style={{ fontSize: "10px", color: "#7a9e8a", fontWeight: 500, marginTop: "2px" }}>
                                    Bank
                                </span>
                            </div>
                        </div>

                        {/* Legend */}
                        <div style={{ flex: 1 }}>
                            {/* Header kolom */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto",
                                gap: "8px", alignItems: "center",
                                paddingBottom: "6px", marginBottom: "4px",
                                borderBottom: "1px solid #e8f0eb" }}>
                                <span style={{ fontSize: "10.5px", color: "#a0b5a8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>Tipe</span>
                                <span style={{ fontSize: "10.5px", color: "#a0b5a8", fontWeight: 600, textAlign: "center", minWidth: "44px" }}>Aktif</span>
                                <span style={{ fontSize: "10.5px", color: "#a0b5a8", fontWeight: 600, textAlign: "center", minWidth: "52px" }}>Nonaktif</span>
                                <span style={{ fontSize: "10.5px", color: "#a0b5a8", fontWeight: 600, textAlign: "right",  minWidth: "44px" }}>Total</span>
                            </div>

                            {/* Baris data */}
                            {bank && ([
                                { key: "bsi", label: "BSI", stats: bank.bsi, color: BANK_COLORS.bsi },
                                { key: "bsu", label: "BSU", stats: bank.bsu, color: BANK_COLORS.bsu },
                                { key: "bsm", label: "BSM", stats: bank.bsm, color: BANK_COLORS.bsm },
                            ] as const).map(({ key, label, stats, color }) => (
                                <div key={key} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto",
                                    gap: "8px", alignItems: "center",
                                    padding: "8px 0", borderBottom: "1px solid #f4f7f5" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                        <span style={{ width: 9, height: 9, borderRadius: "50%",
                                            background: color, flexShrink: 0 }} />
                                        <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#0f1f15" }}>
                                            {label}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#4a5f52",
                                        textAlign: "center", minWidth: "44px" }}>
                                        {stats.aktif}
                                    </span>
                                    <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#4a5f52",
                                        textAlign: "center", minWidth: "52px" }}>
                                        {stats.nonaktif}
                                    </span>
                                    <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#0f1f15",
                                        textAlign: "right", minWidth: "44px" }}>
                                        {stats.total}
                                    </span>
                                </div>
                            ))}

                            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto",
                                gap: "8px", alignItems: "center",
                                paddingTop: "8px", fontSize: "11.5px", color: "#7a9e8a" }}>
                                <span style={{ fontWeight: 600 }}>Total</span>
                                <span style={{ fontWeight: 700, color: "#4a5f52", textAlign: "center", minWidth: "44px" }}>{totalAktifBank}</span>
                                <span style={{ fontWeight: 700, color: "#4a5f52", textAlign: "center", minWidth: "52px" }}>{totalBank - totalAktifBank}</span>
                                <span style={{ fontWeight: 700, color: "#0f1f15", textAlign: "right", minWidth: "44px" }}>{totalBank}</span>
                            </div>
                        </div>
                    </div>
                </InsightCard>

                {/* ── Kolom Kanan: Nasabah (Pie) ── */}
                <InsightCard
                    title="Status Nasabah"
                    subtitle="Distribusi nasabah berdasarkan status pendaftaran"
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                        {/* Chart */}
                        <div style={{ flexShrink: 0 }}>
                            <PieChart slices={nasabahSlices} size={160} />
                        </div>

                        {/* Legend */}
                        <div style={{ flex: 1 }}>
                            {nasabah && [
                                { label: "Aktif",    value: nasabah.aktif,    color: NASABAH_COLORS.aktif    },
                                { label: "Pending",  value: nasabah.pending,  color: NASABAH_COLORS.pending  },
                                { label: "Nonaktif", value: nasabah.nonaktif, color: NASABAH_COLORS.nonaktif },
                            ].map(item => (
                                <LegendItem
                                    key={item.label}
                                    color={item.color}
                                    label={item.label}
                                    value={item.value}
                                    pct={pct(item.value, nasabah.total)}
                                />
                            ))}

                            <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #e8f0eb",
                                display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "#7a9e8a" }}>
                                <span>Total nasabah</span>
                                <span style={{ fontWeight: 700, color: "#0f1f15" }}>
                                    {nasabah?.total.toLocaleString("id-ID") ?? 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </InsightCard>

            </div>

            {/* ── Tren Penjualan ── */}
            <div style={{
                background: "#fff",
                borderRadius: "16px",
                border: "1px solid #e8f0eb",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
            }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#0f1f15" }}>
                            Tren Penjualan
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "#7a9e8a" }}>
                            Data penjualan reward bulanan seluruh bank sampah
                        </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <FilterPill
                            options={[
                                { label: "Nilai Uang", value: "uang" },
                                { label: "Sembako",    value: "sembako" },
                            ]}
                            activeValue={trenMetric}
                            onChange={(v) => setTrenMetric(v as "uang" | "sembako")}
                        />
                        <Dropdown
                            options={[currentYear - 1, currentYear].map(y => ({ label: String(y), value: y }))}
                            value={trenYear}
                            onChange={(e) => setTrenYear(Number(e.target.value))}
                            dropdownSize="small"
                            isRounded
                        />
                    </div>
                </div>

                {/* Chart */}
                {(() => {
                    const filled: number[] = Array.from({ length: 12 }, (_, i) =>
                        trenData.find(d => d.bulan === i + 1)?.[trenMetric] ?? 0
                    );
                    const isUang = trenMetric === "uang";
                    const color = isUang ? "#94DF0C" : "#06C0C9";
                    const total = filled.reduce((a, b) => a + b, 0);
                    const totalLabel = isUang
                        ? `Rp ${total.toLocaleString("id-ID")}`
                        : `${total.toLocaleString("id-ID")} poin`;

                    return (
                        <>
                            <div style={{ display: "flex", gap: "12px" }}>
                                {/* Total */}
                                <div style={{
                                    background: "rgba(78,167,113,0.08)",
                                    border: "1.5px solid rgba(78,167,113,0.25)",
                                    borderRadius: "12px",
                                    padding: "10px 14px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "2px",
                                    minWidth: "140px",
                                }}>
                                    <span style={{ fontSize: "10px", fontWeight: 600, color: "#013236", textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.6 }}>
                                        Total {trenYear}
                                    </span>
                                    <span style={{ fontSize: "16px", fontWeight: 600, color: "#013236", lineHeight: 1.3 }}>
                                        {isUang ? `Rp ${fmtCompact(total)}` : total.toLocaleString("id-ID")}
                                    </span>
                                    <span style={{ fontSize: "10.5px", color: "#a0b5a8" }}>
                                        {totalLabel}
                                    </span>
                                </div>

                                {/* Rata-rata bulan aktif */}
                                {(() => {
                                    const activeMths = filled.filter(v => v > 0).length;
                                    const avg = activeMths > 0 ? Math.round(total / activeMths) : 0;
                                    return (
                                        <div style={{
                                            background: "rgba(1,50,54,0.05)",
                                            border: "1.5px solid rgba(1,50,54,0.12)",
                                            borderRadius: "12px",
                                            padding: "10px 14px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "2px",
                                            minWidth: "140px",
                                        }}>
                                            <span style={{ fontSize: "10px", fontWeight: 600, color: "#013236", textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.6 }}>
                                                Rata-rata / Bulan
                                            </span>
                                            <span style={{ fontSize: "16px", fontWeight: 600, color: "#013236", lineHeight: 1.3 }}>
                                                {isUang ? `Rp ${fmtCompact(avg)}` : avg.toLocaleString("id-ID")}
                                            </span>
                                            <span style={{ fontSize: "10.5px", color: "#a0b5a8" }}>
                                                dari {activeMths} bulan aktif
                                            </span>
                                        </div>
                                    );
                                })()}
                            </div>
                            <BarChart
                                values={filled}
                                color={color}
                                formatLabel={isUang ? fmtCompact : (n) => n.toLocaleString("id-ID")}
                            />
                        </>
                    );
                })()}
            </div>

            {/* ── Ranking Bank ── */}
            <div style={{
                background: "#fff",
                borderRadius: "16px",
                border: "1px solid #e8f0eb",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
            }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#0f1f15" }}>
                            Ranking Bank Sampah
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "#7a9e8a" }}>
                            Performa penjualan reward per bank sampah tahun {rankingYear}
                        </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <FilterPill
                            options={[
                                { label: "Nilai Uang", value: "TotalUang"       },
                                { label: "Sembako",    value: "TotalSembako"    },
                                { label: "Penjualan",  value: "JumlahPenjualan" },
                            ]}
                            activeValue={rankingMetric}
                            onChange={(v) => setRankingMetric(v as typeof rankingMetric)}
                        />
                        <Dropdown
                            options={[5, 10, 20].map(n => ({ label: `Top ${n}`, value: n }))}
                            value={rankingLimit}
                            onChange={(e) => setRankingLimit(Number(e.target.value))}
                            dropdownSize="small"
                            isRounded
                        />
                        <Dropdown
                            options={[currentYear - 1, currentYear].map(y => ({ label: String(y), value: y }))}
                            value={rankingYear}
                            onChange={(e) => setRankingYear(Number(e.target.value))}
                            dropdownSize="small"
                            isRounded
                        />
                    </div>
                </div>

                {/* List */}
                {rankingData.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0", fontSize: "13px", color: "#a0b5a8" }}>
                        Belum ada data ranking.
                    </div>
                ) : (() => {
                    const maxVal = Math.max(...rankingData.map(d => (d[rankingMetric] as number) ?? 0), 1);
                    const MEDALS = ["🥇", "🥈", "🥉"];
                    const JENIS_COLOR: Record<string, string> = {
                        bsi: "#4EA771", bsu: "#3B82F6", bsm: "#F59E0B",
                    };
                    const BAR_COLORS = ["#4EA771", "#6bbf8a", "#8dcca3", "#b0d9bc"];

                    const formatVal = (item: RankingBankItem) => {
                        if (rankingMetric === "TotalUang")
                            return `Rp ${fmtCompact(item.TotalUang ?? 0)}`;
                        if (rankingMetric === "TotalSembako")
                            return `${(item.TotalSembako ?? 0).toLocaleString("id-ID")} poin`;
                        return `${item.JumlahPenjualan ?? 0} transaksi`;
                    };

                    return (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {rankingData.map((item, i) => {
                                const val = (item[rankingMetric] as number) ?? 0;
                                const pct = (val / maxVal) * 100;
                                const jeColor = JENIS_COLOR[item.JenisBank] ?? "#a0b5a8";
                                const barColor = BAR_COLORS[Math.min(i, BAR_COLORS.length - 1)];

                                return (
                                    <div key={item.BankID} style={{
                                        display: "grid",
                                        gridTemplateColumns: "32px 1fr auto",
                                        gap: "12px",
                                        alignItems: "center",
                                        padding: "10px 12px",
                                        borderRadius: "10px",
                                        background: i < 3 ? "rgba(78,167,113,0.04)" : "transparent",
                                        border: i < 3 ? "1px solid rgba(78,167,113,0.12)" : "1px solid transparent",
                                    }}>
                                        <span style={{ fontSize: i < 3 ? "18px" : "12px", fontWeight: 700,
                                            color: "#a0b5a8", textAlign: "center", lineHeight: 1 }}>
                                            {i < 3 ? MEDALS[i] : `${i + 1}`}
                                        </span>

                                        <div style={{ display: "flex", flexDirection: "column", gap: "5px", minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                                <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#0f1f15",
                                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {item.NamaBank}
                                                </span>
                                                <span style={{ fontSize: "10px", fontWeight: 700, color: jeColor,
                                                    background: `${jeColor}18`, padding: "1px 7px",
                                                    borderRadius: "99px", flexShrink: 0, textTransform: "uppercase" }}>
                                                    {item.JenisBank}
                                                </span>
                                            </div>
                                            <div style={{ height: "5px", borderRadius: "99px",
                                                background: "#e8f0eb", overflow: "hidden" }}>
                                                <div style={{ height: "100%", width: `${pct}%`,
                                                    borderRadius: "99px", background: barColor,
                                                    transition: "width 0.4s ease" }} />
                                            </div>
                                        </div>

                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#013236",
                                            whiteSpace: "nowrap" }}>
                                            {formatVal(item)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}
            </div>


        </div>
    );
}
