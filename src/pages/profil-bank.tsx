import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import SetoranSampahDashboard from "../components/SetoranSampahDashboard";
import PenjualanSampahSection from "../components/PenjualanSampahSection";
import MasukSampahSection from "../components/MasukSampahSection";
import KontribusiNasabahSection from "../components/KontribusiNasabahSection";
import "../styles/setoran-dashboard.css";
import { ProfilService } from "../services/profil.service";
import { NasabahService } from "../services/nasabah.service";
import { AdminService } from "../services/admin.service";
import { BsuService } from "../services/bsu.service";
import { PengangkutanService, type PengangkutanItem } from "../services/pengangkutan.service";
import { DistribusiSisaService } from "../services/distribusi_sisa.service";
import type { BankSampahProfile } from "../types/profil.type";
import type { NasabahBankSampah } from "../types/nasabah.type";
import type { AdminBankSampah } from "../types/admin.type";
import type { BSUByBankId } from "../types/bsu.type";
import type { BagiHasilBsuItem } from "../types/distribusi_sisa.type";
import BreadcrumbLayout from "../layouts/breadcrumb";
import {
    FaGear,
    FaLocationDot,
    FaBuilding,
    FaUsers,
    FaCircleCheck,
    FaCircleXmark,
    FaClock,
    FaLayerGroup,
    FaToggleOff,
    FaTrashCan,
    FaEye,
} from "react-icons/fa6";
import "../styles/layout.css";
import "../styles/profil-bank.css";
import "../styles/nasabah.css";
import "../styles/regis-bsi.css";
import "../styles/riwayat.css";
import "../styles/jadwal-bsu.css";

import StatistikLayout from "../layouts/statistik";
import Table, {
    TableAvatar,
    TableBadge,
    TableActionBtn,
    type ColumnDef,
} from "../components/table";
import PopupMenu from "../components/popup-menu";
import ViewPhoto from "../components/view-photo";
import Tabs from "../components/tabs";
import FilterPill from "../components/filter-pill";
import FilterRange, { defaultMonthRange } from "../components/filter-range";
import SearchBar from "../components/search";
import { useAuth } from "../contexts/AuthContext";
import PopupConfirmation from "../layouts/popup-confirmation";
import PopupInputKeterangan from "../layouts/popup-input-keterangan";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import { BankService } from "../services/bank.service";
import { formatTanggal } from "../utils/date.utils";
import { getApiError } from "../utils/error.utils";


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
        key: "bank_id",
        header: "Bank ID",
        width: "160px",
        render: (row) => <span className="table-name">{row.bank_id}</span>,
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
        key: "staff",
        header: "Jumlah Staff",
        align: "center",
        width: "120px",
        render: (row) => (
            <span style={{ fontWeight: 600 }}>{row.jumlah_staff}</span>
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

const getAdminColumns = (): ColumnDef<AdminBankSampah>[] => [
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
            key: "nik",
            header: "NIK",
            width: "150px",
            render: (row) => <span>{row.nik || "-"}</span>,
        },
        {
            key: "email",
            header: "Email",
            render: (row) => <span>{row.email || "-"}</span>,
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

// ─────────────────────────────────────────────────────────
// ── Riwayat Pengangkutan & Bagi Hasil BSU (for admin_bsi)
// ─────────────────────────────────────────────────────────
const STATUS_PENGANGKUTAN: Record<string, { label: string; cls: string }> = {
    completed: { label: "Selesai",            cls: "selesai"     },
    otw:       { label: "Dalam Perjalanan",   cls: "berlangsung" },
    requested: { label: "Diminta",            cls: "mendatang"   },
};

const ANGKUT_COLS: ColumnDef<PengangkutanItem>[] = [
    {
        key: "pengangkutan_id",
        header: "ID Pengangkutan",
        render: (row) => <span className="table-id">{row.pengangkutan_id}</span>,
    },
    {
        key: "tanggal",
        header: "Tanggal Pengangkutan",
        width: "180px",
        render: (row) => row.changed_at ? formatTanggal(row.changed_at) : "—",
    },
    {
        key: "pihak",
        header: "Diangkut Oleh",
        render: (row) => row.nama_bsi,
    },
    {
        key: "status",
        header: "Status Pengangkutan",
        width: "180px",
        render: (row) => {
            const s = STATUS_PENGANGKUTAN[row.status_pengangkutan];
            return (
                <span className={`jbsu-status-pill ${s?.cls ?? row.status_pengangkutan}`}>
                    {s?.label ?? row.status_pengangkutan}
                </span>
            );
        },
    },
    {
        key: "aksi",
        header: "Aksi",
        width: "70px",
        align: "center" as const,
        render: () => <TableActionBtn icon={FaEye} title="Lihat Detail" />,
    },
];

const BAGI_HASIL_BSU_COLS: ColumnDef<BagiHasilBsuItem>[] = [
    {
        key: "penerima_sisa_id",
        header: "ID Bagi Hasil",
        render: (row) => <span className="table-id">{row.penerima_sisa_id}</span>,
    },
    {
        key: "tanggal",
        header: "Tanggal Distribusi",
        width: "160px",
        render: (row) => row.tanggal_distribusi ? formatTanggal(row.tanggal_distribusi) : "—",
    },
    {
        key: "total_diterima",
        header: "Total Diterima",
        width: "160px",
        render: (row) => {
            const num = row.nominal_diterima.toLocaleString("id-ID");
            return row.satuan_nominal === "Rp" ? `Rp ${num}` : `${num} poin`;
        },
    },
    {
        key: "aksi",
        header: "Aksi",
        width: "70px",
        align: "center" as const,
        render: () => <TableActionBtn icon={FaEye} title="Lihat Detail" />,
    },
];

// ─────────────────────────────────────────────────────────

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
    const [isActivationConfirmOpen, setIsActivationConfirmOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isInputKeteranganOpen, setIsInputKeteranganOpen] = useState(false);
    const [isPhotoOpen, setIsPhotoOpen] = useState(false);

    const [showNotifPopup, setShowNotifPopup] = useState(false);
    const [notifMessage, setNotifMessage] = useState("");
    const [notifType, setNotifType] = useState<"success" | "error" | "warning" | "info">("success");
    const [notifShouldNavigate, setNotifShouldNavigate] = useState(false);

    // State untuk tab Pengangkutan & Bagi Hasil BSU (admin_bsi viewing BSU)
    const [angkutList, setAngkutList] = useState<PengangkutanItem[]>([]);
    const [angkutLoading, setAngkutLoading] = useState(false);
    const [angkutFrom, setAngkutFrom] = useState(() => defaultMonthRange().from);
    const [angkutTo, setAngkutTo] = useState(() => defaultMonthRange().to);
    const [angkutSearch, setAngkutSearch] = useState("");

    const [bagiHasilBsuList, setBagiHasilBsuList] = useState<BagiHasilBsuItem[]>([]);
    const [bagiHasilBsuLoading, setBagiHasilBsuLoading] = useState(false);
    const [bagiHasilBsuFrom, setBagiHasilBsuFrom] = useState(() => defaultMonthRange().from);
    const [bagiHasilBsuTo, setBagiHasilBsuTo] = useState(() => defaultMonthRange().to);
    const [bagiHasilBsuSearch, setBagiHasilBsuSearch] = useState("");

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

            if (isBsuUrl && user?.role === "admin_bsi") {
                setAngkutLoading(true);
                PengangkutanService.getPengangkutanByBank(id)
                    .then(data => setAngkutList(data))
                    .catch(err => console.error("Gagal menarik data pengangkutan BSU:", err))
                    .finally(() => setAngkutLoading(false));

                setBagiHasilBsuLoading(true);
                DistribusiSisaService.getRiwayatBagiHasilBsu(id)
                    .then(data => setBagiHasilBsuList(data))
                    .catch(err => console.error("Gagal menarik data bagi hasil BSU:", err))
                    .finally(() => setBagiHasilBsuLoading(false));
            }
        }
    }, [id, isBsiUrl, isBsuUrl, user?.role]);

    // State for Tabs
    const [activeTab, setActiveTab] = useState(isBsiUrl ? "Bank Sampah Unit" : "Nasabah");

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

    // Filter Pengangkutan BSU
    const filteredAngkut = useMemo(() => {
        const q = angkutSearch.toLowerCase();
        return angkutList.filter(item => {
            if (!item.changed_at) return false;
            const month = item.changed_at.substring(0, 7);
            if (month < angkutFrom || month > angkutTo) return false;
            if (q) return item.pengangkutan_id.toLowerCase().includes(q);
            return true;
        });
    }, [angkutList, angkutFrom, angkutTo, angkutSearch]);

    // Filter Bagi Hasil BSU
    const filteredBagiHasilBsu = useMemo(() => {
        const q = bagiHasilBsuSearch.toLowerCase();
        return bagiHasilBsuList.filter(item => {
            const month = item.tanggal_distribusi.substring(0, 7);
            if (month < bagiHasilBsuFrom || month > bagiHasilBsuTo) return false;
            if (q) {
                return item.penerima_sisa_id.toLowerCase().includes(q) ||
                       item.distribusi_id.toLowerCase().includes(q) ||
                       item.bagi_hasil_id.toLowerCase().includes(q);
            }
            return true;
        });
    }, [bagiHasilBsuList, bagiHasilBsuFrom, bagiHasilBsuTo, bagiHasilBsuSearch]);

    const isSuperadmin = user?.role === "superadmin";
    const isAdminBsi = user?.role === "admin_bsi";
    // const isAdminBsm = user?.role === "admin_bsm";
    // const isAdminBsu = user?.role === "admin_bsu";

    // Determine type from URL
    const isBsu = location.pathname.includes("/bsu/");
    const isBsm = location.pathname.includes("/bsm/");
    const bankTypeLabel = isBsu ? "Bank Sampah Unit" : isBsm ? "Bank Sampah Mandiri" : "Bank Sampah Induk";
    const backPath = isSuperadmin
        ? (isBsu ? "/superadmin/bank-sampah/bsu" : isBsm ? "/superadmin/bank-sampah/bsm" : "/superadmin/bank-sampah/bsi")
        : (isBsu ? "/bsi/bsu" : "/bsi");

    // Get data
    if (!bankProfile) {
        return <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Memuat profil...</div>;
    }

    const handleToggleAktivasiBank = () => {
        if (!bankProfile || !id) return;
        setIsActivationConfirmOpen(true);
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

    const handleHapusBankSampah = () => {
        if (!id) return;
        setIsDeleteConfirmOpen(true);
    };

    const doHapusBankSampah = async () => {
        if (!id) return;
        setIsDeleteConfirmOpen(false);
        try {
            await ProfilService.hapusBankSampah(id);
            setNotifMessage("Bank sampah berhasil dihapus.");
            setNotifType("success");
            setNotifShouldNavigate(true);
            setShowNotifPopup(true);
        } catch (error) {
            console.error("Gagal menghapus bank sampah:", error);
            setNotifMessage(getApiError(error, "Terjadi kesalahan saat menghapus bank sampah."));
            setNotifType("error");
            setShowNotifPopup(true);
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
        kelurahan: bankProfile.kelurahan || "-",
        alamatLengkap: bankProfile.alamat_lengkap || "-",
        afiliasiBsi: bankProfile.bank_induk,
        is_active: bankProfile.is_active
    };


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

            {/* ── View Photo ── */}
            {isPhotoOpen && bank.foto && (
                <ViewPhoto src={bank.foto} alt={bank.nama} onClose={() => setIsPhotoOpen(false)} />
            )}

            {/* ── Popup Notifikasi ── */}
            {showNotifPopup && (
                <PopupNotifikasi
                    message={notifMessage}
                    type={notifType}
                    onClose={() => {
                        setShowNotifPopup(false);
                        if (notifShouldNavigate) {
                            setNotifShouldNavigate(false);
                            navigate(backPath);
                        }
                    }}
                />
            )}

            {/* ── Profile Card ── */}
            <div className="profil-bank-card">
                {/* Left: foto + nama + ID */}
                <div className="profil-bank-left">
                    <div className="profil-bank-photo-wrapper">
                        <div
                            className="profil-bank-photo"
                            style={bank.foto ? { cursor: "pointer" } : undefined}
                            onClick={() => bank.foto && setIsPhotoOpen(true)}
                        >
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
                    <span className="profil-bank-left-name">{bank.nama}</span>
                    <span className="profil-bank-id-label">{bank.id}</span>
                </div>

                {/* Right: afiliasi + deskripsi + alamat */}
                <div className="profil-bank-right">
                    {isSuperadmin && (
                    <div style={{ position: "absolute", top: "20px", right: "24px", zIndex: 10 }}>
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
                    <div style={{ position: "absolute", top: "20px", right: "24px", zIndex: 10 }}>
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

                    <div className="profil-bank-info">
                        {bank.afiliasiBsi && (
                            <div className="profil-bank-afiliasi">
                                <FaBuilding />
                                <span>Berafiliasi dengan <strong>{bank.afiliasiBsi}</strong></span>
                            </div>
                        )}

                        <p className="profil-bank-desc">{bank.deskripsi}</p>

                        <div className="profil-bank-alamat">
                            <div className="profil-bank-alamat-icon">
                                <FaLocationDot />
                            </div>
                            <div className="profil-bank-alamat-detail">
                                <div className="profil-bank-alamat-tags">
                                    <span className="profil-bank-alamat-tag">{bank.provinsi}</span>
                                    <span className="profil-bank-alamat-tag">{bank.kota}</span>
                                    <span className="profil-bank-alamat-tag">{bank.kecamatan}</span>
                                    <span className="profil-bank-alamat-tag">{bank.kelurahan}</span>
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
                    ? ["Bank Sampah Unit", "Nasabah", "Staff", ...(isSuperadmin ? ["Statistik"] : [])]
                    : isBsuUrl && isAdminBsi
                        ? ["Nasabah", "Staff", "Pengangkutan", "Bagi Hasil"]
                        : ["Nasabah", "Staff", ...(isSuperadmin ? ["Statistik"] : [])]
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
                            <div className="nasabah-toolbar" style={{ display: "flex", marginBottom: "16px" }}>
                                <FilterPill
                                    options={[
                                        { label: "Semua", value: "all" },
                                        { label: "Admin", value: "admin" },
                                        { label: "Petugas", value: "petugas" }
                                    ]}
                                    activeValue={staffFilter}
                                    onChange={(val) => setStaffFilter(val)}
                                />
                            </div>

                            <Table
                                columns={getAdminColumns()}
                                data={filteredAdminList}
                                rowKey={(row) => row.user_id}
                            />
                        </div>
                    </div>
                )}
                {activeTab === "Pengangkutan" && (
                    <div className="nasabah-tab-content">
                        <div className="bsu-table-section">
                            <div className="riwayat-filter-row">
                                <SearchBar
                                    placeholder="Cari ID Pengangkutan..."
                                    value={angkutSearch}
                                    onChange={setAngkutSearch}
                                    width="300px"
                                />
                                <FilterRange
                                    from={angkutFrom}
                                    to={angkutTo}
                                    onChange={(f, t) => { setAngkutFrom(f); setAngkutTo(t); }}
                                />
                            </div>
                            {angkutLoading
                                ? <div className="riwayat-loading">Memuat data...</div>
                                : <Table<PengangkutanItem>
                                    columns={ANGKUT_COLS}
                                    data={filteredAngkut}
                                    rowKey={(row) => row.pengangkutan_id}
                                    emptyMessage="Belum ada riwayat pengangkutan."
                                    onRowClick={(row) => navigate(`/bsi/riwayat/pengangkutan/${row.pengangkutan_id}`)}
                                  />
                            }
                        </div>
                    </div>
                )}
                {activeTab === "Statistik" && id && (
                    <div className="nasabah-tab-content" style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "0 24px 48px" }}>
                        <SetoranSampahDashboard bankId={id} />
                        {bank.jenis === "BSU"
                            ? <MasukSampahSection bankId={id} />
                            : <PenjualanSampahSection bankId={id} />
                        }
                        <KontribusiNasabahSection bankId={id} />
                    </div>
                )}
                {activeTab === "Bagi Hasil" && (
                    <div className="nasabah-tab-content">
                        <div className="bsu-table-section">
                            <div className="riwayat-filter-row">
                                <SearchBar
                                    placeholder="Cari ID bagi hasil atau distribusi..."
                                    value={bagiHasilBsuSearch}
                                    onChange={setBagiHasilBsuSearch}
                                    width="300px"
                                />
                                <FilterRange
                                    from={bagiHasilBsuFrom}
                                    to={bagiHasilBsuTo}
                                    onChange={(f, t) => { setBagiHasilBsuFrom(f); setBagiHasilBsuTo(t); }}
                                />
                            </div>
                            {bagiHasilBsuLoading
                                ? <div className="riwayat-loading">Memuat data...</div>
                                : <Table<BagiHasilBsuItem>
                                    columns={BAGI_HASIL_BSU_COLS}
                                    data={filteredBagiHasilBsu}
                                    rowKey={(row) => row.penerima_sisa_id}
                                    emptyMessage="Belum ada riwayat bagi hasil."
                                    onRowClick={(row) => navigate(`/bsi/distribusi-sisa-bsu/${row.penerima_sisa_id}`)}
                                  />
                            }
                        </div>
                    </div>
                )}
            </div>

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

            <PopupConfirmation
                isOpen={isDeleteConfirmOpen}
                type="danger"
                title="Hapus Bank Sampah?"
                message="Apakah Anda yakin ingin menghapus bank sampah ini? Tindakan ini tidak dapat dibatalkan."
                confirmText="Ya, Hapus"
                cancelText="Batal"
                onConfirm={doHapusBankSampah}
                onCancel={() => setIsDeleteConfirmOpen(false)}
            />

            <PopupInputKeterangan
                isOpen={isInputKeteranganOpen}
                title={bankProfile?.is_active ? "Kenapa bank sampah ini perlu dinonaktifkan?" : "Kenapa bank sampah ini diaktifkan kembali?"}
                onConfirm={(keterangan) => handleAktivasiBank(keterangan)}
                onCancel={() => setIsInputKeteranganOpen(false)}
            />

        </>
    );
}