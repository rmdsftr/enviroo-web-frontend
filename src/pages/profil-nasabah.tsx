import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { AuthService } from "../services/auth.service";
import { NasabahService } from "../services/nasabah.service";
import type { ReactivateNasabahResponse } from "../types/auth.type";
import { useAuth } from "../contexts/AuthContext";
import { getApiError } from "../utils/error.utils";
import { formatTanggalPanjang } from "../utils/date.utils";
import "../styles/layout.css";
import "../styles/profil-nasabah.css";
import "../styles/riwayat.css";
import "../styles/jadwal-bsu.css";

import { useProfilNasabahData } from "../hooks/useProfilNasabahData";
import {
    STATUS_CONFIG, formatRole,
    SETORAN_COLUMNS, BAGI_HASIL_COLUMNS, PENARIKAN_COLUMNS,
    type StatusNasabah,
} from "../constants/profil-nasabah.constants";

import BreadcrumbLayout from "../layouts/breadcrumb";
import PopupAktivasiResult from "../layouts/popup-aktivasi-result";
import PopupConfirmation from "../layouts/popup-confirmation";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import PopupMenu from "../components/popup-menu";
import ViewPhoto from "../components/view-photo";
import Tabs from "../components/tabs";
import Table from "../components/table";
import FilterRange from "../components/filter-range";
import SearchBar from "../components/search";

import {
    FaUser, FaIdCard, FaEnvelope, FaWhatsapp, FaCreditCard, FaBuilding,
    FaGear, FaEye, FaEyeSlash, FaStar, FaCalendarDays,
    FaToggleOff, FaMoneyBillWave, FaUserShield, FaTrashCan,
} from "react-icons/fa6";
import { type RiwayatSetoranNasabahItem } from "../services/setoran.service";
import { type RiwayatBagiHasilNasabahItem } from "../services/bagi_hasil_penjualan.service";
import { type PenarikanItem } from "../services/penarikan.service";

export default function ProfilNasabahPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const role = user?.role?.toLowerCase();
    const rolePrefix = role === "admin_bsi" ? "/bsi" : role === "admin_bsu" ? "/bsu" : role === "admin_bsm" ? "/bsm" : "/superadmin";

    const {
        nasabah, setNasabah, saldo, loading,
        setoranLoading, setoranSearch, setSetoranSearch,
        setoranFrom, setSetoranFrom, setoranTo, setSetoranTo, filteredSetoran,
        bagiHasilLoading, bagiHasilSearch, setBagiHasilSearch,
        bagiHasilFrom, setBagiHasilFrom, bagiHasilTo, setBagiHasilTo, filteredBagiHasil,
        penarikanLoading, penarikanSearch, setPenarikanSearch,
        penarikanFrom, setPenarikanFrom, penarikanTo, setPenarikanTo, filteredPenarikan,
    } = useProfilNasabahData(id);

    // ── UI states ──
    const [showSaldo, setShowSaldo] = useState(false);
    const [showPhoto, setShowPhoto] = useState(false);
    const [activeTab, setActiveTab] = useState("setoran");
    const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
    const [reactivateData, setReactivateData] = useState<ReactivateNasabahResponse["data"] | null>(null);
    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // ── Handlers ──
    const handleToggleAktivasi = async () => {
        if (!nasabah || !id) return;
        const isCurrentlyActive = nasabah.status_nasabah === "aktif";
        try {
            if (isCurrentlyActive) {
                await AuthService.deactivateAkun(nasabah.user_id, "nasabah");
                setNasabah((prev) => prev ? { ...prev, status_nasabah: "nonaktif" } : null);
                setPopupNotif({ message: "Akun nasabah berhasil dinonaktifkan", type: "success" });
            } else {
                if (!user?.identity_id) {
                    setPopupNotif({ message: "Data admin tidak ditemukan. Silakan login kembali.", type: "warning" });
                    return;
                }
                const res = await AuthService.generateReactivateAkun(nasabah.user_id, user.identity_id, "nasabah");
                setReactivateData(res.data);
                setIsReactivateModalOpen(true);
                setNasabah((prev) => prev ? { ...prev, status_nasabah: "pending" } : null);
            }
        } catch (error) {
            setPopupNotif({ message: getApiError(error, "Terjadi kesalahan saat memproses status nasabah"), type: "error" });
        }
    };

    const handleDeleteNasabah = async () => {
        if (!nasabah) return;
        try {
            await NasabahService.deleteNasabah(nasabah.nasabah_id);
            setPopupNotif({ message: "Nasabah berhasil dihapus", type: "success" });
            setTimeout(() => navigate(`${rolePrefix}/nasabah`), 1500);
        } catch (error) {
            setPopupNotif({ message: getApiError(error, "Gagal menghapus nasabah"), type: "error" });
        }
    };

    if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#5a7a68" }}>Memuat profil nasabah...</div>;
    if (!nasabah) return <div style={{ padding: "40px", textAlign: "center", color: "#b04040" }}>Nasabah tidak ditemukan.</div>;

    const statusConf = STATUS_CONFIG[(nasabah.status_nasabah as StatusNasabah) || "aktif"];
    const initials = nasabah.nama.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

    const INFO_ITEMS = [
        { icon: <FaIdCard />,       label: "NIK",             value: nasabah.user_id },
        { icon: <FaCreditCard />,   label: "No. Rekening",    value: nasabah.nomor_rekening },
        { icon: <FaEnvelope />,     label: "Email",           value: nasabah.email || "-" },
        { icon: <FaBuilding />,     label: "Bank Sampah",     value: nasabah.nama_bank || "-" },
        { icon: <FaWhatsapp />,     label: "No. WhatsApp",    value: nasabah.no_whatsapp || "-" },
        { icon: <FaCalendarDays />, label: "Bergabung Sejak", value: nasabah.joined_at ? formatTanggalPanjang(nasabah.joined_at) : "-" },
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
                {/* ── Settings ── */}
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
                            ...(nasabah.status_nasabah === "pending" || nasabah.status_nasabah === "nonaktif"
                                ? [{ label: "Hapus Nasabah", icon: <FaTrashCan />, variant: "danger" as const, onClick: () => setShowDeleteConfirm(true) }]
                                : []
                            ),
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

                {/* ── Admin Banner ── */}
                {nasabah.is_admin && (
                    <div className="pn-admin-banner">
                        <div className="pn-admin-banner-icon"><FaUserShield /></div>
                        <p className="pn-admin-banner-text">
                            Akun ini juga terdaftar sebagai <strong>{formatRole(nasabah.role_admin)}</strong>{" "}
                            di <strong>{nasabah.nama_bank_admin}</strong>{" "}
                            dengan ID <strong>{nasabah.admin_id}</strong>
                        </p>
                    </div>
                )}

                {/* ── Saldo ── */}
                <div className="pn-saldo-section">
                    <div className="pn-saldo-header">
                        <span className="pn-saldo-title">Ringkasan Saldo Rekening</span>
                        <button className="pn-saldo-toggle" onClick={() => setShowSaldo((v) => !v)}>
                            {showSaldo ? <FaEyeSlash /> : <FaEye />}
                            {showSaldo ? "Sembunyikan" : "Tampilkan"}
                        </button>
                    </div>
                    <div className="pn-saldo-cards">
                        <div className="pn-saldo-card pn-saldo-card--green">
                            <div className="pn-saldo-icon"><FaMoneyBillWave /></div>
                            <div className="pn-saldo-body">
                                <span className="pn-saldo-number">
                                    {showSaldo ? `Rp ${(saldo?.uang.total_uang ?? 0).toLocaleString("id-ID")}` : "••••••••"}
                                </span>
                                <span className="pn-saldo-status">Total Uang</span>
                            </div>
                        </div>
                        <div className="pn-saldo-card pn-saldo-card--green">
                            <div className="pn-saldo-icon"><FaStar /></div>
                            <div className="pn-saldo-body">
                                <span className="pn-saldo-number">
                                    {showSaldo ? (saldo?.poin.total_poin ?? 0).toLocaleString("id-ID") : "••••••••"}
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
                        <SearchBar placeholder="Cari ID atau nama petugas..." value={setoranSearch} onChange={setSetoranSearch} width="300px" />
                        <FilterRange from={setoranFrom} to={setoranTo} onChange={(f, t) => { setSetoranFrom(f); setSetoranTo(t); }} />
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
                        <SearchBar placeholder="Cari ID atau nama reward..." value={bagiHasilSearch} onChange={setBagiHasilSearch} width="300px" />
                        <FilterRange from={bagiHasilFrom} to={bagiHasilTo} onChange={(f, t) => { setBagiHasilFrom(f); setBagiHasilTo(t); }} />
                    </div>
                    {bagiHasilLoading
                        ? <div className="riwayat-loading">Memuat data...</div>
                        : <Table<RiwayatBagiHasilNasabahItem>
                            columns={BAGI_HASIL_COLUMNS}
                            data={filteredBagiHasil}
                            rowKey={(row) => row.penerima_id}
                            emptyMessage="Belum ada riwayat bagi hasil."
                            onRowClick={(row) => navigate(`${rolePrefix}/bagi-hasil/penerima/${row.penerima_id}`, { state: { bagiHasilId: row.bagi_hasil_id } })}
                          />
                    }
                </div>
            )}

            {/* ── Tab: Penarikan ── */}
            {activeTab === "penarikan" && (
                <div style={{ margin: "0 24px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div className="riwayat-filter-row">
                        <SearchBar placeholder="Cari ID atau nama reward..." value={penarikanSearch} onChange={setPenarikanSearch} width="300px" />
                        <FilterRange from={penarikanFrom} to={penarikanTo} onChange={(f, t) => { setPenarikanFrom(f); setPenarikanTo(t); }} />
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
                <ViewPhoto src={nasabah.photo_url} alt={nasabah.nama} onClose={() => setShowPhoto(false)} />
            )}

            <PopupAktivasiResult
                isOpen={isReactivateModalOpen}
                onClose={() => setIsReactivateModalOpen(false)}
                data={reactivateData}
                description="Berikan informasi berikut kepada nasabah untuk proses aktivasi akun mereka."
            />

            <PopupConfirmation
                isOpen={showDeleteConfirm}
                type="danger"
                title="Hapus Nasabah"
                message={`Apakah kamu yakin ingin menghapus nasabah "${nasabah.nama}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Ya, Hapus"
                cancelText="Batal"
                onConfirm={() => { setShowDeleteConfirm(false); handleDeleteNasabah(); }}
                onCancel={() => setShowDeleteConfirm(false)}
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
