import { api } from "./api";

export interface PenarikanItem {
    penarikan_id: string;
    nasabah_id: string;
    nama_nasabah: string;
    bank_id: string;
    nama_bank: string;
    reward_id: number;
    nama_reward: string;
    nominal_penarikan: number;
    satuan_penarikan: "Rp" | "poin";
    status_penarikan: "pending" | "berhasil" | "kadaluarsa" | "dibatalkan";
    kadaluarsa_at: string;
    bukti_foto: string | null;
    created_at: string;
    updated_at: string;
}

interface PenarikanListResponse {
    data: PenarikanItem[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export interface PenarikanQueryParams {
    page?: number;
    limit?: number;
    status?: string;
    reward_id?: number;
    start_date?: string;
    end_date?: string;
}

export interface DetailSembako {
    sembako_id: string;
    nama_sembako: string;
    photo_url: string | null;
    qty: number;
    nilai_poin: number;
    subtotal_poin: number;
}

export interface PenarikanDetail extends PenarikanItem {
    detail_sembako?: DetailSembako[];
}

export const PenarikanService = {
    async getListByBank(bankId: string, params?: PenarikanQueryParams): Promise<PenarikanListResponse> {
        const response = await api.get<PenarikanListResponse>(`/penarikan/list-bank/${bankId}`, { params });
        return response.data;
    },

    async getDetail(penarikanId: string): Promise<PenarikanDetail> {
        const response = await api.get<PenarikanDetail>(`/penarikan/detail/${penarikanId}`);
        return response.data;
    },

    async getListByNasabah(nasabahId: string): Promise<PenarikanItem[]> {
        const response = await api.get<PenarikanListResponse>(`/penarikan/list/${nasabahId}`);
        return response.data.data;
    },
};
