import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import {
    FaCalendarDays,
    FaHandshake,
    FaUser,
    FaGift,
    FaMoneyBillWave,
    FaImage,
    FaBoxOpen,
    FaLeaf,
    FaXmark,
    FaFileExport,
    FaChartPie,
} from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import BreadcrumbLayout from "../layouts/breadcrumb";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import Button from "../components/button";
import {
    PenjualanService,
    type PenjualanDetail,
} from "../services/penjualan.service";
import "../styles/detail-penimbangan.css";
import "../styles/detail-penjualan.css";
import { formatTanggalPanjang } from "../utils/date.utils";

/* ── Status map ── */
const STATUS_BAGI_HASIL: Record<string, { label: string; cls: string }> = {
    berhasil: { label: "Berhasil", cls: "selesai"    },
    pending:  { label: "Pending",  cls: "aktif"      },
    gagal:    { label: "Gagal",    cls: "dibatalkan" },
};

/* ── Helpers ── */
function formatAmount(amount: number, satuan: string): string {
    const num = amount.toLocaleString("id-ID");
    return satuan === "Rp" ? `Rp ${num}` : `${num} ${satuan}`;
}

/* ── Component ── */
export default function DetailPenjualanPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const role = user?.role?.toLowerCase();
    const rolePrefix = role === "admin_bsi" ? "/bsi" : role === "admin_bsu" ? "/bsu" : "/bsm";
    const riwayatPath = `${rolePrefix}/riwayat`;

    const [detail, setDetail] = useState<PenjualanDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [fotoOpen, setFotoOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(false);
        PenjualanService.getDetailEksternal(id)
            .then((data) => setDetail(data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        document.body.style.overflow = fotoOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [fotoOpen]);

    const handleExport = async () => {
        if (!id) return;
        setExporting(true);
        try {
            const blob = await PenjualanService.exportLaporan(id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `laporan-penjualan-${id}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            setPopupNotif({ message: "Gagal mengunduh laporan. Silakan coba lagi.", type: "error" });
        } finally {
            setExporting(false);
        }
    };

    const breadcrumbItems = [
        { label: "Riwayat", path: riwayatPath },
        { label: "Detail Penjualan" },
    ];

    const statusConf = detail
        ? (STATUS_BAGI_HASIL[detail.status_bagi_hasil] ?? { label: detail.status_bagi_hasil, cls: "" })
        : null;

    const fmt = (amount: number) => detail ? formatAmount(amount, detail.satuan_reward) : "";

    return (
        <>
            <BreadcrumbLayout items={breadcrumbItems} />

            <div className="dp-page">
                {/* Hero */}
                <div className="dp-hero">
                    <div className="dp-hero-left">
                        <h1>Detail Penjualan</h1>
                        <p>Informasi lengkap transaksi penjualan sampah eksternal</p>
                    </div>
                    <div className="dp-hero-right">
                        <Button
                            icon={<FaFileExport />}
                            color="secondary"
                            variant="solid"
                            size="default"
                            isRounded
                            onClick={handleExport}
                            disabled={exporting}
                        >
                            {exporting ? "Mengunduh…" : "Ekspor Laporan"}
                        </Button>
                    </div>
                </div>

                {loading && (
                    <div className="dp-loading">Memuat data penjualan…</div>
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
                                    <p className="dp-overview-title">Detail Penjualan</p>
                                    <p className="dp-overview-subtitle">ID : {detail.penjualan_id}</p>
                                </div>
                            </div>

                            {statusConf && (
                                <span className={`dp-status-pill ${statusConf.cls}`}>
                                    <span className="dp-status-dot" />
                                    {statusConf.label}
                                </span>
                            )}

                            <div className="dp-divider" />

                            {/* Info Rows */}
                            <div className="dp-info-list">
                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaCalendarDays /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Tanggal</span>
                                        <span className="dp-info-value">{formatTanggalPanjang(detail.created_at)}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaHandshake /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Identitas Pembeli</span>
                                        <span className="dp-info-value">{detail.identitas_pembeli}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaUser /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Admin</span>
                                        <span className="dp-info-value">{detail.admin_name}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaGift /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Reward</span>
                                        <span className="dp-info-value">{detail.nama_reward}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaMoneyBillWave /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Total Penjualan</span>
                                        <span className="dp-info-value">{fmt(detail.total_penjualan)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="dp-divider" />

                            {/* Action buttons */}
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <button className="dpj-foto-btn" onClick={() => setFotoOpen(true)}>
                                    <FaImage />
                                    Lihat Bukti Foto
                                </button>
                                {detail.status_bagi_hasil === "berhasil" && (
                                    <button
                                        className="dpj-foto-btn"
                                        onClick={() => navigate(`${rolePrefix}/bagi-hasil/${detail.penjualan_id}`)}
                                    >
                                        <FaChartPie />
                                        Lihat Bagi Hasil
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* ── RIGHT: Daftar Sampah ── */}
                        <div className="dp-setoran-col">
                            {/* Daftar Sampah Dijual */}
                            <div className="dp-setoran-header">
                                <div>
                                    <p className="dp-setoran-title">Daftar Sampah Dijual</p>
                                    <p className="dp-setoran-subtitle">Rincian jenis, jumlah, dan harga jual</p>
                                </div>
                                <span className="dp-setoran-count-badge">{detail.items_sampah.length} jenis</span>
                            </div>

                            {detail.items_sampah.length === 0 ? (
                                <div className="dp-setoran-empty">
                                    <FaBoxOpen />
                                    <span>Belum ada data sampah.</span>
                                </div>
                            ) : (
                                <div className="dpj-items-list">
                                    {detail.items_sampah.map((item) => (
                                        <div key={item.sampah_id} className="dpj-item-row">
                                            <div className="dpj-item-icon">
                                                <FaLeaf />
                                            </div>
                                            <div className="dpj-item-body">
                                                <span className="dpj-item-name">{item.nama_sampah}</span>
                                                <span className="dpj-item-detail">
                                                    {item.qty} × {fmt(item.harga_jual)}
                                                </span>
                                            </div>
                                            <div className="dpj-item-right">
                                                <span className="dpj-item-subtotal">{fmt(item.subtotal_penjualan)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="dp-divider" style={{ margin: "8px 0" }} />

                            {/* Daftar Harga ke Nasabah */}
                            <div className="dp-setoran-header">
                                <div>
                                    <p className="dp-setoran-title">Daftar Harga ke Nasabah</p>
                                    <p className="dp-setoran-subtitle">Harga snapshot yang diterima nasabah</p>
                                </div>
                            </div>

                            <div className="dpj-items-list">
                                {detail.items_sampah.map((item) => (
                                    <div key={`nasabah-${item.sampah_id}`} className="dpj-item-row">
                                        <div className="dpj-item-icon">
                                            <FaLeaf />
                                        </div>
                                        <div className="dpj-item-body">
                                            <span className="dpj-item-name">{item.nama_sampah}</span>
                                            <span className="dpj-item-detail">{item.sampah_id}</span>
                                        </div>
                                        <div className="dpj-item-right">
                                            <span className="dpj-item-subtotal">{fmt(item.harga_nasabah_snapshot)}</span>
                                            <span className="dpj-item-unit-price">per satuan</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
            {fotoOpen && detail && createPortal(
                <div className="dpj-foto-overlay" onClick={() => setFotoOpen(false)}>
                    <div className="dpj-foto-popup" onClick={(e) => e.stopPropagation()}>
                        <div className="dpj-foto-header">
                            <p className="dpj-foto-title">Bukti Foto Penjualan</p>
                            <button className="dpj-foto-close" onClick={() => setFotoOpen(false)}>
                                <FaXmark />
                            </button>
                        </div>
                        <img
                            src={detail.bukti_foto}
                            alt="Bukti foto penjualan"
                            className="dpj-foto-img"
                        />
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
