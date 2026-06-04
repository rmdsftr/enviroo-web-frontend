import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ProfilService } from "../services/profil.service";
import { AuthService } from "../services/auth.service";
import {
    FaUser,
    FaEnvelope,
    FaWhatsapp,
    FaLock,
    FaIdCard,
    FaShieldHalved,
    FaPen,
    FaFingerprint,
    FaChevronDown,
    FaBuilding,
    FaCalendarDays,
    FaCircleInfo,
    FaCamera,
} from "react-icons/fa6";
import Button from "../components/button";
import { formatTanggalPanjang } from "../utils/date.utils";
import CloseButton from "../components/close-button";
import ViewPhoto from "../components/view-photo";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import profileDefault from "../assets/profile.png";
import "../styles/profil.css";

interface ProfilData {
    petugas_id: string;
    user_id: string;
    nama: string;
    email: string;
    no_whatsapp: string;
    photo_url: string;
    status_petugas: string;
    role_petugas: string;
    joined_at: string;
    bank_id: string;
    nama_bank: string;
    is_nasabah: boolean;
    nasabah_id: string | null;
    nama_bank_nasabah: string | null;
}

type SettingType = "password" | null;

export default function ProfilPage() {
    const { user } = useAuth();
    const [profil, setProfil] = useState<ProfilData | null>(null);
    const [loading, setLoading] = useState(true);

    // Edit modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPhoto, setShowPhoto] = useState(false);
    const [editNama, setEditNama] = useState("");
    const [editWhatsapp, setEditWhatsapp] = useState("");
    const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
    const [editPhotoPreview, setEditPhotoPreview] = useState("");
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Dropdown form states
    const [expandedSetting, setExpandedSetting] = useState<SettingType>(null);
    const [formValue, setFormValue] = useState("");
    const [formValueConfirm, setFormValueConfirm] = useState("");
    const [formOldPassword, setFormOldPassword] = useState("");
    const [formError, setFormError] = useState("");
    const [formLoading, setFormLoading] = useState(false);
    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        if (user?.identity_id) {
            fetchProfil();
        }
    }, [user?.identity_id]);

    const fetchProfil = async () => {
        try {
            setLoading(true);
            const response = await ProfilService.getDetailPetugas(user?.identity_id!);
            setProfil(response.data);
        } catch (err) {
            console.error("Failed to fetch profil:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatRole = (role: string) => {
        if (role === "superadmin") return "Super Admin";
        return role.replace("admin_", "Admin ").toUpperCase();
    };

    const openEditModal = () => {
        if (!profil) return;
        setEditNama(profil.nama);
        setEditWhatsapp(profil.no_whatsapp || "");
        setEditPhotoFile(null);
        setEditPhotoPreview("");
        setEditError("");
        setShowEditModal(true);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setEditPhotoFile(file);
        setEditPhotoPreview(URL.createObjectURL(file));
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditError("");
        setEditLoading(true);
        try {
            const formData = new FormData();
            if (editNama !== profil?.nama) formData.append("nama", editNama);
            if (editWhatsapp !== profil?.no_whatsapp) formData.append("no_whatsapp", editWhatsapp);
            if (editPhotoFile) formData.append("photo_profile", editPhotoFile);

            await ProfilService.updateProfil(user?.user_id!, formData);
            await fetchProfil();
            setShowEditModal(false);
        } catch (err: any) {
            setEditError(err.response?.data?.error || "Terjadi kesalahan, silakan coba lagi.");
        } finally {
            setEditLoading(false);
        }
    };

    const toggleSetting = (type: SettingType) => {
        if (expandedSetting === type) {
            setExpandedSetting(null);
        } else {
            setExpandedSetting(type);
        }
        setFormValue("");
        setFormValueConfirm("");
        setFormOldPassword("");
        setFormError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        setFormLoading(true);

        try {
            if (expandedSetting === "password") {
                if (!formOldPassword) { setFormError("Password lama wajib diisi."); return; }
                if (!formValue || formValue.length < 8) { setFormError("Password baru minimal 8 karakter."); return; }
                if (formValue !== formValueConfirm) { setFormError("Konfirmasi password tidak cocok."); return; }
                await AuthService.changePassword({
                    password_lama: formOldPassword,
                    password_baru: formValue,
                    konfirmasi_password_baru: formValueConfirm,
                });
                setPopupNotif({ message: "Password berhasil diperbarui.", type: "success" });
                toggleSetting(null);
            }
        } catch (err: any) {
            const msg = err.response?.data?.error || "Terjadi kesalahan, silakan coba lagi.";
            setFormError(msg);
        } finally {
            setFormLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="profil-page">
                <div className="profil-card">
                    <div className="profil-card-content">
                        <div className="profil-photo-section">
                            <div className="profil-skeleton profil-skeleton-photo"></div>
                        </div>
                        <div className="profil-info">
                            <div className="profil-skeleton profil-skeleton-text long" style={{ marginBottom: 10 }}></div>
                            <div className="profil-skeleton profil-skeleton-text short" style={{ marginBottom: 24 }}></div>
                            <div className="profil-skeleton profil-skeleton-text long" style={{ marginBottom: 10 }}></div>
                            <div className="profil-skeleton profil-skeleton-text" style={{ marginBottom: 10 }}></div>
                            <div className="profil-skeleton profil-skeleton-text short"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!profil) {
        return (
            <div className="profil-page">
                <div className="profil-card" style={{ textAlign: "center", padding: "60px 36px" }}>
                    <FaUser style={{ fontSize: 40, color: "#7a9e8a", marginBottom: 12 }} />
                    <p style={{ color: "#7a9e8a", fontFamily: "'Poppins', sans-serif", fontSize: 14 }}>
                        Gagal memuat data profil.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
        <div className="profil-page">
            {/* ── Section 1: Profile Card ── */}
            <div>
                <br />
                <h2 className="profil-section-title">
                    Profil Saya
                </h2>
                <div className="profil-card">
                    <button
                        className="profil-edit-btn"
                        title="Edit Profil"
                        onClick={openEditModal}
                    >
                        <FaPen />
                    </button>

                    {/* Baris 1 — Identitas */}
                    <div className="profil-identity">
                        <div
                            className="profil-avatar"
                            style={profil.photo_url ? { cursor: "zoom-in" } : undefined}
                            onClick={() => profil.photo_url && setShowPhoto(true)}
                        >
                            <img src={profil.photo_url || profileDefault} alt={profil.nama} />
                        </div>
                        <div className="profil-identity-info">
                            <h1 className="profil-name">{profil.nama}</h1>
                            <div className="profil-identity-meta">
                                <span className="profil-id-chip">
                                    <FaIdCard /> {profil.petugas_id}
                                </span>
                                <span className={`profil-status-badge status-${profil.status_petugas}`}>
                                    <span className="profil-status-dot" />
                                    {profil.status_petugas === "aktif" ? "Aktif" : "Non-aktif"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Baris 2 — Detail Info */}
                    <div className="profil-detail-section">
                        <div className="profil-info-grid">
                            <div className="profil-info-row">
                                <div className="profil-info-icon"><FaEnvelope /></div>
                                <div className="profil-info-text">
                                    <span className="profil-info-label">Email</span>
                                    <span className="profil-info-value">{profil.email}</span>
                                </div>
                            </div>
                            <div className="profil-info-row">
                                <div className="profil-info-icon"><FaShieldHalved /></div>
                                <div className="profil-info-text">
                                    <span className="profil-info-label">Role</span>
                                    <span className="profil-info-value">{formatRole(profil.role_petugas)}</span>
                                </div>
                            </div>
                            <div className="profil-info-row">
                                <div className="profil-info-icon"><FaWhatsapp /></div>
                                <div className="profil-info-text">
                                    <span className="profil-info-label">No. WhatsApp</span>
                                    <span className="profil-info-value">{profil.no_whatsapp || "-"}</span>
                                </div>
                            </div>
                            <div className="profil-info-row">
                                <div className="profil-info-icon"><FaBuilding /></div>
                                <div className="profil-info-text">
                                    <span className="profil-info-label">
                                        {user?.role === "superadmin" ? "Instansi Penugasan" : "Bank Penugasan"}
                                    </span>
                                    <span className="profil-info-value">
                                        {user?.role === "superadmin"
                                            ? "Dinas Lingkungan Hidup Kota Padang"
                                            : profil.nama_bank}
                                    </span>
                                </div>
                            </div>
                            <div className="profil-info-row">
                                <div className="profil-info-icon"><FaFingerprint /></div>
                                <div className="profil-info-text">
                                    <span className="profil-info-label">NIK</span>
                                    <span className="profil-info-value">{profil.user_id}</span>
                                </div>
                            </div>
                            <div className="profil-info-row">
                                <div className="profil-info-icon"><FaCalendarDays /></div>
                                <div className="profil-info-text">
                                    <span className="profil-info-label">Bergabung Sejak</span>
                                    <span className="profil-info-value">{formatTanggalPanjang(profil.joined_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Nasabah Info Banner ── */}
            {profil.is_nasabah && (
                <div className="profil-nasabah-banner">
                    <div className="profil-nasabah-icon">
                        <FaCircleInfo />
                    </div>
                    <p className="profil-nasabah-text">
                        Akun ini juga terdaftar sebagai nasabah di{" "}
                        <strong>{profil.nama_bank_nasabah}</strong> dengan ID{" "}
                        <strong>{profil.nasabah_id}</strong>.
                    </p>
                </div>
            )}

            {/* ── Section 2: Settings ── */}
            <div>
                <h2 className="profil-section-title">
                    Pengaturan Akun
                </h2>
                <div className="profil-settings-card">
                    <div className="profil-settings-list">
                        {/* Ubah Password */}
                        <div className={`profil-settings-block${expandedSetting === "password" ? " expanded" : ""}`}>
                            <div className="profil-settings-item" onClick={() => toggleSetting("password")}>
                                <div className="profil-settings-left">
                                    <div className="profil-settings-icon icon-password">
                                        <FaLock />
                                    </div>
                                    <div className="profil-settings-text">
                                        <span className="profil-settings-title">Ubah Password</span>
                                        <span className="profil-settings-desc">••••••••</span>
                                    </div>
                                </div>
                                <FaChevronDown className={`profil-settings-chevron${expandedSetting === "password" ? " rotated" : ""}`} />
                            </div>
                            {expandedSetting === "password" && (
                                <form className="profil-dropdown-form" onSubmit={handleSubmit}>
                                    {formError && <div className="profil-form-error">{formError}</div>}
                                    <div className="profil-form-field">
                                        <label className="profil-form-label">Password Lama</label>
                                        <input
                                            className="profil-form-input"
                                            type="password"
                                            placeholder="Masukkan password lama"
                                            value={formOldPassword}
                                            onChange={(e) => setFormOldPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="profil-form-field">
                                        <label className="profil-form-label">Password Baru</label>
                                        <input
                                            className="profil-form-input"
                                            type="password"
                                            placeholder="Minimal 8 karakter"
                                            value={formValue}
                                            onChange={(e) => setFormValue(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="profil-form-field">
                                        <label className="profil-form-label">Konfirmasi Password Baru</label>
                                        <input
                                            className="profil-form-input"
                                            type="password"
                                            placeholder="Ulangi password baru"
                                            value={formValueConfirm}
                                            onChange={(e) => setFormValueConfirm(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="profil-form-actions">
                                        <Button type="button" color="secondary" isRounded variant="ghost" size="small" onClick={() => toggleSetting(null)}>
                                            Batal
                                        </Button>
                                        <Button type="submit" color="neon" isRounded variant="solid" size="small" disabled={formLoading}>
                                            {formLoading ? "Menyimpan..." : "Simpan"}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

            {popupNotif && (
                <PopupNotifikasi
                    message={popupNotif.message}
                    type={popupNotif.type}
                    onClose={() => setPopupNotif(null)}
                />
            )}

            {showPhoto && profil.photo_url && (
                <ViewPhoto
                    src={profil.photo_url}
                    alt={profil.nama}
                    onClose={() => setShowPhoto(false)}
                />
            )}

            {/* ── Modal Edit Profil ── */}
            {showEditModal && (
                <div className="profil-modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="profil-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="profil-modal-header">
                            <h2 className="profil-modal-title">Edit Profil</h2>
                            <CloseButton onClick={() => setShowEditModal(false)} />
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="profil-modal-body">
                                {/* Avatar uploader */}
                                <div className="profil-edit-avatar-section">
                                    <div
                                        className="profil-edit-avatar"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <img
                                            src={editPhotoPreview || profil.photo_url || profileDefault}
                                            alt="foto"
                                        />
                                        <div className="profil-edit-avatar-overlay">
                                            <FaCamera />
                                            <span>Ganti Foto</span>
                                        </div>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        hidden
                                    />
                                </div>

                                {/* Nama */}
                                <div className="profil-form-field">
                                    <label className="profil-form-label">Nama</label>
                                    <input
                                        className="profil-form-input"
                                        type="text"
                                        placeholder="Masukkan nama lengkap"
                                        value={editNama}
                                        onChange={(e) => setEditNama(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* WhatsApp */}
                                <div className="profil-form-field">
                                    <label className="profil-form-label">No. WhatsApp</label>
                                    <input
                                        className="profil-form-input"
                                        type="tel"
                                        placeholder="Contoh: 08123456789"
                                        value={editWhatsapp}
                                        onChange={(e) => setEditWhatsapp(e.target.value)}
                                    />
                                </div>

                                {editError && <div className="profil-form-error">{editError}</div>}

                                {profil.is_nasabah && (
                                    <div className="profil-edit-notice">
                                        <FaCircleInfo />
                                        <span>Jika Anda mengedit profil admin, maka profil nasabah anda juga akan diperbarui.</span>
                                    </div>
                                )}
                            </div>

                            <div className="profil-modal-footer">
                                <Button type="button" color="secondary" isRounded variant="ghost" size="small"
                                    onClick={() => setShowEditModal(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" color="neon" isRounded variant="solid" size="small"
                                    disabled={editLoading}>
                                    {editLoading ? "Menyimpan..." : "Simpan"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}