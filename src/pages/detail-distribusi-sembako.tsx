import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
    FaCalendarDays,
    FaBuilding,
    FaUser,
    FaBasketShopping,
    FaBoxOpen,
} from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import BreadcrumbLayout from "../layouts/breadcrumb";
import { SembakoService } from "../services/sembako.service";
import type { DistribusiSembakoDetailData } from "../types/sembako.type";
import "../styles/detail-penimbangan.css";
import "../styles/detail-penjualan.css";
import "../styles/detail-distribusi-sembako.css";
import { formatTanggalPanjang } from "../utils/date.utils";

const STATUS_DISTRIBUSI: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "aktif"      },
    selesai: { label: "Selesai", cls: "selesai"    },
    gagal:   { label: "Gagal",   cls: "dibatalkan" },
};

export default function DetailDistribusiSembakoPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();

    const role = user?.role?.toLowerCase();
    const rolePrefix = role === "admin_bsi" ? "/bsi" : "/bsu";
    const isBsi = role === "admin_bsi";

    const [detail, setDetail] = useState<DistribusiSembakoDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(false);
        SembakoService.getDetailDistribusiSembako(id)
            .then((res) => setDetail(res.data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [id]);

    const breadcrumbItems = [
        { label: "Katalog", path: `${rolePrefix}/katalog` },
        { label: "Detail Distribusi Sembako" },
    ];

    const statusConf = detail
        ? (STATUS_DISTRIBUSI[detail.header.status_distribusi] ?? { label: detail.header.status_distribusi, cls: "" })
        : null;

    return (
        <>
            <BreadcrumbLayout items={breadcrumbItems} />

            <div className="dp-page">

                {/* Hero */}
                <div className="dp-hero">
                    <div className="dp-hero-left">
                        <h1>Detail Distribusi Sembako</h1>
                        <p>
                            {isBsi
                                ? "Informasi lengkap distribusi sembako yang dikirimkan ke unit BSU"
                                : "Informasi lengkap distribusi sembako yang diterima dari BSI"}
                        </p>
                    </div>
                </div>

                {loading && (
                    <div className="dp-loading">Memuat data distribusi…</div>
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
                                    <p className="dp-overview-title">Distribusi Sembako</p>
                                    <p className="dp-overview-subtitle">ID : {detail.header.disbako_id}</p>
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
                                        <span className="dp-info-value">{formatTanggalPanjang(detail.header.created_at)}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaBuilding /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Bank Sampah Induk (BSI)</span>
                                        <span className="dp-info-value">{detail.header.nama_bsi}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaUser /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Admin BSI</span>
                                        <span className="dp-info-value">{detail.header.nama_admin_bsi}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaBuilding /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Bank Sampah Unit (BSU)</span>
                                        <span className="dp-info-value">{detail.header.nama_bsu}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaUser /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Admin BSU</span>
                                        <span className="dp-info-value">{detail.header.nama_admin_bsu}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="dp-divider" />

                            {/* Stats */}
                            <div className="dp-stats-row">
                                <div className="dp-stat-chip">
                                    <span className="dp-stat-chip-value">{detail.header.total_item}</span>
                                    <span className="dp-stat-chip-label">Total Item</span>
                                </div>
                                <div className="dp-stat-chip">
                                    <span className="dp-stat-chip-value">{detail.header.total_poin}</span>
                                    <span className="dp-stat-chip-label">Total Poin</span>
                                </div>
                            </div>

                        </div>

                        {/* ── RIGHT: Daftar Sembako ── */}
                        <div className="dp-setoran-col">
                            <div className="dp-setoran-header">
                                <div>
                                    <p className="dp-setoran-title">Daftar Sembako Didistribusikan</p>
                                    <p className="dp-setoran-subtitle">Rincian item, jumlah, dan perubahan stok</p>
                                </div>
                                <span className="dp-setoran-count-badge">{detail.items.length} jenis</span>
                            </div>

                            {detail.items.length === 0 ? (
                                <div className="dp-setoran-empty">
                                    <FaBoxOpen />
                                    <span>Belum ada data item.</span>
                                </div>
                            ) : (
                                <div className="dpd-items-list">
                                    {detail.items.map((item) => (
                                        <div key={item.sembako_id} className="dpd-item-row">

                                            {/* Thumbnail */}
                                            <div className="dpd-item-img">
                                                {item.photo_url
                                                    ? <img src={item.photo_url} alt={item.nama_barang} />
                                                    : <FaBasketShopping />
                                                }
                                            </div>

                                            {/* Body */}
                                            <div className="dpd-item-body">
                                                <span className="dpd-item-name">{item.nama_barang}</span>
                                                <span className="dpd-item-detail">
                                                    {item.item} item &times; {item.nilai_poin} poin
                                                </span>

                                                {/* Stok changes */}
                                                <div className="dpd-stok-grid">
                                                    <div className="dpd-stok-chip">
                                                        <span className="dpd-stok-chip-label">BSI</span>
                                                        <span className="dpd-stok-val-before">{item.stok_bsi_sebelum}</span>
                                                        <span className="dpd-stok-arrow">→</span>
                                                        <span className="dpd-stok-val-down">{item.stok_bsi_sesudah}</span>
                                                    </div>
                                                    <div className="dpd-stok-chip">
                                                        <span className="dpd-stok-chip-label">BSU</span>
                                                        <span className="dpd-stok-val-before">{item.stok_bsu_sebelum}</span>
                                                        <span className="dpd-stok-arrow">→</span>
                                                        <span className="dpd-stok-val-up">{item.stok_bsu_sesudah}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Subtotal */}
                                            <div className="dpd-item-right">
                                                <span className="dpd-item-subtotal">{item.subtotal_poin}</span>
                                                <span className="dpd-item-subtotal-label">poin</span>
                                            </div>

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
