import { api } from "./api";
import type { GetSembakoPaginatedResponse, GetDetailSembakoBSUResponse, MasterSembakoResponse, ListDistribusiSembakoResponse, GetDetailDistribusiSembakoResponse } from "../types/sembako.type";

export const SembakoService = {
    // ── Read ───────────────────────────────────────────────────────────────

    getMasterSembako: async (q?: string): Promise<MasterSembakoResponse> => {
        const res = await api.get<MasterSembakoResponse>("/sembako/get-master", { params: { q } });
        return res.data;
    },

    getSembakoBank: async (bankId: string, page = 1): Promise<GetSembakoPaginatedResponse> => {
        const response = await api.get<GetSembakoPaginatedResponse>(`/sembako/get-sembako/${bankId}`, {
            params: { page },
        });
        return response.data;
    },

    /** GET /sembako/detail-sembako/:sembako_id?bank_id=<BANK_ID> — riwayat distribusi */
    getDetailSembakoBSU: async (sembakoId: string, bankId: string): Promise<GetDetailSembakoBSUResponse> => {
        const response = await api.get<GetDetailSembakoBSUResponse>(`/sembako/detail-sembako/${sembakoId}`, {
            params: { bank_id: bankId },
        });
        return response.data;
    },

    /** GET /sembako/list-distribusi/:bank_id — list distribusi sembako per bank (BSI/BSU) */
    listDistribusiSembako: async (bankId: string, startDate?: string, endDate?: string): Promise<ListDistribusiSembakoResponse> => {
        const response = await api.get<ListDistribusiSembakoResponse>(`/sembako/list-distribusi/${bankId}`, {
            params: { start_date: startDate, end_date: endDate },
        });
        return response.data;
    },

    /** GET /sembako/detail-distribusi/:distribusi_id — detail satu distribusi sembako */
    getDetailDistribusiSembako: async (distribusiId: string): Promise<GetDetailDistribusiSembakoResponse> => {
        const response = await api.get<GetDetailDistribusiSembakoResponse>(`/sembako/detail-distribusi/${distribusiId}`);
        return response.data;
    },

    // ── Write ──────────────────────────────────────────────────────────────

    /** POST /sembako/add-sembako/:bank_id */
    addSembako: async (bankId: string, data: {
        nama_barang: string;
        barang_id?: number;
        nilai_poin: number;
        stok_awal?: number;
        created_by?: string;
        foto?: File;
    }) => {
        const formData = new FormData();
        formData.append("nama_barang", data.nama_barang);
        if (data.barang_id !== undefined) formData.append("barang_id", data.barang_id.toString());
        formData.append("nilai_poin", data.nilai_poin.toString());
        if (data.stok_awal !== undefined) formData.append("stok_awal", data.stok_awal.toString());
        if (data.created_by) formData.append("created_by", data.created_by);
        if (data.foto) formData.append("foto", data.foto);
        const response = await api.post(`/sembako/add-sembako/${bankId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    },

    /** PATCH /sembako/edit-sembako/:sembako_id */
    editSembako: async (sembakoId: string, data: {
        nama_barang?: string;
        nilai_poin?: number;
        stok?: number;
        tambah_stok?: number;
        updated_by?: string;
        foto?: File;
    }) => {
        const formData = new FormData();
        if (data.nama_barang) formData.append("nama_barang", data.nama_barang);
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
