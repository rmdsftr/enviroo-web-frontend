import { useCallback, useEffect, useState} from "react";
import { formatTanggalJam } from "../utils/date.utils";
import { createPortal } from "react-dom";
import {
    FaGift,
    FaGear,
    FaToggleOff,
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
import { formatPercent } from "../utils/number.utils";
import "../styles/manajemen-reward.css";

function rewardVariant(nama: string): "uang" | "default" {
    const lower = (nama || "").toLowerCase();
    if (lower.includes("uang") || lower.includes("tunai") || lower.includes("rupiah")) return "uang";
    return "default";
}

function saldoLabel(satuan: string): string {
    const lower = (satuan || "").toLowerCase();
    if (lower === "rp" || lower.includes("rupiah")) return "Saldo Rupiah";
    if (lower.includes("poin")) return "Saldo Poin";
    return `Saldo ${satuan}`;
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
    const [, setIsLoadingMaster] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [, setMasterError] = useState<string | null>(null);

    const [pickedReward, setPickedReward] = useState<Reward | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [initialData, setInitialData] = useState<NilaiRewardFormData | null>(null);
    const [deactivateTarget, setDeactivateTarget] = useState<NilaiRewardBank | null>(null);
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [popup, setPopup] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const [detailTarget, setDetailTarget] = useState<NilaiRewardBank | null>(null);
    const [detailData, setDetailData] = useState<DetailNilaiRewardBank | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

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
            const res = await RewardService.getDetailNilaiReward(nr.nilai_reward_id);
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

        const activeConfigs = nilaiRewards.filter(nr => nr.reward_id === masterReward.reward_id && nr.is_active);
        if (activeConfigs.length > 0) {
            setIsEditMode(true);
            setInitialData({
                persentase: activeConfigs.map(c => ({
                    level_user: c.level_user,
                    persen_bagi_hasil: c.persen_bagi_hasil
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
            await RewardService.updateNilaiReward(bankId, pickedReward.reward_id, {
                persentase: data.persentase,
                updated_by: identityId || undefined,
            });
            setPopup({ message: "Konfigurasi reward berhasil diperbarui.", type: "success" });
        } else {
            await RewardService.addNilaiReward(bankId, {
                reward_id: pickedReward.reward_id,
                persentase: data.persentase,
                created_by: identityId || undefined,
            });
            setPopup({ message: "Konfigurasi reward berhasil disimpan.", type: "success" });
        }
        handleCloseAll();
        fetchNilaiRewards();
    };

    const handleDeactivate = async () => {
        if (!deactivateTarget) return;
        setIsDeactivating(true);
        try {
            await RewardService.deleteNilaiReward(deactivateTarget.nilai_reward_id);
            setPopup({ message: "Konfigurasi reward berhasil dinonaktifkan.", type: "success" });
            setDeactivateTarget(null);
            fetchNilaiRewards();
        } catch (err: any) {
            setPopup({
                message: err?.response?.data?.error || "Gagal menonaktifkan konfigurasi reward.",
                type: "error",
            });
        } finally {
            setIsDeactivating(false);
        }
    };

    return (
        <section className="mr-section">
            <div className="mr-header">
                <div className="mr-header-left">
                    <h2 className="mr-header-title">Persentase Bagi Hasil</h2>
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
                            const nama = r.nama_reward;
                            const satuan = r.satuan || "-";
                            const variant = rewardVariant(nama);

                            const configs = nilaiRewards.filter(nr => nr.reward_id === r.reward_id);
                            const activeConfigs = configs.filter(c => c.is_active);
                            const isActive = activeConfigs.length > 0;
                            const isInactive = !isActive && configs.length > 0;
                            const mainConfig = activeConfigs[0] ?? configs[0] ?? null;
                            const nasabahPersen = activeConfigs.find(c => c.level_user === "nasabah")?.persen_bagi_hasil;

                            return (
                                <div
                                    key={r.reward_id}
                                    className={`mr-card mr-card--${variant}${isInactive ? " mr-card--inactive" : ""}`}
                                    onClick={() => {
                                        if (mainConfig) openDetail(mainConfig);
                                    }}
                                    style={{ cursor: mainConfig ? "pointer" : "default" }}
                                >
                                    {nasabahPersen != null && (
                                        <div className="mr-card-percent">{formatPercent(nasabahPersen)}</div>
                                    )}

                                    <div className="mr-card-body">
                                        <div className="mr-card-header">
                                            <h3 className="mr-card-name">{saldoLabel(satuan)}</h3>
                                            {!readOnly && (
                                                <div className="mr-card-actions">
                                                    <button
                                                        type="button"
                                                        className="mr-card-action-btn"
                                                        title={isActive ? "Edit konfigurasi reward" : isInactive ? "Aktifkan kembali konfigurasi reward" : "Atur konfigurasi reward"}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openEdit(r);
                                                        }}
                                                    >
                                                        <FaGear />
                                                    </button>
                                                    {isActive && (
                                                        <button
                                                            type="button"
                                                            className="mr-card-action-btn mr-card-action-btn--danger"
                                                            title="Nonaktifkan konfigurasi reward"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeactivateTarget(activeConfigs[0]);
                                                            }}
                                                        >
                                                            <FaToggleOff />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="mr-card-badges">
                                            <span className="mr-card-satuan">Insentif {nama}</span>
                                            {!isActive && (
                                                <span className={`mr-card-state-badge mr-card-state-badge--${isInactive ? "off" : "empty"}`}>
                                                    {isInactive ? "Nonaktif" : "Belum dikonfigurasi"}
                                                </span>
                                            )}
                                        </div>

                                        <p className="mr-card-desc" style={{ fontSize: '13px', color: 'var(--k-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                                            {r.deskripsi}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            <NilaiRewardFormModal
                isOpen={formOpen}
                reward={pickedReward}
                isEdit={isEditMode}
                initialData={initialData}
                onClose={handleCloseAll}
                onSubmit={handleSubmit}
            />

            {detailTarget && typeof document !== "undefined" && createPortal(
                <div className="mr-modal-overlay" onClick={() => setDetailTarget(null)}>
                    <div className="mr-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="mr-modal-header">
                            <div>
                                <h3 className="mr-modal-title">Detail Reward: {detailTarget.reward?.nama_reward || "Reward"}</h3>
                                <p className="mr-modal-sub">Informasi konfigurasi dan riwayat perubahan nilai reward.</p>
                            </div>
                            <CloseButton onClick={() => setDetailTarget(null)} />
                        </div>
                        
                        <div className="mr-modal-body" style={{ padding: '24px', overflowY: 'auto', maxHeight: '70vh' }}>
                            {isDetailLoading || !detailData ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--k-muted)' }}>Memuat detail...</div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px' }}>
                                    <div>
                                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--k-dark)', marginBottom: '16px' }}>Konfigurasi Saat Ini</h4>
                                        <div className="kd-stat-card" style={{ padding: '16px', gap: '16px', display: 'flex', flexDirection: 'column', background: '#f8faf9', borderRadius: '12px', border: '1px solid var(--k-border)' }}>
                                            <div>
                                                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--k-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bagi Hasil</span>
                                                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {detailData.persentase.map((p, idx) => (
                                                        <div key={idx} className="kd-stat-row" style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: 'var(--k-muted)', textTransform: 'capitalize' }}>{p.level_user === 'eksternal' ? 'Pengepul' : p.level_user}</span>
                                                            <span style={{ fontWeight: 600, color: 'var(--k-dark)' }}>{formatPercent(p.persen_bagi_hasil)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

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
                                                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '4px' }}>
                                                                <span className="kd-timeline-date" style={{ fontSize: '10.5px' }}>{formatTanggalJam(rw.changed_at)}</span>
                                                            </div>
                                                            <div className="kd-timeline-content" style={{ padding: '12px' }}>
                                                                <div className="kd-timeline-price" style={{ fontSize: '12.5px', color: 'var(--k-dark)' }}>
                                                                    Bagi Hasil: <span style={{ color: 'var(--k-muted)', textDecoration: 'line-through' }}>{formatPercent(rw.old_persen)}</span> &rarr; <span style={{ fontWeight: 600 }}>{formatPercent(rw.new_persen)}</span>
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

            <PopupConfirmation
                isOpen={!!deactivateTarget}
                type="warning"
                title="Nonaktifkan Konfigurasi Reward?"
                message={`Dengan menonaktifkan insentif ${deactivateTarget?.reward?.nama_reward || "ini"} berarti insentif tersebut tidak digunakan lagi oleh bank sampah termasuk menerima setoran nasabah pada sampah terkait`}
                confirmText={isDeactivating ? "Menonaktifkan..." : "Ya, Nonaktifkan"}
                cancelText="Batal"
                onConfirm={handleDeactivate}
                onCancel={() => setDeactivateTarget(null)}
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
