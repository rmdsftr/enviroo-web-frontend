import { useCallback, useEffect, useState } from "react";
import { FaChartPie, FaPen, FaPlus } from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import { DistribusiSisaService } from "../services/distribusi_sisa.service";
import type { KonfigurasiSisa } from "../types/distribusi_sisa.type";
import KonfigurasiSisaFormModal from "../modals/KonfigurasiSisaFormModal";
import type { KonfigurasiSisaFormData } from "../modals/KonfigurasiSisaFormModal";
import PopupConfirmation from "./popup-confirmation";
import PopupNotifikasi from "./popup-notifikasi";
import Button from "../components/button";
import "../styles/konfigurasi-bagi-hasil.css";

function formatPorsi(n: number): string {
    if (!isFinite(n)) return "0";
    return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n);
}

export default function KonfigurasiBagiHasilSection() {
    const { user } = useAuth();
    const bankId = user?.bank_id || "";

    const [config, setConfig] = useState<KonfigurasiSisa | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [formOpen, setFormOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingData, setPendingData] = useState<KonfigurasiSisaFormData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [popup, setPopup] = useState<{ message: string; type: "success" | "error" } | null>(null);

    /* ── Fetch ── */
    const fetchConfig = useCallback(async () => {
        if (!bankId) {
            setError("Bank tidak teridentifikasi pada sesi Anda.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const data = await DistribusiSisaService.getKonfigurasi(bankId);
            setConfig(data);
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 404) {
                setConfig(null);
            } else {
                setError(err?.response?.data?.error || "Gagal memuat konfigurasi bagi hasil.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [bankId]);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    /* ── Handlers ── */
    const openAdd = () => {
        setIsEditMode(false);
        setFormOpen(true);
    };

    const openEdit = () => {
        setIsEditMode(true);
        setFormOpen(true);
    };

    const handleFormSubmit = async (data: KonfigurasiSisaFormData) => {
        setPendingData(data);
        setFormOpen(false);
        setConfirmOpen(true);
    };

    const handleConfirm = async () => {
        if (!pendingData) return;
        setIsSubmitting(true);
        setConfirmOpen(false);
        try {
            if (isEditMode) {
                await DistribusiSisaService.updateKonfigurasi(bankId, pendingData);
                setPopup({ message: "Konfigurasi bagi hasil berhasil diperbarui.", type: "success" });
            } else {
                await DistribusiSisaService.addKonfigurasi(bankId, {
                    porsi_bsu: pendingData.porsi_bsu,
                    porsi_bsi: pendingData.porsi_bsi,
                    porsi_transport: pendingData.porsi_transport,
                });
                setPopup({ message: "Konfigurasi bagi hasil berhasil dibuat.", type: "success" });
            }
            setPendingData(null);
            fetchConfig();
        } catch (err: any) {
            setPopup({
                message: err?.response?.data?.error || "Gagal menyimpan konfigurasi.",
                type: "error",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelConfirm = () => {
        setConfirmOpen(false);
        setPendingData(null);
        setFormOpen(true);
    };

    /* ── Render Helpers ── */
    const renderBar = (cfg: KonfigurasiSisa) => (
        <div className="kbh-bar-wrap">
            <div className="kbh-bar">
                <div
                    className="kbh-bar-segment kbh-bar-segment--bsu"
                    style={{ width: `${cfg.porsi_bsu}%` }}
                    title={`BSU: ${cfg.porsi_bsu}%`}
                >
                    {cfg.porsi_bsu >= 12 ? `${formatPorsi(cfg.porsi_bsu)}%` : ""}
                </div>
                <div
                    className="kbh-bar-segment kbh-bar-segment--bsi"
                    style={{ width: `${cfg.porsi_bsi}%` }}
                    title={`BSI: ${cfg.porsi_bsi}%`}
                >
                    {cfg.porsi_bsi >= 12 ? `${formatPorsi(cfg.porsi_bsi)}%` : ""}
                </div>
                <div
                    className="kbh-bar-segment kbh-bar-segment--transport"
                    style={{ width: `${cfg.porsi_transport}%` }}
                    title={`Transport: ${cfg.porsi_transport}%`}
                >
                    {cfg.porsi_transport >= 12 ? `${formatPorsi(cfg.porsi_transport)}%` : ""}
                </div>
            </div>
            <div className="kbh-bar-legend">
                <div className="kbh-bar-legend-item">
                    <span className="kbh-bar-legend-dot kbh-bar-legend-dot--bsu" />
                    Bank Sampah Unit
                </div>
                <div className="kbh-bar-legend-item">
                    <span className="kbh-bar-legend-dot kbh-bar-legend-dot--bsi" />
                    Bank Sampah Induk
                </div>
                <div className="kbh-bar-legend-item">
                    <span className="kbh-bar-legend-dot kbh-bar-legend-dot--transport" />
                    Transport
                </div>
            </div>
        </div>
    );

    /* ── Main Render ── */
    return (
        <section className="kbh-section">
            {/* Header */}
            <div className="kbh-header">
                <div className="kbh-header-left">
                    <h2 className="kbh-header-title">Distribusi Sisa Bagi Hasil</h2>
                    <p className="kbh-header-desc">
                        Atur porsi pembagian bagi hasil antara Bank Sampah Unit, Bank
                        Sampah Induk, dan biaya transportasi. Total porsi harus berjumlah 100%.
                    </p>
                </div>
            </div>

            {error && <div className="kbh-error-banner">{error}</div>}

            {/* Loading */}
            {isLoading && <div className="kbh-skeleton" />}

            {/* Empty State */}
            {!isLoading && !error && !config && (
                <div className="kbh-empty">
                    <div className="kbh-empty-icon">
                        <FaChartPie />
                    </div>
                    <h3>Konfigurasi belum diatur</h3>
                    <p>
                        Belum ada pengaturan distribusi sisa bagi hasil untuk bank sampah ini. Klik
                        tombol di atas untuk mulai mengonfigurasi porsi pembagiannya.
                    </p>
                    <Button color="primary" icon={<FaPlus />} onClick={openAdd} disabled={isSubmitting}>
                        Atur Konfigurasi
                    </Button>
                </div>
            )}

            {/* Config Card */}
            {!isLoading && !error && config && (
                <div className="kbh-card">
                    <div className="kbh-card-top">
                        <div className="kbh-card-top-left">
                            <div className="kbh-card-icon">
                                <FaChartPie />
                            </div>
                            <div>
                                <p className="kbh-card-label">Distribusi Porsi Bagi Hasil</p>
                                <p className="kbh-card-sub">
                                    Total: {formatPorsi(config.total_porsi)}% &bull; {config.nama_bank}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            color="primary"
                            size="small"
                            icon={<FaPen />}
                            onClick={openEdit}
                            disabled={isSubmitting}
                        >
                            Edit
                        </Button>
                    </div>

                    {renderBar(config)}

                    <div className="kbh-stats-grid">
                        {/* BSU */}
                        <div className="kbh-stat">
                            <div className="kbh-stat-top">
                                <span className="kbh-stat-dot kbh-stat-dot--bsu" />
                                <span className="kbh-stat-name">Bank Sampah Unit</span>
                            </div>
                            <div className="kbh-stat-value">
                                {formatPorsi(config.porsi_bsu)}<span>%</span>
                            </div>
                            <p className="kbh-stat-desc">Porsi untuk BSU sebagai mitra pengelola sampah.</p>
                        </div>

                        {/* BSI */}
                        <div className="kbh-stat">
                            <div className="kbh-stat-top">
                                <span className="kbh-stat-dot kbh-stat-dot--bsi" />
                                <span className="kbh-stat-name">Bank Sampah Induk</span>
                            </div>
                            <div className="kbh-stat-value">
                                {formatPorsi(config.porsi_bsi)}<span>%</span>
                            </div>
                            <p className="kbh-stat-desc">Porsi untuk BSI sebagai pengelola dan koordinator.</p>
                        </div>

                        {/* Transport */}
                        <div className="kbh-stat">
                            <div className="kbh-stat-top">
                                <span className="kbh-stat-dot kbh-stat-dot--transport" />
                                <span className="kbh-stat-name">Biaya Transport</span>
                            </div>
                            <div className="kbh-stat-value">
                                {formatPorsi(config.porsi_transport)}<span>%</span>
                            </div>
                            <p className="kbh-stat-desc">Porsi untuk menutup biaya operasional pengangkutan.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Form Modal */}
            <KonfigurasiSisaFormModal
                isOpen={formOpen}
                isEdit={isEditMode}
                initialData={config}
                onClose={() => setFormOpen(false)}
                onSubmit={handleFormSubmit}
            />

            {/* Confirm before save */}
            <PopupConfirmation
                isOpen={confirmOpen}
                type="warning"
                title={isEditMode ? "Simpan Perubahan Konfigurasi?" : "Simpan Konfigurasi Baru?"}
                message={
                    isEditMode
                        ? "Perubahan porsi bagi hasil akan langsung berlaku untuk seluruh perhitungan bagi hasil berikutnya. Lanjutkan?"
                        : "Konfigurasi bagi hasil akan diterapkan pada seluruh perhitungan bagi hasil. Lanjutkan?"
                }
                confirmText={isSubmitting ? "Menyimpan..." : "Ya, Simpan"}
                cancelText="Kembali"
                onConfirm={handleConfirm}
                onCancel={handleCancelConfirm}
            />

            {popup && (
                <PopupNotifikasi
                    message={popup.message}
                    type={popup.type}
                    onClose={() => setPopup(null)}
                />
            )}
        </section>
    );
}
