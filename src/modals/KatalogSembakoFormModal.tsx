import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { SembakoService } from "../services/sembako.service";
import type { MasterSembako } from "../types/sembako.type";
import { FaCloudArrowUp, FaTrash } from "react-icons/fa6";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import Input from "../components/input";
import SearchableInput, { type SearchableOption } from "../components/searchable-input";

export interface SembakoFormData {
    nama_barang: string;
    barang_id?: number;
    nilai_poin: number;
    stok_awal?: number;
    tambah_stok?: number;
    stok?: number;
    foto?: File;
}

interface Props {
    formMode: "add-sembako" | "edit-sembako";
    initialValues?: {
        nama_barang: string;
        nilai_poin: number;
        photo_url?: string | null;
    };
    isSubmitting: boolean;
    onSubmit: (data: SembakoFormData) => void;
    onClose: () => void;
}

export function KatalogSembakoFormModal({ formMode, initialValues, isSubmitting, onSubmit, onClose }: Props) {
    const [sembakoNama, setSembakoNama] = useState(initialValues?.nama_barang ?? "");
    const [sembakoBarangId, setSembakoBarangId] = useState<number | null>(null);
    const [sembakoPoin, setSembakoPoin] = useState(initialValues?.nilai_poin?.toString() ?? "");
    const [sembakoStok, setSembakoStok] = useState("");
    const [sembakoTambahStok, setSembakoTambahStok] = useState("");
    const [sembakoFoto, setSembakoFoto] = useState<File | null>(null);
    const [sembakoFotoPreview, setSembakoFotoPreview] = useState<string | null>(initialValues?.photo_url ?? null);
    const sembakoFileRef = useRef<HTMLInputElement>(null);

    const handleSembakoFile = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) return;
        setSembakoFoto(file);
        const reader = new FileReader();
        reader.onloadend = () => setSembakoFotoPreview(reader.result as string);
        reader.readAsDataURL(file);
    }, []);

    const searchMasterSembako = async (query: string): Promise<SearchableOption<number>[]> => {
        const res = await SembakoService.getMasterSembako(query);
        return (res.data ?? []).map((item: MasterSembako) => ({
            value: item.BarangID,
            label: item.NamaBarang,
            raw: item,
        }));
    };

    const handleSelectMasterSembako = (option: SearchableOption<number> | null) => {
        setSembakoBarangId(option ? (option.raw as MasterSembako).BarangID : null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            nama_barang: sembakoNama,
            barang_id: sembakoBarangId ?? undefined,
            nilai_poin: Number(sembakoPoin),
            stok_awal: sembakoStok !== "" ? Number(sembakoStok) : undefined,
            tambah_stok: sembakoTambahStok !== "" ? Number(sembakoTambahStok) : undefined,
            stok: sembakoStok !== "" ? Number(sembakoStok) : undefined,
            foto: sembakoFoto || undefined,
        });
    };

    return createPortal(
        <div className="katalog-modal-overlay" onClick={onClose}>
            <div className="katalog-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
                <div className="km-header">
                    <div>
                        <h3 className="km-title">
                            {formMode === "add-sembako" ? "Tambah Katalog Sembako" : "Edit Sembako"}
                        </h3>
                        <p className="km-subtitle">
                            {formMode === "add-sembako"
                                ? "Tambahkan item sembako baru beserta harga poin dan stok awal."
                                : "Perbarui detail, harga poin, atau stok item sembako."}
                        </p>
                    </div>
                    <CloseButton onClick={onClose} />
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '28px', padding: '24px 28px 20px' }}>

                        {/* Kolom Kiri: Data */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--k-muted)', paddingBottom: '6px', borderBottom: '1px solid var(--k-border)' }}>
                                Informasi Item
                            </div>

                            <div className="km-group" style={{ margin: 0 }}>
                                <label className="km-label">Nama Sembako <span className="km-req">*</span></label>
                                {formMode === "add-sembako" ? (
                                    <SearchableInput<number>
                                        value={sembakoNama}
                                        onChange={(text) => {
                                            setSembakoNama(text);
                                            if (sembakoBarangId !== null) setSembakoBarangId(null);
                                        }}
                                        onSelect={handleSelectMasterSembako}
                                        onSearch={searchMasterSembako}
                                        placeholder="Contoh: Beras 5 kg"
                                        fullWidth
                                    />
                                ) : (
                                    <Input
                                        className="km-input-neutral"
                                        placeholder="Contoh: Beras 5 kg"
                                        fullWidth
                                        value={sembakoNama}
                                        onChange={(e) => setSembakoNama(e.target.value)}
                                        disabled
                                    />
                                )}
                            </div>

                            <div className="km-group" style={{ margin: 0 }}>
                                <label className="km-label">Harga (Poin) <span className="km-req">*</span></label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Input
                                        className="km-input-neutral"
                                        type="number"
                                        placeholder="0"
                                        fullWidth
                                        value={sembakoPoin}
                                        onChange={e => setSembakoPoin(e.target.value)}
                                        required
                                    />
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--k-green)', whiteSpace: 'nowrap', background: 'rgba(78,167,113,0.08)', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(78,167,113,0.2)' }}>
                                        poin
                                    </span>
                                </div>
                            </div>

                            {formMode === "add-sembako" ? (
                                <div className="km-group" style={{ margin: 0 }}>
                                    <label className="km-label">Stok Awal</label>
                                    <Input
                                        className="km-input-neutral"
                                        type="number"
                                        placeholder="0"
                                        fullWidth
                                        value={sembakoStok}
                                        onChange={e => setSembakoStok(e.target.value)}
                                    />
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="km-group" style={{ margin: 0 }}>
                                        <label className="km-label">Tambah Stok</label>
                                        <Input
                                            className="km-input-neutral"
                                            type="number"
                                            placeholder="0"
                                            fullWidth
                                            value={sembakoTambahStok}
                                            onChange={e => setSembakoTambahStok(e.target.value)}
                                        />
                                    </div>
                                    <div className="km-group" style={{ margin: 0 }}>
                                        <label className="km-label">Koreksi Stok</label>
                                        <Input
                                            className="km-input-neutral"
                                            type="number"
                                            placeholder="—"
                                            fullWidth
                                            value={sembakoStok}
                                            onChange={e => setSembakoStok(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Kolom Kanan: Foto */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--k-muted)', paddingBottom: '6px', borderBottom: '1px solid var(--k-border)' }}>
                                Foto Item
                            </div>

                            <div className="km-group" style={{ margin: 0 }}>
                                <label className="km-label">Foto Sembako</label>
                                <div
                                    className={`km-file-area ${sembakoFotoPreview ? "has-file" : ""}`}
                                    onClick={() => !sembakoFotoPreview && sembakoFileRef.current?.click()}
                                    style={{ aspectRatio: '1 / 1', width: '100%', height: 'auto', borderRadius: '14px' }}
                                >
                                    {sembakoFotoPreview ? (
                                        <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', borderRadius: '14px', overflow: 'hidden' }}>
                                            <img src={sembakoFotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                            <div className="km-preview-actions">
                                                <button type="button" className="km-btn-remove" onClick={(e) => { e.stopPropagation(); setSembakoFoto(null); setSembakoFotoPreview(null); }}>
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
                                        ref={sembakoFileRef}
                                        onChange={(e) => { if (e.target.files?.[0]) handleSembakoFile(e.target.files[0]); }}
                                        style={{ display: "none" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="km-footer">
                        <Button type="button" variant="outline" color="primary" onClick={onClose}>Batal</Button>
                        <Button type="submit" color="primary" disabled={isSubmitting}>
                            {isSubmitting ? "Menyimpan..." : (formMode === "add-sembako" ? "Simpan Sembako" : "Simpan Perubahan")}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
