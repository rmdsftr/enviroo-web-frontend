import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    FaCalendarDays,
    FaUser,
    FaGift,
    FaMoneyBillWave,
    FaUsers,
    FaCoins,
    FaBuilding,
    FaBoxOpen,
    FaRightLeft,
    FaChevronDown,
} from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import BreadcrumbLayout from "../layouts/breadcrumb";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import {
    BagiHasilService,
    type BagiHasilPenjualan,
    type NasabahPenerima,
    type PenerimaBSU,
} from "../services/bagi_hasil_penjualan.service";
import "../styles/detail-penimbangan.css";
import "../styles/detail-penjualan.css";
import { formatTanggalPanjang } from "../utils/date.utils";

/* ── Helpers ── */
function fmtAmount(amount: number, satuan: string): string {
    const num = amount.toLocaleString("id-ID");
    return satuan === "Rp" ? `Rp ${num}` : `${num} ${satuan}`;
}

/* ── Nasabah Row ── */
function NasabahRow({ nasabah, onClick }: { nasabah: NasabahPenerima; onClick?: () => void }) {
    return (
        <div
            className="dpj-item-row"
            onClick={onClick}
            style={onClick ? { cursor: "pointer" } : undefined}
        >
            <div className="dpj-item-icon">
                <FaUser />
            </div>
            <div className="dpj-item-body">
                <span className="dpj-item-name">{nasabah.nama_nasabah}</span>
                <span className="dpj-item-detail">{nasabah.nasabah_id}</span>
            </div>
            <div className="dpj-item-right">
                <span className="dpj-item-subtotal">
                    {fmtAmount(nasabah.total_diterima, nasabah.satuan_diterima)}
                </span>
            </div>
        </div>
    );
}

/* ── BSU Accordion Card ── */
function BsuAccordionCard({ bsu, onNasabahClick }: { bsu: PenerimaBSU; onNasabahClick: (penerimaId: string) => void }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ border: "1px solid #e0ece6", borderRadius: 12, overflow: "hidden" }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: "100%", display: "flex", alignItems: "center",
                    justifyContent: "space-between", padding: "13px 16px",
                    background: open ? "#f3faf6" : "#fff", border: "none",
                    cursor: "pointer", gap: 8, textAlign: "left",
                    fontFamily: "inherit",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <FaBuilding style={{ fontSize: 12, color: "#7a9e8a", flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: "#013236" }}>{bsu.nama_bank}</span>
                    <span className="dp-setoran-count-badge">{bsu.nasabah_penerima.length} nasabah</span>
                </div>
                <FaChevronDown style={{
                    fontSize: 11, color: "#7a9e8a", flexShrink: 0,
                    transition: "transform 0.2s",
                    transform: open ? "rotate(180deg)" : "rotate(0deg)",
                }} />
            </button>
            {open && (
                <div style={{ borderTop: "1px solid #e0ece6", padding: "4px 0" }}>
                    {bsu.nasabah_penerima.map(n => (
                        <div
                            key={n.penerima_id}
                            className="dpj-item-row"
                            onClick={() => onNasabahClick(n.penerima_id)}
                            style={{ cursor: "pointer", background: "transparent", border: "none", borderRadius: 0, boxShadow: "none", borderBottom: "1px solid #f0f7f3" }}
                        >
                            <div className="dpj-item-icon"><FaUser /></div>
                            <div className="dpj-item-body">
                                <span className="dpj-item-name">{n.nama_nasabah}</span>
                                <span className="dpj-item-detail">{n.nasabah_id}</span>
                            </div>
                            <div className="dpj-item-right">
                                <span className="dpj-item-subtotal">{fmtAmount(n.total_diterima, n.satuan_diterima)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── Component ── */
export default function BagiHasilPenjualanPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();

    const navigate = useNavigate();
    const role = user?.role?.toLowerCase();
    const rolePrefix = role === "admin_bsi" ? "/bsi" : "/bsm";
    const riwayatPath = `${rolePrefix}/riwayat`;

    const [detail, setDetail] = useState<BagiHasilPenjualan | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(false);
        BagiHasilService.getDetail(id)
            .then((data) => setDetail(data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [id]);

    const breadcrumbItems = [
        { label: "Riwayat", path: riwayatPath },
        { label: "Detail Penjualan", path: `${rolePrefix}/riwayat/penjualan/${id}` },
        { label: "Detail Bagi Hasil" },
    ];

    const fmt = (amount: number) => detail ? fmtAmount(amount, detail.satuan) : "";
    const hasPenerima = (detail?.penerima?.length ?? 0) > 0;

    return (
        <>
            <BreadcrumbLayout items={breadcrumbItems} />

            <div className="dp-page">
                {/* Hero */}
                <div className="dp-hero">
                    <div className="dp-hero-left">
                        <h1>Detail Bagi Hasil</h1>
                        <p>Informasi lengkap distribusi hasil penjualan sampah eksternal</p>
                    </div>
                </div>

                {loading && (
                    <div className="dp-loading">Memuat data bagi hasil…</div>
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
                                    <p className="dp-overview-title">Detail Bagi Hasil</p>
                                    <p className="dp-overview-subtitle">ID : {detail.bagi_hasil_id}</p>
                                </div>
                            </div>

                            <div className="dp-divider" />

                            <div className="dp-info-list">
                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaCalendarDays /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Tanggal</span>
                                        <span className="dp-info-value">{formatTanggalPanjang(detail.tanggal)}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaUser /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Nama Petugas</span>
                                        <span className="dp-info-value">{detail.nama_petugas}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaGift /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Jenis Reward</span>
                                        <span className="dp-info-value">{detail.reward}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaMoneyBillWave /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Gross Bank</span>
                                        <span className="dp-info-value">{fmt(detail.gross_bank)}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaUsers /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Total Distribusi Nasabah</span>
                                        <span className="dp-info-value">{fmt(detail.total_distribusi_nasabah)}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaCoins /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Sisa Bagi Hasil</span>
                                        <span className="dp-info-value">{fmt(detail.sisa_bagi_hasil)}</span>
                                    </div>
                                </div>
                            </div>

                            {detail.distribusi_id && (
                                <>
                                    <div className="dp-divider" />
                                    <button
                                        className="dpj-foto-btn"
                                        onClick={() => navigate(
                                            `${rolePrefix}/distribusi-sisa/${detail.distribusi_id}`,
                                            { state: { penjualan_id: detail.penjualan_id } }
                                        )}
                                    >
                                        <FaRightLeft />
                                        Lihat Distribusi Sisa Bagi Hasil
                                    </button>
                                </>
                            )}
                        </div>

                        {/* ── RIGHT: Nasabah Penerima ── */}
                        <div className="dp-setoran-col">

                            {/* Nasabah Langsung */}
                            <div className="dp-setoran-header">
                                <div>
                                    <p className="dp-setoran-title">
                                        {hasPenerima ? "Nasabah Langsung BSI" : "Nasabah Penerima"}
                                    </p>
                                    <p className="dp-setoran-subtitle">
                                        Nasabah yang terdaftar langsung di bank ini
                                    </p>
                                </div>
                                <span className="dp-setoran-count-badge">
                                    {detail.nasabah_langsung.length} nasabah
                                </span>
                            </div>

                            {detail.nasabah_langsung.length === 0 ? (
                                <div className="dp-setoran-empty">
                                    <FaBoxOpen />
                                    <span>Belum ada nasabah langsung.</span>
                                </div>
                            ) : (
                                <div className="dpj-items-list">
                                    {detail.nasabah_langsung.map((n) => (
                                        <NasabahRow
                                            key={n.penerima_id}
                                            nasabah={n}
                                            onClick={() => navigate(
                                                `${rolePrefix}/bagi-hasil/penerima/${n.penerima_id}`,
                                                { state: { bagiHasilId: detail.bagi_hasil_id } }
                                            )}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* BSU Sections — BSI only */}
                            {hasPenerima && (
                                <>
                                    <div className="dp-divider" style={{ margin: "12px 0" }} />
                                    <div>
                                    <div className="dp-setoran-header" style={{ marginBottom: 10 }}>
                                        <p className="dp-setoran-title">Nasabah via Bank Unit</p>
                                        <span className="dp-setoran-count-badge">{detail.penerima.length} BSU</span>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                        {detail.penerima.map((bsu) => (
                                            <BsuAccordionCard
                                                key={bsu.bank_id}
                                                bsu={bsu}
                                                onNasabahClick={(penerimaId) => navigate(
                                                    `${rolePrefix}/bagi-hasil/penerima/${penerimaId}`,
                                                    { state: { bagiHasilId: detail.bagi_hasil_id } }
                                                )}
                                            />
                                        ))}
                                    </div>
                                    </div>
                                </>
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
