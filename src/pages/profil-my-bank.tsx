import { useState, useEffect, useMemo, useRef } from "react";
import { formatTanggalPanjang, formatTanggalJamBullet } from "../utils/date.utils";
import { useNavigate } from "react-router-dom";
import { ProfilService } from "../services/profil.service";
import { AdminService } from "../services/admin.service";
import { UsersService } from "../services/users.service";
import { AuthService } from "../services/auth.service";
import { BankService } from "../services/bank.service";
import type { DetailBank, SaldoBank, HistoryAkunBank } from "../types/profil.type";
import type { AdminBankSampah } from "../types/admin.type";
import type { NonAdminUser } from "../types/users.type";
import type { ReactivateNasabahResponse } from "../types/auth.type";
import { useAuth } from "../contexts/AuthContext";
import {
    FaBuilding,
    FaLocationDot,
    FaCalendarDays,
    FaMoneyBillWave,
    FaStar,
    FaGear,
    FaToggleOff,
    FaTrashCan,
    FaUserPlus,
    FaUserShield,
    FaPenToSquare,
    FaCamera,
} from "react-icons/fa6";
import "../styles/layout.css";
import "../styles/profil-my-bank.css";
import "../styles/profil-nasabah.css";
import "../styles/profil-bank.css";
import "../styles/nasabah.css";
import "../styles/regis-bsi.css";

import Tabs from "../components/tabs";
import Table, { TableAvatar, TableBadge, type ColumnDef } from "../components/table";
import FilterPill from "../components/filter-pill";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import Dropdown from "../components/dropdown";
import Input from "../components/input";
import SearchBar from "../components/search";
import PopupMenu from "../components/popup-menu";
import ViewPhoto from "../components/view-photo";
import PopupConfirmation from "../layouts/popup-confirmation";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import PopupAktivasiResult from "../layouts/popup-aktivasi-result";
import PopupInputKeterangan from "../layouts/popup-input-keterangan";

// ─────────────────────────────────────────────────────────

function formatRupiah(angka: number) {
    return angka.toLocaleString("id-ID");
}

const getRoleLabel = (role: string) => {
    if (role.startsWith("admin_")) return "Admin";
    if (role.startsWith("petugas_")) return "Petugas";
    return role;
};

// ─────────────────────────────────────────────────────────

export default function ProfilMyBankPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const bankId = user?.bank_id ?? "";

    // ── Core data ──
    const [bank, setBank] = useState<DetailBank | null>(null);
    const [saldo, setSaldo] = useState<SaldoBank | null>(null);
    const [loading, setLoading] = useState(true);

    // ── Staff ──
    const [adminList, setAdminList] = useState<AdminBankSampah[]>([]);
    const [staffFilter, setStaffFilter] = useState<string>("all");

    // ── History ──
    const [historyList, setHistoryList] = useState<HistoryAkunBank[]>([]);

    // ── Tambah Admin Modal ──
    const [showTambahAdminModal, setShowTambahAdminModal] = useState(false);
    const [nonAdminUsers, setNonAdminUsers] = useState<NonAdminUser[]>([]);
    const [searchUser, setSearchUser] = useState<string>("");
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [selectedRole, setSelectedRole] = useState<string>("");
    const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

    // ── Tambah Akun Baru (inside modal) ──
    const [isAddingNewUser, setIsAddingNewUser] = useState(false);
    const [newUserForm, setNewUserForm] = useState({ nik: "", nama: "", email: "", noWa: "" });

    // ── Hapus Staff ──
    const [isDeleteAdminOpen, setIsDeleteAdminOpen] = useState(false);
    const [pendingDeleteAdminId, setPendingDeleteAdminId] = useState<string | null>(null);

    // ── Reactivate modal ──
    const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
    const [reactivateData, setReactivateData] = useState<ReactivateNasabahResponse["data"] | null>(null);

    // ── Aktivasi Bank ──
    const [isActivationConfirmOpen, setIsActivationConfirmOpen] = useState(false);
    const [isInputKeteranganOpen, setIsInputKeteranganOpen] = useState(false);

    // ── Notif ──
    const [showNotifPopup, setShowNotifPopup] = useState(false);
    const [notifMessage, setNotifMessage] = useState("");
    const [notifType, setNotifType] = useState<"success" | "error" | "warning" | "info">("success");

    // ── View Photo ──
    const [isPhotoOpen, setIsPhotoOpen] = useState(false);

    // ── Tabs ──
    const [activeTab, setActiveTab] = useState("Staff");

    // ── Edit Profil Bank Modal ──
    const [showEditProfilModal, setShowEditProfilModal] = useState(false);
    const [editNamaBank, setEditNamaBank] = useState("");
    const [editAlamat, setEditAlamat] = useState("");
    const [editDeskripsi, setEditDeskripsi] = useState("");
    const [editLatitude, setEditLatitude] = useState("");
    const [editLongitude, setEditLongitude] = useState("");
    const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
    const [editPhotoPreview, setEditPhotoPreview] = useState("");
    const [isSubmittingEditProfil, setIsSubmittingEditProfil] = useState(false);
    const editPhotoInputRef = useRef<HTMLInputElement>(null);

    // ── Load core data ──
    useEffect(() => {
        if (!bankId) return;
        setLoading(true);
        Promise.all([
            ProfilService.getDetailBank(bankId),
            ProfilService.getSaldoBank(bankId),
        ])
            .then(([bankRes, saldoRes]) => {
                setBank(bankRes.data);
                setSaldo(saldoRes.data);
            })
            .catch((err) => console.error("Gagal memuat profil bank:", err))
            .finally(() => setLoading(false));
    }, [bankId]);

    // ── Load staff (on mount) ──
    useEffect(() => {
        if (!bankId) return;
        AdminService.getAdminByBankId(bankId)
            .then((res) => setAdminList(res.data))
            .catch((err) => console.error("Gagal memuat daftar staff:", err));
    }, [bankId]);

    // ── Refresh history setiap kali tab Log Akun Bank dibuka ──
    useEffect(() => {
        if (activeTab !== "Log Akun Bank" || !bankId) return;
        ProfilService.getHistoryAkunBank(bankId)
            .then((res) => setHistoryList(res.data || []))
            .catch((err) => console.error("Gagal memuat riwayat akun bank:", err));
    }, [activeTab, bankId]);

    // ── Load non-admin users when modal opens ──
    useEffect(() => {
        if (showTambahAdminModal && bankId) {
            UsersService.getNonAdminUsers()
                .then((res) => setNonAdminUsers(res.data || []))
                .catch((err) => console.error("Gagal memuat daftar user:", err));
        }
    }, [showTambahAdminModal, bankId]);

    // ── Filtered staff ──
    const filteredAdminList = useMemo(() => {
        if (staffFilter === "all") return adminList;
        return adminList.filter((a) => a.role.startsWith(staffFilter));
    }, [adminList, staffFilter]);

    // ── Role options based on logged-in admin role ──
    const getRoleOptions = () => {
        const role = user?.role ?? "";
        if (role === "admin_bsu") return [
            { label: "Admin BSU", value: "admin_bsu" },
            { label: "Petugas BSU", value: "petugas_bsu" },
        ];
        if (role === "admin_bsm") return [
            { label: "Admin BSM", value: "admin_bsm" },
            { label: "Petugas BSM", value: "petugas_bsm" },
        ];
        return [
            { label: "Admin BSI", value: "admin_bsi" },
            { label: "Petugas BSI", value: "petugas_bsi" },
        ];
    };

    // ── Handlers ──
    const openEditProfilModal = () => {
        if (!bank) return;
        setEditNamaBank(bank.nama_bank);
        setEditAlamat(bank.alamat || "");
        setEditDeskripsi(bank.deskripsi || "");
        setEditLatitude(bank.latitude?.toString() || "");
        setEditLongitude(bank.longitude?.toString() || "");
        setEditPhotoFile(null);
        setEditPhotoPreview("");
        setShowEditProfilModal(true);
    };

    const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setEditPhotoFile(file);
        setEditPhotoPreview(URL.createObjectURL(file));
    };

    const handleEditProfilBank = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bankId) return;
        setIsSubmittingEditProfil(true);
        try {
            const formData = new FormData();
            formData.append("admin_id", user?.identity_id ?? "");
            formData.append("nama_bank", editNamaBank);
            formData.append("alamat", editAlamat);
            formData.append("deskripsi", editDeskripsi);
            if (editLatitude) formData.append("latitude", editLatitude);
            if (editLongitude) formData.append("longitude", editLongitude);
            if (editPhotoFile) formData.append("foto_profil", editPhotoFile);

            await BankService.editProfilBank(bankId, formData);
            const bankRes = await ProfilService.getDetailBank(bankId);
            setBank(bankRes.data);
            setShowEditProfilModal(false);
            showNotif("Profil bank berhasil diperbarui.", "success");
        } catch (err: any) {
            const msg = err?.response?.data?.error ?? "Gagal memperbarui profil bank.";
            showNotif(msg, "error");
        } finally {
            setIsSubmittingEditProfil(false);
        }
    };

    const showNotif = (msg: string, type: "success" | "error" | "warning" | "info") => {
        setNotifMessage(msg);
        setNotifType(type);
        setShowNotifPopup(true);
    };

    const handleDeleteAdmin = (adminId: string) => {
        setPendingDeleteAdminId(adminId);
        setIsDeleteAdminOpen(true);
    };

    const executeDeleteAdmin = async () => {
        if (!pendingDeleteAdminId) return;
        setIsDeleteAdminOpen(false);
        try {
            await AdminService.deleteAdmin(pendingDeleteAdminId, user?.identity_id ?? "");
            const res = await AdminService.getAdminByBankId(bankId);
            setAdminList(res.data);
            showNotif("Staff berhasil dihapus.", "success");
        } catch {
            showNotif("Terjadi kesalahan saat menghapus staff.", "error");
        } finally {
            setPendingDeleteAdminId(null);
        }
    };

    const handleToggleAktivasiStaff = async (userId: string, currentStatus: string) => {
        const isActive = currentStatus === "aktif";
        try {
            if (isActive) {
                await AuthService.deactivateAkun(userId, "admin");
                setAdminList((prev) =>
                    prev.map((a) => a.user_id === userId ? { ...a, status_admin: "nonaktif" as any } : a)
                );
                showNotif("Akun staff berhasil dinonaktifkan", "success");
            } else {
                if (!user?.identity_id) {
                    showNotif("Data admin pengautentikasi tidak ditemukan.", "error");
                    return;
                }
                const res = await AuthService.generateReactivateAkun(userId, user.identity_id, "admin");
                setReactivateData(res.data);
                setIsReactivateModalOpen(true);
                setAdminList((prev) =>
                    prev.map((a) => a.user_id === userId ? { ...a, status_admin: "pending" as any } : a)
                );
            }
        } catch {
            showNotif("Terjadi kesalahan saat memproses status staff.", "error");
        }
    };

    const handleAktivasiBank = async (keterangan: string) => {
        if (!bank || !bankId) return;
        const wasActive = bank.is_active;
        try {
            await BankService.AktivasiBank(bankId, {
                admin_id: user?.identity_id ?? "",
                informasi: wasActive ? "Bank sampah dinonaktifkan" : "Bank sampah diaktifkan",
                keterangan,
            });
            setIsInputKeteranganOpen(false);
            if (wasActive) {
                logout();
            } else {
                setBank((prev) => prev ? { ...prev, is_active: true } : null);
                showNotif("Bank sampah berhasil diaktifkan.", "success");
            }
        } catch {
            showNotif("Terjadi kesalahan saat mengubah status bank sampah.", "error");
        }
    };

    const handleTambahAdmin = async (e: { preventDefault(): void }) => {
        e.preventDefault();
        if (!selectedUserId) { showNotif("Pilih satu akun terlebih dahulu.", "warning"); return; }
        if (!selectedRole)   { showNotif("Pilih role terlebih dahulu.", "warning"); return; }
        setIsSubmittingAdmin(true);
        try {
            await AdminService.addAdmin(bankId, selectedUserId, selectedRole, user?.identity_id ?? "");
            const res = await AdminService.getAdminByBankId(bankId);
            setAdminList(res.data);
            setShowTambahAdminModal(false);
            setSelectedUserId("");
            setSelectedRole("");
            showNotif("Admin berhasil ditambahkan!", "success");
        } catch (err: any) {
            const msg = err?.response?.data?.error ?? "Gagal menambahkan admin. Silakan coba lagi.";
            showNotif(msg, "error");
        } finally {
            setIsSubmittingAdmin(false);
        }
    };

    const handleSaveNewUser = async (e: { preventDefault(): void }) => {
        e.preventDefault();
        try {
            await UsersService.createUsers({
                user_id: newUserForm.nik,
                nama: newUserForm.nama,
                email: newUserForm.email,
                no_whatsapp: newUserForm.noWa,
            });
            if (bankId) {
                const res = await UsersService.getNonAdminUsers();
                setNonAdminUsers(res.data || []);
            }
            setIsAddingNewUser(false);
            setNewUserForm({ nik: "", nama: "", email: "", noWa: "" });
            showNotif("Berhasil menambahkan akun baru!", "success");
        } catch (err: any) {
            const msg = err?.response?.data?.error ?? "Gagal menambahkan akun baru. Silakan coba lagi.";
            showNotif(msg, "error");
        }
    };

    // ── Table columns ──
    const adminColumns: ColumnDef<AdminBankSampah>[] = [
        {
            key: "foto",
            header: "Foto",
            width: "56px",
            align: "center",
            render: (row) => <TableAvatar src={row.foto} alt={row.nama} />,
        },
        {
            key: "admin_id",
            header: "Admin ID",
            width: "160px",
            render: (row) => <span className="table-name">{row.admin_id}</span>,
        },
        {
            key: "nama",
            header: "Nama Staff",
            render: (row) => <span style={{ fontWeight: 500 }}>{row.nama}</span>,
        },
        {
            key: "email",
            header: "Email",
            render: (row) => <span style={{ color: "#013236a0" }}>{row.email || "-"}</span>,
        },
        {
            key: "role",
            header: "Role",
            width: "100px",
            render: (row) => (
                <span style={{ textTransform: "capitalize", fontWeight: 500, color: "#3d5a48" }}>
                    {getRoleLabel(row.role)}
                </span>
            ),
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
                return (
                    <TableBadge
                        label={row.status_admin === "aktif" ? "Aktif" : "Nonaktif"}
                        active={row.status_admin === "aktif"}
                    />
                );
            },
        },
        {
            key: "aksi",
            header: "Aksi",
            width: "64px",
            align: "center",
            render: (row) => {
                if (row.admin_id === user?.identity_id) return null;
                return (
                    <PopupMenu
                        trigger={
                            <button className="table-action-btn" type="button" title="Pengaturan">
                                <FaGear />
                            </button>
                        }
                        items={[
                            {
                                label: row.status_admin === "aktif" ? "Nonaktifkan Akun Staff" : "Generate Aktivasi Akun Staff",
                                icon: <FaToggleOff />,
                                onClick: () => handleToggleAktivasiStaff(row.user_id, row.status_admin),
                            },
                            {
                                label: "Hapus Staff",
                                icon: <FaTrashCan />,
                                variant: "danger",
                                onClick: () => handleDeleteAdmin(row.admin_id),
                            },
                        ]}
                    />
                );
            },
        },
    ];

    // ── Render ──
    if (loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                Memuat profil bank...
            </div>
        );
    }

    if (!bank) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                Data profil bank tidak ditemukan.
            </div>
        );
    }

    const isBsu = bank.is_bsu;

    return (
        <>
            {/* ── Aktivasi Bank Confirmation ── */}
            <PopupConfirmation
                isOpen={isActivationConfirmOpen}
                type={bank.is_active ? "danger" : "warning"}
                title={bank.is_active ? "Nonaktifkan Bank Sampah?" : "Aktifkan Bank Sampah?"}
                message={
                    bank.is_active
                        ? "Apakah Anda yakin ingin menonaktifkan bank sampah ini? Anda akan ter-logout otomatis dan tidak dapat mengakses sistem selama bank sampah tidak beroperasi."
                        : "Apakah Anda yakin ingin mengaktifkan kembali bank sampah ini? Bank sampah akan kembali beroperasional."
                }
                confirmText={bank.is_active ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
                cancelText="Batal"
                onConfirm={() => { setIsActivationConfirmOpen(false); setIsInputKeteranganOpen(true); }}
                onCancel={() => setIsActivationConfirmOpen(false)}
            />

            <PopupInputKeterangan
                isOpen={isInputKeteranganOpen}
                title={bank.is_active ? "Kenapa bank sampah ini perlu dinonaktifkan?" : "Kenapa bank sampah ini diaktifkan kembali?"}
                onConfirm={(keterangan) => handleAktivasiBank(keterangan)}
                onCancel={() => setIsInputKeteranganOpen(false)}
            />

            {/* ── Hapus Staff Confirmation ── */}
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

            {/* ── Notifikasi ── */}
            {showNotifPopup && (
                <PopupNotifikasi
                    message={notifMessage}
                    type={notifType}
                    onClose={() => setShowNotifPopup(false)}
                />
            )}

            {/* ── Reactivate Result ── */}
            <PopupAktivasiResult
                isOpen={isReactivateModalOpen}
                onClose={() => setIsReactivateModalOpen(false)}
                data={reactivateData}
                description="Berikan informasi berikut kepada staff untuk proses aktivasi akun mereka."
            />

            {/* ── View Photo ── */}
            {isPhotoOpen && bank.photo_url && (
                <ViewPhoto src={bank.photo_url} alt={bank.nama_bank} onClose={() => setIsPhotoOpen(false)} />
            )}

            {/* ── Top Card ── */}
            <div className="pmb-card">
                <div className="pmb-card-left">
                    <div className="pmb-photo-wrapper">
                        <div
                            className="pmb-photo"
                            style={bank.photo_url ? { cursor: "pointer" } : undefined}
                            onClick={() => bank.photo_url && setIsPhotoOpen(true)}
                        >
                            {bank.photo_url ? (
                                <img src={bank.photo_url} alt={bank.nama_bank} />
                            ) : (
                                <div className="pmb-photo-fallback">
                                    <FaBuilding />
                                </div>
                            )}
                        </div>
                        <div
                            className={`pmb-status-dot ${bank.is_active ? "active" : "inactive"}`}
                            title={bank.is_active ? "Aktif" : "Nonaktif"}
                        />
                    </div>
                    <span className="pmb-bank-name">{bank.nama_bank}</span>
                    <span className="pmb-bank-id">{bank.bank_id}</span>
                </div>

                <div className="pmb-card-right">
                    <div style={{ position: "absolute", top: "20px", right: "24px", zIndex: 10 }}>
                        <PopupMenu
                            trigger={
                                <button className="pmb-settings-btn" type="button" title="Pengaturan">
                                    <FaGear />
                                </button>
                            }
                            items={[
                                {
                                    label: "Edit Profil Bank Sampah",
                                    icon: <FaPenToSquare />,
                                    onClick: openEditProfilModal,
                                },
                                {
                                    label: bank.is_active ? "Nonaktifkan Bank Sampah" : "Aktifkan Bank Sampah",
                                    icon: <FaToggleOff />,
                                    onClick: () => setIsActivationConfirmOpen(true),
                                },
                            ]}
                        />
                    </div>
                    <div className="pmb-chips-row">
                        <span className="pmb-chip pmb-chip--jenis">{bank.jenis_bank}</span>
                        {isBsu && bank.bank_induk_nama && (
                            <span className="pmb-chip pmb-chip--induk">
                                <FaBuilding />
                                {bank.bank_induk_nama}
                            </span>
                        )}
                    </div>
                    <div className="pmb-joined">
                        <FaCalendarDays />
                        Bergabung sejak {formatTanggalPanjang(bank.joined_at)}
                    </div>
                    <p className="pmb-desc">{bank.deskripsi || "Tidak ada deskripsi."}</p>
                </div>
            </div>

            {/* ── Middle Row: Saldo + Alamat ── */}
            <div className="pmb-mid-row">
                <div className="pmb-panel">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <p className="pmb-panel-title" style={{ margin: 0 }}>Saldo Rekening</p>
                        <Button
                            color="primary"
                            variant="solid"
                            size="small"
                            isRounded
                            onClick={() => navigate("/profil-bank/mutasi-saldo")}
                        >
                            Kelola
                        </Button>
                    </div>
                    <div className="pmb-saldo-cards">
                        <div className="pn-saldo-card pn-saldo-card--green">
                            <div className="pn-saldo-icon"><FaMoneyBillWave /></div>
                            <div className="pn-saldo-body">
                                <span className="pn-saldo-number">
                                    {saldo?.uang.satuan_uang ?? "Rp"} {formatRupiah(saldo?.uang.total_uang ?? 0)}
                                </span>
                                <span className="pn-saldo-status">Saldo Uang</span>
                            </div>
                        </div>
                        {!isBsu && (
                            <div className="pn-saldo-card pn-saldo-card--green">
                                <div className="pn-saldo-icon"><FaStar /></div>
                                <div className="pn-saldo-body">
                                    <span className="pn-saldo-number">
                                        {formatRupiah(saldo?.poin.total_poin ?? 0)} {saldo?.poin.satuan_poin ?? "poin"}
                                    </span>
                                    <span className="pn-saldo-status">Saldo Poin</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pmb-panel">
                    <p className="pmb-panel-title">Alamat</p>
                    <div className="pmb-alamat-grid">
                        <div className="pmb-alamat-item">
                            <span className="pmb-alamat-label">Provinsi</span>
                            <span className="pmb-alamat-value">{bank.provinsi || "-"}</span>
                        </div>
                        <div className="pmb-alamat-item">
                            <span className="pmb-alamat-label">Kota / Kabupaten</span>
                            <span className="pmb-alamat-value">{bank.kabupaten_kota || "-"}</span>
                        </div>
                        <div className="pmb-alamat-item">
                            <span className="pmb-alamat-label">Kecamatan</span>
                            <span className="pmb-alamat-value">{bank.kecamatan || "-"}</span>
                        </div>
                        <div className="pmb-alamat-item">
                            <span className="pmb-alamat-label">Kelurahan</span>
                            <span className="pmb-alamat-value">{bank.kelurahan || "-"}</span>
                        </div>
                    </div>
                    <div className="pmb-alamat-full">{bank.alamat || "-"}</div>
                    <div className="pmb-koordinat">
                        <FaLocationDot />
                        {bank.latitude}, {bank.longitude}
                    </div>
                </div>
            </div>

            {/* ── Tabs: Staff + Log Akun Bank ── */}
            <Tabs
                tabs={[
                    { id: "Staff", label: "Staff" },
                    { id: "Log Akun Bank", label: "Log Akun Bank" },
                ]}
                activeTab={activeTab}
                onChange={(id) => setActiveTab(id)}
                className="profil-bank-tabs"
                style={{ marginBottom: "24px" }}
            />

            {/* ── Tab: Staff ── */}
            {activeTab === "Staff" && (
                <div className="nasabah-tab-content">
                    <div className="bsu-table-section">
                        <div
                            className="nasabah-toolbar"
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "16px" }}
                        >
                            <FilterPill
                                options={[
                                    { label: "Semua", value: "all" },
                                    { label: "Admin", value: "admin" },
                                    { label: "Petugas", value: "petugas" },
                                ]}
                                activeValue={staffFilter}
                                onChange={(val) => setStaffFilter(val)}
                            />
                            <Button
                                variant="solid"
                                color="secondary"
                                isRounded
                                icon={<FaUserPlus />}
                                onClick={() => {
                                    setSelectedUserId("");
                                    setSelectedRole("");
                                    setIsAddingNewUser(false);
                                    setShowTambahAdminModal(true);
                                }}
                            >
                                Tambah Staff
                            </Button>
                        </div>

                        <Table
                            columns={adminColumns}
                            data={filteredAdminList}
                            rowKey={(row) => row.user_id}
                            onRowClick={(row) => navigate(`/profil-bank/detail-petugas/${row.admin_id}`)}
                        />
                    </div>
                </div>
            )}

            {/* ── Tab: Log Akun Bank ── */}
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
                                            CREATE: { color: "#4EA771", bg: "rgba(78,167,113,0.12)" },
                                            UPDATE: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
                                            DELETE: { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
                                        };
                                        const c = colorMap[row.action] || colorMap["UPDATE"];
                                        return (
                                            <span style={{
                                                display: "inline-block",
                                                padding: "4px 10px",
                                                borderRadius: "6px",
                                                fontSize: "12px",
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
                                    render: (row: HistoryAkunBank) => (
                                        <span style={{ fontSize: "12px", color:"#013236a0" }}>{formatTanggalJamBullet(row.created_at)}</span>
                                    ),
                                },
                                {
                                    key: "informasi",
                                    header: "Informasi",
                                    render: (row: HistoryAkunBank) => (
                                        <span style={{ fontSize: "12px", color:"#013236a0" }}>{row.informasi}</span>
                                    ),
                                },
                                {
                                    key: "keterangan",
                                    header: "Keterangan",
                                    render: (row: HistoryAkunBank) => (
                                        <span style={{ fontSize: "12px", color:"#013236a0" }}>{row.keterangan || "-"}</span>
                                    ),
                                },
                                {
                                    key: "created_by",
                                    header: "By Admin",
                                    width: "150px",
                                    render: (row: HistoryAkunBank) => (
                                        <span style={{ fontSize: "12px", fontWeight: 500, color:"#013236a0" }}>{row.created_by_name || "-"}</span>
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

            {/* ══ MODAL: Edit Profil Bank ══ */}
            {showEditProfilModal && (
                <div className="regis-modal-overlay" onClick={() => setShowEditProfilModal(false)}>
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
                            <CloseButton onClick={() => setShowEditProfilModal(false)} />
                        </div>

                        <form onSubmit={handleEditProfilBank} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                            <div className="regis-modal-body" style={{ overflowY: "auto", flex: 1 }}>
                                {/* Foto Profil */}
                                <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                                    <div
                                        style={{
                                            position: "relative",
                                            width: 100,
                                            height: 100,
                                            borderRadius: 14,
                                            overflow: "hidden",
                                            cursor: "pointer",
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
                                        <div style={{
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
                                    <input
                                        ref={editPhotoInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleEditPhotoChange}
                                        hidden
                                    />
                                </div>

                                {/* Nama Bank */}
                                <div className="regis-form-group">
                                    <label className="regis-label">Nama Bank <span className="required">*</span></label>
                                    <Input
                                        className="regis-input-neutral"
                                        variant="solid"
                                        inputSize="large"
                                        fullWidth
                                        placeholder="Nama bank sampah"
                                        value={editNamaBank}
                                        onChange={(e) => setEditNamaBank(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Deskripsi */}
                                <div className="regis-form-group">
                                    <label className="regis-label">Deskripsi</label>
                                    <textarea
                                        className="regis-textarea"
                                        rows={3}
                                        placeholder="Deskripsi singkat bank sampah"
                                        value={editDeskripsi}
                                        onChange={(e) => setEditDeskripsi(e.target.value)}
                                    />
                                </div>

                                {/* Alamat */}
                                <div className="regis-form-group">
                                    <label className="regis-label">Alamat Lengkap</label>
                                    <textarea
                                        className="regis-textarea"
                                        rows={2}
                                        placeholder="Alamat lengkap bank sampah"
                                        value={editAlamat}
                                        onChange={(e) => setEditAlamat(e.target.value)}
                                    />
                                </div>

                                {/* Latitude + Longitude */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    <div className="regis-form-group" style={{ marginBottom: 0 }}>
                                        <label className="regis-label">Latitude</label>
                                        <Input
                                            className="regis-input-neutral"
                                            variant="solid"
                                            inputSize="large"
                                            fullWidth
                                            placeholder="-0.9492"
                                            value={editLatitude}
                                            onChange={(e) => setEditLatitude(e.target.value)}
                                        />
                                    </div>
                                    <div className="regis-form-group" style={{ marginBottom: 0 }}>
                                        <label className="regis-label">Longitude</label>
                                        <Input
                                            className="regis-input-neutral"
                                            variant="solid"
                                            inputSize="large"
                                            fullWidth
                                            placeholder="100.3543"
                                            value={editLongitude}
                                            onChange={(e) => setEditLongitude(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="regis-modal-footer" style={{ flexShrink: 0 }}>
                                <Button
                                    type="button"
                                    color="primary"
                                    variant="outline"
                                    size="default"
                                    onClick={() => setShowEditProfilModal(false)}
                                    disabled={isSubmittingEditProfil}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    color="primary"
                                    variant="solid"
                                    size="default"
                                    disabled={isSubmittingEditProfil}
                                >
                                    {isSubmittingEditProfil ? "Menyimpan..." : "Simpan Perubahan"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══ MODAL: Tambah Admin ══ */}
            {showTambahAdminModal && (
                <div className="regis-modal-overlay" onClick={() => setShowTambahAdminModal(false)}>
                    <div
                        className="regis-modal"
                        style={{ maxWidth: isAddingNewUser ? 540 : 860, maxHeight: "90vh", display: "flex", flexDirection: "column" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="regis-modal-header" style={{ flexShrink: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div className="regis-section-icon icon-admin" style={{ width: 36, height: 36, fontSize: 16 }}>
                                    <FaUserShield />
                                </div>
                                <div>
                                    <h3 className="regis-modal-title">
                                        {isAddingNewUser ? "Tambahkan Akun Baru" : "Tambah Staff"}
                                    </h3>
                                    <p className="regis-modal-subtitle">
                                        {isAddingNewUser
                                            ? "Tambahkan akun pengguna baru ke sistem"
                                            : "Pilih akun dan tentukan role untuk bank sampah ini"}
                                    </p>
                                </div>
                            </div>
                            <CloseButton onClick={() => {
                                if (isAddingNewUser) setIsAddingNewUser(false);
                                else setShowTambahAdminModal(false);
                            }} />
                        </div>

                        {!isAddingNewUser ? (
                            <form onSubmit={handleTambahAdmin} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                                <div
                                    className="regis-modal-body"
                                    style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24, padding: "24px", overflowY: "auto", flex: 1 }}
                                >
                                    {/* Kiri: Daftar Akun */}
                                    <div className="regis-form-group" style={{ marginBottom: 0 }}>
                                        <label className="regis-label">
                                            Pilih Akun <span className="required">*</span>
                                        </label>
                                        <p style={{ fontSize: 12, color: "#888", marginBottom: 12, marginTop: 0 }}>
                                            Pilih satu akun untuk dijadikan admin atau petugas
                                        </p>
                                        <div style={{ marginBottom: 10 }}>
                                            <SearchBar
                                                placeholder="Cari nama atau email..."
                                                value={searchUser}
                                                onChange={setSearchUser}
                                                width="100%"
                                            />
                                        </div>
                                        <div className="regis-admin-table-wrapper" style={{ maxHeight: 340, overflowY: "auto" }}>
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
                                                    ) : nonAdminUsers.filter((u) =>
                                                            u.Nama.toLowerCase().includes(searchUser.toLowerCase()) ||
                                                            u.Email.toLowerCase().includes(searchUser.toLowerCase())
                                                        ).map((u) => {
                                                        const isSelected = selectedUserId === u.UserID;
                                                        return (
                                                            <tr
                                                                key={u.UserID}
                                                                className={isSelected ? "selected" : ""}
                                                                onClick={() => setSelectedUserId(u.UserID)}
                                                                style={{ cursor: "pointer" }}
                                                            >
                                                                <td style={{ textAlign: "center" }}>
                                                                    <label className="regis-checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
                                                                        <input
                                                                            type="radio"
                                                                            name="tambah-admin-user"
                                                                            checked={isSelected}
                                                                            onChange={() => setSelectedUserId(u.UserID)}
                                                                            style={{ accentColor: "#013236" }}
                                                                        />
                                                                    </label>
                                                                </td>
                                                                <td style={{ textAlign: "center" }}>
                                                                    <div className="regis-admin-avatar">
                                                                        {u.PhotoURL ? (
                                                                            <img src={u.PhotoURL} alt={u.Nama} />
                                                                        ) : (
                                                                            <span>{u.Nama.charAt(0).toUpperCase()}</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                                                        <span className="regis-admin-name">{u.Nama}</span>
                                                                        <span className="regis-admin-email" style={{ fontSize: 11, color: "#888" }}>{u.Email}</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Kanan: Role */}
                                    <div className="regis-form-group" style={{ marginBottom: 0 }}>
                                        <label className="regis-label" htmlFor="tambah-admin-role">
                                            Role <span className="required">*</span>
                                        </label>
                                        <p style={{ fontSize: 12, color: "#888", marginBottom: 12, marginTop: 0 }}>
                                            Tentukan posisi jabatan untuk pengguna terpilih
                                        </p>
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
                                                <div style={{ fontSize: 12, color: "#013236", fontWeight: 600 }}>
                                                    {nonAdminUsers.find((u) => u.UserID === selectedUserId)?.Nama ?? "Seseorang"}
                                                </div>
                                                <div style={{ fontSize: 12, color: "#3d5a48" }}>
                                                    akan ditunjuk sebagai <strong>{getRoleOptions().find((r) => r.value === selectedRole)?.label ?? "Role"}</strong>
                                                </div>
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
                                            {isSubmittingAdmin ? "Menyimpan..." : "Simpan Staff"}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        ) : (
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
        </>
    );
}
