import { useState, useEffect, useCallback } from "react";
import { FaUsers } from "react-icons/fa6";
import FilterRange from "./filter-range";
import Dropdown from "./dropdown";
import Pagination from "./pagination";
import { StatistikService, type KontribusiNasabahItem } from "../services/statistik.service";
import "../styles/setoran-dashboard.css";

const MONTH_ID = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const SORT_OPTIONS = [
    { label: "Banyak Setoran", value: "setoran" },
    { label: "Banyak kg",      value: "kg"      },
    { label: "Banyak pcs",     value: "pcs"     },
    { label: "Banyak liter",   value: "liter"   },
];

const LIMIT = 10;

function RankLabel({ from, to }: { from: number; to: number }) {
    return (
        <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "rgba(78,167,113,0.07)", border: "1px solid rgba(78,167,113,0.2)",
            borderRadius: "8px", padding: "5px 12px", width: "fit-content",
        }}>
            <span style={{ fontSize: "10px", fontWeight: 600, color: "#013236" ,
                textTransform: "uppercase", letterSpacing: "0.4px" }}>
                Ranking
            </span>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#7cba0a"}}>
                #{from} – #{to}
            </span>
        </div>
    );
}

function NasabahRow({ item, rank, sortBy }: { item: KontribusiNasabahItem; rank: number; sortBy: string }) {
    const rankCls = rank <= 3 ? `kns-rank--${rank}` : "kns-rank--other";

    const statLabel = sortBy === "kg"
        ? `${item.total_kg.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kg`
        : sortBy === "pcs"
        ? `${item.total_pcs.toLocaleString("id-ID", { maximumFractionDigits: 2 })} pcs`
        : sortBy === "liter"
        ? `${item.total_liter.toLocaleString("id-ID", { maximumFractionDigits: 2 })} liter`
        : null;

    return (
        <div className="kns-row">
            <span className={`kns-rank ${rankCls}`}>{rank}</span>
            <div className="kns-nasabah-info">
                <div className="kns-nasabah-text">
                    <span className="kns-name">{item.nama_nasabah}</span>
                    <span className="kns-bank">{item.nama_bank}</span>
                </div>
            </div>
            <div className="kns-stats">
                {sortBy === "setoran"
                    ? <span className="kns-setoran-count">{item.jumlah_setoran}x setoran</span>
                    : statLabel && <span className="kns-unit-pill">{statLabel}</span>
                }
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
    const [to,   setTo]   = useState(cur);
    const [sortBy,  setSortBy]  = useState("setoran");
    const [page,    setPage]    = useState(1);
    const [data,       setData]       = useState<KontribusiNasabahItem[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState<string | null>(null);

    const [fromYear, fromMonth] = from.split("-").map(Number);
    const [toYear,   toMonth]   = to.split("-").map(Number);

    const fetchData = useCallback(async () => {
        if (!bankId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await StatistikService.getKontribusiNasabah(
                bankId, fromMonth, fromYear, toMonth, toYear, sortBy, page, LIMIT
            );
            
            setData(res.data ?? []);
            setTotalPages(res.pagination?.total_pages ?? 1);
        } catch {
            setError("Gagal memuat data kontribusi nasabah.");
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [bankId, fromMonth, fromYear, toMonth, toYear, sortBy, page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleFilterChange = (f: string, t: string) => {
        setFrom(f);
        setTo(t);
        setPage(1);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSortBy(e.target.value);
        setPage(1);
    };

    const periodLabel = from === to
        ? `${MONTH_ID[fromMonth - 1]} ${fromYear}`
        : `${MONTH_ID[fromMonth - 1]} ${fromYear} – ${MONTH_ID[toMonth - 1]} ${toYear}`;

    const globalOffset = (page - 1) * LIMIT;
    const col1 = data.slice(0, 5);
    const col2 = data.slice(5, 10);

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
                        onChange={handleFilterChange}
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
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <RankLabel from={globalOffset + 1} to={globalOffset + data.length} />
                        <div style={{ minWidth: "180px" }}>
                            <Dropdown
                                options={SORT_OPTIONS}
                                value={sortBy}
                                onChange={handleSortChange}
                                dropdownSize="small"
                                isRounded
                            />
                        </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div className="kns-list">
                            {col1.map((item, idx) => (
                                <NasabahRow key={item.nasabah_id} item={item} rank={globalOffset + idx + 1} sortBy={sortBy} />
                            ))}
                        </div>
                        <div className="kns-list">
                            {col2.map((item, idx) => (
                                <NasabahRow key={item.nasabah_id} item={item} rank={globalOffset + idx + 6} sortBy={sortBy} />
                            ))}
                        </div>
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
