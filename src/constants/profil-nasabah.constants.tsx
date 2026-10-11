import { type ColumnDef, TableActionBtn } from "../components/table";
import { type RiwayatSetoranNasabahItem } from "../services/setoran.service";
import { type RiwayatBagiHasilNasabahItem } from "../services/bagi_hasil_penjualan.service";
import { type PenarikanNasabahItem } from "../services/penarikan.service";
import { FaEye } from "react-icons/fa6";
import { formatTanggalJam } from "../utils/date.utils";
import { formatDecimal, formatNominal } from "../utils/number.utils";

export type StatusNasabah = "aktif" | "nonaktif" | "pending";

export const STATUS_CONFIG: Record<StatusNasabah, { label: string; color: string; bg: string; dot: string }> = {
    aktif:    { label: "Aktif",    color: "#4EA771", bg: "#4ea77223",             dot: "#4EA771" },
    nonaktif: { label: "Nonaktif", color: "#b04040", bg: "rgba(220,80,80,0.10)",  dot: "#dc5050" },
    pending:  { label: "Pending",  color: "#8a6200", bg: "rgba(215,160,30,0.12)", dot: "#d7a01e" },
};

export function formatRole(role?: string): string {
    if (!role) return "-";
    return role.split("_").map((w) =>
        ["bsi", "bsu", "bsm"].includes(w.toLowerCase())
            ? w.toUpperCase()
            : w.charAt(0).toUpperCase() + w.slice(1)
    ).join(" ");
}

export const SETORAN_COLUMNS: ColumnDef<RiwayatSetoranNasabahItem>[] = [
    {
        key: "setoran_id",
        header: "ID Setoran",
        width: "170px",
        render: (row) => <span className="table-id">{row.setoran_id}</span>,
    },
    {
        key: "tanggal",
        header: "Tanggal Setoran",
        width: "190px",
        render: (row) => formatTanggalJam(row.transaksi_timestamp),
    },
    {
        key: "total_item",
        header: "Total Setoran",
        width: "130px",
        render: (row) => `${formatDecimal(row.total_item)} item`,
    },
    {
        key: "aksi",
        header: "Aksi",
        width: "70px",
        align: "center" as const,
        render: () => <TableActionBtn icon={FaEye} title="Lihat Detail" />,
    },
];


export const BAGI_HASIL_COLUMNS: ColumnDef<RiwayatBagiHasilNasabahItem>[] = [
    {
        key: "penerima_id",
        header: "ID Bagi Hasil",
        width: "170px",
        render: (row) => <span className="table-id">{row.penerima_id}</span>,
    },
    {
        key: "tanggal",
        header: "Tanggal",
        width: "190px",
        render: (row) => formatTanggalJam(row.tanggal),
    },
    {
        key: "reward",
        header: "Reward",
        width: "120px",
        render: (row) => row.reward,
    },
    {
        key: "total_diterima",
        header: "Total Diterima",
        width: "160px",
        render: (row) => formatNominal(row.total_diterima, row.satuan_diterima),
    },
    {
        key: "aksi",
        header: "Aksi",
        width: "70px",
        align: "center" as const,
        render: () => <TableActionBtn icon={FaEye} title="Lihat Detail" />,
    },
];

export const STATUS_PENARIKAN: Record<string, { label: string; cls: string }> = {
    pending:         { label: "Diajukan",               cls: "mendatang"  },
    approved:        { label: "Menunggu Dijemput",       cls: "berlangsung" },
    completed:       { label: "Selesai",                 cls: "selesai"    },
    canceled:        { label: "Dibatalkan",              cls: "dibatalkan" },
    rejected:        { label: "Ditolak",                 cls: "dibatalkan" },
    request_expired: { label: "Pengajuan Kadaluarsa",    cls: "dibatalkan" },
    pickup_expired:  { label: "Penjemputan Kadaluarsa",  cls: "dibatalkan" },
};

export const PENARIKAN_COLUMNS: ColumnDef<PenarikanNasabahItem>[] = [
    {
        key: "penarikan_id",
        header: "ID Penarikan",
        width: "220px",
        render: (row) => <span className="table-id">{row.penarikan_id}</span>,
    },
    {
        key: "nama_reward",
        header: "Nama Reward",
        width: "140px",
        render: (row) => row.nama_reward,
    },
    {
        key: "diajukan_pada",
        header: "Diajukan Pada",
        width: "190px",
        render: (row) => formatTanggalJam(row.created_at),
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
