import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { ProfilService } from "../services/profil.service";
import { NasabahService } from "../services/nasabah.service";
import { AdminService } from "../services/admin.service";
import { UsersService } from "../services/users.service";
import { BsuService } from "../services/bsu.service";
import type { NonAdminUser } from "../types/users.type";
import type { BankSampahProfile, HistoryAkunBank } from "../types/profil.type";
import type { NasabahBankSampah } from "../types/nasabah.type";
import type { AdminBankSampah } from "../types/admin.type";
import type { BSUByBankId } from "../types/bsu.type";
import type { ReactivateNasabahResponse } from "../types/auth.type";
import { AuthService } from "../services/auth.service";
import { JadwalService, type JadwalItem } from "../services/jadwal.service";
import BreadcrumbLayout from "../layouts/breadcrumb";
import PopupAktivasiResult from "../layouts/popup-aktivasi-result";
import {
    FaGear,
    FaLocationDot,
    FaBuilding,
    FaUsers,
    FaCircleCheck,
    FaCircleXmark,
    FaClock,
    FaUserPlus,
    FaLayerGroup,
    FaScaleBalanced,
    FaTruck,
    FaPenToSquare,
    FaToggleOff,
    FaTrashCan,
    FaUserShield,
} from "react-icons/fa6";
import "../styles/layout.css";
import "../styles/profil-bank.css";
import "../styles/nasabah.css";
import "../styles/regis-bsi.css";

import StatistikLayout from "../layouts/statistik";
import Table, {
    TableAvatar,
    TableBadge,
    type ColumnDef,
} from "../components/table";
import PopupMenu from "../components/popup-menu";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import Dropdown from "../components/dropdown";
import Input from "../components/input";
import Tabs from "../components/tabs";
import FilterPill from "../components/filter-pill";
import { useAuth } from "../contexts/AuthContext";
import PopupConfirmation from "../layouts/popup-confirmation";
import PopupInputKeterangan from "../layouts/popup-input-keterangan";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import { BankService } from "../services/bank.service";

// ── Helper: label & badge color ──
const JENIS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    BSI: { label: "Bank Sampah Induk", color: "#013236", bg: "rgba(1, 50, 54, 0.08)" },
    BSU: { label: "Bank Sampah Unit", color: "#06767d", bg: "rgba(6, 192, 201, 0.10)" },
    BSM: { label: "Bank Sampah Mandiri", color: "#9a6b0b", bg: "rgba(245, 166, 35, 0.10)" },
};

const HARI_DISPLAY: Record<string, string> = {
    senin: "Senin", selasa: "Selasa", rabu: "Rabu",
    kamis: "Kamis", jumat: "Jumat", sabtu: "Sabtu", minggu: "Minggu",
};
const MINGGU_LABEL = (n: number) => n === 0 ? "Setiap minggu" : `Minggu ke-${n}`;

const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const m = timeStr.match(/^(\d{2}:\d{2})(:\d{2})?(?:[+-]\d{2}:\d{2}|Z)?$/);
    if (m) return m[1];
    try {
        const d = new Date(timeStr);
        if (isNaN(d.getTime())) return timeStr;
        return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch { return timeStr; }
};

const formatDayOfMonth = (dateStr: string) => {
    if (!dateStr) return { day: "", month: "" };
    const date = new Date(dateStr);
    return {
        day: String(date.getDate()).padStart(2, "0"),
        month: date.toLocaleDateString("id-ID", { month: "short" })
    };
};

// ─────────────────────────────────────────────────────────
// ── Tipe & Mock Data BSU
// ─────────────────────────────────────────────────────────
const getBsuColumns = (): ColumnDef<BSUByBankId>[] => [
    {
        key: "foto",
        header: "Foto",
        width: "56px",
        align: "center",
        render: () => (
            <TableAvatar src={undefined} alt="BSU" />
        ),
    },
    {
        key: "nama",
        header: "Nama BSU",
        render: (row) => (
            <span className="table-name">{row.nama_bsu}</span>
        ),
    },
    {
        key: "nasabah",
        header: "Jumlah Nasabah",
        align: "center",
        width: "140px",
        render: (row) => (
            <span style={{ fontWeight: 600 }}>{row.jumlah_nasabah}</span>
        ),
    },
    {
        key: "status",
        header: "Status",
        width: "120px",
        render: (row) => (
            <TableBadge
                label={row.is_active ? "Aktif" : "Nonaktif"}
                active={row.is_active}
            />
        ),
    },
];

// ─────────────────────────────────────────────────────────

// ── Tipe & Mock Data Admin ────────────────────────────────
const getRoleLabel = (role: string) => {
    if (role.startsWith("admin_")) return "Admin";
    if (role.startsWith("petugas_")) return "Petugas";
    return role;
}

const getAdminColumns = (
    onDeleteAdmin: (adminId: string) => void,
    onToggleAktivasiAdmin: (userId: string, currentStatus: string) => void
): ColumnDef<AdminBankSampah>[] => [
    {
        key: "foto",
        header: "Foto",
        width: "56px",
        align: "center",
        render: (row) => <TableAvatar src={row.foto} alt={row.nama} />,
    },
    {
        key: "userId",
        header: "Admin ID",
        width: "160px",
        render: (row) => <span className="table-name">{row.user_id}</span>,
    },
    {
        key: "nama",
        header: "Nama Staff",
        render: (row) => <span style={{ fontWeight: 500 }}>{row.nama}</span>,
    },
    {
        key: "email",
        header: "Email",
        render: (row) => <span>{row.email}</span>,
    },
    {
        key: "role",
        header: "Role",
        width: "100px",
        render: (row) => <span style={{ textTransform: "capitalize", fontWeight: 500, color: "#3d5a48" }}>{getRoleLabel(row.role)}</span>,
    },
    {
        key: "status",
        header: "Status",
        width: "120px",
        render: (row) => {
            if (row.status_admin === "pending") {
                return (
                    <span className="table-badge table-badge--pending">
                        <span className="table-badge-dot" />
                        Pending
                    </span>
                );
            }
            return <TableBadge label={row.status_admin === "aktif" ? "Aktif" : "Nonaktif"} active={row.status_admin === "aktif"} />;
        },
    },
    {
        key: "aksi",
        header: "Aksi",
        width: "64px",
        align: "center",
        render: (row) => (
            <PopupMenu
                trigger={<button className="table-action-btn" type="button" title="Pengaturan"><FaGear /></button>}
                items={[
                    {
                        label: row.status_admin === "aktif" ? "Nonaktifkan Akun Staff" : "Generate Aktivasi Akun Staff",
                        icon: <FaToggleOff />,
                        onClick: () => onToggleAktivasiAdmin(row.user_id, row.status_admin),
                    },
                    {
                        label: "Hapus Staff",
                        icon: <FaTrashCan />,
                        variant: "danger",
                        onClick: () => onDeleteAdmin(row.admin_id),
                    },
                ]}
            />
        ),
    },
];

// ─────────────────────────────────────────────────────────

// ── Tipe & Mock Data Nasabah ──────────────────────────────
type StatusNasabah = "aktif" | "nonaktif" | "pending";

const statusLabel: Record<StatusNasabah, string> = {
    aktif: "Aktif",
    nonaktif: "Nonaktif",
    pending: "Pending",
};

function StatusBadge({ status }: { status: StatusNasabah }) {
    if (status === "pending") {
        return (
            <span className="table-badge table-badge--pending">
                <span className="table-badge-dot" />
                Pending
            </span>
        );
    }
    return (
        <TableBadge
            label={statusLabel[status]}
            active={status === "aktif"}
        />
    );
}

const getNasabahColumns = (): ColumnDef<NasabahBankSampah>[] => {
    const cols: ColumnDef<NasabahBankSampah>[] = [
        {
            key: "foto",
            header: "Foto",
            width: "56px",
            align: "center",
            render: (row) => <TableAvatar src={row.foto} alt={row.nama_nasabah} />,
        },
        {
            key: "nasabah_id",
            header: "ID Nasabah",
            width: "140px",
            render: (row) => <span className="table-name">{row.nasabah_id}</span>,
        },
        {
            key: "nama",
            header: "Nama Nasabah",
            render: (row) => <span className="table-name">{row.nama_nasabah}</span>,
        },
        {
            key: "status",
            header: "Status",
            width: "120px",
            render: (row) => <StatusBadge status={row.status_nasabah as StatusNasabah} />,
        },
    ];

    return cols;
};

export default function ProfilBankPage() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const {user} = useAuth();

    const [bankProfile, setBankProfile] = useState<BankSampahProfile | null>(null);
    const [nasabahList, setNasabahList] = useState<NasabahBankSampah[]>([]);
    const [adminList, setAdminList] = useState<AdminBankSampah[]>([]);
    const [staffFilter, setStaffFilter] = useState<string>("all");
    const [bsuList, setBsuList] = useState<BSUByBankId[]>([]);
    const [penimbanganJadwal, setPenimbanganJadwal] = useState<JadwalItem[]>([]);
    const [pengangkutanJadwal, setPengangkutanJadwal] = useState<JadwalItem[]>([]);

    // ── Tambah Admin Modal State ──
    const [showTambahAdminModal, setShowTambahAdminModal] = useState(false);
    const [nonAdminUsers, setNonAdminUsers] = useState<NonAdminUser[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [selectedRole, setSelectedRole] = useState<string>("");
    const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

    // ── Tambah Akun Baru (di dalam Modal Tambah Admin) ──
    const [isAddingNewUser, setIsAddingNewUser] = useState(false);
    const [newUserForm, setNewUserForm] = useState({ nik: "", nama: "", email: "", noWa: "" });

    const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
    const [reactivateData, setReactivateData] = useState<ReactivateNasabahResponse["data"] | null>(null);
    const [isActivationConfirmOpen, setIsActivationConfirmOpen] = useState(false);
    const [isInputKeteranganOpen, setIsInputKeteranganOpen] = useState(false);

    const [showNotifPopup, setShowNotifPopup] = useState(false);
    const [notifMessage, setNotifMessage] = useState("");
    const [notifType, setNotifType] = useState<"success" | "error" | "warning" | "info">("success");

    // ── Hapus Staff Confirmation ──
    const [isDeleteAdminOpen, setIsDeleteAdminOpen] = useState(false);
    const [pendingDeleteAdminId, setPendingDeleteAdminId] = useState<string | null>(null);

    // ── Riwayat Akun Bank ──
    const [historyList, setHistoryList] = useState<HistoryAkunBank[]>([]);

    const isBsuUrl = location.pathname.includes("/bsu/");
    const isBsmUrl = location.pathname.includes("/bsm/");
    const isBsiUrl = !isBsuUrl && !isBsmUrl;

    useEffect(() => {
        if (id) {
            ProfilService.getBankSampahProfile(id)
                .then(res => setBankProfile(res.data))
                .catch(err => console.error("Gagal menarik profil bank:", err));
                
            NasabahService.getNasabahByBankId(id)
                .then(res => setNasabahList(res.data))
                .catch(err => console.error("Gagal menarik daftar nasabah profil:", err));

            AdminService.getAdminByBankId(id)
                .then(res => setAdminList(res.data))
                .catch(err => console.error("Gagal menarik daftar admin profil:", err));

            if (isBsiUrl) {
                BsuService.getBsuByBankId(id)
                    .then(res => setBsuList(res.data))
                    .catch(err => console.error("Gagal menarik daftar bsu:", err));
            }

            ProfilService.getHistoryAkunBank(id)
                .then(res => setHistoryList(res.data || []))
                .catch(err => console.error("Gagal menarik riwayat akun bank:", err));

            JadwalService.getJadwalBank(id)
                .then(res => {
                    setPenimbanganJadwal(res.data.penimbangan || []);
                    setPengangkutanJadwal(res.data.pengangkutan || []);
                })
                .catch(err => console.error("Gagal menarik jadwal bank:", err));
        }
    }, [id, isBsiUrl]);

    // State for Tabs
    const [activeTab, setActiveTab] = useState(isBsiUrl ? "Bank Sampah Unit" : "Nasabah");

    // Fetch non-admin users when modal opens
    useEffect(() => {
        if (showTambahAdminModal && id) {
            UsersService.getNonAdminNonNasabahUsers(id)
                .then(res => setNonAdminUsers(res.data || []))
                .catch(err => console.error("Gagal memuat daftar user:", err));
        }
    }, [showTambahAdminModal, id]);

    // State for BSU
    const totalBsu = bsuList.length;
    const aktifBsu = bsuList.filter((b) => b.is_active).length;
    const nonaktifBsu = totalBsu - aktifBsu;

    // State for Nasabah
    const totalNasabah = nasabahList.length;
    const aktifNasabah = nasabahList.filter((n) => n.status_nasabah === "aktif").length;
    const nonaktifNasabah = nasabahList.filter((n) => n.status_nasabah === "nonaktif").length;
    const pendingNasabah = nasabahList.filter((n) => n.status_nasabah === "pending").length;

    // Filter Staff
    const filteredAdminList = useMemo(() => {
        if (staffFilter === "all") return adminList;
        return adminList.filter(admin => admin.role.startsWith(staffFilter));
    }, [adminList, staffFilter]);

    const isSuperadmin = user?.role === "superadmin";
    const isAdminBsi = user?.role === "admin_bsi";
    // const isAdminBsm = user?.role === "admin_bsm";
    // const isAdminBsu = user?.role === "admin_bsu";

    // Determine type from URL
    const isBsu = location.pathname.includes("/bsu/");
    const isBsm = location.pathname.includes("/bsm/");
    const bankTypeLabel = isBsu ? "Bank Sampah Unit" : isBsm ? "Bank Sampah Mandiri" : "Bank Sampah Induk";
    const bankTypeShort = isBsu ? "BSU" : isBsm ? "BSM" : "BSI";
    
    const backPath = isSuperadmin
        ? (isBsu ? "/superadmin/bank-sampah/bsu" : isBsm ? "/superadmin/bank-sampah/bsm" : "/superadmin/bank-sampah/bsi")
        : (isBsu ? "/bsi/bsu" : "/bsi");

    // Determine available roles based on bank type
    const getRoleOptions = () => {
        const isBsuUrl2 = location.pathname.includes("/bsu/");
        const isBsmUrl2 = location.pathname.includes("/bsm/");
        if (isBsuUrl2) return [
            { label: "Admin BSU", value: "admin_bsu" },
            { label: "Petugas BSU", value: "petugas_bsu" },
        ];
        if (isBsmUrl2) return [
            { label: "Admin BSM", value: "admin_bsm" },
            { label: "Petugas BSM", value: "petugas_bsm" },
        ];
        return [
            { label: "Admin BSI", value: "admin_bsi" },
            { label: "Petugas BSI", value: "petugas_bsi" },
        ];
    };

    const handleTambahAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId) {
            setNotifMessage("Pilih satu akun terlebih dahulu.");
            setNotifType("warning");
            setShowNotifPopup(true);
            return;
        }
        if (!selectedRole) {
            setNotifMessage("Pilih role terlebih dahulu.");
            setNotifType("warning");
            setShowNotifPopup(true);
            return;
        }
        if (!id) return;
        setIsSubmittingAdmin(true);
        try {
            await AdminService.addAdmin(id, selectedUserId, selectedRole, user?.identity_id || "");
            // Refresh admin list
            const res = await AdminService.getAdminByBankId(id);
            setAdminList(res.data);
            setShowTambahAdminModal(false);
            setSelectedUserId("");
            setSelectedRole("");
            setNotifMessage("Admin berhasil ditambahkan!");
            setNotifType("success");
            setShowNotifPopup(true);
        } catch (err) {
            console.error("Gagal menambahkan admin:", err);
            setNotifMessage("Gagal menambahkan admin. Silakan coba lagi.");
            setNotifType("error");
            setShowNotifPopup(true);
        } finally {
            setIsSubmittingAdmin(false);
        }
    };

    const handleSaveNewUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                user_id: newUserForm.nik,
                nama: newUserForm.nama,
                email: newUserForm.email,
                no_whatsapp: newUserForm.noWa,
            };
            
            await UsersService.createUsers(payload);
            console.log("Successfully saved new user:", payload);
            
            // Refresh table list
            if (id) {
                const res = await UsersService.getNonAdminNonNasabahUsers(id);
                setNonAdminUsers(res.data || []);
            }
            
            setIsAddingNewUser(false);
            setNewUserForm({ nik: "", nama: "", email: "", noWa: "" });
            setNotifMessage("Berhasil menambahkan akun baru!");
            setNotifType("success");
            setShowNotifPopup(true);
        } catch (error) {
            console.error("Gagal menambahkan akun:", error);
            setNotifMessage("Gagal menambahkan akun baru. Silakan coba lagi.");
            setNotifType("error");
            setShowNotifPopup(true);
        }
    };

    const handleDeleteAdmin = (adminId: string) => {
        setPendingDeleteAdminId(adminId);
        setIsDeleteAdminOpen(true);
    };

    const executeDeleteAdmin = async () => {
        if (!pendingDeleteAdminId) return;
        setIsDeleteAdminOpen(false);
        try {
            await AdminService.deleteAdmin(pendingDeleteAdminId, user?.identity_id || "");
            if (id) {
                const res = await AdminService.getAdminByBankId(id);
                setAdminList(res.data);
            }
            setNotifMessage("Staff berhasil dihapus.");
            setNotifType("success");
            setShowNotifPopup(true);
        } catch (error) {
            console.error("Gagal menghapus staff:", error);
            setNotifMessage("Terjadi kesalahan saat menghapus staff.");
            setNotifType("error");
            setShowNotifPopup(true);
        } finally {
            setPendingDeleteAdminId(null);
        }
    };

    const handleToggleAktivasiStaff = async (userId: string, currentStatus: string) => {
        if (!id) return;
        
        const isCurrentlyActive = currentStatus === "aktif";

        try {
            if (isCurrentlyActive) {
                // Logic: Nonaktifkan (Deactivate)
                await AuthService.deactivateAkun(userId, "admin");
                setAdminList(prev => prev.map(a => a.user_id === userId ? { ...a, status_admin: "nonaktif" as any } : a));
                window.alert("Akun staff berhasil dinonaktifkan");
            } else {
                // Logic: Generate Aktivasi (Reactivate)
                if (!user?.identity_id) {
                    window.alert("Data admin pengautentikasi tidak ditemukan. Silakan login kembali.");
                    return;
                }
                
                const res = await AuthService.generateReactivateAkun(userId, user.identity_id, "admin");
                setReactivateData(res.data);
                setIsReactivateModalOpen(true);
                
                // Update status locally to pending since a new token was generated
                setAdminList(prev => prev.map(a => a.user_id === userId ? { ...a, status_admin: "pending" as any } : a));
            }
        } catch (error) {
            console.error("Gagal memproses status staff:", error);
            window.alert("Terjadi kesalahan saat memproses status staff");
        }
    };

    // Get data 
    if (!bankProfile) {
        return <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Memuat profil...</div>;
    }

    const executeToggleAktivasi = async () => {
        if (!bankProfile || !id) return;
        try {
            await ProfilService.toggleAktivasiBank(id);
            const isNowActive = !bankProfile.is_active;
            setBankProfile(prev => prev ? { ...prev, is_active: isNowActive } : null);
            setNotifMessage(isNowActive ? "Bank sampah berhasil diaktifkan" : "Bank sampah berhasil dinonaktifkan");
            setNotifType("success");
            setShowNotifPopup(true);
        } catch (error) {
            console.error("Gagal mengubah status aktivasi bank:", error);
            setNotifMessage("Terjadi kesalahan saat mengubah status bank sampah");
            setNotifType("error");
            setShowNotifPopup(true);
        }
    };

    const handleToggleAktivasiBank = async () => {
        if (!bankProfile || !id) return;
        
        if (isSuperadmin) {
            // Superadmin bisa langsung eksekusi atau via popup (di sini kita langsungkan sesuai kode awal)
            executeToggleAktivasi();
        } else if (isAdminBsi) {
            // Admin BSI harus lewat konfirmasi popup
            setIsActivationConfirmOpen(true);
        }
    };

    const handleAktivasiBank = async (keterangan: string) => {
        if (!bankProfile || !id) return;
        try {
            await BankService.AktivasiBank(id, {
                admin_id: user?.identity_id || "",
                informasi: bankProfile.is_active ? "Bank sampah dinonaktifkan" : "Bank sampah diaktifkan",
                keterangan: keterangan,
            });
            const isNowActive = !bankProfile.is_active;
            setBankProfile(prev => prev ? { ...prev, is_active: isNowActive } : null);
            setIsInputKeteranganOpen(false); // Tutup modal keterangan setelah berhasil
            setNotifMessage(bankProfile.is_active ? "Bank sampah berhasil dinonaktifkan" : "Bank sampah berhasil diaktifkan");
            setNotifType("success");
            setShowNotifPopup(true);
        } catch (error) {
            console.error("Gagal mengubah status aktivasi bank:", error);
            setNotifMessage("Terjadi kesalahan saat mengubah status bank sampah");
            setNotifType("error");
            setShowNotifPopup(true);
        }
    };

    const handleHapusBankSampah = async () => {
        if (!id) return;
        
        const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus bank sampah ini? Tindakan ini tidak dapat dibatalkan.");
        if (!confirmDelete) return;

        try {
            await ProfilService.hapusBankSampah(id);
            window.alert("Bank sampah berhasil dihapus.");
            navigate(backPath); // Kembali ke list sebelumnya (BSI/BSM/BSU)
        } catch (error) {
            console.error("Gagal menghapus bank sampah:", error);
            window.alert("Terjadi kesalahan saat menghapus bank sampah.");
        }
    };

    const bank = {
        id: bankProfile.bank_id,
        nama: bankProfile.nama_bank,
        jenis: bankProfile.jenis_bank.toUpperCase() as "BSI" | "BSU" | "BSM",
        deskripsi: bankProfile.deskripsi || "Tidak ada deskripsi",
        foto: bankProfile.foto,
        provinsi: bankProfile.provinsi || "-",
        kota: bankProfile.kabupaten_kota || "-",
        kecamatan: bankProfile.kecamatan || "-",
        alamatLengkap: bankProfile.alamat_lengkap || "-",
        afiliasiBsi: bankProfile.bank_induk,
        is_active: bankProfile.is_active
    };
    const jenisConf = JENIS_CONFIG[bank.jenis] || JENIS_CONFIG.BSI;

    const breadcrumbItems = isSuperadmin 
        ? [
            { label: "Bank Sampah", path: "/superadmin/bank-sampah" },
            { label: bankTypeLabel, path: backPath },
            { label: bank.nama },
          ]
        : [
            { label: bankTypeLabel, path: backPath },
            { label: bank.nama },
          ];

    return (
        <>
            <BreadcrumbLayout items={breadcrumbItems} />
            <br />

            {/* ── Hapus Staff Confirmation Popup ── */}
            <PopupConfirmation
                isOpen={isDeleteAdminOpen}
                type="danger"
                title="Hapus Staff"
                message="Apakah Anda yakin ingin menghapus staff ini? Tindakan ini tidak dapat dibatalkan."
                confirmText="Ya, Hapus"
                cancelText="Batal"
                onConfirm={executeDeleteAdmin}
                onCancel={() => { setIsDeleteAdminOpen(false); setPendingDeleteAdminId(null); }}
            />

            {/* ── Popup Notifikasi ── */}
            {showNotifPopup && (
                <PopupNotifikasi
                    message={notifMessage}
                    type={notifType}
                    onClose={() => setShowNotifPopup(false)}
                />
            )}

            {/* ── Profile Card ── */}
            <div className="profil-bank-card">
                {/* Settings popup */}
                {isSuperadmin && (
                <div style={{ position: "absolute", top: "24px", right: "28px", zIndex: 10 }}>
                    <PopupMenu
                        trigger={
                            <button className="profil-bank-settings-btn" title="Pengaturan" style={{ position: "static" }}>
                                <FaGear />
                            </button>
                        }
                        items={[
                        {
                            label: "Edit Informasi",
                            icon: <FaPenToSquare />,
                            onClick: () => navigate(`/superadmin/bank-sampah/${bankTypeShort.toLowerCase()}/${bank.id}/edit`),
                        },
                        {
                            label: bankProfile.is_active ? "Nonaktifkan Bank Sampah" : "Aktifkan Bank Sampah",
                            icon: <FaToggleOff />,
                            onClick: handleToggleAktivasiBank,
                        },
                        {
                            label: "Hapus Bank Sampah",
                            icon: <FaTrashCan />,
                            variant: "danger",
                            onClick: handleHapusBankSampah,
                        },
                    ]}
                />
                </div>
                )}

                {isAdminBsi && (
                <div style={{ position: "absolute", top: "24px", right: "28px", zIndex: 10 }}>
                    <PopupMenu
                        trigger={
                            <button className="profil-bank-settings-btn" title="Pengaturan" style={{ position: "static" }}>
                                <FaGear />
                            </button>
                        }
                        items={[
                        {
                            label: bankProfile.is_active ? "Nonaktifkan Bank Sampah" : "Aktifkan Bank Sampah",
                            icon: <FaToggleOff />,
                            onClick: handleToggleAktivasiBank,
                        }
                    ]}
                />
                </div>
                )}

                <div className="profil-bank-content">
                    {/* Photo */}
                    <div className="profil-bank-photo-wrapper">
                        <div className="profil-bank-photo">
                            {bank.foto ? (
                                <img src={bank.foto} alt={bank.nama} />
                            ) : (
                                <div className="profil-bank-photo-fallback">
                                    <FaBuilding />
                                </div>
                            )}
                        </div>
                        <div 
                            className={`profil-bank-status-dot ${bank.is_active ? 'active' : 'inactive'}`} 
                            title={bank.is_active ? "Aktif" : "Nonaktif"}
                        />
                    </div>

                    {/* Info */}
                    <div className="profil-bank-info">
                        {/* Name + badge */}
                        <div className="profil-bank-name-row">
                            <h1 className="profil-bank-name">{bank.nama}</h1>
                            <span
                                className="profil-bank-jenis-badge"
                                style={{ color: jenisConf.color, background: jenisConf.bg }}
                            >
                                {bankTypeShort}
                            </span>
                        </div>

                        {/* Afiliasi badge (BSU only) */}
                        {bank.afiliasiBsi && (
                            <div className="profil-bank-afiliasi">
                                <FaBuilding />
                                <span>Berafiliasi dengan <strong>{bank.afiliasiBsi}</strong></span>
                            </div>
                        )}

                        {/* Deskripsi */}
                        <p className="profil-bank-desc">{bank.deskripsi}</p>

                        {/* Alamat */}
                        <div className="profil-bank-alamat">
                            <div className="profil-bank-alamat-icon">
                                <FaLocationDot />
                            </div>
                            <div className="profil-bank-alamat-detail">
                                <div className="profil-bank-alamat-tags">
                                    <span className="profil-bank-alamat-tag">{bank.provinsi}</span>
                                    <span className="profil-bank-alamat-tag">{bank.kota}</span>
                                    <span className="profil-bank-alamat-tag">{bank.kecamatan}</span>
                                </div>
                                <p className="profil-bank-alamat-text">{bank.alamatLengkap}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Sub Navbar ── */}
            <Tabs 
                tabs={(bank.jenis === "BSI" 
                    ? ["Bank Sampah Unit", "Nasabah", "Staff", "Jadwal"] 
                    : ["Nasabah", "Staff", "Jadwal", "Log Akun Bank"]
                ).map(t => ({ id: t, label: t }))}
                activeTab={activeTab}
                onChange={(id) => setActiveTab(id)}
                className="profil-bank-tabs"
                style={{ marginBottom: '24px' }}
            />

            {/* ── Tab Content ── */}
            <div className="profil-bank-tab-content">
                {activeTab === "Bank Sampah Unit" && (
                    <div className="nasabah-tab-content">
                        {/* Statistik */}
                        <div className="statistik">
                            <StatistikLayout
                                icon={FaLayerGroup}
                                angka={totalBsu}
                                status="Bank Sampah Unit"
                                deskripsi="Total BSU secara keseluruhan"
                                variant="default"
                            />
                            <StatistikLayout
                                icon={FaCircleCheck}
                                angka={aktifBsu}
                                status="Aktif"
                                deskripsi="BSU yang aktif beroperasi"
                                variant="success"
                            />
                            <StatistikLayout
                                icon={FaCircleXmark}
                                angka={nonaktifBsu}
                                status="Nonaktif"
                                deskripsi="BSU yang tidak aktif atau suspended"
                                variant="danger"
                            />
                        </div>

                        {/* Toolbar + tabel */}
                        <div className="bsu-table-section">


                            {/* Tabel */}
                            <Table
                                columns={getBsuColumns()}
                                data={bsuList}
                                rowKey={(row) => row.bank_id}
                            />
                        </div>
                    </div>
                )}
                {activeTab === "Nasabah" && (
                    <div className="nasabah-tab-content">
                        {/* Statistik */}
                        <div className="statistik">
                            <StatistikLayout
                                icon={FaUsers}
                                angka={totalNasabah}
                                status="Total Nasabah"
                                variant="default"
                            />
                            <StatistikLayout
                                icon={FaCircleCheck}
                                angka={aktifNasabah}
                                status="Aktif"
                                variant="success"
                            />
                            <StatistikLayout
                                icon={FaCircleXmark}
                                angka={nonaktifNasabah}
                                status="Nonaktif"
                                variant="danger"
                            />
                            <StatistikLayout
                                icon={FaClock}
                                angka={pendingNasabah}
                                status="Pending"
                                variant="warning"
                            />
                        </div>

                        {/* Toolbar + Tabel */}
                        <div className="bsu-table-section">
                            <Table
                                columns={getNasabahColumns()}
                                data={nasabahList}
                                rowKey={(row) => row.nasabah_id}
                            />
                        </div>
                    </div>
                )}
                {activeTab === "Staff" && (
                    <div className="nasabah-tab-content">
                        {/* Toolbar + tabel untuk Admin */}
                        <div className="bsu-table-section">
                            <div className="nasabah-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "16px" }}>
                                <FilterPill 
                                    options={[
                                        { label: "Semua", value: "all" },
                                        { label: "Admin", value: "admin" },
                                        { label: "Petugas", value: "petugas" }
                                    ]}
                                    activeValue={staffFilter}
                                    onChange={(val) => setStaffFilter(val)}
                                />
                                <Button
                                    variant="solid"
                                    color="neon"
                                    isRounded
                                    icon={<FaUserPlus />}
                                    onClick={() => {
                                        setSelectedUserId("");
                                        setSelectedRole("");
                                        setIsAddingNewUser(false);
                                        setShowTambahAdminModal(true);
                                    }}
                                >
                                    Tambah Admin
                                </Button>
                            </div>

                            <Table
                                columns={getAdminColumns(handleDeleteAdmin, handleToggleAktivasiStaff)}
                                data={filteredAdminList}
                                rowKey={(row) => row.user_id}
                            />
                        </div>
                    </div>
                )}
                {activeTab === "Jadwal" && (
                    <div className="jadwal-tab-content">
                        {/* Jadwal Penimbangan */}
                        <div className="jadwal-card">
                            <div className="jadwal-card-header">
                                <div className="jadwal-card-icon jadwal-icon--timbang">
                                    <FaScaleBalanced />
                                </div>
                                <div className="jadwal-card-header-text">
                                    <h3 className="jadwal-card-title">Jadwal Penimbangan</h3>
                                    <p className="jadwal-card-subtitle">Jadwal rutin penimbangan sampah nasabah</p>
                                </div>
                                <span className="jadwal-card-count jadwal-count--timbang">{penimbanganJadwal.length} jadwal</span>
                            </div>
                            <div className="jadwal-timeline">
                                {penimbanganJadwal.length === 0 ? (
                                    <div className="jadwal-empty-state">Belum ada jadwal penimbangan.</div>
                                ) : (
                                    penimbanganJadwal.map((item) => {
                                        const { day, month } = formatDayOfMonth(item.tanggal);
                                        return (
                                            <div key={item.jadwal_id} className="jadwal-timeline-item">
                                                <div className="jadwal-date-badge jadwal-date--timbang">
                                                    <span className="jadwal-date-day">{item.is_rutin ? "-" : day}</span>
                                                    <span className="jadwal-date-month">{item.is_rutin ? "Rutin" : month}</span>
                                                </div>
                                                <div className="jadwal-timeline-connector">
                                                    <div className="jadwal-timeline-dot jadwal-dot--timbang" />
                                                    <div className="jadwal-timeline-line jadwal-line--timbang" />
                                                </div>
                                                <div className="jadwal-timeline-content">
                                                    <span className="jadwal-timeline-hari">
                                                        {item.is_rutin ? `${HARI_DISPLAY[item.hari]} (${MINGGU_LABEL(item.minggu_ke)})` : (item.nama_jadwal_spesial || "Spesial")}
                                                    </span>
                                                    <span className="jadwal-timeline-waktu">
                                                        <FaClock /> {formatTime(item.jam_mulai)} – {formatTime(item.jam_selesai)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Jadwal Pengangkutan */}
                        <div className="jadwal-card">
                            <div className="jadwal-card-header">
                                <div className="jadwal-card-icon jadwal-icon--angkut">
                                    <FaTruck />
                                </div>
                                <div className="jadwal-card-header-text">
                                    <h3 className="jadwal-card-title">Jadwal Pengangkutan</h3>
                                    <p className="jadwal-card-subtitle">Jadwal pengangkutan sampah ke pusat daur ulang</p>
                                </div>
                                <span className="jadwal-card-count jadwal-count--angkut">{pengangkutanJadwal.length} jadwal</span>
                            </div>
                            <div className="jadwal-timeline">
                                {pengangkutanJadwal.length === 0 ? (
                                    <div className="jadwal-empty-state">Belum ada jadwal pengangkutan.</div>
                                ) : (
                                    pengangkutanJadwal.map((item) => {
                                        const { day, month } = formatDayOfMonth(item.tanggal);
                                        return (
                                            <div key={item.jadwal_id} className="jadwal-timeline-item">
                                                <div className="jadwal-date-badge jadwal-date--angkut">
                                                    <span className="jadwal-date-day">{item.is_rutin ? "-" : day}</span>
                                                    <span className="jadwal-date-month">{item.is_rutin ? "Rutin" : month}</span>
                                                </div>
                                                <div className="jadwal-timeline-connector">
                                                    <div className="jadwal-timeline-dot jadwal-dot--angkut" />
                                                    <div className="jadwal-timeline-line jadwal-line--angkut" />
                                                </div>
                                                <div className="jadwal-timeline-content">
                                                    <span className="jadwal-timeline-hari">
                                                        {item.target_bank_name || "BS Induk"} 
                                                        {item.is_rutin ? ` • ${HARI_DISPLAY[item.hari]}` : ` • ${item.nama_jadwal_spesial || "Spesial"}`}
                                                    </span>
                                                    <span className="jadwal-timeline-waktu">
                                                        <FaClock /> {formatTime(item.jam_mulai)} – {formatTime(item.jam_selesai)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === "Log Akun Bank" && (
                    <div className="nasabah-tab-content">
                        <div className="bsu-table-section">
                            <Table
                                columns={[
                                    {
                                        key: "action",
                                        header: "Action",
                                        width: "110px",
                                        align: "center",
                                        render: (row: HistoryAkunBank) => {
                                            const colorMap: Record<string, { color: string; bg: string }> = {
                                                'CREATE': { color: '#4EA771', bg: 'rgba(78,167,113,0.12)' },
                                                'UPDATE': { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
                                                'DELETE': { color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
                                            };
                                            const c = colorMap[row.action] || colorMap['UPDATE'];
                                            return (
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    color: c.color,
                                                    backgroundColor: c.bg,
                                                }}>
                                                    {row.action}
                                                </span>
                                            );
                                        },
                                    },
                                    {
                                        key: "timestamp",
                                        header: "Timestamp",
                                        width: "180px",
                                        render: (row: HistoryAkunBank) => {
                                            const date = new Date(row.created_at);
                                            const tanggal = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                                            const jam = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                                            return <span style={{ fontSize: '13px', color: '#555' }}>{tanggal} • {jam}</span>;
                                        },
                                    },
                                    {
                                        key: "informasi",
                                        header: "Informasi",
                                        render: (row: HistoryAkunBank) => (
                                            <span style={{ fontSize: '13px' }}>{row.informasi}</span>
                                        ),
                                    },
                                    {
                                        key: "keterangan",
                                        header: "Keterangan",
                                        render: (row: HistoryAkunBank) => (
                                            <span style={{ fontSize: '13px', color: '#666' }}>{row.keterangan || '-'}</span>
                                        ),
                                    },
                                    {
                                        key: "created_by",
                                        header: "By Admin",
                                        width: "150px",
                                        render: (row: HistoryAkunBank) => (
                                            <span style={{ fontSize: '13px', fontWeight: 500 }}>{row.created_by_name || '-'}</span>
                                        ),
                                    },
                                ]}
                                data={historyList}
                                rowKey={(row) => row.history_bank_id}
                                emptyMessage="Belum ada riwayat perubahan akun bank."
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ══════════════ MODAL: Tambah Admin / Akun ══════════════ */}
            {showTambahAdminModal && (
                <div className="regis-modal-overlay" onClick={() => setShowTambahAdminModal(false)}>
                    <div className="regis-modal" style={{ maxWidth: isAddingNewUser ? 540 : 860, maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
                        <div className="regis-modal-header" style={{ flexShrink: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div className="regis-section-icon icon-admin" style={{ width: 36, height: 36, fontSize: 16 }}>
                                    <FaUserShield />
                                </div>
                                <div>
                                    <h3 className="regis-modal-title">
                                        {isAddingNewUser ? "Tambahkan Akun Baru" : "Tambah Admin / Petugas"}
                                    </h3>
                                    <p className="regis-modal-subtitle">
                                        {isAddingNewUser 
                                            ? "Tambahkan akun pengguna baru ke sistem" 
                                            : "Pilih akun dan tentukan role untuk bank sampah ini"}
                                    </p>
                                </div>
                            </div>
                            <CloseButton onClick={() => {
                                if (isAddingNewUser) {
                                    setIsAddingNewUser(false);
                                } else {
                                    setShowTambahAdminModal(false);
                                }
                            }} />
                        </div>

                        {!isAddingNewUser ? (
                            // Tampilan Pilih Role & Akun
                            <form onSubmit={handleTambahAdmin} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                                <div className="regis-modal-body" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24, padding: "24px", overflowY: "auto", flex: 1 }}>
                                    
                                    {/* Kiri: Daftar Akun Non-Admin */}
                                    <div className="regis-form-group" style={{ marginBottom: 0 }}>
                                        <label className="regis-label">
                                            Pilih Akun <span className="required">*</span>
                                        </label>
                                        <p style={{ fontSize: 12, color: "#888", marginBottom: 12, marginTop: 0 }}>Pilih satu akun untuk dijadikan admin atau petugas</p>
                                        <div className="regis-admin-table-wrapper" style={{ maxHeight: 380, overflowY: "auto" }}>
                                            <table className="regis-admin-table">
                                                <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                                                    <tr>
                                                        <th style={{ width: 44, textAlign: "center" }}></th>
                                                        <th style={{ width: 48, textAlign: "center" }}>Foto</th>
                                                        <th>Nama & Email</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {nonAdminUsers.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={3} style={{ textAlign: "center", padding: "24px", color: "#aaa", fontSize: 13 }}>
                                                                Tidak ada akun yang tersedia
                                                            </td>
                                                        </tr>
                                                    ) : nonAdminUsers.map(user => {
                                                        const isSelected = selectedUserId === user.UserID;
                                                        return (
                                                            <tr
                                                                key={user.UserID}
                                                                className={isSelected ? "selected" : ""}
                                                                onClick={() => setSelectedUserId(user.UserID)}
                                                                style={{ cursor: "pointer" }}
                                                            >
                                                                <td style={{ textAlign: "center" }}>
                                                                    <label className="regis-checkbox-wrapper" onClick={e => e.stopPropagation()}>
                                                                        <input
                                                                            type="radio"
                                                                            name="tambah-admin-user"
                                                                            checked={isSelected}
                                                                            onChange={() => setSelectedUserId(user.UserID)}
                                                                            style={{ accentColor: "#013236" }}
                                                                        />
                                                                    </label>
                                                                </td>
                                                                <td style={{ textAlign: "center" }}>
                                                                    <div className="regis-admin-avatar">
                                                                        {user.PhotoURL ? (
                                                                            <img src={user.PhotoURL} alt={user.Nama} />
                                                                        ) : (
                                                                            <span>{user.Nama.charAt(0).toUpperCase()}</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                                                        <span className="regis-admin-name">{user.Nama}</span>
                                                                        <span className="regis-admin-email" style={{ fontSize: 11, color: "#888" }}>{user.Email}</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Kanan: Role Dropdown */}
                                    <div className="regis-form-group" style={{ marginBottom: 0 }}>
                                        <label className="regis-label" htmlFor="tambah-admin-role">
                                            Role <span className="required">*</span>
                                        </label>
                                        <p style={{ fontSize: 12, color: "#888", marginBottom: 12, marginTop: 0 }}>Tentukan posisi jabatan untuk pengguna terpilih</p>
                                        <Dropdown
                                            options={getRoleOptions()}
                                            value={selectedRole}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                            placeholder="Pilih Role Jabatan"
                                            dropdownSize="large"
                                            fullWidth
                                        />
                                        {selectedUserId && selectedRole && (
                                            <div style={{ marginTop: 24, padding: "16px", background: "#f0f5f2", borderRadius: "12px", border: "1px solid #c1d9c9" }}>
                                                <div style={{ fontSize: 12, color: "#5a7a68", marginBottom: 4 }}>Ringkasan Pilihan:</div>
                                                <div style={{ fontSize: 14, color: "#013236", fontWeight: 600 }}>{nonAdminUsers.find(u => u.UserID === selectedUserId)?.Nama || "Seseorang"}</div>
                                                <div style={{ fontSize: 13, color: "#3d5a48" }}>akan ditunjuk sebagai <strong>{getRoleOptions().find(r => r.value === selectedRole)?.label || "Role"}</strong></div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="regis-modal-footer" style={{ flexShrink: 0, justifyContent: "space-between" }}>
                                    <Button
                                        type="button"
                                        color="primary"
                                        variant="ghost"
                                        size="default"
                                        isRounded
                                        icon={<FaUserPlus />}
                                        onClick={() => setIsAddingNewUser(true)}
                                    >
                                        Tambahkan Akun Baru
                                    </Button>
                                    <div style={{ display: "flex", gap: "12px" }}>
                                        <Button
                                            type="button"
                                            color="primary"
                                            variant="outline"
                                            size="default"
                                            onClick={() => setShowTambahAdminModal(false)}
                                            disabled={isSubmittingAdmin}
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            color="primary"
                                            variant="solid"
                                            size="default"
                                            disabled={isSubmittingAdmin}
                                        >
                                            {isSubmittingAdmin ? "Menyimpan..." : "Simpan Admin"}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            // Tampilan Form Tambah Akun Baru
                            <form onSubmit={handleSaveNewUser} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                                <div className="regis-modal-body" style={{ overflowY: "auto", flex: 1 }}>
                                    <div className="regis-form-group">
                                        <label className="regis-label" htmlFor="new-admin-nik">
                                            NIK <span className="required">*</span>
                                        </label>
                                        <Input
                                            id="new-admin-nik"
                                            className="regis-input-neutral"
                                            variant="solid"
                                            inputSize="large"
                                            fullWidth
                                            placeholder="Masukkan 16 digit NIK"
                                            value={newUserForm.nik}
                                            onChange={(e) => setNewUserForm({ ...newUserForm, nik: e.target.value })}
                                            required
                                            maxLength={16}
                                        />
                                    </div>
                                    <div className="regis-form-group">
                                        <label className="regis-label" htmlFor="new-admin-nama">
                                            Nama Lengkap <span className="required">*</span>
                                        </label>
                                        <Input
                                            id="new-admin-nama"
                                            className="regis-input-neutral"
                                            variant="solid"
                                            inputSize="large"
                                            fullWidth
                                            placeholder="Masukkan nama lengkap"
                                            value={newUserForm.nama}
                                            onChange={(e) => setNewUserForm({ ...newUserForm, nama: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="regis-form-group">
                                        <label className="regis-label" htmlFor="new-admin-email">
                                            Email <span className="required">*</span>
                                        </label>
                                        <Input
                                            id="new-admin-email"
                                            type="email"
                                            className="regis-input-neutral"
                                            variant="solid"
                                            inputSize="large"
                                            fullWidth
                                            placeholder="contoh@email.com"
                                            value={newUserForm.email}
                                            onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="regis-form-group">
                                        <label className="regis-label" htmlFor="new-admin-nowa">
                                            No. WhatsApp <span className="required">*</span>
                                        </label>
                                        <Input
                                            id="new-admin-nowa"
                                            type="tel"
                                            className="regis-input-neutral"
                                            variant="solid"
                                            inputSize="large"
                                            fullWidth
                                            placeholder="081234567890"
                                            value={newUserForm.noWa}
                                            onChange={(e) => setNewUserForm({ ...newUserForm, noWa: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="regis-modal-footer" style={{ flexShrink: 0 }}>
                                    <Button
                                        type="button"
                                        color="primary"
                                        variant="outline"
                                        size="default"
                                        onClick={() => setIsAddingNewUser(false)}
                                    >
                                        Kembali
                                    </Button>
                                    <Button
                                        type="submit"
                                        color="primary"
                                        variant="solid"
                                        size="default"
                                    >
                                        Simpan Akun
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            <PopupAktivasiResult
                isOpen={isReactivateModalOpen}
                onClose={() => setIsReactivateModalOpen(false)}
                data={reactivateData}
                description="Berikan informasi berikut kepada staff untuk proses aktivasi akun mereka."
            />

            <PopupConfirmation
                isOpen={isActivationConfirmOpen}
                type={bankProfile?.is_active ? "danger" : "warning"}
                title={bankProfile?.is_active ? "Nonaktifkan Bank Sampah?" : "Aktifkan Bank Sampah?"}
                message={
                    bankProfile?.is_active 
                        ? "Apakah Anda yakin ingin menonaktifkan bank sampah ini? Bank sampah tidak akan beroperasional untuk sementara." 
                        : "Apakah Anda yakin ingin mengaktifkan kembali bank sampah ini? Bank sampah akan kembali beroperasional"
                }
                onConfirm={() => {
                    setIsActivationConfirmOpen(false);
                    setIsInputKeteranganOpen(true);
                }}
                onCancel={() => setIsActivationConfirmOpen(false)}
                confirmText={bankProfile?.is_active ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
                cancelText="Batal"
            />

            <PopupInputKeterangan
                isOpen={isInputKeteranganOpen}
                title={bankProfile?.is_active ? "Kenapa bank sampah ini perlu dinonaktifkan?" : "Kenapa bank sampah ini diaktifkan kembali?"}
                onConfirm={(keterangan) => handleAktivasiBank(keterangan)}
                onCancel={() => setIsInputKeteranganOpen(false)}
            />

            {showNotifPopup && (
                <PopupNotifikasi
                    message={notifMessage}
                    type={notifType}
                    onClose={() => setShowNotifPopup(false)}
                />
            )}
        </>
    );
}