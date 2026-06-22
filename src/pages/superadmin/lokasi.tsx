import { useState, useEffect, useCallback } from "react";
import { FaPlus, FaPenToSquare, FaTrashCan } from "react-icons/fa6";
import Button from "../../components/button";
import Dropdown from "../../components/dropdown";
import Pagination from "../../components/pagination";
import KecamatanFormModal from "../../modals/KecamatanFormModal";
import KelurahanFormModal from "../../modals/KelurahanFormModal";
import type { KelurahanFormData } from "../../modals/KelurahanFormModal";
import PopupConfirmation from "../../layouts/popup-confirmation";
import PopupNotifikasi from "../../layouts/popup-notifikasi";
import { LokasiService } from "../../services/lokasi.service";
import type { Kecamatan, Kelurahan } from "../../types/lokasi.type";
import "../../styles/manajemen-reward.css";
import "../../styles/table.css";

const DIVIDER = <div style={{ height: "1px", background: "var(--c-border-soft)", margin: "32px 0" }} />;

export default function LokasiPage() {
    /* ── Kecamatan ──────────────────────────────────────────── */
    const [kecamatans, setKecamatans] = useState<Kecamatan[]>([]);
    const [isLoadingKec, setIsLoadingKec] = useState(true);
    const [kecModalOpen, setKecModalOpen] = useState(false);
    const [editKec, setEditKec] = useState<Kecamatan | null>(null);
    const [deleteKecTarget, setDeleteKecTarget] = useState<Kecamatan | null>(null);
    const [isDeletingKec, setIsDeletingKec] = useState(false);

    const fetchKecamatan = useCallback(async () => {
        setIsLoadingKec(true);
        try {
            const res = await LokasiService.getAllKecamatan();
            setKecamatans(Array.isArray(res.data) ? res.data : []);
        } catch {
            showNotif("Gagal memuat data kecamatan.", "error");
        } finally {
            setIsLoadingKec(false);
        }
    }, []);

    const handleKecSubmit = async (nama: string) => {
        if (editKec) {
            await LokasiService.updateKecamatan(editKec.id_kecamatan, nama);
            showNotif("Kecamatan berhasil diperbarui.", "success");
        } else {
            await LokasiService.createKecamatan(nama);
            showNotif("Kecamatan berhasil ditambahkan.", "success");
        }
        setKecModalOpen(false);
        setEditKec(null);
        fetchKecamatan();
    };

    const handleKecDelete = async () => {
        if (!deleteKecTarget) return;
        setIsDeletingKec(true);
        try {
            await LokasiService.deleteKecamatan(deleteKecTarget.id_kecamatan);
            showNotif("Kecamatan berhasil dihapus.", "success");
            setDeleteKecTarget(null);
            fetchKecamatan();
            fetchKelurahan(kelPage, filterKecId);
        } catch (err: any) {
            showNotif(err?.response?.data?.error || "Gagal menghapus kecamatan.", "error");
        } finally {
            setIsDeletingKec(false);
        }
    };

    /* ── Kelurahan ──────────────────────────────────────────── */
    const [kelurahans, setKelurahans] = useState<Kelurahan[]>([]);
    const [isLoadingKel, setIsLoadingKel] = useState(true);
    const [kelModalOpen, setKelModalOpen] = useState(false);
    const [editKel, setEditKel] = useState<Kelurahan | null>(null);
    const [deleteKelTarget, setDeleteKelTarget] = useState<Kelurahan | null>(null);
    const [isDeletingKel, setIsDeletingKel] = useState(false);
    const [filterKecId, setFilterKecId] = useState("");
    const [kelPage, setKelPage] = useState(1);
    const [kelTotalPages, setKelTotalPages] = useState(1);
    const [kelTotalItems, setKelTotalItems] = useState(0);
    const KEL_LIMIT = 25;

    const fetchKelurahan = useCallback(async (page: number, kecId: string) => {
        setIsLoadingKel(true);
        try {
            if (kecId) {
                const res = await LokasiService.getKelurahanByKecamatan(Number(kecId));
                const data = Array.isArray(res.data) ? res.data : [];
                setKelurahans(data);
                setKelTotalItems(data.length);
                setKelTotalPages(1);
            } else {
                const res = await LokasiService.getAllKelurahan({ page, limit: KEL_LIMIT });
                setKelurahans(Array.isArray(res.data) ? res.data : []);
                setKelTotalPages(res.pagination?.total_pages ?? 1);
                setKelTotalItems(res.pagination?.total_items ?? 0);
            }
        } catch {
            showNotif("Gagal memuat data kelurahan.", "error");
        } finally {
            setIsLoadingKel(false);
        }
    }, []);

    const handleKelSubmit = async (data: KelurahanFormData) => {
        if (editKel) {
            await LokasiService.updateKelurahan(editKel.id_kelurahan, {
                id_kecamatan: data.id_kecamatan,
                kelurahan: data.kelurahan,
            });
            showNotif("Kelurahan berhasil diperbarui.", "success");
        } else {
            await LokasiService.createKelurahan({
                id_kecamatan: data.id_kecamatan,
                kelurahan: data.kelurahan,
            });
            showNotif("Kelurahan berhasil ditambahkan.", "success");
        }
        setKelModalOpen(false);
        setEditKel(null);
        fetchKelurahan(kelPage, filterKecId);
    };

    const handleKelDelete = async () => {
        if (!deleteKelTarget) return;
        setIsDeletingKel(true);
        try {
            await LokasiService.deleteKelurahan(deleteKelTarget.id_kelurahan);
            showNotif("Kelurahan berhasil dihapus.", "success");
            setDeleteKelTarget(null);
            fetchKelurahan(kelPage, filterKecId);
        } catch (err: any) {
            showNotif(err?.response?.data?.error || "Gagal menghapus kelurahan.", "error");
        } finally {
            setIsDeletingKel(false);
        }
    };

    /* ── Shared notif ───────────────────────────────────────── */
    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const showNotif = (message: string, type: "success" | "error") => setPopupNotif({ message, type });

    /* ── Init ───────────────────────────────────────────────── */
    useEffect(() => {
        fetchKecamatan();
    }, [fetchKecamatan]);

    useEffect(() => {
        fetchKelurahan(kelPage, filterKecId);
    }, [kelPage, filterKecId, fetchKelurahan]);

    const kecamatanFilterOptions = [
        { label: "Semua Kecamatan", value: "" },
        ...kecamatans.map(k => ({ label: k.kecamatan, value: String(k.id_kecamatan) })),
    ];

    /* ── Render ─────────────────────────────────────────────── */
    return (
        <section className="mr-section">

            {/* ══ KECAMATAN ═══════════════════════════════════════ */}
            <div className="mr-header">
                <div className="mr-header-left">
                    <h2 className="mr-header-title">Manajemen Kecamatan</h2>
                    <p className="mr-header-desc">Data master kecamatan yang digunakan sebagai referensi alamat bank sampah.</p>
                </div>
                <Button
                    color="secondary"
                    variant="solid"
                    isRounded
                    icon={<FaPlus />}
                    onClick={() => { setEditKec(null); setKecModalOpen(true); }}
                >
                    Tambah Kecamatan
                </Button>
            </div>

            <div className="table-wrapper">
                <table className="table">
                    <thead>
                        <tr>
                            <th style={{ width: "56px" }}>No</th>
                            <th style={{ width: "80px" }}>ID</th>
                            <th>Nama Kecamatan</th>
                            <th style={{ width: "100px", textAlign: "center" }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingKec ? (
                            <tr><td colSpan={4} className="table-empty">Memuat data...</td></tr>
                        ) : kecamatans.length === 0 ? (
                            <tr><td colSpan={4} className="table-empty">Belum ada data kecamatan.</td></tr>
                        ) : (
                            kecamatans.map((kec, idx) => (
                                <tr key={kec.id_kecamatan}>
                                    <td style={{ color: "var(--c-text-muted)", fontSize: "12px" }}>{idx + 1}</td>
                                    <td className="table-id" style={{ fontWeight: 600 }}>{kec.id_kecamatan}</td>
                                    <td>{kec.kecamatan}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                            <button
                                                className="table-action-btn"
                                                title="Edit kecamatan"
                                                onClick={() => { setEditKec(kec); setKecModalOpen(true); }}
                                            >
                                                <FaPenToSquare />
                                            </button>
                                            <button
                                                className="table-action-btn"
                                                title="Hapus kecamatan"
                                                style={{ color: "var(--c-danger, #ef4444)", borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)" }}
                                                onClick={() => setDeleteKecTarget(kec)}
                                            >
                                                <FaTrashCan />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {DIVIDER}

            {/* ══ KELURAHAN ════════════════════════════════════════ */}
            <div className="mr-header" style={{ paddingTop: 0 }}>
                <div className="mr-header-left">
                    <h2 className="mr-header-title">Manajemen Kelurahan</h2>
                    <p className="mr-header-desc">Data master kelurahan yang terhubung dengan kecamatan.</p>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ minWidth: "200px" }}>
                        <Dropdown
                            options={kecamatanFilterOptions}
                            value={filterKecId}
                            onChange={e => { setFilterKecId(e.target.value); setKelPage(1); }}
                            fullWidth
                            isRounded
                        />
                    </div>
                    <Button
                        color="secondary"
                        variant="solid"
                        isRounded
                        icon={<FaPlus />}
                        onClick={() => { setEditKel(null); setKelModalOpen(true); }}
                    >
                        Tambah Kelurahan
                    </Button>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="table">
                    <thead>
                        <tr>
                            <th style={{ width: "56px" }}>No</th>
                            <th style={{ width: "80px" }}>ID</th>
                            <th>Nama Kelurahan</th>
                            <th>Kecamatan</th>
                            <th style={{ width: "100px", textAlign: "center" }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingKel ? (
                            <tr><td colSpan={5} className="table-empty">Memuat data...</td></tr>
                        ) : kelurahans.length === 0 ? (
                            <tr><td colSpan={5} className="table-empty">Belum ada data kelurahan.</td></tr>
                        ) : (
                            kelurahans.map((kel, idx) => (
                                <tr key={kel.id_kelurahan}>
                                    <td style={{ color: "var(--c-text-muted)", fontSize: "12px" }}>
                                        {(kelPage - 1) * KEL_LIMIT + idx + 1}
                                    </td>
                                    <td className="table-id" style={{ fontWeight: 600 }}>{kel.id_kelurahan}</td>
                                    <td>{kel.kelurahan}</td>
                                    <td style={{ color: "var(--c-text-muted)" }}>
                                        {kel.Kecamatan?.kecamatan
                                            ?? kecamatans.find(k => k.id_kecamatan === kel.id_kecamatan)?.kecamatan
                                            ?? "-"}
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                            <button
                                                className="table-action-btn"
                                                title="Edit kelurahan"
                                                onClick={() => { setEditKel(kel); setKelModalOpen(true); }}
                                            >
                                                <FaPenToSquare />
                                            </button>
                                            <button
                                                className="table-action-btn"
                                                title="Hapus kelurahan"
                                                style={{ color: "var(--c-danger, #ef4444)", borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)" }}
                                                onClick={() => setDeleteKelTarget(kel)}
                                            >
                                                <FaTrashCan />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {kelTotalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px 0" }}>
                    <span style={{ fontSize: "12px", color: "var(--c-text-muted)" }}>
                        {(kelPage - 1) * KEL_LIMIT + 1}–{Math.min(kelPage * KEL_LIMIT, kelTotalItems)} dari {kelTotalItems} kelurahan
                    </span>
                    <Pagination
                        currentPage={kelPage}
                        totalPages={kelTotalPages}
                        onPageChange={setKelPage}
                    />
                </div>
            )}
            <br /><br /><br /><br />

            {/* ══ MODALS ══════════════════════════════════════════ */}
            <KecamatanFormModal
                isOpen={kecModalOpen}
                onClose={() => { setKecModalOpen(false); setEditKec(null); }}
                onSubmit={handleKecSubmit}
                initialData={editKec}
            />

            <KelurahanFormModal
                isOpen={kelModalOpen}
                onClose={() => { setKelModalOpen(false); setEditKel(null); }}
                onSubmit={handleKelSubmit}
                initialData={editKel}
                kecamatans={kecamatans}
            />

            <PopupConfirmation
                isOpen={!!deleteKecTarget}
                type="danger"
                title="Hapus Kecamatan?"
                message={`Kecamatan "${deleteKecTarget?.kecamatan || ""}" akan dihapus beserta seluruh kelurahan di dalamnya. Tindakan ini tidak dapat dibatalkan.`}
                confirmText={isDeletingKec ? "Menghapus..." : "Ya, Hapus"}
                cancelText="Batal"
                onConfirm={handleKecDelete}
                onCancel={() => setDeleteKecTarget(null)}
            />

            <PopupConfirmation
                isOpen={!!deleteKelTarget}
                type="danger"
                title="Hapus Kelurahan?"
                message={`Kelurahan "${deleteKelTarget?.kelurahan || ""}" akan dihapus. Tindakan ini tidak dapat dibatalkan.`}
                confirmText={isDeletingKel ? "Menghapus..." : "Ya, Hapus"}
                cancelText="Batal"
                onConfirm={handleKelDelete}
                onCancel={() => setDeleteKelTarget(null)}
            />

            {popupNotif && (
                <PopupNotifikasi
                    message={popupNotif.message}
                    type={popupNotif.type}
                    onClose={() => setPopupNotif(null)}
                />
            )}
        </section>
    );
}
