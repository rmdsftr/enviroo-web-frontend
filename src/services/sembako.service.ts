import { api } from "./api";
import type { GetSembakoResponse, GetDetailSembakoBSUResponse } from "../types/sembako.type";

export const SembakoService = {
    // ── Read ───────────────────────────────────────────────────────────────

    getSembakoBank: async (bankId: string): Promise<GetSembakoResponse> => {
        const response = await api.get<GetSembakoResponse>(`/sembako/get-sembako/${bankId}`);
        return response.data;
    },

    /** GET /sembako/detail-sembako-bsu/:sembako_id — info + riwayat distribusi BSU */
    getDetailSembakoBSU: async (sembakoId: string): Promise<GetDetailSembakoBSUResponse> => {
        const response = await api.get<GetDetailSembakoBSUResponse>(`/sembako/detail-sembako-bsu/${sembakoId}`);
        return response.data;
    },

    // ── Write ──────────────────────────────────────────────────────────────

    /** POST /sembako/add-sembako/:bank_id */
    addSembako: async (bankId: string, data: {
        nama_sembako: string;
        nilai_poin: number;
        stok?: number;
        created_by?: string;
        foto?: File;
    }) => {
        const formData = new FormData();
        formData.append("nama_sembako", data.nama_sembako);
        formData.append("nilai_poin", data.nilai_poin.toString());
        if (data.stok !== undefined) formData.append("stok", data.stok.toString());
        if (data.created_by) formData.append("created_by", data.created_by);
        if (data.foto) formData.append("foto", data.foto);
        const response = await api.post(`/sembako/add-sembako/${bankId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    },

    /** PATCH /sembako/edit-sembako/:sembako_id */
    editSembako: async (sembakoId: string, data: {
        nama_sembako?: string;
        nilai_poin?: number;
        stok?: number;
        tambah_stok?: number;
        updated_by?: string;
        foto?: File;
    }) => {
        const formData = new FormData();
        if (data.nama_sembako) formData.append("nama_sembako", data.nama_sembako);
        if (data.nilai_poin !== undefined) formData.append("nilai_poin", data.nilai_poin.toString());
        if (data.stok !== undefined) formData.append("stok", data.stok.toString());
        if (data.tambah_stok !== undefined) formData.append("tambah_stok", data.tambah_stok.toString());
        if (data.updated_by) formData.append("updated_by", data.updated_by);
        if (data.foto) formData.append("foto", data.foto);
        const response = await api.patch(`/sembako/edit-sembako/${sembakoId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    },

    /** DELETE /sembako/delete-sembako/:sembako_id */
    deleteSembako: async (sembakoId: string) => {
        const response = await api.delete(`/sembako/delete-sembako/${sembakoId}`);
        return response.data;
    },
};
