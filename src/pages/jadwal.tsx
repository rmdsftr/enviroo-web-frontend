import { useState, useMemo } from "react";
import { FaCalendarDay, FaCalendarWeek, FaChevronLeft, FaChevronRight, FaClock } from "react-icons/fa6";
import Tabs from "../components/tabs";
import "../styles/jadwal.css";

export type JadwalStatus = "menunggu" | "menuju_lokasi" | "berlangsung" | "selesai" | "dibatalkan" | "tertunda";
export type BankType = "bsi" | "bsm" | "bsu";

interface JadwalItem {
    id: string;
    bankName: string;
    bankType: BankType;
    jamMulai: string;
    jamSelesai: string;
    hari: string;
    type: "penimbangan" | "pengangkutan";
    status: JadwalStatus;
    petugas?: string;
    armada?: string;
    lokasi?: string;
}

type TabType = "penimbangan" | "pengangkutan";

const HARI_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const HARI_MAP: Record<string, string> = {
    Sunday: "Minggu", Monday: "Senin", Tuesday: "Selasa",
    Wednesday: "Rabu", Thursday: "Kamis", Friday: "Jumat", Saturday: "Sabtu",
};
const HOUR_SLOTS = Array.from({ length: 12 }, (_, i) => i + 7); // 07-18

function toMinutes(t: string) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}
function isInHour(item: JadwalItem, hour: number) {
    return toMinutes(item.jamMulai) < (hour + 1) * 60 && toMinutes(item.jamSelesai) > hour * 60;
}

const STATUS_LABEL: Record<JadwalStatus, string> = {
    menunggu: "Menunggu", menuju_lokasi: "Menuju Lokasi", berlangsung: "Berlangsung",
    selesai: "Selesai", dibatalkan: "Dibatalkan", tertunda: "Tertunda",
};

const DUMMY: JadwalItem[] = [
    // ── Penimbangan ──
    { id: "p1", bankName: "BSI Sukamaju",    bankType: "bsi", jamMulai: "08:00", jamSelesai: "10:00", hari: "Senin",  type: "penimbangan", status: "berlangsung", petugas: "Budi Santoso",  lokasi: "Jl. Sukamaju No. 12" },
    { id: "p2", bankName: "BSI Cimahi Utara", bankType: "bsi", jamMulai: "10:30", jamSelesai: "12:00", hari: "Senin",  type: "penimbangan", status: "menunggu",    petugas: "Agus Pratama", lokasi: "Kec. Cimahi Utara" },
    { id: "p3", bankName: "BSI Mawar Indah",  bankType: "bsi", jamMulai: "08:00", jamSelesai: "09:30", hari: "Selasa", type: "penimbangan", status: "selesai" },
    { id: "p4", bankName: "BSU Sejahtera",    bankType: "bsu", jamMulai: "13:00", jamSelesai: "15:00", hari: "Rabu",   type: "penimbangan", status: "dibatalkan" },
    { id: "p5", bankName: "BSI Sukamaju",     bankType: "bsi", jamMulai: "08:00", jamSelesai: "10:00", hari: "Kamis", type: "penimbangan", status: "tertunda" },
    { id: "p6", bankName: "BSM Bersih Kota",  bankType: "bsm", jamMulai: "09:00", jamSelesai: "11:00", hari: "Kamis", type: "penimbangan", status: "menunggu" },
    { id: "p7", bankName: "BSU Maju Bersama", bankType: "bsu", jamMulai: "13:00", jamSelesai: "15:30", hari: "Kamis", type: "penimbangan", status: "menunggu" },
    { id: "p8", bankName: "BSI Cimahi Utara", bankType: "bsi", jamMulai: "08:00", jamSelesai: "10:30", hari: "Sabtu", type: "penimbangan", status: "menunggu" },
    { id: "p9", bankName: "BSM Hijau Lestari",bankType: "bsm", jamMulai: "09:00", jamSelesai: "11:00", hari: "Jumat", type: "penimbangan", status: "menunggu" },
    { id: "p10",bankName: "BSU Ceria",        bankType: "bsu", jamMulai: "14:00", jamSelesai: "16:00", hari: "Selasa",type: "penimbangan", status: "menunggu" },
    // ── Pengangkutan ──
    { id: "a1", bankName: "BSU Sejahtera",    bankType: "bsu", jamMulai: "07:00", jamSelesai: "09:00", hari: "Senin",  type: "pengangkutan", status: "menuju_lokasi", armada: "D 8122 XA (Truk Bak)" },
    { id: "a2", bankName: "BSM Bersih Kota",  bankType: "bsm", jamMulai: "14:00", jamSelesai: "16:00", hari: "Selasa", type: "pengangkutan", status: "menunggu" },
    { id: "a3", bankName: "BSI Sukamaju",     bankType: "bsi", jamMulai: "07:30", jamSelesai: "09:30", hari: "Rabu",   type: "pengangkutan", status: "menunggu" },
    { id: "a4", bankName: "BSI Mawar Indah",  bankType: "bsi", jamMulai: "10:00", jamSelesai: "12:00", hari: "Kamis", type: "pengangkutan", status: "menunggu" },
    { id: "a5", bankName: "BSM Hijau Lestari",bankType: "bsm", jamMulai: "09:00", jamSelesai: "11:00", hari: "Kamis", type: "pengangkutan", status: "berlangsung" },
    { id: "a6", bankName: "BSU Sejahtera",    bankType: "bsu", jamMulai: "08:00", jamSelesai: "10:00", hari: "Jumat", type: "pengangkutan", status: "menunggu" },
    { id: "a7", bankName: "BSM Bersih Kota",  bankType: "bsm", jamMulai: "13:00", jamSelesai: "15:00", hari: "Sabtu", type: "pengangkutan", status: "menunggu" },
];

export default function JadwalPage() {
    const [activeTab, setActiveTab] = useState<TabType>("penimbangan");
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const todayHari = useMemo(() => {
        const en = new Date().toLocaleDateString("en-US", { weekday: "long" });
        return HARI_MAP[en] || "Senin";
    }, []);

    const filtered = useMemo(() => DUMMY.filter(j => j.type === activeTab), [activeTab]);

    const todayJadwal = useMemo(() => filtered.filter(j => j.hari === todayHari), [filtered, todayHari]);

    const byHari = useMemo(() => {
        const g: Record<string, JadwalItem[]> = {};
        HARI_ORDER.forEach(h => (g[h] = []));
        filtered.forEach(j => { if (g[j.hari]) g[j.hari].push(j); });
        return g;
    }, [filtered]);

    const daysInMonth = useMemo(() => {
        const y = currentMonth.getFullYear(), m = currentMonth.getMonth();
        const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
        const days: (Date | null)[] = [];
        for (let i = 0; i < first.getDay(); i++) days.push(null);
        for (let i = 1; i <= last.getDate(); i++) days.push(new Date(y, m, i));
        return days;
    }, [currentMonth]);

    const selectedHari = useMemo(() => {
        const en = selectedDate.toLocaleDateString("en-US", { weekday: "long" });
        return HARI_MAP[en] || "Senin";
    }, [selectedDate]);

    const jadwalTerpilih = useMemo(() =>
        DUMMY.filter(j => j.hari === selectedHari && j.type === activeTab)
             .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai)),
        [selectedHari, activeTab]
    );

    const selectedDateStr = selectedDate.toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
    const isSel   = (d: Date) => d.toDateString() === selectedDate.toDateString();
    const prevM = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const nextM = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    return (
        <div className="jadwal-page">

            {/* Tabs */}
            <div className="jadwal-page-header">
                <Tabs
                    tabs={[
                        { id: "penimbangan", label: "Jadwal Penimbangan" },
                        { id: "pengangkutan", label: "Jadwal Pengangkutan" }
                    ]}
                    activeTab={activeTab}
                    onChange={(id) => setActiveTab(id as any)}
                />
            </div>

            {/* ── Top Grid: Section 1 + Section 3 ── */}
            <div className="jadwal-top-grid">

                {/* Section 1: Timeline Hari Ini */}
                <div className="jadwal-card jadwal-today-section">
                    <div className="jadwal-card-header">
                        <div className="jadwal-card-header-icon bsi-bg"><FaClock /></div>
                        <div>
                            <h2 className="jadwal-card-title">Jadwal Hari Ini</h2>
                            <p className="jadwal-card-sub">{todayHari}, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                        </div>
                    </div>

                    <div className="jadwal-timeline">
                        {HOUR_SLOTS.map(hour => {
                            const items = todayJadwal.filter(j => isInHour(j, hour));
                            return (
                                <div key={hour} className={`jadwal-tl-row${items.length > 0 ? " has-items" : ""}`}>
                                    <div className="jadwal-tl-hour">{String(hour).padStart(2, "0")}:00</div>
                                    <div className="jadwal-tl-line" />
                                    <div className="jadwal-tl-content">
                                        {items.map(item => (
                                            <div key={item.id} className={`jadwal-tl-chip bt-${item.bankType}`}>
                                                <span className="jadwal-tl-chip-name">{item.bankName}</span>
                                                <span className="jadwal-tl-chip-time">{item.jamMulai}–{item.jamSelesai}</span>
                                                <span className={`jadwal-status-dot st-${item.status}`} title={STATUS_LABEL[item.status]} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        {todayJadwal.length === 0 && (
                            <div className="jadwal-empty-state"><FaClock /><span>Tidak ada jadwal untuk hari ini</span></div>
                        )}
                    </div>
                </div>

                {/* Section 3: Calendar + Date Detail */}
                <div className="jadwal-right-col">

                    {/* Calendar */}
                    <div className="jadwal-calendar-container">
                        <div className="jadwal-calendar-header">
                            <button onClick={prevM}><FaChevronLeft /></button>
                            <h3>{currentMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</h3>
                            <button onClick={nextM}><FaChevronRight /></button>
                        </div>
                        <div className="jadwal-calendar-grid">
                            {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map(d => (
                                <span key={d} className="jadwal-calendar-day-name">{d}</span>
                            ))}
                            {daysInMonth.map((day, idx) =>
                                !day
                                    ? <span key={`e-${idx}`} className="jadwal-calendar-day empty" />
                                    : <button key={idx}
                                        className={`jadwal-calendar-day${isSel(day) ? " selected" : ""}${isToday(day) ? " today" : ""}`}
                                        onClick={() => setSelectedDate(day)}>
                                        {day.getDate()}
                                      </button>
                            )}
                        </div>
                    </div>

                    {/* Date Detail */}
                    <div className="jadwal-date-detail">
                        <div className="jadwal-date-detail-header">
                            <FaCalendarDay className="jadwal-date-icon" />
                            <div>
                                <p className="jadwal-date-detail-title">Jadwal Terpilih</p>
                                <p className="jadwal-date-detail-sub">{selectedDateStr}</p>
                            </div>
                        </div>
                        {jadwalTerpilih.length === 0
                            ? <p className="jadwal-date-empty">Tidak ada jadwal pada tanggal ini</p>
                            : <div className="jadwal-date-list">
                                {jadwalTerpilih.map(item => (
                                    <div key={item.id} className={`jadwal-date-item bt-${item.bankType}`}>
                                        <span className="jadwal-date-item-time">{item.jamMulai}</span>
                                        <span className="jadwal-date-item-name">{item.bankName}</span>
                                        <span className={`jadwal-status-dot st-${item.status}`} title={STATUS_LABEL[item.status]} />
                                    </div>
                                ))}
                              </div>
                        }
                    </div>
                </div>
            </div>

            {/* ── Section 2: Weekly Grid ── */}
            <div className="jadwal-card jadwal-weekly-section">
                <div className="jadwal-card-header">
                    <div className="jadwal-card-header-icon bsm-bg"><FaCalendarWeek /></div>
                    <div>
                        <h2 className="jadwal-card-title">Jadwal Mingguan</h2>
                        <p className="jadwal-card-sub">{activeTab === "penimbangan" ? "Penimbangan" : "Pengangkutan"} — Senin s/d Minggu</p>
                    </div>
                    <div className="jadwal-legend">
                        <span className="jadwal-legend-item"><span className="jadwal-legend-dot bt-bsi" />BSI</span>
                        <span className="jadwal-legend-item"><span className="jadwal-legend-dot bt-bsm" />BSM</span>
                        <span className="jadwal-legend-item"><span className="jadwal-legend-dot bt-bsu" />BSU</span>
                    </div>
                </div>

                <div className="jadwal-weekly-grid">
                    {HARI_ORDER.map(hari => {
                        const isCurrentDay = hari === todayHari;
                        const items = byHari[hari];
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
                                            <div key={item.id} className={`jadwal-chip bt-${item.bankType}`}>
                                                <span className="jadwal-chip-name">{item.bankName}</span>
                                                <span className="jadwal-chip-divider" />
                                                <span className="jadwal-chip-time">{item.jamMulai}–{item.jamSelesai}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}
