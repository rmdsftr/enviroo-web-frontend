import { api } from "./api";
import type { GetBankSampahProfileResponse, GetProfilNasabahResponse, GetHistoryAkunBankResponse } from "../types/profil.type";

export const ProfilService = {
    async getBankSampahProfile(bank_id: string): Promise<GetBankSampahProfileResponse> {
        const response = await api.get<GetBankSampahProfileResponse>(`/profil/bank-sampah/${bank_id}`);
        return response.data;
    },
    
    async getProfilNasabah(nasabah_id: string): Promise<GetProfilNasabahResponse> {
        const response = await api.get<GetProfilNasabahResponse>(`/profil/nasabah/${nasabah_id}`);
        return response.data;
    },

    async toggleAktivasiBank(bank_id: string): Promise<GetBankSampahProfileResponse> {
        const response = await api.patch<GetBankSampahProfileResponse>(`/profil/bank-sampah/aktivasi/${bank_id}`);
        return response.data;
    },

    async toggleAktivasiNasabah(nasabah_id: string): Promise<any> {
        const response = await api.patch(`/profil/nasabah/aktivasi/${nasabah_id}`);
        return response.data;
    },

    async hapusBankSampah(bank_id: string): Promise<any> {
        const response = await api.delete(`/profil/bank-sampah/${bank_id}`);
        return response.data;
    },

    async hapusNasabah(nasabah_id: string): Promise<any> {
        const response = await api.delete(`/profil/nasabah/${nasabah_id}`);
        return response.data;
    },

    async getHistoryAkunBank(bank_id: string): Promise<GetHistoryAkunBankResponse> {
        const response = await api.get<GetHistoryAkunBankResponse>(`/profil/bank-sampah/${bank_id}/history`);
        return response.data;
    }
};
