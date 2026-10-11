import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Input from "../components/input";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import type { MitraPengepul } from "../types/mitra.type";
import { getApiError } from "../utils/error.utils";
import "../styles/manajemen-reward.css";

export interface MitraFormData {
    nama_mitra: string;
    is_active: boolean;
}

interface MitraFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: MitraFormData) => Promise<void>;
    initialData?: MitraPengepul | null;
}

export default function MitraFormModal({ isOpen, onClose, onSubmit, initialData }: MitraFormModalProps) {
    const isEdit = !!initialData;
    const [nama, setNama] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setError(null);
        setNama(initialData?.nama_mitra || "");
        setIsActive(initialData?.is_active ?? true);
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nama.trim()) return;
        setError(null);
        setIsSubmitting(true);
        try {
            await onSubmit({ nama_mitra: nama.trim(), is_active: isActive });
        } catch (err) {
            setError(getApiError(err, "Terjadi kesalahan."));
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="mr-modal-overlay" onClick={onClose}>
            <div className="mr-modal-box mr-modal-box--form" onClick={e => e.stopPropagation()}>
                <div className="mr-modal-header">
                    <div>
                        <h3 className="mr-modal-title">{isEdit ? "Edit Mitra Pengepul" : "Tambah Mitra Pengepul"}</h3>
                        <p className="mr-modal-sub">
                            {isEdit ? "Perbarui nama mitra pengepul" : "Tambahkan mitra pengepul baru untuk bank sampah Anda"}
                        </p>
                    </div>
                    <CloseButton onClick={onClose} />
                </div>
                <form className="mr-modal-form" onSubmit={handleSubmit}>
                    {error && <div className="mr-form-error">{error}</div>}
                    <div className="mr-form-field">
                        <label className="mr-form-label">
                            Nama Mitra Pengepul <span style={{ color: "var(--c-danger)" }}>*</span>
                        </label>
                        <Input
                            type="text"
                            placeholder="Contoh: PT Semen Padang"
                            value={nama}
                            onChange={e => setNama(e.target.value)}
                            required
                            fullWidth
                            className="mr-input-override"
                        />
                    </div>
                    {isEdit && (
                        <div className="mr-form-field">
                            <label className="mr-form-label">Status Mitra</label>
                            <label className="mr-toggle">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={e => setIsActive(e.target.checked)}
                                />
                                <span className="mr-toggle-track"><span className="mr-toggle-thumb" /></span>
                                <span className="mr-toggle-text">{isActive ? "Aktif" : "Tidak Aktif"}</span>
                            </label>
                        </div>
                    )}
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
