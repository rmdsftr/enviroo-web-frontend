import { useState, useEffect, useCallback } from "react";
import { FaPlus, FaPenToSquare, FaTrashCan, FaChevronDown } from "react-icons/fa6";
import Button from "../../components/button";
import SearchBar from "../../components/search";
import FilterPill from "../../components/filter-pill";
import FilterRange, { defaultMonthRange } from "../../components/filter-range";
import Pagination from "../../components/pagination";
import SampahMasterModal from "../../modals/SampahMasterModal";
import type { SampahMasterFormData } from "../../modals/SampahMasterModal";
import PopupConfirmation from "../../layouts/popup-confirmation";
import PopupNotifikasi from "../../layouts/popup-notifikasi";
import { MasterService } from "../../services/master.service";
import type { MasterSampah, StatistikSampahItem, SampahFavoritItem, KategoriSampahGroup } from "../../types/katalog.type";
import "../../styles/manajemen-reward.css";
import "../../styles/table.css";

const LIMIT = 20;

export default function SampahPage() {
    const [items, setItems]           = useState<MasterSampah[]>([]);
    const [isLoading, setIsLoading]   = useState(true);
    const [search, setSearch]         = useState("");
    const [page, setPage]             = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [stats, setStats]             = useState<StatistikSampahItem[]>([]);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsFilter, setStatsFilter] = useState<"Uang" | "Sembako">("Uang");
    const [statsFrom, setStatsFrom] = useState(() => defaultMonthRange().from);
    const [statsTo, setStatsTo]     = useState(() => defaultMonthRange().to);

    const [perKategori, setPerKategori]                 = useState<KategoriSampahGroup[]>([]);
    const [perKategoriLoading, setPerKategoriLoading]   = useState(true);
    const [openKategoriIds, setOpenKategoriIds]         = useState<Set<number>>(new Set());

    const [statsExpanded, setStatsExpanded] = useState(false);
    const STATS_PREVIEW = 8;

    const [favorit, setFavorit]               = useState<SampahFavoritItem[]>([]);
    const [favoritLoading, setFavoritLoading] = useState(true);
    const [favoritMetric, setFavoritMetric]   = useState<"total_qty" | "jumlah_nasabah" | "jumlah_setoran">("total_qty");
    const [favoritFrom, setFavoritFrom] = useState(() => defaultMonthRange().from);
    const [favoritTo, setFavoritTo]     = useState(() => defaultMonthRange().to);

    const [modalOpen, setModalOpen]               = useState(false);
    const [editTarget, setEditTarget]             = useState<MasterSampah | null>(null);
    const [deleteTarget, setDeleteTarget]         = useState<MasterSampah | null>(null);
    const [isDeleting, setIsDeleting]             = useState(false);

    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const showNotif = (message: string, type: "success" | "error") => setPopupNotif({ message, type });

    const fetchItems = useCallback(async (q: string, p: number) => {
        setIsLoading(true);
        try {
            const res = await MasterService.getSampah({ q: q || undefined, page: p, limit: LIMIT });
            setItems(res.data ?? []);
            setTotalItems(res.total ?? 0);
            setTotalPages(Math.max(1, Math.ceil((res.total ?? 0) / LIMIT)));
        } catch {
            showNotif("Gagal memuat data master sampah.", "error");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems(search, page);
    }, [search, page, fetchItems]);

    const fetchStats = useCallback(async (from: string, to: string) => {
        setStatsLoading(true);
        try {
            const [fy, fm] = from.split("-").map(Number);
            const [ty, tm] = to.split("-").map(Number);
            const res = await MasterService.getStatistikSampah(fm, fy, tm, ty);
            setStats(res.data ?? []);
        } catch {
            showNotif("Gagal memuat statistik sampah.", "error");
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => { fetchStats(statsFrom, statsTo); }, [fetchStats, statsFrom, statsTo]);

    const fetchFavorit = useCallback(async (from: string, to: string) => {
        setFavoritLoading(true);
        try {
            const [fy, fm] = from.split("-").map(Number);
            const [ty, tm] = to.split("-").map(Number);
            const res = await MasterService.getFavoritSampah(10, fm, fy, tm, ty);
            setFavorit(res.data ?? []);
        } catch {
            showNotif("Gagal memuat data sampah favorit.", "error");
        } finally {
            setFavoritLoading(false);
        }
    }, []);

    useEffect(() => { fetchFavorit(favoritFrom, favoritTo); }, [fetchFavorit, favoritFrom, favoritTo]);

    const fetchPerKategori = useCallback(async () => {
        setPerKategoriLoading(true);
        try {
            const res = await MasterService.getSampahPerKategori();
            setPerKategori(res.data ?? []);
        } catch {
            // silent
        } finally {
            setPerKategoriLoading(false);
        }
    }, []);

    useEffect(() => { fetchPerKategori(); }, [fetchPerKategori]);

    const toggleKategori = (id: number) => {
        setOpenKategoriIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSubmit = async (data: SampahMasterFormData) => {
        if (editTarget) {
            await MasterService.updateSampah(editTarget.SarokID, data);
            showNotif("Item sampah berhasil diperbarui.", "success");
        } else {
            await MasterService.createSampah(data);
            showNotif("Item sampah berhasil ditambahkan.", "success");
        }
        setModalOpen(false);
        setEditTarget(null);
        fetchItems(search, page);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await MasterService.deleteSampah(deleteTarget.SarokID);
            showNotif("Item sampah berhasil dihapus.", "success");
            setDeleteTarget(null);
            fetchItems(search, page);
        } catch (err: any) {
            showNotif(err?.response?.data?.error || "Gagal menghapus item sampah.", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <section className="mr-section">

            {/* ── Header ── */}
            <div className="mr-header">
                <div className="mr-header-left">
                    <h2 className="mr-header-title">Data Sampah</h2>
                    <p className="mr-header-desc">
                        Kelola master item sampah dan pantau rata-rata harga sampah di seluruh bank sampah.
                    </p>
                </div>
            </div>

            {/* ── Search + Tambah ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <SearchBar
                    placeholder="Cari nama sampah..."
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
                    Tambah Item Sampah
                </Button>
            </div>

            {/* ── Table ── */}
            <div className="table-wrapper">
                <table className="table">
                    <thead>
                        <tr>
                            <th style={{ width: "56px" }}>No</th>
                            <th style={{ width: "80px" }}>ID</th>
                            <th>Nama Sampah</th>
                            <th style={{ width: "90px" }}>Satuan</th>
                            <th style={{ width: "100px", textAlign: "center" }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} className="table-empty">Memuat data...</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={5} className="table-empty">
                                {search ? `Tidak ada hasil untuk "${search}".` : "Belum ada data master sampah."}
                            </td></tr>
                        ) : (
                            items.map((item, idx) => (
                                <tr key={item.SarokID}>
                                    <td style={{ color: "var(--c-text-muted)", fontSize: "12px" }}>
                                        {(page - 1) * LIMIT + idx + 1}
                                    </td>
                                    <td className="table-id" style={{ fontWeight: 600 }}>{item.SarokID}</td>
                                    <td>{item.NamaSampah}</td>
                                    <td>
                                        <span style={{
                                            fontSize: "11px", fontWeight: 700, letterSpacing: "0.4px",
                                            textTransform: "uppercase", color: "var(--c-text-muted)",
                                        }}>
                                            {item.Satuan}
                                        </span>
                                    </td>
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

            {/* ── Sampah per Kategori ── */}
            <div className="mr-header" style={{ paddingTop: 0 }}>
                <div className="mr-header-left">
                    <h2 className="mr-header-title">Sampah per Kategori</h2>
                    <p className="mr-header-desc">Daftar jenis sampah yang dikelompokkan berdasarkan kategori.</p>
                </div>
            </div>

            {perKategoriLoading ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--c-text-muted)", fontSize: "13px" }}>
                    Memuat data...
                </div>
            ) : perKategori.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--c-text-muted)", fontSize: "13px" }}>
                    Belum ada data kategori.
                </div>
            ) : (
                <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8f0eb", overflow: "hidden" }}>
                    {perKategori.map((kat, idx) => {
                        const isOpen = openKategoriIds.has(kat.kategori_id);
                        const SATUAN_COLOR: Record<string, string> = { kg: "#013236", pcs: "#94DF0C", liter: "#4EA771" };
                        return (
                            <div key={kat.kategori_id} style={{ borderBottom: idx < perKategori.length - 1 ? "1px solid #e8f0eb" : "none" }}>
                                <button
                                    onClick={() => toggleKategori(kat.kategori_id)}
                                    style={{
                                        width: "100%", display: "flex", alignItems: "center",
                                        justifyContent: "space-between", padding: "14px 20px",
                                        background: "none", border: "none", cursor: "pointer", textAlign: "left",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f1f15", fontFamily: "Poppins, sans-serif" }}>
                                            {kat.kategori}
                                        </span>
                                        <span style={{
                                            fontSize: "10px", fontWeight: 700, color: "#4EA771",
                                            background: "rgba(78,167,113,0.1)", border: "1px solid rgba(78,167,113,0.3)",
                                            borderRadius: "99px", padding: "2px 8px",
                                        }}>
                                            {kat.sampah.length} item
                                        </span>
                                    </div>
                                    <FaChevronDown style={{
                                        fontSize: "12px", color: "#a0b5a8", flexShrink: 0,
                                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                                        transition: "transform 0.2s ease",
                                    }} />
                                </button>
                                {isOpen && (
                                    <div style={{ padding: "0 20px 16px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                        {kat.sampah.map(item => {
                                            const color = SATUAN_COLOR[item.satuan] ?? "#a0b5a8";
                                            return (
                                                <div key={item.sarok_id} style={{
                                                    display: "flex", alignItems: "center", gap: "6px",
                                                    background: "#f8faf9", borderRadius: "8px",
                                                    padding: "6px 10px", border: "1px solid #e8f0eb",
                                                }}>
                                                    <span style={{ fontSize: "12.5px", color: "#0f1f15", fontWeight: 500 }}>{item.nama_sampah}</span>
                                                    <span style={{
                                                        fontSize: "10px", fontWeight: 700, color,
                                                        background: `${color}22`, border: `1px solid ${color}44`,
                                                        borderRadius: "99px", padding: "1px 6px",
                                                    }}>
                                                        {item.satuan}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Divider ── */}
            <div style={{ height: "1px", background: "var(--c-border-soft)", margin: "32px 0" }} />

            {/* ── Statistik Harga Sampah ── */}
            <div className="mr-header" style={{ paddingTop: 0 }}>
                <div className="mr-header-left">
                    <h2 className="mr-header-title">Statistik Harga Sampah</h2>
                    <p className="mr-header-desc">Rata-rata harga per jenis sampah berdasarkan riwayat penjualan ke pengepul.</p>
                </div>
                <div style={{ alignSelf: "flex-end" }}>
                    <FilterRange
                        from={statsFrom}
                        to={statsTo}
                        onChange={(f, t) => { setStatsFrom(f); setStatsTo(t); setStatsExpanded(false); }}
                    />
                </div>
            </div>

            {statsLoading ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--c-text-muted)", fontSize: "13px" }}>
                    Memuat statistik...
                </div>
            ) : (() => {
                const SATUAN_COLOR: Record<string, string> = { kg: "#013236", pcs: "#94DF0C", liter: "#4EA771" };
                const isUang = statsFilter === "Uang";
                const fmt = (n: number) => isUang
                    ? `Rp ${new Intl.NumberFormat("id-ID").format(Math.round(n))}`
                    : `${new Intl.NumberFormat("id-ID").format(Math.round(n))} poin`;
                const sorted = [...stats]
                    .filter(s => s.jenis_reward === statsFilter)
                    .sort((a, b) => b.rata_rata_harga - a.rata_rata_harga);
                const active = sorted.filter(s => s.rata_rata_harga > 0);
                const maxHarga = active.length > 0 ? active[0].rata_rata_harga : 1;
                const avgHarga = active.length > 0 ? active.reduce((sum, s) => sum + s.rata_rata_harga, 0) / active.length : 0;
                const minItem = active.length > 0 ? active[active.length - 1] : null;
                const maxItem = active.length > 0 ? active[0] : null;

                if (sorted.length === 0) return (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--c-text-muted)", fontSize: "13px" }}>
                        Belum ada data statistik untuk reward {isUang ? "uang" : "sembako"}.
                    </div>
                );

                return (
                    <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8f0eb", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

                        {/* Reward filter */}
                        <div>
                            <FilterPill
                                options={[
                                    { label: "Uang (Rp)", value: "Uang" },
                                    { label: "Sembako (poin)", value: "Sembako" },
                                ]}
                                activeValue={statsFilter}
                                onChange={(v) => { setStatsFilter(v as "Uang" | "Sembako"); setStatsExpanded(false); }}
                            />
                        </div>

                        {/* Summary mini-cards */}
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                            {[
                                { label: "Total Jenis", value: `${sorted.length} item`, sub: `${active.length} memiliki harga`, color: "rgba(78,167,113,0.08)", border: "rgba(78,167,113,0.25)" },
                                { label: "Rata-rata Harga", value: avgHarga > 0 ? fmt(avgHarga) : "—", sub: "dari semua jenis aktif", color: "rgba(1,50,54,0.05)", border: "rgba(1,50,54,0.12)" },
                                { label: "Harga Tertinggi", value: maxItem ? fmt(maxItem.rata_rata_harga) : "—", sub: maxItem ? `${maxItem.nama_sampah} / ${maxItem.satuan}` : "—", color: "rgba(78,167,113,0.08)", border: "rgba(78,167,113,0.25)" },
                                { label: "Harga Terendah", value: minItem ? fmt(minItem.rata_rata_harga) : "—", sub: minItem ? `${minItem.nama_sampah} / ${minItem.satuan}` : "—", color: "rgba(1,50,54,0.05)", border: "rgba(1,50,54,0.12)" },
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
                            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 130px", gap: "12px", alignItems: "center", paddingBottom: "8px", borderBottom: "1px solid #e8f0eb" }}>
                                <span style={{ fontSize: "10.5px", color: "#a0b5a8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>Nama Sampah</span>
                                <span style={{ fontSize: "10.5px", color: "#a0b5a8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>Distribusi Harga</span>
                                <span style={{ fontSize: "10.5px", color: "#a0b5a8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", textAlign: "right" }}>Rata-rata</span>
                            </div>
                            {(statsExpanded ? sorted : sorted.slice(0, STATS_PREVIEW)).map((item) => {
                                const pct = item.rata_rata_harga > 0 ? (item.rata_rata_harga / maxHarga) * 100 : 0;
                                const barColor = SATUAN_COLOR[item.satuan] ?? "#a0b5a8";
                                return (
                                    <div key={item.sarok_id} style={{ display: "grid", gridTemplateColumns: "180px 1fr 130px", gap: "12px", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f4f7f5" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                                            <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#0f1f15", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.nama_sampah}</span>
                                            <span style={{ fontSize: "10px", fontWeight: 700, color: barColor, background: `${barColor}22`, padding: "2px 7px", borderRadius: "99px", flexShrink: 0, border: `1px solid ${barColor}44` }}>{item.satuan}</span>
                                        </div>
                                        <div style={{ height: "20px", borderRadius: "6px", background: "#e8f0eb", overflow: "hidden" }}>
                                            <div style={{ height: "100%", width: `${pct}%`, borderRadius: "6px", background: barColor, transition: "width 0.4s ease" }} />
                                        </div>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: item.rata_rata_harga > 0 ? "#013236" : "#a0b5a8", textAlign: "right", whiteSpace: "nowrap" }}>
                                            {item.rata_rata_harga > 0 ? fmt(item.rata_rata_harga) : "—"}
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
                                        fontSize: "12px", color: "#4EA771", fontWeight: 600,
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

            {/* ── Sampah Favorit Nasabah ── */}
            <div className="mr-header" style={{ paddingTop: 0 }}>
                <div className="mr-header-left">
                    <h2 className="mr-header-title">Sampah Favorit Nasabah</h2>
                    <p className="mr-header-desc">Top 10 jenis sampah paling sering disetorkan oleh nasabah.</p>
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
                    Belum ada data sampah favorit.
                </div>
            ) : (() => {
                const SATUAN_COLOR: Record<string, string> = { kg: "#013236", pcs: "#94DF0C", liter: "#4EA771" };
                const getValue = (d: SampahFavoritItem) => d[favoritMetric];
                const maxVal = Math.max(...favorit.map(getValue), 1);
                const fmtCompact = (n: number) => {
                    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
                    if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}rb`;
                    return n % 1 !== 0 ? n.toFixed(1) : String(n);
                };
                const metricLabel = favoritMetric === "total_qty" ? "qty" : favoritMetric === "jumlah_nasabah" ? "nasabah" : "setoran";

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
                                    { label: "Total Qty", value: "total_qty" },
                                    { label: "Jumlah Nasabah", value: "jumlah_nasabah" },
                                    { label: "Jumlah Setoran", value: "jumlah_setoran" },
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
                                const color = SATUAN_COLOR[item.satuan] ?? "#a0b5a8";
                                const labelX = padL + i * slotW + slotW / 2;

                                return (
                                    <g key={item.sarok_id}>
                                        {/* Bar */}
                                        <rect x={x} y={y} width={barW} height={barH} fill={color} rx={5} />

                                                        {/* Value label above bar */}
                                        {val > 0 && (
                                            <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={6} fill={color} fontWeight={700} fontFamily="Poppins, sans-serif">
                                                {fmtCompact(val)}
                                            </text>
                                        )}

                                        {/* X label: rotated */}
                                        <text
                                            x={labelX}
                                            y={padTop + chartH + 10}
                                            textAnchor="end"
                                            fontSize={7}
                                            fill="#4a5f52"
                                            fontFamily="Poppins, sans-serif"
                                            transform={`rotate(-40, ${labelX}, ${padTop + chartH + 10})`}
                                        >
                                            {item.nama_sampah.length > 14 ? item.nama_sampah.slice(0, 13) + "…" : item.nama_sampah}
                                        </text>

                                        {/* Satuan badge */}
                                        <text
                                            x={labelX}
                                            y={padTop + chartH + 10}
                                            textAnchor="end"
                                            fontSize={5.5}
                                            fill={color}
                                            fontFamily="Poppins, sans-serif"
                                            fontWeight={700}
                                            transform={`rotate(-40, ${labelX}, ${padTop + chartH + 10}) translate(0, 9)`}
                                        >
                                            {item.satuan}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>

                        {/* Legend satuan */}
                        <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "8px" }}>
                            {[["kg", "#013236"], ["pcs", "#94DF0C"], ["liter", "#4EA771"]].map(([sat, color]) => (
                                <div key={sat} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                    <span style={{ width: 10, height: 10, borderRadius: "3px", background: color, display: "inline-block" }} />
                                    <span style={{ fontSize: "12px", color: "#4a5f52", fontFamily: "Poppins, sans-serif" }}>{sat}</span>
                                </div>
                            ))}
                            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginLeft: "8px", paddingLeft: "12px", borderLeft: "1px solid #e8f0eb" }}>
                                <span style={{ fontSize: "12px", color: "#a0b5a8", fontFamily: "Poppins, sans-serif" }}>Menampilkan: {metricLabel}</span>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── Modal ── */}
            <SampahMasterModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditTarget(null); }}
                onSubmit={handleSubmit}
                initialData={editTarget}
            />

            {/* ── Confirm Delete ── */}
            <PopupConfirmation
                isOpen={!!deleteTarget}
                type="danger"
                title="Hapus Item Sampah?"
                message={`"${deleteTarget?.NamaSampah || ""}" akan dihapus dari master data. Item yang sudah digunakan dalam katalog tidak dapat dihapus.`}
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
