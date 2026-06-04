import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
    FaCalendarDays,
    FaBuilding,
    FaMoneyBillWave,
    FaTruck,
    FaFileExport,
    FaLeaf,
    FaBoxOpen,
} from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import BreadcrumbLayout from "../layouts/breadcrumb";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import Button from "../components/button";
import { DistribusiSisaService } from "../services/distribusi_sisa.service";
import type { DistribusiSisaBsuDetail } from "../types/distribusi_sisa.type";
import "../styles/detail-penimbangan.css";
import "../styles/detail-penjualan.css";
import { formatTanggalPanjang } from "../utils/date.utils";

/* ── Helpers ── */
function fmtAmount(amount: number, satuan: string): string {
    const num = amount.toLocaleString("id-ID");
    return satuan === "Rp" ? `Rp ${num}` : `${num} ${satuan}`;
}

/* ── Component ── */
export default function DistribusiSisaBsuPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();

    const role = user?.role?.toLowerCase();
    const rolePrefix = role === "admin_bsi" ? "/bsi" : role === "admin_bsu" ? "/bsu" : "/bsm";
    const riwayatPath = `${rolePrefix}/riwayat`;

    const [detail, setDetail] = useState<DistribusiSisaBsuDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(false);
        DistribusiSisaService.getDetailBhBank(id)
            .then((data) => setDetail(data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [id]);

    const breadcrumbItems = [
        { label: "Riwayat", path: riwayatPath },
        { label: "Detail Distribusi Sisa" },
    ];

    const fmt = (n: number) => detail ? fmtAmount(n, detail.satuan_nominal) : "";

    return (
        <>
            <BreadcrumbLayout items={breadcrumbItems} />

            <div className="dp-page">
                {/* Hero */}
                <div className="dp-hero">
                    <div className="dp-hero-left">
                        <h1>Detail Distribusi Sisa</h1>
                        <p>Rincian sisa bagi hasil dan sampah yang digunakan</p>
                    </div>
                </div>

                {loading && (
                    <div className="dp-loading">Memuat data distribusi sisa…</div>
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
                                    <p className="dp-overview-title">Detail Distribusi Sisa</p>
                                    <p className="dp-overview-subtitle">ID : {detail.penerima_sisa_id}</p>
                                </div>
                            </div>

                            <div className="dp-divider" />

                            <div className="dp-info-list">
                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaCalendarDays /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Tanggal Distribusi</span>
                                        <span className="dp-info-value">{formatTanggalPanjang(detail.tanggal_distribusi)}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaBuilding /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Bank Penerima</span>
                                        <span className="dp-info-value">{detail.nama_bank}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaMoneyBillWave /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Porsi</span>
                                        <span className="dp-info-value">{fmt(detail.porsi)}</span>
                                    </div>
                                </div>

                                {detail.transportasi > 0 && (
                                    <div className="dp-info-row">
                                        <div className="dp-info-icon-wrap"><FaTruck /></div>
                                        <div className="dp-info-text">
                                            <span className="dp-info-label">Biaya Transportasi</span>
                                            <span className="dp-info-value">{fmt(detail.transportasi)}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaMoneyBillWave /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Total Diterima</span>
                                        <span className="dp-info-value">{fmt(detail.nominal_diterima)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT: Perhitungan Sisa ── */}
                        <div className="dp-setoran-col">
                            <div className="dp-setoran-header">
                                <div>
                                    <p className="dp-setoran-title">Perhitungan Sisa Sampah</p>
                                    <p className="dp-setoran-subtitle">Tabungan sampah yang digunakan dalam distribusi ini</p>
                                </div>
                                <span className="dp-setoran-count-badge">
                                    {detail.perhitungan_sisa.length} jenis
                                </span>
                            </div>

                            {detail.perhitungan_sisa.length === 0 ? (
                                <div className="dp-setoran-empty">
                                    <FaBoxOpen />
                                    <span>Belum ada data sampah.</span>
                                </div>
                            ) : (
                                <div className="dpj-items-list">
                                    {detail.perhitungan_sisa.map((item) => (
                                        <div key={item.tabungan_id} className="dpj-item-row">
                                            <div className="dpj-item-icon">
                                                <FaLeaf />
                                            </div>
                                            <div className="dpj-item-body">
                                                <span className="dpj-item-name">{item.nama_sampah}</span>
                                                <span className="dpj-item-detail">{item.tabungan_id}</span>
                                            </div>
                                            <div className="dpj-item-right">
                                                <span className="dpj-item-subtotal">
                                                    {item.qty_dipakai.toLocaleString("id-ID")} {item.satuan}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </div>

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
