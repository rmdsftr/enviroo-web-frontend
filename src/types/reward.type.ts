export interface Reward {
    RewardID: number;
    NamaReward: string;
    Satuan: string;
    Deskripsi?: string | null;
    CreatedAt: string;
    UpdatedAt: string;
}

export interface AddRewardRequest {
    nama_reward: string;
    satuan: string;
    deskripsi?: string | null;
}

export interface UpdateRewardRequest {
    nama_reward: string;
    satuan: string;
    deskripsi?: string | null;
}

/* ── Nilai Reward (per-bank conversion) ─────────────────────────────── */
export interface NilaiRewardBank {
    NilaiRewardID: string;
    BankID: string;
    RewardID: number;
    NilaiPoin: number;
    NilaiKonversi: number;
    CreatedAt: string;
    UpdatedAt: string;
    CreatedBy?: string | null;
    UpdatedBy?: string | null;
    Reward?: Reward;
}

export interface AddNilaiRewardRequest {
    reward_id: number;
    nilai_poin: number;
    nilai_konversi: number;
    created_by?: string;
}

export interface UpdateNilaiRewardRequest {
    nilai_poin: number;
    nilai_konversi: number;
    updated_by?: string;
}

export interface HistoryNilaiReward {
    HistoryID: number;
    NilaiRewardID: string;
    OldNilaiPoin?: number | null;
    NewNilaiPoin?: number | null;
    OldNilaiKonversi?: number | null;
    NewNilaiKonversi?: number | null;
    ChangedBy?: string | null;
    ChangedAt: string;
}
