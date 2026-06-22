import { type ColumnDef, TableActionBtn } from "../components/table";
import type { DistribusiSembakoItem } from "../types/sembako.type";
import { FaEye } from "react-icons/fa6";
import { formatTanggal } from "../utils/date.utils";

export const SATUAN_OPTIONS: { value: "all" | "kg" | "pcs" | "liter"; label: string }[] = [
    { value: "all", label: "Semua" },
    { value: "kg", label: "Kg" },
    { value: "pcs", label: "Pcs" },
    { value: "liter", label: "Liter" },
];

export const STATUS_DISTRIBUSI: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "mendatang" },
    selesai: { label: "Selesai", cls: "selesai" },
    gagal:   { label: "Gagal",   cls: "dibatalkan" },
};

export function buildDistribusiColumns(isBsi: boolean): ColumnDef<DistribusiSembakoItem>[] {
    return [
        {
            key: "disbako_id",
            header: "ID Distribusi",
            render: (row) => <span className="table-id">{row.disbako_id}</span>,
        },
        {
            key: "pihak",
            header: isBsi ? "Nama BSU" : "Nama Admin BSI",
            render: (row) => isBsi ? row.nama_bsu : row.nama_admin_bsi,
        },
        {
            key: "tanggal",
            header: "Tanggal",
            width: "130px",
            render: (row) => formatTanggal(row.created_at),
        },
        {
            key: "total_item",
            header: "Total Item",
            width: "110px",
            render: (row) => `${row.total_item} item`,
        },
        {
            key: "total_poin",
            header: "Total Poin",
            width: "110px",
            render: (row) => `${row.total_poin} poin`,
        },
        {
            key: "status_distribusi",
            header: "Status",
            width: "130px",
            render: (row) => {
                const s = STATUS_DISTRIBUSI[row.status_distribusi];
                return (
                    <span className={`jbsu-status-pill ${s?.cls ?? row.status_distribusi}`}>
                        {s?.label ?? row.status_distribusi}
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
