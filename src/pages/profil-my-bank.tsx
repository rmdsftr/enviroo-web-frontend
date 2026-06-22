import { useState, useMemo } from "react";
import { formatTanggalPanjang } from "../utils/date.utils";
import { useNavigate } from "react-router-dom";
import { BankService } from "../services/bank.service";
import { AdminService } from "../services/admin.service";
import { AuthService } from "../services/auth.service";
import type { ReactivateNasabahResponse } from "../types/auth.type";
import {
    FaBuilding,
    FaLocationDot,
    FaCalendarDays,
    FaMoneyBillWave,
    FaStar,
    FaGear,
    FaToggleOff,
    FaUserPlus,
    FaPenToSquare,
} from "react-icons/fa6";
import "../styles/layout.css";
import "../styles/profil-my-bank.css";
import "../styles/profil-nasabah.css";
import "../styles/profil-bank.css";
import "../styles/nasabah.css";
import "../styles/regis-bsi.css";

import Tabs from "../components/tabs";
import Table from "../components/table";
import FilterPill from "../components/filter-pill";
import Button from "../components/button";
import ViewPhoto from "../components/view-photo";
import PopupMenu from "../components/popup-menu";
import PopupConfirmation from "../layouts/popup-confirmation";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import PopupAktivasiResult from "../layouts/popup-aktivasi-result";
import PopupInputKeterangan from "../layouts/popup-input-keterangan";

import { useProfilMyBankData } from "../hooks/useProfilMyBankData";
import { buildAdminColumns, HISTORY_COLUMNS, formatRupiah } from "../constants/profil-my-bank.constants";
import { EditProfilBankModal } from "../modals/EditProfilBankModal";
import { TambahAdminModal } from "../modals/TambahAdminModal";

export default function ProfilMyBankPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("Staff");

    const {
        user, logout, bankId,
        bank, saldo, loading,
        filteredAdminList, staffFilter, setStaffFilter,
        historyList,
        fetchBank, fetchAdminList,
        setAdminList,
    } = useProfilMyBankData(activeTab);

    // ── Modals ──
    const [showEditProfilModal, setShowEditProfilModal] = useState(false);
    const [showTambahAdminModal, setShowTambahAdminModal] = useState(false);

    // ── Popups ──
    const [isDeleteAdminOpen, setIsDeleteAdminOpen] = useState(false);
    const [pendingDeleteAdminId, setPendingDeleteAdminId] = useState<string | null>(null);
    const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
    const [reactivateData, setReactivateData] = useState<ReactivateNasabahResponse["data"] | null>(null);
    const [isActivationConfirmOpen, setIsActivationConfirmOpen] = useState(false);
    const [isInputKeteranganOpen, setIsInputKeteranganOpen] = useState(false);
    const [isPhotoOpen, setIsPhotoOpen] = useState(false);

    // ── Notif ──
    const [notif, setNotif] = useState<{ message: string; type: "success" | "error" | "warning" | "info" } | null>(null);
    const showNotif = (message: string, type: "success" | "error" | "warning" | "info") => setNotif({ message, type });

    // ── Handlers ──
    const handleEditProfilBank = async (formData: FormData) => {
        await BankService.editProfilBank(bankId, formData);
        await fetchBank();
        showNotif("Profil bank berhasil diperbarui.", "success");
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
            await fetchAdminList();
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
                await fetchBank();
                showNotif("Bank sampah berhasil diaktifkan.", "success");
            }
        } catch {
            showNotif("Terjadi kesalahan saat mengubah status bank sampah.", "error");
        }
    };

    const adminColumns = useMemo(
        () => buildAdminColumns(user?.identity_id ?? "", handleToggleAktivasiStaff, handleDeleteAdmin),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [user?.identity_id]
    );

    // ── Render ──
    if (loading) {
        return <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Memuat profil bank...</div>;
    }
    if (!bank) {
        return <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Data profil bank tidak ditemukan.</div>;
    }

    const isBsu = bank.is_bsu;

    return (
        <>
            {/* ── Aktivasi Bank ── */}
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

            {/* ── Hapus Staff ── */}
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
            {notif && (
                <PopupNotifikasi
                    message={notif.message}
                    type={notif.type}
                    onClose={() => setNotif(null)}
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
                                <div className="pmb-photo-fallback"><FaBuilding /></div>
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
                                { label: "Edit Profil Bank Sampah", icon: <FaPenToSquare />, onClick: () => setShowEditProfilModal(true) },
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
                        <Button color="primary" variant="solid" size="small" isRounded onClick={() => navigate("/profil-bank/mutasi-saldo")}>
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

            {/* ── Tabs ── */}
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
                                variant="solid" color="secondary" isRounded icon={<FaUserPlus />}
                                onClick={() => setShowTambahAdminModal(true)}
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

            {activeTab === "Log Akun Bank" && (
                <div className="nasabah-tab-content">
                    <div className="bsu-table-section">
                        <Table
                            columns={HISTORY_COLUMNS}
                            data={historyList}
                            rowKey={(row) => row.history_bank_id}
                            emptyMessage="Belum ada riwayat perubahan akun bank."
                        />
                    </div>
                </div>
            )}

            {/* ── Modals ── */}
            {showEditProfilModal && (
                <EditProfilBankModal
                    bank={bank}
                    adminId={user?.identity_id ?? ""}
                    onSubmit={handleEditProfilBank}
                    onClose={() => setShowEditProfilModal(false)}
                />
            )}

            {showTambahAdminModal && (
                <TambahAdminModal
                    bankId={bankId}
                    adminId={user?.identity_id ?? ""}
                    userRole={user?.role ?? ""}
                    onStaffAdded={fetchAdminList}
                    onClose={() => setShowTambahAdminModal(false)}
                    onSuccess={(msg) => { showNotif(msg, "success"); }}
                    onError={(msg) => { showNotif(msg, "error"); }}
                />
            )}
        </>
    );
}
