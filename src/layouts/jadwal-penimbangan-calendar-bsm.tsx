import { useState, useMemo } from "react";
import {
    FaChevronLeft, FaChevronRight, FaCalendarDay, FaScaleBalanced,
} from "react-icons/fa6";
import type { JadwalPenimbanganOccurrence } from "../types/jadwal.type";
import { formatTime } from "./jadwal-penimbangan-calendar";
import "../styles/jadwal-bsu.css";

const CAL_HEADERS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const STATUS_JADWAL: Record<string, { label: string; cls: string }> = {
    selesai:    { label: "Selesai",    cls: "selesai"     },
    dibatalkan: { label: "Dibatalkan", cls: "dibatalkan"  },
    pending:    { label: "Mendatang",  cls: "berlangsung" },
    upcoming:   { label: "Perkiraan",  cls: "berlangsung" },
};

const STATUS_TERLEWAT = { label: "Terlewat", cls: "mendatang" };

function isTerlewat(item: JadwalPenimbanganOccurrence): boolean {
    if (item.status_jadwal !== "upcoming") return false;
    const end = new Date(`${item.tanggal}T${formatTime(item.jam_selesai).replace(".", ":")}`);
    const batas = isNaN(end.getTime()) ? new Date(`${item.tanggal}T23:59:59`) : end;
    return batas < new Date();
}

function isDead(item: JadwalPenimbanganOccurrence): boolean {
    return !item.is_active || item.status_jadwal === "dibatalkan" || item.status_jadwal === "selesai" || isTerlewat(item);
}

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

function getItemsForDate(date: Date, list: JadwalPenimbanganOccurrence[]): JadwalPenimbanganOccurrence[] {
    const dateISO = getLocalISODate(date);
    return list
        .filter(j => j.tanggal === dateISO)
        .sort((a, b) => formatTime(a.jam_mulai).localeCompare(formatTime(b.jam_mulai)));
}

interface Props {
    jadwalList: JadwalPenimbanganOccurrence[];
    loading?: boolean;
    onMonthChange?: (month: number, year: number) => void;
}

export default function JadwalPenimbanganCalendarBsm({ jadwalList, loading, onMonthChange }: Props) {
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

            <div className="jadwal-cal-grid-header">
                {CAL_HEADERS.map(d => <div key={d} className="jadwal-cal-dh">{d}</div>)}
            </div>

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
                                                    <div key={item.jadwal_id + item.tanggal} className={`jadwal-cal-chip rutin${isDead(item) ? " dead" : ""}`}>
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
                            const dead = isDead(item);
                            const st   = isTerlewat(item)
                                ? STATUS_TERLEWAT
                                : STATUS_JADWAL[item.status_jadwal] ?? { label: item.status_jadwal, cls: "" };
                            return (
                                <div key={item.jadwal_id + item.tanggal} className={`jadwal-cal-detail-item rutin${dead ? " dead" : ""}`}>
                                    <span className="jadwal-cal-detail-time">
                                        {formatTime(item.jam_mulai)}–{formatTime(item.jam_selesai)}
                                    </span>
                                    <span className="jadwal-cal-detail-name">{item.nama_jadwal}</span>
                                    <span className={`jadwal-cal-detail-status jbsu-status-pill ${st.cls}`}>
                                        {st.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
