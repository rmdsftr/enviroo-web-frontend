import type { BankActivationRequest } from "../types/bank.type";
import type { GetNasabahBSIResponse } from "../types/bsi.type";
import { api } from "./api";

export interface BankSampahOption {
    bank_id: string;
    nama_bank: string;
    jenis_bank: string;
}

export const BankService = {
    async AktivasiBank(bankId: string, data: BankActivationRequest) {
        const response = await api.patch(`/bank/aktivasi/${bankId}`, data);
        return response.data;
    },

    async editProfilBank(bankId: string, formData: FormData) {
        const response = await api.patch(`/bank/edit-profil/${bankId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    async getNasabah(bankId: string): Promise<GetNasabahBSIResponse> {
        const response = await api.get<GetNasabahBSIResponse>(`/bank/get-nasabah/${bankId}`);
        return response.data;
    },

    async getAllBanks(): Promise<BankSampahOption[]> {
        const response = await api.get<{ data: BankSampahOption[] }>("/bank/get-all");
        return response.data.data;
    },
}