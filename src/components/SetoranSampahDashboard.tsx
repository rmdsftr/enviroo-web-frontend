import { useState, useEffect, useMemo, useCallback } from "react";
import { FaRecycle, FaChevronDown } from "react-icons/fa6";
import FilterPill, { type FilterOption } from "./filter-pill";
import FilterRange, { defaultMonthRange } from "./filter-range";
import { StatistikService, type StatistikSetoranItem } from "../services/statistik.service";
import "../styles/setoran-dashboard.css";


type GroupBy = "satuan" | "kategori" | "jenis_reward";
type Orientation = "horizontal" | "vertical";

const SATUAN_ORDER = ["kg", "pcs", "liter"];

const MONTH_ID = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const GROUP_OPTIONS: FilterOption[] = [
    { label: "Per Kategori", value: "kategori" },
    { label: "Per Jenis Reward", value: "jenis_reward" },
    { label: "Per Satuan", value: "satuan" },
];

const PALETTE = [
    { fill: "#94DF0C", soft: "rgba(148,223,12,0.12)" },    // prioritas 1 — lime
    { fill: "#013236", soft: "rgba(1,50,54,0.12)" },        // prioritas 2 — teal gelap
    { fill: "#4EA771", soft: "rgba(78,167,113,0.12)" },     // midpoint — hijau natural
    { fill: "#1B6E5A", soft: "rgba(27,110,90,0.12)" },
    { fill: "#025C5B", soft: "rgba(2,92,91,0.12)" },
    { fill: "#7DC468", soft: "rgba(125,196,104,0.12)" },
    { fill: "#B8F04A", soft: "rgba(184,240,74,0.12)" },
    { fill: "#CAEC8A", soft: "rgba(202,236,138,0.12)" },
];

function colorAt(idx: number) {
    return PALETTE[idx % PALETTE.length];
}

// rank 0 (terbesar) = #013236, rank terakhir (terkecil) = #94DF0C
// Berbasis rank bukan nilai → rentang warna selalu penuh meski itemnya dikit
function colorForRank(rank: number, total: number): string {
    const t = total > 1 ? 1 - rank / (total - 1) : 1;
    const r = Math.round(148 + t * (1   - 148));
    const g = Math.round(223 + t * (50  - 223));
    const b = Math.round(12  + t * (54  - 12));
    return `rgb(${r},${g},${b})`;
}

function formatQty(n: number) {
    return n.toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

interface DonutSlice {
    label: string;
    value: number;
    color: string;
}

function DonutChart({ slices, size = 160 }: { slices: DonutSlice[]; size?: number }) {
    const total = slices.reduce((s, i) => s + i.value, 0);
    const radius = size / 2;
    const strokeWidth = size * 0.2;
    const r = radius - strokeWidth / 2;
    const circ = 2 * Math.PI * r;

    if (total === 0) {
        return (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={radius} cy={radius} r={r} fill="none" stroke="#e6ece8" strokeWidth={strokeWidth} />
            </svg>
        );
    }

    let offset = 0;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <g transform={`rotate(-90 ${radius} ${radius})`}>
                {slices.map((slice, idx) => {
                    const len = (slice.value / total) * circ;
                    const el = (
                        <circle
                            key={idx}
                            cx={radius}
                            cy={radius}
                            r={r}
                            fill="none"
                            stroke={slice.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${len} ${circ - len}`}
                            strokeDashoffset={-offset}
                            style={{ transition: "stroke-dasharray 0.5s" }}
                        />
                    );
                    offset += len;
                    return el;
                })}
            </g>
        </svg>
    );
}

function PieCard({ title, satuan, slices }: { title: string; satuan: string; slices: DonutSlice[] }) {
    const total = slices.reduce((s, i) => s + i.value, 0);
    return (
        <div className="ssd-chart-card">
            <div className="ssd-chart-card-header">
                <span className="ssd-chart-card-title">{title}</span>
                <span className="ssd-chart-total-badge">{formatQty(total)} {satuan}</span>
            </div>
            <div className="ssd-pie-body">
                <div className="ssd-pie-chart">
                    <DonutChart slices={slices} size={160} />
                    <div className="ssd-pie-center">
                        <span className="ssd-pie-center-value">{formatQty(total)}</span>
                        <span className="ssd-pie-center-label">{satuan}</span>
                    </div>
                </div>
                <div className="ssd-pie-legend">
                    {slices.map((s, idx) => {
                        const pct = total === 0 ? 0 : (s.value / total) * 100;
                        return (
                            <div key={idx} className="ssd-pie-legend-item">
                                <span className="ssd-pie-legend-dot" style={{ background: s.color }} />
                                <span className="ssd-pie-legend-label" title={s.label}>{s.label}</span>
                                <span className="ssd-pie-legend-value">
                                    {formatQty(s.value)} {satuan}
                                    <small>{pct.toFixed(0)}%</small>
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function ChartCard({
    title,
    items,
    orientation,
}: {
    title: string;
    items: StatistikSetoranItem[];
    orientation: Orientation;
}) {
    const sorted = [...items].sort((a, b) => b.total_qty - a.total_qty);
    const maxQty = sorted[0]?.total_qty || 0.01;
    const satuans = new Set(items.map(i => i.satuan));
    const isSingleUnit = satuans.size === 1;
    const total = items.reduce((s, i) => s + i.total_qty, 0);

    return (
        <div className="ssd-chart-card">
            <div className="ssd-chart-card-header">
                <span className="ssd-chart-card-title">{title || "—"}</span>
                {isSingleUnit && (
                    <span className="ssd-chart-total-badge">
                        {formatQty(total)}{" "}{[...satuans][0]}
                    </span>
                )}
            </div>

            {orientation === "horizontal" ? (
                <div className="ssd-bar-list">
                    {sorted.map((item, idx) => {
                        const fill = colorForRank(idx, sorted.length);
                        return (
                            <div key={item.sampah_id} className="ssd-bar-row">
                                <span className="ssd-bar-label" title={item.nama_sampah}>
                                    {item.nama_sampah}
                                </span>
                                <div className="ssd-bar-track">
                                    <div
                                        className="ssd-bar-fill"
                                        style={{
                                            width: `${(item.total_qty / maxQty) * 100}%`,
                                            background: fill,
                                        }}
                                    />
                                </div>
                                <span className="ssd-bar-value">
                                    {formatQty(item.total_qty)}{" "}{item.satuan}
                                </span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="ssd-vbar-list">
                    {sorted.map((item, idx) => {
                        const fill = colorForRank(idx, sorted.length);
                        const pct  = (item.total_qty / maxQty) * 100;
                        return (
                            <div key={item.sampah_id} className="ssd-vbar-col">
                                <span className="ssd-vbar-value">
                                    {formatQty(item.total_qty)}
                                    <small>{item.satuan}</small>
                                </span>
                                <div className="ssd-vbar-track">
                                    <div
                                        className="ssd-vbar-fill"
                                        style={{ height: `${pct}%`, background: fill }}
                                    />
                                </div>
                                <span className="ssd-vbar-label" title={item.nama_sampah}>
                                    {item.nama_sampah}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

interface Props {
    bankId: string;
}

export default function SetoranSampahDashboard({ bankId }: Props) {
    const { from: defFrom, to: defTo } = defaultMonthRange();

    const [groupBy, setGroupBy] = useState<GroupBy>("kategori");
    const [from, setFrom] = useState(defFrom);
    const [to, setTo] = useState(defTo);
    const [data, setData] = useState<StatistikSetoranItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedSatuans, setExpandedSatuans] = useState<Set<string>>(new Set());

    const toggleSatuan = (s: string) =>
        setExpandedSatuans(prev => {
            const next = new Set(prev);
            next.has(s) ? next.delete(s) : next.add(s);
            return next;
        });

    const [fromYear, fromMonth] = from.split("-").map(Number);
    const [toYear, toMonth] = to.split("-").map(Number);

    const fetchData = useCallback(async () => {
        if (!bankId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await StatistikService.getSetoranSampah(bankId, fromMonth, fromYear, toMonth, toYear);
            setData(res.data ?? []);
        } catch {
            setError("Gagal memuat data statistik setoran.");
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [bankId, fromMonth, fromYear, toMonth, toYear]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const grouped = useMemo(() => {
        const map = new Map<string, StatistikSetoranItem[]>();
        data.forEach(item => {
            const key = item[groupBy];
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(item);
        });
        return map;
    }, [data, groupBy]);

    // Untuk pie chart per kategori: group satuan → kategori → total
    const piesPerSatuan = useMemo(() => {
        if (groupBy !== "kategori") return null;
        const bySatuan = new Map<string, Map<string, number>>();
        data.forEach(item => {
            if (!bySatuan.has(item.satuan)) bySatuan.set(item.satuan, new Map());
            const m = bySatuan.get(item.satuan)!;
            m.set(item.kategori, (m.get(item.kategori) || 0) + item.total_qty);
        });
        // Index warna stabil per kategori (urutan kemunculan)
        const kategoriColorIdx = new Map<string, number>();
        let cIdx = 0;
        data.forEach(item => {
            if (!kategoriColorIdx.has(item.kategori)) {
                kategoriColorIdx.set(item.kategori, cIdx++);
            }
        });
        return Array.from(bySatuan.entries()).map(([satuan, kMap]) => ({
            satuan,
            slices: Array.from(kMap.entries())
                .map(([kategori, value]) => ({
                    label: kategori,
                    value,
                    color: colorAt(kategoriColorIdx.get(kategori) ?? 0).fill,
                }))
                .sort((a, b) => b.value - a.value),
        }));
    }, [data, groupBy]);

    const periodLabel = from === to
        ? `${MONTH_ID[fromMonth - 1]} ${fromYear}`
        : `${MONTH_ID[fromMonth - 1]} ${fromYear} – ${MONTH_ID[toMonth - 1]} ${toYear}`;
    const orientation: Orientation = groupBy === "satuan" ? "horizontal" : "vertical";

    return (
        <div className="ssd">
            <div className="ssd-section">
                <div className="ssd-section-header">
                    <div className="ssd-section-header-left">
                        <div>
                            <h2 className="ssd-title">Statistik Setoran Sampah</h2>
                            <p className="ssd-sub">Data bulan {periodLabel}</p>
                        </div>
                    </div>
                    <div className="ssd-section-header-right">
                        <FilterRange
                            from={from}
                            to={to}
                            onChange={(f, t) => { setFrom(f); setTo(t); }}
                        />
                    </div>
                </div>
                <hr style={{ border: "none", borderTop: "1px solid #e8f0eb", margin: "0" }} />

                <FilterPill
                    options={GROUP_OPTIONS}
                    activeValue={groupBy}
                    onChange={(v) => setGroupBy(v as GroupBy)}
                />

                {loading ? (
                    <div className="ssd-state">Memuat data...</div>
                ) : error ? (
                    <div className="ssd-state ssd-state--error">{error}</div>
                ) : data.length === 0 ? (
                    <div className="ssd-state">
                        <FaRecycle className="ssd-state-icon" />
                        <span>Belum ada data setoran untuk periode ini.</span>
                    </div>
                ) : groupBy === "kategori" && piesPerSatuan ? (
                    <div className="ssd-charts-grid">
                        {piesPerSatuan.map(({ satuan, slices }) => (
                            <PieCard
                                key={satuan}
                                title={`Distribusi Kategori (${satuan})`}
                                satuan={satuan}
                                slices={slices}
                            />
                        ))}
                    </div>
                ) : groupBy === "satuan" ? (
                    <div className="ssd-satuan-accordion">
                        {[...grouped.entries()]
                            .sort(([a], [b]) => {
                                const ai = SATUAN_ORDER.indexOf(a);
                                const bi = SATUAN_ORDER.indexOf(b);
                                return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
                            })
                            .map(([satuan, items]) => {
                                const total = items.reduce((s, i) => s + i.total_qty, 0);
                                const isOpen = expandedSatuans.has(satuan);
                                return (
                                    <div key={satuan} className="ssd-satuan-block">
                                        <button className="ssd-satuan-row" onClick={() => toggleSatuan(satuan)}>
                                            <span className="ssd-satuan-label">{satuan}</span>
                                            <span className="ssd-satuan-total">{formatQty(total)} {satuan}</span>
                                            <FaChevronDown className={`ssd-satuan-chevron${isOpen ? " ssd-satuan-chevron--open" : ""}`} />
                                        </button>
                                        {isOpen && (
                                            <div className="ssd-satuan-content">
                                                <ChartCard title="" items={items} orientation="horizontal" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        }
                    </div>
                ) : (
                    <div className={`ssd-charts-grid${groupBy === "jenis_reward" ? " ssd-charts-grid--single" : ""}`}>
                        {Array.from(grouped.entries()).map(([key, items]) => (
                            <ChartCard
                                key={key}
                                title={key}
                                items={items}
                                orientation={orientation}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
