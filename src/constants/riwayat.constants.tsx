import { type ColumnDef, TableActionBtn } from "../components/table";
import type { PenimbanganItem } from "../services/penimbangan.service";
import type { PengangkutanItem } from "../services/pengangkutan.service";
import type { PenjualanExternalItem } from "../services/penjualan.service";
import type { RiwayatBagiHasilItem } from "../services/bagi_hasil_penjualan.service";
import type { PenarikanItem } from "../services/penarikan.service";
import type { BagiHasilBsuItem } from "../types/distribusi_sisa.type";
import { formatTanggal, formatJam } from "../utils/date.utils";
import { FaEye } from "react-icons/fa6";

/* ── Status maps ─────────────────────────────────────── */

export const STATUS_PENIMBANGAN: Record<string, { label: string; cls: string }> = {
    aktif:      { label: "Berlangsung", cls: "berlangsung" },
    selesai:    { label: "Selesai",     cls: "selesai"     },
    dibatalkan: { label: "Dibatalkan",  cls: "dibatalkan"  },
};

export const STATUS_PENGANGKUTAN: Record<string, { label: string; cls: string }> = {
    requested: { label: "Diminta",          cls: "mendatang"   },
    approved:  { label: "Disetujui",        cls: "mendatang"   },
    otw:       { label: "Dalam Perjalanan", cls: "berlangsung" },
    arrived:   { label: "Tiba di Lokasi",   cls: "berlangsung" },
    completed: { label: "Selesai",          cls: "selesai"     },
    rejected:  { label: "Ditolak",          cls: "dibatalkan"  },
    canceled:  { label: "Dibatalkan",       cls: "dibatalkan"  },
};

export const STATUS_BAGI_HASIL: Record<string, { label: string; cls: string }> = {
    berhasil: { label: "Berhasil", cls: "selesai"    },
    pending:  { label: "Pending",  cls: "mendatang"  },
    gagal:    { label: "Gagal",    cls: "dibatalkan" },
};

export const STATUS_PENARIKAN: Record<string, { label: string; cls: string }> = {
    pending:    { label: "Pending",    cls: "mendatang"  },
    berhasil:   { label: "Berhasil",   cls: "selesai"    },
    kadaluarsa: { label: "Kadaluarsa", cls: "dibatalkan" },
    dibatalkan: { label: "Dibatalkan", cls: "dibatalkan" },
};

/* ── Column definitions ──────────────────────────────── */

export const PENIMBANGAN_COLUMNS: ColumnDef<PenimbanganItem>[] = [
    {
        key: "penimbangan_id",
        header: "ID Penimbangan",
        render: (row) => <span className="table-id">{row.penimbangan_id}</span>,
    },
    {
        key: "tanggal",
        header: "Tanggal",
        width: "130px",
        render: (row) => row.started_at ? formatTanggal(row.started_at) : "—",
    },
    {
        key: "jam_mulai",
        header: "Jam Mulai",
        width: "100px",
        render: (row) => row.started_at ? formatJam(row.started_at) : "—",
    },
    {
        key: "jam_selesai",
        header: "Jam Selesai",
        width: "100px",
        render: (row) => row.ended_at ? formatJam(row.ended_at) : "—",
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

export const PENJUALAN_COLUMNS: ColumnDef<PenjualanExternalItem>[] = [
    {
        key: "penjualan_id",
        header: "ID Penjualan",
        render: (row) => <span className="table-id">{row.penjualan_id}</span>,
    },
    {
        key: "tanggal",
        header: "Tanggal Penjualan",
        width: "150px",
        render: (row) => row.created_at ? formatTanggal(row.created_at) : "—",
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

export const BAGI_HASIL_BSU_COLUMNS: ColumnDef<BagiHasilBsuItem>[] = [
    {
        key: "penerima_sisa_id",
        header: "ID Bagi Hasil",
        render: (row) => <span className="table-id">{row.penerima_sisa_id}</span>,
    },
    {
        key: "tanggal",
        header: "Tanggal Distribusi",
        width: "160px",
        render: (row) => row.tanggal_distribusi ? formatTanggal(row.tanggal_distribusi) : "—",
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

export const BAGI_HASIL_COLUMNS: ColumnDef<RiwayatBagiHasilItem>[] = [
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

export const PENARIKAN_COLUMNS: ColumnDef<PenarikanItem>[] = [
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

export function buildAngkutColumns(isBsu: boolean): ColumnDef<PengangkutanItem>[] {
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
            render: (row) => row.changed_at ? formatTanggal(row.changed_at) : "—",
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

export const BSI_TABS = [
    { id: "penimbangan",  label: "Penimbangan"  },
    { id: "pengangkutan", label: "Pengangkutan" },
    { id: "penarikan",    label: "Penarikan"    },
    { id: "penjualan",    label: "Penjualan"    },
    { id: "bagi_hasil",   label: "Bagi Hasil"   },
];

export const BSU_TABS = [
    { id: "penimbangan",  label: "Penimbangan"  },
    { id: "pengangkutan", label: "Pengangkutan" },
    { id: "penarikan",    label: "Penarikan"    },
    { id: "bagi_hasil",   label: "Bagi Hasil"   },
];

export const BSM_TABS = [
    { id: "penimbangan", label: "Penimbangan" },
    { id: "penarikan",   label: "Penarikan"   },
    { id: "penjualan",   label: "Penjualan"   },
    { id: "bagi_hasil",  label: "Bagi Hasil"  },
];
