import { useState, useEffect, useCallback } from "react";
import {
    FaGift,
    FaPlus,
    FaGear,
    FaMoneyBillWave,
    FaBoxOpen,
    FaPenToSquare,
    FaTrashCan,
} from "react-icons/fa6";
import Button from "../../components/button";
import RewardModal from "../../modals/RewardModal";
import type { RewardFormData } from "../../modals/RewardModal";
import KategoriFormModal from "../../modals/KategoriFormModal";
import PopupConfirmation from "../../layouts/popup-confirmation";
import PopupNotifikasi from "../../layouts/popup-notifikasi";
import { RewardService } from "../../services/reward.service";
import { KatalogService } from "../../services/katalog.service";
import type { Reward } from "../../types/reward.type";
import type { KategoriSampah } from "../../types/katalog.type";
import "../../styles/manajemen-reward.css";
import "../../styles/table.css";

function rewardVariant(nama: string): "uang" | "sembako" | "default" {
    const lower = nama.toLowerCase();
    if (lower.includes("uang") || lower.includes("tunai") || lower.includes("rupiah")) return "uang";
    if (lower.includes("sembako") || lower.includes("bahan") || lower.includes("pangan")) return "sembako";
    return "default";
}

function RewardIcon({ nama }: { nama: string }) {
    const lower = nama.toLowerCase();
    if (lower.includes("uang") || lower.includes("tunai") || lower.includes("rupiah")) return <FaMoneyBillWave />;
    if (lower.includes("sembako") || lower.includes("bahan") || lower.includes("pangan")) return <FaBoxOpen />;
    return <FaGift />;
}

const DIVIDER = <div style={{ height: "1px", background: "var(--c-border-soft)", margin: "32px 0" }} />;

export default function KonfigurasiPage() {
    /* ── Reward ─────────────────────────────────────────────── */
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [isLoadingReward, setIsLoadingReward] = useState(true);
    const [rewardError, setRewardError] = useState<string | null>(null);
    const [rewardModalOpen, setRewardModalOpen] = useState(false);
    const [editReward, setEditReward] = useState<RewardFormData | null>(null);

    const hasUang = rewards.some(r => rewardVariant(r.NamaReward) === "uang");
    const hasSembako = rewards.some(r => rewardVariant(r.NamaReward) === "sembako");
    const allRewardsPresent = hasUang && hasSembako;

    const fetchRewards = useCallback(async () => {
        setIsLoadingReward(true);
        setRewardError(null);
        try {
            const res = await RewardService.getRewards();
            setRewards(Array.isArray(res.data) ? res.data : []);
        } catch {
            setRewardError("Gagal mengambil data reward. Pastikan server backend aktif.");
        } finally {
            setIsLoadingReward(false);
        }
    }, []);

    const handleRewardSubmit = async (data: RewardFormData) => {
        const payload = {
            nama_reward: data.nama_reward.trim(),
            satuan: data.satuan.trim(),
            deskripsi: data.deskripsi.trim() || null,
        };
        if (data.reward_id) {
            await RewardService.updateReward(data.reward_id, payload);
            showNotif("Reward berhasil diperbarui!", "success");
        } else {
            await RewardService.addReward(payload);
            showNotif("Reward baru berhasil ditambahkan!", "success");
        }
        setRewardModalOpen(false);
        setEditReward(null);
        fetchRewards();
    };

    /* ── Kategori Sampah ────────────────────────────────────── */
    const [kategoris, setKategoris] = useState<KategoriSampah[]>([]);
    const [isLoadingKategori, setIsLoadingKategori] = useState(true);
    const [kategoriModalOpen, setKategoriModalOpen] = useState(false);
    const [editKategori, setEditKategori] = useState<KategoriSampah | null>(null);
    const [deleteKategoriTarget, setDeleteKategoriTarget] = useState<KategoriSampah | null>(null);
    const [isDeletingKategori, setIsDeletingKategori] = useState(false);

    const fetchKategoris = useCallback(async () => {
        setIsLoadingKategori(true);
        try {
            const res = await KatalogService.getKategori();
            setKategoris(Array.isArray(res.data) ? res.data : []);
        } catch {
            showNotif("Gagal memuat data kategori sampah.", "error");
        } finally {
            setIsLoadingKategori(false);
        }
    }, []);

    const handleKategoriSubmit = async (nama: string) => {
        if (editKategori) {
            await KatalogService.updateKategori(editKategori.KategoriID, nama);
            showNotif("Kategori berhasil diperbarui.", "success");
        } else {
            await KatalogService.addKategori(nama);
            showNotif("Kategori berhasil ditambahkan.", "success");
        }
        setKategoriModalOpen(false);
        setEditKategori(null);
        fetchKategoris();
    };

    const handleKategoriDelete = async () => {
        if (!deleteKategoriTarget) return;
        setIsDeletingKategori(true);
        try {
            await KatalogService.deleteKategori(deleteKategoriTarget.KategoriID);
            showNotif("Kategori berhasil dihapus.", "success");
            setDeleteKategoriTarget(null);
            fetchKategoris();
        } catch (err: any) {
            showNotif(err?.response?.data?.error || "Gagal menghapus kategori.", "error");
        } finally {
            setIsDeletingKategori(false);
        }
    };

    /* ── Shared notif ───────────────────────────────────────── */
    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const showNotif = (message: string, type: "success" | "error") => setPopupNotif({ message, type });

    /* ── Init ───────────────────────────────────────────────── */
    useEffect(() => {
        fetchRewards();
        fetchKategoris();
    }, [fetchRewards, fetchKategoris]);

    /* ── Render ─────────────────────────────────────────────── */
    return (
        <section className="mr-section">

            {/* ══ REWARD ══════════════════════════════════════════ */}
            <div className="mr-header">
                <div className="mr-header-left">
                    <h2 className="mr-header-title">Konfigurasi</h2>
                    <p className="mr-header-desc">
                        Kelola jenis-jenis reward yang tersedia. Sistem reward saat ini mendukung uang tunai dan sembako.
                    </p>
                </div>
                {!allRewardsPresent && (
                    <Button
                        color="neon"
                        variant="solid"
                        isRounded
                        icon={<FaPlus />}
                        onClick={() => { setEditReward(null); setRewardModalOpen(true); }}
                    >
                        Tambah Reward
                    </Button>
                )}
            </div>

            {rewardError && <div className="mr-error-banner">{rewardError}</div>}

            <div className="mr-cards-row">
                {isLoadingReward ? (
                    <><div className="mr-card-skeleton" /><div className="mr-card-skeleton" /></>
                ) : rewards.length === 0 && !rewardError ? (
                    <div className="mr-empty">
                        <div className="mr-empty-icon"><FaGift /></div>
                        <h3>Belum Ada Reward</h3>
                        <p>Tambahkan jenis reward pertama untuk memulai sistem konversi poin nasabah.</p>
                        {/* <Button
                            color="neon"
                            isRounded
                            icon={<FaPlus />}
                            onClick={() => { setEditReward(null); setRewardModalOpen(true); }}
                            style={{ marginTop: "8px" }}
                        >
                            Tambah Reward Pertama
                        </Button> */}
                    </div>
                ) : (
                    rewards.map(reward => {
                        const variant = rewardVariant(reward.NamaReward);
                        return (
                            <div key={reward.RewardID} className={`mr-card mr-card--${variant}`}>
                                <div className={`mr-card-icon mr-card-icon--${variant}`}>
                                    <RewardIcon nama={reward.NamaReward} />
                                </div>
                                <div className="mr-card-body">
                                    <div className="mr-card-header">
                                        <h3 className="mr-card-name">{reward.NamaReward}</h3>
                                        <button
                                            type="button"
                                            className="mr-card-action-btn"
                                            title="Edit reward"
                                            onClick={() => {
                                                setEditReward({
                                                    reward_id: reward.RewardID,
                                                    nama_reward: reward.NamaReward,
                                                    satuan: reward.Satuan,
                                                    deskripsi: reward.Deskripsi || "",
                                                });
                                                setRewardModalOpen(true);
                                            }}
                                        >
                                            <FaGear />
                                        </button>
                                    </div>
                                    <span className="mr-card-satuan">Satuan: {reward.Satuan}</span>
                                    <p style={{ fontSize: "13px", color: "var(--c-text-muted)", marginTop: "4px", lineHeight: 1.4 }}>
                                        {reward.Deskripsi || "Tidak ada deskripsi"}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {DIVIDER}

            {/* ══ KATEGORI SAMPAH ══════════════════════════════════ */}
            <div className="mr-header" style={{ paddingTop: 0 }}>
                <div className="mr-header-left">
                    <h2 className="mr-header-title">Kategori Sampah</h2>
                    <p className="mr-header-desc">Kelola kategori sampah yang tersedia sebagai referensi pada katalog bank sampah.</p>
                </div>
                <Button
                    color="secondary"
                    variant="solid"
                    isRounded
                    icon={<FaPlus />}
                    onClick={() => { setEditKategori(null); setKategoriModalOpen(true); }}
                >
                    Tambah Kategori
                </Button>
            </div>

            <div className="table-wrapper">
                <table className="table">
                    <thead>
                        <tr>
                            <th style={{ width: "56px" }}>No</th>
                            <th style={{ width: "80px" }}>ID</th>
                            <th>Nama Kategori</th>
                            <th style={{ width: "100px", textAlign: "center" }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingKategori ? (
                            <tr><td colSpan={4} className="table-empty">Memuat data...</td></tr>
                        ) : kategoris.length === 0 ? (
                            <tr><td colSpan={4} className="table-empty">Belum ada data kategori sampah.</td></tr>
                        ) : (
                            kategoris.map((kat, idx) => (
                                <tr key={kat.KategoriID}>
                                    <td style={{ color: "var(--c-text-muted)", fontSize: "12px" }}>{idx + 1}</td>
                                    <td className="table-id" style={{ fontWeight: 600 }}>{kat.KategoriID}</td>
                                    <td>{kat.Kategori}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                            <button
                                                className="table-action-btn"
                                                title="Edit kategori"
                                                onClick={() => { setEditKategori(kat); setKategoriModalOpen(true); }}
                                            >
                                                <FaPenToSquare />
                                            </button>
                                            <button
                                                className="table-action-btn"
                                                title="Hapus kategori"
                                                style={{ color: "var(--c-danger, #ef4444)", borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)" }}
                                                onClick={() => setDeleteKategoriTarget(kat)}
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

            {/* ══ MODALS ══════════════════════════════════════════ */}
            <KategoriFormModal
                isOpen={kategoriModalOpen}
                onClose={() => { setKategoriModalOpen(false); setEditKategori(null); }}
                onSubmit={handleKategoriSubmit}
                initialData={editKategori}
            />

            <RewardModal
                isOpen={rewardModalOpen}
                onClose={() => { setRewardModalOpen(false); setEditReward(null); }}
                onSubmit={handleRewardSubmit}
                initialData={editReward}
                existingNames={rewards.map(r => r.NamaReward)}
                existingSatuans={rewards.map(r => r.Satuan)}
            />

            <PopupConfirmation
                isOpen={!!deleteKategoriTarget}
                type="danger"
                title="Hapus Kategori?"
                message={`Kategori "${deleteKategoriTarget?.Kategori || ""}" akan dihapus. Kategori yang masih digunakan oleh katalog sampah tidak dapat dihapus.`}
                confirmText={isDeletingKategori ? "Menghapus..." : "Ya, Hapus"}
                cancelText="Batal"
                onConfirm={handleKategoriDelete}
                onCancel={() => setDeleteKategoriTarget(null)}
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
