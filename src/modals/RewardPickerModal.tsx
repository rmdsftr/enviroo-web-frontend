import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
    FaGift,
    FaMoneyBillWave,
    FaCoins,
    FaMagnifyingGlass,
    FaCheck,
} from "react-icons/fa6";
import CloseButton from "../components/close-button";
import type { Reward } from "../types/reward.type";
import "../styles/reward.css";
import "../styles/manajemen-reward.css";

interface RewardPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPick: (reward: Reward) => void;
    rewards: Reward[];
    isLoading?: boolean;
    error?: string | null;
    excludeIds?: number[];
}

function rewardIcon(nama: string) {
    const lower = (nama || "").toLowerCase();
    if (lower.includes("uang") || lower.includes("tunai") || lower.includes("rupiah"))
        return <FaMoneyBillWave />;
    if (lower.includes("emas") || lower.includes("gold"))
        return <FaCoins />;
    return <FaGift />;
}

export default function RewardPickerModal({
    isOpen,
    onClose,
    onPick,
    rewards,
    isLoading,
    error,
    excludeIds = [],
}: RewardPickerModalProps) {
    const [query, setQuery] = useState("");

    useEffect(() => {
        if (!isOpen) setQuery("");
    }, [isOpen]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return rewards.filter(r => {
            if (!q) return true;
            return (
                r.NamaReward.toLowerCase().includes(q) ||
                r.Satuan.toLowerCase().includes(q)
            );
        });
    }, [rewards, query]);

    if (!isOpen) return null;

    return createPortal(
        <div className="mr-modal-overlay" onClick={onClose}>
            <div className="mr-modal-box" onClick={e => e.stopPropagation()}>
                <div className="mr-modal-header">
                    <div>
                        <h2 className="mr-modal-title">Pilih Jenis Reward</h2>
                        <p className="mr-modal-sub">
                            Pilih jenis reward yang ingin diterapkan pada penjualan ini.
                        </p>
                    </div>
                    <CloseButton onClick={onClose} />
                </div>

                <div className="mr-picker-search">
                    <FaMagnifyingGlass />
                    <input
                        type="text"
                        placeholder="Cari reward..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                </div>

                <div className="mr-picker-body">
                    {error && <div className="mr-picker-error">{error}</div>}

                    {isLoading ? (
                        <div className="mr-picker-loading">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="mr-picker-skeleton" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="mr-picker-empty">
                            <div className="mr-picker-empty-icon"><FaGift /></div>
                            <h3>Tidak ada reward</h3>
                            <p>
                                {rewards.length === 0
                                    ? "Master reward belum tersedia. Hubungi superadmin untuk menambahkan."
                                    : "Tidak ada reward yang cocok dengan pencarian."}
                            </p>
                        </div>
                    ) : (
                        <div className="mr-picker-list">
                            {filtered.map(r => {
                                const isTaken = excludeIds.includes(r.RewardID);
                                return (
                                    <button
                                        key={r.RewardID}
                                        type="button"
                                        className={`mr-picker-item${isTaken ? " mr-picker-item--taken" : ""}`}
                                        disabled={isTaken}
                                        onClick={() => !isTaken && onPick(r)}
                                    >
                                        <span className="mr-picker-item-icon">{rewardIcon(r.NamaReward)}</span>
                                        <span className="mr-picker-item-body">
                                            <span className="mr-picker-item-name">{r.NamaReward}</span>
                                            <span className="mr-picker-item-desc">
                                                {r.Deskripsi || `Satuan: ${r.Satuan}`}
                                            </span>
                                        </span>
                                        <span className="mr-picker-item-satuan">{r.Satuan}</span>
                                        {isTaken && (
                                            <span className="mr-picker-item-taken">
                                                <FaCheck /> Terpakai
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}
