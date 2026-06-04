import { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
    FaPlus, FaClockRotateLeft,
    FaCalendarCheck, FaCalendarPlus, FaEye,
} from "react-icons/fa6";
import JadwalPenimbanganCalendar from "../../layouts/jadwal-penimbangan-calendar";
import JadwalPengangkutanCalendar from "../../layouts/jadwal-pengangkutan-calendar";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/button";
import Dropdown from "../../components/dropdown";
import Input from "../../components/input";
import CloseButton from "../../components/close-button";
import Tabs from "../../components/tabs";
import PopupNotifikasi from "../../layouts/popup-notifikasi";
import PopupConfirmation from "../../layouts/popup-confirmation";
import Table, { type ColumnDef, TableActionBtn } from "../../components/table";
import FilterRange, { defaultMonthRange } from "../../components/filter-range";
import { JadwalService, type JadwalItem } from "../../services/jadwal.service";
import { BsiService } from "../../services/bsi.service";
import { PenimbanganService, type PenimbanganItem } from "../../services/penimbangan.service";
import { PengangkutanService, type PengangkutanItem } from "../../services/pengangkutan.service";
import "../../styles/jadwal-bsu.css";
import { formatTanggal, formatJam } from "../../utils/date.utils";

type ActiveTab = "penimbangan" | "pengangkutan";

/* ── Constants ── */
const HARI_OPTIONS = [
    { label: "Senin", value: "senin" }, { label: "Selasa", value: "selasa" },
    { label: "Rabu", value: "rabu" },   { label: "Kamis", value: "kamis" },
    { label: "Jumat", value: "jumat" }, { label: "Sabtu", value: "sabtu" },
    { label: "Minggu", value: "minggu" },
];
const MINGGU_OPTIONS = [
    { label: "Minggu ke-1", value: "1" }, { label: "Minggu ke-2", value: "2" },
    { label: "Minggu ke-3", value: "3" }, { label: "Minggu ke-4", value: "4" },
    { label: "Minggu ke-5", value: "5" },
];
/* ── Helpers ── */
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

const getLocalISODate = (d: Date) => {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${dy}`;
};

const getWeekOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return Math.ceil((date.getDate() + firstDay) / 7);
};

/* ── Dummy riwayat ── */
const STATUS_PENIMBANGAN: Record<string, { label: string; cls: string }> = {
    aktif: { label: "Berlangsung", cls: "berlangsung" },
    selesai: { label: "Selesai", cls: "selesai" },
    dibatalkan: { label: "Dibatalkan", cls: "dibatalkan" },
};

const RIWAYAT_COLUMNS: ColumnDef<PenimbanganItem>[] = [
    {
        key: "penimbangan_id",
        header: "ID Penimbangan",
        render: (row) => row.penimbangan_id,
    },
    {
        key: "tanggal",
        header: "Tanggal",
        width: "120px",
        render: (row) => row.started_at
            ? formatTanggal(row.started_at)
            : "—",
    },
    {
        key: "jam_mulai",
        header: "Jam Mulai",
        width: "100px",
        render: (row) => row.started_at
            ? formatJam(row.started_at)
            : "—",
    },
    {
        key: "jam_selesai",
        header: "Jam Selesai",
        width: "100px",
        render: (row) => row.ended_at
            ? formatJam(row.ended_at)
            : "—",
    },
    {
        key: "status",
        header: "Status Penimbangan",
        width: "160px",
        render: (row) => {
            const s = STATUS_PENIMBANGAN[row.status_penimbangan];
            return (
                <span className={`jbsu-status-pill ${s?.cls ?? row.status_penimbangan}`}>
                    {s?.label ?? row.status_penimbangan}
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

const STATUS_PENGANGKUTAN: Record<string, { label: string; cls: string }> = {
    completed: { label: "Selesai", cls: "selesai" },
    otw: { label: "Dalam Perjalanan", cls: "berlangsung" },
    requested: { label: "Diminta", cls: "mendatang" },
};

const RIWAYAT_ANGKUT_COLUMNS: ColumnDef<PengangkutanItem>[] = [
    {
        key: "pengangkutan_id",
        header: "ID Pengangkutan",
        render: (row) => row.pengangkutan_id,
    },
    {
        key: "tanggal",
        header: "Tanggal Pengangkutan",
        width: "160px",
        render: (row) => row.changed_at
            ? formatTanggal(row.changed_at)
            : "—",
    },
    {
        key: "angkut_ke",
        header: "Angkut Ke",
        render: (row) => row.nama_bsu,
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

/* ============================================================
   COMPONENT
   ============================================================ */
export default function JadwalBsiPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    /* Tab */
    const [activeTab, setActiveTab] = useState<ActiveTab>("penimbangan");

    /* API data */
    const [penimbanganList, setPenimbanganList] = useState<JadwalItem[]>([]);
    const [pengangkutanList, setPengangkutanList] = useState<JadwalItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [bsuOptions, setBsuOptions] = useState<{ label: string; value: string }[]>([]);

    /* Calendar state moved into JadwalPenimbanganCalendar */

    /* Modal */
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalJenis, setModalJenis] = useState<"penimbangan" | "pengangkutan">("penimbangan");
    const [editJadwalId, setEditJadwalId] = useState<string | null>(null);
    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });
    const [deleteJadwalId, setDeleteJadwalId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /* Form */
    const [formType, setFormType] = useState<"rutin" | "spesial">("rutin");
    const [formHari, setFormHari] = useState("");
    const [formMingguKe, setFormMingguKe] = useState("");
    const [formTanggal, setFormTanggal] = useState("");
    const [formNamaSpesial, setFormNamaSpesial] = useState("");
    const [formJamMulai, setFormJamMulai] = useState("");
    const [formJamSelesai, setFormJamSelesai] = useState("");
    const [formTargetBankId, setFormTargetBankId] = useState("");
    const [formError, setFormError] = useState("");

    /* Riwayat penimbangan */
    const [riwayatList, setRiwayatList] = useState<PenimbanganItem[]>([]);
    const [riwayatLoading, setRiwayatLoading] = useState(false);
    const [riwayatFrom, setRiwayatFrom] = useState(() => defaultMonthRange().from);
    const [riwayatTo, setRiwayatTo] = useState(() => defaultMonthRange().to);

    /* Riwayat pengangkutan */
    const [angkutList, setAngkutList] = useState<PengangkutanItem[]>([]);
    const [angkutLoading, setAngkutLoading] = useState(false);
    const [riwayatAngkutFrom, setRiwayatAngkutFrom] = useState(() => defaultMonthRange().from);
    const [riwayatAngkutTo, setRiwayatAngkutTo] = useState(() => defaultMonthRange().to);

    /* ── Fetch ── */
    const fetchJadwal = useCallback(async () => {
        if (!user?.bank_id) return;
        try {
            setLoading(true);
            const res = await JadwalService.getJadwalBank(user.bank_id);
            setPenimbanganList(res.data.penimbangan ?? []);
            setPengangkutanList(res.data.pengangkutan ?? []);
        } catch {
            setNotif({ show: true, message: "Gagal memuat jadwal", type: "error" });
        } finally {
            setLoading(false);
        }
    }, [user?.bank_id]);

    useEffect(() => { fetchJadwal(); }, [fetchJadwal]);

    useEffect(() => {
        const fetchBsus = async () => {
            if (!user?.bank_id) return;
            try {
                const res = await BsiService.getUnit(user.bank_id);
                setBsuOptions((res.data || []).map(b => ({ label: b.NamaBank, value: b.BankID })));
            } catch (err) {
                console.error("Gagal memuat daftar BSU", err);
            }
        };
        fetchBsus();
    }, [user?.bank_id]);

    const fetchRiwayat = useCallback(async () => {
        if (!user?.bank_id) return;
        try {
            setRiwayatLoading(true);
            const data = await PenimbanganService.getPenimbanganByBank(user.bank_id);
            setRiwayatList(data);
        } catch {
            console.error("Gagal memuat riwayat penimbangan");
        } finally {
            setRiwayatLoading(false);
        }
    }, [user?.bank_id]);

    useEffect(() => { fetchRiwayat(); }, [fetchRiwayat]);

    const fetchRiwayatAngkut = useCallback(async () => {
        if (!user?.bank_id) return;
        try {
            setAngkutLoading(true);
            const data = await PengangkutanService.getPengangkutanByBank(user.bank_id);
            setAngkutList(data);
        } catch {
            console.error("Gagal memuat riwayat pengangkutan");
        } finally {
            setAngkutLoading(false);
        }
    }, [user?.bank_id]);

    useEffect(() => { fetchRiwayatAngkut(); }, [fetchRiwayatAngkut]);

    const filteredRiwayatPenimbangan = useMemo(() =>
        riwayatList.filter(item => {
            if (!item.started_at) return false;
            const month = item.started_at.substring(0, 7);
            return month >= riwayatFrom && month <= riwayatTo;
        }),
        [riwayatList, riwayatFrom, riwayatTo]
    );

    /* Calendar helpers moved into JadwalPenimbanganCalendar */


    const filteredRiwayatAngkut = useMemo(() =>
        angkutList.filter(item => {
            if (!item.changed_at) return false;
            const month = item.changed_at.substring(0, 7);
            return month >= riwayatAngkutFrom && month <= riwayatAngkutTo;
        }),
        [angkutList, riwayatAngkutFrom, riwayatAngkutTo]
    );

    /* ── Modal handlers ── */
    const handleOpenModal = (jenis: "penimbangan" | "pengangkutan", item?: JadwalItem) => {
        setModalJenis(jenis);
        setFormError("");
        if (item) {
            setEditJadwalId(item.jadwal_id);
            setFormType(item.is_rutin ? "rutin" : "spesial");
            setFormHari(item.hari || "senin");
            setFormMingguKe(String(item.minggu_ke || 1));
            setFormJamMulai(formatTime(item.jam_mulai));
            setFormJamSelesai(formatTime(item.jam_selesai));
            setFormTanggal(item.tanggal ? getLocalISODate(new Date(item.tanggal)) : "");
            setFormNamaSpesial(item.nama_jadwal_spesial || "");
            setFormTargetBankId(item.target_bank_id || "");
        } else {
            setEditJadwalId(null);
            setFormType("rutin"); setFormHari("senin"); setFormMingguKe("1");
            setFormJamMulai(""); setFormJamSelesai("");
            setFormTanggal(""); setFormNamaSpesial(""); setFormTargetBankId("");
        }
        setIsModalOpen(true);
    };
    const handleCloseModal = () => { setIsModalOpen(false); setEditJadwalId(null); setFormError(""); };

    const handleSubmit = async () => {
        if (!formJamMulai || !formJamSelesai) { setFormError("Jam mulai dan jam selesai wajib diisi"); return; }
        if (formType === "spesial" && !formTanggal) { setFormError("Tanggal wajib diisi untuk jadwal spesial"); return; }
        if (modalJenis === "pengangkutan" && !formTargetBankId) { setFormError("Target BSU wajib dipilih"); return; }
        setIsSubmitting(true); setFormError("");
        const data = {
            hari: formType === "rutin" ? formHari : "",
            minggu_ke: formType === "rutin" ? parseInt(formMingguKe) : 0,
            jam_mulai: formJamMulai, jam_selesai: formJamSelesai,
            jenis_jadwal: modalJenis,
            is_active: true, is_rutin: formType === "rutin",
            tanggal: formType === "spesial" ? formTanggal : "",
            nama_jadwal_spesial: formType === "spesial" ? formNamaSpesial.trim() : "",
            target_bank_id: modalJenis === "pengangkutan" ? formTargetBankId : "",
            admin_id: user!.identity_id,
        };
        try {
            if (editJadwalId) {
                await JadwalService.updateJadwal(editJadwalId, data);
                setNotif({ show: true, message: "Jadwal berhasil diperbarui!", type: "success" });
            } else {
                await JadwalService.addJadwal(user!.bank_id, data);
                setNotif({ show: true, message: "Jadwal berhasil ditambahkan!", type: "success" });
            }
            handleCloseModal(); fetchJadwal();
        } catch {
            setNotif({ show: true, message: "Gagal menyimpan jadwal", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteJadwalId) return;
        try {
            await JadwalService.deleteJadwal(deleteJadwalId);
            setNotif({ show: true, message: "Jadwal berhasil dihapus!", type: "success" });
            fetchJadwal();
        } catch {
            setNotif({ show: true, message: "Gagal menghapus jadwal", type: "error" });
        } finally {
            setDeleteJadwalId(null);
        }
    };

    /* ============================================================
       RENDER
       ============================================================ */
    return (
        <div className="jbsu">

            {notif.show && (
                <PopupNotifikasi message={notif.message} type={notif.type}
                    onClose={() => setNotif(prev => ({ ...prev, show: false }))} />
            )}
            <PopupConfirmation
                isOpen={!!deleteJadwalId} type="danger" title="Hapus Jadwal"
                message="Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan."
                confirmText="Hapus Jadwal" cancelText="Batal"
                onConfirm={confirmDelete} onCancel={() => setDeleteJadwalId(null)}
            />

            {/* ── Header ── */}
            <div className="jbsu-header">
                <div className="jbsu-header-left">
                    <h1>Manajemen Jadwal</h1>
                    <p>Kelola jadwal penimbangan dan pengangkutan BSI Anda</p>
                </div>
                {activeTab === "penimbangan" && (
                    <Button variant="solid" color="secondary" isRounded icon={<FaPlus />} onClick={() => handleOpenModal("penimbangan")}>
                        Tambah Jadwal Penimbangan
                    </Button>
                )}
                {activeTab === "pengangkutan" && (
                    <Button variant="solid" color="secondary" isRounded icon={<FaPlus />} onClick={() => handleOpenModal("pengangkutan")}>
                        Tambah Jadwal Pengangkutan
                    </Button>
                )}
            </div>

            {/* ── Tabs ── */}
            <Tabs
                tabs={[
                    { id: "penimbangan", label: "Jadwal Penimbangan" },
                    { id: "pengangkutan", label: "Jadwal Pengangkutan" },
                ]}
                activeTab={activeTab}
                onChange={(id) => setActiveTab(id as ActiveTab)}
                style={{ alignSelf: "flex-start" }}
            />

            {/* ══════════════════════════════════════════
               TAB: JADWAL PENIMBANGAN
               ══════════════════════════════════════════ */}
            {activeTab === "penimbangan" && (
                <>
                    <JadwalPenimbanganCalendar
                        jadwalList={penimbanganList}
                        loading={loading}
                        onEdit={(item) => handleOpenModal("penimbangan", item)}
                        onDelete={setDeleteJadwalId}
                    />

                    {/* Riwayat Penimbangan */}
                    <div className="jbsu-card">
                        <div className="jbsu-section-header">
                            <span className="jbsu-card-title-icon" style={{ background: "#013236" }}>
                                <FaClockRotateLeft />
                            </span>
                            <div>
                                <h2 className="jbsu-card-title">Riwayat Penimbangan</h2>
                                <p className="jbsu-card-sub">Riwayat pelaksanaan penimbangan</p>
                            </div>
                            <div className="jbsu-section-header-right">
                                <FilterRange
                                    from={riwayatFrom}
                                    to={riwayatTo}
                                    onChange={(f, t) => { setRiwayatFrom(f); setRiwayatTo(t); }}
                                />
                            </div>
                        </div>
                        {riwayatLoading ? (
                            <div className="jbsu-empty"><span>Memuat riwayat...</span></div>
                        ) : (
                            <Table<PenimbanganItem>
                                columns={RIWAYAT_COLUMNS}
                                data={filteredRiwayatPenimbangan}
                                rowKey={(row) => row.penimbangan_id}
                                emptyMessage="Belum ada riwayat penimbangan."
                                onRowClick={(row) => navigate(`/bsi/riwayat/penimbangan/${row.penimbangan_id}`)}
                            />
                        )}
                    </div>
                </>
            )}

            {/* ══════════════════════════════════════════
               TAB: JADWAL PENGANGKUTAN
               ══════════════════════════════════════════ */}
            {activeTab === "pengangkutan" && (
                <>
                    <JadwalPengangkutanCalendar
                        jadwalList={pengangkutanList}
                        loading={loading}
                        onEdit={(item) => handleOpenModal("pengangkutan", item)}
                        onDelete={setDeleteJadwalId}
                        getBankLabel={(item) => item.target_bank_name || undefined}
                    />

                    {/* Riwayat Pengangkutan */}
                    <div className="jbsu-card">
                        <div className="jbsu-section-header">
                            <span className="jbsu-card-title-icon" style={{ background: "#013236" }}>
                                <FaClockRotateLeft />
                            </span>
                            <div>
                                <h2 className="jbsu-card-title">Riwayat Pengangkutan</h2>
                                <p className="jbsu-card-sub">Riwayat pelaksanaan pengangkutan sampah</p>
                            </div>
                            <div className="jbsu-section-header-right">
                                <FilterRange
                                    from={riwayatAngkutFrom}
                                    to={riwayatAngkutTo}
                                    onChange={(f, t) => { setRiwayatAngkutFrom(f); setRiwayatAngkutTo(t); }}
                                />
                            </div>
                        </div>
                        {angkutLoading ? (
                            <div className="jbsu-empty"><span>Memuat riwayat...</span></div>
                        ) : (
                            <Table<PengangkutanItem>
                                columns={RIWAYAT_ANGKUT_COLUMNS}
                                data={filteredRiwayatAngkut}
                                rowKey={(row) => row.pengangkutan_id}
                                emptyMessage="Belum ada riwayat pengangkutan."
                                onRowClick={(row) => navigate(`/bsi/riwayat/pengangkutan/${row.pengangkutan_id}`)}
                            />
                        )}
                    </div>
                </>
            )}


            {/* ── Modal ── */}
            {isModalOpen && createPortal(
                <div className="jmodal-overlay" onClick={handleCloseModal}>
                    <div className="jmodal-box" onClick={e => e.stopPropagation()}>
                        <div className="jmodal-header">
                            <div>
                                <h2 className="jmodal-title">
                                    {editJadwalId ? "Edit" : "Tambah"} Jadwal {modalJenis === "penimbangan" ? "Penimbangan" : "Pengangkutan"}
                                </h2>
                                <p className="jmodal-sub">
                                    {editJadwalId ? "Perbarui informasi jadwal" : "Tambahkan jadwal rutin atau spesial"}
                                </p>
                            </div>
                            <CloseButton onClick={handleCloseModal} />
                        </div>
                        <div className="jmodal-type-toggle" style={{ opacity: editJadwalId ? 0.6 : 1 }}>
                            <button className={`jmodal-type-btn ${formType === "rutin" ? "active" : ""}`}
                                onClick={() => { if (!editJadwalId) { setFormType("rutin"); setFormError(""); } }}
                                disabled={!!editJadwalId} style={{ cursor: editJadwalId ? "not-allowed" : "pointer" }}>
                                <FaCalendarCheck style={{ marginRight: 6 }} /> Jadwal Rutin
                            </button>
                            <button className={`jmodal-type-btn ${formType === "spesial" ? "active" : ""}`}
                                onClick={() => { if (!editJadwalId) { setFormType("spesial"); setFormError(""); } }}
                                disabled={!!editJadwalId} style={{ cursor: editJadwalId ? "not-allowed" : "pointer" }}>
                                <FaCalendarPlus style={{ marginRight: 6 }} /> Jadwal Spesial
                            </button>
                        </div>
                        <div className="jmodal-form">
                            {formType === "rutin" ? (
                                <>
                                    <div className="jmodal-field">
                                        <label className="jmodal-label">Hari</label>
                                        <Dropdown options={HARI_OPTIONS} placeholder="Pilih hari..."
                                            value={formHari} onChange={(e) => setFormHari(e.target.value)} fullWidth />
                                    </div>
                                    <div className="jmodal-field">
                                        <label className="jmodal-label">Minggu ke</label>
                                        <Dropdown options={MINGGU_OPTIONS} placeholder="Pilih minggu..."
                                            value={formMingguKe} onChange={(e) => setFormMingguKe(e.target.value)} fullWidth />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="jmodal-field">
                                        <label className="jmodal-label">Tanggal</label>
                                        <Input type="date" value={formTanggal}
                                            onChange={(e) => setFormTanggal(e.target.value)} fullWidth />
                                    </div>
                                    <div className="jmodal-field">
                                        <label className="jmodal-label">Nama Jadwal Spesial</label>
                                        <Input type="text" placeholder="Cth: Pengangkutan Hari Bumi"
                                            value={formNamaSpesial} onChange={(e) => setFormNamaSpesial(e.target.value)} fullWidth />
                                    </div>
                                </>
                            )}
                            {modalJenis === "pengangkutan" && (
                                <div className="jmodal-field">
                                    <label className="jmodal-label">Target BSU</label>
                                    <Dropdown options={bsuOptions} placeholder="Pilih BSU tujuan..."
                                        value={formTargetBankId} onChange={(e) => setFormTargetBankId(e.target.value)} fullWidth />
                                </div>
                            )}
                            <div className="jmodal-row">
                                <div className="jmodal-field">
                                    <label className="jmodal-label">Jam Mulai</label>
                                    <Input type="time" value={formJamMulai}
                                        onChange={(e) => setFormJamMulai(e.target.value)} fullWidth />
                                </div>
                                <div className="jmodal-field">
                                    <label className="jmodal-label">Jam Selesai</label>
                                    <Input type="time" value={formJamSelesai}
                                        onChange={(e) => setFormJamSelesai(e.target.value)} fullWidth />
                                </div>
                            </div>
                            {formError && <p className="jmodal-error">{formError}</p>}
                            <div className="jmodal-actions">
                                <Button variant="ghost" color="primary" isRounded onClick={handleCloseModal} disabled={isSubmitting}>
                                    Batal
                                </Button>
                                <Button variant="solid" color="primary" isRounded icon={<FaPlus />} onClick={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? "Menyimpan..." : editJadwalId ? "Perbarui" : "Simpan Jadwal"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

        </div>
    );
}
