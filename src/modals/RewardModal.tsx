import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Dropdown from "../components/dropdown";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import "../styles/reward.css";

const NAMA_REWARD_OPTIONS = [
    { label: "Uang", value: "Uang" },
    { label: "Sembako", value: "Sembako" },
];

const SATUAN_OPTIONS = [
    { label: "Rp", value: "Rp" },
    { label: "poin", value: "poin" },
];

export interface RewardFormData {
    reward_id?: number;
    nama_reward: string;
    satuan: string;
    deskripsi: string;
}

interface RewardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: RewardFormData) => Promise<void>;
    initialData?: RewardFormData | null;
    existingNames?: string[];
    existingSatuans?: string[];
}

export default function RewardModal({ isOpen, onClose, onSubmit, initialData, existingNames = [], existingSatuans = [] }: RewardModalProps) {
    const isEdit = !!initialData?.reward_id;

    const [form, setForm] = useState<RewardFormData>({
        nama_reward: "",
        satuan: "",
        deskripsi: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setError(null);
        if (initialData) {
            setForm({
                reward_id: initialData.reward_id,
                nama_reward: initialData.nama_reward || "",
                satuan: initialData.satuan || "",
                deskripsi: initialData.deskripsi || "",
            });
        } else {
            setForm({ nama_reward: "", satuan: "", deskripsi: "" });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);
        try {
            await onSubmit(form);
        } catch (err: any) {
            const msg =
                err?.response?.data?.error ||
                err?.message ||
                "Terjadi kesalahan saat menyimpan data.";
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="rw-modal-overlay" onClick={onClose}>
            <div className="rw-modal-box" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="rw-modal-header">
                    <div>
                        <h2 className="rw-modal-title">{isEdit ? "Edit Reward" : "Tambah Reward Baru"}</h2>
                        <p className="rw-modal-sub">
                            {isEdit
                                ? "Perbarui detail reward yang sudah ada"
                                : "Buat jenis reward baru untuk konversi poin nasabah"}
                        </p>
                    </div>
                    <CloseButton onClick={onClose} />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="rw-modal-form">
                    {error && (
                        <div style={{
                            padding: "10px 14px",
                            background: "var(--c-danger-bg)",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            borderRadius: "var(--r-sm)",
                            color: "var(--c-danger)",
                            fontSize: "12.5px",
                            fontFamily: "var(--ff-sans)",
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="rw-modal-field">
                        <label className="rw-modal-label">Nama Reward</label>
                        <Dropdown
                            options={isEdit ? NAMA_REWARD_OPTIONS : NAMA_REWARD_OPTIONS.filter(o => !existingNames.map(n => n.toLowerCase()).includes(o.value.toLowerCase()))}
                            value={form.nama_reward}
                            onChange={e => setForm(prev => ({ ...prev, nama_reward: e.target.value }))}
                            placeholder="Pilih jenis reward..."
                            fullWidth
                            required
                            disabled={isEdit}
                        />
                    </div>

                    <div className="rw-modal-field">
                        <label className="rw-modal-label">Satuan</label>
                        <Dropdown
                            options={isEdit ? SATUAN_OPTIONS : SATUAN_OPTIONS.filter(o => !existingSatuans.map(s => s.toLowerCase()).includes(o.value.toLowerCase()))}
                            value={form.satuan}
                            onChange={e => setForm(prev => ({ ...prev, satuan: e.target.value }))}
                            placeholder="Pilih satuan..."
                            fullWidth
                            required
                            disabled={isEdit}
                        />
                    </div>

                    <div className="rw-modal-field">
                        <label className="rw-modal-label">
                            Deskripsi 
                        </label>
                        <textarea
                            className="rw-modal-textarea"
                            placeholder="Jelaskan detail reward ini..."
                            value={form.deskripsi}
                            onChange={e => setForm(prev => ({ ...prev, deskripsi: e.target.value }))}
                            rows={3}
                            required
                        />
                    </div>

                    <div className="rw-modal-actions">
                        <Button type="button" variant="outline" color="primary" onClick={onClose}>
                            Batal
                        </Button>
                        <Button type="submit" color="primary" disabled={isSubmitting}>
                            {isSubmitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Reward"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
