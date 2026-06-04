import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
    FaUser,
    FaEnvelope,
    FaWhatsapp,
    FaFingerprint,
    FaCalendarDays,
    FaBuilding,
    FaCreditCard,
    FaGear,
    FaTrash,
} from "react-icons/fa6";
import BreadcrumbLayout from "../layouts/breadcrumb";
import ViewPhoto from "../components/view-photo";
import PopupMenu from "../components/popup-menu";
import PopupConfirmation from "../layouts/popup-confirmation";
import { PopupNotifikasi } from "../layouts/popup-notifikasi";
import { UsersService } from "../services/users.service";
import { formatTanggalPanjang } from "../utils/date.utils";
import { getApiError } from "../utils/error.utils";
import "../styles/profil.css";
import "../styles/table.css";

type DetailUser = Awaited<ReturnType<typeof UsersService.getDetailUser>>["data"];

const STATUS_CONF: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    aktif:    { label: "Aktif",    color: "#4EA771", bg: "rgba(78,167,113,0.10)", dot: "#4EA771" },
    nonaktif: { label: "Nonaktif", color: "#b04040", bg: "rgba(220,80,80,0.10)",  dot: "#dc5050" },
    pending:  { label: "Pending",  color: "#8a6200", bg: "rgba(215,160,30,0.12)", dot: "#d7a01e" },
};

function StatusBadge({ status }: { status: string }) {
    const conf = STATUS_CONF[status] ?? STATUS_CONF.nonaktif;
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            padding: "2px 10px", borderRadius: "999px",
            fontSize: "11px", fontWeight: 600, fontFamily: "var(--ff-sans)",
            color: conf.color, background: conf.bg,
        }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: conf.dot, flexShrink: 0 }} />
            {conf.label}
        </span>
    );
}

export default function ProfilUserPage() {
    const { user_id } = useParams<{ user_id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const navRoles: string[] = location.state?.roles ?? [];

    const [detail, setDetail] = useState<DetailUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPhoto, setShowPhoto] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [notif, setNotif] = useState<{ message: string; type: "success" | "error" | "warning" | "info" } | null>(null);

    useEffect(() => {
        if (!user_id) return;
        setLoading(true);
        UsersService.getDetailUser(user_id)
            .then(res => setDetail(res.data))
            .catch(err => console.error("Gagal memuat detail user:", err))
            .finally(() => setLoading(false));
    }, [user_id]);

    if (loading) {
        return (
            <div className="profil-page margin-atas">
                <div className="profil-card">
                    <div className="profil-identity">
                        <div className="profil-skeleton profil-skeleton-photo" />
                        <div className="profil-identity-info" style={{ flex: 1 }}>
                            <div className="profil-skeleton profil-skeleton-text long" style={{ marginBottom: 8 }} />
                            <div className="profil-skeleton profil-skeleton-text short" />
                        </div>
                    </div>
                    <div className="profil-detail-section">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="profil-skeleton profil-skeleton-text" style={{ marginBottom: 10 }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!detail) {
        return (
            <div className="profil-page">
                <div className="profil-card" style={{ textAlign: "center", padding: "60px 36px" }}>
                    <FaUser style={{ fontSize: 40, color: "#7a9e8a", marginBottom: 12 }} />
                    <p style={{ color: "#7a9e8a", fontFamily: "'Poppins', sans-serif", fontSize: 14 }}>
                        Pengguna tidak ditemukan.
                    </p>
                </div>
            </div>
        );
    }

    const initials = detail.nama.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
    const isBelumTerdaftar = navRoles.includes("Belum Terdaftar") || (!detail.akun_nasabah?.length && !detail.akun_admin?.length);

    const doDeleteUser = async () => {
        if (!user_id) return;
        setShowDeleteConfirm(false);
        try {
            await UsersService.deleteUser(user_id);
            setNotif({ message: "Pengguna berhasil dihapus.", type: "success" });
            setTimeout(() => navigate(-1), 1500);
        } catch (err) {
            console.error("Gagal menghapus pengguna:", err);
            setNotif({ message: getApiError(err, "Gagal menghapus pengguna. Silakan coba lagi."), type: "error" });
        }
    };

    const INFO_ITEMS = [
        { icon: <FaFingerprint />, label: "NIK / User ID",     value: detail.user_id },
        { icon: <FaEnvelope />,    label: "Email",              value: detail.email || "-" },
        { icon: <FaWhatsapp />,    label: "No. WhatsApp",       value: detail.no_whatsapp || "-" },
        { icon: <FaCalendarDays />,label: "Terdaftar Sejak",    value: detail.created_at ? formatTanggalPanjang(detail.created_at) : "-" },
    ];

    return (
        <>
            <BreadcrumbLayout
                items={[
                    { label: "Pengguna", path: "/superadmin/nasabah" },
                    { label: detail.nama },
                ]}
            />
            <br />

            <div className="profil-page">

                {notif && (
                    <PopupNotifikasi
                        message={notif.message}
                        type={notif.type}
                        onClose={() => setNotif(null)}
                    />
                )}
                <PopupConfirmation
                    isOpen={showDeleteConfirm}
                    type="danger"
                    title="Hapus Pengguna?"
                    message={`Apakah Anda yakin ingin menghapus akun "${detail.nama}"? Tindakan ini tidak dapat dibatalkan.`}
                    confirmText="Ya, Hapus"
                    onConfirm={doDeleteUser}
                    onCancel={() => setShowDeleteConfirm(false)}
                />

                {/* ── Profil Card ───────────────────────────────── */}
                <div className="profil-card" style={{ position: "relative" }}>
                    {isBelumTerdaftar && (
                        <div style={{ position: "absolute", top: "24px", right: "28px", zIndex: 10 }}>
                            <PopupMenu
                                trigger={
                                    <button className="profil-settings-btn" title="Pengaturan" style={{ position: "static" }}>
                                        <FaGear />
                                    </button>
                                }
                                items={[
                                    {
                                        label: "Hapus Pengguna",
                                        icon: <FaTrash />,
                                        variant: "danger",
                                        onClick: () => setShowDeleteConfirm(true),
                                    },
                                ]}
                            />
                        </div>
                    )}
                    {/* Identity */}
                    <div className="profil-identity">
                        <div
                            className="profil-avatar"
                            style={detail.photo_url ? { cursor: "zoom-in" } : undefined}
                            onClick={() => detail.photo_url && setShowPhoto(true)}
                        >
                            {detail.photo_url
                                ? <img src={detail.photo_url} alt={detail.nama} />
                                : (
                                    <div style={{
                                        width: "100%", height: "100%",
                                        background: "linear-gradient(135deg,#013236,#06767d)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 28, fontWeight: 700, color: "#fff",
                                        fontFamily: "var(--ff-sans)",
                                    }}>
                                        {initials}
                                    </div>
                                )
                            }
                        </div>
                        <div className="profil-identity-info">
                            <h1 className="profil-name">{detail.nama}</h1>
                            <div className="profil-identity-meta">
                                <span className="profil-id-chip">
                                    <FaUser /> {detail.user_id}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Detail Info */}
                    <div className="profil-detail-section">
                        <div className="profil-info-grid">
                            {INFO_ITEMS.map(({ icon, label, value }) => (
                                <div className="profil-info-row" key={label}>
                                    <div className="profil-info-icon">{icon}</div>
                                    <div className="profil-info-text">
                                        <span className="profil-info-label">{label}</span>
                                        <span className="profil-info-value">{value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Akun Nasabah ─────────────────────────────── */}
                <div>
                    <p className="profil-section-title">
                        Akun Nasabah
                    </p>
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>ID Nasabah</th>
                                    <th>No. Rekening</th>
                                    <th>Bank Afiliasi</th>
                                    <th style={{ width: "110px" }}>Status</th>
                                    <th style={{ width: "160px" }}>Bergabung</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!detail.akun_nasabah?.length ? (
                                    <tr><td colSpan={5} className="table-empty">Tidak ada akun nasabah terdaftar.</td></tr>
                                ) : (
                                    (detail.akun_nasabah ?? []).map(akun => (
                                        <tr key={akun.nasabah_id}>
                                            <td><span className="table-id">{akun.nasabah_id}</span></td>
                                            <td style={{ fontWeight: 600 }}>{akun.nomor_rekening}</td>
                                            <td>
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--c-text-muted)", fontSize: 12 }}>
                                                    <FaBuilding style={{ fontSize: 11 }} />{akun.afiliasi}
                                                </span>
                                            </td>
                                            <td><StatusBadge status={akun.status} /></td>
                                            <td style={{ color: "var(--c-text-muted)" }}>
                                                {formatTanggalPanjang(akun.joined_at)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Akun Admin / Staff ────────────────────────── */}
                <div>
                    <p className="profil-section-title">
                        Akun Admin & Staff
                    </p>
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>ID Admin</th>
                                    <th>Role</th>
                                    <th>Instansi / Bank</th>
                                    <th style={{ width: "110px" }}>Status</th>
                                    <th style={{ width: "160px" }}>Bergabung</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!detail.akun_admin?.length ? (
                                    <tr><td colSpan={5} className="table-empty">Tidak ada akun admin atau staff terdaftar.</td></tr>
                                ) : (
                                    (detail.akun_admin ?? []).map(akun => (
                                        <tr key={akun.admin_id}>
                                            <td><span className="table-id">{akun.admin_id}</span></td>
                                            <td>
                                                <span style={{
                                                    display: "inline-flex", alignItems: "center", gap: 5,
                                                    padding: "2px 10px", borderRadius: "999px",
                                                    fontSize: 11, fontWeight: 600, fontFamily: "var(--ff-sans)",
                                                    background: "rgba(59,130,246,0.10)", color: "#1d4ed8",
                                                    border: "1px solid rgba(59,130,246,0.2)",
                                                }}>
                                                    <FaCreditCard style={{ fontSize: 9 }} />{akun.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--c-text-muted)", fontSize: 12 }}>
                                                    <FaBuilding style={{ fontSize: 11 }} />{akun.afiliasi}
                                                </span>
                                            </td>
                                            <td><StatusBadge status={akun.status} /></td>
                                            <td style={{ color: "var(--c-text-muted)" }}>
                                                {formatTanggalPanjang(akun.joined_at)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <br />
            </div>

            {showPhoto && detail.photo_url && (
                <ViewPhoto
                    src={detail.photo_url}
                    alt={detail.nama}
                    onClose={() => setShowPhoto(false)}
                />
            )}
        </>
    );
}
