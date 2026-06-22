import { api } from "./api";
import type { GetNasabahAfiliasiResponse, NewNasabah, GetNasabahResponse, AddNasabahOldUserPayload, NasabahBankSampahResponse } from "../types/nasabah.type";

export const NasabahService = {
    async getAfiliasi(): Promise<GetNasabahAfiliasiResponse> {
        const response = await api.get<GetNasabahAfiliasiResponse>("/nasabah/get-afiliasi");
        return response.data;
    },

    async createNasabah(data: NewNasabah) {
        const response = await api.post("/nasabah/add-nasabah", data);
        return response.data;
    },

    async createNasabahFromOldUser(data: AddNasabahOldUserPayload) {
        const response = await api.post("/nasabah/add-nasabah-from-old-user", data);
        return response.data;
    },

    async getNasabahs(): Promise<GetNasabahResponse> {
        const response = await api.get<GetNasabahResponse>("/nasabah/get-nasabah");
        return response.data;
    },

    async getNasabahByBankId(bank_id: string): Promise<NasabahBankSampahResponse> {
        const response = await api.get<NasabahBankSampahResponse>(`/nasabah/${bank_id}`);
        return response.data;
    },

    async deleteNasabah(nasabah_id:string): Promise<any>{
        const response = await api.delete(`/nasabah/${nasabah_id}`);
        return response.data;
    }
};
