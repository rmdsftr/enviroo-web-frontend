import { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    FaCalendarDay, FaChevronLeft, FaChevronRight, FaPlus,
    FaPen, FaTrash, FaScaleBalanced, FaTruckFast, FaClockRotateLeft,
    FaCalendarCheck, FaCalendarPlus,
} from "react-icons/fa6";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/button";
import Dropdown from "../../components/dropdown";
import Input from "../../components/input";
import CloseButton from "../../components/close-button";
import PopupNotifikasi from "../../layouts/popup-notifikasi";
import PopupConfirmation from "../../layouts/popup-confirmation";
import FilterPill from "../../components/filter-pill";
import { JadwalService, type JadwalItem } from "../../services/jadwal.service";

type JadwalFilter = "semua" | "rutin" | "spesial";
import "../../styles/jadwal-bsu.css";

/* ── Types ── */
type RiwayatStatus = "selesai" | "berlangsung" | "dibatalkan" | "mendatang";

interface RiwayatItem {
    id: string;
    tanggal: string;
    jamMulai: string;
    jamSelesai: string;
    keterangan: string;
    status: RiwayatStatus;
}

/* ── Constants ── */
const HARI_MAP: Record<string, string> = {
    Sunday: "minggu", Monday: "senin", Tuesday: "selasa",
    Wednesday: "rabu", Thursday: "kamis", Friday: "jumat", Saturday: "sabtu",
};

const HARI_DISPLAY: Record<string, string> = {
    senin: "Senin", selasa: "Selasa", rabu: "Rabu",
    kamis: "Kamis", jumat: "Jumat", sabtu: "Sabtu", minggu: "Minggu",
};

const HARI_OPTIONS = [
    { label: "Senin", value: "senin" },
    { label: "Selasa", value: "selasa" },
    { label: "Rabu", value: "rabu" },
    { label: "Kamis", value: "kamis" },
    { label: "Jumat", value: "jumat" },
    { label: "Sabtu", value: "sabtu" },
    { label: "Minggu", value: "minggu" },
];

const MINGGU_OPTIONS = [
    { label: "Minggu ke-1", value: "1" },
    { label: "Minggu ke-2", value: "2" },
    { label: "Minggu ke-3", value: "3" },
    { label: "Minggu ke-4", value: "4" },
    { label: "Minggu ke-5", value: "5" },
];

const MINGGU_LABEL = (n: number) => n === 0 ? "Setiap minggu" : `Minggu ke-${n}`;

const STATUS_LABEL: Record<RiwayatStatus, string> = {
    selesai: "Selesai", berlangsung: "Berlangsung",
    dibatalkan: "Dibatalkan", mendatang: "Mendatang",
};

/* ── Helper: parse time from backend ── */
const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    
    // Extrak HH:MM jika formatnya berupa time string langsung dari database
    const timeMatch = timeStr.match(/^(\d{2}:\d{2})(:\d{2})?(?:[+-]\d{2}:\d{2}|Z)?$/);
    if (timeMatch) {
        return timeMatch[1];
    }
    
    try {
        const d = new Date(timeStr);
        if (isNaN(d.getTime())) return timeStr;
        return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch {
        return timeStr;
    }
};

/* ── Dummy Riwayat Data (will be replaced later) ── */
const DUMMY_RIWAYAT: RiwayatItem[] = [
    { id: "r1", tanggal: "2026-04-14", jamMulai: "08:00", jamSelesai: "10:00", keterangan: "Penimbangan rutin Senin", status: "selesai" },
    { id: "r2", tanggal: "2026-04-16", jamMulai: "13:00", jamSelesai: "15:00", keterangan: "Penimbangan plastik Rabu", status: "selesai" },
    { id: "r3", tanggal: "2026-04-20", jamMulai: "08:00", jamSelesai: "10:00", keterangan: "Penimbangan rutin Senin", status: "berlangsung" },
    { id: "r4", tanggal: "2026-04-22", jamMulai: "09:00", jamSelesai: "12:00", keterangan: "Penimbangan Hari Bumi", status: "mendatang" },
    { id: "r5", tanggal: "2026-04-09", jamMulai: "13:00", jamSelesai: "15:00", keterangan: "Penimbangan Rabu", status: "dibatalkan" },
];

const DUMMY_RIWAYAT_PENGANGKUTAN: RiwayatItem[] = [
    { id: "ra1", tanggal: "2026-04-15", jamMulai: "07:00", jamSelesai: "09:00", keterangan: "Pengangkutan rutin Selasa", status: "selesai" },
    { id: "ra2", tanggal: "2026-04-11", jamMulai: "08:00", jamSelesai: "10:00", keterangan: "Pengangkutan Jumat minggu ke-2", status: "selesai" },
    { id: "ra3", tanggal: "2026-04-22", jamMulai: "07:00", jamSelesai: "09:00", keterangan: "Pengangkutan rutin Selasa", status: "mendatang" },
    { id: "ra4", tanggal: "2026-04-01", jamMulai: "08:00", jamSelesai: "10:00", keterangan: "Pengangkutan Jumat", status: "dibatalkan" },
];

/* ============================================================
   COMPONENT
   ============================================================ */
export default function JadwalBsuPage() {
    const { user } = useAuth();

    /* ── Live data from API ── */
    const [penimbanganList, setPenimbanganList] = useState<JadwalItem[]>([]);
    const [pengangkutanList, setPengangkutanList] = useState<JadwalItem[]>([]);
    const [loading, setLoading] = useState(true);

    /* Calendar state */
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    /* Modal */
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Notification state
    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
        show: false,
        message: "",
        type: "success"
    });
    
    // Delete Confirmation State
    const [deleteJadwalId, setDeleteJadwalId] = useState<string | null>(null);

    // Filter state for schedule type
    const [penimbanganFilter, setPenimbanganFilter] = useState<JadwalFilter>("semua");
    const [pengangkutanFilter, setPengangkutanFilter] = useState<JadwalFilter>("semua");

    const [isSubmitting, setIsSubmitting] = useState(false);

    /* Modal form state */
    const [editJadwalId, setEditJadwalId] = useState<string | null>(null);
    const [formType, setFormType] = useState<"rutin" | "spesial">("rutin");
    const [formHari, setFormHari] = useState("");
    const [formMingguKe, setFormMingguKe] = useState("");
    const [formTanggal, setFormTanggal] = useState("");
    const [formNamaSpesial, setFormNamaSpesial] = useState("");
    const [formJamMulai, setFormJamMulai] = useState("");
    const [formJamSelesai, setFormJamSelesai] = useState("");
    const [formError, setFormError] = useState("");

    /* Riwayat filter */
    const [riwayatFilter, setRiwayatFilter] = useState<RiwayatStatus | "semua">("semua");
    const [riwayatAngkutFilter, setRiwayatAngkutFilter] = useState<RiwayatStatus | "semua">("semua");

    /* ── Fetch jadwal from API ── */
    const fetchJadwal = useCallback(async () => {
        if (!user?.bank_id) return;
        try {
            setLoading(true);
            const res = await JadwalService.getJadwalBank(user.bank_id);
            setPenimbanganList(res.data.penimbangan || []);
            setPengangkutanList(res.data.pengangkutan || []);
        } catch (err) {
            console.error("Failed to fetch jadwal:", err);
        } finally {
            setLoading(false);
        }
    }, [user?.bank_id]);

    useEffect(() => {
        fetchJadwal();
    }, [fetchJadwal]);

    /* ── Calendar helpers ── */
    const daysInMonth = useMemo(() => {
        const y = currentMonth.getFullYear(), m = currentMonth.getMonth();
        const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
        const days: (Date | null)[] = [];
        for (let i = 0; i < first.getDay(); i++) days.push(null);
        for (let i = 1; i <= last.getDate(); i++) days.push(new Date(y, m, i));
        return days;
    }, [currentMonth]);

    const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
    const isSel = (d: Date) => d.toDateString() === selectedDate.toDateString();
    const prevM = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const nextM = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const getWeekOfMonth = (date: Date) => {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return Math.ceil((date.getDate() + firstDay) / 7);
    };
    const getLocalISODate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    /* ── Day marking ── */
    const getDayMarks = (day: Date) => {
        const hariStr = HARI_MAP[day.toLocaleDateString("en-US", { weekday: "long" })];
        const dateStr = getLocalISODate(day);
        const weekOfMonth = getWeekOfMonth(day);
        
        const hasPenimbangan = penimbanganList.some(j =>
            !j.is_rutin ? j.tanggal?.split("T")[0] === dateStr : (j.hari === hariStr && (j.minggu_ke === weekOfMonth || j.minggu_ke === 0))
        );
        const hasPengangkutan = pengangkutanList.some(j => 
            !j.is_rutin ? j.tanggal?.split("T")[0] === dateStr : (j.hari === hariStr && (j.minggu_ke === weekOfMonth || j.minggu_ke === 0))
        );
        return { hasPenimbangan, hasPengangkutan };
    };

    /* ── Selected date schedule ── */
    const selectedHari = useMemo(() => {
        return HARI_MAP[selectedDate.toLocaleDateString("en-US", { weekday: "long" })] || "senin";
    }, [selectedDate]);

    const selectedDateStr = selectedDate.toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    const selectedDateISO = getLocalISODate(selectedDate);

    const selectedJadwal = useMemo(() => {
        const weekOfMonth = getWeekOfMonth(selectedDate);
        
        const penimbangan = penimbanganList.filter(j =>
            !j.is_rutin ? j.tanggal?.split("T")[0] === selectedDateISO : (j.hari === selectedHari && (j.minggu_ke === weekOfMonth || j.minggu_ke === 0))
        ).map(j => ({ ...j, type: "penimbangan" as const }));

        const pengangkutan = pengangkutanList.filter(j =>
            !j.is_rutin ? j.tanggal?.split("T")[0] === selectedDateISO : (j.hari === selectedHari && (j.minggu_ke === weekOfMonth || j.minggu_ke === 0))
        ).map(j => ({ ...j, type: "pengangkutan" as const }));

        return [...penimbangan, ...pengangkutan].sort((a, b) =>
            formatTime(a.jam_mulai).localeCompare(formatTime(b.jam_mulai))
        );
    }, [selectedHari, selectedDateISO, selectedDate, penimbanganList, pengangkutanList]);

    /* ── Riwayat filtered ── */
    const filteredRiwayat = useMemo(() => {
        if (riwayatFilter === "semua") return DUMMY_RIWAYAT;
        return DUMMY_RIWAYAT.filter(r => r.status === riwayatFilter);
    }, [riwayatFilter]);

    const filteredRiwayatAngkut = useMemo(() => {
        if (riwayatAngkutFilter === "semua") return DUMMY_RIWAYAT_PENGANGKUTAN;
        return DUMMY_RIWAYAT_PENGANGKUTAN.filter(r => r.status === riwayatAngkutFilter);
    }, [riwayatAngkutFilter]);

    /* ── Modal Handlers ── */
    const resetForm = () => {
        setFormType("rutin");
        setFormHari("");
        setFormMingguKe("");
        setFormTanggal("");
        setFormNamaSpesial("");
        setFormJamMulai("");
        setFormJamSelesai("");
        setFormError("");
        setEditJadwalId(null);
    };

    const handleOpenModal = (jadwal?: JadwalItem) => {
        if (jadwal) {
            setEditJadwalId(jadwal.jadwal_id);
            if (jadwal.is_rutin) {
                setFormType("rutin");
                setFormHari(jadwal.hari);
                setFormMingguKe(jadwal.minggu_ke.toString());
                setFormTanggal("");
                setFormNamaSpesial("");
            } else {
                setFormType("spesial");
                setFormHari("");
                setFormMingguKe("");
                setFormTanggal(jadwal.tanggal ? jadwal.tanggal.split("T")[0] : "");
                setFormNamaSpesial(jadwal.nama_jadwal_spesial || "");
            }
            setFormJamMulai(formatTime(jadwal.jam_mulai));
            setFormJamSelesai(formatTime(jadwal.jam_selesai));
            setFormError("");
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const handleSubmit = async () => {
        if (!user?.bank_id || !user?.user_id) return;

        /* Validation */
        if (!formJamMulai || !formJamSelesai) {
            setFormError("Jam mulai dan jam selesai wajib diisi");
            return;
        }

        if (formType === "rutin") {
            if (!formHari) { setFormError("Hari wajib dipilih"); return; }
            if (!formMingguKe) { setFormError("Minggu ke wajib dipilih"); return; }
        } else {
            if (!formTanggal) { setFormError("Tanggal wajib diisi"); return; }
            if (!formNamaSpesial.trim()) { setFormError("Nama jadwal spesial wajib diisi"); return; }
        }

        setFormError("");
        setIsSubmitting(true);

        try {
            const dataToSubmit = {
                hari: formType === "rutin" ? formHari : "",
                minggu_ke: formType === "rutin" ? parseInt(formMingguKe) : 0,
                jam_mulai: formJamMulai,
                jam_selesai: formJamSelesai,
                jenis_jadwal: "penimbangan" as const,
                is_active: true,
                is_rutin: formType === "rutin" ? true : false,
                tanggal: formType === "spesial" ? formTanggal : "",
                nama_jadwal_spesial: formType === "spesial" ? formNamaSpesial.trim() : "",
                admin_id: user.identity_id,
            };

            if (editJadwalId) {
                await JadwalService.updateJadwal(editJadwalId, dataToSubmit);
                setNotif({ show: true, message: "Jadwal berhasil diperbarui!", type: "success" });
            } else {
                await JadwalService.addJadwal(user.bank_id, dataToSubmit);
                setNotif({ show: true, message: "Jadwal berhasil ditambahkan!", type: "success" });
            }
            
            handleCloseModal();
            fetchJadwal(); // refresh data
        } catch (err: any) {
            setFormError(err?.response?.data?.error || "Gagal menyimpan jadwal");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteJadwalId(id);
    };

    const confirmDelete = async () => {
        if (!deleteJadwalId) return;
        try {
            await JadwalService.deleteJadwal(deleteJadwalId);
            setNotif({ show: true, message: "Jadwal berhasil dihapus!", type: "success" });
            fetchJadwal();
        } catch (err) {
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

            {/* ── Header ── */}
            <div className="jbsu-header">
                <div className="jbsu-header-left">
                    <h1>Manajemen Jadwal</h1>
                    <p>Kelola jadwal penimbangan dan lihat jadwal pengangkutan BSU Anda</p>
                </div>
                <Button 
                    variant="solid" 
                    color="neon" 
                    isRounded 
                    icon={<FaPlus />} 
                    onClick={() => handleOpenModal()}
                >
                    Tambah Jadwal Penimbangan
                </Button>
            </div>

            {/* ── Main Grid ── */}
            <div className="jbsu-main-grid">

                {/* ── LEFT: Calendar + Selected Detail ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                    {/* Calendar */}
                    <div className="jbsu-calendar">
                        <div className="jbsu-cal-header">
                            <button onClick={prevM}><FaChevronLeft /></button>
                            <h3>{currentMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</h3>
                            <button onClick={nextM}><FaChevronRight /></button>
                        </div>
                        <div className="jbsu-cal-grid">
                            {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map(d => (
                                <span key={d} className="jbsu-cal-dayname">{d}</span>
                            ))}
                            {daysInMonth.map((day, idx) =>
                                !day
                                    ? <span key={`e-${idx}`} className="jbsu-cal-day empty" />
                                    : (() => {
                                        const marks = getDayMarks(day);
                                        return (
                                            <button key={idx}
                                                className={`jbsu-cal-day${isSel(day) ? " selected" : ""}${isToday(day) ? " today" : ""}`}
                                                onClick={() => setSelectedDate(day)}>
                                                {day.getDate()}
                                                {(marks.hasPenimbangan || marks.hasPengangkutan) && (
                                                    <span className="jbsu-cal-dots">
                                                        {marks.hasPenimbangan && <span className="jbsu-cal-dot penimbangan" />}
                                                        {marks.hasPengangkutan && <span className="jbsu-cal-dot pengangkutan" />}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })()
                            )}
                        </div>
                    </div>

                    {/* Selected Date Detail */}
                    <div className="jbsu-selected-detail">
                        <div className="jbsu-sel-header">
                            <FaCalendarDay className="jbsu-sel-icon" />
                            <div>
                                <p className="jbsu-sel-title">Jadwal Terpilih</p>
                                <p className="jbsu-sel-sub">{selectedDateStr}</p>
                            </div>
                        </div>
                        {selectedJadwal.length === 0
                            ? <p className="jbsu-sel-empty">Tidak ada jadwal pada tanggal ini</p>
                            : <div className="jbsu-sel-list">
                                {selectedJadwal.map(item => (
                                    <div key={item.jadwal_id} className="jbsu-sel-item">
                                        <span className="jbsu-sel-item-time">
                                            {formatTime(item.jam_mulai)}–{formatTime(item.jam_selesai)}
                                        </span>
                                        <span className="jbsu-sel-item-label">
                                            {item.type === "penimbangan" ? "Penimbangan" : "Pengangkutan"}
                                            {!item.is_rutin && item.nama_jadwal_spesial ? ` — ${item.nama_jadwal_spesial}` : ""}
                                        </span>
                                        <span className={`jbsu-sel-item-badge ${item.type}`}>
                                            {item.type === "penimbangan" ? "Timbang" : "Angkut"}
                                        </span>
                                    </div>
                                ))}
                              </div>
                        }
                    </div>
                </div>

                {/* ── RIGHT: Schedule Sections ── */}
                <div className="jbsu-right-col">

                    {/* ── Jadwal Penimbangan (CRUD) ── */}
                    <div className="jbsu-card">
                        <div className="jbsu-section-header">
                            <span className="jbsu-card-title-icon" style={{ background: "#4EA771" }}>
                                <FaScaleBalanced />
                            </span>
                            <div>
                                <h2 className="jbsu-card-title">Jadwal Penimbangan</h2>
                                <p className="jbsu-card-sub">Jadwal rutin & spesial penimbangan sampah</p>
                            </div>
                        </div>

                        <FilterPill
                            options={[
                                { label: "Semua", value: "semua" },
                                { label: "Rutin", value: "rutin" },
                                { label: "Spesial", value: "spesial" },
                            ]}
                            activeValue={penimbanganFilter}
                            onChange={(v) => setPenimbanganFilter(v)}
                        />

                        {loading ? (
                            <div className="jbsu-empty"><span>Memuat jadwal...</span></div>
                        ) : penimbanganList.length === 0 ? (
                            <div className="jbsu-empty"><FaScaleBalanced /><span>Belum ada jadwal penimbangan</span></div>
                        ) : (
                            (() => {
                                const filtered = penimbanganList.filter(j =>
                                    penimbanganFilter === "semua" ? true :
                                    penimbanganFilter === "rutin" ? j.is_rutin :
                                    !j.is_rutin
                                );
                                return filtered.length === 0
                                    ? <div className="jbsu-empty"><FaScaleBalanced /><span>Tidak ada jadwal {penimbanganFilter}</span></div>
                                    : <div className="jbsu-schedule-list">
                                        {filtered.map(item => (
                                            <div key={item.jadwal_id} className="jbsu-row">
                                                <span className="jbsu-row-day">
                                                    {!item.is_rutin 
                                                        ? new Date(item.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                                                        : HARI_DISPLAY[item.hari] || item.hari
                                                    }
                                                </span>
                                                <span className="jbsu-row-time">
                                                    {formatTime(item.jam_mulai)} – {formatTime(item.jam_selesai)}
                                                </span>
                                                <span className="jbsu-row-week">
                                                    {!item.is_rutin ? "" : MINGGU_LABEL(item.minggu_ke)}
                                                </span>
                                                {!item.is_rutin && (
                                                    <span className="jbsu-badge insidental">Spesial</span>
                                                )}
                                                {!item.is_rutin && item.nama_jadwal_spesial && (
                                                    <span className="jbsu-row-note">{item.nama_jadwal_spesial}</span>
                                                )}
                                                <div className="jbsu-row-actions">
                                                    <button className="jbsu-row-btn edit" title="Edit" onClick={() => handleOpenModal(item)}>
                                                        <FaPen />
                                                    </button>
                                                    <button className="jbsu-row-btn delete" title="Hapus" onClick={() => handleDeleteClick(item.jadwal_id)}>
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>;
                            })()
                        )}
                    </div>

                    {/* ── Jadwal Pengangkutan (Read-only) ── */}
                    <div className="jbsu-card">
                        <div className="jbsu-section-header">
                            <span className="jbsu-card-title-icon" style={{ background: "#f59e0b" }}>
                                <FaTruckFast />
                            </span>
                            <div>
                                <h2 className="jbsu-card-title">Jadwal Pengangkutan</h2>
                                <p className="jbsu-card-sub">Jadwal dari BSI — hanya dapat dilihat</p>
                            </div>
                        </div>

                        <FilterPill
                            options={[
                                { label: "Semua", value: "semua" },
                                { label: "Rutin", value: "rutin" },
                                { label: "Spesial", value: "spesial" },
                            ]}
                            activeValue={pengangkutanFilter}
                            onChange={(v) => setPengangkutanFilter(v)}
                        />

                        {loading ? (
                            <div className="jbsu-empty"><span>Memuat jadwal...</span></div>
                        ) : pengangkutanList.length === 0 ? (
                            <div className="jbsu-empty"><FaTruckFast /><span>Belum ada jadwal pengangkutan</span></div>
                        ) : (
                            (() => {
                                const filtered = pengangkutanList.filter(j =>
                                    pengangkutanFilter === "semua" ? true :
                                    pengangkutanFilter === "rutin" ? j.is_rutin :
                                    !j.is_rutin
                                );
                                return filtered.length === 0
                                    ? <div className="jbsu-empty"><FaTruckFast /><span>Tidak ada jadwal {pengangkutanFilter}</span></div>
                                    : <div className="jbsu-schedule-list">
                                        {filtered.map(item => (
                                            <div key={item.jadwal_id} className="jbsu-row">
                                                <span className="jbsu-row-day">
                                                    {!item.is_rutin
                                                        ? new Date(item.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                                                        : HARI_DISPLAY[item.hari] || item.hari
                                                    }
                                                </span>
                                                <span className="jbsu-row-time">
                                                    {formatTime(item.jam_mulai)} – {formatTime(item.jam_selesai)}
                                                </span>
                                                <span className="jbsu-row-week">
                                                    {!item.is_rutin ? "" : MINGGU_LABEL(item.minggu_ke)}
                                                </span>
                                                {!item.is_rutin && (
                                                    <span className="jbsu-badge insidental">Spesial</span>
                                                )}
                                                {/* No action buttons — read only */}
                                            </div>
                                        ))}
                                    </div>;
                            })()
                        )}
                    </div>

                </div>
            </div>

            {/* ── Riwayat Grid (2 kolom sejajar, di bawah main grid) ── */}
            <div className="jbsu-riwayat-grid">

                {/* Riwayat Penimbangan */}
                <div className="jbsu-card">
                    <div className="jbsu-section-header">
                        <span className="jbsu-card-title-icon" style={{ background: "#013236" }}>
                            <FaScaleBalanced />
                        </span>
                        <div>
                            <h2 className="jbsu-card-title">Riwayat Penimbangan</h2>
                            <p className="jbsu-card-sub">Riwayat pelaksanaan penimbangan</p>
                        </div>
                    </div>

                    <FilterPill
                        options={[
                            { label: "Semua", value: "semua" },
                            { label: "Mendatang", value: "mendatang" },
                            { label: "Berlangsung", value: "berlangsung" },
                            { label: "Selesai", value: "selesai" },
                            { label: "Dibatalkan", value: "dibatalkan" },
                        ]}
                        activeValue={riwayatFilter}
                        onChange={(v) => setRiwayatFilter(v)}
                    />

                    {filteredRiwayat.length === 0 ? (
                        <div className="jbsu-empty"><FaClockRotateLeft /><span>Tidak ada riwayat</span></div>
                    ) : (
                        <div className="jbsu-riwayat-list">
                            {filteredRiwayat.map(item => (
                                <div key={item.id} className="jbsu-riwayat-row">
                                    <span className="jbsu-riwayat-date">
                                        {new Date(item.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                    <span className="jbsu-riwayat-time">{item.jamMulai} – {item.jamSelesai}</span>
                                    <span className="jbsu-riwayat-label">{item.keterangan}</span>
                                    <span className={`jbsu-status-pill ${item.status}`}>
                                        {STATUS_LABEL[item.status]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Riwayat Pengangkutan */}
                <div className="jbsu-card">
                    <div className="jbsu-section-header">
                        <span className="jbsu-card-title-icon" style={{ background: "#f59e0b" }}>
                            <FaTruckFast />
                        </span>
                        <div>
                            <h2 className="jbsu-card-title">Riwayat Pengangkutan</h2>
                            <p className="jbsu-card-sub">Riwayat pelaksanaan pengangkutan</p>
                        </div>
                    </div>

                    <FilterPill
                        options={[
                            { label: "Semua", value: "semua" },
                            { label: "Mendatang", value: "mendatang" },
                            { label: "Berlangsung", value: "berlangsung" },
                            { label: "Selesai", value: "selesai" },
                            { label: "Dibatalkan", value: "dibatalkan" },
                        ]}
                        activeValue={riwayatAngkutFilter}
                        onChange={(v) => setRiwayatAngkutFilter(v)}
                    />

                    {filteredRiwayatAngkut.length === 0 ? (
                        <div className="jbsu-empty"><FaClockRotateLeft /><span>Tidak ada riwayat</span></div>
                    ) : (
                        <div className="jbsu-riwayat-list">
                            {filteredRiwayatAngkut.map(item => (
                                <div key={item.id} className="jbsu-riwayat-row angkut">
                                    <span className="jbsu-riwayat-date">
                                        {new Date(item.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                    <span className="jbsu-riwayat-time">{item.jamMulai} – {item.jamSelesai}</span>
                                    <span className="jbsu-riwayat-label">{item.keterangan}</span>
                                    <span className={`jbsu-status-pill ${item.status}`}>
                                        {STATUS_LABEL[item.status]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* ═══════════════════════════════════════════════════
               MODAL — Tambah Jadwal Penimbangan
               ═══════════════════════════════════════════════════ */}
            {isModalOpen && createPortal(
                <div className="jmodal-overlay" onClick={handleCloseModal}>
                    <div className="jmodal-box" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="jmodal-header">
                            <div>
                                <h2 className="jmodal-title">{editJadwalId ? "Edit Jadwal Penimbangan" : "Tambah Jadwal Penimbangan"}</h2>
                                <p className="jmodal-sub">{editJadwalId ? "Perbarui informasi jadwal penimbangan" : "Tambahkan jadwal rutin atau jadwal spesial"}</p>
                            </div>
                            <CloseButton onClick={handleCloseModal} />
                        </div>

                        {/* Type Toggle */}
                        <div className="jmodal-type-toggle" style={{ opacity: editJadwalId ? 0.6 : 1 }}>
                            <button
                                className={`jmodal-type-btn ${formType === "rutin" ? "active" : ""}`}
                                onClick={() => { if (!editJadwalId) { setFormType("rutin"); setFormError(""); } }}
                                disabled={!!editJadwalId}
                                style={{ cursor: editJadwalId ? "not-allowed" : "pointer" }}
                            >
                                <FaCalendarCheck style={{ marginRight: 6 }} />
                                Jadwal Rutin
                            </button>
                            <button
                                className={`jmodal-type-btn ${formType === "spesial" ? "active" : ""}`}
                                onClick={() => { if (!editJadwalId) { setFormType("spesial"); setFormError(""); } }}
                                disabled={!!editJadwalId}
                                style={{ cursor: editJadwalId ? "not-allowed" : "pointer" }}
                            >
                                <FaCalendarPlus style={{ marginRight: 6 }} />
                                Jadwal Spesial
                            </button>
                        </div>

                        {/* Form */}
                        <div className="jmodal-form">

                            {formType === "rutin" ? (
                                <>
                                    {/* Hari */}
                                    <div className="jmodal-field">
                                        <label className="jmodal-label">Hari Penimbangan</label>
                                        <Dropdown
                                            options={HARI_OPTIONS}
                                            placeholder="Pilih hari..."
                                            value={formHari}
                                            onChange={(e) => setFormHari(e.target.value)}
                                            fullWidth
                                        />
                                    </div>

                                    {/* Minggu ke */}
                                    <div className="jmodal-field">
                                        <label className="jmodal-label">Minggu ke</label>
                                        <Dropdown
                                            options={MINGGU_OPTIONS}
                                            placeholder="Pilih minggu..."
                                            value={formMingguKe}
                                            onChange={(e) => setFormMingguKe(e.target.value)}
                                            fullWidth
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Tanggal */}
                                    <div className="jmodal-field">
                                        <label className="jmodal-label">Tanggal</label>
                                        <Input
                                            type="date"
                                            value={formTanggal}
                                            onChange={(e) => setFormTanggal(e.target.value)}
                                            fullWidth
                                        />
                                    </div>

                                    {/* Nama Jadwal Spesial */}
                                    <div className="jmodal-field">
                                        <label className="jmodal-label">Nama Jadwal Spesial</label>
                                        <Input
                                            type="text"
                                            placeholder="Contoh: Penimbangan Hari Bumi"
                                            value={formNamaSpesial}
                                            onChange={(e) => setFormNamaSpesial(e.target.value)}
                                            fullWidth
                                        />
                                    </div>
                                </>
                            )}

                            {/* Jam Mulai & Selesai */}
                            <div className="jmodal-row">
                                <div className="jmodal-field">
                                    <label className="jmodal-label">Jam Mulai</label>
                                    <Input
                                        type="time"
                                        value={formJamMulai}
                                        onChange={(e) => setFormJamMulai(e.target.value)}
                                        fullWidth
                                    />
                                </div>
                                <div className="jmodal-field">
                                    <label className="jmodal-label">Jam Selesai</label>
                                    <Input
                                        type="time"
                                        value={formJamSelesai}
                                        onChange={(e) => setFormJamSelesai(e.target.value)}
                                        fullWidth
                                    />
                                </div>
                            </div>

                            {/* Error */}
                            {formError && (
                                <p className="jmodal-error">{formError}</p>
                            )}

                            {/* Actions */}
                            <div className="jmodal-actions">
                                <Button
                                    variant="ghost"
                                    color="primary"
                                    isRounded
                                    onClick={handleCloseModal}
                                    disabled={isSubmitting}
                                >
                                    Batal
                                </Button>
                                <Button
                                    variant="solid"
                                    color="primary"
                                    isRounded
                                    icon={<FaPlus />}
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Menyimpan..." : "Simpan Jadwal"}
                                </Button>
                            </div>
                        </div>

                    </div>
                </div>,
                document.body
            )}

            {/* ═══════════════════════════════════════════════════
               Notifikasi
               ═══════════════════════════════════════════════════ */}
            {notif.show && (
                <PopupNotifikasi
                    message={notif.message}
                    type={notif.type}
                    onClose={() => setNotif(prev => ({ ...prev, show: false }))}
                />
            )}

            {/* ═══════════════════════════════════════════════════
               Popup Konfirmasi Hapus
               ═══════════════════════════════════════════════════ */}
            <PopupConfirmation
                isOpen={!!deleteJadwalId}
                type="danger"
                title="Hapus Jadwal"
                message="Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan."
                confirmText="Hapus Jadwal"
                cancelText="Batal"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteJadwalId(null)}
            />

        </div>
    )
}
