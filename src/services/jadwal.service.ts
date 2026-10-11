import { api } from "./api";
import type {
    AddJadwalRequest,
    AddJadwalBatchRequest,
    AddJadwalBatchResponse,
    GetJadwalResponse,
    GetJadwalPenimbanganBankResponse,
    GetJadwalMasterPenimbanganResponse,
    JadwalPenimbanganOccurrence,
    JadwalMasterPenimbangan,
} from "../types/jadwal.type";

export const JadwalService = {
    async getJadwalBank(bankId: string, month: number, year: number): Promise<GetJadwalResponse> {
        const response = await api.get<GetJadwalResponse>(`/jadwal/get-jadwal/${bankId}`, {
            params: { month, year },
        });
        return response.data;
    },

    async getJadwalPenimbanganBank(bankId: string, month: number, year: number): Promise<JadwalPenimbanganOccurrence[]> {
        const response = await api.get<GetJadwalPenimbanganBankResponse>(`/jadwal/penimbangan/${bankId}`, {
            params: { month, year },
        });
        return response.data.data;
    },

    async getJadwalMasterPenimbangan(bankId: string, month: number, year: number): Promise<JadwalMasterPenimbangan> {
        const response = await api.get<GetJadwalMasterPenimbanganResponse>(`/jadwal/master-penimbangan/${bankId}`, {
            params: { month, year },
        });
        return response.data.data;
    },

    async addJadwal(bankId: string, data: AddJadwalRequest) {
        const response = await api.post(`/jadwal/add-jadwal/${bankId}`, data);
        return response.data;
    },

    async addJadwalBatch(bankId: string, data: AddJadwalBatchRequest): Promise<AddJadwalBatchResponse> {
        const response = await api.post<AddJadwalBatchResponse>(`/jadwal/add-jadwal-batch/${bankId}`, data);
        return response.data;
    },

    async deleteJadwal(jadwalId: string) {
        const response = await api.delete(`/jadwal/delete-jadwal/${jadwalId}`);
        return response.data;
    },

    async updateJadwal(jadwalId: string, data: Partial<AddJadwalRequest>) {
        const response = await api.patch(`/jadwal/update-jadwal/${jadwalId}`, data);
        return response.data;
    },

};
