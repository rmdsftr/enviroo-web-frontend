import { type ColumnDef, TableAvatar, TableBadge, TableActionBtn } from "../components/table";
import type { AdminBankSampah } from "../types/admin.type";
import type { NasabahBankSampah } from "../types/nasabah.type";
import type { BSUByBankId } from "../types/bsu.type";
import type { BagiHasilBsuItem } from "../types/distribusi_sisa.type";
import { type PengangkutanItem } from "../services/pengangkutan.service";
import { FaEye } from "react-icons/fa6";
import { formatTanggal } from "../utils/date.utils";

// ── Utilities ──

export function getRoleLabel(role: string) {
    if (role.startsWith("admin_")) return "Admin";
    if (role.startsWith("petugas_")) return "Petugas";
    return role;
}

type StatusNasabah = "aktif" | "nonaktif" | "pending";

const statusLabel: Record<StatusNasabah, string> = {
    aktif: "Aktif",
    nonaktif: "Nonaktif",
    pending: "Pending",
};

export function StatusBadge({ status }: { status: StatusNasabah }) {
    if (status === "pending") {
        return (
            <span className="table-badge table-badge--pending">
                <span className="table-badge-dot" />
                Pending
            </span>
        );
    }
    return <TableBadge label={statusLabel[status]} active={status === "aktif"} />;
}

// ── BSU Columns ──

export function getBsuColumns(): ColumnDef<BSUByBankId>[] {
    return [
        {
            key: "foto",
            header: "Foto",
            width: "56px",
            align: "center",
            render: () => <TableAvatar src={undefined} alt="BSU" />,
        },
        {
            key: "bank_id",
            header: "Bank ID",
            width: "160px",
            render: (row) => <span className="table-name">{row.bank_id}</span>,
        },
        {
            key: "nama",
            header: "Nama BSU",
            render: (row) => <span className="table-name">{row.nama_bsu}</span>,
        },
        {
            key: "nasabah",
            header: "Jumlah Nasabah",
            align: "center",
            width: "140px",
            render: (row) => <span style={{ fontWeight: 600 }}>{row.jumlah_nasabah}</span>,
        },
        {
            key: "staff",
            header: "Jumlah Staff",
            align: "center",
            width: "120px",
            render: (row) => <span style={{ fontWeight: 600 }}>{row.jumlah_staff}</span>,
        },
        {
            key: "status",
            header: "Status",
            width: "120px",
            render: (row) => <TableBadge label={row.is_active ? "Aktif" : "Nonaktif"} active={row.is_active} />,
        },
    ];
}

// ── Admin Columns ──

export function getAdminColumns(): ColumnDef<AdminBankSampah>[] {
    return [
        {
            key: "foto",
            header: "Foto",
            width: "56px",
            align: "center",
            render: (row) => <TableAvatar src={row.foto} alt={row.nama} />,
        },
        {
            key: "userId",
            header: "Admin ID",
            width: "160px",
            render: (row) => <span className="table-name">{row.admin_id}</span>,
        },
        {
            key: "nama",
            header: "Nama Staff",
            render: (row) => <span style={{ fontWeight: 500 }}>{row.nama}</span>,
        },
        {
            key: "email",
            header: "Email",
            render: (row) => <span>{row.email}</span>,
        },
        {
            key: "role",
            header: "Role",
            width: "100px",
            render: (row) => (
                <span style={{ textTransform: "capitalize", fontWeight: 500, color: "#3d5a48" }}>
                    {getRoleLabel(row.role)}
                </span>
            ),
        },
        {
            key: "status",
            header: "Status",
            width: "120px",
            render: (row) => {
                if (row.status_admin === "pending") {
                    return (
                        <span className="table-badge table-badge--pending">
                            <span className="table-badge-dot" />
                            Pending
                        </span>
                    );
                }
                return <TableBadge label={row.status_admin === "aktif" ? "Aktif" : "Nonaktif"} active={row.status_admin === "aktif"} />;
            },
        },
    ];
}

// ── Nasabah Columns ──

export function getNasabahColumns(): ColumnDef<NasabahBankSampah>[] {
    return [
        {
            key: "foto",
            header: "Foto",
            width: "56px",
            align: "center",
            render: (row) => <TableAvatar src={row.foto} alt={row.nama_nasabah} />,
        },
        {
            key: "nasabah_id",
            header: "ID Nasabah",
            width: "140px",
            render: (row) => <span className="table-name">{row.nasabah_id}</span>,
        },
        {
            key: "nama",
            header: "Nama Nasabah",
            render: (row) => <span className="table-name">{row.nama_nasabah}</span>,
        },
        {
            key: "nik",
            header: "NIK",
            width: "150px",
            render: (row) => <span>{row.nik || "-"}</span>,
        },
        {
            key: "email",
            header: "Email",
            render: (row) => <span>{row.email || "-"}</span>,
        },
        {
            key: "status",
            header: "Status",
            width: "120px",
            render: (row) => <StatusBadge status={row.status_nasabah as any} />,
        },
    ];
}

// ── Pengangkutan ──

export const STATUS_PENGANGKUTAN: Record<string, { label: string; cls: string }> = {
    requested: { label: "Diminta",          cls: "mendatang"   },
    approved:  { label: "Disetujui",        cls: "mendatang"   },
    otw:       { label: "Dalam Perjalanan", cls: "berlangsung" },
    arrived:   { label: "Tiba di Lokasi",   cls: "berlangsung" },
    completed: { label: "Selesai",          cls: "selesai"     },
    rejected:  { label: "Ditolak",          cls: "dibatalkan"  },
    canceled:  { label: "Dibatalkan",       cls: "dibatalkan"  },
};

export const ANGKUT_COLS: ColumnDef<PengangkutanItem>[] = [
    {
        key: "pengangkutan_id",
        header: "ID Pengangkutan",
        render: (row) => <span className="table-id">{row.pengangkutan_id}</span>,
    },
    {
        key: "tanggal",
        header: "Tanggal Pengangkutan",
        width: "180px",
        render: (row) => row.changed_at ? formatTanggal(row.changed_at) : "—",
    },
    {
        key: "pihak",
        header: "Diangkut Oleh",
        render: (row) => row.nama_bsi,
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

// ── Bagi Hasil BSU ──

export const BAGI_HASIL_BSU_COLS: ColumnDef<BagiHasilBsuItem>[] = [
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
