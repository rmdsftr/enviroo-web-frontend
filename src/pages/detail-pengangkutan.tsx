import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import {
    FaCalendarDays,
    FaBuilding,
    FaUser,
    FaClockRotateLeft,
    FaBoxOpen,
    FaLeaf,
    FaXmark,
    FaFileExport,
} from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import BreadcrumbLayout from "../layouts/breadcrumb";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import Button from "../components/button";
import {
    PengangkutanService,
    type PengangkutanDetail,
    type PengangkutanSesiActive,
} from "../services/pengangkutan.service";
import "../styles/detail-penimbangan.css";
import "../styles/detail-pengangkutan.css";
import { formatTanggalPanjang, formatTanggalJamBullet } from "../utils/date.utils";

/* ── Status maps ── */
const PAKET_STATUS_MAP: Record<string, { label: string; cls: string }> = {
    berhasil: { label: "Berhasil", cls: "selesai"    },
    gagal:    { label: "Gagal",    cls: "dibatalkan" },
    pending:  { label: "Menunggu", cls: "aktif"      },
};

const SESI_STATUS_MAP: Record<string, { label: string; cls: string }> = {
    completed: { label: "Selesai",          cls: "completed" },
    otw:       { label: "Dalam Perjalanan", cls: "otw"       },
    requested: { label: "Diminta",          cls: "requested" },
    arrived:   { label: "Tiba di Lokasi",   cls: "arrived"   },
};

/* ── Component ── */
export default function DetailPengangkutanPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();

    const role = user?.role?.toLowerCase();
    const rolePrefix = role === "admin_bsi" ? "/bsi" : role === "admin_bsu" ? "/bsu" : "/bsm";
    const riwayatPath = `${rolePrefix}/riwayat`;

    const [detail, setDetail] = useState<PengangkutanDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [exporting, setExporting] = useState(false);

    const [sesiOpen, setSesiOpen] = useState(false);
    const [sesiData, setSesiData] = useState<PengangkutanSesiActive | null>(null);
    const [sesiLoading, setSesiLoading] = useState(false);
    const [sesiError, setSesiError] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(false);
        PengangkutanService.getDetailSampah(id)
            .then((data) => setDetail(data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        document.body.style.overflow = sesiOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [sesiOpen]);

    const handleOpenSesi = async () => {
        if (!id) return;
        setSesiOpen(true);
        setSesiLoading(true);
        setSesiError(false);
        setSesiData(null);
        try {
            const data = await PengangkutanService.getDetailSesiActive(id);
            setSesiData(data);
        } catch {
            setSesiError(true);
        } finally {
            setSesiLoading(false);
        }
    };

    const handleCloseSesi = () => setSesiOpen(false);

    const handleExport = async () => {
        if (!id || exporting) return;
        setExporting(true);
        try {
            const blob = await PengangkutanService.exportLaporan(id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `laporan-pengangkutan-${id}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            setPopupNotif({ message: "Gagal mengekspor laporan. Silakan coba lagi.", type: "error" });
        } finally {
            setExporting(false);
        }
    };

    /* ── Breadcrumb ── */
    const breadcrumbItems = [
        { label: "Riwayat", path: riwayatPath },
        { label: "Detail Pengangkutan" },
    ];

    const statusConf = detail
        ? (PAKET_STATUS_MAP[detail.header.status_setoran] ?? { label: detail.header.status_setoran, cls: "" })
        : null;

    return (
        <>
            <BreadcrumbLayout items={breadcrumbItems} />

            <div className="dp-page">
                {/* Hero */}
                <div className="dp-hero">
                    <div className="dp-hero-left">
                        <h1>Detail Pengangkutan</h1>
                        <p>Informasi lengkap sesi pengangkutan beserta daftar sampah yang diangkut</p>
                    </div>
                    <div className="dp-hero-right">
                        <Button
                            icon={<FaFileExport />}
                            color="secondary"
                            variant="solid"
                            size="default"
                            isRounded
                            disabled={exporting}
                            onClick={handleExport}
                        >
                            {exporting ? "Mengekspor..." : "Ekspor Laporan"}
                        </Button>
                    </div>
                </div>

                {loading && (
                    <div className="dp-loading">Memuat data pengangkutan…</div>
                )}

                {!loading && error && (
                    <div className="dp-error">Gagal memuat data. Silakan coba lagi.</div>
                )}

                {!loading && !error && detail && (
                    <div className="dp-card">

                        {/* ── LEFT: Overview ── */}
                        <div className="dp-overview">

                            {/* Header */}
                            <div className="dp-overview-header">
                                <div>
                                    <p className="dp-overview-title">Detail Pengangkutan</p>
                                    <p className="dp-overview-subtitle">ID : {detail.header.pengangkutan_id}</p>
                                </div>
                            </div>

                            {/* Status */}
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
                                        <span className="dp-info-value">{formatTanggalPanjang(detail.header.created_at)}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaBuilding /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Bank Sampah Induk</span>
                                        <span className="dp-info-value">{detail.header.nama_bsi}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaBuilding /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Bank Sampah Unit</span>
                                        <span className="dp-info-value">{detail.header.nama_bsu}</span>
                                    </div>
                                </div>

                                {detail.header.nama_admin_bsi && (
                                    <div className="dp-info-row">
                                        <div className="dp-info-icon-wrap"><FaUser /></div>
                                        <div className="dp-info-text">
                                            <span className="dp-info-label">Admin BSI</span>
                                            <span className="dp-info-value">{detail.header.nama_admin_bsi}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="dp-divider" />

                            {/* Sesi button */}
                            <button className="dpg-sesi-btn" onClick={handleOpenSesi}>
                                <FaClockRotateLeft />
                                Riwayat Sesi Pengangkutan
                            </button>
                        </div>

                        {/* ── RIGHT: Daftar Sampah ── */}
                        <div className="dp-setoran-col">
                            <div className="dp-setoran-header">
                                <div>
                                    <p className="dp-setoran-title">Daftar Sampah Diangkut</p>
                                    <p className="dp-setoran-subtitle">Rincian jenis dan jumlah sampah</p>
                                </div>
                                <span className="dp-setoran-count-badge">{detail.items.length} jenis</span>
                            </div>

                            {detail.items.length === 0 ? (
                                <div className="dp-setoran-empty">
                                    <FaBoxOpen />
                                    <span>Belum ada data sampah.</span>
                                </div>
                            ) : (
                                <div className="dpg-sampah-list">
                                    {detail.items.map((item) => (
                                        <div key={item.sampah_id} className="dpg-sampah-row">
                                            <div className="dpg-sampah-icon">
                                                <FaLeaf />
                                            </div>
                                            <div className="dpg-sampah-body">
                                                <span className="dpg-sampah-name">{item.nama_sampah}</span>
                                                <span className="dpg-sampah-id">{item.sampah_id}</span>
                                            </div>
                                            <div className="dpg-sampah-qty-wrap">
                                                <span className="dpg-sampah-qty">{item.qty}</span>
                                                <span className="dpg-sampah-satuan">{item.satuan}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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

            {/* ── Sesi Popup ── */}
            {sesiOpen && createPortal(
                <div className="dpg-overlay" onClick={handleCloseSesi}>
                    <div className="dpg-popup" onClick={(e) => e.stopPropagation()}>

                        {/* Popup Header */}
                        <div className="dpg-popup-header">
                            <p className="dpg-popup-title">Riwayat Sesi Pengangkutan</p>
                            <button className="dpg-popup-close" onClick={handleCloseSesi}>
                                <FaXmark />
                            </button>
                        </div>

                        {sesiLoading && (
                            <div className="dpg-popup-loading">Memuat riwayat sesi…</div>
                        )}

                        {!sesiLoading && sesiError && (
                            <div className="dpg-popup-loading" style={{ color: "#ef4444" }}>
                                Gagal memuat riwayat sesi.
                            </div>
                        )}

                        {!sesiLoading && !sesiError && sesiData && (
                            <>
                                {/* Meta */}
                                <div className="dpg-popup-meta">
                                    <span>{sesiData.nama_bsi}</span>
                                    <span className="dpg-popup-meta-arrow">→</span>
                                    <span>{sesiData.nama_bsu}</span>
                                </div>

                                {/* Timeline */}
                                {sesiData.riwayat.length === 0 ? (
                                    <div className="dpg-popup-loading">Belum ada riwayat sesi.</div>
                                ) : (
                                    <div className="dpg-timeline">
                                        {sesiData.riwayat.map((entry, i) => {
                                            const st = SESI_STATUS_MAP[entry.status] ?? { label: entry.status, cls: "" };
                                            return (
                                                <div key={i} className="dpg-timeline-item">
                                                    <div className="dpg-timeline-left">
                                                        <div className="dpg-timeline-dot" />
                                                        {i < sesiData.riwayat.length - 1 && (
                                                            <div className="dpg-timeline-line" />
                                                        )}
                                                    </div>
                                                    <div className="dpg-timeline-content">
                                                        <span className={`dpg-timeline-status dpg-status-${st.cls}`}>
                                                            {st.label}
                                                        </span>
                                                        <span className="dpg-timeline-time">
                                                            {entry.changed_at ? formatTanggalJamBullet(entry.changed_at) : "—"}
                                                        </span>
                                                        {entry.changed_by && (
                                                            <span className="dpg-timeline-by">{entry.changed_by}</span>
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
                            </>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
