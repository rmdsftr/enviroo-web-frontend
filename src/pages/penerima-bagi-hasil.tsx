import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
    FaCalendarDays,
    FaClock,
    FaGift,
    FaBoxOpen,
} from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import BreadcrumbLayout from "../layouts/breadcrumb";
import {
    BagiHasilService,
    type PenerimaBagiHasilDetail,
} from "../services/bagi_hasil_penjualan.service";
import "../styles/detail-penyetoran.css";
import { formatTanggalPanjang, formatJam } from "../utils/date.utils";

/* ── Helpers ── */
function fmtAmount(amount: number, satuan: string): string {
    const num = amount.toLocaleString("id-ID");
    return satuan === "Rp" ? `Rp ${num}` : `${num} ${satuan}`;
}

function getInitials(name: string): string {
    return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

/* ── Column widths for item table ── */
const ITEM_GRID = "32px 1fr 60px 120px 120px";

/* ── Component ── */
export default function PenerimaBagiHasilPage() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const { user } = useAuth();

    const role = user?.role?.toLowerCase();
    const rolePrefix = role === "admin_bsi" ? "/bsi" : role === "admin_bsu" ? "/bsu" : role === "admin_bsm" ? "/bsm" : "/superadmin";

    const bagiHasilId: string | undefined = location.state?.bagiHasilId;

    const [detail, setDetail] = useState<PenerimaBagiHasilDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(false);
        BagiHasilService.getDetailBhNasabah(id)
            .then(data => setDetail(data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [id]);

    const breadcrumbItems = [
        { label: "Riwayat", path: `${rolePrefix}/riwayat` },
        {
            label: "Detail Bagi Hasil",
            path: bagiHasilId ? `${rolePrefix}/riwayat/bagi-hasil/${bagiHasilId}` : undefined,
        },
        { label: "Detail Penerima" },
    ];

    return (
        <>
            <BreadcrumbLayout items={breadcrumbItems} />

            <div className="dps-page">
                {/* Hero */}
                <div className="dps-hero">
                    <h1>Penerima Bagi Hasil</h1>
                    <p>Rincian pembagian hasil penjualan sampah untuk nasabah</p>
                </div>

                {loading && <div className="dps-loading">Memuat data...</div>}
                {!loading && error && <div className="dps-error">Gagal memuat data. Silakan coba lagi.</div>}

                {!loading && !error && detail && (
                    <div className="dps-card">

                        {/* ── LEFT: Overview ── */}
                        <div className="dps-overview">
                            <div className="dps-overview-header">
                                <div>
                                    <p className="dps-overview-title">Penerima Bagi Hasil</p>
                                    <p className="dps-overview-subtitle">{detail.penerima_id}</p>
                                </div>
                            </div>

                            <div className="dps-divider" />

                            <div className="dps-info-list">
                                {/* Nasabah row with avatar */}
                                <div className="dps-nasabah-row">
                                    <div className="dps-nasabah-avatar">
                                        {getInitials(detail.nama_nasabah)}
                                    </div>
                                    <div className="dps-info-text">
                                        <span className="dps-info-label">Nasabah</span>
                                        <span className="dps-info-value">{detail.nama_nasabah}</span>
                                        <span style={{ fontSize: "10px", color: "#7a9e8a", fontFamily: "'Poppins', sans-serif" }}>
                                            {detail.nasabah_id}
                                        </span>
                                    </div>
                                </div>

                                <div className="dps-info-row">
                                    <div className="dps-info-icon-wrap"><FaCalendarDays /></div>
                                    <div className="dps-info-text">
                                        <span className="dps-info-label">Tanggal</span>
                                        <span className="dps-info-value">{formatTanggalPanjang(detail.tanggal)}</span>
                                    </div>
                                </div>

                                <div className="dps-info-row">
                                    <div className="dps-info-icon-wrap"><FaClock /></div>
                                    <div className="dps-info-text">
                                        <span className="dps-info-label">Waktu</span>
                                        <span className="dps-info-value">{formatJam(detail.tanggal)}</span>
                                    </div>
                                </div>

                                <div className="dps-info-row">
                                    <div className="dps-info-icon-wrap"><FaGift /></div>
                                    <div className="dps-info-text">
                                        <span className="dps-info-label">Jenis Reward</span>
                                        <span className="dps-info-value">{detail.reward}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="dps-divider" />

                            <div className="dps-stats-row">
                                <div className="dps-stat-chip">
                                    <span className="dps-stat-chip-value" style={{ fontSize: "16px" }}>
                                        {fmtAmount(detail.total_diterima, detail.satuan_diterima)}
                                    </span>
                                    <span className="dps-stat-chip-label">Total Diterima</span>
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT: Detail Items ── */}
                        <div className="dps-items-col">
                            <div className="dps-items-header">
                                <div>
                                    <p className="dps-items-title">Rincian Item</p>
                                    <p className="dps-items-subtitle">Daftar sampah dasar perhitungan bagi hasil</p>
                                </div>
                                <span className="dps-items-count-badge">{detail.detail_item.length} item</span>
                            </div>

                            {detail.detail_item.length === 0 ? (
                                <div className="dps-items-empty">
                                    <FaBoxOpen />
                                    <span>Tidak ada item dalam transaksi ini.</span>
                                </div>
                            ) : (
                                <div className="dps-items-list">
                                    {/* Table header */}
                                    <div className="dps-item-thead" style={{ gridTemplateColumns: ITEM_GRID }}>
                                        <span className="dps-item-th dps-item-col-no">#</span>
                                        <span className="dps-item-th">Nama Sampah</span>
                                        <span className="dps-item-th" style={{ textAlign: "right" }}>Qty</span>
                                        <span className="dps-item-th" style={{ textAlign: "right" }}>Harga/item</span>
                                        <span className="dps-item-th" style={{ textAlign: "right" }}>Subtotal</span>
                                    </div>

                                    {detail.detail_item.map((item, idx) => (
                                        <div
                                            key={item.sampah_id}
                                            className="dps-item-row"
                                            style={{ gridTemplateColumns: ITEM_GRID }}
                                        >
                                            <span className="dps-item-no">{idx + 1}</span>
                                            <div className="dps-item-name-wrap">
                                                <span className="dps-item-name">{item.nama_sampah}</span>
                                            </div>
                                            <span className="dps-item-qty">{item.qty}</span>
                                            <span className="dps-item-qty">
                                                {fmtAmount(item.harga_item, detail.satuan_diterima)}
                                            </span>
                                            <span className="dps-item-qty">
                                                {fmtAmount(item.subtotal_harga, detail.satuan_diterima)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </div>
        </>
    );
}
