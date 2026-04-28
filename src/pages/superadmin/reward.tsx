import { useState, useEffect, useCallback } from "react";
import {
    FaGift,
    FaPlus,
    FaPenToSquare,
    FaTrashCan,
    FaClock,
    FaMoneyBillWave,
    FaCoins,
    FaTableList,
} from "react-icons/fa6";
import Button from "../../components/button";
import RewardModal from "../../modals/RewardModal";
import type { RewardFormData } from "../../modals/RewardModal";
import PopupConfirmation from "../../layouts/popup-confirmation";
import PopupNotifikasi from "../../layouts/popup-notifikasi";
import { RewardService } from "../../services/reward.service";
import type { Reward } from "../../types/reward.type";
import "../../styles/layout.css";
import "../../styles/reward.css";

/** Pick card variant class based on reward name */
function getRewardVariant(nama: string): string {
    const lower = nama.toLowerCase();
    if (lower.includes("uang") || lower.includes("tunai") || lower.includes("rupiah")) return "uang";
    if (lower.includes("emas") || lower.includes("gold")) return "emas";
    return "default";
}

/** Pick icon component based on reward name */
function RewardIcon({ nama }: { nama: string }) {
    const lower = nama.toLowerCase();
    if (lower.includes("uang") || lower.includes("tunai") || lower.includes("rupiah"))
        return <FaMoneyBillWave />;
    if (lower.includes("emas") || lower.includes("gold"))
        return <FaCoins />;
    return <FaGift />;
}

/** Format ISO date to Indonesian locale */
function formatDate(iso: string): string {
    try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "-";
        return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    } catch {
        return "-";
    }
}

export default function RewardPage() {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editData, setEditData] = useState<RewardFormData | null>(null);

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<Reward | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Toast notification
    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);

    /* ── Fetch rewards ── */
    const fetchRewards = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await RewardService.getRewards();
            setRewards(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            console.error("Gagal mengambil data reward:", err);
            setError("Gagal mengambil data reward. Pastikan server backend aktif.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRewards();
    }, [fetchRewards]);

    /* ── Add / Edit submit (called from modal) ── */
    const handleSubmit = async (data: RewardFormData) => {
        const payload = {
            nama_reward: data.nama_reward.trim(),
            satuan: data.satuan.trim(),
            deskripsi: data.deskripsi.trim() || null,
        };

        if (data.reward_id) {
            await RewardService.updateReward(data.reward_id, payload);
            setPopupNotif({ message: "Reward berhasil diperbarui!", type: "success" });
        } else {
            await RewardService.addReward(payload);
            setPopupNotif({ message: "Reward baru berhasil ditambahkan!", type: "success" });
        }

        setModalOpen(false);
        setEditData(null);
        fetchRewards();
    };

    /* ── Delete ── */
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await RewardService.deleteReward(deleteTarget.RewardID);
            setDeleteTarget(null);
            setPopupNotif({ message: "Reward berhasil dihapus.", type: "success" });
            fetchRewards();
        } catch (err: any) {
            console.error("Gagal menghapus reward:", err);
            setPopupNotif({ message: "Gagal menghapus reward.", type: "error" });
        } finally {
            setIsDeleting(false);
        }
    };

    /* ── Open edit ── */
    const openEdit = (reward: Reward) => {
        setEditData({
            reward_id: reward.RewardID,
            nama_reward: reward.NamaReward,
            satuan: reward.Satuan,
            deskripsi: reward.Deskripsi || "",
        });
        setModalOpen(true);
    };

    /* ── Open add ── */
    const openAdd = () => {
        setEditData(null);
        setModalOpen(true);
    };

    return (
        <>
            {/* ── Hero Header (same layout as nasabah-hero) ── */}
            <div className="reward-hero">
                <div className="reward-hero-left">
                    <h1 className="reward-hero-title">Manajemen Reward</h1>
                    <p className="reward-hero-desc">
                        Kelola jenis-jenis reward yang tersedia untuk konversi poin nasabah.
                        Setiap reward memiliki satuan yang menentukan nilai tukar poin.
                    </p>
                </div>
                <div className="reward-hero-right">
                    <Button
                        color="neon"
                        variant="solid"
                        isRounded
                        icon={<FaPlus />}
                        onClick={openAdd}
                    >
                        Tambah Reward
                    </Button>
                </div>
            </div>

            {/* ── Error Banner ── */}
            {error && (
                <div className="reward-error-banner">{error}</div>
            )}

            {/* ── Master Reward Cards Section ── */}
            <div className="reward-section">
                <div className="reward-section-header">
                    <div className="reward-section-icon">
                        <FaGift />
                    </div>
                    <div>
                        <h2>Data Master Reward</h2>
                        <p>Jenis reward yang bisa digunakan di semua bank sampah</p>
                    </div>
                    {!isLoading && !error && (
                        <span className="reward-section-count">{rewards.length} reward</span>
                    )}
                </div>

                {isLoading ? (
                    <div className="reward-cards-loading">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="reward-card-skeleton" />
                        ))}
                    </div>
                ) : rewards.length === 0 && !error ? (
                    <div className="reward-empty">
                        <div className="reward-empty-icon"><FaGift /></div>
                        <h3>Belum Ada Reward</h3>
                        <p>Tambahkan jenis reward pertama untuk memulai sistem konversi poin nasabah.</p>
                        <Button color="primary" isRounded icon={<FaPlus />} onClick={openAdd}>
                            Tambah Reward Pertama
                        </Button>
                    </div>
                ) : (
                    <div className="reward-cards-grid">
                        {rewards.map(reward => {
                            const variant = getRewardVariant(reward.NamaReward);
                            return (
                                <div key={reward.RewardID} className={`reward-card reward-card--${variant}`}>
                                    <div className="reward-card-top">
                                        <div className={`reward-card-icon reward-card-icon--${variant}`}>
                                            <RewardIcon nama={reward.NamaReward} />
                                        </div>
                                        <div className="reward-card-actions">
                                            <button
                                                className="reward-card-action-btn"
                                                title="Edit reward"
                                                onClick={() => openEdit(reward)}
                                            >
                                                <FaPenToSquare />
                                            </button>
                                            <button
                                                className="reward-card-action-btn reward-card-action-btn--danger"
                                                title="Hapus reward"
                                                onClick={() => setDeleteTarget(reward)}
                                            >
                                                <FaTrashCan />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="reward-card-body">
                                        <h3>{reward.NamaReward}</h3>
                                        <div className="reward-card-satuan">
                                            Satuan: {reward.Satuan}
                                        </div>
                                        <p className={`reward-card-desc ${!reward.Deskripsi ? "reward-card-desc--empty" : ""}`}>
                                            {reward.Deskripsi || "Tidak ada deskripsi"}
                                        </p>
                                    </div>

                                    <div className="reward-card-footer">
                                        <FaClock />
                                        <span>Diperbarui {formatDate(reward.UpdatedAt)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Divider ── */}
            <div className="reward-divider" />

            {/* ── Table Placeholder (Nilai Reward per Bank) ── */}
            <div className="reward-table-section">
                <div className="reward-table-header">
                    <div className="reward-table-icon">
                        <FaTableList />
                    </div>
                    <div>
                        <h2>Nilai Reward per Bank Sampah</h2>
                        <p>Tabel konversi poin di setiap bank sampah</p>
                    </div>
                </div>
                <div className="reward-table-placeholder">
                    <div className="reward-table-placeholder-icon"><FaTableList /></div>
                    <h3>Segera Hadir</h3>
                    <p>
                        Tabel nilai konversi reward di setiap bank sampah akan ditampilkan di sini.
                        Data ini menunjukkan berapa poin yang diperlukan untuk menukarkan setiap jenis reward.
                    </p>
                </div>
            </div>

            {/* ── Reward Modal ── */}
            <RewardModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditData(null); }}
                onSubmit={handleSubmit}
                initialData={editData}
            />

            {/* ── Delete Confirmation ── */}
            <PopupConfirmation
                isOpen={!!deleteTarget}
                type="danger"
                title="Hapus Reward?"
                message={`Apakah Anda yakin ingin menghapus reward "${deleteTarget?.NamaReward || ""}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmText={isDeleting ? "Menghapus..." : "Ya, Hapus"}
                cancelText="Batal"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />

            {/* ── Toast Notification ── */}
            {popupNotif && (
                <PopupNotifikasi
                    message={popupNotif.message}
                    type={popupNotif.type}
                    onClose={() => setPopupNotif(null)}
                />
            )}
        </>
    );
}
