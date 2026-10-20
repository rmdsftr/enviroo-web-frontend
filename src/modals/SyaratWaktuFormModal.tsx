import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Input from "../components/input";
import Dropdown from "../components/dropdown";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import type { SettingPenarikan, SettingWaktuRequest, SatuanWaktuPenarikan } from "../services/penarikan.service";
import { getApiError } from "../utils/error.utils";
import "../styles/manajemen-reward.css";

const SATUAN_WAKTU_OPTIONS: { label: string; value: SatuanWaktuPenarikan }[] = [
    { label: "Minggu", value: "minggu" },
    { label: "Bulan",  value: "bulan"  },
];

interface SyaratWaktuFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: SettingWaktuRequest) => Promise<void>;
    initialData?: SettingPenarikan | null;
}

export default function SyaratWaktuFormModal({ isOpen, onClose, onSubmit, initialData }: SyaratWaktuFormModalProps) {
    const isEdit = initialData?.min_waktu != null;
    const [minWaktu, setMinWaktu] = useState("");
    const [satuanWaktu, setSatuanWaktu] = useState<SatuanWaktuPenarikan>(SATUAN_WAKTU_OPTIONS[0].value);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setError(null);
        setMinWaktu(initialData?.min_waktu != null ? String(initialData.min_waktu) : "");
        setSatuanWaktu(initialData?.satuan_waktu ?? SATUAN_WAKTU_OPTIONS[0].value);
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const nilai = Number(minWaktu);
        if (!minWaktu || !Number.isInteger(nilai) || nilai < 1) {
            setError("Waktu minimal harus berupa angka bulat lebih dari 0.");
            return;
        }
        setIsSubmitting(true);
        try {
            await onSubmit({ min_waktu: nilai, satuan_waktu: satuanWaktu });
        } catch (err) {
            setError(getApiError(err, "Gagal menyimpan syarat waktu penarikan."));
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="mr-modal-overlay" onClick={onClose}>
            <div className="mr-modal-box mr-modal-box--form" onClick={e => e.stopPropagation()}>
                <div className="mr-modal-header">
                    <div>
                        <h3 className="mr-modal-title">{isEdit ? "Ubah Syarat Waktu Penarikan" : "Atur Syarat Waktu Penarikan"}</h3>
                        <p className="mr-modal-sub">Tentukan syarat waktu minimal penarikan saldo nasabah.</p>
                    </div>
                    <CloseButton onClick={onClose} />
                </div>
                <form className="mr-modal-form" onSubmit={handleSubmit}>
                    {error && <div className="mr-form-error">{error}</div>}
                    <div className="mr-form-row">
                        <div className="mr-form-field">
                            <label className="mr-form-label">
                                Waktu Minimal <span style={{ color: "var(--c-danger)" }}>*</span>
                            </label>
                            <Input
                                type="text"
                                inputMode="numeric"
                                placeholder="Contoh: 1"
                                value={minWaktu}
                                onChange={e => setMinWaktu(e.target.value.replace(/\D/g, ""))}
                                required
                                fullWidth
                                className="mr-input-override"
                            />
                        </div>
                        <div className="mr-form-field">
                            <label className="mr-form-label">
                                Satuan Waktu <span style={{ color: "var(--c-danger)" }}>*</span>
                            </label>
                            <Dropdown
                                options={SATUAN_WAKTU_OPTIONS}
                                value={satuanWaktu}
                                onChange={e => setSatuanWaktu(e.target.value as SatuanWaktuPenarikan)}
                                fullWidth
                            />
                        </div>
                    </div>
                    <div className="mr-modal-actions">
                        <Button type="button" variant="outline" color="primary" onClick={onClose} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button type="submit" color="primary" disabled={isSubmitting}>
                            {isSubmitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Syarat"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
