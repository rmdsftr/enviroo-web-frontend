export interface MitraPengepul {
    mitra_id: string;
    nama_mitra: string;
    bank_id: string;
    is_active: boolean;
    created_at: string;
}

export interface CreateMitraRequest {
    nama_mitra: string;
}

export interface UpdateMitraRequest {
    nama_mitra?: string;
    is_active?: boolean;
}
