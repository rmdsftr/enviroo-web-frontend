import { api } from "./api";
import type { GetNasabahAfiliasiResponse, NewNasabah, AddNasabahOldUserPayload } from "../types/nasabah.type";

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

    async deleteNasabah(nasabah_id:string): Promise<any>{
        const response = await api.delete(`/nasabah/${nasabah_id}`);
        return response.data;
    }
};
