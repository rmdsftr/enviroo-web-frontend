import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Input from "../components/input";
import Dropdown from "../components/dropdown";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import type { MasterSampah, SatuanSampah } from "../types/katalog.type";
import "../styles/manajemen-reward.css";

export interface SampahMasterFormData {
    nama_sampah: string;
    satuan_id: number;
}

interface SampahMasterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: SampahMasterFormData) => Promise<void>;
    initialData?: MasterSampah | null;
    satuanList: SatuanSampah[];
}

export default function SampahMasterModal({ isOpen, onClose, onSubmit, initialData, satuanList }: SampahMasterModalProps) {
    const isEdit = !!initialData;
    const [namaSampah, setNamaSampah] = useState("");
    const [satuanId, setSatuanId]     = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setError(null);
        setNamaSampah(initialData?.NamaSampah || "");
        setSatuanId(initialData?.SatuanID ?? satuanList[0]?.SatuanID ?? 0);
    }, [isOpen, initialData, satuanList]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!namaSampah.trim() || !satuanId) return;
        setError(null);
        setIsSubmitting(true);
        try {
            await onSubmit({ nama_sampah: namaSampah.trim(), satuan_id: satuanId });
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
                        {satuanList.length === 0 ? (
                            <div className="mr-form-error">
                                Belum ada satuan sampah. Tambahkan satuan terlebih dahulu di menu Operasional.
                            </div>
                        ) : (
                            <Dropdown
                                options={satuanList.map(s => ({ label: s.Satuan, value: s.SatuanID }))}
                                value={satuanId}
                                onChange={e => setSatuanId(Number(e.target.value))}
                                fullWidth
                            />
                        )}
                    </div>
                    <div className="mr-modal-actions">
                        <Button type="button" variant="outline" color="primary" onClick={onClose} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button type="submit" color="primary" disabled={isSubmitting || !satuanId}>
                            {isSubmitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
