import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import {
    FaCalendarDays,
    FaUser,
    FaGift,
    FaMoneyBillWave,
    FaClock,
    FaClockRotateLeft,
    FaImage,
    FaBoxOpen,
    FaBasketShopping,
    FaXmark,
} from "react-icons/fa6";
import ViewPhoto from "../components/view-photo";
import { useAuth } from "../contexts/AuthContext";
import BreadcrumbLayout from "../layouts/breadcrumb";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import {
    PenarikanService,
    type PenarikanDetail,
} from "../services/penarikan.service";
import "../styles/detail-penimbangan.css";
import "../styles/detail-penjualan.css";
import "../styles/detail-pengangkutan.css";
import { formatTanggalJam, formatTanggalJamBullet } from "../utils/date.utils";

/* ── Status map (header pill) ── */
const STATUS_PENARIKAN: Record<string, { label: string; cls: string }> = {
    pending:         { label: "Diajukan",              cls: "aktif"      },
    approved:        { label: "Menunggu Dijemput",      cls: "aktif"      },
    completed:       { label: "Selesai",                cls: "selesai"    },
    canceled:        { label: "Dibatalkan",             cls: "dibatalkan" },
    rejected:        { label: "Ditolak",                cls: "dibatalkan" },
    request_expired: { label: "Pengajuan Kadaluarsa",   cls: "dibatalkan" },
    pickup_expired:  { label: "Penjemputan Kadaluarsa", cls: "dibatalkan" },
};

/* ── Status map (riwayat timeline) ── */
const RIWAYAT_STATUS_PENARIKAN: Record<string, { label: string; cls: string }> = {
    pending:         { label: "Diajukan",              cls: "pending"  },
    approved:        { label: "Menunggu Dijemput",      cls: "approved" },
    completed:       { label: "Selesai",                cls: "completed" },
    canceled:        { label: "Dibatalkan",             cls: "canceled" },
    rejected:        { label: "Ditolak",                cls: "rejected" },
    request_expired: { label: "Pengajuan Kadaluarsa",   cls: "expired"  },
    pickup_expired:  { label: "Penjemputan Kadaluarsa", cls: "expired"  },
};

/* ── Helpers ── */
function formatNominal(nominal: number, satuan: string): string {
    const num = nominal.toLocaleString("id-ID");
    return satuan === "Rp" ? `Rp ${num}` : `${num} poin`;
}

/* ── Component ── */
export default function DetailPenarikanPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();

    const role = user?.role?.toLowerCase();
    const rolePrefix = role === "admin_bsi" ? "/bsi" : role === "admin_bsu" ? "/bsu" : "/bsm";
    const riwayatPath = `${rolePrefix}/riwayat`;

    const [detail, setDetail] = useState<PenarikanDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [fotoOpen, setFotoOpen] = useState(false);
    const [riwayatOpen, setRiwayatOpen] = useState(false);
    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(false);
        PenarikanService.getDetail(id)
            .then((data) => setDetail(data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        document.body.style.overflow = riwayatOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [riwayatOpen]);

    const breadcrumbItems = [
        { label: "Riwayat", path: riwayatPath },
        { label: "Detail Penarikan" },
    ];

    const header = detail?.header;

    const statusConf = header
        ? (STATUS_PENARIKAN[header.status_penarikan] ?? { label: header.status_penarikan, cls: "" })
        : null;

    const isBarang = header?.satuan_penarikan === "poin";
    const hasBuktiFoto = !!header?.bukti_foto;

    return (
        <>
            <BreadcrumbLayout items={breadcrumbItems} />

            <div className="dp-page">
                {/* Hero */}
                <div className="dp-hero">
                    <div className="dp-hero-left">
                        <h1>Detail Penarikan</h1>
                        <p>Informasi lengkap transaksi penarikan reward nasabah</p>
                    </div>
                </div>

                {loading && (
                    <div className="dp-loading">Memuat data penarikan…</div>
                )}

                {!loading && error && (
                    <div className="dp-error">Gagal memuat data. Silakan coba lagi.</div>
                )}

                {!loading && !error && detail && header && (
                    <div className="dp-card">

                        {/* ── LEFT: Overview ── */}
                        <div className="dp-overview">

                            <div className="dp-overview-header">
                                <div>
                                    <p className="dp-overview-title">Informasi Penarikan</p>
                                    <p className="dp-overview-subtitle">ID : {header.penarikan_id}</p>
                                </div>
                            </div>

                            {statusConf && (
                                <span className={`dp-status-pill ${statusConf.cls}`}>
                                    <span className="dp-status-dot" />
                                    {statusConf.label}
                                </span>
                            )}

                            <div className="dp-divider" />

                            <div className="dp-info-list">
                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaUser /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Nama Nasabah</span>
                                        <span className="dp-info-value">{header.nama_nasabah}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaGift /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Jenis Reward</span>
                                        <span className="dp-info-value">{header.nama_reward}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaMoneyBillWave /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Nominal Penarikan</span>
                                        <span className="dp-info-value">
                                            {formatNominal(header.nominal_penarikan, header.satuan_penarikan)}
                                        </span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaCalendarDays /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Batas Konfirmasi</span>
                                        <span className="dp-info-value">{header.deadline_konfirmasi ? formatTanggalJam(header.deadline_konfirmasi) : "—"}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaClock /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Batas Penjemputan</span>
                                        <span className="dp-info-value">{header.deadline_jemput ? formatTanggalJam(header.deadline_jemput) : "—"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="dp-divider" />

                            {/* Riwayat button */}
                            <button className="dpg-sesi-btn" onClick={() => setRiwayatOpen(true)}>
                                <FaClockRotateLeft />
                                Riwayat Penarikan
                            </button>

                            {hasBuktiFoto && (
                                <button className="dpj-foto-btn" style={{ marginTop: "10px" }} onClick={() => setFotoOpen(true)}>
                                    <FaImage />
                                    Lihat Bukti Foto
                                </button>
                            )}
                        </div>

                        {/* ── RIGHT: Detail Reward ── */}
                        <div className="dp-setoran-col">
                            {isBarang ? (
                                <>
                                    <div className="dp-setoran-header">
                                        <div>
                                            <p className="dp-setoran-title">Rincian Barang</p>
                                            <p className="dp-setoran-subtitle">Daftar item barang yang ditukarkan</p>
                                        </div>
                                        <span className="dp-setoran-count-badge">
                                            {detail.detail_penarikan?.length ?? 0} item
                                        </span>
                                    </div>

                                    {!detail.detail_penarikan || detail.detail_penarikan.length === 0 ? (
                                        <div className="dp-setoran-empty">
                                            <FaBoxOpen />
                                            <span>Belum ada rincian barang.</span>
                                        </div>
                                    ) : (
                                        <div className="dpj-items-list">
                                            {detail.detail_penarikan.map((item) => (
                                                <div key={item.produk_id} className="dpj-item-row">
                                                    <div className="dpj-item-icon">
                                                        <FaBasketShopping />
                                                    </div>
                                                    <div className="dpj-item-body">
                                                        <span className="dpj-item-name">{item.nama_barang}</span>
                                                        <span className="dpj-item-detail">
                                                            {item.qty} × {item.nilai_poin.toLocaleString("id-ID")} poin
                                                        </span>
                                                    </div>
                                                    <div className="dpj-item-right">
                                                        <span className="dpj-item-subtotal">
                                                            {item.subtotal_poin.toLocaleString("id-ID")} poin
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="dp-divider" style={{ margin: "4px 0" }} />

                                    <div className="dp-stats-row">
                                        <div className="dp-stat-chip">
                                            <span className="dp-stat-chip-value">
                                                {detail.detail_penarikan?.length ?? 0}
                                            </span>
                                            <span className="dp-stat-chip-label">Total Item</span>
                                        </div>
                                        <div className="dp-stat-chip">
                                            <span className="dp-stat-chip-value">
                                                {header.nominal_penarikan.toLocaleString("id-ID")}
                                            </span>
                                            <span className="dp-stat-chip-label">Total Poin</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="dp-setoran-header">
                                        <div>
                                            <p className="dp-setoran-title">Penarikan Uang</p>
                                            <p className="dp-setoran-subtitle">Pencairan reward dalam bentuk tunai</p>
                                        </div>
                                    </div>

                                    <div className="dp-stat-chip" style={{ maxWidth: "240px" }}>
                                        <span className="dp-stat-chip-value">
                                            Rp {header.nominal_penarikan.toLocaleString("id-ID")}
                                        </span>
                                        <span className="dp-stat-chip-label">Nominal Dicairkan</span>
                                    </div>

                                    {!hasBuktiFoto && header.status_penarikan === "pending" && (
                                        <p style={{
                                            fontFamily: "'Poppins', sans-serif",
                                            fontSize: "12px",
                                            color: "#7a9e8a",
                                            margin: "8px 0 0",
                                        }}>
                                            Bukti foto akan tersedia setelah penarikan dikonfirmasi.
                                        </p>
                                    )}
                                </>
                            )}
                        </div>

                    </div>
                )}
            </div>

            {/* Popup Notifikasi */}
            {popupNotif && (
                <PopupNotifikasi
                    message={popupNotif.message}
                    type={popupNotif.type}
                    onClose={() => setPopupNotif(null)}
                />
            )}

            {fotoOpen && header?.bukti_foto && (
                <ViewPhoto
                    src={header.bukti_foto}
                    alt="Bukti foto penarikan"
                    onClose={() => setFotoOpen(false)}
                />
            )}

            {/* ── Riwayat Popup ── */}
            {riwayatOpen && createPortal(
                <div className="dpg-overlay" onClick={() => setRiwayatOpen(false)}>
                    <div className="dpg-popup" onClick={(e) => e.stopPropagation()}>

                        {/* Popup Header */}
                        <div className="dpg-popup-header">
                            <p className="dpg-popup-title">Riwayat Penarikan</p>
                            <button className="dpg-popup-close" onClick={() => setRiwayatOpen(false)}>
                                <FaXmark />
                            </button>
                        </div>

                        {!detail || detail.riwayat.length === 0 ? (
                            <div className="dpg-popup-loading">Belum ada riwayat penarikan.</div>
                        ) : (
                            <div className="dpg-timeline">
                                {detail.riwayat.map((entry, i) => {
                                    const st = RIWAYAT_STATUS_PENARIKAN[entry.status_penarikan] ?? { label: entry.status_penarikan, cls: "" };
                                    return (
                                        <div key={entry.riwayat_penarikan_id} className="dpg-timeline-item">
                                            <div className="dpg-timeline-left">
                                                <div className="dpg-timeline-dot" />
                                                {detail && i < detail.riwayat.length - 1 && (
                                                    <div className="dpg-timeline-line" />
                                                )}
                                            </div>
                                            <div className="dpg-timeline-content">
                                                <span className={`dpg-timeline-status dpg-status-${st.cls}`}>
                                                    {st.label}
                                                </span>
                                                <span className="dpg-timeline-time">
                                                    {entry.created_at ? formatTanggalJamBullet(entry.created_at) : "—"}
                                                </span>
                                                {entry.created_by && (
                                                    <span className="dpg-timeline-by">{entry.created_by}</span>
                                                )}
                                                {entry.catatan && (
                                                    <span className="dpg-timeline-note">{entry.catatan}</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
