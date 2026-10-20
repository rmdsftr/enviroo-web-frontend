import { api } from "./api";

export type StatusPenarikan =
    | "pending" | "canceled" | "request_expired" | "rejected" | "approved" | "pickup_expired" | "completed";

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
    status_penarikan: StatusPenarikan;
    deadline_konfirmasi: string | null;
    deadline_jemput: string | null;
    bukti_foto: string | null;
}

export interface PenarikanNasabahItem {
    penarikan_id: string;
    created_at: string;
    status_penarikan: StatusPenarikan;
    nominal_penarikan: number;
    satuan_penarikan: "Rp" | "poin";
    reward_id: number;
    nama_reward: string;
}

interface PenarikanListResponse {
    message: string;
    data: PenarikanItem[];
}

interface PenarikanNasabahListResponse {
    message: string;
    data: PenarikanNasabahItem[];
}

export interface PenarikanQueryParams {
    page?: number;
    limit?: number;
    status?: string;
    reward_id?: number;
    start_date?: string;
    end_date?: string;
}

export interface DetailBarang {
    produk_id: string;
    nama_barang: string;
    photo_url: string | null;
    qty: number;
    nilai_poin: number;
    subtotal_poin: number;
}

export interface PenarikanDetailHeader {
    penarikan_id: string;
    nasabah_id: string;
    nama_nasabah: string;
    bank_id: string;
    nama_bank: string;
    reward_id: number;
    nama_reward: string;
    nominal_penarikan: number;
    satuan_penarikan: "Rp" | "poin";
    status_penarikan: StatusPenarikan;
    deadline_konfirmasi: string | null;
    deadline_jemput: string | null;
    bukti_foto: string | null;
}

export interface RiwayatPenarikanEntry {
    riwayat_penarikan_id: string;
    status_penarikan: StatusPenarikan;
    catatan: string | null;
    created_by: string;
    created_at: string;
}

export interface PenarikanDetail {
    header: PenarikanDetailHeader;
    riwayat: RiwayatPenarikanEntry[];
    detail_penarikan: DetailBarang[];
}

export type SatuanWaktuPenarikan = "minggu" | "bulan";

export interface SettingPenarikan {
    setting_id: string;
    bank_id: string;
    min_waktu: number | null;
    satuan_waktu: SatuanWaktuPenarikan | null;
    min_rupiah: number | null;
    min_poin: number | null;
    created_at: string;
    created_by: string;
    updated_at: string;
    updated_by: string;
}

export interface SettingWaktuRequest {
    min_waktu: number;
    satuan_waktu: SatuanWaktuPenarikan;
}

export interface SettingSaldoRequest {
    min_rupiah?: number;
    min_poin?: number;
}

interface SettingPenarikanResponse {
    message: string;
    data: SettingPenarikan;
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

    async getListByNasabah(nasabahId: string): Promise<PenarikanNasabahItem[]> {
        const response = await api.get<PenarikanNasabahListResponse>(`/penarikan/list/${nasabahId}`);
        return response.data.data;
    },

    async exportRekapLaporan(bankId: string, startDate: string, endDate: string): Promise<Blob> {
        const response = await api.get(`/laporan/penarikan/rekap/${bankId}`, {
            params: { start: startDate, end: endDate },
            responseType: "blob",
        });
        return response.data as Blob;
    },

    async getSetting(bankId: string): Promise<SettingPenarikan> {
        const response = await api.get<SettingPenarikanResponse>(`/penarikan/setting/${bankId}`);
        return response.data.data;
    },

    async saveSettingWaktu(bankId: string, payload: SettingWaktuRequest): Promise<SettingPenarikan> {
        const response = await api.put<SettingPenarikanResponse>(`/penarikan/setting-waktu/${bankId}`, payload);
        return response.data.data;
    },

    async saveSettingSaldo(bankId: string, payload: SettingSaldoRequest): Promise<SettingPenarikan> {
        const response = await api.put<SettingPenarikanResponse>(`/penarikan/setting-saldo/${bankId}`, payload);
        return response.data.data;
    },
};
