import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Input from "../components/input";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import type { KategoriSampah } from "../types/katalog.type";
import "../styles/manajemen-reward.css";

interface KategoriFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (nama: string) => Promise<void>;
    initialData?: KategoriSampah | null;
}

export default function KategoriFormModal({ isOpen, onClose, onSubmit, initialData }: KategoriFormModalProps) {
    const isEdit = !!initialData;
    const [nama, setNama] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setError(null);
        setNama(initialData?.Kategori || "");
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nama.trim()) return;
        setError(null);
        setIsSubmitting(true);
        try {
            await onSubmit(nama.trim());
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
                        <h3 className="mr-modal-title">{isEdit ? "Edit Kategori" : "Tambah Kategori"}</h3>
                        <p className="mr-modal-sub">{isEdit ? "Perbarui nama kategori sampah" : "Tambahkan kategori sampah baru"}</p>
                    </div>
                    <CloseButton onClick={onClose} />
                </div>
                <form className="mr-modal-form" onSubmit={handleSubmit}>
                    {error && <div className="mr-form-error">{error}</div>}
                    <div className="mr-form-field">
                        <label className="mr-form-label">
                            Nama Kategori <span style={{ color: "var(--c-danger)" }}>*</span>
                        </label>
                        <Input
                            type="text"
                            placeholder="Contoh: Plastik"
                            value={nama}
                            onChange={e => setNama(e.target.value)}
                            required
                            fullWidth
                            className="mr-input-override"
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
