import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { FaBoxOpen, FaCircleInfo, FaGear, FaMoneyBillWave, FaPlus } from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import { PenarikanService, type SettingPenarikan, type SettingSaldoRequest, type SettingWaktuRequest } from "../services/penarikan.service";
import Button from "../components/button";
import SyaratWaktuFormModal from "../modals/SyaratWaktuFormModal";
import SyaratNominalFormModal from "../modals/SyaratNominalFormModal";
import SyaratPenarikanDetailModal from "../modals/SyaratPenarikanDetailModal";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import { formatTanggalJam } from "../utils/date.utils";
import { formatNominal } from "../utils/number.utils";
import { getApiError } from "../utils/error.utils";
import "../styles/manajemen-reward.css";
import "../styles/syarat-penarikan.css";

function nominalText(value: number | null, satuan: string): string {
    if (value === null) return "Tidak dilayani";
    if (value === 0) return "Tanpa minimal";
    return formatNominal(value, satuan);
}

export default function SyaratPenarikanSection() {
    const { user } = useAuth();
    const bankId = user?.bank_id || "";

    const [setting, setSetting] = useState<SettingPenarikan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [waktuOpen, setWaktuOpen] = useState(false);
    const [nominalOpen, setNominalOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [popup, setPopup] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const fetchSetting = useCallback(async () => {
        if (!bankId) {
            setError("Bank tidak teridentifikasi pada sesi Anda.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const data = await PenarikanService.getSetting(bankId);
            setSetting(data);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 404) {
                setSetting(null);
            } else {
                setError(getApiError(err, "Gagal memuat syarat penarikan."));
            }
        } finally {
            setIsLoading(false);
        }
    }, [bankId]);

    useEffect(() => {
        fetchSetting();
    }, [fetchSetting]);

    const minWaktu = setting?.min_waktu ?? null;
    const satuanWaktu = setting?.satuan_waktu ?? null;
    const minRupiah = setting?.min_rupiah ?? null;
    const minPoin = setting?.min_poin ?? null;
    const waktuDiatur = minWaktu !== null && satuanWaktu !== null;
    const nominalDiatur = minRupiah !== null || minPoin !== null;

    const handleSubmitWaktu = async (data: SettingWaktuRequest) => {
        if (!bankId) return;
        await PenarikanService.saveSettingWaktu(bankId, data);
        setPopup({
            message: waktuDiatur ? "Syarat waktu penarikan berhasil diperbarui." : "Syarat waktu penarikan berhasil disimpan.",
            type: "success",
        });
        setWaktuOpen(false);
        fetchSetting();
    };

    const handleSubmitNominal = async (data: SettingSaldoRequest) => {
        if (!bankId) return;
        await PenarikanService.saveSettingSaldo(bankId, data);
        setPopup({
            message: nominalDiatur ? "Syarat nominal penarikan berhasil diperbarui." : "Syarat nominal penarikan berhasil disimpan.",
            type: "success",
        });
        setNominalOpen(false);
        fetchSetting();
    };

    return (
        <section className="mr-section">
            <div className="mr-header">
                <div className="mr-header-left">
                    <h2 className="mr-header-title">Syarat Pengajuan Penarikan</h2>
                    <p className="mr-header-desc">
                        Atur syarat waktu dan nominal penarikan agar nasabah bisa mengajukan penarikan saldo ke bank sampah.
                    </p>
                </div>
            </div>

            {error && <div className="mr-error-banner">{error}</div>}

            {isLoading ? (
                <div className="mr-cards-row">
                    <div className="mr-card-skeleton" />
                    <div className="mr-card-skeleton" />
                </div>
            ) : error ? null : (
                <>
                    <div className="mr-cards-row">
                        <div className="mr-card spn-card">
                            <div className="mr-card-body">
                                <div className="mr-card-header">
                                    <h3 className="mr-card-name">Waktu minimal</h3>
                                    <div className="mr-card-actions">
                                        <button
                                            type="button"
                                            className="mr-card-action-btn"
                                            title={waktuDiatur ? "Ubah syarat waktu" : "Atur syarat waktu"}
                                            aria-label={waktuDiatur ? "Ubah syarat waktu" : "Atur syarat waktu"}
                                            onClick={() => setWaktuOpen(true)}
                                        >
                                            {waktuDiatur ? <FaGear /> : <FaPlus />}
                                        </button>
                                    </div>
                                </div>
                                {waktuDiatur ? (
                                    <div className="spn-value spn-timeline">
                                        <div className="spn-timeline-track">
                                            <span className="spn-timeline-dot" />
                                            <span className="spn-timeline-line" />
                                            <span className="spn-value-num spn-timeline-value">{minWaktu} {satuanWaktu}</span>
                                            <span className="spn-timeline-line" />
                                            <span className="spn-timeline-dot" />
                                        </div>
                                        <div className="spn-timeline-labels">
                                            <span className="spn-value-label">Setoran pertama</span>
                                            <span className="spn-value-label">Bisa ajukan</span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="mr-card-state-badge mr-card-state-badge--empty">Belum diatur</span>
                                )}
                                <p className="spn-caption">Jika ada saldo awal, dihitung sejak akun dibuat.</p>
                            </div>
                        </div>

                        <div className="mr-card spn-card">
                            <div className="mr-card-body">
                                <div className="mr-card-header">
                                    <h3 className="mr-card-name">Saldo minimal</h3>
                                    <div className="mr-card-actions">
                                        <button
                                            type="button"
                                            className="mr-card-action-btn"
                                            title={nominalDiatur ? "Ubah saldo minimal" : "Atur saldo minimal"}
                                            aria-label={nominalDiatur ? "Ubah saldo minimal" : "Atur saldo minimal"}
                                            onClick={() => setNominalOpen(true)}
                                        >
                                            {nominalDiatur ? <FaGear /> : <FaPlus />}
                                        </button>
                                    </div>
                                </div>
                                {nominalDiatur ? (
                                    <div className="spn-value-group">
                                        <div className="spn-value spn-value--stack">
                                            <span className="spn-value-label"><FaMoneyBillWave /> Uang</span>
                                            <span className={`spn-value-num${minRupiah === null ? " spn-value-num--off" : ""}`}>
                                                {nominalText(minRupiah, "Rp")}
                                            </span>
                                        </div>
                                        <div className="spn-value spn-value--stack">
                                            <span className="spn-value-label"><FaBoxOpen /> Barang</span>
                                            <span className={`spn-value-num${minPoin === null ? " spn-value-num--off" : ""}`}>
                                                {nominalText(minPoin, "poin")}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="mr-card-state-badge mr-card-state-badge--empty">Belum diatur</span>
                                )}
                                <p className="spn-caption">Saldo rekening nasabah saat mengajukan penarikan.</p>
                            </div>
                        </div>
                    </div>

                    <div className="spn-meta">
                        <span className="spn-updated">
                            {setting ? `Terakhir diperbarui ${formatTanggalJam(setting.updated_at)}` : ""}
                        </span>
                        <Button
                            variant="ghost"
                            color="primary"
                            size="small"
                            isRounded
                            icon={<FaCircleInfo />}
                            onClick={() => setDetailOpen(true)}
                        >
                            Lihat detail syarat penarikan
                        </Button>
                    </div>
                </>
            )}

            <SyaratWaktuFormModal
                isOpen={waktuOpen}
                onClose={() => setWaktuOpen(false)}
                onSubmit={handleSubmitWaktu}
                initialData={setting}
            />

            <SyaratNominalFormModal
                isOpen={nominalOpen}
                onClose={() => setNominalOpen(false)}
                onSubmit={handleSubmitNominal}
                initialData={setting}
            />

            <SyaratPenarikanDetailModal isOpen={detailOpen} onClose={() => setDetailOpen(false)} />

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
