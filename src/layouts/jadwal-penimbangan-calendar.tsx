import { useState, useMemo } from "react";
import {
    FaChevronLeft, FaChevronRight, FaCalendarDay,
    FaScaleBalanced, FaPen, FaTrash,
} from "react-icons/fa6";
import type { JadwalItem } from "../services/jadwal.service";
import "../styles/jadwal-bsu.css";

/* ── Constants ── */
const HARI_MAP: Record<string, string> = {
    Sunday: "minggu", Monday: "senin", Tuesday: "selasa",
    Wednesday: "rabu", Thursday: "kamis", Friday: "jumat", Saturday: "sabtu",
};
const HARI_DISPLAY: Record<string, string> = {
    senin: "Senin", selasa: "Selasa", rabu: "Rabu",
    kamis: "Kamis", jumat: "Jumat", sabtu: "Sabtu", minggu: "Minggu",
};
const CAL_HEADERS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

/* ── Helpers ── */
function getMondayFirstCol(date: Date): number {
    const d = date.getDay();
    return d === 0 ? 6 : d - 1;
}

function buildCalendarWeeks(year: number, month: number): (Date | null)[][] {
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    const cells: (Date | null)[] = [];
    for (let i = 0; i < getMondayFirstCol(firstDay); i++) cells.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
}

function getLocalISODate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekOfMonth(date: Date): number {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return Math.ceil((date.getDate() + firstDay) / 7);
}

export function formatTime(timeStr: string): string {
    if (!timeStr) return "";
    const m = timeStr.match(/^(\d{2}:\d{2})(:\d{2})?(?:[+-]\d{2}:\d{2}|Z)?$/);
    if (m) return m[1];
    try {
        const d = new Date(timeStr);
        if (isNaN(d.getTime())) return timeStr;
        return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch { return timeStr; }
}

function getItemsForDate(date: Date, list: JadwalItem[]): JadwalItem[] {
    const hariStr    = HARI_MAP[date.toLocaleDateString("en-US", { weekday: "long" })] ?? "";
    const dateISO    = getLocalISODate(date);
    const weekOfMonth = getWeekOfMonth(date);
    return list
        .filter(j => j.is_rutin
            ? j.hari === hariStr && (j.minggu_ke === 0 || j.minggu_ke === weekOfMonth)
            : j.tanggal?.split("T")[0] === dateISO
        )
        .sort((a, b) => formatTime(a.jam_mulai).localeCompare(formatTime(b.jam_mulai)));
}

/* ── Props ── */
interface Props {
    jadwalList: JadwalItem[];
    loading?: boolean;
    onEdit?: (item: JadwalItem) => void;
    onDelete?: (jadwalId: string) => void;
    onMonthChange?: (month: number, year: number) => void;
}

/* ── Component ── */
export default function JadwalPenimbanganCalendar({ jadwalList, loading, onEdit, onDelete, onMonthChange }: Props) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate]  = useState(new Date());

    const prevM = () => {
        const newM = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        setCurrentMonth(newM);
        onMonthChange?.(newM.getMonth() + 1, newM.getFullYear());
    };
    const nextM = () => {
        const newM = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        setCurrentMonth(newM);
        onMonthChange?.(newM.getMonth() + 1, newM.getFullYear());
    };

    const calWeeks = useMemo(
        () => buildCalendarWeeks(currentMonth.getFullYear(), currentMonth.getMonth()),
        [currentMonth]
    );

    const selectedItems = useMemo(
        () => getItemsForDate(selectedDate, jadwalList),
        [selectedDate, jadwalList]
    );

    const selectedDateStr = selectedDate.toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
    const isSel   = (d: Date) => d.toDateString() === selectedDate.toDateString();

    return (
        <div className="jadwal-cal-card">

            {/* ── Header ── */}
            <div className="jadwal-cal-header">
                <div className="jadwal-cal-header-left">
                    <div className="jbsu-card-title-icon" style={{ background: "#4EA771", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 15, flexShrink: 0 }}>
                        <FaScaleBalanced />
                    </div>
                    <div>
                        <h2 className="jbsu-card-title">Jadwal Penimbangan</h2>
                        <p className="jbsu-card-sub">Klik tanggal untuk melihat detail jadwal</p>
                    </div>
                </div>
                <div className="jadwal-cal-nav">
                    <button onClick={prevM} aria-label="Bulan sebelumnya"><FaChevronLeft /></button>
                    <span>{currentMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</span>
                    <button onClick={nextM} aria-label="Bulan berikutnya"><FaChevronRight /></button>
                </div>
            </div>

            {/* ── Day-of-week headers ── */}
            <div className="jadwal-cal-grid-header">
                {CAL_HEADERS.map(d => <div key={d} className="jadwal-cal-dh">{d}</div>)}
            </div>

            {/* ── Calendar body ── */}
            {loading ? (
                <div className="jbsu-empty" style={{ padding: "48px 0" }}>
                    <span>Memuat jadwal...</span>
                </div>
            ) : (
                <div className="jadwal-cal-body">
                    {calWeeks.map((week, wi) => (
                        <div key={wi} className="jadwal-cal-week">
                            {week.map((day, di) => {
                                if (!day) return <div key={di} className="jadwal-cal-cell empty" />;
                                const items        = getItemsForDate(day, jadwalList);
                                const visible      = items.slice(0, 2);
                                const overflowCount = items.length - 2;
                                return (
                                    <div
                                        key={di}
                                        className={`jadwal-cal-cell${isToday(day) ? " today" : ""}${isSel(day) ? " selected" : ""}`}
                                        onClick={() => setSelectedDate(day)}
                                    >
                                        <span className="jadwal-cal-date-num">{day.getDate()}</span>
                                        {items.length > 0 && (
                                            <div className="jadwal-cal-chips">
                                                {visible.map(item => (
                                                    <div key={item.jadwal_id} className={`jadwal-cal-chip ${item.is_rutin ? "rutin" : "spesial"}`}>
                                                        <span className="jadwal-cal-chip-dot" />
                                                        <span className="jadwal-cal-chip-text">
                                                            {formatTime(item.jam_mulai)}
                                                        </span>
                                                    </div>
                                                ))}
                                                {overflowCount > 0 && (
                                                    <span className="jadwal-cal-overflow">+{overflowCount} lainnya</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Selected-date detail strip ── */}
            <div className="jadwal-cal-detail-panel">
                <div className="jadwal-cal-detail-header">
                    <FaCalendarDay className="jadwal-cal-detail-icon" />
                    <div>
                        <p className="jadwal-cal-detail-title">{selectedDateStr}</p>
                        <p className="jadwal-cal-detail-count">
                            {selectedItems.length === 0
                                ? "Tidak ada jadwal pada tanggal ini"
                                : `${selectedItems.length} jadwal terdaftar`}
                        </p>
                    </div>
                </div>

                {selectedItems.length > 0 && (
                    <div className="jadwal-cal-detail-list">
                        {selectedItems.map(item => {
                            const cls   = item.is_rutin ? "rutin" : "spesial";
                            const label = item.is_rutin
                                ? `Penimbangan Rutin — ${HARI_DISPLAY[item.hari] || item.hari}`
                                : (item.nama_jadwal_spesial || "Penimbangan Spesial");
                            return (
                                <div key={item.jadwal_id} className={`jadwal-cal-detail-item ${cls}`}>
                                    <span className="jadwal-cal-detail-time">
                                        {formatTime(item.jam_mulai)}–{formatTime(item.jam_selesai)}
                                    </span>
                                    <span className={`jbsm-detail-badge ${cls}`}>
                                        {item.is_rutin ? "Rutin" : "Spesial"}
                                    </span>
                                    <span className="jadwal-cal-detail-name">{label}</span>
                                    {(onEdit || onDelete) && (
                                        <div className="jadwal-cal-detail-actions">
                                            {onEdit && (
                                                <button className="jbsu-row-btn edit" title="Edit" onClick={() => onEdit(item)}>
                                                    <FaPen />
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button className="jbsu-row-btn delete" title="Hapus" onClick={() => onDelete(item.jadwal_id)}>
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
