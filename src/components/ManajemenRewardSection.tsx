import { useCallback, useEffect, useMemo, useState } from "react";
import {
    FaGift,
    FaPlus,
    FaMoneyBillWave,
    FaCoins,
    FaPenToSquare,
    FaTrashCan,
    FaLock,
} from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import { RewardService } from "../services/reward.service";
import type { NilaiRewardBank, Reward } from "../types/reward.type";
import RewardPickerModal from "../modals/RewardPickerModal";
import NilaiRewardFormModal from "../modals/NilaiRewardFormModal";
import type { NilaiRewardFormData } from "../modals/NilaiRewardFormModal";
import PopupConfirmation from "../layouts/popup-confirmation";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import "../styles/manajemen-reward.css";

function rewardVariant(nama: string): "uang" | "emas" | "default" {
    const lower = (nama || "").toLowerCase();
    if (lower.includes("uang") || lower.includes("tunai") || lower.includes("rupiah")) return "uang";
    if (lower.includes("emas") || lower.includes("gold")) return "emas";
    return "default";
}

function rewardIcon(nama: string) {
    const v = rewardVariant(nama);
    if (v === "uang") return <FaMoneyBillWave />;
    if (v === "emas") return <FaCoins />;
    return <FaGift />;
}

function formatNumber(n: number): string {
    if (!isFinite(n)) return "-";
    return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n);
}

export default function ManajemenRewardSection() {
    const { user } = useAuth();
    const role = (user?.role || "").toLowerCase();
    const bankId = user?.bank_id || "";
    const identityId = user?.identity_id || "";

    const readOnly = role === "admin_bsu";

    const [nilaiRewards, setNilaiRewards] = useState<NilaiRewardBank[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMaster, setIsLoadingMaster] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [masterError, setMasterError] = useState<string | null>(null);

    // Flow state
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickedReward, setPickedReward] = useState<Reward | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<NilaiRewardBank | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<NilaiRewardBank | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [popup, setPopup] = useState<{ message: string; type: "success" | "error" } | null>(null);

    /* ── Fetchers ─────────────────────────────────────────── */
    const fetchNilaiRewards = useCallback(async () => {
        if (!bankId) {
            setError("Bank tidak teridentifikasi pada sesi Anda.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const res = await RewardService.getNilaiReward(bankId);
            setNilaiRewards(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            setError(err?.response?.data?.error || "Gagal memuat data nilai reward.");
        } finally {
            setIsLoading(false);
        }
    }, [bankId]);

    const fetchMasterRewards = useCallback(async () => {
        setIsLoadingMaster(true);
        setMasterError(null);
        try {
            const res = await RewardService.getRewards();
            setRewards(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            setMasterError(
                err?.response?.data?.error || "Gagal memuat daftar jenis reward.",
            );
        } finally {
            setIsLoadingMaster(false);
        }
    }, []);

    useEffect(() => {
        fetchNilaiRewards();
    }, [fetchNilaiRewards]);

    /* ── Flow handlers ────────────────────────────────────── */
    const openPicker = async () => {
        setPickerOpen(true);
        if (rewards.length === 0) fetchMasterRewards();
    };

    const handlePick = (reward: Reward) => {
        setPickedReward(reward);
        setEditTarget(null);
        setPickerOpen(false);
        setFormOpen(true);
    };

    const handleBackToPicker = () => {
        setFormOpen(false);
        setPickedReward(null);
        setPickerOpen(true);
    };

    const handleCloseAll = () => {
        setPickerOpen(false);
        setFormOpen(false);
        setPickedReward(null);
        setEditTarget(null);
    };

    const openEdit = (nr: NilaiRewardBank) => {
        if (readOnly) return;
        const rewardInfo: Reward = nr.Reward || {
            RewardID: nr.RewardID,
            NamaReward: `Reward #${nr.RewardID}`,
            Satuan: "-",
            CreatedAt: "",
            UpdatedAt: "",
        };
        setPickedReward(rewardInfo);
        setEditTarget(nr);
        setFormOpen(true);
    };

    const handleSubmit = async (data: NilaiRewardFormData) => {
        if (editTarget) {
            await RewardService.updateNilaiReward(editTarget.NilaiRewardID, {
                nilai_poin: data.nilai_poin,
                nilai_konversi: data.nilai_konversi,
                updated_by: identityId || undefined,
            });
            setPopup({ message: "Nilai reward berhasil diperbarui.", type: "success" });
        } else if (pickedReward) {
            await RewardService.addNilaiReward(bankId, {
                reward_id: pickedReward.RewardID,
                nilai_poin: data.nilai_poin,
                nilai_konversi: data.nilai_konversi,
                created_by: identityId || undefined,
            });
            setPopup({ message: "Reward berhasil ditambahkan.", type: "success" });
        }
        handleCloseAll();
        fetchNilaiRewards();
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await RewardService.deleteNilaiReward(deleteTarget.NilaiRewardID);
            setPopup({ message: "Reward berhasil dihapus.", type: "success" });
            setDeleteTarget(null);
            fetchNilaiRewards();
        } catch (err: any) {
            setPopup({
                message: err?.response?.data?.error || "Gagal menghapus reward.",
                type: "error",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const excludeIds = useMemo(
        () => nilaiRewards.map(nr => nr.RewardID),
        [nilaiRewards],
    );

    /* ── Render ───────────────────────────────────────────── */
    return (
        <section className="mr-section">
            {/* Header */}
            <div className="mr-header">
                <div className="mr-header-left">
                    <h2 className="mr-header-title">Manajemen Reward</h2>
                    <p className="mr-header-desc">
                        {readOnly
                            ? "Berikut nilai konversi reward yang telah ditetapkan oleh BSI induk. Nilai ini menjadi acuan penjualan di unit Anda."
                            : "Pilih jenis reward yang akan diterapkan pada penjualan ini dan tentukan nilai konversinya untuk nasabah bank sampah Anda."}
                    </p>
                </div>
                {readOnly && (
                    <div className="mr-readonly-badge" title="Nilai reward dikelola oleh BSI">
                        <FaLock /> Read-only
                    </div>
                )}
            </div>

            {error && <div className="mr-error-banner">{error}</div>}

            {/* Cards Row */}
            <div className="mr-cards-row">
                {isLoading ? (
                    <>
                        <div className="mr-card-skeleton" />
                        <div className="mr-card-skeleton" />
                    </>
                ) : (
                    <>
                        {nilaiRewards.length === 0 && readOnly && (
                            <div className="mr-empty">
                                <div className="mr-empty-icon"><FaGift /></div>
                                <h3>Belum ada nilai reward</h3>
                                <p>
                                    BSI belum menetapkan nilai konversi reward untuk bank sampah ini.
                                </p>
                            </div>
                        )}

                        {nilaiRewards.map(nr => {
                            const nama = nr.Reward?.NamaReward || `Reward #${nr.RewardID}`;
                            const satuan = nr.Reward?.Satuan || "-";
                            const variant = rewardVariant(nama);
                            return (
                                <div
                                    key={nr.NilaiRewardID}
                                    className={`mr-card mr-card--${variant}`}
                                >
                                    <div className="mr-card-top">
                                        <div className={`mr-card-icon mr-card-icon--${variant}`}>
                                            {rewardIcon(nama)}
                                        </div>
                                        {!readOnly && (
                                            <div className="mr-card-actions">
                                                <button
                                                    type="button"
                                                    className="mr-card-action-btn"
                                                    title="Edit nilai reward"
                                                    onClick={() => openEdit(nr)}
                                                >
                                                    <FaPenToSquare />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="mr-card-action-btn mr-card-action-btn--danger"
                                                    title="Hapus nilai reward"
                                                    onClick={() => setDeleteTarget(nr)}
                                                >
                                                    <FaTrashCan />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mr-card-body">
                                        <h3 className="mr-card-name">{nama}</h3>
                                        <span className="mr-card-satuan">Satuan: {satuan}</span>

                                        <div className="mr-card-conversion">
                                            <div className="mr-card-conversion-part">
                                                <span className="mr-card-conversion-num">
                                                    {formatNumber(nr.NilaiPoin)}
                                                </span>
                                                <span className="mr-card-conversion-unit">poin</span>
                                            </div>
                                            <span className="mr-card-conversion-sep">=</span>
                                            <div className="mr-card-conversion-part">
                                                <span className="mr-card-conversion-num">
                                                    {formatNumber(nr.NilaiKonversi)}
                                                </span>
                                                <span className="mr-card-conversion-unit">{satuan}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Plus Card — only for non-read-only roles */}
                        {!readOnly && (
                            <button
                                type="button"
                                className="mr-card mr-card--add"
                                onClick={openPicker}
                                aria-label="Tambah reward"
                            >
                                <div className="mr-card-add-icon">
                                    <FaPlus />
                                </div>
                                <div className="mr-card-add-label">Tambah Reward</div>
                                <div className="mr-card-add-hint">
                                    Pilih jenis reward & atur nilai konversinya
                                </div>
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* ── Picker Modal ── */}
            <RewardPickerModal
                isOpen={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onPick={handlePick}
                rewards={rewards}
                isLoading={isLoadingMaster}
                error={masterError}
                excludeIds={excludeIds}
            />

            {/* ── Form Modal ── */}
            <NilaiRewardFormModal
                isOpen={formOpen}
                reward={pickedReward}
                isEdit={!!editTarget}
                initialData={editTarget ? {
                    nilai_poin: editTarget.NilaiPoin,
                    nilai_konversi: editTarget.NilaiKonversi,
                } : null}
                onClose={handleCloseAll}
                onBack={editTarget ? undefined : handleBackToPicker}
                onSubmit={handleSubmit}
            />

            {/* ── Delete confirmation ── */}
            <PopupConfirmation
                isOpen={!!deleteTarget}
                type="danger"
                title="Hapus Nilai Reward?"
                message={`Nilai konversi untuk "${deleteTarget?.Reward?.NamaReward || "reward ini"}" akan dihapus beserta seluruh riwayatnya. Lanjutkan?`}
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
