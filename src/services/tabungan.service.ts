import { api } from "./api";
import type { AntrianPencairanResponse } from "../types/tabungan.type";

export const TabunganService = {
    getAntrianPencairan: async (bankId: string, sampahId: string): Promise<AntrianPencairanResponse> => {
        const res = await api.get<AntrianPencairanResponse>(`/tabungan-sampah/antrian/${bankId}/${sampahId}`);
        return res.data;
    },
};
