import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import {
    FaCalendarDays,
    FaUser,
    FaGift,
    FaMoneyBillWave,
    FaClock,
    FaImage,
    FaBoxOpen,
    FaBasketShopping,
    FaXmark,
} from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import BreadcrumbLayout from "../layouts/breadcrumb";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import {
    PenarikanService,
    type PenarikanDetail,
} from "../services/penarikan.service";
import "../styles/detail-penimbangan.css";
import "../styles/detail-penjualan.css";
import { formatTanggalPanjang, formatTanggalJam } from "../utils/date.utils";

/* ── Status map ── */
const STATUS_PENARIKAN: Record<string, { label: string; cls: string }> = {
    pending:    { label: "Pending",    cls: "aktif"      },
    berhasil:   { label: "Berhasil",   cls: "selesai"    },
    kadaluarsa: { label: "Kadaluarsa", cls: "dibatalkan" },
    dibatalkan: { label: "Dibatalkan", cls: "dibatalkan" },
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
        document.body.style.overflow = fotoOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [fotoOpen]);

    const breadcrumbItems = [
        { label: "Riwayat", path: riwayatPath },
        { label: "Detail Penarikan" },
    ];

    const statusConf = detail
        ? (STATUS_PENARIKAN[detail.status_penarikan] ?? { label: detail.status_penarikan, cls: "" })
        : null;

    const isSembako = detail?.satuan_penarikan === "poin";
    const hasBuktiFoto = !!detail?.bukti_foto;

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

                {!loading && !error && detail && (
                    <div className="dp-card">

                        {/* ── LEFT: Overview ── */}
                        <div className="dp-overview">

                            <div className="dp-overview-header">
                                <div>
                                    <p className="dp-overview-title">Informasi Penarikan</p>
                                    <p className="dp-overview-subtitle">ID : {detail.penarikan_id}</p>
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
                                        <span className="dp-info-value">{detail.nama_nasabah}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaGift /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Jenis Reward</span>
                                        <span className="dp-info-value">{detail.nama_reward}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaMoneyBillWave /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Nominal Penarikan</span>
                                        <span className="dp-info-value">
                                            {formatNominal(detail.nominal_penarikan, detail.satuan_penarikan)}
                                        </span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaCalendarDays /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Tanggal Penarikan</span>
                                        <span className="dp-info-value">{formatTanggalPanjang(detail.created_at)}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaClock /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Batas Kadaluarsa</span>
                                        <span className="dp-info-value">{detail.kadaluarsa_at ? formatTanggalJam(detail.kadaluarsa_at) : "—"}</span>
                                    </div>
                                </div>
                            </div>

                            {hasBuktiFoto && (
                                <>
                                    <div className="dp-divider" />
                                    <button className="dpj-foto-btn" onClick={() => setFotoOpen(true)}>
                                        <FaImage />
                                        Lihat Bukti Foto
                                    </button>
                                </>
                            )}
                        </div>

                        {/* ── RIGHT: Detail Reward ── */}
                        <div className="dp-setoran-col">
                            {isSembako ? (
                                <>
                                    <div className="dp-setoran-header">
                                        <div>
                                            <p className="dp-setoran-title">Rincian Sembako</p>
                                            <p className="dp-setoran-subtitle">Daftar item sembako yang ditukarkan</p>
                                        </div>
                                        <span className="dp-setoran-count-badge">
                                            {detail.detail_sembako?.length ?? 0} item
                                        </span>
                                    </div>

                                    {!detail.detail_sembako || detail.detail_sembako.length === 0 ? (
                                        <div className="dp-setoran-empty">
                                            <FaBoxOpen />
                                            <span>Belum ada rincian sembako.</span>
                                        </div>
                                    ) : (
                                        <div className="dpj-items-list">
                                            {detail.detail_sembako.map((item) => (
                                                <div key={item.sembako_id} className="dpj-item-row">
                                                    <div className="dpj-item-icon">
                                                        <FaBasketShopping />
                                                    </div>
                                                    <div className="dpj-item-body">
                                                        <span className="dpj-item-name">{item.nama_sembako}</span>
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
                                                {detail.detail_sembako?.length ?? 0}
                                            </span>
                                            <span className="dp-stat-chip-label">Total Item</span>
                                        </div>
                                        <div className="dp-stat-chip">
                                            <span className="dp-stat-chip-value">
                                                {detail.nominal_penarikan.toLocaleString("id-ID")}
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
                                            Rp {detail.nominal_penarikan.toLocaleString("id-ID")}
                                        </span>
                                        <span className="dp-stat-chip-label">Nominal Dicairkan</span>
                                    </div>

                                    {!hasBuktiFoto && detail.status_penarikan === "pending" && (
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

            {/* ── Bukti Foto Popup ── */}
            {fotoOpen && detail?.bukti_foto && createPortal(
                <div className="dpj-foto-overlay" onClick={() => setFotoOpen(false)}>
                    <div className="dpj-foto-popup" onClick={(e) => e.stopPropagation()}>
                        <div className="dpj-foto-header">
                            <p className="dpj-foto-title">Bukti Foto Penarikan</p>
                            <button className="dpj-foto-close" onClick={() => setFotoOpen(false)}>
                                <FaXmark />
                            </button>
                        </div>
                        <img
                            src={detail.bukti_foto}
                            alt="Bukti foto penarikan"
                            className="dpj-foto-img"
                        />
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
