import React, { useState, useMemo } from "react";
import {
    FaBell, FaCircleCheck, FaCircleInfo, FaTriangleExclamation,
    FaGear, FaBolt, FaRecycle, FaTrash, FaCalendarCheck, FaArrowDown
} from "react-icons/fa6";
import "../styles/notifikasi.css";

/* ── Types ── */
type NotifKategori = "sistem" | "aktivitas" | "peringatan";

interface Notifikasi {
    id: string;
    judul: string;
    pesan: string;
    waktu: string;        // relative label
    timestamp: number;    // for sorting
    kategori: NotifKategori;
    dibaca: boolean;
    icon: "check" | "info" | "warning" | "gear" | "bolt" | "recycle" | "trash" | "calendar" | "deposit";
}

/* ── Dummy Data ── */
const DUMMY_NOTIF: Notifikasi[] = [
    {
        id: "n1", judul: "Setoran Baru Diterima", pesan: "BSI Sukamaju telah menerima setoran dari Andi Pratama sebesar 5 kg plastik.",
        waktu: "2 menit lalu", timestamp: Date.now() - 2 * 60 * 1000, kategori: "aktivitas", dibaca: false, icon: "deposit",
    },
    {
        id: "n2", judul: "Pembaruan Sistem", pesan: "Sistem Enviroo telah diperbarui ke versi 2.4.1. Periksa log perubahan untuk detail.",
        waktu: "15 menit lalu", timestamp: Date.now() - 15 * 60 * 1000, kategori: "sistem", dibaca: false, icon: "gear",
    },
    {
        id: "n3", judul: "Jadwal Pengangkutan Hari Ini", pesan: "BSU Sejahtera dijadwalkan melakukan pengangkutan pukul 08:00 – 10:00 WIB.",
        waktu: "1 jam lalu", timestamp: Date.now() - 60 * 60 * 1000, kategori: "aktivitas", dibaca: false, icon: "calendar",
    },
    {
        id: "n4", judul: "BSM Bersih Kota Belum Aktif", pesan: "Bank Sampah BSM Bersih Kota belum melakukan aktivitas dalam 7 hari terakhir.",
        waktu: "3 jam lalu", timestamp: Date.now() - 3 * 60 * 60 * 1000, kategori: "peringatan", dibaca: true, icon: "warning",
    },
    {
        id: "n5", judul: "Nasabah Baru Terdaftar", pesan: "Siti Rahayu berhasil mendaftarkan diri sebagai nasabah BSI Cimahi Utara.",
        waktu: "5 jam lalu", timestamp: Date.now() - 5 * 60 * 60 * 1000, kategori: "aktivitas", dibaca: true, icon: "check",
    },
    {
        id: "n6", judul: "Backup Database Selesai", pesan: "Backup otomatis database berhasil diselesaikan tanpa error pada pukul 03:00 WIB.",
        waktu: "Kemarin", timestamp: Date.now() - 24 * 60 * 60 * 1000, kategori: "sistem", dibaca: true, icon: "bolt",
    },
    {
        id: "n7", judul: "Stok Katalog Diperbarui", pesan: "Katalog sembako pada BSU Sejahtera telah diperbarui. 3 item baru ditambahkan.",
        waktu: "Kemarin", timestamp: Date.now() - 26 * 60 * 60 * 1000, kategori: "aktivitas", dibaca: true, icon: "recycle",
    },
    {
        id: "n8", judul: "Kapasitas Penyimpanan Hampir Penuh", pesan: "Kapasitas server telah mencapai 85%. Pertimbangkan untuk menambah kapasitas.",
        waktu: "2 hari lalu", timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, kategori: "peringatan", dibaca: true, icon: "warning",
    },
    {
        id: "n9", judul: "Laporan Bulanan Tersedia", pesan: "Laporan bulanan Maret 2026 telah siap diunduh di halaman laporan.",
        waktu: "2 hari lalu", timestamp: Date.now() - 50 * 60 * 60 * 1000, kategori: "sistem", dibaca: true, icon: "info",
    },
    {
        id: "n10", judul: "Admin BSI Sukamaju Ditambahkan", pesan: "Budi Santoso berhasil ditambahkan sebagai admin BSI Sukamaju oleh Superadmin.",
        waktu: "3 hari lalu", timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, kategori: "aktivitas", dibaca: true, icon: "check",
    },
    {
        id: "n11", judul: "Item Kedaluwarsa Dihapus", pesan: "5 item katalog yang sudah tidak aktif telah dihapus secara otomatis oleh sistem.",
        waktu: "4 hari lalu", timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000, kategori: "sistem", dibaca: true, icon: "trash",
    },
    {
        id: "n12", judul: "BSI Cimahi Utara Belum Input Jadwal", pesan: "BSI Cimahi Utara belum mengatur jadwal penimbangan untuk minggu depan.",
        waktu: "5 hari lalu", timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, kategori: "peringatan", dibaca: true, icon: "warning",
    },
];

type FilterType = "semua" | "belum_dibaca" | "sistem" | "aktivitas";

const FILTERS: { key: FilterType; label: string }[] = [
    { key: "semua",       label: "SEMUA" },
    { key: "belum_dibaca", label: "BELUM DIBACA" },
    { key: "sistem",      label: "SISTEM" },
    { key: "aktivitas",   label: "AKTIVITAS" },
];

const ICON_MAP: Record<Notifikasi["icon"], React.ReactNode> = {
    check:    <FaCircleCheck />,
    info:     <FaCircleInfo />,
    warning:  <FaTriangleExclamation />,
    gear:     <FaGear />,
    bolt:     <FaBolt />,
    recycle:  <FaRecycle />,
    trash:    <FaTrash />,
    calendar: <FaCalendarCheck />,
    deposit:  <FaArrowDown />,
};

const KATEGORI_COLOR: Record<NotifKategori, string> = {
    sistem:     "notif-cat-sistem",
    aktivitas:  "notif-cat-aktivitas",
    peringatan: "notif-cat-peringatan",
};

const ICON_COLOR: Record<NotifKategori, string> = {
    sistem:     "notif-icon-sistem",
    aktivitas:  "notif-icon-aktivitas",
    peringatan: "notif-icon-peringatan",
};

/* ── Main Page ── */
export default function NotifikasiPage() {
    const [filter, setFilter] = useState<FilterType>("semua");
    const [notifs, setNotifs] = useState<Notifikasi[]>(DUMMY_NOTIF);

    const filtered = useMemo(() => {
        switch (filter) {
            case "belum_dibaca": return notifs.filter(n => !n.dibaca);
            case "sistem":       return notifs.filter(n => n.kategori === "sistem");
            case "aktivitas":    return notifs.filter(n => n.kategori === "aktivitas" || n.kategori === "peringatan");
            default:             return notifs;
        }
    }, [filter, notifs]);

    const unreadCount = notifs.filter(n => !n.dibaca).length;



    const markRead = (id: string) =>
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, dibaca: true } : n));

    return (
        <div className="notif-page">



            {/* ── Filter Chips ── */}
            <div className="notif-filters">
                {FILTERS.map(f => (
                    <button
                        key={f.key}
                        className={`notif-chip${filter === f.key ? " active" : ""}`}
                        onClick={() => setFilter(f.key)}
                    >
                        {f.label}
                        {f.key === "belum_dibaca" && unreadCount > 0 && (
                            <span className="notif-chip-badge">{unreadCount}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Notification List ── */}
            <div className="notif-list">
                {filtered.length === 0 ? (
                    <div className="notif-empty">
                        <FaBell />
                        <span>Tidak ada notifikasi</span>
                    </div>
                ) : (
                    filtered.map(notif => (
                        <div
                            key={notif.id}
                            className={`notif-item${notif.dibaca ? "" : " unread"}`}
                            onClick={() => markRead(notif.id)}
                        >
                            {/* Icon */}
                            <div className={`notif-icon-wrap ${ICON_COLOR[notif.kategori]}`}>
                                {ICON_MAP[notif.icon]}
                            </div>

                            {/* Content */}
                            <div className="notif-content">
                                <div className="notif-content-top">
                                    <span className="notif-judul">{notif.judul}</span>
                                    <span className={`notif-kategori-tag ${KATEGORI_COLOR[notif.kategori]}`}>
                                        {notif.kategori}
                                    </span>
                                </div>
                                <p className="notif-pesan">{notif.pesan}</p>
                                <span className="notif-waktu">{notif.waktu}</span>
                            </div>

                            {/* Unread dot */}
                            {!notif.dibaca && <span className="notif-unread-dot" />}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
