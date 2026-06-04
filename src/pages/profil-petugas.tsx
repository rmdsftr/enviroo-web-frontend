import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { api } from "../services/api";
import { AdminService } from "../services/admin.service";
import { AuthService } from "../services/auth.service";
import { useAuth } from "../contexts/AuthContext";
import type { ReactivateNasabahResponse } from "../types/auth.type";
import BreadcrumbLayout from "../layouts/breadcrumb";
import {
    FaUser,
    FaEnvelope,
    FaWhatsapp,
    FaIdCard,
    FaShieldHalved,
    FaBuilding,
    FaCalendarDays,
    FaFingerprint,
    FaGear,
    FaToggleOff,
    FaTrashCan,
    FaCircleInfo,
} from "react-icons/fa6";
import PopupMenu from "../components/popup-menu";
import PopupConfirmation from "../layouts/popup-confirmation";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import PopupAktivasiResult from "../layouts/popup-aktivasi-result";
import ViewPhoto from "../components/view-photo";
import { formatTanggalPanjang } from "../utils/date.utils";
import profileDefault from "../assets/profile.png";
import "../styles/profil.css";

interface ProfilPetugasData {
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

const formatRole = (role: string) => {
    if (role === "superadmin") return "Super Admin";
    return role
        .replace("admin_", "Admin ")
        .replace("petugas_", "Petugas ")
        .toUpperCase();
};

export default function ProfilPetugasPage() {
    const { admin_id } = useParams<{ admin_id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [profil, setProfil] = useState<ProfilPetugasData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPhoto, setShowPhoto] = useState(false);
    const [statusPetugas, setStatusPetugas] = useState<string>("");

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
    const [reactivateData, setReactivateData] = useState<ReactivateNasabahResponse["data"] | null>(null);
    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);

    useEffect(() => {
        if (!admin_id) return;
        setLoading(true);
        api.get(`/profil/detail-petugas/${admin_id}`)
            .then((res) => {
                setProfil(res.data.data);
                setStatusPetugas(res.data.data.status_petugas);
            })
            .catch((err) => console.error("Gagal menarik profil petugas:", err))
            .finally(() => setLoading(false));
    }, [admin_id]);

    const handleToggleAktivasi = async () => {
        if (!profil) return;
        const isActive = statusPetugas === "aktif";
        try {
            if (isActive) {
                await AuthService.deactivateAkun(profil.user_id, "admin");
                setStatusPetugas("nonaktif");
                setPopupNotif({ message: "Akun staff berhasil dinonaktifkan.", type: "success" });
            } else {
                if (!user?.identity_id) {
                    setPopupNotif({ message: "Data admin tidak ditemukan. Silakan login kembali.", type: "warning" });
                    return;
                }
                const res = await AuthService.generateReactivateAkun(profil.user_id, user.identity_id, "admin");
                setReactivateData(res.data);
                setIsReactivateModalOpen(true);
                setStatusPetugas("pending");
            }
        } catch {
            setPopupNotif({ message: "Terjadi kesalahan saat memproses status staff.", type: "error" });
        }
    };

    const handleDeleteAdmin = async () => {
        if (!admin_id || !user?.identity_id) return;
        setIsDeleteConfirmOpen(false);
        try {
            await AdminService.deleteAdmin(admin_id, user.identity_id);
            setPopupNotif({ message: "Staff berhasil dihapus.", type: "success" });
            setTimeout(() => navigate("/profil-bank"), 1500);
        } catch {
            setPopupNotif({ message: "Terjadi kesalahan saat menghapus staff.", type: "error" });
        }
    };

    const isSelf = admin_id === user?.identity_id;

    if (loading) {
        return (
            <div className="profil-page">
                <div className="profil-card">
                    <div className="profil-card-content">
                        <div className="profil-photo-section">
                            <div className="profil-skeleton profil-skeleton-photo" />
                        </div>
                        <div className="profil-info">
                            <div className="profil-skeleton profil-skeleton-text long" style={{ marginBottom: 10 }} />
                            <div className="profil-skeleton profil-skeleton-text short" style={{ marginBottom: 24 }} />
                            <div className="profil-skeleton profil-skeleton-text long" style={{ marginBottom: 10 }} />
                            <div className="profil-skeleton profil-skeleton-text" style={{ marginBottom: 10 }} />
                            <div className="profil-skeleton profil-skeleton-text short" />
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
            <BreadcrumbLayout
                items={[
                    { label: "Profil Bank", path: "/profil-bank" },
                    { label: profil.nama },
                ]}
            />
            <br />

            <div className="profil-page">
                <div>
                    <div className="profil-card">
                        {!isSelf && (
                            <div style={{ position: "absolute", top: "20px", right: "24px", zIndex: 10 }}>
                                <PopupMenu
                                    trigger={
                                        <button
                                            className="profil-edit-btn"
                                            title="Pengaturan"
                                            style={{ position: "static" }}
                                        >
                                            <FaGear />
                                        </button>
                                    }
                                    items={[
                                        {
                                            label: statusPetugas === "aktif"
                                                ? "Nonaktifkan Akun Staff"
                                                : "Generate Aktivasi Akun Staff",
                                            icon: <FaToggleOff />,
                                            onClick: handleToggleAktivasi,
                                        },
                                        {
                                            label: "Hapus Staff",
                                            icon: <FaTrashCan />,
                                            variant: "danger",
                                            onClick: () => setIsDeleteConfirmOpen(true),
                                        },
                                    ]}
                                />
                            </div>
                        )}

                        {/* Identitas */}
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
                                    <span className={`profil-status-badge status-${statusPetugas}`}>
                                        <span className="profil-status-dot" />
                                        {statusPetugas === "aktif"
                                            ? "Aktif"
                                            : statusPetugas === "nonaktif"
                                            ? "Non-aktif"
                                            : "Pending"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Detail Info */}
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
                                        <span className="profil-info-label">Bank Penugasan</span>
                                        <span className="profil-info-value">{profil.nama_bank}</span>
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
            </div>

            {showPhoto && profil.photo_url && (
                <ViewPhoto
                    src={profil.photo_url}
                    alt={profil.nama}
                    onClose={() => setShowPhoto(false)}
                />
            )}

            <PopupConfirmation
                isOpen={isDeleteConfirmOpen}
                type="danger"
                title="Hapus Staff"
                message="Apakah Anda yakin ingin menghapus staff ini? Tindakan ini tidak dapat dibatalkan."
                confirmText="Ya, Hapus"
                cancelText="Batal"
                onConfirm={handleDeleteAdmin}
                onCancel={() => setIsDeleteConfirmOpen(false)}
            />

            <PopupAktivasiResult
                isOpen={isReactivateModalOpen}
                onClose={() => setIsReactivateModalOpen(false)}
                data={reactivateData}
                description="Berikan informasi berikut kepada staff untuk proses aktivasi akun mereka."
            />

            {popupNotif && (
                <PopupNotifikasi
                    message={popupNotif.message}
                    type={popupNotif.type}
                    onClose={() => setPopupNotif(null)}
                />
            )}
        </>
    );
}
