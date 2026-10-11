import { useCallback, useEffect, useMemo, useState } from "react";
import { FaPlus, FaPenToSquare, FaTrashCan } from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import { MitraService } from "../services/mitra.service";
import type { MitraPengepul } from "../types/mitra.type";
import Button from "../components/button";
import FilterPill from "../components/filter-pill";
import Table, { TableBadge, TableActionBtn, type ColumnDef } from "../components/table";
import MitraFormModal, { type MitraFormData } from "../modals/MitraFormModal";
import PopupConfirmation from "../layouts/popup-confirmation";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import { formatTanggal } from "../utils/date.utils";
import { getApiError } from "../utils/error.utils";
import "../styles/manajemen-reward.css";
import "../styles/manajemen-mitra.css";

type StatusFilter = "aktif" | "nonaktif";

const STATUS_FILTER_OPTIONS: { label: string; value: StatusFilter }[] = [
    { label: "Aktif", value: "aktif" },
    { label: "Tidak Aktif", value: "nonaktif" },
];

export default function ManajemenMitraSection() {
    const { user } = useAuth();
    const bankId = user?.bank_id || "";

    const [mitraList, setMitraList] = useState<MitraPengepul[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("aktif");

    const [formOpen, setFormOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<MitraPengepul | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<MitraPengepul | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [popup, setPopup] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const fetchMitra = useCallback(async () => {
        if (!bankId) {
            setError("Bank tidak teridentifikasi pada sesi Anda.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const res = await MitraService.getMitra(bankId);
            setMitraList(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            setError(getApiError(err, "Gagal memuat data mitra."));
        } finally {
            setIsLoading(false);
        }
    }, [bankId]);

    useEffect(() => {
        fetchMitra();
    }, [fetchMitra]);

    const filteredMitra = useMemo(() => {
        return mitraList.filter(m => (statusFilter === "aktif" ? m.is_active : !m.is_active));
    }, [mitraList, statusFilter]);

    const openAdd = () => { setEditTarget(null); setFormOpen(true); };
    const openEdit = (mitra: MitraPengepul) => { setEditTarget(mitra); setFormOpen(true); };
    const closeForm = () => { setFormOpen(false); setEditTarget(null); };

    const handleSubmit = async (data: MitraFormData) => {
        if (!bankId) return;
        if (editTarget) {
            await MitraService.updateMitra(bankId, editTarget.mitra_id, {
                nama_mitra: data.nama_mitra,
                is_active: data.is_active,
            });
            setPopup({ message: "Mitra berhasil diperbarui.", type: "success" });
        } else {
            await MitraService.createMitra(bankId, { nama_mitra: data.nama_mitra });
            setPopup({ message: "Mitra berhasil ditambahkan.", type: "success" });
        }
        closeForm();
        fetchMitra();
    };

    const handleDelete = async () => {
        if (!deleteTarget || !bankId) return;
        setIsDeleting(true);
        try {
            await MitraService.deleteMitra(bankId, deleteTarget.mitra_id);
            setPopup({ message: "Mitra berhasil dihapus.", type: "success" });
            setDeleteTarget(null);
            fetchMitra();
        } catch (err) {
            setPopup({ message: getApiError(err, "Gagal menghapus mitra."), type: "error" });
        } finally {
            setIsDeleting(false);
        }
    };

    const columns: ColumnDef<MitraPengepul>[] = [
        {
            key: "mitra_id",
            header: "ID Pengepul",
            render: (row) => <span className="table-id">{row.mitra_id}</span>,
        },
        {
            key: "nama_mitra",
            header: "Nama Mitra Pengepul",
            render: (row) => (
                <span style={{ fontWeight: 600, color: "var(--c-text)" }}>{row.nama_mitra}</span>
            ),
        },
        {
            key: "created_at",
            header: "Ditambahkan pada",
            render: (row) => (
                <span style={{ color: "var(--c-text-muted)" }}>{formatTanggal(row.created_at)}</span>
            ),
        },
        {
            key: "is_active",
            header: "Status",
            width: "130px",
            render: (row) => <TableBadge label={row.is_active ? "Aktif" : "Tidak Aktif"} active={row.is_active} />,
        },
        {
            key: "aksi",
            header: "Aksi",
            width: "100px",
            align: "center",
            render: (row) => (
                <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                    <TableActionBtn icon={FaPenToSquare} title="Edit mitra" onClick={() => openEdit(row)} />
                    <button
                        className="table-action-btn"
                        title="Hapus mitra"
                        style={{ color: "var(--c-danger, #ef4444)", borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)" }}
                        onClick={() => setDeleteTarget(row)}
                    >
                        <FaTrashCan />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <section className="mr-section">
            <div className="mr-header">
                <div className="mr-header-left">
                    <h2 className="mr-header-title">Kelola Mitra Pengepul</h2>
                    <p className="mr-header-desc">
                        Kelola pengepul yang bermitra dengan bank sampah. Petugas juga bisa menambah mitra saat melakukan penjualan.
                    </p>
                </div>
                <Button color="secondary" variant="solid" isRounded icon={<FaPlus />} onClick={openAdd}>
                    Tambah Mitra
                </Button>
            </div>

            {error && <div className="mr-error-banner">{error}</div>}

            <div className="mm-card">
                <div className="mm-card-toolbar">
                    <FilterPill
                        options={STATUS_FILTER_OPTIONS}
                        activeValue={statusFilter}
                        onChange={(val) => setStatusFilter(val)}
                    />
                </div>

                {isLoading ? (
                    <div className="mm-loading">Memuat data...</div>
                ) : (
                    <Table
                        columns={columns}
                        data={filteredMitra}
                        rowKey={(row) => row.mitra_id}
                        emptyMessage={
                            mitraList.length === 0
                                ? "Belum ada mitra pengepul. Tambahkan mitra baru menggunakan tombol di atas."
                                : `Tidak ada mitra dengan status "${statusFilter === "aktif" ? "Aktif" : "Tidak Aktif"}".`
                        }
                    />
                )}
            </div>

            <MitraFormModal
                isOpen={formOpen}
                onClose={closeForm}
                onSubmit={handleSubmit}
                initialData={editTarget}
            />

            <PopupConfirmation
                isOpen={!!deleteTarget}
                type="danger"
                title="Hapus Mitra Pengepul?"
                message={`Mitra "${deleteTarget?.nama_mitra || ""}" akan dihapus. Lanjutkan?`}
                confirmText={isDeleting ? "Menghapus..." : "Ya, Hapus"}
                cancelText="Batal"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />

            {popup && (
                <PopupNotifikasi
                    message={popup.message}
                    type={popup.type}
                    onClose={() => setPopup(null)}
                />
            )}
        </section>
    );
}
