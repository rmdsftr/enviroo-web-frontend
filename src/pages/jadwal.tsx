import { useState, useMemo, useEffect, useCallback } from "react";
import { FaCalendarDay, FaCalendarWeek, FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import Tabs from "../components/tabs";
import {
    JadwalService,
    type SuperadminJadwalBank,
    type SuperadminPengangkutanBsi,
} from "../services/jadwal.service";
import "../styles/jadwal.css";

type TabType   = "penimbangan" | "pengangkutan";
type BankType  = "bsi" | "bsm" | "bsu";

/* ── Normalised item used by this page ── */
interface SuperadminJadwalItem {
    jadwal_id: string;
    chip_label: string;        // shown in calendar cell chip
    chip_class: string;        // CSS modifier: bt-bsi/bsm/bsu or bt-angkut
    detail_primary: string;    // penimbangan: bank name | pengangkutan: BSI name
    detail_secondary?: string; // pengangkutan only: BSU name
    bank_type?: BankType;      // penimbangan only
    is_rutin: boolean;
    hari: string;
    minggu_ke: number;
    jam_mulai: string;
    jam_selesai: string;
    tanggal: string;
    nama_jadwal_spesial: string;
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
const CAL_HEADERS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

/* ── Calendar helpers ── */
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

function getItemsForDate(date: Date, items: SuperadminJadwalItem[]): SuperadminJadwalItem[] {
    const hariStr     = HARI_MAP[date.toLocaleDateString("en-US", { weekday: "long" })] ?? "";
    const dateISO     = getLocalISODate(date);
    const weekOfMonth = getWeekOfMonth(date);
    return items
        .filter(j => j.is_rutin
            ? j.hari === hariStr && (j.minggu_ke === 0 || j.minggu_ke === weekOfMonth)
            : j.tanggal?.split("T")[0] === dateISO
        )
        .sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
}

/* ── Normalize penimbangan response ── */
function normalizePenimbangan(
    data: { bsi: SuperadminJadwalBank[]; bsm: SuperadminJadwalBank[]; bsu: SuperadminJadwalBank[] }
): SuperadminJadwalItem[] {
    const result: SuperadminJadwalItem[] = [];
    const bankTypes: BankType[] = ["bsi", "bsm", "bsu"];
    for (const bankType of bankTypes) {
        for (const bank of data[bankType] ?? []) {
            for (const j of bank.rutin) {
                result.push({
                    jadwal_id:      j.jadwal_id,
                    chip_label:     bank.nama_bank,
                    chip_class:     `bt-${bankType}`,
                    detail_primary: bank.nama_bank,
                    bank_type:      bankType,
                    is_rutin:       true,
                    hari:           j.hari ?? "",
                    minggu_ke:      j.minggu_ke ?? 0,
                    jam_mulai:      j.jam_mulai,
                    jam_selesai:    j.jam_selesai,
                    tanggal:        "",
                    nama_jadwal_spesial: "",
                });
            }
            for (const j of bank.tidak_rutin) {
                result.push({
                    jadwal_id:      j.jadwal_id,
                    chip_label:     bank.nama_bank,
                    chip_class:     `bt-${bankType}`,
                    detail_primary: bank.nama_bank,
                    bank_type:      bankType,
                    is_rutin:       false,
                    hari:           "",
                    minggu_ke:      0,
                    jam_mulai:      j.jam_mulai,
                    jam_selesai:    j.jam_selesai,
                    tanggal:        j.tanggal ?? "",
                    nama_jadwal_spesial: j.nama_jadwal_spesial ?? "",
                });
            }
        }
    }
    return result;
}

/* ── Normalize pengangkutan response (BSI → BSU routes) ── */
function normalizeAngkutan(data: SuperadminPengangkutanBsi[]): SuperadminJadwalItem[] {
    const result: SuperadminJadwalItem[] = [];
    for (const bsi of data ?? []) {
        for (const rute of bsi.rute_bsu ?? []) {
            for (const j of rute.rutin) {
                result.push({
                    jadwal_id:        j.jadwal_id,
                    chip_label:       bsi.nama_bsi,
                    chip_class:       "bt-angkut",
                    detail_primary:   bsi.nama_bsi,
                    detail_secondary: rute.nama_bsu,
                    is_rutin:         true,
                    hari:             j.hari ?? "",
                    minggu_ke:        j.minggu_ke ?? 0,
                    jam_mulai:        j.jam_mulai,
                    jam_selesai:      j.jam_selesai,
                    tanggal:          "",
                    nama_jadwal_spesial: "",
                });
            }
            for (const j of rute.tidak_rutin) {
                result.push({
                    jadwal_id:        j.jadwal_id,
                    chip_label:       bsi.nama_bsi,
                    chip_class:       "bt-angkut",
                    detail_primary:   bsi.nama_bsi,
                    detail_secondary: rute.nama_bsu,
                    is_rutin:         false,
                    hari:             "",
                    minggu_ke:        0,
                    jam_mulai:        j.jam_mulai,
                    jam_selesai:      j.jam_selesai,
                    tanggal:          j.tanggal ?? "",
                    nama_jadwal_spesial: j.nama_jadwal_spesial ?? "",
                });
            }
        }
    }
    return result;
}

/* ============================================================
   PAGE
   ============================================================ */
export default function JadwalPage() {
    const [activeTab, setActiveTab] = useState<TabType>("penimbangan");
    const [penimbanganList, setPenimbanganList] = useState<SuperadminJadwalItem[]>([]);
    const [pengangkutanList, setPengangkutanList] = useState<SuperadminJadwalItem[]>([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const prevM = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    const nextM = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));

    /* ── Fetch ── */
    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [res1, res2] = await Promise.all([
                JadwalService.getAllJadwalPenimbangan(),
                JadwalService.getAllJadwalPengangkutan(),
            ]);
            setPenimbanganList(normalizePenimbangan(res1.data));
            setPengangkutanList(normalizeAngkutan(res2.data));
        } catch {
            setError("Gagal memuat data jadwal. Pastikan server backend aktif.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    /* ── Derived ── */
    const activeList = activeTab === "penimbangan" ? penimbanganList : pengangkutanList;

    const calWeeks = useMemo(
        () => buildCalendarWeeks(currentMonth.getFullYear(), currentMonth.getMonth()),
        [currentMonth]
    );

    const selectedItems = useMemo(
        () => getItemsForDate(selectedDate, activeList),
        [selectedDate, activeList]
    );

    const selectedDateStr = selectedDate.toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
    const isSel   = (d: Date) => d.toDateString() === selectedDate.toDateString();

    /* ── Render ── */
    return (
        <div className="jadwal-page">

            {/* Tabs */}
            <div className="jadwal-page-header">
                <Tabs
                    tabs={[
                        { id: "penimbangan",  label: "Jadwal Penimbangan"  },
                        { id: "pengangkutan", label: "Jadwal Pengangkutan" },
                    ]}
                    activeTab={activeTab}
                    onChange={(id) => {
                        setActiveTab(id as TabType);
                        setSelectedDate(new Date());
                    }}
                />
            </div>

            {error && (
                <div className="nasabah-error-banner">{error}</div>
            )}

            {/* ── Calendar Matrix ── */}
            <div className="jadwal-cal-card">

                {/* Header */}
                <div className="jadwal-cal-header">
                    <div className="jadwal-cal-header-left">
                        <div className="jadwal-card-header-icon"
                            style={{ background: activeTab === "penimbangan" ? "#013236" : "#0284c7" }}>
                            <FaCalendarWeek />
                        </div>
                        <div>
                            <h2 className="jadwal-card-title">
                                Jadwal {activeTab === "penimbangan" ? "Penimbangan" : "Pengangkutan"}
                            </h2>
                            <p className="jadwal-card-sub">
                                Monitoring seluruh bank sampah — klik tanggal untuk detail
                            </p>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                        {activeTab === "penimbangan" ? (
                            <div className="jadwal-legend">
                                <span className="jadwal-legend-item"><span className="jadwal-legend-dot bt-bsi" />BSI</span>
                                <span className="jadwal-legend-item"><span className="jadwal-legend-dot bt-bsm" />BSM</span>
                                <span className="jadwal-legend-item"><span className="jadwal-legend-dot bt-bsu" />BSU</span>
                            </div>
                        ) : (
                            <div className="jadwal-legend">
                                <span className="jadwal-legend-item"><span className="jadwal-legend-dot bt-bsm" />BSI → BSU</span>
                            </div>
                        )}
                        <div className="jadwal-cal-nav">
                            <button onClick={prevM} aria-label="Bulan sebelumnya"><FaChevronLeft /></button>
                            <span>{currentMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</span>
                            <button onClick={nextM} aria-label="Bulan berikutnya"><FaChevronRight /></button>
                        </div>
                    </div>
                </div>

                {/* Day-of-week headers */}
                <div className="jadwal-cal-grid-header">
                    {CAL_HEADERS.map(d => <div key={d} className="jadwal-cal-dh">{d}</div>)}
                </div>

                {/* Body */}
                {loading ? (
                    <div style={{ padding: "56px 0", textAlign: "center", color: "#7a9e8a", fontFamily: "var(--ff-sans)", fontSize: 13 }}>
                        Memuat data jadwal...
                    </div>
                ) : (
                    <div className="jadwal-cal-body">
                        {calWeeks.map((week, wi) => (
                            <div key={wi} className="jadwal-cal-week">
                                {week.map((day, di) => {
                                    if (!day) return <div key={di} className="jadwal-cal-cell empty" />;
                                    const items         = getItemsForDate(day, activeList);
                                    const visible       = items.slice(0, 2);
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
                                                        <div key={item.jadwal_id} className={`jadwal-cal-chip ${item.chip_class}`}>
                                                            <span className="jadwal-cal-chip-dot" />
                                                            <span className="jadwal-cal-chip-text">
                                                                {item.detail_primary}
                                                                {item.detail_secondary && (
                                                                    <span className="jadwal-cal-chip-sub">
                                                                        → {item.detail_secondary}
                                                                    </span>
                                                                )}
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

                {/* Selected-date detail strip */}
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
                                const dayLabel = item.is_rutin
                                    ? (HARI_DISPLAY[item.hari] || item.hari)
                                    : (item.nama_jadwal_spesial || "Jadwal Spesial");
                                return (
                                    <div key={item.jadwal_id} className={`jadwal-cal-detail-item ${item.chip_class}`}>
                                        <span className="jadwal-cal-detail-time">
                                            {item.jam_mulai}–{item.jam_selesai}
                                        </span>
                                        <span className={`jadwal-bank-badge ${item.chip_class}`}>
                                            {item.bank_type?.toUpperCase() ?? "ANGKUT"}
                                        </span>
                                        <span className="jadwal-cal-detail-name">
                                            {item.detail_secondary
                                                ? `${item.detail_primary} → ${item.detail_secondary}`
                                                : item.detail_primary}
                                        </span>
                                        <span className={`jadwal-type-badge ${item.is_rutin ? "rutin" : "spesial"}`}>
                                            {item.is_rutin ? "Rutin" : "Spesial"}
                                        </span>
                                        <span style={{ marginLeft: "auto", fontSize: 11, color: "#7a9e8a", whiteSpace: "nowrap", fontFamily: "var(--ff-sans)" }}>
                                            {dayLabel}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}