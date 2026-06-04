import { useState, useEffect, useCallback } from "react";
import { FaUsers } from "react-icons/fa6";
import FilterRange from "./filter-range";
import { StatistikService, type KontribusiNasabahItem } from "../services/statistik.service";
import "../styles/setoran-dashboard.css";

const MONTH_ID = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const DEFAULT_LIMIT = 10;

function NasabahRow({ item, rank }: { item: KontribusiNasabahItem; rank: number }) {
    const units = [
        item.total_kg > 0 ? `${item.total_kg.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kg` : null,
        item.total_pcs > 0 ? `${item.total_pcs.toLocaleString("id-ID", { maximumFractionDigits: 2 })} pcs` : null,
        item.total_liter > 0 ? `${item.total_liter.toLocaleString("id-ID", { maximumFractionDigits: 2 })} liter` : null,
    ].filter(Boolean) as string[];

    const rankCls = rank <= 3 ? `kns-rank--${rank}` : "kns-rank--other";

    return (
        <div className="kns-row">
            <span className={`kns-rank ${rankCls}`}>{rank}</span>
            <div className="kns-nasabah-info">
                <span className="kns-avatar">{item.nama_nasabah[0]?.toUpperCase() ?? "?"}</span>
                <div className="kns-nasabah-text">
                    <span className="kns-name">{item.nama_nasabah}</span>
                    <span className="kns-bank">{item.nama_bank}</span>
                </div>
            </div>
            <div className="kns-stats">
                <span className="kns-setoran-count">{item.jumlah_setoran}x setoran</span>
                {units.map(u => (
                    <span key={u} className="kns-unit-pill">{u}</span>
                ))}
            </div>
        </div>
    );
}

interface Props {
    bankId: string;
}

export default function KontribusiNasabahSection({ bankId }: Props) {
    const now = new Date();
    const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [from, setFrom] = useState(cur);
    const [to, setTo] = useState(cur);
    const [data, setData] = useState<KontribusiNasabahItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);

    const [fromYear, fromMonth] = from.split("-").map(Number);
    const [toYear, toMonth] = to.split("-").map(Number);

    const fetchData = useCallback(async () => {
        if (!bankId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await StatistikService.getKontribusiNasabah(bankId, fromMonth, fromYear, toMonth, toYear);
            setData(res.data ?? []);
            setShowAll(false);
        } catch {
            setError("Gagal memuat data kontribusi nasabah.");
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [bankId, fromMonth, fromYear, toMonth, toYear]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const visible = showAll ? data : data.slice(0, DEFAULT_LIMIT);
    const extra = data.length - DEFAULT_LIMIT;
    const periodLabel = from === to
        ? `${MONTH_ID[fromMonth - 1]} ${fromYear}`
        : `${MONTH_ID[fromMonth - 1]} ${fromYear} – ${MONTH_ID[toMonth - 1]} ${toYear}`;

    return (
        <div className="ssd-section">
            <div className="ssd-section-header">
                <div className="ssd-section-header-left">
                    <div>
                        <h2 className="ssd-title">Kontribusi Nasabah</h2>
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

            {loading ? (
                <div className="ssd-state">Memuat data...</div>
            ) : error ? (
                <div className="ssd-state ssd-state--error">{error}</div>
            ) : data.length === 0 ? (
                <div className="ssd-state">
                    <FaUsers className="ssd-state-icon" />
                    <span>Belum ada data kontribusi nasabah untuk periode ini.</span>
                </div>
            ) : (
                <>
                    <div className="kns-list">
                        {visible.map((item, idx) => (
                            <NasabahRow key={item.nasabah_id} item={item} rank={idx + 1} />
                        ))}
                    </div>
                    {extra > 0 && (
                        <button
                            className="kns-show-more"
                            onClick={() => setShowAll(v => !v)}
                        >
                            {showAll
                                ? "Tampilkan lebih sedikit"
                                : `Lihat ${extra} nasabah lainnya`
                            }
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
