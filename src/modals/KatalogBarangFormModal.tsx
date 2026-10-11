import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { BarangService } from "../services/barang.service";
import type { MasterBarang } from "../types/barang.type";
import { FaCloudArrowUp, FaTrash } from "react-icons/fa6";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import Input from "../components/input";
import SearchableInput, { type SearchableOption } from "../components/searchable-input";
import { formatDecimalInput, parseDecimalInput, toDecimalInput } from "../utils/number.utils";

export interface BarangFormData {
    nama_barang: string;
    barang_id?: number;
    nilai_poin: number;
    stok_awal?: number;
    tambah_stok?: number;
    stok?: number;
    foto?: File;
}

interface Props {
    formMode: "add-barang" | "edit-barang";
    initialValues?: {
        nama_barang: string;
        nilai_poin: number;
        photo_url?: string | null;
    };
    isSubmitting: boolean;
    onSubmit: (data: BarangFormData) => void;
    onClose: () => void;
}

export function KatalogBarangFormModal({ formMode, initialValues, isSubmitting, onSubmit, onClose }: Props) {
    const [barangNama, setBarangNama] = useState(initialValues?.nama_barang ?? "");
    const [barangBarangId, setBarangBarangId] = useState<number | null>(null);
    const [barangPoin, setBarangPoin] = useState(toDecimalInput(initialValues?.nilai_poin));
    const [barangStok, setBarangStok] = useState("");
    const [barangTambahStok, setBarangTambahStok] = useState("");
    const [barangFoto, setBarangFoto] = useState<File | null>(null);
    const [barangFotoPreview, setBarangFotoPreview] = useState<string | null>(initialValues?.photo_url ?? null);
    const barangFileRef = useRef<HTMLInputElement>(null);

    const handleBarangFile = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) return;
        setBarangFoto(file);
        const reader = new FileReader();
        reader.onloadend = () => setBarangFotoPreview(reader.result as string);
        reader.readAsDataURL(file);
    }, []);

    const searchMasterBarang = async (query: string): Promise<SearchableOption<number>[]> => {
        const res = await BarangService.getMasterBarang(query);
        return (res.data ?? []).map((item: MasterBarang) => ({
            value: item.BarangID,
            label: item.NamaBarang,
            raw: item,
        }));
    };

    const handleSelectMasterBarang = (option: SearchableOption<number> | null) => {
        setBarangBarangId(option ? (option.raw as MasterBarang).BarangID : null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            nama_barang: barangNama,
            barang_id: barangBarangId ?? undefined,
            nilai_poin: parseDecimalInput(barangPoin) ?? 0,
            stok_awal: parseDecimalInput(barangStok) ?? undefined,
            tambah_stok: parseDecimalInput(barangTambahStok) ?? undefined,
            stok: parseDecimalInput(barangStok) ?? undefined,
            foto: barangFoto || undefined,
        });
    };

    return createPortal(
        <div className="katalog-modal-overlay" onClick={onClose}>
            <div className="katalog-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
                <div className="km-header">
                    <div>
                        <h3 className="km-title">
                            {formMode === "add-barang" ? "Tambah Katalog Barang" : "Edit Barang"}
                        </h3>
                        <p className="km-subtitle">
                            {formMode === "add-barang"
                                ? "Tambahkan item barang baru beserta harga poin dan stok awal."
                                : "Perbarui detail, harga poin, atau stok item barang."}
                        </p>
                    </div>
                    <CloseButton onClick={onClose} />
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '28px', padding: '24px 28px 20px' }}>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--k-muted)', paddingBottom: '6px', borderBottom: '1px solid var(--k-border)' }}>
                                Informasi Item
                            </div>

                            <div className="km-group" style={{ margin: 0 }}>
                                <label className="km-label">Nama Barang <span className="km-req">*</span></label>
                                {formMode === "add-barang" ? (
                                    <SearchableInput<number>
                                        value={barangNama}
                                        onChange={(text) => {
                                            setBarangNama(text);
                                            if (barangBarangId !== null) setBarangBarangId(null);
                                        }}
                                        onSelect={handleSelectMasterBarang}
                                        onSearch={searchMasterBarang}
                                        placeholder="Contoh: Beras 5 kg"
                                        fullWidth
                                    />
                                ) : (
                                    <Input
                                        className="km-input-neutral"
                                        placeholder="Contoh: Beras 5 kg"
                                        fullWidth
                                        value={barangNama}
                                        onChange={(e) => setBarangNama(e.target.value)}
                                        disabled
                                    />
                                )}
                            </div>

                            <div className="km-group" style={{ margin: 0 }}>
                                <label className="km-label">Harga (Poin) <span className="km-req">*</span></label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Input
                                        className="km-input-neutral"
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0"
                                        fullWidth
                                        value={barangPoin}
                                        onChange={e => setBarangPoin(formatDecimalInput(e.target.value))}
                                        required
                                    />
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--k-green)', whiteSpace: 'nowrap', background: 'rgba(78,167,113,0.08)', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(78,167,113,0.2)' }}>
                                        poin
                                    </span>
                                </div>
                            </div>

                            {formMode === "add-barang" ? (
                                <div className="km-group" style={{ margin: 0 }}>
                                    <label className="km-label">Stok Awal</label>
                                    <Input
                                        className="km-input-neutral"
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0"
                                        fullWidth
                                        value={barangStok}
                                        onChange={e => setBarangStok(formatDecimalInput(e.target.value))}
                                    />
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="km-group" style={{ margin: 0 }}>
                                        <label className="km-label">Tambah Stok</label>
                                        <Input
                                            className="km-input-neutral"
                                            type="text"
                                            inputMode="decimal"
                                            placeholder="0"
                                            fullWidth
                                            value={barangTambahStok}
                                            onChange={e => setBarangTambahStok(formatDecimalInput(e.target.value))}
                                        />
                                    </div>
                                    <div className="km-group" style={{ margin: 0 }}>
                                        <label className="km-label">Koreksi Stok</label>
                                        <Input
                                            className="km-input-neutral"
                                            type="text"
                                            inputMode="decimal"
                                            placeholder="—"
                                            fullWidth
                                            value={barangStok}
                                            onChange={e => setBarangStok(formatDecimalInput(e.target.value))}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--k-muted)', paddingBottom: '6px', borderBottom: '1px solid var(--k-border)' }}>
                                Foto Item
                            </div>

                            <div className="km-group" style={{ margin: 0 }}>
                                <label className="km-label">Foto Barang</label>
                                <div
                                    className={`km-file-area ${barangFotoPreview ? "has-file" : ""}`}
                                    onClick={() => !barangFotoPreview && barangFileRef.current?.click()}
                                    style={{ aspectRatio: '1 / 1', width: '100%', height: 'auto', borderRadius: '14px' }}
                                >
                                    {barangFotoPreview ? (
                                        <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', borderRadius: '14px', overflow: 'hidden' }}>
                                            <img src={barangFotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                            <div className="km-preview-actions">
                                                <button type="button" className="km-btn-remove" onClick={(e) => { e.stopPropagation(); setBarangFoto(null); setBarangFotoPreview(null); }}>
                                                    <FaTrash /> Hapus
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="km-upload-prompt">
                                            <div className="km-upload-icon"><FaCloudArrowUp /></div>
                                            <div className="km-upload-text">Klik atau seret foto</div>
                                            <div className="km-upload-hint">JPG, PNG · Maks 5MB</div>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg, image/jpg"
                                        ref={barangFileRef}
                                        onChange={(e) => { if (e.target.files?.[0]) handleBarangFile(e.target.files[0]); }}
                                        style={{ display: "none" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="km-footer">
                        <Button type="button" variant="outline" color="primary" onClick={onClose}>Batal</Button>
                        <Button type="submit" color="primary" disabled={isSubmitting}>
                            {isSubmitting ? "Menyimpan..." : (formMode === "add-barang" ? "Simpan Barang" : "Simpan Perubahan")}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
