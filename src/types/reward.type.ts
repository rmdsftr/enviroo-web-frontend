export interface Reward {
    reward_id: number;
    nama_reward: string;
    satuan: string;
    deskripsi?: string | null;
    created_at: string;
    updated_at: string;
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

export interface NilaiRewardBank {
    nilai_reward_id: string;
    bank_id: string;
    reward_id: number;
    level_user: string;
    persen_bagi_hasil: number;
    created_at: string;
    updated_at: string;
    created_by?: string | null;
    updated_by?: string | null;
    is_active: boolean;
    reward?: Reward;
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
    history_reward_id: string;
    nilai_reward_id: string;
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
