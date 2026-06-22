import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { KatalogService } from "../services/katalog.service";
import type { KategoriSampah as KategoriSampahT, SatuanEnum, MasterSampah } from "../types/katalog.type";
import type { Reward } from "../types/reward.type";
import { FaCloudArrowUp, FaTrash } from "react-icons/fa6";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import Input from "../components/input";
import Dropdown from "../components/dropdown";
import SearchableInput, { type SearchableOption } from "../components/searchable-input";

export interface SampahFormData {
    nama_sampah: string;
    sarok_id?: number;
    satuan: SatuanEnum;
    kategori_id: number;
    reward_id: number;
    syarat_pemilahan?: string;
}

interface Props {
    formMode: "add" | "edit-item";
    categories: KategoriSampahT[];
    rewards: Reward[];
    initialValues?: {
        nama_sampah: string;
        satuan: string;
        kategori_id: number;
        reward_id: number;
        syarat_pemilahan?: string;
        photo_url?: string | null;
    };
    isSubmitting: boolean;
    onSubmit: (data: SampahFormData, foto: File | null) => void;
    onClose: () => void;
}

export function KatalogSampahFormModal({ formMode, categories, rewards, initialValues, isSubmitting, onSubmit, onClose }: Props) {
    const [addNama, setAddNama] = useState(initialValues?.nama_sampah ?? "");
    const [addSarokId, setAddSarokId] = useState<number | null>(null);
    const [addSatuan, setAddSatuan] = useState(initialValues?.satuan ?? "kg");
    const [addKategori, setAddKategori] = useState(initialValues?.kategori_id ?? (categories[0]?.KategoriID ?? 0));
    const [addRewardId, setAddRewardId] = useState(initialValues?.reward_id ?? (rewards[0]?.RewardID ?? 0));
    const [addSyaratPemilahan, setAddSyaratPemilahan] = useState(initialValues?.syarat_pemilahan ?? "");
    const [addFoto, setAddFoto] = useState<File | null>(null);
    const [addFotoPreview, setAddFotoPreview] = useState<string | null>(initialValues?.photo_url ?? null);
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) return;
        setAddFoto(file);
        const reader = new FileReader();
        reader.onloadend = () => setAddFotoPreview(reader.result as string);
        reader.readAsDataURL(file);
    }, []);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };

    const removeFoto = () => {
        setAddFoto(null);
        setAddFotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const searchMasterSampah = async (query: string): Promise<SearchableOption<number>[]> => {
        const res = await KatalogService.getMasterSampah(query);
        return (res.data ?? []).map((item: MasterSampah) => ({
            value: item.SarokID,
            label: item.NamaSampah,
            raw: item,
        }));
    };

    const handleSelectMaster = (option: SearchableOption<number> | null) => {
        if (option) {
            const master = option.raw as MasterSampah;
            setAddSarokId(master.SarokID);
            setAddSatuan(master.Satuan);
        } else {
            setAddSarokId(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            nama_sampah: addNama,
            sarok_id: addSarokId ?? undefined,
            satuan: addSatuan as SatuanEnum,
            kategori_id: addKategori,
            reward_id: addRewardId,
            syarat_pemilahan: addSyaratPemilahan || undefined,
        }, addFoto);
    };

    return createPortal(
        <div className="katalog-modal-overlay" onClick={onClose}>
            <div className="katalog-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="km-header">
                    <div>
                        <h3 className="km-title">
                            {formMode === "add" ? "Tambah Katalog Sampah" : "Edit Detail Item"}
                        </h3>
                        <p className="km-subtitle">
                            {formMode === "add"
                                ? "Tambahkan item sampah baru beserta kategori dan jenis reward-nya."
                                : "Perbarui informasi item katalog. Harga konversi diperbarui otomatis dari penjualan."}
                        </p>
                    </div>
                    <CloseButton onClick={onClose} />
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', padding: '24px 28px 0' }}>

                        {/* Kolom 1: Info Dasar */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--k-muted)', paddingBottom: '6px', borderBottom: '1px solid var(--k-border)' }}>
                                Informasi Item
                            </div>

                            <div className="km-group">
                                <label className="km-label">Nama Sampah <span className="km-req">*</span></label>
                                {formMode === "add" ? (
                                    <SearchableInput<number>
                                        value={addNama}
                                        onChange={(text) => {
                                            setAddNama(text);
                                            if (addSarokId !== null) setAddSarokId(null);
                                        }}
                                        onSelect={handleSelectMaster}
                                        onSearch={searchMasterSampah}
                                        placeholder="Contoh: Kardus Bekas"
                                        fullWidth
                                    />
                                ) : (
                                    <Input
                                        className="km-input-neutral"
                                        placeholder="Contoh: Kardus Bekas"
                                        fullWidth
                                        value={addNama}
                                        onChange={(e) => setAddNama(e.target.value)}
                                        disabled
                                    />
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="km-group">
                                    <label className="km-label">
                                        Satuan <span className="km-req">*</span>
                                        {addSarokId !== null && (
                                            <span style={{ fontSize: "10px", color: "var(--c-text-muted)", fontWeight: 400, marginLeft: "6px" }}>
                                                (dari master)
                                            </span>
                                        )}
                                    </label>
                                    <Dropdown
                                        fullWidth
                                        options={[{ label: "Kg", value: "kg" }, { label: "Pcs", value: "pcs" }, { label: "Liter", value: "liter" }]}
                                        value={addSatuan}
                                        onChange={(e) => setAddSatuan(e.target.value)}
                                        disabled={formMode === "edit-item"}
                                    />
                                </div>
                                <div className="km-group">
                                    <label className="km-label">Kategori <span className="km-req">*</span></label>
                                    <Dropdown
                                        fullWidth
                                        options={categories.map(c => ({ label: c.Kategori, value: c.KategoriID }))}
                                        value={addKategori}
                                        onChange={(e) => setAddKategori(Number(e.target.value))}
                                        disabled={formMode === "edit-item"}
                                    />
                                </div>
                            </div>

                            <div className="km-group">
                                <label className="km-label">Jenis Reward <span className="km-req">*</span></label>
                                <Dropdown
                                    fullWidth
                                    options={rewards.map(r => ({ label: `${r.NamaReward} (${r.Satuan})`, value: r.RewardID }))}
                                    value={addRewardId}
                                    onChange={(e) => setAddRewardId(Number(e.target.value))}
                                    disabled={formMode === "edit-item"}
                                />
                            </div>

                            <div className="km-group">
                                <label className="km-label">Syarat Pemilahan</label>
                                <textarea
                                    className="km-textarea"
                                    placeholder="Contoh: Harus bersih dan kering"
                                    rows={3}
                                    value={addSyaratPemilahan}
                                    onChange={(e) => setAddSyaratPemilahan(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Kolom 2: Upload Foto */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--k-muted)', paddingBottom: '6px', borderBottom: '1px solid var(--k-border)' }}>
                                Foto Item
                            </div>

                            <div className="km-group">
                                <label className="km-label">Foto Sampah</label>
                                <div
                                    className={`km-file-area ${dragging ? "dragging" : ""} ${addFotoPreview ? "has-file" : ""}`}
                                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                    onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
                                    onDrop={handleDrop}
                                    onClick={() => !addFotoPreview && fileInputRef.current?.click()}
                                    style={{ height: '200px' }}
                                >
                                    {addFotoPreview ? (
                                        <div className="km-preview-container">
                                            <img src={addFotoPreview} alt="Preview" className="km-preview-img" style={{ height: '200px' }} />
                                            <div className="km-preview-actions">
                                                <button type="button" className="km-btn-remove" onClick={(e) => { e.stopPropagation(); removeFoto(); }}>
                                                    <FaTrash /> Hapus
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="km-upload-prompt">
                                            <div className="km-upload-icon"><FaCloudArrowUp /></div>
                                            <div className="km-upload-text">Klik atau seret foto ke sini</div>
                                            <div className="km-upload-hint">JPG, PNG (Maks 5MB)</div>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg, image/jpg"
                                        ref={fileInputRef}
                                        onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                                        style={{ display: "none" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="km-footer">
                        <Button type="button" variant="outline" color="primary" onClick={onClose}>Batal</Button>
                        <Button type="submit" color="primary" disabled={isSubmitting}>
                            {isSubmitting ? "Menyimpan..." : (formMode === "add" ? "Simpan Katalog" : "Simpan Perubahan")}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
