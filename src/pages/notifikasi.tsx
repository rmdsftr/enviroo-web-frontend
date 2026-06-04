import { useState, useEffect, useCallback, useMemo } from "react";
import {
    FaBell, FaCircleCheck, FaTriangleExclamation, FaGear,
    FaArrowDown, FaCheckDouble, FaCalendarCheck, FaBoxOpen,
    FaMoneyBillWave, FaTruck, FaFileCircleCheck,
} from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import { NotifikasiService, type NotifikasiItem, type NotifRefType } from "../services/notifikasi.service";
import "../styles/notifikasi.css";

/* ── Helpers ── */
function formatRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "Baru saja";
    if (min < 60) return `${min} menit lalu`;
    const hour = Math.floor(min / 60);
    if (hour < 24) return `${hour} jam lalu`;
    const day = Math.floor(hour / 24);
    if (day === 1) return "Kemarin";
    return `${day} hari lalu`;
}

/* ── ref_type → visual category ── */
type VisualKat = "sistem" | "aktivitas" | "peringatan";

function getKategori(refType: NotifRefType): VisualKat {
    if (!refType) return "sistem";
    if (refType === "kontrak") return "peringatan";
    return "aktivitas";
}

/* ── Icon map by ref_type ── */
const ICON_BY_REF: Partial<Record<NonNullable<NotifRefType>, React.ReactNode>> = {
    setoran:                 <FaArrowDown />,
    bagi_hasil:              <FaMoneyBillWave />,
    penarikan:               <FaMoneyBillWave />,
    kontrak:                 <FaTriangleExclamation />,
    pengajuan:               <FaFileCircleCheck />,
    pengangkutan:            <FaTruck />,
    distribusi_sembako:      <FaBoxOpen />,
    jadwal_penimbangan:      <FaCalendarCheck />,
    jadwal_pengangkutan:     <FaCalendarCheck />,
    pengajuan_pengangkutan:  <FaFileCircleCheck />,
};

function getIcon(refType: NotifRefType): React.ReactNode {
    if (!refType) return <FaGear />;
    return ICON_BY_REF[refType] ?? <FaCircleCheck />;
}

const ICON_COLOR: Record<VisualKat, string> = {
    sistem:     "notif-icon-sistem",
    aktivitas:  "notif-icon-aktivitas",
    peringatan: "notif-icon-peringatan",
};

const KATEGORI_COLOR: Record<VisualKat, string> = {
    sistem:     "notif-cat-sistem",
    aktivitas:  "notif-cat-aktivitas",
    peringatan: "notif-cat-peringatan",
};

const KATEGORI_LABEL: Record<VisualKat, string> = {
    sistem:     "sistem",
    aktivitas:  "aktivitas",
    peringatan: "peringatan",
};

/* ── Filter ── */
type FilterType = "semua" | "belum_dibaca";

const FILTERS: { key: FilterType; label: string }[] = [
    { key: "semua",        label: "SEMUA" },
    { key: "belum_dibaca", label: "BELUM DIBACA" },
];

const LIMIT = 20;

/* ── Page ── */
export default function NotifikasiPage() {
    const { user } = useAuth();
    const [filter, setFilter] = useState<FilterType>("semua");
    const [notifs, setNotifs] = useState<NotifikasiItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);

    const userId = user?.user_id;

    const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
        if (!userId) return;
        if (pageNum === 1) setLoading(true); else setLoadingMore(true);
        try {
            const res = await NotifikasiService.getList(userId, pageNum, LIMIT);
            setNotifs(prev => append ? [...prev, ...res.data] : res.data);
            setHasMore(pageNum < res.meta.total_halaman);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [userId]);

    useEffect(() => {
        setPage(1);
        fetchPage(1, false);
    }, [fetchPage]);

    const handleLoadMore = () => {
        const next = page + 1;
        setPage(next);
        fetchPage(next, true);
    };

    const handleMarkRead = async (item: NotifikasiItem) => {
        if (item.is_read) return;
        setNotifs(prev => prev.map(n =>
            n.notifikasi_id === item.notifikasi_id ? { ...n, is_read: true } : n
        ));
        try {
            await NotifikasiService.markAsRead(item.notifikasi_id);
        } catch {
            setNotifs(prev => prev.map(n =>
                n.notifikasi_id === item.notifikasi_id ? { ...n, is_read: false } : n
            ));
        }
    };

    const handleMarkAll = async () => {
        if (!userId || markingAll) return;
        setMarkingAll(true);
        setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
        try {
            await NotifikasiService.markAllAsRead(userId);
        } catch {
            setPage(1);
            fetchPage(1, false);
        } finally {
            setMarkingAll(false);
        }
    };

    const filtered = useMemo(() => {
        if (filter === "belum_dibaca") return notifs.filter(n => !n.is_read);
        return notifs;
    }, [filter, notifs]);

    const unreadCount = notifs.filter(n => !n.is_read).length;

    return (
        <div className="notif-page">

            {/* ── Header ── */}
            <div className="notif-header">
                <div className="notif-header-left">
                    <p className="notif-title">Notifikasi</p>
                    {unreadCount > 0 && (
                        <span className="notif-unread-badge">{unreadCount} belum dibaca</span>
                    )}
                </div>
            </div>

            {/* ── Filter Chips + Tandai Semua ── */}
            <div className="notif-filters">
                {FILTERS.map(f => (
                    <button
                        key={f.key}
                        className={`notif-chip${filter === f.key ? " active" : ""}`}
                        onClick={() => setFilter(f.key)}
                    >
                        {f.label}
                        {f.key === "belum_dibaca" && unreadCount > 0 && (
                            <span className="notif-chip-badge">{unreadCount}</span>
                        )}
                    </button>
                ))}
                {unreadCount > 0 && (
                    <button
                        className="notif-mark-all-btn"
                        onClick={handleMarkAll}
                        disabled={markingAll}
                        style={{ marginLeft: "auto" }}
                    >
                        <FaCheckDouble />
                        {markingAll ? "Memproses…" : "Tandai semua dibaca"}
                    </button>
                )}
            </div>

            {/* ── List ── */}
            {loading ? (
                <div className="notif-empty">Memuat notifikasi…</div>
            ) : (
                <div className="notif-list">
                    {filtered.length === 0 ? (
                        <div className="notif-empty">
                            <FaBell />
                            <span>Tidak ada notifikasi</span>
                        </div>
                    ) : (
                        filtered.map(notif => {
                            const kat = getKategori(notif.ref_type);
                            return (
                                <div
                                    key={notif.notifikasi_id}
                                    className={`notif-item${notif.is_read ? "" : " unread"}`}
                                    onClick={() => handleMarkRead(notif)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={e => e.key === "Enter" && handleMarkRead(notif)}
                                >
                                    <div className={`notif-icon-wrap ${ICON_COLOR[kat]}`}>
                                        {getIcon(notif.ref_type)}
                                    </div>
                                    <div className="notif-content">
                                        <div className="notif-content-top">
                                            <span className="notif-judul">{notif.judul}</span>
                                            <span className={`notif-kategori-tag ${KATEGORI_COLOR[kat]}`}>
                                                {KATEGORI_LABEL[kat]}
                                            </span>
                                        </div>
                                        <p className="notif-pesan">{notif.pesan}</p>
                                        <span className="notif-waktu">
                                            {formatRelativeTime(notif.created_at)}
                                        </span>
                                    </div>
                                    {!notif.is_read && <span className="notif-unread-dot" />}
                                </div>
                            );
                        })
                    )}

                    {hasMore && filter === "semua" && (
                        <button
                            className="notif-load-more"
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                        >
                            {loadingMore ? "Memuat…" : "Muat lebih banyak"}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
