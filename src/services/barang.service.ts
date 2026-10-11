import { api } from "./api";
import type { GetBarangPaginatedResponse, GetDetailBarangBSUResponse, MasterBarangResponse, ListDistribusiBarangResponse, GetDetailDistribusiBarangResponse } from "../types/barang.type";

export const BarangService = {
    getMasterBarang: async (q?: string): Promise<MasterBarangResponse> => {
        const res = await api.get<MasterBarangResponse>("/barang/get-master", { params: { q } });
        return res.data;
    },

    getBarangBank: async (bankId: string, page?: number): Promise<GetBarangPaginatedResponse> => {
        const response = await api.get<GetBarangPaginatedResponse>(`/barang/get/${bankId}`, {
            params: { page },
        });
        return response.data;
    },

    getDetailBarangBSU: async (produkId: string, bankId: string): Promise<GetDetailBarangBSUResponse> => {
        const response = await api.get<GetDetailBarangBSUResponse>(`/barang/detail-bsu/${produkId}`, {
            params: { bank_id: bankId },
        });
        return response.data;
    },

    listDistribusiBarang: async (bankId: string, startDate?: string, endDate?: string): Promise<ListDistribusiBarangResponse> => {
        const response = await api.get<ListDistribusiBarangResponse>(`/barang/list-distribusi/${bankId}`, {
            params: { start_date: startDate, end_date: endDate },
        });
        return response.data;
    },

    getDetailDistribusiBarang: async (disbaId: string): Promise<GetDetailDistribusiBarangResponse> => {
        const response = await api.get<GetDetailDistribusiBarangResponse>(`/barang/detail-distribusi/${disbaId}`);
        return response.data;
    },

    addBarang: async (bankId: string, data: {
        nama_barang: string;
        barang_id?: number;
        nilai_poin: number;
        stok_awal?: number;
        created_by?: string;
        foto?: File;
    }) => {
        const formData = new FormData();
        formData.append("nama_barang", data.nama_barang);
        if (data.barang_id != null) formData.append("barang_id", data.barang_id.toString());
        formData.append("nilai_poin", data.nilai_poin.toString());
        if (data.stok_awal != null) formData.append("stok_awal", data.stok_awal.toString());
        if (data.created_by) formData.append("created_by", data.created_by);
        if (data.foto) formData.append("foto", data.foto);
        const response = await api.post(`/barang/add/${bankId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    editBarang: async (produkId: string, data: {
        nama_barang?: string;
        nilai_poin?: number;
        tambah_stok?: number;
        stok?: number;
        updated_by?: string;
        foto?: File;
    }) => {
        const formData = new FormData();
        if (data.nama_barang) formData.append("nama_barang", data.nama_barang);
        if (data.nilai_poin != null) formData.append("nilai_poin", data.nilai_poin.toString());
        if (data.tambah_stok != null) formData.append("tambah_stok", data.tambah_stok.toString());
        if (data.stok != null) formData.append("stok", data.stok.toString());
        if (data.updated_by) formData.append("updated_by", data.updated_by);
        if (data.foto) formData.append("foto", data.foto);
        const response = await api.patch(`/barang/edit/${produkId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    deleteBarang: async (produkId: string) => {
        const response = await api.delete(`/barang/delete/${produkId}`);
        return response.data;
    },
};
