import { useCallback, useEffect, useState} from "react";
import { formatTanggalJam } from "../utils/date.utils";
import { createPortal } from "react-dom";
import {
    FaGift,
    FaMoneyBillWave,
    FaGear,
    FaLock,
    FaBuilding,
} from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import { RewardService } from "../services/reward.service";
import type { NilaiRewardBank, Reward, DetailNilaiRewardBank } from "../types/reward.type";
import CloseButton from "../components/close-button";
import NilaiRewardFormModal from "../modals/NilaiRewardFormModal";
import type { NilaiRewardFormData } from "../modals/NilaiRewardFormModal";
import PopupConfirmation from "../layouts/popup-confirmation";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import "../styles/manajemen-reward.css";

function rewardVariant(nama: string): "uang" | "default" {
    const lower = (nama || "").toLowerCase();
    if (lower.includes("uang") || lower.includes("tunai") || lower.includes("rupiah")) return "uang";
    return "default";
}

function rewardIcon(nama: string) {
    if (rewardVariant(nama) === "uang") return <FaMoneyBillWave />;
    return <FaGift />;
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
    const [isEditMode, setIsEditMode] = useState(false);
    const [initialData, setInitialData] = useState<NilaiRewardFormData | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<NilaiRewardBank | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [popup, setPopup] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // Detail state
    const [detailTarget, setDetailTarget] = useState<NilaiRewardBank | null>(null);
    const [detailData, setDetailData] = useState<DetailNilaiRewardBank | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

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
        fetchMasterRewards();
        fetchNilaiRewards();
    }, [fetchMasterRewards, fetchNilaiRewards]);

    /* ── Flow handlers ────────────────────────────────────── */
    const handleCloseAll = () => {
        setFormOpen(false);
        setPickedReward(null);
        setIsEditMode(false);
        setInitialData(null);
    };

    const openDetail = async (nr: NilaiRewardBank) => {
        setDetailTarget(nr);
        setDetailData(null);
        setIsDetailLoading(true);
        try {
            const res = await RewardService.getDetailNilaiReward(nr.NilaiRewardID);
            setDetailData(res.data);
        } catch (err: any) {
            setPopup({ message: err?.response?.data?.error || "Gagal memuat detail reward.", type: "error" });
            setDetailTarget(null);
        } finally {
            setIsDetailLoading(false);
        }
    };

    const openEdit = (masterReward: Reward) => {
        if (readOnly) return;
        setPickedReward(masterReward);

        const configs = nilaiRewards.filter(nr => nr.RewardID === masterReward.RewardID);
        if (configs.length > 0) {
            setIsEditMode(true);
            setInitialData({
                persentase: configs.map(c => ({
                    level_user: c.LevelUser,
                    persen_bagi_hasil: c.PersenBagiHasil
                }))
            });
        } else {
            setIsEditMode(false);
            setInitialData(null);
        }
        setFormOpen(true);
    };

    const handleSubmit = async (data: NilaiRewardFormData) => {
        if (!pickedReward) return;

        if (isEditMode) {
            await RewardService.updateNilaiReward(bankId, pickedReward.RewardID, {
                persentase: data.persentase,
                updated_by: identityId || undefined,
            });
            setPopup({ message: "Konfigurasi reward berhasil diperbarui.", type: "success" });
        } else {
            await RewardService.addNilaiReward(bankId, {
                reward_id: pickedReward.RewardID,
                persentase: data.persentase,
                created_by: identityId || undefined,
            });
            setPopup({ message: "Konfigurasi reward berhasil ditambahkan.", type: "success" });
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

                        {rewards.map(r => {
                            const nama = r.NamaReward;
                            const satuan = r.Satuan || "-";
                            const variant = rewardVariant(nama);
                            
                            const configs = nilaiRewards.filter(nr => nr.RewardID === r.RewardID);
                            const isConfigured = configs.length > 0;
                            const mainConfig = isConfigured ? configs[0] : null;

                            return (
                                <div
                                    key={r.RewardID}
                                    className={`mr-card mr-card--${variant}`}
                                    onClick={() => {
                                        if (mainConfig) openDetail(mainConfig);
                                    }}
                                    style={{ cursor: mainConfig ? "pointer" : "default" }}
                                >
                                    <div className={`mr-card-icon mr-card-icon--${variant}`}>
                                        {rewardIcon(nama)}
                                    </div>

                                    <div className="mr-card-body">
                                        <div className="mr-card-header">
                                            <h3 className="mr-card-name">{nama}</h3>
                                            {!readOnly && (
                                                <button
                                                    type="button"
                                                    className="mr-card-action-btn"
                                                    title={isConfigured ? "Edit konfigurasi reward" : "Atur konfigurasi reward"}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEdit(r);
                                                    }}
                                                >
                                                    <FaGear />
                                                </button>
                                            )}
                                        </div>
                                        <span className="mr-card-satuan">Satuan: {satuan}</span>

                                        {isConfigured ? (
                                            <p className="mr-card-desc" style={{ fontSize: '13px', color: 'var(--k-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                                                {r.Deskripsi}
                                            </p>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#dc2626', background: '#fee2e2', padding: '2px 8px', borderRadius: '12px', width: 'fit-content' }}>
                                                    Belum dikonfigurasi
                                                </span>
                                                <p className="mr-card-desc" style={{ fontSize: '13px', color: 'var(--k-muted)', lineHeight: 1.4 }}>
                                                    {r.Deskripsi}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {/* ── Form Modal ── */}
            <NilaiRewardFormModal
                isOpen={formOpen}
                reward={pickedReward}
                isEdit={isEditMode}
                initialData={initialData}
                onClose={handleCloseAll}
                onSubmit={handleSubmit}
            />

            {/* ── Detail Modal ── */}
            {detailTarget && typeof document !== "undefined" && createPortal(
                <div className="mr-modal-overlay" onClick={() => setDetailTarget(null)}>
                    <div className="mr-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="mr-modal-header">
                            <div>
                                <h3 className="mr-modal-title">Detail Reward: {detailTarget.Reward?.NamaReward || "Reward"}</h3>
                                <p className="mr-modal-sub">Informasi konfigurasi dan riwayat perubahan nilai reward.</p>
                            </div>
                            <CloseButton onClick={() => setDetailTarget(null)} />
                        </div>
                        
                        <div className="mr-modal-body" style={{ padding: '24px', overflowY: 'auto', maxHeight: '70vh' }}>
                            {isDetailLoading || !detailData ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--k-muted)' }}>Memuat detail...</div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px' }}>
                                    {/* Kolom Kiri: Info */}
                                    <div>
                                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--k-dark)', marginBottom: '16px' }}>Konfigurasi Saat Ini</h4>
                                        <div className="kd-stat-card" style={{ padding: '16px', gap: '16px', display: 'flex', flexDirection: 'column', background: '#f8faf9', borderRadius: '12px', border: '1px solid var(--k-border)' }}>
                                            {/* Bagi Hasil Section */}
                                            <div>
                                                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--k-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bagi Hasil</span>
                                                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {detailData.persentase.map((p, idx) => (
                                                        <div key={idx} className="kd-stat-row" style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: 'var(--k-muted)', textTransform: 'capitalize' }}>{p.level_user}</span>
                                                            <span style={{ fontWeight: 600, color: 'var(--k-dark)' }}>{p.persen_bagi_hasil}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Kolom Kanan: History */}
                                    <div>
                                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--k-dark)', marginBottom: '16px' }}>Riwayat Perubahan</h4>
                                        <div className="kd-timeline-wrap">
                                            {detailData.history.length === 0 ? (
                                                <div className="kd-timeline-empty" style={{ fontSize: '12.5px', padding: '32px 16px', color: 'var(--k-muted)', textAlign: 'center', background: '#fcfdfc', borderRadius: '12px', border: '1px dashed var(--k-border)' }}>
                                                    Belum ada riwayat perubahan nilai untuk reward ini.
                                                </div>
                                            ) : (
                                                <div className="kd-timeline" style={{ gap: '16px' }}>
                                                    {detailData.history.map((rw, idx) => (
                                                        <div className="kd-timeline-item" key={idx}>
                                                            <div className="kd-timeline-dot" style={{ top: 4, width: '8px', height: '8px', left: '-23px' }}></div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#3b82f6', textTransform: 'uppercase' }}>{rw.level_user}</span>
                                                                <span className="kd-timeline-date" style={{ fontSize: '10.5px' }}>{formatTanggalJam(rw.changed_at)}</span>
                                                            </div>
                                                            <div className="kd-timeline-content" style={{ padding: '12px' }}>
                                                                <div className="kd-timeline-price" style={{ fontSize: '12.5px', color: 'var(--k-dark)' }}>
                                                                    Bagi Hasil: <span style={{ color: 'var(--k-muted)', textDecoration: 'line-through' }}>{rw.old_persen ?? 0}%</span> &rarr; <span style={{ fontWeight: 600 }}>{rw.new_persen}%</span>
                                                                </div>
                                                                <div className="kd-timeline-admin" style={{ fontSize: '10.5px', marginTop: '10px', color: 'var(--k-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <FaBuilding size={10} /> Oleh {rw.changed_by}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

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
