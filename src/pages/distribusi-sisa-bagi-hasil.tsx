import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
    FaCalendarDays,
    FaUser,
    FaHashtag,
    FaMoneyBillWave,
    FaBuilding,
    FaTruck,
} from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import BreadcrumbLayout from "../layouts/breadcrumb";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import { DistribusiSisaService } from "../services/distribusi_sisa.service";
import type { DistribusiSisaDetail, PenerimaSisa } from "../types/distribusi_sisa.type";
import "../styles/detail-penimbangan.css";
import "../styles/detail-penjualan.css";
import { formatTanggalPanjang } from "../utils/date.utils";

/* ── Helpers ── */
function fmtAmount(amount: number, satuan: string): string {
    const num = amount.toLocaleString("id-ID");
    return satuan === "Rp" ? `Rp ${num}` : `${num} ${satuan}`;
}

/* ── Bank Card ── */
function BankCard({ bank, satuan }: { bank: PenerimaSisa; satuan: string }) {
    const fmt = (n: number) => fmtAmount(n, satuan);
    return (
        <div className="dpj-item-row" style={{ flexDirection: "column", alignItems: "stretch", gap: "10px" }}>
            {/* Bank header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="dpj-item-icon">
                    <FaBuilding />
                </div>
                <div className="dpj-item-body">
                    <span className="dpj-item-name">{bank.nama_bank}</span>
                    <span className="dpj-item-detail">{bank.bank_id}</span>
                </div>
            </div>

            {/* Breakdown */}
            <div style={{ paddingLeft: "50px", display: "flex", flexDirection: "column", gap: "5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="dpj-item-detail">Porsi</span>
                    <span className="dpj-item-detail" style={{ fontWeight: 600 }}>{fmt(bank.porsi)}</span>
                </div>

                {bank.transportasi > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span className="dpj-item-detail" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <FaTruck style={{ fontSize: "9px" }} />
                            Biaya Transportasi
                        </span>
                        <span className="dpj-item-detail" style={{ fontWeight: 600 }}>{fmt(bank.transportasi)}</span>
                    </div>
                )}

                <div style={{
                    borderTop: "1px solid rgba(1,50,54,0.08)",
                    paddingTop: "6px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}>
                    <span className="dpj-item-detail" style={{ fontWeight: 700, color: "#013236" }}>Total Diterima</span>
                    <span className="dpj-item-subtotal">{fmt(bank.nominal_diterima)}</span>
                </div>

            </div>
        </div>
    );
}

/* ── Component ── */
export default function DistribusiSisaBagiHasilPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const location = useLocation();
    const penjualanId = (location.state as { penjualan_id?: string } | null)?.penjualan_id;

    const role = user?.role?.toLowerCase();
    const rolePrefix = role === "admin_bsi" ? "/bsi" : role === "admin_bsu" ? "/bsu" : "/bsm";
    const riwayatPath = `${rolePrefix}/riwayat`;

    const [detail, setDetail] = useState<DistribusiSisaDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(false);
        DistribusiSisaService.getDetail(id)
            .then((data) => setDetail(data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [id]);

    const breadcrumbItems = penjualanId
        ? [
            { label: "Riwayat", path: riwayatPath },
            { label: "Detail Bagi Hasil", path: `${rolePrefix}/bagi-hasil/${penjualanId}` },
            { label: "Distribusi Sisa" },
          ]
        : [
            { label: "Riwayat", path: riwayatPath },
            { label: "Distribusi Sisa" },
          ];

    const fmt = (n: number) => detail ? fmtAmount(n, detail.satuan) : "";

    return (
        <>
            <BreadcrumbLayout items={breadcrumbItems} />

            <div className="dp-page">
                {/* Hero */}
                <div className="dp-hero">
                    <div className="dp-hero-left">
                        <h1>Distribusi Sisa Bagi Hasil</h1>
                        <p>Rincian distribusi sisa bagi hasil ke masing-masing bank</p>
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
                                    <p className="dp-overview-title">Distribusi Sisa Bagi Hasil</p>
                                    <p className="dp-overview-subtitle">ID : {detail.distribusi_id}</p>
                                </div>
                            </div>

                            <div className="dp-divider" />

                            <div className="dp-info-list">
                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaCalendarDays /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Tanggal</span>
                                        <span className="dp-info-value">{formatTanggalPanjang(detail.created_at)}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaUser /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Dibuat Oleh</span>
                                        <span className="dp-info-value">{detail.created_by}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaHashtag /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">ID Bagi Hasil</span>
                                        <span className="dp-info-value">{detail.bagi_hasil_id}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaMoneyBillWave /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Total Sisa</span>
                                        <span className="dp-info-value">{fmt(detail.total_sisa)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT: Penerima ── */}
                        <div className="dp-setoran-col">

                            <div className="dp-setoran-header">
                                <div>
                                    <p className="dp-setoran-title">Rincian Distribusi</p>
                                    <p className="dp-setoran-subtitle">Porsi sisa bagi hasil per bank penerima</p>
                                </div>
                                <span className="dp-setoran-count-badge">
                                    {1 + detail.penerima_bsu.length} bank
                                </span>
                            </div>

                            <div className="dpj-items-list">
                                {/* BSI */}
                                <BankCard bank={detail.penerima_bsi} satuan={detail.satuan} />

                                {/* BSU */}
                                {detail.penerima_bsu.map((bsu) => (
                                    <BankCard key={bsu.penerima_sisa_id} bank={bsu} satuan={detail.satuan} />
                                ))}
                            </div>

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
