import { type ColumnDef, TableActionBtn } from "../components/table";
import { type RiwayatSetoranNasabahItem } from "../services/setoran.service";
import { type RiwayatBagiHasilNasabahItem } from "../services/bagi_hasil_penjualan.service";
import { type PenarikanItem } from "../services/penarikan.service";
import { FaEye } from "react-icons/fa6";
import { formatTanggal } from "../utils/date.utils";

// ── Status Nasabah ──

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

// ── Setoran ──

export const STATUS_SETORAN: Record<string, { label: string; cls: string }> = {
    berhasil: { label: "Berhasil", cls: "selesai"    },
    pending:  { label: "Pending",  cls: "mendatang"  },
    gagal:    { label: "Gagal",    cls: "dibatalkan" },
};

export const SETORAN_COLUMNS: ColumnDef<RiwayatSetoranNasabahItem>[] = [
    {
        key: "setoran_id",
        header: "ID Setoran",
        render: (row) => <span className="table-id">{row.setoran_id}</span>,
    },
    {
        key: "tanggal",
        header: "Tanggal Setoran",
        width: "160px",
        render: (row) => formatTanggal(row.transaksi_timestamp),
    },
    {
        key: "total_item",
        header: "Total Setoran",
        width: "130px",
        render: (row) => `${row.total_item} item`,
    },
    {
        key: "status_setoran",
        header: "Status Setoran",
        width: "140px",
        render: (row) => {
            const s = STATUS_SETORAN[row.status_setoran];
            return (
                <span className={`jbsu-status-pill ${s?.cls ?? row.status_setoran}`}>
                    {s?.label ?? row.status_setoran}
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

// ── Bagi Hasil ──

export function fmtBh(total: number, satuan: string): string {
    const num = total.toLocaleString("id-ID");
    return satuan === "Rp" ? `Rp ${num}` : `${num} ${satuan}`;
}

export const BAGI_HASIL_COLUMNS: ColumnDef<RiwayatBagiHasilNasabahItem>[] = [
    {
        key: "penerima_id",
        header: "ID Bagi Hasil",
        render: (row) => <span className="table-id">{row.penerima_id}</span>,
    },
    {
        key: "tanggal",
        header: "Tanggal",
        width: "160px",
        render: (row) => formatTanggal(row.tanggal),
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
        render: (row) => fmtBh(row.total_diterima, row.satuan_diterima),
    },
    {
        key: "aksi",
        header: "Aksi",
        width: "70px",
        align: "center" as const,
        render: () => <TableActionBtn icon={FaEye} title="Lihat Detail" />,
    },
];

// ── Penarikan ──

export const STATUS_PENARIKAN: Record<string, { label: string; cls: string }> = {
    pending:    { label: "Pending",    cls: "mendatang"  },
    berhasil:   { label: "Berhasil",   cls: "selesai"    },
    kadaluarsa: { label: "Kadaluarsa", cls: "dibatalkan" },
    dibatalkan: { label: "Dibatalkan", cls: "dibatalkan" },
};

export const PENARIKAN_COLUMNS: ColumnDef<PenarikanItem>[] = [
    {
        key: "penarikan_id",
        header: "ID Penarikan",
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
