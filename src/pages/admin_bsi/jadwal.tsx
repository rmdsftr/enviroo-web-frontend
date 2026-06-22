import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    FaPlus,
    FaCalendarCheck, FaCalendarPlus,
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
import { JadwalService, type JadwalItem } from "../../services/jadwal.service";
import { BsiService } from "../../services/bsi.service";
import "../../styles/jadwal-bsu.css";

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

/* ============================================================
   COMPONENT
   ============================================================ */
export default function JadwalBsiPage() {
    const { user } = useAuth();

    /* Tab */
    const [activeTab, setActiveTab] = useState<ActiveTab>("penimbangan");

    /* API data */
    const [penimbanganList, setPenimbanganList] = useState<JadwalItem[]>([]);
    const [pengangkutanList, setPengangkutanList] = useState<JadwalItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [bsuOptions, setBsuOptions] = useState<{ label: string; value: string }[]>([]);
    const [calMonth, setCalMonth] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });

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

    /* ── Fetch ── */
    const fetchJadwal = useCallback(async (month: number, year: number) => {
        if (!user?.bank_id) return;
        try {
            setLoading(true);
            const res = await JadwalService.getJadwalBank(user.bank_id, month, year);
            setPenimbanganList(res.data.penimbangan ?? []);
            setPengangkutanList(res.data.pengangkutan ?? []);
        } catch {
            setNotif({ show: true, message: "Gagal memuat jadwal", type: "error" });
        } finally {
            setLoading(false);
        }
    }, [user?.bank_id]);

    useEffect(() => { fetchJadwal(calMonth.month, calMonth.year); }, [calMonth, fetchJadwal]);

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
            handleCloseModal(); fetchJadwal(calMonth.month, calMonth.year);
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
            fetchJadwal(calMonth.month, calMonth.year);
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
                <JadwalPenimbanganCalendar
                    jadwalList={penimbanganList}
                    loading={loading}
                    onEdit={(item) => handleOpenModal("penimbangan", item)}
                    onDelete={setDeleteJadwalId}
                    onMonthChange={(m, y) => setCalMonth({ month: m, year: y })}
                />
            )}

            {/* ══════════════════════════════════════════
               TAB: JADWAL PENGANGKUTAN
               ══════════════════════════════════════════ */}
            {activeTab === "pengangkutan" && (
                <JadwalPengangkutanCalendar
                    jadwalList={pengangkutanList}
                    loading={loading}
                    onEdit={(item) => handleOpenModal("pengangkutan", item)}
                    onDelete={setDeleteJadwalId}
                    getBankLabel={(item) => item.target_bank_name || undefined}
                    onMonthChange={(m, y) => setCalMonth({ month: m, year: y })}
                />
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
