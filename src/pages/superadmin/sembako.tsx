import { useState, useEffect, useCallback } from "react";
import { FaPlus, FaPenToSquare, FaTrashCan } from "react-icons/fa6";
import Button from "../../components/button";
import SearchBar from "../../components/search";
import Pagination from "../../components/pagination";
import SembakoMasterModal from "../../modals/SembakoMasterModal";
import type { SembakoMasterFormData } from "../../modals/SembakoMasterModal";
import PopupConfirmation from "../../layouts/popup-confirmation";
import PopupNotifikasi from "../../layouts/popup-notifikasi";
import { MasterService } from "../../services/master.service";
import FilterPill from "../../components/filter-pill";
import FilterRange, { defaultMonthRange } from "../../components/filter-range";
import type { MasterSembako, StatistikSembakoItem, SembakoFavoritItem } from "../../types/katalog.type";
import "../../styles/manajemen-reward.css";
import "../../styles/table.css";

const LIMIT = 20;
const SEMBAKO_COLOR = "#94DF0C";

export default function SembakoPage() {
    const [items, setItems]           = useState<MasterSembako[]>([]);
    const [isLoading, setIsLoading]   = useState(true);
    const [search, setSearch]         = useState("");
    const [page, setPage]             = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [stats, setStats]             = useState<StatistikSembakoItem[]>([]);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsExpanded, setStatsExpanded] = useState(false);
    const STATS_PREVIEW = 8;

    const [favorit, setFavorit]               = useState<SembakoFavoritItem[]>([]);
    const [favoritLoading, setFavoritLoading] = useState(true);
    const [favoritMetric, setFavoritMetric]   = useState<"total_qty" | "total_poin" | "jumlah_nasabah" | "jumlah_tukar">("total_qty");
    const [favoritFrom, setFavoritFrom] = useState(() => defaultMonthRange().from);
    const [favoritTo, setFavoritTo]     = useState(() => defaultMonthRange().to);

    const [modalOpen, setModalOpen]       = useState(false);
    const [editTarget, setEditTarget]     = useState<MasterSembako | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<MasterSembako | null>(null);
    const [isDeleting, setIsDeleting]     = useState(false);

    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const showNotif = (message: string, type: "success" | "error") => setPopupNotif({ message, type });

    const fetchItems = useCallback(async (q: string, p: number) => {
        setIsLoading(true);
        try {
            const res = await MasterService.getSembako({ q: q || undefined, page: p, limit: LIMIT });
            setItems(res.data ?? []);
            setTotalItems(res.total ?? 0);
            setTotalPages(Math.max(1, Math.ceil((res.total ?? 0) / LIMIT)));
        } catch {
            showNotif("Gagal memuat data master sembako.", "error");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems(search, page);
    }, [search, page, fetchItems]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const res = await MasterService.getStatistikSembako();
            setStats(res.data ?? []);
        } catch {
            showNotif("Gagal memuat statistik sembako.", "error");
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const fetchFavorit = useCallback(async (from: string, to: string) => {
        setFavoritLoading(true);
        try {
            const [fy, fm] = from.split("-").map(Number);
            const [ty, tm] = to.split("-").map(Number);
            const res = await MasterService.getFavoritSembako(10, fm, fy, tm, ty);
            setFavorit(res.data ?? []);
        } catch {
            showNotif("Gagal memuat data sembako favorit.", "error");
        } finally {
            setFavoritLoading(false);
        }
    }, []);

    useEffect(() => { fetchFavorit(favoritFrom, favoritTo); }, [fetchFavorit, favoritFrom, favoritTo]);

    const handleSubmit = async (data: SembakoMasterFormData) => {
        if (editTarget) {
            await MasterService.updateSembako(editTarget.BarangID, data);
            showNotif("Item sembako berhasil diperbarui.", "success");
        } else {
            await MasterService.createSembako(data);
            showNotif("Item sembako berhasil ditambahkan.", "success");
        }
        setModalOpen(false);
        setEditTarget(null);
        fetchItems(search, page);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await MasterService.deleteSembako(deleteTarget.BarangID);
            showNotif("Item sembako berhasil dihapus.", "success");
            setDeleteTarget(null);
            fetchItems(search, page);
        } catch (err: any) {
            showNotif(err?.response?.data?.error || "Gagal menghapus item sembako.", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <section className="mr-section">

            {/* ── Header ── */}
            <div className="mr-header">
                <div className="mr-header-left">
                    <h2 className="mr-header-title">Data Sembako</h2>
                    <p className="mr-header-desc">
                        Kelola master item sembako dan pantau rata-rata nilai poin penukaran di seluruh bank sampah.
                    </p>
                </div>
            </div>

            {/* ── Search + Tambah ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <SearchBar
                    placeholder="Cari nama barang..."
                    value={search}
                    onChange={(val) => { setSearch(val); setPage(1); }}
                    width="320px"
                />
                <Button
                    color="secondary"
                    variant="solid"
                    isRounded
                    icon={<FaPlus />}
                    onClick={() => { setEditTarget(null); setModalOpen(true); }}
                >
                    Tambah Item Sembako
                </Button>
            </div>

            {/* ── Table ── */}
            <div className="table-wrapper">
                <table className="table">
                    <thead>
                        <tr>
                            <th style={{ width: "56px" }}>No</th>
                            <th style={{ width: "80px" }}>ID</th>
                            <th>Nama Barang</th>
                            <th style={{ width: "100px", textAlign: "center" }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={4} className="table-empty">Memuat data...</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={4} className="table-empty">
                                {search ? `Tidak ada hasil untuk "${search}".` : "Belum ada data master sembako."}
                            </td></tr>
                        ) : (
                            items.map((item, idx) => (
                                <tr key={item.BarangID}>
                                    <td style={{ color: "var(--c-text-muted)", fontSize: "12px" }}>
                                        {(page - 1) * LIMIT + idx + 1}
                                    </td>
                                    <td className="table-id" style={{ fontWeight: 600 }}>{item.BarangID}</td>
                                    <td>{item.NamaBarang}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                            <button
                                                className="table-action-btn"
                                                title="Edit item"
                                                onClick={() => { setEditTarget(item); setModalOpen(true); }}
                                            >
                                                <FaPenToSquare />
                                            </button>
                                            <button
                                                className="table-action-btn"
                                                title="Hapus item"
                                                style={{ color: "var(--c-danger, #ef4444)", borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)" }}
                                                onClick={() => setDeleteTarget(item)}
                                            >
                                                <FaTrashCan />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px 0" }}>
                    <span style={{ fontSize: "12px", color: "var(--c-text-muted)" }}>
                        {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, totalItems)} dari {totalItems} item
                    </span>
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
            )}

            {/* ── Divider ── */}
            <div style={{ height: "1px", background: "var(--c-border-soft)", margin: "32px 0" }} />

            {/* ── Statistik Nilai Poin Sembako ── */}
            <div className="mr-header" style={{ paddingTop: 0 }}>
                <div className="mr-header-left">
                    <h2 className="mr-header-title">Statistik Nilai Poin Sembako</h2>
                    <p className="mr-header-desc">Rata-rata nilai poin penukaran per jenis sembako berdasarkan katalog seluruh bank sampah.</p>
                </div>
            </div>

            {statsLoading ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--c-text-muted)", fontSize: "13px" }}>
                    Memuat statistik...
                </div>
            ) : (() => {
                const fmt = (n: number) => `${new Intl.NumberFormat("id-ID").format(Math.round(n))} poin`;
                const sorted = [...stats].sort((a, b) => b.rata_rata_poin - a.rata_rata_poin);
                const active = sorted.filter(s => s.rata_rata_poin > 0);
                const maxPoin = active.length > 0 ? active[0].rata_rata_poin : 1;
                const avgPoin = active.length > 0 ? active.reduce((sum, s) => sum + s.rata_rata_poin, 0) / active.length : 0;
                const maxItem = active.length > 0 ? active[0] : null;
                const minItem = active.length > 0 ? active[active.length - 1] : null;

                if (sorted.length === 0) return (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--c-text-muted)", fontSize: "13px" }}>
                        Belum ada data statistik sembako.
                    </div>
                );

                return (
                    <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8f0eb", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

                        {/* Summary mini-cards */}
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                            {[
                                { label: "Total Jenis", value: `${sorted.length} item`, sub: `${active.length} memiliki nilai poin`, color: `${SEMBAKO_COLOR}14`, border: `${SEMBAKO_COLOR}40` },
                                { label: "Rata-rata Poin", value: avgPoin > 0 ? fmt(avgPoin) : "—", sub: "dari semua jenis aktif", color: "rgba(1,50,54,0.05)", border: "rgba(1,50,54,0.12)" },
                                { label: "Poin Tertinggi", value: maxItem ? fmt(maxItem.rata_rata_poin) : "—", sub: maxItem ? maxItem.nama_barang : "—", color: `${SEMBAKO_COLOR}14`, border: `${SEMBAKO_COLOR}40` },
                                { label: "Poin Terendah", value: minItem ? fmt(minItem.rata_rata_poin) : "—", sub: minItem ? minItem.nama_barang : "—", color: "rgba(1,50,54,0.05)", border: "rgba(1,50,54,0.12)" },
                            ].map(card => (
                                <div key={card.label} style={{ background: card.color, border: `1.5px solid ${card.border}`, borderRadius: "12px", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "3px", minWidth: "150px", flex: 1 }}>
                                    <span style={{ fontSize: "10px", fontWeight: 600, color: "#013236", textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.6 }}>{card.label}</span>
                                    <span style={{ fontSize: "16px", fontWeight: 700, color: "#013236", lineHeight: 1.3 }}>{card.value}</span>
                                    <span style={{ fontSize: "10.5px", color: "#a0b5a8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.sub}</span>
                                </div>
                            ))}
                        </div>

                        {/* Horizontal bar list */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 130px", gap: "12px", alignItems: "center", paddingBottom: "8px", borderBottom: "1px solid #e8f0eb" }}>
                                <span style={{ fontSize: "10.5px", color: "#a0b5a8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>Nama Barang</span>
                                <span style={{ fontSize: "10.5px", color: "#a0b5a8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>Distribusi Poin</span>
                                <span style={{ fontSize: "10.5px", color: "#a0b5a8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", textAlign: "right" }}>Rata-rata</span>
                            </div>
                            {(statsExpanded ? sorted : sorted.slice(0, STATS_PREVIEW)).map((item) => {
                                const pct = item.rata_rata_poin > 0 ? (item.rata_rata_poin / maxPoin) * 100 : 0;
                                return (
                                    <div key={item.barang_id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 130px", gap: "12px", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f4f7f5" }}>
                                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#0f1f15", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {item.nama_barang}
                                        </span>
                                        <div style={{ height: "20px", borderRadius: "6px", background: "#e8f0eb", overflow: "hidden" }}>
                                            <div style={{ height: "100%", width: `${pct}%`, borderRadius: "6px", background: SEMBAKO_COLOR, transition: "width 0.4s ease" }} />
                                        </div>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: item.rata_rata_poin > 0 ? "#013236" : "#a0b5a8", textAlign: "right", whiteSpace: "nowrap" }}>
                                            {item.rata_rata_poin > 0 ? fmt(item.rata_rata_poin) : "—"}
                                        </span>
                                    </div>
                                );
                            })}
                            {sorted.length > STATS_PREVIEW && (
                                <button
                                    onClick={() => setStatsExpanded(prev => !prev)}
                                    style={{
                                        alignSelf: "center", marginTop: "4px",
                                        background: "none", border: "none", cursor: "pointer",
                                        fontSize: "12px", color: "#94DF0C", fontWeight: 600,
                                        padding: "4px 8px", fontFamily: "inherit",
                                    }}
                                >
                                    {statsExpanded
                                        ? "Tampilkan lebih sedikit"
                                        : `Tampilkan ${sorted.length - STATS_PREVIEW} lainnya`}
                                </button>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* ── Divider ── */}
            <div style={{ height: "1px", background: "var(--c-border-soft)", margin: "32px 0" }} />

            {/* ── Sembako Favorit Nasabah ── */}
            <div className="mr-header" style={{ paddingTop: 0 }}>
                <div className="mr-header-left">
                    <h2 className="mr-header-title">Sembako Favorit Nasabah</h2>
                    <p className="mr-header-desc">Top 10 jenis sembako paling banyak ditukarkan oleh nasabah.</p>
                </div>
                <div style={{ alignSelf: "flex-end" }}>
                    <FilterRange
                        from={favoritFrom}
                        to={favoritTo}
                        onChange={(f, t) => { setFavoritFrom(f); setFavoritTo(t); }}
                    />
                </div>
            </div>

            {favoritLoading ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--c-text-muted)", fontSize: "13px" }}>
                    Memuat data favorit...
                </div>
            ) : favorit.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--c-text-muted)", fontSize: "13px" }}>
                    Belum ada data sembako favorit.
                </div>
            ) : (() => {
                const getValue = (d: SembakoFavoritItem): number => d[favoritMetric];
                const maxVal = Math.max(...favorit.map(getValue), 1);
                const fmtCompact = (n: number) => {
                    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
                    if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}rb`;
                    return n % 1 !== 0 ? n.toFixed(1) : String(n);
                };

                const W = 600, H = 280;
                const padL = 8, padR = 8, padTop = 32, padBottom = 72;
                const chartW = W - padL - padR;
                const chartH = H - padTop - padBottom;
                const n = favorit.length;
                const slotW = chartW / n;
                const barW = Math.min(slotW * 0.55, 38);

                return (
                    <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8f0eb", padding: "24px" }}>
                        <div style={{ marginBottom: "16px" }}>
                            <FilterPill
                                options={[
                                    { label: "Total Qty",  value: "total_qty"      },
                                    { label: "Total Poin", value: "total_poin"     },
                                    { label: "Nasabah",    value: "jumlah_nasabah" },
                                    { label: "Jml Tukar",  value: "jumlah_tukar"   },
                                ]}
                                activeValue={favoritMetric}
                                onChange={(v) => setFavoritMetric(v as typeof favoritMetric)}
                            />
                        </div>
                        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
                            {/* Gridlines */}
                            {[0, 0.25, 0.5, 0.75, 1].map(t => {
                                const y = padTop + chartH * (1 - t);
                                return <line key={t} x1={padL} x2={W - padR} y1={y} y2={y} stroke="#e8f0eb" strokeWidth={1} />;
                            })}

                            {/* Bars */}
                            {favorit.map((item, i) => {
                                const val = getValue(item);
                                const barH = Math.max((val / maxVal) * chartH, val > 0 ? 3 : 0);
                                const x = padL + i * slotW + (slotW - barW) / 2;
                                const y = padTop + chartH - barH;
                                const labelX = padL + i * slotW + slotW / 2;

                                return (
                                    <g key={item.barang_id}>
                                        <rect x={x} y={y} width={barW} height={barH} fill={SEMBAKO_COLOR} rx={5} />

                                        {val > 0 && (
                                            <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={6} fill={SEMBAKO_COLOR} fontWeight={700} fontFamily="Poppins, sans-serif">
                                                {fmtCompact(val)}
                                            </text>
                                        )}

                                        <text
                                            x={labelX}
                                            y={padTop + chartH + 10}
                                            textAnchor="end"
                                            fontSize={7}
                                            fill="#4a5f52"
                                            fontFamily="Poppins, sans-serif"
                                            transform={`rotate(-40, ${labelX}, ${padTop + chartH + 10})`}
                                        >
                                            {item.nama_barang.length > 14 ? item.nama_barang.slice(0, 13) + "…" : item.nama_barang}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                );
            })()}

            {/* ── Modal ── */}
            <SembakoMasterModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditTarget(null); }}
                onSubmit={handleSubmit}
                initialData={editTarget}
            />

            {/* ── Confirm Delete ── */}
            <PopupConfirmation
                isOpen={!!deleteTarget}
                type="danger"
                title="Hapus Item Sembako?"
                message={`"${deleteTarget?.NamaBarang || ""}" akan dihapus dari master data. Item yang sudah digunakan dalam katalog tidak dapat dihapus.`}
                confirmText={isDeleting ? "Menghapus..." : "Ya, Hapus"}
                cancelText="Batal"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />

            {popupNotif && (
                <PopupNotifikasi
                    message={popupNotif.message}
                    type={popupNotif.type}
                    onClose={() => setPopupNotif(null)}
                />
            )}
        </section>
    );
}
