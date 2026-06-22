import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/setoran-dashboard.css";
import "../styles/layout.css";
import "../styles/profil-bank.css";
import "../styles/nasabah.css";
import "../styles/regis-bsi.css";
import "../styles/riwayat.css";
import "../styles/jadwal-bsu.css";

import { useAuth } from "../contexts/AuthContext";
import { useProfilBankData } from "../hooks/useProfilBankData";
import {
    getBsuColumns, getAdminColumns, getNasabahColumns,
    ANGKUT_COLS, BAGI_HASIL_BSU_COLS,
} from "../constants/profil-bank.constants";

import { BankService } from "../services/bank.service";
import { ProfilService } from "../services/profil.service";
import { getApiError } from "../utils/error.utils";

import BreadcrumbLayout from "../layouts/breadcrumb";
import StatistikLayout from "../layouts/statistik";
import PopupConfirmation from "../layouts/popup-confirmation";
import PopupInputKeterangan from "../layouts/popup-input-keterangan";
import PopupNotifikasi from "../layouts/popup-notifikasi";

import Table from "../components/table";
import PopupMenu from "../components/popup-menu";
import ViewPhoto from "../components/view-photo";
import Tabs from "../components/tabs";
import FilterPill from "../components/filter-pill";
import FilterRange from "../components/filter-range";
import SearchBar from "../components/search";

import SetoranSampahDashboard from "../components/SetoranSampahDashboard";
import PenjualanSampahSection from "../components/PenjualanSampahSection";
import MasukSampahSection from "../components/MasukSampahSection";
import KontribusiNasabahSection from "../components/KontribusiNasabahSection";

import {
    FaGear, FaLocationDot, FaBuilding, FaUsers,
    FaCircleCheck, FaCircleXmark, FaClock,
    FaLayerGroup, FaToggleOff, FaTrashCan,
} from "react-icons/fa6";

export default function ProfilBankPage() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const isSuperadmin = user?.role === "superadmin";
    const isAdminBsi = user?.role === "admin_bsi";

    const isBsuUrl = location.pathname.includes("/bsu/");
    const isBsmUrl = location.pathname.includes("/bsm/");
    const isBsiUrl = !isBsuUrl && !isBsmUrl;

    const isBsu = isBsuUrl;
    const isBsm = isBsmUrl;
    const bankTypeLabel = isBsu ? "Bank Sampah Unit" : isBsm ? "Bank Sampah Mandiri" : "Bank Sampah Induk";
    const backPath = isSuperadmin
        ? (isBsu ? "/superadmin/bank-sampah/bsu" : isBsm ? "/superadmin/bank-sampah/bsm" : "/superadmin/bank-sampah/bsi")
        : (isBsu ? "/bsi/bsu" : "/bsi");

    const {
        bankProfile, setBankProfile,
        nasabahList, bsuList,
        staffFilter, setStaffFilter, filteredAdminList,
        angkutLoading, angkutFrom, setAngkutFrom, angkutTo, setAngkutTo,
        angkutSearch, setAngkutSearch, filteredAngkut,
        bagiHasilBsuLoading, bagiHasilBsuFrom, setBagiHasilBsuFrom,
        bagiHasilBsuTo, setBagiHasilBsuTo, bagiHasilBsuSearch, setBagiHasilBsuSearch,
        filteredBagiHasilBsu,
        totalBsu, aktifBsu, nonaktifBsu,
        totalNasabah, aktifNasabah, nonaktifNasabah, pendingNasabah,
    } = useProfilBankData({ id, isBsiUrl, isBsuUrl, userRole: user?.role });

    const [activeTab, setActiveTab] = useState(isBsiUrl ? "Bank Sampah Unit" : "Nasabah");

    // ── Popup states ──
    const [isActivationConfirmOpen, setIsActivationConfirmOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isInputKeteranganOpen, setIsInputKeteranganOpen] = useState(false);
    const [isPhotoOpen, setIsPhotoOpen] = useState(false);
    const [notif, setNotif] = useState<{ message: string; type: "success" | "error" | "warning" | "info"; navigate?: boolean } | null>(null);

    // ── Handlers ──
    const handleAktivasiBank = async (keterangan: string) => {
        if (!bankProfile || !id) return;
        try {
            await BankService.AktivasiBank(id, {
                admin_id: user?.identity_id || "",
                informasi: bankProfile.is_active ? "Bank sampah dinonaktifkan" : "Bank sampah diaktifkan",
                keterangan,
            });
            const isNowActive = !bankProfile.is_active;
            setBankProfile((prev) => prev ? { ...prev, is_active: isNowActive } : null);
            setIsInputKeteranganOpen(false);
            setNotif({ message: bankProfile.is_active ? "Bank sampah berhasil dinonaktifkan" : "Bank sampah berhasil diaktifkan", type: "success" });
        } catch {
            setNotif({ message: "Terjadi kesalahan saat mengubah status bank sampah", type: "error" });
        }
    };

    const doHapusBankSampah = async () => {
        if (!id) return;
        setIsDeleteConfirmOpen(false);
        try {
            await ProfilService.hapusBankSampah(id);
            setNotif({ message: "Bank sampah berhasil dihapus.", type: "success", navigate: true });
        } catch (error) {
            setNotif({ message: getApiError(error, "Terjadi kesalahan saat menghapus bank sampah."), type: "error" });
        }
    };

    if (!bankProfile) {
        return <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Memuat profil...</div>;
    }

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
        is_active: bankProfile.is_active,
    };

    const breadcrumbItems = isSuperadmin
        ? [{ label: "Bank Sampah", path: "/superadmin/bank-sampah" }, { label: bankTypeLabel, path: backPath }, { label: bank.nama }]
        : [{ label: bankTypeLabel, path: backPath }, { label: bank.nama }];

    const tabList = (bank.jenis === "BSI"
        ? ["Bank Sampah Unit", "Nasabah", "Staff", ...(isSuperadmin ? ["Statistik"] : [])]
        : isBsuUrl && isAdminBsi
            ? ["Nasabah", "Staff", "Pengangkutan", "Bagi Hasil"]
            : ["Nasabah", "Staff", ...(isSuperadmin ? ["Statistik"] : [])]
    ).map((t) => ({ id: t, label: t }));

    const canManage = isSuperadmin || isAdminBsi;

    return (
        <>
            <BreadcrumbLayout items={breadcrumbItems} />
            <br />

            {isPhotoOpen && bank.foto && (
                <ViewPhoto src={bank.foto} alt={bank.nama} onClose={() => setIsPhotoOpen(false)} />
            )}

            {notif && (
                <PopupNotifikasi
                    message={notif.message}
                    type={notif.type}
                    onClose={() => {
                        const shouldNav = notif.navigate;
                        setNotif(null);
                        if (shouldNav) navigate(backPath);
                    }}
                />
            )}

            {/* ── Profile Card ── */}
            <div className="profil-bank-card">
                <div className="profil-bank-left">
                    <div className="profil-bank-photo-wrapper">
                        <div
                            className="profil-bank-photo"
                            style={bank.foto ? { cursor: "pointer" } : undefined}
                            onClick={() => bank.foto && setIsPhotoOpen(true)}
                        >
                            {bank.foto
                                ? <img src={bank.foto} alt={bank.nama} />
                                : <div className="profil-bank-photo-fallback"><FaBuilding /></div>
                            }
                        </div>
                        <div className={`profil-bank-status-dot ${bank.is_active ? "active" : "inactive"}`} title={bank.is_active ? "Aktif" : "Nonaktif"} />
                    </div>
                    <span className="profil-bank-left-name">{bank.nama}</span>
                    <span className="profil-bank-id-label">{bank.id}</span>
                </div>

                <div className="profil-bank-right">
                    {canManage && (
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
                                        onClick: () => setIsActivationConfirmOpen(true),
                                    },
                                    ...(isSuperadmin ? [{
                                        label: "Hapus Bank Sampah",
                                        icon: <FaTrashCan />,
                                        variant: "danger" as const,
                                        onClick: () => setIsDeleteConfirmOpen(true),
                                    }] : []),
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
                            <div className="profil-bank-alamat-icon"><FaLocationDot /></div>
                            <div className="profil-bank-alamat-detail">
                                <div className="profil-bank-alamat-tags">
                                    {[bank.provinsi, bank.kota, bank.kecamatan, bank.kelurahan].map((t) => (
                                        <span key={t} className="profil-bank-alamat-tag">{t}</span>
                                    ))}
                                </div>
                                <p className="profil-bank-alamat-text">{bank.alamatLengkap}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tabs ── */}
            <Tabs
                tabs={tabList}
                activeTab={activeTab}
                onChange={(id) => setActiveTab(id)}
                className="profil-bank-tabs"
                style={{ marginBottom: "24px" }}
            />

            {/* ── Tab Content ── */}
            <div className="profil-bank-tab-content">
                {activeTab === "Bank Sampah Unit" && (
                    <div className="nasabah-tab-content">
                        <div className="statistik">
                            <StatistikLayout icon={FaLayerGroup} angka={totalBsu} status="Bank Sampah Unit" deskripsi="Total BSU secara keseluruhan" variant="default" />
                            <StatistikLayout icon={FaCircleCheck} angka={aktifBsu} status="Aktif" deskripsi="BSU yang aktif beroperasi" variant="success" />
                            <StatistikLayout icon={FaCircleXmark} angka={nonaktifBsu} status="Nonaktif" deskripsi="BSU yang tidak aktif atau suspended" variant="danger" />
                        </div>
                        <div className="bsu-table-section">
                            <Table columns={getBsuColumns()} data={bsuList} rowKey={(row) => row.bank_id} />
                        </div>
                    </div>
                )}

                {activeTab === "Nasabah" && (
                    <div className="nasabah-tab-content">
                        <div className="statistik">
                            <StatistikLayout icon={FaUsers} angka={totalNasabah} status="Total Nasabah" variant="default" />
                            <StatistikLayout icon={FaCircleCheck} angka={aktifNasabah} status="Aktif" variant="success" />
                            <StatistikLayout icon={FaCircleXmark} angka={nonaktifNasabah} status="Nonaktif" variant="danger" />
                            <StatistikLayout icon={FaClock} angka={pendingNasabah} status="Pending" variant="warning" />
                        </div>
                        <div className="bsu-table-section">
                            <Table columns={getNasabahColumns()} data={nasabahList} rowKey={(row) => row.nasabah_id} />
                        </div>
                    </div>
                )}

                {activeTab === "Staff" && (
                    <div className="nasabah-tab-content">
                        <div className="bsu-table-section">
                            <div className="nasabah-toolbar" style={{ display: "flex", marginBottom: "16px" }}>
                                <FilterPill
                                    options={[{ label: "Semua", value: "all" }, { label: "Admin", value: "admin" }, { label: "Petugas", value: "petugas" }]}
                                    activeValue={staffFilter}
                                    onChange={(val) => setStaffFilter(val)}
                                />
                            </div>
                            <Table columns={getAdminColumns()} data={filteredAdminList} rowKey={(row) => row.user_id} />
                        </div>
                    </div>
                )}

                {activeTab === "Pengangkutan" && (
                    <div className="nasabah-tab-content">
                        <div className="bsu-table-section">
                            <div className="riwayat-filter-row">
                                <SearchBar placeholder="Cari ID Pengangkutan..." value={angkutSearch} onChange={setAngkutSearch} width="300px" />
                                <FilterRange from={angkutFrom} to={angkutTo} onChange={(f, t) => { setAngkutFrom(f); setAngkutTo(t); }} />
                            </div>
                            {angkutLoading
                                ? <div className="riwayat-loading">Memuat data...</div>
                                : <Table columns={ANGKUT_COLS} data={filteredAngkut} rowKey={(row) => row.pengangkutan_id}
                                    emptyMessage="Belum ada riwayat pengangkutan."
                                    onRowClick={(row) => navigate(`/bsi/riwayat/pengangkutan/${row.pengangkutan_id}`)} />
                            }
                        </div>
                    </div>
                )}

                {activeTab === "Bagi Hasil" && (
                    <div className="nasabah-tab-content">
                        <div className="bsu-table-section">
                            <div className="riwayat-filter-row">
                                <SearchBar placeholder="Cari ID bagi hasil atau distribusi..." value={bagiHasilBsuSearch} onChange={setBagiHasilBsuSearch} width="300px" />
                                <FilterRange from={bagiHasilBsuFrom} to={bagiHasilBsuTo} onChange={(f, t) => { setBagiHasilBsuFrom(f); setBagiHasilBsuTo(t); }} />
                            </div>
                            {bagiHasilBsuLoading
                                ? <div className="riwayat-loading">Memuat data...</div>
                                : <Table columns={BAGI_HASIL_BSU_COLS} data={filteredBagiHasilBsu} rowKey={(row) => row.penerima_sisa_id}
                                    emptyMessage="Belum ada riwayat bagi hasil."
                                    onRowClick={(row) => navigate(`/bsi/distribusi-sisa-bsu/${row.penerima_sisa_id}`)} />
                            }
                        </div>
                    </div>
                )}

                {activeTab === "Statistik" && id && (
                    <div className="nasabah-tab-content" style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "0 24px 48px" }}>
                        <SetoranSampahDashboard bankId={id} />
                        {bank.jenis === "BSU" ? <MasukSampahSection bankId={id} /> : <PenjualanSampahSection bankId={id} />}
                        <KontribusiNasabahSection bankId={id} />
                    </div>
                )}
            </div>

            {/* ── Popups ── */}
            <PopupConfirmation
                isOpen={isActivationConfirmOpen}
                type={bankProfile.is_active ? "danger" : "warning"}
                title={bankProfile.is_active ? "Nonaktifkan Bank Sampah?" : "Aktifkan Bank Sampah?"}
                message={bankProfile.is_active
                    ? "Apakah Anda yakin ingin menonaktifkan bank sampah ini? Bank sampah tidak akan beroperasional untuk sementara."
                    : "Apakah Anda yakin ingin mengaktifkan kembali bank sampah ini? Bank sampah akan kembali beroperasional"
                }
                confirmText={bankProfile.is_active ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
                cancelText="Batal"
                onConfirm={() => { setIsActivationConfirmOpen(false); setIsInputKeteranganOpen(true); }}
                onCancel={() => setIsActivationConfirmOpen(false)}
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
                title={bankProfile.is_active ? "Kenapa bank sampah ini perlu dinonaktifkan?" : "Kenapa bank sampah ini diaktifkan kembali?"}
                onConfirm={(keterangan) => handleAktivasiBank(keterangan)}
                onCancel={() => setIsInputKeteranganOpen(false)}
            />
        </>
    );
}
