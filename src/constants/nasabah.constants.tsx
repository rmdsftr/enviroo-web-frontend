import { TableAvatar, TableBadge, TableActionBtn, type ColumnDef } from "../components/table";
import { FaEye } from "react-icons/fa6";

// ── Types ────────────────────────────────────────────────
export type StatusNasabah = "aktif" | "nonaktif" | "pending";

export type NasabahRow = {
    id: string;
    foto?: string;
    nama: string;
    email?: string;
    pusat?: string;
    unit?: string;
    status: StatusNasabah;
};

// ── Labels ───────────────────────────────────────────────
export const statusLabel: Record<StatusNasabah, string> = {
    aktif: "Aktif",
    nonaktif: "Nonaktif",
    pending: "Pending",
};

// ── Filter options ───────────────────────────────────────
export const STATUS_FILTER_OPTIONS = [
    { label: "Semua", value: "" },
    { label: "Aktif", value: "aktif" },
    { label: "Nonaktif", value: "nonaktif" },
    { label: "Pending", value: "pending" },
];

// ── Sort options ─────────────────────────────────────────

// ── Status badge ─────────────────────────────────────────
function StatusBadge({ status }: { status: StatusNasabah }) {
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

// ── Table columns ────────────────────────────────────────
export function buildColumns(
    isAdminBsi: boolean,
    isAdminBsu: boolean,
    navigate: (path: string) => void,
    isAdminBsm?: boolean,
): ColumnDef<NasabahRow>[] {
    const basePath = isAdminBsu ? '/bsu' : isAdminBsi ? '/bsi' : isAdminBsm ? '/bsm' : '/superadmin';

    const cols: ColumnDef<NasabahRow>[] = [
        {
            key: "foto",
            header: "Foto",
            width: "56px",
            align: "center",
            render: (row) => <TableAvatar src={row.foto} alt={row.nama} />,
        },
        {
            key: "nasabah_id",
            header: "ID Nasabah",
            render: (row) => (
                <span
                    className="table-name table-name--link"
                    onClick={() => navigate(`${basePath}/nasabah/${row.id}`)}
                    style={{ cursor: "pointer" }}
                >
                    {row.id}
                </span>
            ),
        },
        {
            key: "nama",
            header: "Nama Nasabah",
            render: (row) => (
                <span className="nasabah-bsu" style={{ color: "#1a3d2b", fontWeight: 600 }}>
                    {row.nama}
                </span>
            ),
        },
    ];

    if (isAdminBsi || isAdminBsu || isAdminBsm) {
        cols.push({
            key: "email",
            header: "Email",
            render: (row) => <span className="nasabah-bsu">{row.email ?? "-"}</span>,
        });
    }

    cols.push({
        key: "status",
        header: "Status",
        width: "120px",
        render: (row) => <StatusBadge status={row.status} />,
    });

    // ── Action column ────────────────────────────────────
    cols.push({
        key: "aksi",
        header: "Aksi",
        width: "72px",
        align: "center",
        render: (row) => (
            <TableActionBtn
                icon={FaEye}
                title="Lihat Detail"
                onClick={() => navigate(`${basePath}/nasabah/${row.id}`)}
            />
        ),
    });

    return cols;
}
