import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import type { KonfigurasiSisa } from "../types/distribusi_sisa.type";
import "../styles/konfigurasi-bagi-hasil.css";

export interface KonfigurasiSisaFormData {
    porsi_bsu: number;
    porsi_bsi: number;
    porsi_transport: number;
}

interface KonfigurasiSisaFormModalProps {
    isOpen: boolean;
    isEdit?: boolean;
    initialData?: KonfigurasiSisa | null;
    onClose: () => void;
    onSubmit: (data: KonfigurasiSisaFormData) => Promise<void>;
}

export default function KonfigurasiSisaFormModal({
    isOpen,
    isEdit,
    initialData,
    onClose,
    onSubmit,
}: KonfigurasiSisaFormModalProps) {
    const [porsiBSU, setPorsiBSU] = useState("");
    const [porsiBSI, setPorsiBSI] = useState("");
    const [porsiTransport, setPorsiTransport] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setError(null);

        if (isEdit && initialData) {
            setPorsiBSU(String(initialData.porsi_bsu));
            setPorsiBSI(String(initialData.porsi_bsi));
            setPorsiTransport(String(initialData.porsi_transport));
        } else {
            setPorsiBSU("");
            setPorsiBSI("");
            setPorsiTransport("");
        }
    }, [isOpen, isEdit, initialData]);

    if (!isOpen) return null;

    const bsu = parseFloat(porsiBSU) || 0;
    const bsi = parseFloat(porsiBSI) || 0;
    const transport = parseFloat(porsiTransport) || 0;
    const total = bsu + bsi + transport;
    const isValidTotal = total >= 99.99 && total <= 100.01;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isFinite(bsu) || bsu <= 0) {
            setError("Porsi BSU harus berupa angka lebih dari 0.");
            return;
        }
        if (!isFinite(bsi) || bsi <= 0) {
            setError("Porsi BSI harus berupa angka lebih dari 0.");
            return;
        }
        if (!isFinite(transport) || transport <= 0) {
            setError("Porsi Transport harus berupa angka lebih dari 0.");
            return;
        }
        if (!isValidTotal) {
            setError(`Total porsi harus berjumlah 100%. Saat ini: ${total.toFixed(2)}%`);
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({ porsi_bsu: bsu, porsi_bsi: bsi, porsi_transport: transport });
        } catch (err: any) {
            setError(
                err?.response?.data?.error ||
                err?.message ||
                "Gagal menyimpan konfigurasi.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="kbh-modal-overlay" onClick={onClose}>
            <div className="kbh-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="kbh-modal-header">
                    <div>
                        <h2 className="kbh-modal-title">
                            {isEdit ? "Edit Konfigurasi Bagi Hasil" : "Atur Konfigurasi Bagi Hasil"}
                        </h2>
                        <p className="kbh-modal-sub">
                            Tentukan porsi distribusi sisa bagi hasil. Total harus{" "}
                            <strong>100%</strong>.
                        </p>
                    </div>
                    <CloseButton onClick={onClose} />
                </div>

                <form onSubmit={handleSubmit} className="kbh-modal-form">
                    {error && <div className="kbh-form-error">{error}</div>}

                    <div className="kbh-form-fields">
                        {/* Porsi BSU */}
                        <div className="kbh-form-field">
                            <label className="kbh-form-label">
                                <span className="kbh-form-label-dot kbh-form-label-dot--bsu" />
                                Porsi BSU <span style={{ color: "red" }}>*</span>
                            </label>
                            <div className="kbh-input-group">
                                <input
                                    type="number"
                                    min="0.01"
                                    max="99.98"
                                    step="any"
                                    placeholder="Contoh: 60"
                                    value={porsiBSU}
                                    onChange={(e) => setPorsiBSU(e.target.value)}
                                    required
                                />
                                <span className="kbh-input-suffix">%</span>
                            </div>
                        </div>

                        {/* Porsi BSI */}
                        <div className="kbh-form-field">
                            <label className="kbh-form-label">
                                <span className="kbh-form-label-dot kbh-form-label-dot--bsi" />
                                Porsi BSI <span style={{ color: "red" }}>*</span>
                            </label>
                            <div className="kbh-input-group">
                                <input
                                    type="number"
                                    min="0.01"
                                    max="99.98"
                                    step="any"
                                    placeholder="Contoh: 30"
                                    value={porsiBSI}
                                    onChange={(e) => setPorsiBSI(e.target.value)}
                                    required
                                />
                                <span className="kbh-input-suffix">%</span>
                            </div>
                        </div>

                        {/* Porsi Transport */}
                        <div className="kbh-form-field">
                            <label className="kbh-form-label">
                                <span className="kbh-form-label-dot kbh-form-label-dot--transport" />
                                Porsi Transport <span style={{ color: "red" }}>*</span>
                            </label>
                            <div className="kbh-input-group">
                                <input
                                    type="number"
                                    min="0.01"
                                    max="99.98"
                                    step="any"
                                    placeholder="Contoh: 10"
                                    value={porsiTransport}
                                    onChange={(e) => setPorsiTransport(e.target.value)}
                                    required
                                />
                                <span className="kbh-input-suffix">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Live Total Indicator */}
                    <div className={`kbh-total-row ${isValidTotal && total > 0 ? "kbh-total-row--valid" : "kbh-total-row--invalid"}`}>
                        <span className="kbh-total-label">Total Porsi</span>
                        <span>
                            <span className="kbh-total-value">{total > 0 ? total.toFixed(2) : "0.00"}%</span>
                            {total > 0 && !isValidTotal && (
                                <span className="kbh-total-hint">
                                    {total < 100 ? `(kurang ${(100 - total).toFixed(2)}%)` : `(lebih ${(total - 100).toFixed(2)}%)`}
                                </span>
                            )}
                            {isValidTotal && total > 0 && (
                                <span className="kbh-total-hint">✓ valid</span>
                            )}
                        </span>
                    </div>

                    <div className="kbh-modal-actions">
                        <Button type="button" variant="outline" color="primary" onClick={onClose}>
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            color="primary"
                            disabled={isSubmitting || !isValidTotal || total === 0}
                        >
                            {isSubmitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Konfigurasi"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
}
