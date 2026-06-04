import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Input from "../components/input";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import Dropdown from "../components/dropdown";
import type { Kecamatan, Kelurahan } from "../types/lokasi.type";
import "../styles/manajemen-reward.css";

export interface KelurahanFormData {
    id_kelurahan?: number;
    id_kecamatan: number;
    kelurahan: string;
}

interface KelurahanFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: KelurahanFormData) => Promise<void>;
    initialData?: Kelurahan | null;
    kecamatans: Kecamatan[];
}

export default function KelurahanFormModal({ isOpen, onClose, onSubmit, initialData, kecamatans }: KelurahanFormModalProps) {
    const isEdit = !!initialData;
    const [form, setForm] = useState<KelurahanFormData>({ id_kecamatan: 0, kelurahan: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setError(null);
        if (initialData) {
            setForm({
                id_kelurahan: initialData.id_kelurahan,
                id_kecamatan: initialData.id_kecamatan,
                kelurahan: initialData.kelurahan,
            });
        } else {
            setForm({ id_kecamatan: 0, kelurahan: "" });
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.kelurahan.trim() || !form.id_kecamatan) return;
        setError(null);
        setIsSubmitting(true);
        try {
            await onSubmit({ ...form, kelurahan: form.kelurahan.trim() });
        } catch (err: any) {
            setError(err?.response?.data?.error || err?.message || "Terjadi kesalahan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const kecamatanOptions = kecamatans.map(k => ({
        label: k.kecamatan,
        value: String(k.id_kecamatan),
    }));

    return createPortal(
        <div className="mr-modal-overlay" onClick={onClose}>
            <div className="mr-modal-box mr-modal-box--form" onClick={e => e.stopPropagation()}>
                <div className="mr-modal-header">
                    <div>
                        <h3 className="mr-modal-title">{isEdit ? "Edit Kelurahan" : "Tambah Kelurahan"}</h3>
                        <p className="mr-modal-sub">{isEdit ? "Perbarui data kelurahan" : "Tambahkan data kelurahan baru"}</p>
                    </div>
                    <CloseButton onClick={onClose} />
                </div>
                <form className="mr-modal-form" onSubmit={handleSubmit}>
                    {error && <div className="mr-form-error">{error}</div>}
                    <div className="mr-form-field">
                        <label className="mr-form-label">
                            Kecamatan <span style={{ color: "var(--c-danger)" }}>*</span>
                        </label>
                        <Dropdown
                            options={kecamatanOptions}
                            value={form.id_kecamatan ? String(form.id_kecamatan) : ""}
                            onChange={e => setForm(prev => ({ ...prev, id_kecamatan: parseInt(e.target.value) || 0 }))}
                            placeholder="Pilih kecamatan..."
                            required
                            fullWidth
                        />
                    </div>
                    <div className="mr-form-field">
                        <label className="mr-form-label">
                            Nama Kelurahan <span style={{ color: "var(--c-danger)" }}>*</span>
                        </label>
                        <Input
                            type="text"
                            placeholder="Contoh: Purus"
                            value={form.kelurahan}
                            onChange={e => setForm(prev => ({ ...prev, kelurahan: e.target.value }))}
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
