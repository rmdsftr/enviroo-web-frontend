import { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
    FaPlus, FaClockRotateLeft,
    FaCalendarCheck, FaCalendarPlus, FaEye,
} from "react-icons/fa6";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/button";
import Dropdown from "../../components/dropdown";
import Input from "../../components/input";
import CloseButton from "../../components/close-button";
import PopupNotifikasi from "../../layouts/popup-notifikasi";
import PopupConfirmation from "../../layouts/popup-confirmation";
import Table, { type ColumnDef, TableActionBtn } from "../../components/table";
import FilterRange, { defaultMonthRange } from "../../components/filter-range";
import JadwalPenimbanganCalendar from "../../layouts/jadwal-penimbangan-calendar";
import { JadwalService, type JadwalItem } from "../../services/jadwal.service";
import { PenimbanganService, type PenimbanganItem } from "../../services/penimbangan.service";
import "../../styles/jadwal-bsu.css";
import { formatTanggal, formatJam } from "../../utils/date.utils";
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

const STATUS_PENIMBANGAN: Record<string, { label: string; cls: string }> = {
    aktif:      { label: "Berlangsung", cls: "berlangsung" },
    selesai:    { label: "Selesai",     cls: "selesai"     },
    dibatalkan: { label: "Dibatalkan",  cls: "dibatalkan"  },
};

const RIWAYAT_COLUMNS: ColumnDef<PenimbanganItem>[] = [
    { key: "penimbangan_id", header: "ID Penimbangan", render: (row) => row.penimbangan_id },
    { key: "tanggal",  header: "Tanggal",     width: "120px", render: (row) => row.started_at ? formatTanggal(row.started_at) : "—" },
    { key: "mulai",    header: "Jam Mulai",   width: "100px", render: (row) => row.started_at ? formatJam(row.started_at) : "—" },
    { key: "selesai",  header: "Jam Selesai", width: "100px", render: (row) => row.ended_at   ? formatJam(row.ended_at)   : "—" },
    {
        key: "status", header: "Status Penimbangan", width: "160px",
        render: (row) => {
            const s = STATUS_PENIMBANGAN[row.status_penimbangan];
            return <span className={`jbsu-status-pill ${s?.cls ?? row.status_penimbangan}`}>{s?.label ?? row.status_penimbangan}</span>;
        },
    },
    { key: "aksi", header: "Aksi", width: "70px", align: "center" as const, render: () => <TableActionBtn icon={FaEye} title="Lihat Detail" /> },
];

/* ============================================================
   COMPONENT
   ============================================================ */
export default function JadwalBsmPage() {
    const { user }   = useAuth();
    const navigate   = useNavigate();

    const [penimbanganList, setPenimbanganList] = useState<JadwalItem[]>([]);
    const [loading, setLoading]                = useState(true);
    const [isModalOpen, setIsModalOpen]        = useState(false);
    const [isSubmitting, setIsSubmitting]      = useState(false);
    const [editJadwalId, setEditJadwalId]      = useState<string | null>(null);
    const [deleteJadwalId, setDeleteJadwalId]  = useState<string | null>(null);
    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });

    /* Form */
    const [formType,         setFormType]         = useState<"rutin" | "spesial">("rutin");
    const [formHari,         setFormHari]         = useState("");
    const [formMingguKe,     setFormMingguKe]     = useState("");
    const [formTanggal,      setFormTanggal]      = useState("");
    const [formNamaSpesial,  setFormNamaSpesial]  = useState("");
    const [formJamMulai,     setFormJamMulai]     = useState("");
    const [formJamSelesai,   setFormJamSelesai]   = useState("");
    const [formError,        setFormError]        = useState("");

    /* Riwayat */
    const [riwayatList,    setRiwayatList]    = useState<PenimbanganItem[]>([]);
    const [riwayatLoading, setRiwayatLoading] = useState(false);
    const [riwayatFrom,    setRiwayatFrom]    = useState(() => defaultMonthRange().from);
    const [riwayatTo,      setRiwayatTo]      = useState(() => defaultMonthRange().to);

    /* ── Fetch ── */
    const fetchJadwal = useCallback(async () => {
        if (!user?.bank_id) return;
        try {
            setLoading(true);
            const res = await JadwalService.getJadwalBank(user.bank_id);
            setPenimbanganList(res.data.penimbangan || []);
        } catch { console.error("Gagal memuat jadwal"); }
        finally { setLoading(false); }
    }, [user?.bank_id]);

    useEffect(() => { fetchJadwal(); }, [fetchJadwal]);

    const fetchRiwayat = useCallback(async () => {
        if (!user?.bank_id) return;
        try {
            setRiwayatLoading(true);
            const data = await PenimbanganService.getPenimbanganByBank(user.bank_id);
            setRiwayatList(data);
        } catch { console.error("Gagal memuat riwayat"); }
        finally { setRiwayatLoading(false); }
    }, [user?.bank_id]);

    useEffect(() => { fetchRiwayat(); }, [fetchRiwayat]);

    const filteredRiwayat = useMemo(() =>
        riwayatList.filter(item => {
            if (!item.started_at) return false;
            const month = item.started_at.substring(0, 7);
            return month >= riwayatFrom && month <= riwayatTo;
        }),
        [riwayatList, riwayatFrom, riwayatTo]
    );

    /* ── Modal ── */
    const resetForm = () => {
        setFormType("rutin"); setFormHari(""); setFormMingguKe(""); setFormTanggal("");
        setFormNamaSpesial(""); setFormJamMulai(""); setFormJamSelesai(""); setFormError(""); setEditJadwalId(null);
    };
    const handleOpenModal = (jadwal?: JadwalItem) => {
        if (jadwal) {
            setEditJadwalId(jadwal.jadwal_id);
            setFormType(jadwal.is_rutin ? "rutin" : "spesial");
            setFormHari(jadwal.hari); setFormMingguKe(jadwal.minggu_ke.toString());
            setFormTanggal(jadwal.tanggal ? jadwal.tanggal.split("T")[0] : "");
            setFormNamaSpesial(jadwal.nama_jadwal_spesial || "");
            setFormJamMulai(formatTime(jadwal.jam_mulai)); setFormJamSelesai(formatTime(jadwal.jam_selesai));
            setFormError("");
        } else { resetForm(); }
        setIsModalOpen(true);
    };
    const handleCloseModal = () => { setIsModalOpen(false); resetForm(); };

    const handleSubmit = async () => {
        if (!user?.bank_id) return;
        if (!formJamMulai || !formJamSelesai) { setFormError("Jam mulai dan jam selesai wajib diisi"); return; }
        if (formType === "rutin") {
            if (!formHari)    { setFormError("Hari wajib dipilih"); return; }
            if (!formMingguKe){ setFormError("Minggu ke wajib dipilih"); return; }
        } else {
            if (!formTanggal)           { setFormError("Tanggal wajib diisi"); return; }
            if (!formNamaSpesial.trim()){ setFormError("Nama jadwal spesial wajib diisi"); return; }
        }
        setFormError(""); setIsSubmitting(true);
        try {
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
            if (editJadwalId) {
                await JadwalService.updateJadwal(editJadwalId, payload);
                setNotif({ show: true, message: "Jadwal berhasil diperbarui!", type: "success" });
            } else {
                await JadwalService.addJadwal(user.bank_id, payload);
                setNotif({ show: true, message: "Jadwal berhasil ditambahkan!", type: "success" });
            }
            handleCloseModal(); fetchJadwal();
        } catch (err: any) {
            setFormError(err?.response?.data?.error || "Gagal menyimpan jadwal");
        } finally { setIsSubmitting(false); }
    };

    const confirmDelete = async () => {
        if (!deleteJadwalId) return;
        try {
            await JadwalService.deleteJadwal(deleteJadwalId);
            setNotif({ show: true, message: "Jadwal berhasil dihapus!", type: "success" });
            fetchJadwal();
        } catch { setNotif({ show: true, message: "Gagal menghapus jadwal", type: "error" }); }
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
            <JadwalPenimbanganCalendar
                jadwalList={penimbanganList}
                loading={loading}
                onEdit={handleOpenModal}
                onDelete={setDeleteJadwalId}
            />

            {/* ── Riwayat Penimbangan ── */}
            <div className="jbsu-card">
                <div className="jbsu-section-header">
                    <span className="jbsu-card-title-icon" style={{ background: "#013236" }}><FaClockRotateLeft /></span>
                    <div>
                        <h2 className="jbsu-card-title">Riwayat Penimbangan</h2>
                        <p className="jbsu-card-sub">Riwayat pelaksanaan penimbangan</p>
                    </div>
                    <div className="jbsu-section-header-right">
                        <FilterRange from={riwayatFrom} to={riwayatTo} onChange={(f, t) => { setRiwayatFrom(f); setRiwayatTo(t); }} />
                    </div>
                </div>
                {riwayatLoading
                    ? <div className="jbsu-empty"><span>Memuat riwayat...</span></div>
                    : <Table<PenimbanganItem>
                        columns={RIWAYAT_COLUMNS}
                        data={filteredRiwayat}
                        rowKey={(row) => row.penimbangan_id}
                        emptyMessage="Belum ada riwayat penimbangan."
                        onRowClick={(row) => navigate(`/bsm/riwayat/penimbangan/${row.penimbangan_id}`)}
                      />
                }
            </div>

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
