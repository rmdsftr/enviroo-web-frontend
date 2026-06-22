import { api } from "./api";
import type { GetBankSampahProfileResponse, GetProfilNasabahResponse, GetSaldoNasabahResponse, GetHistoryAkunBankResponse, GetDetailBankResponse, GetSaldoBankResponse } from "../types/profil.type";

export const ProfilService = {
    async getBankSampahProfile(bank_id: string): Promise<GetBankSampahProfileResponse> {
        const response = await api.get<GetBankSampahProfileResponse>(`/profil/bank-sampah/${bank_id}`);
        return response.data;
    },

    async getProfilNasabah(nasabah_id: string): Promise<GetProfilNasabahResponse> {
        const response = await api.get<GetProfilNasabahResponse>(`/profil/detail-nasabah/${nasabah_id}`);
        return response.data;
    },

    async getSaldoNasabah(nasabah_id: string): Promise<GetSaldoNasabahResponse> {
        const response = await api.get<GetSaldoNasabahResponse>(`/dashboard/saldo-nasabah/${nasabah_id}`);
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

    async getHistoryAkunBank(bank_id: string): Promise<GetHistoryAkunBankResponse> {
        const response = await api.get<GetHistoryAkunBankResponse>(`/profil/bank-sampah/${bank_id}/history`);
        return response.data;
    },

    async getDetailBank(bank_id: string): Promise<GetDetailBankResponse> {
        const response = await api.get<GetDetailBankResponse>(`/profil/detail-bank/${bank_id}`);
        return response.data;
    },

    async getSaldoBank(bank_id: string): Promise<GetSaldoBankResponse> {
        const response = await api.get<GetSaldoBankResponse>(`/dashboard/saldo-bank/${bank_id}`);
        return response.data;
    },

    async getDetailPetugas(identity_id: string): Promise<any> {
        const response = await api.get(`/profil/detail-petugas/${identity_id}`);
        return response.data;
    },

    async updateProfil(user_id: string, formData: FormData): Promise<any> {
        const response = await api.post(`/users/update-profil/${user_id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },
};
