import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
    FaCalendarDays,
    FaClock,
    FaUser,
    FaBoxOpen,
} from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import BreadcrumbLayout, { type BreadcrumbItem } from "../layouts/breadcrumb";
import { SetoranService, type SetoranDetail } from "../services/setoran.service";
import ViewPhoto from "../components/view-photo";
import "../styles/detail-penyetoran.css";
import { formatTanggalPanjang, formatJam } from "../utils/date.utils";
import { formatDecimal } from "../utils/number.utils";

function getInitials(name: string): string {
    return name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
}

export default function DetailPenyetoranPage() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const { user } = useAuth();

    const role = user?.role?.toLowerCase();
    const rolePrefix = role === "admin_bsi" ? "/bsi" : role === "admin_bsu" ? "/bsu" : "/bsm";

    const penimbanganId: string | undefined = location.state?.penimbanganId;
    const breadcrumbTrail: BreadcrumbItem[] | undefined = location.state?.breadcrumbTrail;

    const [detail, setDetail] = useState<SetoranDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(false);
        SetoranService.getDetailSetoran(id)
            .then((data) => setDetail(data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [id]);

    const breadcrumbItems = breadcrumbTrail
        ? [...breadcrumbTrail, { label: "Detail Setoran" }]
        : [
            { label: "Riwayat", path: `${rolePrefix}/riwayat` },
            {
                label: "Detail Penimbangan",
                path: penimbanganId
                    ? `${rolePrefix}/riwayat/penimbangan/${penimbanganId}`
                    : undefined,
            },
            { label: "Detail Setoran" },
        ];

    return (
        <>
            <BreadcrumbLayout items={breadcrumbItems} />

            <div className="dps-page">
                <div className="dps-hero">
                    <h1>Detail Setoran</h1>
                    <p>Rincian transaksi setoran sampah nasabah</p>
                </div>

                {loading && (
                    <div className="dps-loading">Memuat data setoran…</div>
                )}

                {!loading && error && (
                    <div className="dps-error">Gagal memuat data. Silakan coba lagi.</div>
                )}

                {!loading && !error && detail && (
                    <div className="dps-card">

                        <div className="dps-overview">

                            <div className="dps-overview-header">
                                <div>
                                    <p className="dps-overview-title">Detail Setoran</p>
                                    <p className="dps-overview-subtitle">{detail.header.setoran_id}</p>
                                </div>
                            </div>

                            <div className="dps-divider" />

                            <div className="dps-info-list">

                                <div className="dps-nasabah-row">
                                    <div className="dps-nasabah-avatar">
                                        {getInitials(detail.header.nama_nasabah)}
                                    </div>
                                    <div className="dps-info-text">
                                        <span className="dps-info-label">Nasabah</span>
                                        <span className="dps-info-value">{detail.header.nama_nasabah}</span>
                                    </div>
                                </div>

                                <div className="dps-info-row">
                                    <div className="dps-info-icon-wrap"><FaUser /></div>
                                    <div className="dps-info-text">
                                        <span className="dps-info-label">Petugas</span>
                                        <span className="dps-info-value">{detail.header.nama_petugas}</span>
                                    </div>
                                </div>

                                <div className="dps-info-row">
                                    <div className="dps-info-icon-wrap"><FaCalendarDays /></div>
                                    <div className="dps-info-text">
                                        <span className="dps-info-label">Tanggal</span>
                                        <span className="dps-info-value">{formatTanggalPanjang(detail.header.transaksi_timestamp)}</span>
                                    </div>
                                </div>

                                <div className="dps-info-row">
                                    <div className="dps-info-icon-wrap"><FaClock /></div>
                                    <div className="dps-info-text">
                                        <span className="dps-info-label">Waktu</span>
                                        <span className="dps-info-value">{formatJam(detail.header.transaksi_timestamp)}</span>
                                    </div>
                                </div>

                            </div>

                            <div className="dps-divider" />

                            <div className="dps-stats-row">
                                <div className="dps-stat-chip">
                                    <span className="dps-stat-chip-value">{detail.header.total_item}</span>
                                    <span className="dps-stat-chip-label">Jenis Sampah</span>
                                </div>
                            </div>

                        </div>

                        <div className="dps-items-col">
                            <div className="dps-items-header">
                                <div>
                                    <p className="dps-items-title">Item Setoran</p>
                                    <p className="dps-items-subtitle">Daftar sampah yang disetor</p>
                                </div>
                                <span className="dps-items-count-badge">{detail.items.length} item</span>
                            </div>

                            {detail.items.length === 0 ? (
                                <div className="dps-items-empty">
                                    <FaBoxOpen />
                                    <span>Tidak ada item dalam setoran ini.</span>
                                </div>
                            ) : (
                                <div className="dps-items-list">
                                    <div className="dps-item-thead">
                                        <span className="dps-item-th dps-item-col-no">#</span>
                                        <span className="dps-item-th dps-item-col-name">Nama Sampah</span>
                                        <span className="dps-item-th dps-item-col-qty">Qty</span>
                                        <span className="dps-item-th dps-item-col-unit">Satuan</span>
                                    </div>

                                    {detail.items.map((item, idx) => (
                                        <div key={idx} className="dps-item-row">
                                            <span className="dps-item-no">{idx + 1}</span>
                                            <div className="dps-item-name-wrap">
                                                <span className="dps-item-name">{item.nama_sampah}</span>
                                            </div>
                                            <span className="dps-item-qty">{formatDecimal(item.qty)}</span>
                                            <span className="dps-item-unit">{item.satuan}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {detail.header.bukti_via_manual && (
                                <div className="dps-bukti-section">
                                    <span className="dps-bukti-label">
                                        Bukti Via Manual
                                    </span>
                                    <div
                                        className="dps-bukti-thumb"
                                        onClick={() => setLightboxOpen(true)}
                                        title="Klik untuk memperbesar"
                                    >
                                        <img src={detail.header.bukti_via_manual} alt="Bukti setoran manual" />
                                        <div className="dps-bukti-overlay">Lihat Gambar</div>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </div>
            {lightboxOpen && detail?.header.bukti_via_manual && (
                <ViewPhoto
                    src={detail.header.bukti_via_manual}
                    alt="Bukti setoran manual"
                    onClose={() => setLightboxOpen(false)}
                />
            )}
        </>
    );
}
