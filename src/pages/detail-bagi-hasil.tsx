import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    FaCalendarDays,
    FaGift,
    FaMoneyBillWave,
    FaUsers,
    FaCoins,
    FaBuilding,
    FaUser,
    FaFileExport,
    FaBoxOpen,
    FaRightLeft,
    FaChevronDown,
} from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import BreadcrumbLayout from "../layouts/breadcrumb";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import Button from "../components/button";
import {
    BagiHasilService,
    type DetailBagiHasil,
    type NasabahBhItem,
    type PenerimaBhBank,
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
function NasabahRow({ nasabah, onClick }: { nasabah: NasabahBhItem; onClick?: () => void }) {
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
function BsuAccordionCard({ bsu, onNasabahClick }: { bsu: PenerimaBhBank; onNasabahClick: (penerimaId: string) => void }) {
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
export default function DetailBagiHasilPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const role = user?.role?.toLowerCase();
    const isBsi = role === "admin_bsi";
    const rolePrefix = isBsi ? "/bsi" : "/bsm";
    const riwayatPath = `${rolePrefix}/riwayat`;

    const [detail, setDetail] = useState<DetailBagiHasil | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(false);
        BagiHasilService.getDetailBhBank(id)
            .then((data) => setDetail(data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [id]);

    const handleExport = async () => {
        if (!id || exporting) return;
        setExporting(true);
        try {
            const blob = await BagiHasilService.exportLaporan(id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `laporan-bagi-hasil-${id}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            setPopupNotif({ message: "Gagal mengekspor laporan. Silakan coba lagi.", type: "error" });
        } finally {
            setExporting(false);
        }
    };

    const breadcrumbItems = [
        { label: "Riwayat", path: riwayatPath },
        { label: "Detail Bagi Hasil" },
    ];

    const nasabahLangsung: NasabahBhItem[] = detail
        ? (isBsi ? (detail.nasabah_bsi ?? []) : (detail.nasabah_bsm ?? []))
        : [];

    const penerimaBsu = isBsi ? (detail?.penerima ?? []) : [];

    const gross = detail ? (detail.gross_bsi ?? detail.gross_bsm ?? 0) : 0;
    const satuan = nasabahLangsung[0]?.satuan_diterima
        ?? detail?.penerima[0]?.nasabah_penerima[0]?.satuan_diterima
        ?? "Rp";
    const fmt = (n: number) => fmtAmount(n, satuan);

    return (
        <>
            <BreadcrumbLayout items={breadcrumbItems} />

            <div className="dp-page">
                {/* Hero */}
                <div className="dp-hero">
                    <div className="dp-hero-left">
                        <h1>Detail Bagi Hasil</h1>
                        <p>Informasi lengkap distribusi bagi hasil bank sampah</p>
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
                                    <div className="dp-info-icon-wrap"><FaGift /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Jenis Reward</span>
                                        <span className="dp-info-value">{detail.nama_reward}</span>
                                    </div>
                                </div>

                                <div className="dp-info-row">
                                    <div className="dp-info-icon-wrap"><FaMoneyBillWave /></div>
                                    <div className="dp-info-text">
                                        <span className="dp-info-label">Gross Bank</span>
                                        <span className="dp-info-value">{fmt(gross)}</span>
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
                                        {isBsi ? "Nasabah Langsung BSI" : "Nasabah Penerima"}
                                    </p>
                                    <p className="dp-setoran-subtitle">
                                        Nasabah yang terdaftar langsung di bank ini
                                    </p>
                                </div>
                                <span className="dp-setoran-count-badge">
                                    {nasabahLangsung.length} nasabah
                                </span>
                            </div>

                            {nasabahLangsung.length === 0 ? (
                                <div className="dp-setoran-empty">
                                    <FaBoxOpen />
                                    <span>Belum ada nasabah langsung.</span>
                                </div>
                            ) : (
                                <div className="dpj-items-list">
                                    {nasabahLangsung.map((n) => (
                                        <NasabahRow
                                            key={n.penerima_id}
                                            nasabah={n}
                                            onClick={() => navigate(
                                                `${rolePrefix}/bagi-hasil/penerima/${n.penerima_id}`,
                                                { state: { bagiHasilId: id } }
                                            )}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* BSU Sections — BSI only */}
                            {penerimaBsu.length > 0 && (
                                <>
                                    <div className="dp-divider" style={{ margin: "12px 0" }} />
                                    <div>
                                        <div className="dp-setoran-header" style={{ marginBottom: 10 }}>
                                            <p className="dp-setoran-title">Nasabah via Bank Unit</p>
                                            <span className="dp-setoran-count-badge">{penerimaBsu.length} BSU</span>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                            {penerimaBsu.map((bsu) => (
                                                <BsuAccordionCard
                                                    key={bsu.bank_id}
                                                    bsu={bsu}
                                                    onNasabahClick={(penerimaId) => navigate(
                                                        `${rolePrefix}/bagi-hasil/penerima/${penerimaId}`,
                                                        { state: { bagiHasilId: id } }
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
