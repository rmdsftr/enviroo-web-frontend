import { useState, useMemo } from "react";
import { FaGear, FaPen, FaTrash, FaCalendarXmark } from "react-icons/fa6";
import FilterPill from "../components/filter-pill";
import type { JadwalMasterPenimbangan, JadwalMasterRutinItem, JadwalMasterKhususItem } from "../services/jadwal.service";
import { formatTime } from "./jadwal-penimbangan-calendar";
import { formatTanggal } from "../utils/date.utils";
import "../styles/jadwal-bsu.css";

/* ── Seed dikirim ke modal edit di halaman — cukup field yang dibutuhkan form ── */
export interface JadwalEditSeed {
    jadwal_id: string;
    is_rutin: boolean;
    hari: string;
    minggu_ke: number;
    tanggal: string;
    nama_jadwal_spesial: string;
    jam_mulai: string;
    jam_selesai: string;
    is_active: boolean;
}

const HARI_DISPLAY: Record<string, string> = {
    senin: "Senin", selasa: "Selasa", rabu: "Rabu",
    kamis: "Kamis", jumat: "Jumat", sabtu: "Sabtu", minggu: "Minggu",
};

const HARI_ORDER: Record<string, number> = {
    senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, sabtu: 6, minggu: 7,
};

function weekLabel(mingguKe: number): string {
    return mingguKe === 0 ? "Setiap Minggu" : `Minggu ke-${mingguKe}`;
}

const FILTER_OPTIONS = [
    { label: "Jadwal Rutin",  value: "rutin"  },
    { label: "Jadwal Khusus", value: "khusus" },
];

function rutinToSeed(item: JadwalMasterRutinItem): JadwalEditSeed {
    return {
        jadwal_id: item.jadwal_id, is_rutin: true,
        hari: item.hari, minggu_ke: item.minggu_ke,
        tanggal: "", nama_jadwal_spesial: "",
        jam_mulai: item.jam_mulai, jam_selesai: item.jam_selesai,
        is_active: item.is_active,
    };
}

function khususToSeed(item: JadwalMasterKhususItem): JadwalEditSeed {
    return {
        jadwal_id: item.jadwal_id, is_rutin: false,
        hari: "", minggu_ke: 0,
        tanggal: item.tanggal, nama_jadwal_spesial: item.nama_jadwal,
        jam_mulai: item.jam_mulai, jam_selesai: item.jam_selesai,
        is_active: item.is_active,
    };
}

/* ── Props ── */
interface Props {
    data: JadwalMasterPenimbangan;
    loading?: boolean;
    onEdit: (seed: JadwalEditSeed) => void;
    onDelete: (jadwalId: string) => void;
}

/* ── Component ── */
export default function PengaturanJadwalPenimbangan({ data, loading, onEdit, onDelete }: Props) {
    const [filter, setFilter] = useState<"rutin" | "khusus">("rutin");

    /* Dikelompokkan per Minggu ke-N (0 = "Setiap Minggu", ditaruh paling atas), tiap grup diurutkan hari lalu jam */
    const rutinGrouped = useMemo(() => {
        const groups = new Map<number, JadwalMasterRutinItem[]>();
        for (const item of data.rutin) {
            if (!groups.has(item.minggu_ke)) groups.set(item.minggu_ke, []);
            groups.get(item.minggu_ke)!.push(item);
        }
        for (const list of groups.values()) {
            list.sort((a, b) => {
                const ao = HARI_ORDER[a.hari] ?? 99, bo = HARI_ORDER[b.hari] ?? 99;
                if (ao !== bo) return ao - bo;
                return formatTime(a.jam_mulai).localeCompare(formatTime(b.jam_mulai));
            });
        }
        return [...groups.entries()].sort((a, b) => a[0] - b[0]);
    }, [data.rutin]);
    const khususSorted = useMemo(
        () => [...data.khusus].sort((a, b) => a.tanggal.localeCompare(b.tanggal)),
        [data.khusus]
    );

    return (
        <div className="jbsu-card" style={{ marginTop: 20 }}>
            <div className="jadwal-cal-header-left" style={{ marginBottom: 16 }}>
                <div className="jbsu-card-title-icon" style={{ background: "#4EA771" }}>
                    <FaGear />
                </div>
                <div>
                    <h2 className="jbsu-card-title">Pengaturan Jadwal</h2>
                    <p className="jbsu-card-sub">Kelola jadwal rutin & khusus bulan yang sedang ditampilkan</p>
                </div>
            </div>

            <FilterPill options={FILTER_OPTIONS} activeValue={filter} onChange={setFilter} />

            <div className="jadwal-cal-detail-list" style={{ marginTop: 16 }}>
                {loading ? (
                    <div className="jbsu-empty" style={{ padding: "28px 0" }}>
                        <span>Memuat pengaturan jadwal...</span>
                    </div>
                ) : filter === "rutin" ? (
                    rutinGrouped.length === 0 ? (
                        <div className="jbsu-empty" style={{ padding: "28px 0" }}>
                            <FaCalendarXmark />
                            <span>Belum ada jadwal rutin.</span>
                        </div>
                    ) : (
                        rutinGrouped.map(([mingguKe, items]) => (
                            <div key={mingguKe} className="pjp-week-group">
                                <p className="pjp-week-heading">{weekLabel(mingguKe)}</p>
                                {items.map(item => (
                                    <div key={item.jadwal_id} className={`jadwal-cal-detail-item rutin${!item.is_active ? " dead" : ""}`}>
                                        <span className="jadwal-cal-detail-time">
                                            {formatTime(item.jam_mulai)}–{formatTime(item.jam_selesai)}
                                        </span>
                                        <span className="jadwal-cal-detail-name">
                                            {HARI_DISPLAY[item.hari] || item.hari}
                                            {!item.is_active && " (nonaktif)"}
                                        </span>
                                        <div className="jadwal-cal-detail-actions">
                                            <button className="jbsu-row-btn edit" title="Edit" onClick={() => onEdit(rutinToSeed(item))}>
                                                <FaPen />
                                            </button>
                                            <button className="jbsu-row-btn delete" title="Hapus" onClick={() => onDelete(item.jadwal_id)}>
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))
                    )
                ) : (
                    khususSorted.length === 0 ? (
                        <div className="jbsu-empty" style={{ padding: "28px 0" }}>
                            <FaCalendarXmark />
                            <span>Belum ada jadwal khusus bulan ini.</span>
                        </div>
                    ) : (
                        khususSorted.map(item => (
                            <div key={item.jadwal_id} className={`jadwal-cal-detail-item spesial${!item.is_active ? " dead" : ""}`}>
                                <span className="jadwal-cal-detail-time">
                                    {formatTanggal(item.tanggal)}
                                </span>
                                <span className="jadwal-cal-detail-time">
                                    {formatTime(item.jam_mulai)}–{formatTime(item.jam_selesai)}
                                </span>
                                <span className="jadwal-cal-detail-name">
                                    {item.nama_jadwal}
                                    {!item.is_active && " (nonaktif)"}
                                </span>
                                <div className="jadwal-cal-detail-actions">
                                    <button className="jbsu-row-btn edit" title="Edit" onClick={() => onEdit(khususToSeed(item))}>
                                        <FaPen />
                                    </button>
                                    <button className="jbsu-row-btn delete" title="Hapus" onClick={() => onDelete(item.jadwal_id)}>
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    );
}
