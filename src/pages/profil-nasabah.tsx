import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { ProfilService } from "../services/profil.service";
import { AuthService } from "../services/auth.service";
import type { ProfilNasabah } from "../types/profil.type";
import type { ReactivateNasabahResponse } from "../types/auth.type";
import BreadcrumbLayout from "../layouts/breadcrumb";
import {
    FaUser,
    FaIdCard,
    FaEnvelope,
    FaWhatsapp,
    FaCreditCard,
    FaBuilding,
    FaGear,
    FaEye,
    FaEyeSlash,
    FaStar,
    FaCalendarDays,
    FaToggleOff,
} from "react-icons/fa6";
import PopupAktivasiResult from "../layouts/popup-aktivasi-result";
import "../styles/layout.css";
import "../styles/profil-nasabah.css";
import PopupMenu from "../components/popup-menu";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import { useAuth } from "../contexts/AuthContext";

type StatusNasabah = "aktif" | "nonaktif" | "pending";

const STATUS_CONFIG: Record<StatusNasabah, { label: string; color: string; bg: string; dot: string }> = {
    aktif:    { label: "Aktif",    color: "#2e7d52", bg: "rgba(78,167,113,0.10)", dot: "#4EA771" },
    nonaktif: { label: "Nonaktif", color: "#b04040", bg: "rgba(220,80,80,0.10)",  dot: "#dc5050" },
    pending:  { label: "Pending",  color: "#8a6200", bg: "rgba(215,160,30,0.12)", dot: "#d7a01e" },
};

const INFO_ITEMS = [
    { icon: <FaIdCard />,       label: "NIK" },
    { icon: <FaEnvelope />,     label: "Email" },
    { icon: <FaWhatsapp />,     label: "No. WhatsApp" },
    { icon: <FaCreditCard />,   label: "No. Rekening" },
    { icon: <FaBuilding />,     label: "Bank Sampah" },
    { icon: <FaUser />,         label: "Bank Induk" },
    { icon: <FaCalendarDays />, label: "Bergabung Sejak" },
] as const;

function formatTanggal(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function ProfilNasabahPage() {
    const { id } = useParams<{ id: string }>();
    // const navigate = useNavigate();
    const { user } = useAuth();
    const isAdminBsi = user?.role === "admin_bsi";
    const isAdminBsu = user?.role === "admin_bsu";
    
    const [nasabah, setNasabah] = useState<ProfilNasabah | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSaldo, setShowSaldo] = useState(false);

    // Reactivation modal states
    const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
    const [reactivateData, setReactivateData] = useState<ReactivateNasabahResponse["data"] | null>(null);

    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);

    useEffect(() => {
        if (id) {
            ProfilService.getProfilNasabah(id)
                .then(res => setNasabah(res.data))
                .catch(err => console.error("Gagal menarik data nasabah", err))
                .finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#5a7a68" }}>Memuat profil nasabah...</div>;
    if (!nasabah) return <div style={{ padding: "40px", textAlign: "center", color: "#b04040" }}>Nasabah tidak ditemukan.</div>;

    const handleToggleAktivasi = async () => {
        if (!nasabah || !id) return;
        
        const isCurrentlyActive = nasabah.status_nasabah === "aktif";

        try {
            if (isCurrentlyActive) {
                // Logic: Nonaktifkan (Deactivate)
                await AuthService.deactivateAkun(nasabah.user_id, "nasabah");
                setNasabah(prev => prev ? { ...prev, status_nasabah: "nonaktif" } : null);
                setPopupNotif({ message: "Akun nasabah berhasil dinonaktifkan", type: "success" });
            } else {
                // Logic: Generate Aktivasi (Reactivate)
                if (!user?.identity_id) {
                    setPopupNotif({ message: "Data admin tidak ditemukan. Silakan login kembali.", type: "warning" });
                    return;
                }
                
                const res = await AuthService.generateReactivateAkun(nasabah.user_id, user.identity_id, "nasabah");
                setReactivateData(res.data);
                setIsReactivateModalOpen(true);
                
                // Update status locally to pending since a new token was generated
                setNasabah(prev => prev ? { ...prev, status_nasabah: "pending" } : null);
            }
        } catch (error) {
            console.error("Gagal mengubah status nasabah:", error);
            setPopupNotif({ message: "Terjadi kesalahan saat memproses status nasabah", type: "error" });
        }
    };

    // const handleHapusNasabah = async () => {
    //     if (!id) return;
        
    //     const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus akun nasabah ini? Tindakan ini tidak dapat dibatalkan.");
    //     if (!confirmDelete) return;

    //     try {
    //         await ProfilService.hapusNasabah(id);
    //         window.alert("Akun nasabah berhasil dihapus.");
    //         navigate(isAdminBsi ? "/bsi/nasabah" : "/superadmin/nasabah");
    //     } catch (error) {
    //         console.error("Gagal menghapus nasabah:", error);
    //         window.alert("Terjadi kesalahan saat menghapus akun nasabah.");
    //     }
    // };

    const statusConf = STATUS_CONFIG[(nasabah.status_nasabah as StatusNasabah) || "aktif"];
    const initials = nasabah.nama.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

    const infoValues: Record<string, string> = {
        "NIK": nasabah.user_id,
        "Email": nasabah.email || "-",
        "No. WhatsApp": nasabah.no_whatsapp || "-",
        "No. Rekening": nasabah.nasabah_id,
        "Bank Sampah": nasabah.nama_bsu || nasabah.nama_bsi || "-",
        "Bank Induk": nasabah.nama_bsi || "-",
        "Bergabung Sejak": nasabah.joined_at ? formatTanggal(nasabah.joined_at) : "-",
    };

    return (
        <>
            <BreadcrumbLayout
                items={[
                    { label: "Nasabah", path: isAdminBsu ? "/bsu/nasabah" : isAdminBsi ? "/bsi/nasabah" : "/superadmin/nasabah" },
                    { label: nasabah.nama },
                ]}
            />
            <br />

            <div className="pn-card">
                {/* Settings button — absolute top-right */}
                <div style={{ position: "absolute", top: "24px", right: "28px", zIndex: 10 }}>
                <PopupMenu
                    trigger={
                        <button className="pn-settings-btn" title="Pengaturan" style={{ position: "static" }}>
                            <FaGear />
                        </button>
                    }
                    items={[
                        {
                            label: nasabah.status_nasabah === "aktif" ? "Nonaktifkan Akun Nasabah" : "Generate Aktivasi Nasabah",
                            icon: <FaToggleOff />,
                            onClick: handleToggleAktivasi,
                        },
                        // {
                        //     label: "Hapus Akun Nasabah",
                        //     icon: <FaTrashCan />,
                        //     variant: "danger",
                        //     onClick: handleHapusNasabah,
                        // },
                    ]}
                />
                </div>

                {/* ── Section 1 & 2: Top Grid ── */}
                <div className="pn-top-grid">
                    {/* ── Identity ── */}
                    <div className="pn-identity">
                        <div className="pn-avatar">
                            {nasabah.foto
                                ? <img src={nasabah.foto} alt={nasabah.nama} />
                                : <div className="pn-avatar-fallback">{initials}</div>
                            }
                        </div>
                        <div className="pn-identity-info">
                            <h1 className="pn-name">{nasabah.nama}</h1>
                            <div className="pn-identity-meta">
                                <span className="pn-status-badge" style={{ color: statusConf.color, background: statusConf.bg }}>
                                    <span className="pn-status-dot" style={{ background: statusConf.dot }} />
                                    {statusConf.label}
                                </span>
                                <span className="pn-meta-sep">·</span>
                                <span className="pn-bank-tag">
                                    <FaBuilding />
                                    {nasabah.nama_bsu || nasabah.nama_bsi || "-"}
                                </span>
                            </div>
                            <span className="pn-rekening-chip">
                                <FaCreditCard />
                                {nasabah.nasabah_id}
                            </span>
                        </div>
                    </div>

                    {/* ── Saldo ── */}
                    <div className="pn-saldo-section">
                        <div className="pn-saldo-header">
                            <span className="pn-saldo-title">Ringkasan Saldo</span>
                            <button className="pn-saldo-toggle" onClick={() => setShowSaldo(v => !v)}>
                                {showSaldo ? <FaEyeSlash /> : <FaEye />}
                                {showSaldo ? "Sembunyikan" : "Tampilkan"}
                            </button>
                        </div>
                        <div className="pn-saldo-cards">
                            {/* Saldo Poin — green variant */}
                            <div className="pn-saldo-card pn-saldo-card--green pn-saldo-card--single">
                                <div className="pn-saldo-icon"><FaStar /></div>
                                <div className="pn-saldo-body">
                                    <span className="pn-saldo-number">
                                        {showSaldo ? nasabah.saldo_poin.toLocaleString("id-ID") : "••••••••"}
                                    </span>
                                    <span className="pn-saldo-status">Total Poin</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Section 3: Detail Info Grid ── */}
                <div className="pn-detail-section">
                    <span className="pn-detail-title">Informasi Nasabah</span>
                    <div className="pn-info-grid">
                        {INFO_ITEMS.map(({ icon, label }) => (
                            <div className="pn-info-row" key={label}>
                                <div className="pn-info-icon">{icon}</div>
                                <div className="pn-info-text">
                                    <span className="pn-info-label">{label}</span>
                                    <span className="pn-info-value">{infoValues[label]}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Reactivation Modal ── */}
            <PopupAktivasiResult
                isOpen={isReactivateModalOpen}
                onClose={() => setIsReactivateModalOpen(false)}
                data={reactivateData}
                description="Berikan informasi berikut kepada nasabah untuk proses aktivasi akun mereka."
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
