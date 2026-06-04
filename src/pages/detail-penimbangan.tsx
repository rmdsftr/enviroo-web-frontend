import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    FaScaleBalanced,
    FaListCheck,
    FaCalendarDays,
    FaClock,
    FaCircleCheck,
    FaUser,
    FaChevronRight,
    FaBoxOpen,
    FaFileExport,
} from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import BreadcrumbLayout from "../layouts/breadcrumb";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import Button from "../components/button";
import { PenimbanganService, type PenimbanganDetail, type SetoranItem } from "../services/penimbangan.service";
import "../styles/detail-penimbangan.css";
import { formatTanggalPanjang, formatJam } from "../utils/date.utils";

/* ── Status maps ── */
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    selesai:    { label: "Selesai",      cls: "selesai"    },
    aktif:      { label: "Berlangsung",  cls: "aktif"      },
    dibatalkan: { label: "Dibatalkan",   cls: "dibatalkan" },
};

const SETORAN_STATUS_MAP: Record<string, { label: string; cls: string }> = {
    berhasil: { label: "Berhasil", cls: "berhasil" },
    gagal:    { label: "Gagal",    cls: "gagal"    },
    pending:  { label: "Pending",  cls: "pending"  },
};

/* ── Helpers ── */
function getInitials(name: string): string {
    return name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
}

/* ── Component ── */
export default function DetailPenimbanganPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const role = user?.role?.toLowerCase();
    const rolePrefix = role === "admin_bsi" ? "/bsi" : role === "admin_bsu" ? "/bsu" : "/bsm";
    const riwayatPath = `${rolePrefix}/riwayat`;

    const [detail, setDetail] = useState<PenimbanganDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(false);
        PenimbanganService.getListSetoran(id)
            .then((data) => setDetail(data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [id]);

    /* ── Breadcrumb ── */
    const breadcrumbItems = [
        { label: "Riwayat", path: riwayatPath },
        { label: "Detail Penimbangan" },
    ];

    /* ── Computed stats ── */
    const totalSetoran = detail?.list_setoran.length ?? 0;
    const totalNasabah = detail
        ? new Set(detail.list_setoran.map((s) => s.nasabah_id)).size
        : 0;

    const statusConf = detail
        ? (STATUS_MAP[detail.status_penimbangan] ?? { label: detail.status_penimbangan, cls: "" })
        : null;

    /* ── Handle export ── */
    const handleExport = async () => {
        if (!id) return;
        setExporting(true);
        try {
            const blob = await PenimbanganService.exportLaporan(id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `laporan-penimbangan-${id}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            setPopupNotif({ message: "Gagal mengunduh laporan. Silakan coba lagi.", type: "error" });
        } finally {
            setExporting(false);
        }
    };

    /* ── Handle setoran click ── */
    const handleSetoranClick = (setoran: SetoranItem) => {
        navigate(`${rolePrefix}/riwayat/setoran/${setoran.setoran_id}`, {
            state: { penimbanganId: id },
        });
    };

    return (
        <>
            <BreadcrumbLayout items={breadcrumbItems} />

            <div className="dp-page">
                {/* Hero */}
                <div className="dp-hero">
                    <div className="dp-hero-left">
                        <h1>Detail Penimbangan</h1>
                        <p>Informasi lengkap sesi penimbangan beserta daftar setoran nasabah</p>
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
                    <div className="dp-loading">Memuat data penimbangan…</div>
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
                                    <p className="dp-overview-title">Detail Penimbangan</p>
                                    <p className="dp-overview-subtitle">ID : {detail.penimbangan_id}</p>
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
                                        <span className="dp-info-value">{detail.started_at ? formatTanggalPanjang(detail.started_at) : "—"}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaClock /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Jam Mulai</span>
                                        <span className="dp-info-value">{detail.started_at ? formatJam(detail.started_at) : "—"}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaCircleCheck /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Jam Selesai</span>
                                        <span className="dp-info-value">{detail.ended_at ? formatJam(detail.ended_at) : "—"}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaUser /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Dibuka Oleh</span>
                                        <span className="dp-info-value">{detail.started_by}</span>
                                    </div>
                                </div>

                                {detail.ended_by && (
                                    <div className="dp-info-row">
                                        <div className="dp-info-icon-wrap"><FaUser /></div>
                                        <div className="dp-info-text">
                                            <span className="dp-info-label">Ditutup Oleh</span>
                                            <span className="dp-info-value">{detail.ended_by}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="dp-divider" />

                            {/* Quick Stats */}
                            <div className="dp-stats-row">
                                <div className="dp-stat-chip">
                                    <span className="dp-stat-chip-value">{totalSetoran}</span>
                                    <span className="dp-stat-chip-label">Total Setoran</span>
                                </div>
                                <div className="dp-stat-chip">
                                    <span className="dp-stat-chip-value">{totalNasabah}</span>
                                    <span className="dp-stat-chip-label">Total Nasabah</span>
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT: List Setoran ── */}
                        <div className="dp-setoran-col">
                            <div className="dp-setoran-header">
                                <div>
                                    <p className="dp-setoran-title">Daftar Setoran</p>
                                    <p className="dp-setoran-subtitle">Klik untuk melihat profil nasabah</p>
                                </div>
                                <span className="dp-setoran-count-badge">{totalSetoran} setoran</span>
                            </div>

                            {totalSetoran === 0 ? (
                                <div className="dp-setoran-empty">
                                    <FaBoxOpen />
                                    <span>Belum ada setoran dalam sesi ini.</span>
                                </div>
                            ) : (
                                <div className="dp-setoran-list">
                                    {detail.list_setoran.map((setoran) => {
                                        const st = SETORAN_STATUS_MAP[setoran.status_setoran] ?? {
                                            label: setoran.status_setoran,
                                            cls: "",
                                        };
                                        return (
                                            <div
                                                key={setoran.setoran_id}
                                                className="dp-setoran-row"
                                                onClick={() => handleSetoranClick(setoran)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => e.key === "Enter" && handleSetoranClick(setoran)}
                                                aria-label={`Lihat detail setoran ${setoran.nama_nasabah}`}
                                            >
                                                {/* Avatar */}
                                                <div className="dp-setoran-avatar">
                                                    {getInitials(setoran.nama_nasabah)}
                                                </div>

                                                {/* Body */}
                                                <div className="dp-setoran-body">
                                                    <span className="dp-setoran-name">{setoran.nama_nasabah}</span>
                                                    <div className="dp-setoran-meta">
                                                        <span className="dp-setoran-id">{setoran.nasabah_id}</span>
                                                        <span className="dp-setoran-sep">·</span>
                                                    </div>
                                                </div>

                                                {/* Right Side */}
                                                <div className="dp-setoran-right">
                                                    <span className="dp-setoran-items">
                                                        {setoran.total_item} item
                                                    </span>
                                                    <span className={`dp-setoran-status-pill ${st.cls}`}>
                                                        {st.label}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
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
        </>
    );
}
