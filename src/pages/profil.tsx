import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import {
    FaUser,
    FaEnvelope,
    FaWhatsapp,
    FaLock,
    FaIdCard,
    FaShieldHalved,
    FaCamera,
    FaFingerprint,
    FaChevronDown,
    FaGear,
} from "react-icons/fa6";
import Button from "../components/button";
import "../styles/profil.css";

interface ProfilData {
    Nama: string;
    Email: string;
    NoWhatsapp: string;
    PhotoURL: string;
    AdminID: string;
    Role: string;
    StatusAdmin: string;
}

type SettingType = "email" | "whatsapp" | "password" | null;

export default function ProfilPage() {
    const { user } = useAuth();
    const [profil, setProfil] = useState<ProfilData | null>(null);
    const [loading, setLoading] = useState(true);

    // Dropdown form states
    const [expandedSetting, setExpandedSetting] = useState<SettingType>(null);
    const [formValue, setFormValue] = useState("");
    const [formValueConfirm, setFormValueConfirm] = useState("");
    const [formOldPassword, setFormOldPassword] = useState("");
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        if (user?.user_id) {
            fetchProfil();
        }
    }, [user?.user_id]);

    const fetchProfil = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/profil/${user?.user_id}`);
            setProfil(response.data.data);
        } catch (err) {
            console.error("Failed to fetch profil:", err);
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (nama: string) => {
        return nama
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const formatRole = (role: string) => {
        if (role === "superadmin") return "Super Admin";
        return role.replace("admin_", "Admin ").toUpperCase();
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
        setFormSuccess("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        setFormSuccess("");
        setFormLoading(true);

        try {
            if (expandedSetting === "email") {
                if (!formValue) { setFormError("Email baru wajib diisi."); return; }
                await api.patch(`/profil/${user?.user_id}/email`, { email: formValue });
                setFormSuccess("Email berhasil diperbarui.");
            } else if (expandedSetting === "whatsapp") {
                if (!formValue) { setFormError("Nomor WhatsApp baru wajib diisi."); return; }
                await api.patch(`/profil/${user?.user_id}/whatsapp`, { no_whatsapp: formValue });
                setFormSuccess("Nomor WhatsApp berhasil diperbarui.");
            } else if (expandedSetting === "password") {
                if (!formOldPassword) { setFormError("Password lama wajib diisi."); return; }
                if (!formValue || formValue.length < 8) { setFormError("Password baru minimal 8 karakter."); return; }
                if (formValue !== formValueConfirm) { setFormError("Konfirmasi password tidak cocok."); return; }
                await api.patch(`/profil/${user?.user_id}/password`, {
                    old_password: formOldPassword,
                    new_password: formValue,
                });
                setFormSuccess("Password berhasil diperbarui.");
            }

            fetchProfil();
            setTimeout(() => toggleSetting(null), 1500);
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
        <div className="profil-page">
            {/* ── Section 1: Profile Card ── */}
            <div>
                <h2 className="profil-section-title">
                    <FaUser /> Profil Saya
                </h2>
                <div className="profil-card">
                    <div className="profil-card-content">
                        {/* Photo */}
                        <div className="profil-photo-section">
                            <div className="profil-photo-wrapper">
                                <div className="profil-photo">
                                    {profil.PhotoURL ? (
                                        <img src={profil.PhotoURL} alt={profil.Nama} />
                                    ) : (
                                        <div className="profil-photo-fallback">
                                            {getInitials(profil.Nama)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button className="profil-photo-toggle">
                                <FaCamera /> Ubah Foto
                            </button>
                        </div>

                        {/* Info */}
                        <div className="profil-info">
                            <h1 className="profil-name">{profil.Nama}</h1>
                            <div className="profil-role-badge">
                                <FaShieldHalved /> {formatRole(profil.Role)}
                            </div>

                            <div className="profil-detail-grid">
                                <div className="profil-detail-item">
                                    <span className="profil-detail-label">Admin ID</span>
                                    <span className="profil-detail-value">
                                        <FaIdCard /> {profil.AdminID}
                                    </span>
                                </div>
                                <div className="profil-detail-item">
                                    <span className="profil-detail-label">NIK (User ID)</span>
                                    <span className="profil-detail-value">
                                        <FaFingerprint /> {user?.user_id}
                                    </span>
                                </div>
                                <div className="profil-detail-item">
                                    <span className="profil-detail-label">Email</span>
                                    <span className="profil-detail-value">
                                        <FaEnvelope /> {profil.Email}
                                    </span>
                                </div>
                                <div className="profil-detail-item">
                                    <span className="profil-detail-label">Nomor WhatsApp</span>
                                    <span className="profil-detail-value">
                                        <FaWhatsapp /> {profil.NoWhatsapp || "-"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Section 2: Settings ── */}
            <div>
                <h2 className="profil-section-title">
                    <FaGear /> Pengaturan Akun
                </h2>
                <div className="profil-settings-card">
                    <div className="profil-settings-list">
                        {/* Ubah Email */}
                        <div className={`profil-settings-block${expandedSetting === "email" ? " expanded" : ""}`}>
                            <div className="profil-settings-item" onClick={() => toggleSetting("email")}>
                                <div className="profil-settings-left">
                                    <div className="profil-settings-icon icon-email">
                                        <FaEnvelope />
                                    </div>
                                    <div className="profil-settings-text">
                                        <span className="profil-settings-title">Ubah Email</span>
                                        <span className="profil-settings-desc">{profil.Email}</span>
                                    </div>
                                </div>
                                <FaChevronDown className={`profil-settings-chevron${expandedSetting === "email" ? " rotated" : ""}`} />
                            </div>
                            {expandedSetting === "email" && (
                                <form className="profil-dropdown-form" onSubmit={handleSubmit}>
                                    {formError && <div className="profil-form-error">{formError}</div>}
                                    {formSuccess && <div className="profil-form-success">{formSuccess}</div>}
                                    <div className="profil-form-field">
                                        <label className="profil-form-label">Email Baru</label>
                                        <input
                                            className="profil-form-input"
                                            type="email"
                                            placeholder="Masukkan email baru"
                                            value={formValue}
                                            onChange={(e) => setFormValue(e.target.value)}
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

                        {/* Ubah Nomor WhatsApp */}
                        <div className={`profil-settings-block${expandedSetting === "whatsapp" ? " expanded" : ""}`}>
                            <div className="profil-settings-item" onClick={() => toggleSetting("whatsapp")}>
                                <div className="profil-settings-left">
                                    <div className="profil-settings-icon icon-whatsapp">
                                        <FaWhatsapp />
                                    </div>
                                    <div className="profil-settings-text">
                                        <span className="profil-settings-title">Ubah Nomor WhatsApp</span>
                                        <span className="profil-settings-desc">{profil.NoWhatsapp || "Belum diatur"}</span>
                                    </div>
                                </div>
                                <FaChevronDown className={`profil-settings-chevron${expandedSetting === "whatsapp" ? " rotated" : ""}`} />
                            </div>
                            {expandedSetting === "whatsapp" && (
                                <form className="profil-dropdown-form" onSubmit={handleSubmit}>
                                    {formError && <div className="profil-form-error">{formError}</div>}
                                    {formSuccess && <div className="profil-form-success">{formSuccess}</div>}
                                    <div className="profil-form-field">
                                        <label className="profil-form-label">Nomor WhatsApp Baru</label>
                                        <input
                                            className="profil-form-input"
                                            type="tel"
                                            placeholder="Contoh: 08123456789"
                                            value={formValue}
                                            onChange={(e) => setFormValue(e.target.value)}
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
                                    {formSuccess && <div className="profil-form-success">{formSuccess}</div>}
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
    );
}