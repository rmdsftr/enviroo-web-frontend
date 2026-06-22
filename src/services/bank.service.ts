import type { BankActivationRequest } from "../types/bank.type";
import type { GetNasabahBSIResponse, GetNasabahBSIPagedResponse } from "../types/bsi.type";
import { api } from "./api";
import { mockGetNasabahPaged, mockGetAllNasabah } from "../mocks/list-nasabah";

const USE_MOCK = false;

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
        if (USE_MOCK) return mockGetAllNasabah(bankId);
        const response = await api.get<GetNasabahBSIResponse>(`/bank/get-nasabah/${bankId}`);
        return response.data;
    },

    async getNasabahPaged(bankId: string, page: number): Promise<GetNasabahBSIPagedResponse> {
        if (USE_MOCK) return mockGetNasabahPaged(bankId, page);
        const response = await api.get<GetNasabahBSIPagedResponse>(`/bank/get-nasabah/${bankId}`, {
            params: { page },
        });
        return response.data;
    },

    async getAllBanks(): Promise<BankSampahOption[]> {
        const response = await api.get<{ data: BankSampahOption[] }>("/bank/get-all");
        return response.data.data;
    },
}