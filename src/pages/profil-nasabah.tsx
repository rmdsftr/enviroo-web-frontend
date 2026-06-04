import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import { ProfilService } from "../services/profil.service";
import { AuthService } from "../services/auth.service";
import type { ProfilNasabah, SaldoNasabah } from "../types/profil.type";
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
    FaMoneyBillWave,
    FaUserShield,
} from "react-icons/fa6";
import PopupAktivasiResult from "../layouts/popup-aktivasi-result";
import ViewPhoto from "../components/view-photo";
import Tabs from "../components/tabs";
import Table, { type ColumnDef, TableActionBtn } from "../components/table";
import FilterRange, { defaultMonthRange } from "../components/filter-range";
import SearchBar from "../components/search";
import "../styles/layout.css";
import "../styles/profil-nasabah.css";
import "../styles/riwayat.css";
import "../styles/jadwal-bsu.css";
import PopupMenu from "../components/popup-menu";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import { useAuth } from "../contexts/AuthContext";
import { formatTanggal, formatTanggalPanjang } from "../utils/date.utils";
import { getApiError } from "../utils/error.utils";
import { SetoranService, type RiwayatSetoranNasabahItem } from "../services/setoran.service";
import { BagiHasilService, type RiwayatBagiHasilNasabahItem } from "../services/bagi_hasil_penjualan.service";
import { PenarikanService, type PenarikanItem } from "../services/penarikan.service";

/* ── Setoran tab ── */
const STATUS_SETORAN: Record<string, { label: string; cls: string }> = {
    berhasil: { label: "Berhasil", cls: "selesai"    },
    pending:  { label: "Pending",  cls: "mendatang"  },
    gagal:    { label: "Gagal",    cls: "dibatalkan" },
};

const SETORAN_COLUMNS: ColumnDef<RiwayatSetoranNasabahItem>[] = [
    {
        key: "setoran_id",
        header: "ID Setoran",
        render: (row) => <span className="table-id">{row.setoran_id}</span>,
    },
    {
        key: "tanggal",
        header: "Tanggal Setoran",
        width: "160px",
        render: (row) => formatTanggal(row.transaksi_timestamp),
    },
    {
        key: "total_item",
        header: "Total Setoran",
        width: "130px",
        render: (row) => `${row.total_item} item`,
    },
    {
        key: "status_setoran",
        header: "Status Setoran",
        width: "140px",
        render: (row) => {
            const s = STATUS_SETORAN[row.status_setoran];
            return (
                <span className={`jbsu-status-pill ${s?.cls ?? row.status_setoran}`}>
                    {s?.label ?? row.status_setoran}
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

/* ── Bagi Hasil tab ── */
function fmtBh(total: number, satuan: string): string {
    const num = total.toLocaleString("id-ID");
    return satuan === "Rp" ? `Rp ${num}` : `${num} ${satuan}`;
}

const BAGI_HASIL_COLUMNS: ColumnDef<RiwayatBagiHasilNasabahItem>[] = [
    {
        key: "penerima_id",
        header: "ID Bagi Hasil",
        render: (row) => <span className="table-id">{row.penerima_id}</span>,
    },
    {
        key: "tanggal",
        header: "Tanggal",
        width: "160px",
        render: (row) => formatTanggal(row.tanggal),
    },
    {
        key: "reward",
        header: "Reward",
        width: "120px",
        render: (row) => row.reward,
    },
    {
        key: "total_diterima",
        header: "Total Diterima",
        width: "160px",
        render: (row) => fmtBh(row.total_diterima, row.satuan_diterima),
    },
    {
        key: "aksi",
        header: "Aksi",
        width: "70px",
        align: "center" as const,
        render: () => <TableActionBtn icon={FaEye} title="Lihat Detail" />,
    },
];

/* ── Penarikan tab ── */
const STATUS_PENARIKAN: Record<string, { label: string; cls: string }> = {
    pending:    { label: "Pending",    cls: "mendatang"  },
    berhasil:   { label: "Berhasil",   cls: "selesai"    },
    kadaluarsa: { label: "Kadaluarsa", cls: "dibatalkan" },
    dibatalkan: { label: "Dibatalkan", cls: "dibatalkan" },
};

const PENARIKAN_COLUMNS: ColumnDef<PenarikanItem>[] = [
    {
        key: "penarikan_id",
        header: "ID Penarikan",
        render: (row) => <span className="table-id">{row.penarikan_id}</span>,
    },
    {
        key: "nama_reward",
        header: "Nama Reward",
        width: "140px",
        render: (row) => row.nama_reward,
    },
    {
        key: "diajukan_pada",
        header: "Diajukan Pada",
        width: "160px",
        render: (row) => formatTanggal(row.created_at),
    },
    {
        key: "status_penarikan",
        header: "Status Penarikan",
        width: "150px",
        render: (row) => {
            const s = STATUS_PENARIKAN[row.status_penarikan];
            return (
                <span className={`jbsu-status-pill ${s?.cls ?? row.status_penarikan}`}>
                    {s?.label ?? row.status_penarikan}
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

type StatusNasabah = "aktif" | "nonaktif" | "pending";

const STATUS_CONFIG: Record<StatusNasabah, { label: string; color: string; bg: string; dot: string }> = {
    aktif:    { label: "Aktif",    color: "#4EA771", bg: "#4ea77223", dot: "#4EA771" },
    nonaktif: { label: "Nonaktif", color: "#b04040", bg: "rgba(220,80,80,0.10)",  dot: "#dc5050" },
    pending:  { label: "Pending",  color: "#8a6200", bg: "rgba(215,160,30,0.12)", dot: "#d7a01e" },
};

function formatRole(role?: string): string {
    if (!role) return "-";
    return role.split("_").map(w =>
        ["bsi", "bsu", "bsm"].includes(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)
    ).join(" ");
}

export default function ProfilNasabahPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const role = user?.role?.toLowerCase();
    const rolePrefix = role === "admin_bsi" ? "/bsi" : role === "admin_bsu" ? "/bsu" : role === "admin_bsm" ? "/bsm" : "/superadmin";

    const [nasabah, setNasabah] = useState<ProfilNasabah | null>(null);
    const [saldo, setSaldo] = useState<SaldoNasabah | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSaldo, setShowSaldo] = useState(false);
    const [showPhoto, setShowPhoto] = useState(false);
    const [activeTab, setActiveTab] = useState("setoran");

    const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
    const [reactivateData, setReactivateData] = useState<ReactivateNasabahResponse["data"] | null>(null);
    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);

    /* ── Setoran tab state ── */
    const [setoranList, setSetoranList] = useState<RiwayatSetoranNasabahItem[]>([]);
    const [setoranLoading, setSetoranLoading] = useState(false);
    const [setoranSearch, setSetoranSearch] = useState("");
    const [setoranFrom, setSetoranFrom] = useState(() => defaultMonthRange().from);
    const [setoranTo, setSetoranTo] = useState(() => defaultMonthRange().to);

    /* ── Bagi Hasil tab state ── */
    const [bagiHasilList, setBagiHasilList] = useState<RiwayatBagiHasilNasabahItem[]>([]);
    const [bagiHasilLoading, setBagiHasilLoading] = useState(false);
    const [bagiHasilSearch, setBagiHasilSearch] = useState("");
    const [bagiHasilFrom, setBagiHasilFrom] = useState(() => defaultMonthRange().from);
    const [bagiHasilTo, setBagiHasilTo] = useState(() => defaultMonthRange().to);

    /* ── Penarikan tab state ── */
    const [penarikanList, setPenarikanList] = useState<PenarikanItem[]>([]);
    const [penarikanLoading, setPenarikanLoading] = useState(false);
    const [penarikanSearch, setPenarikanSearch] = useState("");
    const [penarikanFrom, setPenarikanFrom] = useState(() => defaultMonthRange().from);
    const [penarikanTo, setPenarikanTo] = useState(() => defaultMonthRange().to);

    useEffect(() => {
        if (!id) return;
        Promise.all([
            ProfilService.getProfilNasabah(id),
            ProfilService.getSaldoNasabah(id),
        ])
            .then(([profilRes, saldoRes]) => {
                setNasabah(profilRes.data);
                setSaldo(saldoRes.data);
            })
            .catch(err => console.error("Gagal menarik data nasabah", err))
            .finally(() => setLoading(false));
    }, [id]);

    const fetchSetoran = useCallback(async () => {
        if (!id) return;
        try {
            setSetoranLoading(true);
            const data = await SetoranService.getListSetoranNasabah(id);
            setSetoranList(data);
        } catch {
            console.error("Gagal memuat riwayat setoran");
        } finally {
            setSetoranLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchSetoran(); }, [fetchSetoran]);

    const fetchBagiHasil = useCallback(async () => {
        if (!id) return;
        try {
            setBagiHasilLoading(true);
            const data = await BagiHasilService.getListBhNasabah(id);
            setBagiHasilList(data);
        } catch {
            console.error("Gagal memuat riwayat bagi hasil");
        } finally {
            setBagiHasilLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchBagiHasil(); }, [fetchBagiHasil]);

    const fetchPenarikan = useCallback(async () => {
        if (!id) return;
        try {
            setPenarikanLoading(true);
            const data = await PenarikanService.getListByNasabah(id);
            setPenarikanList(data);
        } catch {
            console.error("Gagal memuat riwayat penarikan");
        } finally {
            setPenarikanLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchPenarikan(); }, [fetchPenarikan]);

    const filteredSetoran = useMemo(() => {
        const q = setoranSearch.toLowerCase();
        return setoranList.filter(item => {
            const month = item.transaksi_timestamp.substring(0, 7);
            if (month < setoranFrom || month > setoranTo) return false;
            if (q) {
                return item.setoran_id.toLowerCase().includes(q) ||
                       item.nama_petugas.toLowerCase().includes(q);
            }
            return true;
        });
    }, [setoranList, setoranFrom, setoranTo, setoranSearch]);

    const filteredBagiHasil = useMemo(() => {
        const q = bagiHasilSearch.toLowerCase();
        return bagiHasilList.filter(item => {
            const month = item.tanggal.substring(0, 7);
            if (month < bagiHasilFrom || month > bagiHasilTo) return false;
            if (q) {
                return item.penerima_id.toLowerCase().includes(q) ||
                       item.bagi_hasil_id.toLowerCase().includes(q) ||
                       item.reward.toLowerCase().includes(q);
            }
            return true;
        });
    }, [bagiHasilList, bagiHasilFrom, bagiHasilTo, bagiHasilSearch]);

    const filteredPenarikan = useMemo(() => {
        const q = penarikanSearch.toLowerCase();
        return penarikanList.filter(item => {
            const month = item.created_at.substring(0, 7);
            if (month < penarikanFrom || month > penarikanTo) return false;
            if (q) {
                return item.penarikan_id.toLowerCase().includes(q) ||
                       item.nama_reward.toLowerCase().includes(q);
            }
            return true;
        });
    }, [penarikanList, penarikanFrom, penarikanTo, penarikanSearch]);

    if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#5a7a68" }}>Memuat profil nasabah...</div>;
    if (!nasabah) return <div style={{ padding: "40px", textAlign: "center", color: "#b04040" }}>Nasabah tidak ditemukan.</div>;

    const handleToggleAktivasi = async () => {
        if (!nasabah || !id) return;
        const isCurrentlyActive = nasabah.status_nasabah === "aktif";
        try {
            if (isCurrentlyActive) {
                await AuthService.deactivateAkun(nasabah.user_id, "nasabah");
                setNasabah(prev => prev ? { ...prev, status_nasabah: "nonaktif" } : null);
                setPopupNotif({ message: "Akun nasabah berhasil dinonaktifkan", type: "success" });
            } else {
                if (!user?.identity_id) {
                    setPopupNotif({ message: "Data admin tidak ditemukan. Silakan login kembali.", type: "warning" });
                    return;
                }
                const res = await AuthService.generateReactivateAkun(nasabah.user_id, user.identity_id, "nasabah");
                setReactivateData(res.data);
                setIsReactivateModalOpen(true);
                setNasabah(prev => prev ? { ...prev, status_nasabah: "pending" } : null);
            }
        } catch (error) {
            console.error("Gagal mengubah status nasabah:", error);
            setPopupNotif({ message: getApiError(error, "Terjadi kesalahan saat memproses status nasabah"), type: "error" });
        }
    };

    const statusConf = STATUS_CONFIG[(nasabah.status_nasabah as StatusNasabah) || "aktif"];
    const initials = nasabah.nama.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

    // Left col: NIK, Email, WhatsApp — Right col: Rekening, Bank, Bergabung
    // Interleaved order for 2-col grid: [NIK, Rekening, Email, Bank, WhatsApp, Bergabung]
    const INFO_ITEMS = [
        { icon: <FaIdCard />,       label: "NIK",              value: nasabah.user_id },
        { icon: <FaCreditCard />,   label: "No. Rekening",     value: nasabah.nomor_rekening },
        { icon: <FaEnvelope />,     label: "Email",            value: nasabah.email || "-" },
        { icon: <FaBuilding />,     label: "Bank Sampah",      value: nasabah.nama_bank || "-" },
        { icon: <FaWhatsapp />,     label: "No. WhatsApp",     value: nasabah.no_whatsapp || "-" },
        { icon: <FaCalendarDays />, label: "Bergabung Sejak",  value: nasabah.joined_at ? formatTanggalPanjang(nasabah.joined_at) : "-" },
    ];

    return (
        <>
            <BreadcrumbLayout
                items={[
                    { label: "Nasabah", path: `${rolePrefix}/nasabah` },
                    { label: nasabah.nama },
                ]}
            />
            <br />

            <div className="pn-card">
                {/* Settings button */}
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
                        ]}
                    />
                </div>

                {/* ── Profil Utama ── */}
                <div className="pn-identity">
                    <div
                        className="pn-avatar"
                        style={nasabah.photo_url ? { cursor: "zoom-in" } : undefined}
                        onClick={() => nasabah.photo_url && setShowPhoto(true)}
                    >
                        {nasabah.photo_url
                            ? <img src={nasabah.photo_url} alt={nasabah.nama} />
                            : <div className="pn-avatar-fallback">{initials}</div>
                        }
                    </div>
                    <div className="pn-identity-info">
                        <h1 className="pn-name">{nasabah.nama}</h1>
                        <span className="pn-rekening-chip">
                            <FaUser />
                            ID: {nasabah.nasabah_id}
                        </span>
                        <div className="pn-identity-meta">
                            <span className="pn-status-badge" style={{ color: statusConf.color, background: statusConf.bg }}>
                                <span className="pn-status-dot" style={{ background: statusConf.dot }} />
                                {statusConf.label}
                            </span>
                            <span className="pn-meta-sep">·</span>
                        </div>
                    </div>
                </div>

                {/* ── Informasi Detail ── */}
                <div className="pn-detail-section">
                    <span className="pn-detail-title">Informasi Detail Nasabah</span>
                    <div className="pn-info-grid">
                        {INFO_ITEMS.map(({ icon, label, value }) => (
                            <div className="pn-info-row" key={label}>
                                <div className="pn-info-icon">{icon}</div>
                                <div className="pn-info-text">
                                    <span className="pn-info-label">{label}</span>
                                    <span className="pn-info-value">{value}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Admin Banner (kondisional) ── */}
                {nasabah.is_admin && (
                    <div className="pn-admin-banner">
                        <div className="pn-admin-banner-icon">
                            <FaUserShield />
                        </div>
                        <p className="pn-admin-banner-text">
                            Akun ini juga terdaftar sebagai{" "}
                            <strong>{formatRole(nasabah.role_admin)}</strong>{" "}
                            di <strong>{nasabah.nama_bank_admin}</strong>{" "}
                            dengan ID <strong>{nasabah.admin_id}</strong>
                        </p>
                    </div>
                )}

                {/* ── Ringkasan Saldo Rekening ── */}
                <div className="pn-saldo-section">
                    <div className="pn-saldo-header">
                        <span className="pn-saldo-title">Ringkasan Saldo Rekening</span>
                        <button className="pn-saldo-toggle" onClick={() => setShowSaldo(v => !v)}>
                            {showSaldo ? <FaEyeSlash /> : <FaEye />}
                            {showSaldo ? "Sembunyikan" : "Tampilkan"}
                        </button>
                    </div>
                    <div className="pn-saldo-cards">
                        <div className="pn-saldo-card pn-saldo-card--green">
                            <div className="pn-saldo-icon"><FaMoneyBillWave /></div>
                            <div className="pn-saldo-body">
                                <span className="pn-saldo-number">
                                    {showSaldo
                                        ? `Rp ${(saldo?.uang.total_uang ?? 0).toLocaleString("id-ID")}`
                                        : "••••••••"}
                                </span>
                                <span className="pn-saldo-status">Total Uang</span>
                            </div>
                        </div>
                        <div className="pn-saldo-card pn-saldo-card--green">
                            <div className="pn-saldo-icon"><FaStar /></div>
                            <div className="pn-saldo-body">
                                <span className="pn-saldo-number">
                                    {showSaldo
                                        ? (saldo?.poin.total_poin ?? 0).toLocaleString("id-ID")
                                        : "••••••••"}
                                </span>
                                <span className="pn-saldo-status">Total Poin</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs
                tabs={[
                    { id: "setoran",    label: "Riwayat Setoran" },
                    { id: "bagi-hasil", label: "Riwayat Bagi Hasil" },
                    { id: "penarikan",  label: "Riwayat Penarikan" },
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
                style={{ margin: "16px 24px 16px 24px" }}
            />

            {/* ── Tab: Setoran ── */}
            {activeTab === "setoran" && (
                <div style={{ margin: "0 24px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div className="riwayat-filter-row">
                        <SearchBar
                            placeholder="Cari ID atau nama petugas..."
                            value={setoranSearch}
                            onChange={setSetoranSearch}
                            width="300px"
                        />
                        <FilterRange
                            from={setoranFrom}
                            to={setoranTo}
                            onChange={(f, t) => { setSetoranFrom(f); setSetoranTo(t); }}
                        />
                    </div>
                    {setoranLoading
                        ? <div className="riwayat-loading">Memuat data...</div>
                        : <Table<RiwayatSetoranNasabahItem>
                            columns={SETORAN_COLUMNS}
                            data={filteredSetoran}
                            rowKey={(row) => row.setoran_id}
                            emptyMessage="Belum ada riwayat setoran."
                            onRowClick={(row) => navigate(`${rolePrefix}/riwayat/setoran/${row.setoran_id}`)}
                          />
                    }
                </div>
            )}

            {/* ── Tab: Bagi Hasil ── */}
            {activeTab === "bagi-hasil" && (
                <div style={{ margin: "0 24px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div className="riwayat-filter-row">
                        <SearchBar
                            placeholder="Cari ID atau nama reward..."
                            value={bagiHasilSearch}
                            onChange={setBagiHasilSearch}
                            width="300px"
                        />
                        <FilterRange
                            from={bagiHasilFrom}
                            to={bagiHasilTo}
                            onChange={(f, t) => { setBagiHasilFrom(f); setBagiHasilTo(t); }}
                        />
                    </div>
                    {bagiHasilLoading
                        ? <div className="riwayat-loading">Memuat data...</div>
                        : <Table<RiwayatBagiHasilNasabahItem>
                            columns={BAGI_HASIL_COLUMNS}
                            data={filteredBagiHasil}
                            rowKey={(row) => row.penerima_id}
                            emptyMessage="Belum ada riwayat bagi hasil."
                            onRowClick={(row) => navigate(
                                `${rolePrefix}/bagi-hasil/penerima/${row.penerima_id}`,
                                { state: { bagiHasilId: row.bagi_hasil_id } }
                            )}
                          />
                    }
                </div>
            )}

            {/* ── Tab: Penarikan ── */}
            {activeTab === "penarikan" && (
                <div style={{ margin: "0 24px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div className="riwayat-filter-row">
                        <SearchBar
                            placeholder="Cari ID atau nama reward..."
                            value={penarikanSearch}
                            onChange={setPenarikanSearch}
                            width="300px"
                        />
                        <FilterRange
                            from={penarikanFrom}
                            to={penarikanTo}
                            onChange={(f, t) => { setPenarikanFrom(f); setPenarikanTo(t); }}
                        />
                    </div>
                    {penarikanLoading
                        ? <div className="riwayat-loading">Memuat data...</div>
                        : <Table<PenarikanItem>
                            columns={PENARIKAN_COLUMNS}
                            data={filteredPenarikan}
                            rowKey={(row) => row.penarikan_id}
                            emptyMessage="Belum ada riwayat penarikan."
                            onRowClick={(row) => navigate(`${rolePrefix}/riwayat/penarikan/${row.penarikan_id}`)}
                          />
                    }
                </div>
            )}

            {showPhoto && nasabah.photo_url && (
                <ViewPhoto
                    src={nasabah.photo_url}
                    alt={nasabah.nama}
                    onClose={() => setShowPhoto(false)}
                />
            )}

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
