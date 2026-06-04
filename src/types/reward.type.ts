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
    LevelUser: string;
    PersenBagiHasil: number;
    CreatedAt: string;
    UpdatedAt: string;
    CreatedBy?: string | null;
    UpdatedBy?: string | null;
    IsActive: boolean;
    Reward?: Reward;
}

export interface RewardPersentase {
    level_user: string;
    persen_bagi_hasil: number;
}

export interface AddNilaiRewardRequest {
    reward_id: number;
    persentase: RewardPersentase[];
    created_by?: string;
}

export interface UpdateNilaiRewardRequest {
    persentase: RewardPersentase[];
    updated_by?: string;
}

export interface HistoryNilaiReward {
    history_reward_id: number;
    nilai_reward_id: string;
    level_user: string;
    old_persen?: number | null;
    new_persen?: number | null;
    changed_by: string;
    changed_at: string;
}

export interface DetailNilaiRewardBank {
    bank_id: string;
    reward_id: number;
    nama_reward: string;
    satuan: string;
    persentase: RewardPersentase[];
    history: HistoryNilaiReward[];
}
