import { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    FaCalendarDay, FaChevronLeft, FaChevronRight, FaPlus,
    FaPen, FaTrash, FaScaleBalanced, FaTruckFast, FaClockRotateLeft,
    FaCalendarCheck, FaCalendarPlus, FaCalendarWeek,
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
import "../../styles/jadwal-bsu.css";
import "../../styles/jadwal.css";
import { BsiService } from "../../services/bsi.service";

/* ── Types ── */
type JadwalFilter = "semua" | "rutin" | "spesial";
type WeeklyTab = "penimbangan" | "pengangkutan";
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
const HARI_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
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
const MINGGU_LABEL = (n: number) => n === 0 ? "Setiap minggu" : `Minggu ke-${n}`;
const STATUS_LABEL: Record<RiwayatStatus, string> = {
    selesai: "Selesai", berlangsung: "Berlangsung",
    dibatalkan: "Dibatalkan", mendatang: "Mendatang",
};

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

/* ── Dummy riwayat (replace with API later) ── */
const DUMMY_RIWAYAT: RiwayatItem[] = [
    { id: "r1", tanggal: "2026-04-14", jamMulai: "08:00", jamSelesai: "10:00", keterangan: "Penimbangan rutin Senin", status: "selesai" },
    { id: "r2", tanggal: "2026-04-20", jamMulai: "08:00", jamSelesai: "10:00", keterangan: "Penimbangan rutin Senin", status: "berlangsung" },
    { id: "r3", tanggal: "2026-04-22", jamMulai: "09:00", jamSelesai: "12:00", keterangan: "Penimbangan Hari Bumi", status: "mendatang" },
    { id: "r4", tanggal: "2026-04-09", jamMulai: "13:00", jamSelesai: "15:00", keterangan: "Penimbangan Rabu", status: "dibatalkan" },
];
const DUMMY_RIWAYAT_ANGKUT: RiwayatItem[] = [
    { id: "ra1", tanggal: "2026-04-15", jamMulai: "07:00", jamSelesai: "09:00", keterangan: "Pengangkutan rutin Selasa", status: "selesai" },
    { id: "ra2", tanggal: "2026-04-22", jamMulai: "07:00", jamSelesai: "09:00", keterangan: "Pengangkutan rutin Selasa", status: "mendatang" },
    { id: "ra3", tanggal: "2026-04-01", jamMulai: "08:00", jamSelesai: "10:00", keterangan: "Pengangkutan Jumat", status: "dibatalkan" },
];

/* ============================================================
   COMPONENT
   ============================================================ */
export default function JadwalBsiPage() {
    const { user } = useAuth();

    /* Live data */
    const [penimbanganList, setPenimbanganList] = useState<JadwalItem[]>([]);
    const [pengangkutanList, setPengangkutanList] = useState<JadwalItem[]>([]);
    const [loading, setLoading] = useState(true);

    /* Calendar */
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    /* Modal */
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalJenis, setModalJenis] = useState<"penimbangan" | "pengangkutan">("penimbangan");
    const [editJadwalId, setEditJadwalId] = useState<string | null>(null);

    /* Form fields */
    const [formType, setFormType] = useState<"rutin" | "spesial">("rutin");
    const [formHari, setFormHari] = useState("senin");
    const [formMingguKe, setFormMingguKe] = useState("1");
    const [formJamMulai, setFormJamMulai] = useState("");
    const [formJamSelesai, setFormJamSelesai] = useState("");
    const [formTanggal, setFormTanggal] = useState("");
    const [formNamaSpesial, setFormNamaSpesial] = useState("");
    const [formTargetBankId, setFormTargetBankId] = useState("");
    const [formError, setFormError] = useState("");

    const [bsuOptions, setBsuOptions] = useState<{ label: string; value: string }[]>([]);

    /* Notifications & confirmation */
    const [notif, setNotif] = useState({ show: false, message: "", type: "success" as "success" | "error" | "info" });
    const [deleteJadwalId, setDeleteJadwalId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /* Filter states */
    const [penimbanganFilter, setPenimbanganFilter] = useState<JadwalFilter>("semua");
    const [pengangkutanFilter, setPengangkutanFilter] = useState<JadwalFilter>("semua");
    const [riwayatFilter, setRiwayatFilter] = useState<"semua" | RiwayatStatus>("semua");
    const [riwayatAngkutFilter, setRiwayatAngkutFilter] = useState<"semua" | RiwayatStatus>("semua");

    /* Weekly tab */
    const [weeklyTab, setWeeklyTab] = useState<WeeklyTab>("penimbangan");

    /* ── Fetch jadwal ── */
    const fetchJadwal = useCallback(async () => {
        if (!user?.bank_id) return;
        setLoading(true);
        try {
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

    const getBsuName = useCallback((bankId?: string) => {
        if (!bankId) return "";
        const bsu = bsuOptions.find(b => b.value === bankId);
        return bsu ? bsu.label : "Target BSU tidak diketahui";
    }, [bsuOptions]);

    const getWeekOfMonth = (date: Date) => {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return Math.ceil((date.getDate() + firstDay) / 7);
    };

    /* ── Calendar helpers ── */
    const todayHari = useMemo(() => {
        const en = new Date().toLocaleDateString("en-US", { weekday: "long" });
        return HARI_MAP[en] || "senin";
    }, []);

    const daysInMonth = useMemo(() => {
        const y = currentMonth.getFullYear(), m = currentMonth.getMonth();
        const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
        const days: (Date | null)[] = [];
        // Sunday-first grid
        const startDow = first.getDay();
        for (let i = 0; i < startDow; i++) days.push(null);
        for (let i = 1; i <= last.getDate(); i++) days.push(new Date(y, m, i));
        return days;
    }, [currentMonth]);

    const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
    const isSel   = (d: Date) => d.toDateString() === selectedDate.toDateString();
    const prevM = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const nextM = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const selectedDateStr = selectedDate.toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    const getDayMarks = (d: Date) => {
        const dayName = HARI_MAP[d.toLocaleDateString("en-US", { weekday: "long" })] || "";
        const weekOfMonth = getWeekOfMonth(d);
        const iso = getLocalISODate(d);
        const check = (list: JadwalItem[]) =>
            list.some(j => j.is_rutin
                ? j.hari === dayName && (j.minggu_ke === weekOfMonth || j.minggu_ke === 0)
                : getLocalISODate(new Date(j.tanggal)) === iso
            );
        return { hasPenimbangan: check(penimbanganList), hasPengangkutan: check(pengangkutanList) };
    };

    const allJadwal = useMemo(() => [
        ...penimbanganList.map(j => ({ ...j, type: "penimbangan" as const })),
        ...pengangkutanList.map(j => ({ ...j, type: "pengangkutan" as const })),
    ], [penimbanganList, pengangkutanList]);

    const selHari = HARI_MAP[selectedDate.toLocaleDateString("en-US", { weekday: "long" })] || "";
    const selWeek = getWeekOfMonth(selectedDate);
    const selISO  = getLocalISODate(selectedDate);

    const selectedJadwal = useMemo(() =>
        allJadwal
            .filter(j => j.is_rutin
                ? j.hari === selHari && (j.minggu_ke === selWeek || j.minggu_ke === 0)
                : getLocalISODate(new Date(j.tanggal)) === selISO
            )
            .sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai)),
        [allJadwal, selHari, selWeek, selISO]
    );

    /* ── Weekly grid ── */
    const weeklyList = weeklyTab === "penimbangan" ? penimbanganList : pengangkutanList;
    const byHari = useMemo(() => {
        const g: Record<string, JadwalItem[]> = {};
        HARI_ORDER.forEach(h => (g[h] = []));
        weeklyList.forEach(j => {
            const display = HARI_DISPLAY[j.hari];
            if (display && g[display]) g[display].push(j);
        });
        return g;
    }, [weeklyList]);

    /* ── Riwayat ── */
    const filteredRiwayat = riwayatFilter === "semua"
        ? DUMMY_RIWAYAT : DUMMY_RIWAYAT.filter(r => r.status === riwayatFilter);
    const filteredRiwayatAngkut = riwayatAngkutFilter === "semua"
        ? DUMMY_RIWAYAT_ANGKUT : DUMMY_RIWAYAT_ANGKUT.filter(r => r.status === riwayatAngkutFilter);

    /* ── Modal open/close ── */
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
            setFormType("rutin");
            setFormHari("senin");
            setFormMingguKe("1");
            setFormJamMulai("");
            setFormJamSelesai("");
            setFormTanggal("");
            setFormNamaSpesial("");
            setFormTargetBankId("");
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => { setIsModalOpen(false); setEditJadwalId(null); setFormError(""); };

    /* ── Submit ── */
    const handleSubmit = async () => {
        if (!formJamMulai || !formJamSelesai) {
            setFormError("Jam mulai dan jam selesai wajib diisi");
            return;
        }
        if (formType === "spesial" && !formTanggal) {
            setFormError("Tanggal wajib diisi untuk jadwal spesial");
            return;
        }
        if (modalJenis === "pengangkutan" && !formTargetBankId) {
            setFormError("Target BSU wajib dipilih untuk jadwal pengangkutan");
            return;
        }
        setIsSubmitting(true);
        setFormError("");
        const data = {
            hari: formType === "rutin" ? formHari : "",
            minggu_ke: formType === "rutin" ? parseInt(formMingguKe) : 0,
            jam_mulai: formJamMulai,
            jam_selesai: formJamSelesai,
            jenis_jadwal: modalJenis as "penimbangan" | "pengangkutan",
            is_active: true,
            is_rutin: formType === "rutin",
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
            handleCloseModal();
            fetchJadwal();
        } catch {
            setNotif({ show: true, message: "Gagal menyimpan jadwal", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ── Delete ── */
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

    /* ── Shared list renderer ── */
    const renderScheduleList = (
        list: JadwalItem[],
        filter: JadwalFilter,
        jenis: "penimbangan" | "pengangkutan",
        emptyIcon: React.ReactNode
    ) => {
        const filtered = list.filter(j =>
            filter === "semua" ? true : filter === "rutin" ? j.is_rutin : !j.is_rutin
        );
        if (filtered.length === 0)
            return <div className="jbsu-empty">{emptyIcon}<span>Tidak ada jadwal {filter !== "semua" ? filter : ""}</span></div>;
        return (
            <div className="jbsu-schedule-list">
                {filtered.map(item => (
                    <div key={item.jadwal_id} className="jbsu-row">
                        <span className="jbsu-row-day">
                            {!item.is_rutin
                                ? new Date(item.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                                : HARI_DISPLAY[item.hari] || item.hari}
                        </span>
                        <span className="jbsu-row-time">
                            {formatTime(item.jam_mulai)} – {formatTime(item.jam_selesai)}
                        </span>
                        <span className="jbsu-row-week">
                            {item.is_rutin ? MINGGU_LABEL(item.minggu_ke) : ""}
                        </span>
                        {!item.is_rutin && <span className="jbsu-badge insidental">Spesial</span>}
                        {jenis === "pengangkutan" && item.target_bank_id && (
                            <span className="jbsu-row-note" style={{ color: "#f59e0b", fontWeight: 600 }}>Ke: {getBsuName(item.target_bank_id)}</span>
                        )}
                        {!item.is_rutin && item.nama_jadwal_spesial && (
                            <span className="jbsu-row-note" style={{ marginLeft: jenis === "pengangkutan" ? "8px" : "0" }}>
                                {jenis === "pengangkutan" && item.target_bank_id ? `— ${item.nama_jadwal_spesial}` : item.nama_jadwal_spesial}
                            </span>
                        )}
                        <div className="jbsu-row-actions">
                            <button className="jbsu-row-btn edit" title="Edit" onClick={() => handleOpenModal(jenis, item)}>
                                <FaPen />
                            </button>
                            <button className="jbsu-row-btn delete" title="Hapus" onClick={() => setDeleteJadwalId(item.jadwal_id)}>
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    /* ============================================================
       RENDER
       ============================================================ */
    return (
        <div className="jbsu">

            {/* ── Notifications ── */}
            {notif.show && (
                <PopupNotifikasi
                    message={notif.message}
                    type={notif.type}
                    onClose={() => setNotif(prev => ({ ...prev, show: false }))}
                />
            )}

            {/* ── Delete Confirmation ── */}
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

            {/* ── Header ── */}
            <div className="jbsu-header">
                <div className="jbsu-header-left">
                    <h1>Manajemen Jadwal</h1>
                    <p>Kelola jadwal penimbangan dan pengangkutan BSI Anda</p>
                </div>
            </div>

            {/* ── Main Grid: Calendar Left + Schedule Right ── */}
            <div className="jbsu-main-grid">

                {/* LEFT: Calendar + Selected Detail */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

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
                                            {item.type === "penimbangan" 
                                                ? "Penimbangan" 
                                                : `Pengangkutan ke ${getBsuName(item.target_bank_id)}`}
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

                {/* RIGHT: Schedule Cards */}
                <div className="jbsu-right-col">

                    {/* Jadwal Penimbangan */}
                    <div className="jbsu-card">
                        <div className="jbsu-section-header">
                            <span className="jbsu-card-title-icon" style={{ background: "#4EA771" }}>
                                <FaScaleBalanced />
                            </span>
                            <div>
                                <h2 className="jbsu-card-title">Jadwal Penimbangan</h2>
                                <p className="jbsu-card-sub">Jadwal rutin & spesial penimbangan sampah</p>
                            </div>
                            <div className="jbsu-section-header-right">
                                <Button variant="solid" color="neon" isRounded icon={<FaPlus />}
                                    onClick={() => handleOpenModal("penimbangan")}>
                                    Tambah
                                </Button>
                            </div>
                        </div>

                        <FilterPill
                            options={[
                                { label: "Semua", value: "semua" },
                                { label: "Rutin", value: "rutin" },
                                { label: "Spesial", value: "spesial" },
                            ]}
                            activeValue={penimbanganFilter}
                            onChange={v => setPenimbanganFilter(v)}
                        />

                        {loading
                            ? <div className="jbsu-empty"><span>Memuat jadwal...</span></div>
                            : penimbanganList.length === 0
                                ? <div className="jbsu-empty"><FaScaleBalanced /><span>Belum ada jadwal penimbangan</span></div>
                                : renderScheduleList(penimbanganList, penimbanganFilter, "penimbangan", <FaScaleBalanced />)
                        }
                    </div>

                    {/* Jadwal Pengangkutan */}
                    <div className="jbsu-card">
                        <div className="jbsu-section-header">
                            <span className="jbsu-card-title-icon" style={{ background: "#f59e0b" }}>
                                <FaTruckFast />
                            </span>
                            <div>
                                <h2 className="jbsu-card-title">Jadwal Pengangkutan</h2>
                                <p className="jbsu-card-sub">Jadwal rutin & spesial pengangkutan sampah</p>
                            </div>
                            <div className="jbsu-section-header-right">
                                <Button variant="solid" color="neon" isRounded icon={<FaPlus />}
                                    onClick={() => handleOpenModal("pengangkutan")}>
                                    Tambah
                                </Button>
                            </div>
                        </div>

                        <FilterPill
                            options={[
                                { label: "Semua", value: "semua" },
                                { label: "Rutin", value: "rutin" },
                                { label: "Spesial", value: "spesial" },
                            ]}
                            activeValue={pengangkutanFilter}
                            onChange={v => setPengangkutanFilter(v)}
                        />

                        {loading
                            ? <div className="jbsu-empty"><span>Memuat jadwal...</span></div>
                            : pengangkutanList.length === 0
                                ? <div className="jbsu-empty"><FaTruckFast /><span>Belum ada jadwal pengangkutan</span></div>
                                : renderScheduleList(pengangkutanList, pengangkutanFilter, "pengangkutan", <FaTruckFast />)
                        }
                    </div>
                </div>
            </div>

            {/* ── Weekly Grid Card ── */}
            <div className="jbsu-card">
                <div className="jbsu-section-header">
                    <span className="jbsu-card-title-icon" style={{ background: "#013236" }}>
                        <FaCalendarWeek />
                    </span>
                    <div>
                        <h2 className="jbsu-card-title">Jadwal Mingguan</h2>
                        <p className="jbsu-card-sub">Senin s/d Minggu</p>
                    </div>
                    <div className="jbsu-section-header-right">
                        <FilterPill
                            options={[
                                { label: "Penimbangan", value: "penimbangan" },
                                { label: "Pengangkutan", value: "pengangkutan" },
                            ]}
                            activeValue={weeklyTab}
                            onChange={v => setWeeklyTab(v)}
                        />
                    </div>
                </div>

                <div className="jadwal-weekly-grid">
                    {HARI_ORDER.map(hari => {
                        const hariKey = hari.toLowerCase();
                        const isCurrentDay = todayHari === hariKey;
                        const items = byHari[hari] ?? [];
                        return (
                            <div key={hari} className={`jadwal-day-row${isCurrentDay ? " today" : ""}`}>
                                <div className="jadwal-day-label">
                                    <span className="jadwal-day-label-text">
                                        {isCurrentDay && <span className="jadwal-day-today-dot" />}
                                        {hari}
                                    </span>
                                </div>
                                <div className="jadwal-day-items">
                                    {items.length === 0
                                        ? <span className="jadwal-day-empty">Tidak ada jadwal</span>
                                        : items.map(item => (
                                            <div key={item.jadwal_id}
                                                className={`jadwal-chip ${weeklyTab === "penimbangan" ? "bt-bsi" : "bt-bsm"}`}>
                                                <span className="jadwal-chip-name">
                                            {weeklyTab === "pengangkutan" && item.target_bank_id 
                                                ? `Ke: ${getBsuName(item.target_bank_id)}`
                                                : item.is_rutin ? MINGGU_LABEL(item.minggu_ke) : (item.nama_jadwal_spesial || "Spesial")}
                                                </span>
                                                <span className="jadwal-chip-divider" />
                                                <span className="jadwal-chip-time">
                                                    {formatTime(item.jam_mulai)}–{formatTime(item.jam_selesai)}
                                                </span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Riwayat Grid ── */}
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
                        onChange={v => setRiwayatFilter(v)}
                    />

                    {filteredRiwayat.length === 0
                        ? <div className="jbsu-empty"><FaClockRotateLeft /><span>Tidak ada riwayat</span></div>
                        : <div className="jbsu-riwayat-list">
                            {filteredRiwayat.map(item => (
                                <div key={item.id} className="jbsu-riwayat-row">
                                    <span className="jbsu-riwayat-date">
                                        {new Date(item.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                    <span className="jbsu-riwayat-time">{item.jamMulai} – {item.jamSelesai}</span>
                                    <span className="jbsu-riwayat-label">{item.keterangan}</span>
                                    <span className={`jbsu-status-pill ${item.status}`}>{STATUS_LABEL[item.status]}</span>
                                </div>
                            ))}
                        </div>
                    }
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
                        onChange={v => setRiwayatAngkutFilter(v)}
                    />

                    {filteredRiwayatAngkut.length === 0
                        ? <div className="jbsu-empty"><FaClockRotateLeft /><span>Tidak ada riwayat</span></div>
                        : <div className="jbsu-riwayat-list">
                            {filteredRiwayatAngkut.map(item => (
                                <div key={item.id} className="jbsu-riwayat-row angkut">
                                    <span className="jbsu-riwayat-date">
                                        {new Date(item.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                    <span className="jbsu-riwayat-time">{item.jamMulai} – {item.jamSelesai}</span>
                                    <span className="jbsu-riwayat-label">{item.keterangan}</span>
                                    <span className={`jbsu-status-pill ${item.status}`}>{STATUS_LABEL[item.status]}</span>
                                </div>
                            ))}
                        </div>
                    }
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════
               MODAL — Tambah/Edit Jadwal
               ═══════════════════════════════════════════════════ */}
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

                        {/* Type Toggle */}
                        <div className="jmodal-type-toggle" style={{ opacity: editJadwalId ? 0.6 : 1 }}>
                            <button
                                className={`jmodal-type-btn ${formType === "rutin" ? "active" : ""}`}
                                onClick={() => { if (!editJadwalId) { setFormType("rutin"); setFormError(""); } }}
                                disabled={!!editJadwalId}
                                style={{ cursor: editJadwalId ? "not-allowed" : "pointer" }}
                            >
                                <FaCalendarCheck style={{ marginRight: 6 }} /> Jadwal Rutin
                            </button>
                            <button
                                className={`jmodal-type-btn ${formType === "spesial" ? "active" : ""}`}
                                onClick={() => { if (!editJadwalId) { setFormType("spesial"); setFormError(""); } }}
                                disabled={!!editJadwalId}
                                style={{ cursor: editJadwalId ? "not-allowed" : "pointer" }}
                            >
                                <FaCalendarPlus style={{ marginRight: 6 }} /> Jadwal Spesial
                            </button>
                        </div>

                        {/* Form */}
                        <div className="jmodal-form">
                            {formType === "rutin" ? (
                                <>
                                    <div className="jmodal-field">
                                        <label className="jmodal-label">Hari</label>
                                        <Dropdown
                                            options={HARI_OPTIONS}
                                            placeholder="Pilih hari..."
                                            value={formHari}
                                            onChange={(e) => setFormHari(e.target.value)}
                                            fullWidth
                                        />
                                    </div>
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
                                    <div className="jmodal-field">
                                        <label className="jmodal-label">Tanggal</label>
                                        <Input type="date" value={formTanggal}
                                            onChange={(e) => setFormTanggal(e.target.value)} fullWidth />
                                    </div>
                                    <div className="jmodal-field">
                                        <label className="jmodal-label">Nama Jadwal Spesial</label>
                                        <Input type="text" placeholder="Cth: Penimbangan Hari Bumi"
                                            value={formNamaSpesial}
                                            onChange={(e) => setFormNamaSpesial(e.target.value)} fullWidth />
                                    </div>
                                </>
                            )}

                            {modalJenis === "pengangkutan" && (
                                <div className="jmodal-field">
                                    <label className="jmodal-label">Target BSU</label>
                                    <Dropdown
                                        options={bsuOptions}
                                        placeholder="Pilih BSU tujuan..."
                                        value={formTargetBankId}
                                        onChange={(e) => setFormTargetBankId(e.target.value)}
                                        fullWidth
                                    />
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
                                <Button variant="ghost" color="primary" isRounded
                                    onClick={handleCloseModal} disabled={isSubmitting}>
                                    Batal
                                </Button>
                                <Button variant="solid" color="primary" isRounded
                                    icon={<FaPlus />} onClick={handleSubmit} disabled={isSubmitting}>
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
