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
    nilai_poin: number;
    nilai_konversi: number;
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
    const [nilaiPoin, setNilaiPoin] = useState<string>("");
    const [nilaiKonversi, setNilaiKonversi] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setError(null);
        setNilaiPoin(initialData ? String(initialData.nilai_poin) : "");
        setNilaiKonversi(initialData ? String(initialData.nilai_konversi) : "");
    }, [isOpen, initialData]);

    if (!isOpen || !reward) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const poin = parseFloat(nilaiPoin);
        const konversi = parseFloat(nilaiKonversi);

        if (!isFinite(poin) || poin <= 0) {
            setError("Nilai poin harus berupa angka lebih dari 0.");
            return;
        }
        if (!isFinite(konversi) || konversi <= 0) {
            setError("Nilai konversi harus berupa angka lebih dari 0.");
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({ nilai_poin: poin, nilai_konversi: konversi });
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
            <div className="mr-modal-box mr-modal-box--form" onClick={e => e.stopPropagation()}>
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
                                {isEdit ? "Edit Nilai Reward" : "Atur Nilai Konversi"}
                            </h2>
                            <p className="mr-modal-sub">
                                Tentukan konversi untuk reward <strong>{reward.NamaReward}</strong>.
                            </p>
                        </div>
                    </div>
                    <CloseButton onClick={onClose} />
                </div>

                <form onSubmit={handleSubmit} className="mr-modal-form">
                    <div className="mr-reward-summary">
                        <div className="mr-reward-summary-name">{reward.NamaReward}</div>
                        <div className="mr-reward-summary-satuan">Satuan: {reward.Satuan}</div>
                        {reward.Deskripsi && (
                            <div className="mr-reward-summary-desc">{reward.Deskripsi}</div>
                        )}
                    </div>

                    {error && <div className="mr-form-error">{error}</div>}

                    <div className="mr-form-row">
                        <div className="mr-form-field">
                            <label className="mr-form-label">Nilai Poin</label>
                            <Input
                                className="rw-input-override"
                                type="number"
                                min="0"
                                step="any"
                                placeholder="Contoh: 100"
                                value={nilaiPoin}
                                onChange={e => setNilaiPoin(e.target.value)}
                                required
                            />
                            <span className="mr-form-hint">Jumlah poin nasabah yang dikonversi.</span>
                        </div>

                        <div className="mr-form-field">
                            <label className="mr-form-label">
                                Nilai Konversi <span className="mr-form-unit">({reward.Satuan})</span>
                            </label>
                            <Input
                                className="rw-input-override"
                                type="number"
                                min="0"
                                step="any"
                                placeholder="Contoh: 1000"
                                value={nilaiKonversi}
                                onChange={e => setNilaiKonversi(e.target.value)}
                                required
                            />
                            <span className="mr-form-hint">
                                Nilai reward yang diterima nasabah per {nilaiPoin || "N"} poin.
                            </span>
                        </div>
                    </div>

                    <div className="mr-conversion-preview">
                        <span className="mr-conversion-preview-label">Ringkasan konversi</span>
                        <span className="mr-conversion-preview-value">
                            {nilaiPoin || "—"} poin
                            <span className="mr-conversion-preview-sep">=</span>
                            {nilaiKonversi || "—"} {reward.Satuan}
                        </span>
                    </div>

                    <div className="mr-modal-actions">
                        <Button type="button" variant="outline" color="primary" onClick={onClose}>
                            Batal
                        </Button>
                        <Button type="submit" color="primary" disabled={isSubmitting}>
                            {isSubmitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Reward"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
}
