import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaArrowLeft } from "react-icons/fa6";
import Input from "../components/input";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import type { Reward } from "../types/reward.type";
import "../styles/reward.css";
import "../styles/manajemen-reward.css";

export interface NilaiRewardFormData {
    persentase: {
        level_user: string;
        persen_bagi_hasil: number;
    }[];
}

interface NilaiRewardFormModalProps {
    isOpen: boolean;
    reward: Reward | null;
    initialData?: NilaiRewardFormData | null;
    isEdit?: boolean;
    onClose: () => void;
    onBack?: () => void;
    onSubmit: (data: NilaiRewardFormData) => Promise<void>;
}

export default function NilaiRewardFormModal({
    isOpen,
    reward,
    initialData,
    isEdit,
    onClose,
    onBack,
    onSubmit,
}: NilaiRewardFormModalProps) {
    const [persenNasabah, setPersenNasabah] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setError(null);

        if (initialData && initialData.persentase) {
            const nasabah = initialData.persentase.find(p => p.level_user === "nasabah");
            setPersenNasabah(nasabah ? String(nasabah.persen_bagi_hasil) : "");
        } else {
            setPersenNasabah("");
        }
    }, [isOpen, initialData]);

    if (!isOpen || !reward) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const pNasabah = parseFloat(persenNasabah);
        if (!isFinite(pNasabah) || pNasabah < 0 || pNasabah > 100) {
            setError("Persentase Nasabah harus antara 0 dan 100.");
            return;
        }

        const data: NilaiRewardFormData = {
            persentase: [{ level_user: "nasabah", persen_bagi_hasil: pNasabah }]
        };

        setIsSubmitting(true);
        try {
            await onSubmit(data);
        } catch (err: any) {
            setError(
                err?.response?.data?.error ||
                err?.message ||
                "Gagal menyimpan nilai reward.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="mr-modal-overlay" onClick={onClose}>
            <div className="mr-modal-box mr-modal-box--form" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <div className="mr-modal-header">
                    <div className="mr-modal-header-left">
                        {!isEdit && onBack && (
                            <button
                                type="button"
                                className="mr-modal-back"
                                onClick={onBack}
                                title="Kembali"
                            >
                                <FaArrowLeft />
                            </button>
                        )}
                        <div>
                            <h2 className="mr-modal-title">
                                {isEdit ? "Edit Konfigurasi Reward" : "Atur Konfigurasi Reward"}
                            </h2>
                            <p className="mr-modal-sub">
                                Konfigurasi bagi hasil untuk <strong>{reward.NamaReward}</strong>.
                            </p>
                        </div>
                    </div>
                    <CloseButton onClick={onClose} />
                </div>

                <form onSubmit={handleSubmit} className="mr-modal-form">
                    {error && <div className="mr-form-error">{error}</div>}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '8px 0' }}>
                        {/* Section: Persentase Bagi Hasil */}
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--k-dark)', marginBottom: '12px', borderBottom: '1px solid var(--k-border)', paddingBottom: '8px' }}>Persentase Bagi Hasil</div>
                            <div className="mr-form-field">
                                <label className="mr-form-label">Nasabah (%) <span style={{ color: 'red' }}>*</span></label>
                                <Input
                                    className="rw-input-override"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="any"
                                    placeholder="Contoh: 100"
                                    value={persenNasabah}
                                    onChange={e => setPersenNasabah(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                    </div>

                    <div className="mr-modal-actions" style={{ marginTop: '24px' }}>
                        <Button type="button" variant="outline" color="primary" onClick={onClose}>
                            Batal
                        </Button>
                        <Button type="submit" color="primary" disabled={isSubmitting}>
                            {isSubmitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Konfigurasi"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
}
