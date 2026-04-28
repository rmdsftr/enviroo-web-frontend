import { api } from "./api";
import type { GetSembakoResponse, GetSembakoHistoryResponse } from "../types/sembako.type";

export const SembakoService = {
    getSembakoBank: async (bankId: string): Promise<GetSembakoResponse> => {
        const response = await api.get<GetSembakoResponse>(`/sembako/get-sembako/${bankId}`);
        return response.data;
    },

    getHistorySembako: async (sembakoId: string): Promise<GetSembakoHistoryResponse> => {
        const response = await api.get<GetSembakoHistoryResponse>(`/sembako/get-history/${sembakoId}`);
        return response.data;
    },

    addSembako: async (bankId: string, data: {
        nama_sembako: string;
        harga_nasabah: number;
        harga_eksternal: number;
        harga_bsu?: number;
        foto?: File;
    }) => {
        const formData = new FormData();
        formData.append("nama_sembako", data.nama_sembako);
        formData.append("harga_nasabah", data.harga_nasabah.toString());
        formData.append("harga_eksternal", data.harga_eksternal.toString());
        if (data.harga_bsu !== undefined) {
            formData.append("harga_bsu", data.harga_bsu.toString());
        }
        if (data.foto) {
            formData.append("foto", data.foto);
        }

        const response = await api.post(`/sembako/add-sembako/${bankId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    },

    deleteSembako: async (sembakoId: string) => {
        const response = await api.delete(`/sembako/delete-sembako/${sembakoId}`);
        return response.data;
    },

    editSembako: async (sembakoId: string, data: { nama_sembako?: string; foto?: File }) => {
        const formData = new FormData();
        if (data.nama_sembako) formData.append("nama_sembako", data.nama_sembako);
        if (data.foto) formData.append("foto", data.foto);

        const response = await api.patch(`/sembako/edit-sembako/${sembakoId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    },

    updateHargaSembako: async (sembakoId: string, levelUser: string, poinHarga: number, changedBy: string) => {
        const formData = new FormData();
        formData.append("level_user", levelUser);
        formData.append("poin_harga", poinHarga.toString());
        formData.append("changed_by", changedBy);

        const response = await api.patch(`/sembako/update-harga-sembako/${sembakoId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    },
};
