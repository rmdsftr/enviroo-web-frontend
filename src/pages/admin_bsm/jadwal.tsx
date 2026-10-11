import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    FaPlus,
    FaCalendarCheck, FaCalendarPlus,
} from "react-icons/fa6";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/button";
import Dropdown from "../../components/dropdown";
import Input from "../../components/input";
import CloseButton from "../../components/close-button";
import PopupNotifikasi from "../../layouts/popup-notifikasi";
import PopupConfirmation from "../../layouts/popup-confirmation";
import JadwalPenimbanganCalendarBsm from "../../layouts/jadwal-penimbangan-calendar-bsm";
import PengaturanJadwalPenimbangan, { type JadwalEditSeed } from "../../layouts/pengaturan-jadwal-penimbangan";
import JadwalBatchFields, { buildJadwalBatchItems } from "../../components/JadwalBatchFields";
import { JadwalService, type JadwalPenimbanganOccurrence, type JadwalMasterPenimbangan } from "../../services/jadwal.service";
import "../../styles/jadwal-bsu.css";
import { formatTime } from "../../layouts/jadwal-penimbangan-calendar";

/* ── Constants ── */
const HARI_OPTIONS = [
    { label: "Senin",  value: "senin"  }, { label: "Selasa", value: "selasa" },
    { label: "Rabu",   value: "rabu"   }, { label: "Kamis",  value: "kamis"  },
    { label: "Jumat",  value: "jumat"  }, { label: "Sabtu",  value: "sabtu"  },
    { label: "Minggu", value: "minggu" },
];
const MINGGU_OPTIONS = [
    { label: "Minggu ke-1", value: "1" }, { label: "Minggu ke-2", value: "2" },
    { label: "Minggu ke-3", value: "3" }, { label: "Minggu ke-4", value: "4" },
    { label: "Minggu ke-5", value: "5" },
];

/* ============================================================
   COMPONENT
   ============================================================ */
export default function JadwalBsmPage() {
    const { user } = useAuth();

    const [penimbanganList, setPenimbanganList] = useState<JadwalPenimbanganOccurrence[]>([]);
    const [loading, setLoading]                = useState(true);
    const [masterJadwal, setMasterJadwal]      = useState<JadwalMasterPenimbangan>({ rutin: [], khusus: [] });
    const [masterLoading, setMasterLoading]    = useState(true);
    const [calMonth, setCalMonth]              = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
    const [isModalOpen, setIsModalOpen]        = useState(false);
    const [isSubmitting, setIsSubmitting]      = useState(false);
    const [editJadwalId, setEditJadwalId]      = useState<string | null>(null);
    const [editOriginal, setEditOriginal]      = useState<JadwalEditSeed | null>(null);
    const [deleteJadwalId, setDeleteJadwalId]  = useState<string | null>(null);
    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });

    /* Form (single: dipakai untuk edit & jadwal spesial) */
    const [formType,         setFormType]         = useState<"rutin" | "spesial">("rutin");
    const [formHari,         setFormHari]         = useState("");
    const [formMingguKe,     setFormMingguKe]     = useState("");
    const [formTanggal,      setFormTanggal]      = useState("");
    const [formNamaSpesial,  setFormNamaSpesial]  = useState("");
    const [formJamMulai,     setFormJamMulai]     = useState("");
    const [formJamSelesai,   setFormJamSelesai]   = useState("");
    const [formIsActive,     setFormIsActive]     = useState(true);
    const [formError,        setFormError]        = useState("");

    /* Form batch (tambah jadwal rutin banyak sekaligus) */
    const [formHariList,   setFormHariList]   = useState<string[]>([]);
    const [formMingguList, setFormMingguList] = useState<string[]>([]);

    /* ── Fetch ── */
    const fetchJadwal = useCallback(async (month: number, year: number) => {
        if (!user?.bank_id) return;
        try {
            setLoading(true);
            const data = await JadwalService.getJadwalPenimbanganBank(user.bank_id, month, year);
            setPenimbanganList(data || []);
        } catch { console.error("Gagal memuat jadwal"); }
        finally { setLoading(false); }
    }, [user?.bank_id]);

    const fetchMasterJadwal = useCallback(async (month: number, year: number) => {
        if (!user?.bank_id) return;
        try {
            setMasterLoading(true);
            const data = await JadwalService.getJadwalMasterPenimbangan(user.bank_id, month, year);
            setMasterJadwal(data || { rutin: [], khusus: [] });
        } catch { console.error("Gagal memuat pengaturan jadwal"); }
        finally { setMasterLoading(false); }
    }, [user?.bank_id]);

    const refetchAll = useCallback((month: number, year: number) => {
        fetchJadwal(month, year);
        fetchMasterJadwal(month, year);
    }, [fetchJadwal, fetchMasterJadwal]);

    useEffect(() => { refetchAll(calMonth.month, calMonth.year); }, [calMonth, refetchAll]);

    /* ── Modal ── */
    const resetForm = () => {
        setFormType("rutin"); setFormHari(""); setFormMingguKe(""); setFormTanggal("");
        setFormNamaSpesial(""); setFormJamMulai(""); setFormJamSelesai(""); setFormIsActive(true);
        setFormError(""); setEditJadwalId(null); setEditOriginal(null);
        setFormHariList([]); setFormMingguList([]);
    };
    const handleOpenModal = (jadwal?: JadwalEditSeed) => {
        if (jadwal) {
            setEditJadwalId(jadwal.jadwal_id);
            setEditOriginal(jadwal);
            setFormType(jadwal.is_rutin ? "rutin" : "spesial");
            setFormHari(jadwal.hari); setFormMingguKe(jadwal.minggu_ke.toString());
            setFormTanggal(jadwal.tanggal ? jadwal.tanggal.split("T")[0] : "");
            setFormNamaSpesial(jadwal.nama_jadwal_spesial || "");
            setFormJamMulai(formatTime(jadwal.jam_mulai)); setFormJamSelesai(formatTime(jadwal.jam_selesai));
            setFormIsActive(jadwal.is_active);
            setFormError("");
        } else { resetForm(); }
        setIsModalOpen(true);
    };
    const handleCloseModal = () => { setIsModalOpen(false); resetForm(); };

    const handleSubmit = async () => {
        if (!user?.bank_id) return;
        if (!formJamMulai || !formJamSelesai) { setFormError("Jam mulai dan jam selesai wajib diisi"); return; }

        /* ── Edit (satu baris) atau Jadwal Spesial → jalur single lama ── */
        if (editJadwalId || formType === "spesial") {
            if (formType === "rutin") {
                if (!formHari)     { setFormError("Hari wajib dipilih"); return; }
                if (!formMingguKe) { setFormError("Minggu ke wajib dipilih"); return; }
            } else {
                if (!formTanggal)            { setFormError("Tanggal wajib diisi"); return; }
                if (!formNamaSpesial.trim()) { setFormError("Nama jadwal spesial wajib diisi"); return; }
            }
            setFormError(""); setIsSubmitting(true);
            try {
                if (editJadwalId) {
                    /* Partial update — field hari/minggu_ke/jam_mulai/jam_selesai/tanggal cuma
                       dikirim kalau beneran berubah dari nilai awal. Backend nge-block field itu
                       (409) kalau jadwalnya udah punya histori penimbangan; tapi is_active &
                       nama_jadwal_spesial tetap boleh diubah kapan aja — jadi jalur "nonaktifkan
                       aja" ga boleh ikut ke-block gara-gara field waktu ikut kekirim padahal ga diubah. */
                    const payload: Record<string, string | number | boolean> = {
                        is_active: formIsActive,
                        admin_id: user.identity_id,
                    };
                    if (formType === "spesial") {
                        payload.nama_jadwal_spesial = formNamaSpesial.trim();
                    }
                    const orig = editOriginal;
                    if (formType === "rutin") {
                        if (!orig || orig.hari !== formHari) payload.hari = formHari;
                        if (!orig || orig.minggu_ke !== parseInt(formMingguKe)) payload.minggu_ke = parseInt(formMingguKe);
                        if (!orig || formatTime(orig.jam_mulai) !== formJamMulai) payload.jam_mulai = formJamMulai;
                        if (!orig || formatTime(orig.jam_selesai) !== formJamSelesai) payload.jam_selesai = formJamSelesai;
                    } else {
                        if (!orig || orig.tanggal !== formTanggal) payload.tanggal = formTanggal;
                        if (!orig || formatTime(orig.jam_mulai) !== formJamMulai) payload.jam_mulai = formJamMulai;
                        if (!orig || formatTime(orig.jam_selesai) !== formJamSelesai) payload.jam_selesai = formJamSelesai;
                    }
                    await JadwalService.updateJadwal(editJadwalId, payload);
                    setNotif({ show: true, message: "Jadwal berhasil diperbarui!", type: "success" });
                } else {
                    const payload = {
                        hari: formType === "rutin" ? formHari : "",
                        minggu_ke: formType === "rutin" ? parseInt(formMingguKe) : 0,
                        jam_mulai: formJamMulai, jam_selesai: formJamSelesai,
                        jenis_jadwal: "penimbangan" as const,
                        is_active: true, is_rutin: formType === "rutin",
                        tanggal: formType === "spesial" ? formTanggal : "",
                        nama_jadwal_spesial: formType === "spesial" ? formNamaSpesial.trim() : "",
                        admin_id: user.identity_id,
                    };
                    await JadwalService.addJadwal(user.bank_id, payload);
                    setNotif({ show: true, message: "Jadwal berhasil ditambahkan!", type: "success" });
                }
                handleCloseModal(); refetchAll(calMonth.month, calMonth.year);
            } catch (err: any) {
                setNotif({ show: true, message: err?.response?.data?.error || "Gagal menyimpan jadwal", type: "error" });
            } finally { setIsSubmitting(false); }
            return;
        }

        /* ── Tambah Jadwal Rutin (batch: banyak hari × minggu sekaligus) ── */
        if (formHariList.length === 0)   { setNotif({ show: true, message: "Pilih minimal satu hari", type: "error" }); return; }
        if (formMingguList.length === 0) { setNotif({ show: true, message: "Pilih minggu, atau centang 'Setiap minggu'", type: "error" }); return; }
        setIsSubmitting(true);
        try {
            const items = buildJadwalBatchItems(formHariList, formMingguList, formJamMulai, formJamSelesai);
            const res = await JadwalService.addJadwalBatch(user.bank_id, {
                admin_id: user.identity_id,
                jenis_jadwal: "penimbangan",
                is_rutin: true,
                items,
            });
            setNotif({ show: true, message: res.message || "Jadwal berhasil ditambahkan!", type: "success" });
            handleCloseModal(); fetchJadwal(calMonth.month, calMonth.year);
        } catch (err: any) {
            setNotif({ show: true, message: err?.response?.data?.error || "Gagal menyimpan jadwal", type: "error" });
        } finally { setIsSubmitting(false); }
    };

    const confirmDelete = async () => {
        if (!deleteJadwalId) return;
        try {
            await JadwalService.deleteJadwal(deleteJadwalId);
            setNotif({ show: true, message: "Jadwal berhasil dihapus!", type: "success" });
            refetchAll(calMonth.month, calMonth.year);
        } catch (err: any) {
            setNotif({ show: true, message: err?.response?.data?.error || "Gagal menghapus jadwal", type: "error" });
        }
        finally { setDeleteJadwalId(null); }
    };

    /* ============================================================
       RENDER
       ============================================================ */
    return (
        <div className="jbsu">

            {/* ── Header ── */}
            <div className="jbsu-header">
                <div className="jbsu-header-left">
                    <h1>Manajemen Jadwal</h1>
                    <p>Kelola jadwal penimbangan BSM Anda</p>
                </div>
                <Button variant="solid" color="secondary" isRounded icon={<FaPlus />} onClick={() => handleOpenModal()}>
                    Tambah Jadwal Penimbangan
                </Button>
            </div>

            {/* ── Calendar Matrix ── */}
            <JadwalPenimbanganCalendarBsm
                jadwalList={penimbanganList}
                loading={loading}
                onMonthChange={(m, y) => setCalMonth({ month: m, year: y })}
            />

            {/* ── Pengaturan Jadwal (edit & hapus jadwal rutin/khusus) ── */}
            <PengaturanJadwalPenimbangan
                data={masterJadwal}
                loading={masterLoading}
                onEdit={handleOpenModal}
                onDelete={setDeleteJadwalId}
            />

            {/* ── Modal Tambah / Edit ── */}
            {isModalOpen && createPortal(
                <div className="jmodal-overlay" onClick={handleCloseModal}>
                    <div className="jmodal-box" onClick={e => e.stopPropagation()}>
                        <div className="jmodal-header">
                            <div>
                                <h2 className="jmodal-title">{editJadwalId ? "Edit" : "Tambah"} Jadwal Penimbangan</h2>
                                <p className="jmodal-sub">{editJadwalId ? "Perbarui informasi jadwal" : "Tambahkan jadwal rutin atau spesial"}</p>
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
                                editJadwalId ? (
                                    /* Edit: satu baris → dropdown tunggal */
                                    <>
                                        <div className="jmodal-field">
                                            <label className="jmodal-label">Hari Penimbangan</label>
                                            <Dropdown options={HARI_OPTIONS} placeholder="Pilih hari..." value={formHari} onChange={e => setFormHari(e.target.value)} fullWidth />
                                        </div>
                                        <div className="jmodal-field">
                                            <label className="jmodal-label">Minggu ke</label>
                                            <Dropdown options={MINGGU_OPTIONS} placeholder="Pilih minggu..." value={formMingguKe} onChange={e => setFormMingguKe(e.target.value)} fullWidth />
                                        </div>
                                    </>
                                ) : (
                                    /* Tambah: multi-select (batch) */
                                    <JadwalBatchFields
                                        hariLabel="Hari Penimbangan"
                                        hariList={formHariList} setHariList={setFormHariList}
                                        mingguList={formMingguList} setMingguList={setFormMingguList}
                                    />
                                )
                            ) : (
                                <>
                                    <div className="jmodal-field">
                                        <label className="jmodal-label">Tanggal</label>
                                        <Input type="date" value={formTanggal} onChange={e => setFormTanggal(e.target.value)} fullWidth />
                                    </div>
                                    <div className="jmodal-field">
                                        <label className="jmodal-label">Nama Jadwal Spesial</label>
                                        <Input type="text" placeholder="Contoh: Penimbangan Hari Bumi" value={formNamaSpesial} onChange={e => setFormNamaSpesial(e.target.value)} fullWidth />
                                    </div>
                                </>
                            )}
                            <div className="jmodal-row">
                                <div className="jmodal-field">
                                    <label className="jmodal-label">Jam Mulai</label>
                                    <Input type="time" value={formJamMulai} onChange={e => setFormJamMulai(e.target.value)} fullWidth />
                                </div>
                                <div className="jmodal-field">
                                    <label className="jmodal-label">Jam Selesai</label>
                                    <Input type="time" value={formJamSelesai} onChange={e => setFormJamSelesai(e.target.value)} fullWidth />
                                </div>
                            </div>
                            {editJadwalId && (
                                <div className="jmodal-field">
                                    <label className="jmodal-label">Status Jadwal</label>
                                    <label className="jm-toggle">
                                        <input
                                            type="checkbox"
                                            checked={formIsActive}
                                            onChange={e => setFormIsActive(e.target.checked)}
                                        />
                                        <span className="jm-toggle-track"><span className="jm-toggle-thumb" /></span>
                                        <span className="jm-toggle-text">{formIsActive ? "Aktif" : "Nonaktif"}</span>
                                    </label>
                                </div>
                            )}
                            {formError && <p className="jmodal-error">{formError}</p>}
                            <div className="jmodal-actions">
                                <Button variant="ghost" color="primary" isRounded onClick={handleCloseModal} disabled={isSubmitting}>Batal</Button>
                                <Button variant="solid" color="primary" isRounded icon={<FaPlus />} onClick={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? "Menyimpan..." : "Simpan Jadwal"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {notif.show && (
                <PopupNotifikasi message={notif.message} type={notif.type} onClose={() => setNotif(p => ({ ...p, show: false }))} />
            )}
            <PopupConfirmation
                isOpen={!!deleteJadwalId} type="danger" title="Hapus Jadwal"
                message="Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan."
                confirmText="Hapus Jadwal" cancelText="Batal"
                onConfirm={confirmDelete} onCancel={() => setDeleteJadwalId(null)}
            />
        </div>
    );
}
