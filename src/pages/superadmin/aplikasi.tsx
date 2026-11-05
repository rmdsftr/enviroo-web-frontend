import { useState, useEffect, useCallback } from "react";
import {
    FaPlus,
    FaPenToSquare,
    FaTrashCan,
    FaDownload,
    FaLink,
    FaCopy,
    FaMobileScreenButton,
} from "react-icons/fa6";
import Button from "../../components/button";
import AppReleaseFormModal from "../../modals/AppReleaseFormModal";
import type { AppReleaseFormData } from "../../modals/AppReleaseFormModal";
import PopupConfirmation from "../../layouts/popup-confirmation";
import PopupNotifikasi from "../../layouts/popup-notifikasi";
import { AppReleaseService, LINK_INSTALL_APK } from "../../services/app_release.service";
import type { AppRelease } from "../../types/app_release.type";
import { formatTanggal, formatTanggalPanjang } from "../../utils/date.utils";
import { formatUkuranFile } from "../../utils/number.utils";
import { getApiError } from "../../utils/error.utils";
import "../../styles/manajemen-reward.css";
import "../../styles/table.css";

const DIVIDER = <div style={{ height: "1px", background: "var(--c-border-soft)", margin: "32px 0" }} />;

function StatusBadge({ wajib }: { wajib: boolean }) {
    return (
        <span className={`table-badge ${wajib ? "table-badge--inactive" : "table-badge--active"}`}>
            <span className="table-badge-dot" />
            {wajib ? "Wajib" : "Opsional"}
        </span>
    );
}

export default function AplikasiPage() {
    const [rilis, setRilis] = useState<AppRelease[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<AppRelease | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AppRelease | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const showNotif = (message: string, type: "success" | "error") => setPopupNotif({ message, type });

    const fetchRilis = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const res = await AppReleaseService.getRilis();
            setRilis(Array.isArray(res.data) ? res.data : []);
        } catch {
            setLoadError("Gagal memuat data rilis aplikasi. Pastikan server backend aktif.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRilis();
    }, [fetchRilis]);

    // Backend mengurutkan rilis dari version_code terbesar.
    const terbaru = rilis[0] ?? null;
    const versionCodeTerakhir = terbaru?.version_code ?? 0;

    const handleSubmit = async (data: AppReleaseFormData, onProgress: (persen: number) => void) => {
        if (editTarget) {
            await AppReleaseService.updateRilis(editTarget.release_id, {
                changelog: data.changelog,
                wajib: data.wajib,
            });
            showNotif("Rilis berhasil diperbarui.", "success");
        } else {
            if (!data.apk) return;
            await AppReleaseService.uploadRilis(
                {
                    apk: data.apk,
                    version_code: data.version_code,
                    version_name: data.version_name,
                    changelog: data.changelog,
                    wajib: data.wajib,
                },
                onProgress,
            );
            showNotif(`Versi ${data.version_name} berhasil diunggah.`, "success");
        }
        setModalOpen(false);
        setEditTarget(null);
        fetchRilis();
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await AppReleaseService.deleteRilis(deleteTarget.release_id);
            showNotif("Rilis berhasil dihapus.", "success");
            setDeleteTarget(null);
            fetchRilis();
        } catch (err) {
            showNotif(getApiError(err, "Gagal menghapus rilis."), "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const salinLinkInstall = async () => {
        try {
            await navigator.clipboard.writeText(LINK_INSTALL_APK);
            showNotif("Link install berhasil disalin.", "success");
        } catch {
            showNotif("Gagal menyalin link. Salin manual dari kartu Link Install.", "error");
        }
    };

    return (
        <section className="mr-section">

            <div className="mr-header">
                <div className="mr-header-left">
                    <h2 className="mr-header-title">Rilis Aplikasi</h2>
                    <p className="mr-header-desc">
                        Kelola versi APK Enviroo yang ditawarkan ke pengguna lewat pembaruan di dalam aplikasi.
                    </p>
                </div>
                <Button
                    color="secondary"
                    variant="solid"
                    isRounded
                    icon={<FaPlus />}
                    onClick={() => { setEditTarget(null); setModalOpen(true); }}
                >
                    Upload Versi Baru
                </Button>
            </div>

            {loadError && <div className="mr-error-banner">{loadError}</div>}

            <div className="mr-cards-row">
                {isLoading ? (
                    <><div className="mr-card-skeleton" /><div className="mr-card-skeleton" /></>
                ) : !terbaru ? (
                    !loadError && (
                        <div className="mr-empty">
                            <div className="mr-empty-icon"><FaMobileScreenButton /></div>
                            <h3>Belum Ada Rilis</h3>
                            <p>Upload APK pertama supaya pengguna bisa memperbarui aplikasi langsung dari dalam aplikasi.</p>
                        </div>
                    )
                ) : (
                    <>
                        <div className="mr-card">
                            <div className="mr-card-icon mr-card-icon--uang">
                                <FaMobileScreenButton />
                            </div>
                            <div className="mr-card-body">
                                <div className="mr-card-header">
                                    <h3 className="mr-card-name">Versi {terbaru.version_name}</h3>
                                    <div className="mr-card-actions">
                                        <a
                                            className="mr-card-action-btn"
                                            href={terbaru.apk_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Unduh APK"
                                        >
                                            <FaDownload />
                                        </a>
                                        <button
                                            type="button"
                                            className="mr-card-action-btn"
                                            title="Edit rilis"
                                            onClick={() => { setEditTarget(terbaru); setModalOpen(true); }}
                                        >
                                            <FaPenToSquare />
                                        </button>
                                    </div>
                                </div>
                                <span className="mr-card-satuan">
                                    Kode {terbaru.version_code} · {formatUkuranFile(terbaru.file_size)}
                                </span>
                                <div><StatusBadge wajib={terbaru.is_mandatory} /></div>
                                <p style={{ fontSize: "13px", color: "var(--c-text-muted)", marginTop: "4px", lineHeight: 1.4 }}>
                                    Dirilis {formatTanggalPanjang(terbaru.created_at)}
                                </p>
                            </div>
                        </div>

                        <div className="mr-card">
                            <div className="mr-card-icon mr-card-icon--default">
                                <FaLink />
                            </div>
                            <div className="mr-card-body">
                                <div className="mr-card-header">
                                    <h3 className="mr-card-name">Link Install</h3>
                                    <div className="mr-card-actions">
                                        <button
                                            type="button"
                                            className="mr-card-action-btn"
                                            title="Salin link install"
                                            onClick={salinLinkInstall}
                                        >
                                            <FaCopy />
                                        </button>
                                    </div>
                                </div>
                                <span className="mr-card-satuan" style={{ wordBreak: "break-all" }}>
                                    {LINK_INSTALL_APK}
                                </span>
                                <p style={{ fontSize: "13px", color: "var(--c-text-muted)", marginTop: "4px", lineHeight: 1.4 }}>
                                    Bagikan ke pengguna baru. Link ini selalu mengarah ke APK versi terbaru.
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {DIVIDER}

            <div className="mr-header" style={{ paddingTop: 0 }}>
                <div className="mr-header-left">
                    <h2 className="mr-header-title">Riwayat Rilis</h2>
                    <p className="mr-header-desc">Semua versi APK yang pernah diunggah, dari yang terbaru.</p>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="table">
                    <thead>
                        <tr>
                            <th style={{ width: "56px" }}>No</th>
                            <th>Versi</th>
                            <th style={{ width: "80px" }}>Kode</th>
                            <th>Ukuran</th>
                            <th>Status</th>
                            <th>Tanggal Rilis</th>
                            <th style={{ width: "140px", textAlign: "center" }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={7} className="table-empty">Memuat data...</td></tr>
                        ) : rilis.length === 0 ? (
                            <tr><td colSpan={7} className="table-empty">Belum ada rilis aplikasi.</td></tr>
                        ) : (
                            rilis.map((r, idx) => (
                                <tr key={r.release_id}>
                                    <td style={{ color: "var(--c-text-muted)", fontSize: "12px" }}>{idx + 1}</td>
                                    <td style={{ fontWeight: 600 }}>{r.version_name}</td>
                                    <td className="table-id" style={{ fontWeight: 600 }}>{r.version_code}</td>
                                    <td style={{ color: "var(--c-text-muted)" }}>{formatUkuranFile(r.file_size)}</td>
                                    <td><StatusBadge wajib={r.is_mandatory} /></td>
                                    <td style={{ color: "var(--c-text-muted)" }}>{formatTanggal(r.created_at)}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                            <a
                                                className="table-action-btn"
                                                href={r.apk_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="Unduh APK"
                                            >
                                                <FaDownload />
                                            </a>
                                            <button
                                                className="table-action-btn"
                                                title="Edit rilis"
                                                onClick={() => { setEditTarget(r); setModalOpen(true); }}
                                            >
                                                <FaPenToSquare />
                                            </button>
                                            <button
                                                className="table-action-btn"
                                                title="Hapus rilis"
                                                style={{ color: "var(--c-danger, #ef4444)", borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)" }}
                                                onClick={() => setDeleteTarget(r)}
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
            <br /><br /><br /><br />

            <AppReleaseFormModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditTarget(null); }}
                onSubmit={handleSubmit}
                initialData={editTarget}
                versionCodeTerakhir={versionCodeTerakhir}
            />

            <PopupConfirmation
                isOpen={!!deleteTarget}
                type="danger"
                title="Hapus Rilis?"
                message={`Versi ${deleteTarget?.version_name || ""} (kode ${deleteTarget?.version_code ?? ""}) akan dihapus beserta file APK-nya. Pengguna yang belum update akan ditawari versi sebelumnya.`}
                confirmText={isDeleting ? "Menghapus..." : "Ya, Hapus"}
                cancelText="Batal"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
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
