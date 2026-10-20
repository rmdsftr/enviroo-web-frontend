import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Input from "../components/input";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import type { SettingPenarikan, SettingSaldoRequest } from "../services/penarikan.service";
import { formatDecimalInput, parseDecimalInput, toDecimalInput } from "../utils/number.utils";
import { getApiError } from "../utils/error.utils";
import "../styles/manajemen-reward.css";
import "../styles/syarat-penarikan.css";

interface SyaratNominalFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: SettingSaldoRequest) => Promise<void>;
    initialData?: SettingPenarikan | null;
}

interface NominalFieldProps {
    title: string;
    jenis: string;
    unitLabel: string;
    placeholder: string;
    active: boolean;
    value: string;
    onToggle: (active: boolean) => void;
    onChange: (value: string) => void;
}

function NominalField({ title, jenis, unitLabel, placeholder, active, value, onToggle, onChange }: NominalFieldProps) {
    return (
        <div className="spn-form-block">
            <div className="spn-form-block-head">
                <span className="mr-form-label">{title}</span>
                <label className="mr-toggle">
                    <input type="checkbox" checked={active} onChange={e => onToggle(e.target.checked)} />
                    <span className="mr-toggle-track"><span className="mr-toggle-thumb" /></span>
                    <span className="mr-toggle-text">{active ? "Dilayani" : "Tidak dilayani"}</span>
                </label>
            </div>
            {active ? (
                <div className="mr-form-field">
                    <label className="mr-form-label">
                        Minimal saldo <span className="mr-form-unit">({unitLabel})</span> <span style={{ color: "var(--c-danger)" }}>*</span>
                    </label>
                    <Input
                        type="text"
                        inputMode="decimal"
                        placeholder={placeholder}
                        value={value}
                        onChange={e => onChange(formatDecimalInput(e.target.value))}
                        fullWidth
                        className="mr-input-override"
                    />
                    <span className="mr-form-hint">Isi 0 jika tanpa minimal.</span>
                </div>
            ) : (
                <span className="mr-form-hint">Nasabah tidak bisa mengajukan penarikan {jenis}.</span>
            )}
        </div>
    );
}

export default function SyaratNominalFormModal({ isOpen, onClose, onSubmit, initialData }: SyaratNominalFormModalProps) {
    const isEdit = initialData?.min_rupiah != null || initialData?.min_poin != null;
    const [uangActive, setUangActive] = useState(true);
    const [uangValue, setUangValue] = useState("");
    const [barangActive, setBarangActive] = useState(true);
    const [barangValue, setBarangValue] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setError(null);
        const sudahDiatur = initialData?.min_rupiah != null || initialData?.min_poin != null;
        setUangActive(sudahDiatur ? initialData?.min_rupiah != null : true);
        setUangValue(toDecimalInput(initialData?.min_rupiah));
        setBarangActive(sudahDiatur ? initialData?.min_poin != null : true);
        setBarangValue(toDecimalInput(initialData?.min_poin));
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!uangActive && !barangActive) {
            setError("Aktifkan minimal satu jenis penarikan.");
            return;
        }
        const payload: SettingSaldoRequest = {};
        if (uangActive) {
            const nilai = parseDecimalInput(uangValue);
            if (nilai === null || nilai < 0) {
                setError("Isi minimal saldo penarikan uang. Isi 0 jika tanpa minimal.");
                return;
            }
            payload.min_rupiah = nilai;
        }
        if (barangActive) {
            const nilai = parseDecimalInput(barangValue);
            if (nilai === null || nilai < 0) {
                setError("Isi minimal saldo penarikan barang. Isi 0 jika tanpa minimal.");
                return;
            }
            payload.min_poin = nilai;
        }
        setIsSubmitting(true);
        try {
            await onSubmit(payload);
        } catch (err) {
            setError(getApiError(err, "Gagal menyimpan syarat nominal penarikan."));
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="mr-modal-overlay" onClick={onClose}>
            <div className="mr-modal-box mr-modal-box--form" onClick={e => e.stopPropagation()}>
                <div className="mr-modal-header">
                    <div>
                        <h3 className="mr-modal-title">{isEdit ? "Ubah Syarat Nominal Penarikan" : "Atur Syarat Nominal Penarikan"}</h3>
                        <p className="mr-modal-sub">Tentukan saldo minimal nasabah untuk mengajukan penarikan.</p>
                    </div>
                    <CloseButton onClick={onClose} />
                </div>
                <form className="mr-modal-form" onSubmit={handleSubmit}>
                    {error && <div className="mr-form-error">{error}</div>}
                    <NominalField
                        title="Penarikan uang"
                        jenis="uang"
                        unitLabel="Rp"
                        placeholder="Contoh: 25.000"
                        active={uangActive}
                        value={uangValue}
                        onToggle={setUangActive}
                        onChange={setUangValue}
                    />
                    <NominalField
                        title="Penarikan barang"
                        jenis="barang"
                        unitLabel="poin"
                        placeholder="Contoh: 100"
                        active={barangActive}
                        value={barangValue}
                        onToggle={setBarangActive}
                        onChange={setBarangValue}
                    />
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
