import { type ColumnDef, TableAvatar, TableBadge } from "../components/table";
import type { AdminBankSampah } from "../types/admin.type";
import type { HistoryAkunBank } from "../types/profil.type";
import { FaGear, FaToggleOff, FaTrashCan } from "react-icons/fa6";
import PopupMenu from "../components/popup-menu";
import { formatTanggalJamBullet } from "../utils/date.utils";

export function formatRupiah(angka: number) {
    return angka.toLocaleString("id-ID");
}

export function getRoleLabel(role: string) {
    if (role.startsWith("admin_")) return "Admin";
    if (role.startsWith("petugas_")) return "Petugas";
    return role;
}

export function getRoleOptions(role: string): { label: string; value: string }[] {
    if (role === "admin_bsu") return [
        { label: "Admin BSU", value: "admin_bsu" },
        { label: "Petugas BSU", value: "petugas_bsu" },
    ];
    if (role === "admin_bsm") return [
        { label: "Admin BSM", value: "admin_bsm" },
        { label: "Petugas BSM", value: "petugas_bsm" },
    ];
    return [
        { label: "Admin BSI", value: "admin_bsi" },
        { label: "Petugas BSI", value: "petugas_bsi" },
    ];
}

export function buildAdminColumns(
    currentAdminId: string,
    onToggle: (userId: string, currentStatus: string) => void,
    onDelete: (adminId: string) => void,
): ColumnDef<AdminBankSampah>[] {
    return [
        {
            key: "foto",
            header: "Foto",
            width: "56px",
            align: "center",
            render: (row) => <TableAvatar src={row.foto} alt={row.nama} />,
        },
        {
            key: "admin_id",
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
            render: (row) => <span style={{ color: "#013236a0" }}>{row.email || "-"}</span>,
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
                return (
                    <TableBadge
                        label={row.status_admin === "aktif" ? "Aktif" : "Nonaktif"}
                        active={row.status_admin === "aktif"}
                    />
                );
            },
        },
        {
            key: "aksi",
            header: "Aksi",
            width: "64px",
            align: "center",
            render: (row) => {
                if (row.admin_id === currentAdminId) return null;
                return (
                    <PopupMenu
                        trigger={
                            <button className="table-action-btn" type="button" title="Pengaturan">
                                <FaGear />
                            </button>
                        }
                        items={[
                            {
                                label: row.status_admin === "aktif" ? "Nonaktifkan Akun Staff" : "Generate Aktivasi Akun Staff",
                                icon: <FaToggleOff />,
                                onClick: () => onToggle(row.user_id, row.status_admin),
                            },
                            {
                                label: "Hapus Staff",
                                icon: <FaTrashCan />,
                                variant: "danger",
                                onClick: () => onDelete(row.admin_id),
                            },
                        ]}
                    />
                );
            },
        },
    ];
}

const ACTION_COLOR: Record<string, { color: string; bg: string }> = {
    CREATE: { color: "#4EA771", bg: "rgba(78,167,113,0.12)" },
    UPDATE: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
    DELETE: { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

export const HISTORY_COLUMNS: ColumnDef<HistoryAkunBank>[] = [
    {
        key: "action",
        header: "Action",
        width: "110px",
        align: "center",
        render: (row) => {
            const c = ACTION_COLOR[row.action] ?? ACTION_COLOR["UPDATE"];
            return (
                <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, color: c.color, backgroundColor: c.bg }}>
                    {row.action}
                </span>
            );
        },
    },
    {
        key: "timestamp",
        header: "Timestamp",
        width: "180px",
        render: (row) => <span style={{ fontSize: "12px", color: "#013236a0" }}>{formatTanggalJamBullet(row.created_at)}</span>,
    },
    {
        key: "informasi",
        header: "Informasi",
        render: (row) => <span style={{ fontSize: "12px", color: "#013236a0" }}>{row.informasi}</span>,
    },
    {
        key: "keterangan",
        header: "Keterangan",
        render: (row) => <span style={{ fontSize: "12px", color: "#013236a0" }}>{row.keterangan || "-"}</span>,
    },
    {
        key: "created_by",
        header: "By Admin",
        width: "150px",
        render: (row) => <span style={{ fontSize: "12px", fontWeight: 500, color: "#013236a0" }}>{row.created_by_name || "-"}</span>,
    },
];
