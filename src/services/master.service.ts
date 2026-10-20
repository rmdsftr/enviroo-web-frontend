import { api } from "./api";
import type { MasterSampah, MasterSampahPaginatedResponse, StatistikSampahResponse, SampahFavoritResponse, SampahPerKategoriResponse, MasterBarang, MasterBarangPaginatedResponse, StatistikBarangResponse, BarangFavoritResponse } from "../types/katalog.type";

export const MasterService = {
    getSampah: async (params?: { q?: string; page?: number; limit?: number }): Promise<MasterSampahPaginatedResponse> => {
        const res = await api.get<MasterSampahPaginatedResponse>("/master/sampah", { params });
        return res.data;
    },

    createSampah: async (data: { nama_sampah: string; satuan_id: number }): Promise<{ message: string; data: MasterSampah }> => {
        const res = await api.post("/master/sampah", data);
        return res.data;
    },

    updateSampah: async (sarokId: number, data: { nama_sampah?: string; satuan_id?: number }): Promise<{ message: string; data: MasterSampah }> => {
        const res = await api.patch(`/master/sampah/${sarokId}`, data);
        return res.data;
    },

    deleteSampah: async (sarokId: number): Promise<{ message: string }> => {
        const res = await api.delete(`/master/sampah/${sarokId}`);
        return res.data;
    },

    getStatistikSampah: async (
        bulanMulai?: number,
        tahunMulai?: number,
        bulanSelesai?: number,
        tahunSelesai?: number,
    ): Promise<StatistikSampahResponse> => {
        const params: Record<string, number> = {};
        if (bulanMulai !== undefined && tahunMulai !== undefined) {
            params.bulan_mulai   = bulanMulai;
            params.tahun_mulai   = tahunMulai;
            params.bulan_selesai = bulanSelesai ?? bulanMulai;
            params.tahun_selesai = tahunSelesai ?? tahunMulai;
        }
        const res = await api.get<StatistikSampahResponse>("/master/sampah/statistik", { params });
        return res.data;
    },

    getFavoritSampah: async (
        limit = 10,
        bulanMulai?: number,
        tahunMulai?: number,
        bulanSelesai?: number,
        tahunSelesai?: number,
    ): Promise<SampahFavoritResponse> => {
        const params: Record<string, number> = { limit };
        if (bulanMulai !== undefined && tahunMulai !== undefined) {
            params.bulan_mulai   = bulanMulai;
            params.tahun_mulai   = tahunMulai;
            params.bulan_selesai = bulanSelesai ?? bulanMulai;
            params.tahun_selesai = tahunSelesai ?? tahunMulai;
        }
        const res = await api.get<SampahFavoritResponse>("/master/sampah/favorit", { params });
        return res.data;
    },

    getSampahPerKategori: async (): Promise<SampahPerKategoriResponse> => {
        const res = await api.get<SampahPerKategoriResponse>("/master/sampah/per-kategori");
        return res.data;
    },

    getBarang: async (params?: { q?: string; page?: number; limit?: number }): Promise<MasterBarangPaginatedResponse> => {
        const res = await api.get<MasterBarangPaginatedResponse>("/master/barang", { params });
        return res.data;
    },

    createBarang: async (data: { nama_barang: string }): Promise<{ message: string; data: MasterBarang }> => {
        const res = await api.post("/master/barang", data);
        return res.data;
    },

    updateBarang: async (barangId: number, data: { nama_barang: string }): Promise<{ message: string; data: MasterBarang }> => {
        const res = await api.patch(`/master/barang/${barangId}`, data);
        return res.data;
    },

    deleteBarang: async (barangId: number): Promise<{ message: string }> => {
        const res = await api.delete(`/master/barang/${barangId}`);
        return res.data;
    },

    getStatistikBarang: async (): Promise<StatistikBarangResponse> => {
        const res = await api.get<StatistikBarangResponse>("/master/barang/statistik");
        return res.data;
    },

    getFavoritBarang: async (
        limit = 10,
        bulanMulai?: number,
        tahunMulai?: number,
        bulanSelesai?: number,
        tahunSelesai?: number,
    ): Promise<BarangFavoritResponse> => {
        const params: Record<string, number> = { limit };
        if (bulanMulai !== undefined && tahunMulai !== undefined) {
            params.bulan_mulai   = bulanMulai;
            params.tahun_mulai   = tahunMulai;
            params.bulan_selesai = bulanSelesai ?? bulanMulai;
            params.tahun_selesai = tahunSelesai ?? tahunMulai;
        }
        const res = await api.get<BarangFavoritResponse>("/master/barang/favorit", { params });
        return res.data;
    },
};
