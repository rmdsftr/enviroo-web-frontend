import { useState, useRef } from "react";
import type { DetailBank } from "../types/profil.type";
import { FaBuilding, FaCamera } from "react-icons/fa6";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import Input from "../components/input";

interface Props {
    bank: DetailBank;
    adminId: string;
    onSubmit: (formData: FormData) => Promise<void>;
    onClose: () => void;
}

export function EditProfilBankModal({ bank, adminId, onSubmit, onClose }: Props) {
    const [editNamaBank, setEditNamaBank] = useState(bank.nama_bank);
    const [editAlamat, setEditAlamat] = useState(bank.alamat || "");
    const [editDeskripsi, setEditDeskripsi] = useState(bank.deskripsi || "");
    const [editLatitude, setEditLatitude] = useState(bank.latitude?.toString() || "");
    const [editLongitude, setEditLongitude] = useState(bank.longitude?.toString() || "");
    const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
    const [editPhotoPreview, setEditPhotoPreview] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const editPhotoInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setEditPhotoFile(file);
        setEditPhotoPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("admin_id", adminId);
            formData.append("nama_bank", editNamaBank);
            formData.append("alamat", editAlamat);
            formData.append("deskripsi", editDeskripsi);
            if (editLatitude) formData.append("latitude", editLatitude);
            if (editLongitude) formData.append("longitude", editLongitude);
            if (editPhotoFile) formData.append("foto_profil", editPhotoFile);
            await onSubmit(formData);
            onClose();
        } catch {
            // error shown by page via onSubmit
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="regis-modal-overlay" onClick={onClose}>
            <div
                className="regis-modal"
                style={{ maxWidth: 540, maxHeight: "90vh", display: "flex", flexDirection: "column" }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="regis-modal-header" style={{ flexShrink: 0 }}>
                    <div>
                        <h3 className="regis-modal-title" style={{ fontSize: 14, fontWeight: 600 }}>Edit Profil Bank Sampah</h3>
                        <p className="regis-modal-subtitle">Perbarui informasi dan foto profil bank sampah</p>
                    </div>
                    <CloseButton onClick={onClose} />
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <div className="regis-modal-body" style={{ overflowY: "auto", flex: 1 }}>
                        {/* Foto Profil */}
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                            <div
                                style={{
                                    position: "relative", width: 100, height: 100,
                                    borderRadius: 14, overflow: "hidden", cursor: "pointer",
                                    border: "2px solid rgba(78,167,113,0.25)",
                                    boxShadow: "0 4px 14px rgba(1,50,54,0.1)",
                                }}
                                onClick={() => editPhotoInputRef.current?.click()}
                            >
                                {editPhotoPreview || bank.photo_url ? (
                                    <img
                                        src={editPhotoPreview || bank.photo_url}
                                        alt="foto bank"
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                ) : (
                                    <div style={{
                                        width: "100%", height: "100%",
                                        background: "linear-gradient(135deg,#EAF8E7,#C1E6BA)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 36, color: "#4EA771",
                                    }}>
                                        <FaBuilding />
                                    </div>
                                )}
                                <div
                                    style={{
                                        position: "absolute", inset: 0,
                                        background: "rgba(0,0,0,0.38)",
                                        display: "flex", flexDirection: "column",
                                        alignItems: "center", justifyContent: "center",
                                        gap: 4, color: "#fff", fontSize: 13,
                                        opacity: 0, transition: "opacity 0.2s",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                                >
                                    <FaCamera style={{ fontSize: 18 }} />
                                    <span style={{ fontSize: 11, fontWeight: 600 }}>Ganti Foto</span>
                                </div>
                            </div>
                            <input ref={editPhotoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} hidden />
                        </div>

                        <div className="regis-form-group">
                            <label className="regis-label">Nama Bank <span className="required">*</span></label>
                            <Input
                                className="regis-input-neutral"
                                variant="solid" inputSize="large" fullWidth
                                placeholder="Nama bank sampah"
                                value={editNamaBank}
                                onChange={(e) => setEditNamaBank(e.target.value)}
                                required
                            />
                        </div>

                        <div className="regis-form-group">
                            <label className="regis-label">Deskripsi</label>
                            <textarea
                                className="regis-textarea" rows={3}
                                placeholder="Deskripsi singkat bank sampah"
                                value={editDeskripsi}
                                onChange={(e) => setEditDeskripsi(e.target.value)}
                            />
                        </div>

                        <div className="regis-form-group">
                            <label className="regis-label">Alamat Lengkap</label>
                            <textarea
                                className="regis-textarea" rows={2}
                                placeholder="Alamat lengkap bank sampah"
                                value={editAlamat}
                                onChange={(e) => setEditAlamat(e.target.value)}
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div className="regis-form-group" style={{ marginBottom: 0 }}>
                                <label className="regis-label">Latitude</label>
                                <Input
                                    className="regis-input-neutral"
                                    variant="solid" inputSize="large" fullWidth
                                    placeholder="-0.9492"
                                    value={editLatitude}
                                    onChange={(e) => setEditLatitude(e.target.value)}
                                />
                            </div>
                            <div className="regis-form-group" style={{ marginBottom: 0 }}>
                                <label className="regis-label">Longitude</label>
                                <Input
                                    className="regis-input-neutral"
                                    variant="solid" inputSize="large" fullWidth
                                    placeholder="100.3543"
                                    value={editLongitude}
                                    onChange={(e) => setEditLongitude(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="regis-modal-footer" style={{ flexShrink: 0 }}>
                        <Button type="button" color="primary" variant="outline" size="default" onClick={onClose} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button type="submit" color="primary" variant="solid" size="default" disabled={isSubmitting}>
                            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
