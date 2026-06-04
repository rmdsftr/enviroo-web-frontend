import { useState, useEffect, useCallback, useMemo } from "react";
import { formatTanggal, formatJam } from "../utils/date.utils";
import { useNavigate } from "react-router-dom";
import { FaEye, FaFileExport } from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import Tabs from "../components/tabs";
import Table, { type ColumnDef, TableActionBtn } from "../components/table";
import FilterRange, { defaultMonthRange } from "../components/filter-range";
import SearchBar from "../components/search";
import Button from "../components/button";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import { PenimbanganService, type PenimbanganItem } from "../services/penimbangan.service";
import { PengangkutanService, type PengangkutanItem } from "../services/pengangkutan.service";
import { PenjualanService, type PenjualanExternalItem } from "../services/penjualan.service";
import { BagiHasilService, type RiwayatBagiHasilItem } from "../services/bagi_hasil_penjualan.service";
import { DistribusiSisaService } from "../services/distribusi_sisa.service";
import type { BagiHasilBsuItem } from "../types/distribusi_sisa.type";
import { PenarikanService, type PenarikanItem } from "../services/penarikan.service";
import "../styles/riwayat.css";
import "../styles/jadwal-bsu.css";

/* ── Status maps ─────────────────────────────────────── */
const STATUS_PENIMBANGAN: Record<string, { label: string; cls: string }> = {
    aktif:      { label: "Berlangsung",        cls: "berlangsung" },
    selesai:    { label: "Selesai",            cls: "selesai"     },
    dibatalkan: { label: "Dibatalkan",         cls: "dibatalkan"  },
};

const STATUS_PENGANGKUTAN: Record<string, { label: string; cls: string }> = {
    completed: { label: "Selesai",            cls: "selesai"     },
    otw:       { label: "Dalam Perjalanan",   cls: "berlangsung" },
    requested: { label: "Diminta",            cls: "mendatang"   },
};

const STATUS_BAGI_HASIL: Record<string, { label: string; cls: string }> = {
    berhasil: { label: "Berhasil", cls: "selesai"    },
    pending:  { label: "Pending",  cls: "mendatang"  },
    gagal:    { label: "Gagal",    cls: "dibatalkan" },
};

const STATUS_PENARIKAN: Record<string, { label: string; cls: string }> = {
    pending:    { label: "Pending",    cls: "mendatang"  },
    berhasil:   { label: "Berhasil",   cls: "selesai"    },
    kadaluarsa: { label: "Kadaluarsa", cls: "dibatalkan" },
    dibatalkan: { label: "Dibatalkan", cls: "dibatalkan" },
};

/* ── Column definitions ──────────────────────────────── */
const PENIMBANGAN_COLUMNS: ColumnDef<PenimbanganItem>[] = [
    {
        key: "penimbangan_id",
        header: "ID Penimbangan",
        render: (row) => <span className="table-id">{row.penimbangan_id}</span>,
    },
    {
        key: "tanggal",
        header: "Tanggal",
        width: "130px",
        render: (row) => row.started_at
            ? formatTanggal(row.started_at)
            : "—",
    },
    {
        key: "jam_mulai",
        header: "Jam Mulai",
        width: "100px",
        render: (row) => row.started_at
            ? formatJam(row.started_at)
            : "—",
    },
    {
        key: "jam_selesai",
        header: "Jam Selesai",
        width: "100px",
        render: (row) => row.ended_at
            ? formatJam(row.ended_at)
            : "—",
    },
    {
        key: "status",
        header: "Status Penimbangan",
        width: "160px",
        render: (row) => {
            const s = STATUS_PENIMBANGAN[row.status_penimbangan];
            return (
                <span className={`jbsu-status-pill ${s?.cls ?? row.status_penimbangan}`}>
                    {s?.label ?? row.status_penimbangan}
                </span>
            );
        },
    },
    {
        key: "aksi",
        header: "Aksi",
        width: "70px",
        align: "center" as const,
        render: () => <TableActionBtn icon={FaEye} title="Lihat Detail" />,
    },
];

const PENJUALAN_COLUMNS: ColumnDef<PenjualanExternalItem>[] = [
    {
        key: "penjualan_id",
        header: "ID Penjualan",
        render: (row) => <span className="table-id">{row.penjualan_id}</span>,
    },
    {
        key: "tanggal",
        header: "Tanggal Penjualan",
        width: "150px",
        render: (row) => row.created_at
            ? formatTanggal(row.created_at)
            : "—",
    },
    {
        key: "identitas_pembeli",
        header: "Identitas Pembeli",
        render: (row) => row.identitas_pembeli,
    },
    {
        key: "nama_reward",
        header: "Nama Reward",
        width: "140px",
        render: (row) => row.nama_reward,
    },
    {
        key: "status_bagi_hasil",
        header: "Status Bagi Hasil",
        width: "150px",
        render: (row) => {
            const s = STATUS_BAGI_HASIL[row.status_bagi_hasil];
            return (
                <span className={`jbsu-status-pill ${s?.cls ?? row.status_bagi_hasil}`}>
                    {s?.label ?? row.status_bagi_hasil}
                </span>
            );
        },
    },
    {
        key: "aksi",
        header: "Aksi",
        width: "70px",
        align: "center" as const,
        render: () => <TableActionBtn icon={FaEye} title="Lihat Detail" />,
    },
];

const BAGI_HASIL_BSU_COLUMNS: ColumnDef<BagiHasilBsuItem>[] = [
    {
        key: "penerima_sisa_id",
        header: "ID Bagi Hasil",
        render: (row) => <span className="table-id">{row.penerima_sisa_id}</span>,
    },
    {
        key: "tanggal",
        header: "Tanggal Distribusi",
        width: "160px",
        render: (row) => row.tanggal_distribusi
            ? formatTanggal(row.tanggal_distribusi)
            : "—",
    },
    {
        key: "total_diterima",
        header: "Total Diterima",
        width: "160px",
        render: (row) => {
            const num = row.nominal_diterima.toLocaleString("id-ID");
            return row.satuan_nominal === "Rp" ? `Rp ${num}` : `${num} poin`;
        },
    },
    {
        key: "aksi",
        header: "Aksi",
        width: "70px",
        align: "center" as const,
        render: () => <TableActionBtn icon={FaEye} title="Lihat Detail" />,
    },
];

const BAGI_HASIL_COLUMNS: ColumnDef<RiwayatBagiHasilItem>[] = [
    {
        key: "bagi_hasil_id",
        header: "ID Bagi Hasil",
        render: (row) => <span className="table-id">{row.bagi_hasil_id}</span>,
    },
    {
        key: "tanggal",
        header: "Tanggal Bagi Hasil",
        width: "160px",
        render: (row) => formatTanggal(row.tanggal_bagi_hasil),
    },
    {
        key: "nama_reward",
        header: "Nama Reward",
        width: "140px",
        render: (row) => row.nama_reward,
    },
    {
        key: "aksi",
        header: "Aksi",
        width: "70px",
        align: "center" as const,
        render: () => <TableActionBtn icon={FaEye} title="Lihat Detail" />,
    },
];

const PENARIKAN_COLUMNS: ColumnDef<PenarikanItem>[] = [
    {
        key: "penarikan_id",
        header: "ID Penarikan",
        render: (row) => <span className="table-id">{row.penarikan_id}</span>,
    },
    {
        key: "nama_nasabah",
        header: "Nama Nasabah",
        render: (row) => row.nama_nasabah,
    },
    {
        key: "nama_reward",
        header: "Nama Reward",
        width: "140px",
        render: (row) => row.nama_reward,
    },
    {
        key: "tanggal",
        header: "Tanggal Penarikan",
        width: "160px",
        render: (row) => formatTanggal(row.created_at),
    },
    {
        key: "status_penarikan",
        header: "Status Penarikan",
        width: "150px",
        render: (row) => {
            const s = STATUS_PENARIKAN[row.status_penarikan];
            return (
                <span className={`jbsu-status-pill ${s?.cls ?? row.status_penarikan}`}>
                    {s?.label ?? row.status_penarikan}
                </span>
            );
        },
    },
    {
        key: "aksi",
        header: "Aksi",
        width: "70px",
        align: "center" as const,
        render: () => <TableActionBtn icon={FaEye} title="Lihat Detail" />,
    },
];

function buildAngkutColumns(isBsu: boolean): ColumnDef<PengangkutanItem>[] {
    return [
        {
            key: "pengangkutan_id",
            header: "ID Pengangkutan",
            render: (row) => <span className="table-id">{row.pengangkutan_id}</span>,
        },
        {
            key: "tanggal",
            header: "Tanggal Pengangkutan",
            width: "160px",
            render: (row) => row.changed_at
                ? formatTanggal(row.changed_at)
                : "—",
        },
        {
            key: "pihak",
            header: isBsu ? "Diangkut Oleh" : "Angkut Ke",
            render: (row) => isBsu ? row.nama_bsi : row.nama_bsu,
        },
        {
            key: "status",
            header: "Status Pengangkutan",
            width: "180px",
            render: (row) => {
                const s = STATUS_PENGANGKUTAN[row.status_pengangkutan];
                return (
                    <span className={`jbsu-status-pill ${s?.cls ?? row.status_pengangkutan}`}>
                        {s?.label ?? row.status_pengangkutan}
                    </span>
                );
            },
        },
        {
            key: "aksi",
            header: "Aksi",
            width: "70px",
            align: "center" as const,
            render: () => <TableActionBtn icon={FaEye} title="Lihat Detail" />,
        },
    ];
}

/* ── Tab configs ─────────────────────────────────────── */
const BSI_TABS = [
    { id: "penimbangan",  label: "Penimbangan"  },
    { id: "pengangkutan", label: "Pengangkutan" },
    { id: "penarikan",    label: "Penarikan"    },
    { id: "penjualan",    label: "Penjualan"    },
    { id: "bagi_hasil",   label: "Bagi Hasil"   },
];

const BSU_TABS = [
    { id: "penimbangan",  label: "Penimbangan"  },
    { id: "pengangkutan", label: "Pengangkutan" },
    { id: "penarikan",    label: "Penarikan"    },
    { id: "bagi_hasil",   label: "Bagi Hasil"   },
];

const BSM_TABS = [
    { id: "penimbangan", label: "Penimbangan" },
    { id: "penarikan",   label: "Penarikan"   },
    { id: "penjualan",   label: "Penjualan"   },
    { id: "bagi_hasil",  label: "Bagi Hasil"  },
];

/* ── Component ───────────────────────────────────────── */
export default function RiwayatPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const role = user?.role?.toLowerCase();
    const isBsi = role === "admin_bsi";
    const isBsu = role === "admin_bsu";
    const hasAngkut = isBsi || isBsu;
    const hasPenjualan = isBsi || (!isBsi && !isBsu);

    const tabs = isBsi ? BSI_TABS : isBsu ? BSU_TABS : BSM_TABS;

    const [activeTab, setActiveTab] = useState(tabs[0].id);

    // ── Popup notifikasi state ────────────────────────────
    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // ── Global Search ─────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState("");

    /* ── Penimbangan state ── */
    const [penimbanganList, setPenimbanganList] = useState<PenimbanganItem[]>([]);
    const [penimbanganLoading, setPenimbanganLoading] = useState(false);
    const [penimbanganFrom, setPenimbanganFrom] = useState(() => defaultMonthRange().from);
    const [penimbanganTo, setPenimbanganTo] = useState(() => defaultMonthRange().to);

    /* ── Pengangkutan state ── */
    const [angkutList, setAngkutList] = useState<PengangkutanItem[]>([]);
    const [angkutLoading, setAngkutLoading] = useState(false);
    const [angkutFrom, setAngkutFrom] = useState(() => defaultMonthRange().from);
    const [angkutTo, setAngkutTo] = useState(() => defaultMonthRange().to);

    /* ── Penjualan state ── */
    const [penjualanList, setPenjualanList] = useState<PenjualanExternalItem[]>([]);
    const [penjualanLoading, setPenjualanLoading] = useState(false);
    const [penjualanFrom, setPenjualanFrom] = useState(() => defaultMonthRange().from);
    const [penjualanTo, setPenjualanTo] = useState(() => defaultMonthRange().to);

    /* ── Bagi Hasil (BSI/BSM) state ── */
    const [bagiHasilList, setBagiHasilList] = useState<RiwayatBagiHasilItem[]>([]);
    const [bagiHasilLoading, setBagiHasilLoading] = useState(false);
    const [bagiHasilFrom, setBagiHasilFrom] = useState(() => defaultMonthRange().from);
    const [bagiHasilTo, setBagiHasilTo] = useState(() => defaultMonthRange().to);

    /* ── Bagi Hasil BSU state ── */
    const [bagiHasilBsuList, setBagiHasilBsuList] = useState<BagiHasilBsuItem[]>([]);
    const [bagiHasilBsuLoading, setBagiHasilBsuLoading] = useState(false);
    const [bagiHasilBsuFrom, setBagiHasilBsuFrom] = useState(() => defaultMonthRange().from);
    const [bagiHasilBsuTo, setBagiHasilBsuTo] = useState(() => defaultMonthRange().to);

    /* ── Penarikan state ── */
    const [penarikanList, setPenarikanList] = useState<PenarikanItem[]>([]);
    const [penarikanLoading, setPenarikanLoading] = useState(false);
    const [penarikanFrom, setPenarikanFrom] = useState(() => defaultMonthRange().from);
    const [penarikanTo, setPenarikanTo] = useState(() => defaultMonthRange().to);

    const fetchPenimbangan = useCallback(async () => {
        if (!user?.bank_id) return;
        try {
            setPenimbanganLoading(true);
            const data = await PenimbanganService.getPenimbanganByBank(user.bank_id);
            setPenimbanganList(data);
        } catch {
            console.error("Gagal memuat riwayat penimbangan");
        } finally {
            setPenimbanganLoading(false);
        }
    }, [user?.bank_id]);

    const fetchAngkut = useCallback(async () => {
        if (!user?.bank_id || !hasAngkut) return;
        try {
            setAngkutLoading(true);
            const data = await PengangkutanService.getPengangkutanByBank(user.bank_id);
            setAngkutList(data);
        } catch {
            console.error("Gagal memuat riwayat pengangkutan");
        } finally {
            setAngkutLoading(false);
        }
    }, [user?.bank_id, hasAngkut]);

    const fetchPenjualan = useCallback(async () => {
        if (!user?.bank_id || !hasPenjualan) return;
        try {
            setPenjualanLoading(true);
            const data = await PenjualanService.getRiwayatEksternal(user.bank_id);
            setPenjualanList(data);
        } catch {
            console.error("Gagal memuat riwayat penjualan");
        } finally {
            setPenjualanLoading(false);
        }
    }, [user?.bank_id, hasPenjualan]);

    const fetchBagiHasil = useCallback(async () => {
        if (!user?.bank_id || isBsu) return;
        try {
            setBagiHasilLoading(true);
            const data = await BagiHasilService.getRiwayatByBank(user.bank_id);
            setBagiHasilList(data);
        } catch {
            console.error("Gagal memuat riwayat bagi hasil");
        } finally {
            setBagiHasilLoading(false);
        }
    }, [user?.bank_id, isBsu]);

    const fetchBagiHasilBsu = useCallback(async () => {
        if (!user?.bank_id || !isBsu) return;
        try {
            setBagiHasilBsuLoading(true);
            const data = await DistribusiSisaService.getRiwayatBagiHasilBsu(user.bank_id);
            setBagiHasilBsuList(data);
        } catch {
            console.error("Gagal memuat riwayat bagi hasil BSU");
        } finally {
            setBagiHasilBsuLoading(false);
        }
    }, [user?.bank_id, isBsu]);

    const fetchPenarikan = useCallback(async () => {
        if (!user?.bank_id) return;
        try {
            setPenarikanLoading(true);
            const res = await PenarikanService.getListByBank(user.bank_id, { limit: 100 });
            setPenarikanList(res.data);
        } catch {
            console.error("Gagal memuat riwayat penarikan");
        } finally {
            setPenarikanLoading(false);
        }
    }, [user?.bank_id]);

    useEffect(() => { fetchBagiHasil(); }, [fetchBagiHasil]);
    useEffect(() => { fetchPenimbangan(); }, [fetchPenimbangan]);
    useEffect(() => { fetchAngkut(); }, [fetchAngkut]);
    useEffect(() => { fetchPenjualan(); }, [fetchPenjualan]);
    useEffect(() => { fetchBagiHasilBsu(); }, [fetchBagiHasilBsu]);
    useEffect(() => { fetchPenarikan(); }, [fetchPenarikan]);

    const filteredPenimbangan = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return penimbanganList.filter(item => {
            if (!item.started_at) return false;
            const month = item.started_at.substring(0, 7);
            const inRange = month >= penimbanganFrom && month <= penimbanganTo;
            if (!inRange) return false;
            
            if (q) {
                return item.penimbangan_id.toLowerCase().includes(q) ||
                       (item.started_by && item.started_by.toLowerCase().includes(q)) ||
                       (item.ended_by && item.ended_by.toLowerCase().includes(q));
            }
            return true;
        });
    }, [penimbanganList, penimbanganFrom, penimbanganTo, searchQuery]);

    const filteredAngkut = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return angkutList.filter(item => {
            if (!item.changed_at) return false;
            const month = item.changed_at.substring(0, 7);
            const inRange = month >= angkutFrom && month <= angkutTo;
            if (!inRange) return false;
            
            if (q) {
                return item.pengangkutan_id.toLowerCase().includes(q);
            }
            return true;
        });
    }, [angkutList, angkutFrom, angkutTo, searchQuery]);

    const angkutColumns = useMemo(() => buildAngkutColumns(isBsu), [isBsu]);

    const filteredBagiHasil = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return bagiHasilList.filter(item => {
            const month = item.tanggal_bagi_hasil.substring(0, 7);
            if (month < bagiHasilFrom || month > bagiHasilTo) return false;
            if (q) {
                return item.bagi_hasil_id.toLowerCase().includes(q) ||
                       item.nama_reward.toLowerCase().includes(q);
            }
            return true;
        });
    }, [bagiHasilList, bagiHasilFrom, bagiHasilTo, searchQuery]);

    const filteredBagiHasilBsu = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return bagiHasilBsuList.filter(item => {
            const month = item.tanggal_distribusi.substring(0, 7);
            if (month < bagiHasilBsuFrom || month > bagiHasilBsuTo) return false;
            if (q) {
                return item.penerima_sisa_id.toLowerCase().includes(q) ||
                       item.distribusi_id.toLowerCase().includes(q) ||
                       item.bagi_hasil_id.toLowerCase().includes(q);
            }
            return true;
        });
    }, [bagiHasilBsuList, bagiHasilBsuFrom, bagiHasilBsuTo, searchQuery]);

    const filteredPenarikan = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return penarikanList.filter(item => {
            const month = item.created_at.substring(0, 7);
            if (month < penarikanFrom || month > penarikanTo) return false;
            if (q) {
                return item.penarikan_id.toLowerCase().includes(q) ||
                       item.nama_nasabah.toLowerCase().includes(q) ||
                       item.nama_reward.toLowerCase().includes(q);
            }
            return true;
        });
    }, [penarikanList, penarikanFrom, penarikanTo, searchQuery]);

    const filteredPenjualan = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return penjualanList.filter(item => {
            if (!item.created_at) return false;
            const month = item.created_at.substring(0, 7);
            const inRange = month >= penjualanFrom && month <= penjualanTo;
            if (!inRange) return false;
            if (q) {
                return item.penjualan_id.toLowerCase().includes(q) ||
                       item.identitas_pembeli.toLowerCase().includes(q) ||
                       item.nama_reward.toLowerCase().includes(q);
            }
            return true;
        });
    }, [penjualanList, penjualanFrom, penjualanTo, searchQuery]);

    /* ── Render ── */
    return (
        <div className="riwayat-page">

            {/* Header */}
            <div className="riwayat-hero">
                <div className="riwayat-hero-left">
                    <h1>Riwayat Transaksi</h1>
                    <p>Pantau seluruh riwayat transaksi bank sampah Anda</p>
                </div>
                {/* <div className="riwayat-hero-right">
                    <Button
                        icon={<FaFileExport />}
                        color="secondary"
                        variant="solid"
                        size="default"
                        isRounded
                        onClick={() => {
                            setPopupNotif({ message: "Fitur export CSV akan segera tersedia.", type: "success" });
                        }}
                    >
                        Ekspor Laporan
                    </Button>
                </div> */}
            </div>

            {/* Tabs */}
            <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={setActiveTab}
                style={{ alignSelf: "flex-start" }}
            />

            {/* ── Tab: Penimbangan ── */}
            {activeTab === "penimbangan" && (
                <>
                    <div className="riwayat-filter-row">
                        <SearchBar
                            placeholder="Cari ID Penimbangan"
                            value={searchQuery}
                            onChange={setSearchQuery}
                            width="300px"
                        />
                        <FilterRange
                            from={penimbanganFrom}
                            to={penimbanganTo}
                            onChange={(f, t) => { setPenimbanganFrom(f); setPenimbanganTo(t); }}
                        />
                    </div>
                    {penimbanganLoading
                        ? <div className="riwayat-loading">Memuat data...</div>
                        : <Table<PenimbanganItem>
                            columns={PENIMBANGAN_COLUMNS}
                            data={filteredPenimbangan}
                            rowKey={(row) => row.penimbangan_id}
                            emptyMessage="Belum ada riwayat penimbangan."
                            onRowClick={(row) => {
                                const prefix = role === "admin_bsi" ? "/bsi" : role === "admin_bsu" ? "/bsu" : "/bsm";
                                navigate(`${prefix}/riwayat/penimbangan/${row.penimbangan_id}`);
                            }}
                          />
                    }
                </>
            )}

            {/* ── Tab: Pengangkutan ── */}
            {activeTab === "pengangkutan" && hasAngkut && (
                <>
                    <div className="riwayat-filter-row">
                        <SearchBar
                            placeholder="Cari ID Pengangkutan..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                            width="300px"
                        />
                        <FilterRange
                            from={angkutFrom}
                            to={angkutTo}
                            onChange={(f, t) => { setAngkutFrom(f); setAngkutTo(t); }}
                        />
                    </div>
                    {angkutLoading
                        ? <div className="riwayat-loading">Memuat data...</div>
                        : <Table<PengangkutanItem>
                            columns={angkutColumns}
                            data={filteredAngkut}
                            rowKey={(row) => row.pengangkutan_id}
                            emptyMessage="Belum ada riwayat pengangkutan."
                            onRowClick={(row) => {
                                const prefix = role === "admin_bsi" ? "/bsi" : role === "admin_bsu" ? "/bsu" : "/bsm";
                                navigate(`${prefix}/riwayat/pengangkutan/${row.pengangkutan_id}`);
                            }}
                          />
                    }
                </>
            )}

            {/* ── Tab: Penjualan ── */}
            {activeTab === "penjualan" && hasPenjualan && (
                <>
                    <div className="riwayat-filter-row">
                        <SearchBar
                            placeholder="Cari ID, pembeli, atau reward..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                            width="300px"
                        />
                        <FilterRange
                            from={penjualanFrom}
                            to={penjualanTo}
                            onChange={(f, t) => { setPenjualanFrom(f); setPenjualanTo(t); }}
                        />
                    </div>
                    {penjualanLoading
                        ? <div className="riwayat-loading">Memuat data...</div>
                        : <Table<PenjualanExternalItem>
                            columns={PENJUALAN_COLUMNS}
                            data={filteredPenjualan}
                            rowKey={(row) => row.penjualan_id}
                            emptyMessage="Belum ada riwayat penjualan."
                            onRowClick={(row) => {
                                const prefix = role === "admin_bsi" ? "/bsi" : role === "admin_bsu" ? "/bsu" : "/bsm";
                                navigate(`${prefix}/riwayat/penjualan/${row.penjualan_id}`);
                            }}
                          />
                    }
                </>
            )}

            {/* ── Tab: Bagi Hasil (BSI / BSM) ── */}
            {activeTab === "bagi_hasil" && !isBsu && (
                <>
                    <div className="riwayat-filter-row">
                        <SearchBar
                            placeholder="Cari ID atau nama reward..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                            width="300px"
                        />
                        <FilterRange
                            from={bagiHasilFrom}
                            to={bagiHasilTo}
                            onChange={(f, t) => { setBagiHasilFrom(f); setBagiHasilTo(t); }}
                        />
                    </div>
                    {bagiHasilLoading
                        ? <div className="riwayat-loading">Memuat data...</div>
                        : <Table<RiwayatBagiHasilItem>
                            columns={BAGI_HASIL_COLUMNS}
                            data={filteredBagiHasil}
                            rowKey={(row) => row.bagi_hasil_id}
                            emptyMessage="Belum ada riwayat bagi hasil."
                            onRowClick={(row) => {
                                const prefix = role === "admin_bsi" ? "/bsi" : "/bsm";
                                navigate(`${prefix}/riwayat/bagi-hasil/${row.bagi_hasil_id}`);
                            }}
                          />
                    }
                </>
            )}

            {/* ── Tab: Bagi Hasil (BSU) ── */}
            {activeTab === "bagi_hasil" && isBsu && (
                <>
                    <div className="riwayat-filter-row">
                        <SearchBar
                            placeholder="Cari ID bagi hasil atau distribusi..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                            width="300px"
                        />
                        <FilterRange
                            from={bagiHasilBsuFrom}
                            to={bagiHasilBsuTo}
                            onChange={(f, t) => { setBagiHasilBsuFrom(f); setBagiHasilBsuTo(t); }}
                        />
                    </div>
                    {bagiHasilBsuLoading
                        ? <div className="riwayat-loading">Memuat data...</div>
                        : <Table<BagiHasilBsuItem>
                            columns={BAGI_HASIL_BSU_COLUMNS}
                            data={filteredBagiHasilBsu}
                            rowKey={(row) => row.penerima_sisa_id}
                            emptyMessage="Belum ada riwayat bagi hasil."
                            onRowClick={(row) => navigate(`/bsu/distribusi-sisa/${row.penerima_sisa_id}`)}
                          />
                    }
                </>
            )}

            {/* ── Tab: Penarikan ── */}
            {activeTab === "penarikan" && (
                <>
                    <div className="riwayat-filter-row">
                        <SearchBar
                            placeholder="Cari ID, nasabah, atau reward..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                            width="300px"
                        />
                        <FilterRange
                            from={penarikanFrom}
                            to={penarikanTo}
                            onChange={(f, t) => { setPenarikanFrom(f); setPenarikanTo(t); }}
                        />
                    </div>
                    {penarikanLoading
                        ? <div className="riwayat-loading">Memuat data...</div>
                        : <Table<PenarikanItem>
                            columns={PENARIKAN_COLUMNS}
                            data={filteredPenarikan}
                            rowKey={(row) => row.penarikan_id}
                            emptyMessage="Belum ada riwayat penarikan."
                            onRowClick={(row) => {
                                const prefix = role === "admin_bsi" ? "/bsi" : role === "admin_bsu" ? "/bsu" : "/bsm";
                                navigate(`${prefix}/riwayat/penarikan/${row.penarikan_id}`);
                            }}
                          />
                    }
                </>
            )}

            {/* Popup Notifikasi */}
            {popupNotif && (
                <PopupNotifikasi
                    message={popupNotif.message}
                    type={popupNotif.type}
                    onClose={() => setPopupNotif(null)}
                />
            )}
        </div>
    );
}
