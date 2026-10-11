import { api } from "./api";
import type { MitraPengepul, CreateMitraRequest, UpdateMitraRequest } from "../types/mitra.type";

export const MitraService = {
    async getMitra(bankId: string): Promise<{ message: string; data: MitraPengepul[] }> {
        const response = await api.get(`/penjualan/mitra/${bankId}`);
        return response.data;
    },

    async createMitra(bankId: string, data: CreateMitraRequest): Promise<{ message: string; data: MitraPengepul }> {
        const response = await api.post(`/penjualan/mitra/${bankId}`, data);
        return response.data;
    },

    async updateMitra(
        bankId: string,
        mitraId: string,
        data: UpdateMitraRequest,
    ): Promise<{ message: string; data: MitraPengepul }> {
        const response = await api.patch(`/penjualan/mitra/${bankId}/${mitraId}`, data);
        return response.data;
    },

    async deleteMitra(bankId: string, mitraId: string): Promise<{ message: string }> {
        const response = await api.delete(`/penjualan/mitra/${bankId}/${mitraId}`);
        return response.data;
    },
};
