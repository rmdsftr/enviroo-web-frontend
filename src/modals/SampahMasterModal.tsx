import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Input from "../components/input";
import Dropdown from "../components/dropdown";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import type { MasterSampah, SatuanEnum } from "../types/katalog.type";
import "../styles/manajemen-reward.css";

const SATUAN_OPTIONS = [
    { label: "kg",    value: "kg"    },
    { label: "pcs",   value: "pcs"   },
    { label: "liter", value: "liter" },
];

export interface SampahMasterFormData {
    nama_sampah: string;
    satuan: SatuanEnum;
}

interface SampahMasterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: SampahMasterFormData) => Promise<void>;
    initialData?: MasterSampah | null;
}

export default function SampahMasterModal({ isOpen, onClose, onSubmit, initialData }: SampahMasterModalProps) {
    const isEdit = !!initialData;
    const [namaSampah, setNamaSampah] = useState("");
    const [satuan, setSatuan]         = useState<SatuanEnum>("kg");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setError(null);
        setNamaSampah(initialData?.NamaSampah || "");
        setSatuan(initialData?.Satuan || "kg");
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!namaSampah.trim()) return;
        setError(null);
        setIsSubmitting(true);
        try {
            await onSubmit({ nama_sampah: namaSampah.trim(), satuan });
        } catch (err: any) {
            setError(err?.response?.data?.error || err?.message || "Terjadi kesalahan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="mr-modal-overlay" onClick={onClose}>
            <div className="mr-modal-box mr-modal-box--form" onClick={e => e.stopPropagation()}>
                <div className="mr-modal-header">
                    <div>
                        <h3 className="mr-modal-title">{isEdit ? "Edit Item Sampah" : "Tambah Item Sampah"}</h3>
                        <p className="mr-modal-sub">{isEdit ? "Perbarui data item sampah" : "Tambahkan item sampah baru ke master data"}</p>
                    </div>
                    <CloseButton onClick={onClose} />
                </div>
                <form className="mr-modal-form" onSubmit={handleSubmit}>
                    {error && <div className="mr-form-error">{error}</div>}
                    <div className="mr-form-field">
                        <label className="mr-form-label">
                            Nama Sampah <span style={{ color: "var(--c-danger)" }}>*</span>
                        </label>
                        <Input
                            type="text"
                            placeholder="Contoh: Botol Plastik PET"
                            value={namaSampah}
                            onChange={e => setNamaSampah(e.target.value)}
                            required
                            fullWidth
                            className="mr-input-override"
                        />
                    </div>
                    <div className="mr-form-field">
                        <label className="mr-form-label">
                            Satuan <span style={{ color: "var(--c-danger)" }}>*</span>
                        </label>
                        <Dropdown
                            options={SATUAN_OPTIONS}
                            value={satuan}
                            onChange={e => setSatuan(e.target.value as SatuanEnum)}
                            fullWidth
                        />
                    </div>
                    <div className="mr-modal-actions">
                        <Button type="button" variant="outline" color="primary" onClick={onClose} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button type="submit" color="primary" disabled={isSubmitting}>
                            {isSubmitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
