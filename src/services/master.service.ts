import { api } from "./api";
import type { MasterSampah, MasterSampahPaginatedResponse, SatuanEnum, StatistikSampahResponse, SampahFavoritResponse, SampahPerKategoriResponse, MasterSembako, MasterSembakoPaginatedResponse, StatistikSembakoResponse, SembakoFavoritResponse } from "../types/katalog.type";

export const MasterService = {
    getSampah: async (params?: { q?: string; page?: number; limit?: number }): Promise<MasterSampahPaginatedResponse> => {
        const res = await api.get<MasterSampahPaginatedResponse>("/master/sampah", { params });
        return res.data;
    },

    createSampah: async (data: { nama_sampah: string; satuan: SatuanEnum }): Promise<{ message: string; data: MasterSampah }> => {
        const res = await api.post("/master/sampah", data);
        return res.data;
    },

    updateSampah: async (sarokId: number, data: { nama_sampah?: string; satuan?: SatuanEnum }): Promise<{ message: string; data: MasterSampah }> => {
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

    getSembako: async (params?: { q?: string; page?: number; limit?: number }): Promise<MasterSembakoPaginatedResponse> => {
        const res = await api.get<MasterSembakoPaginatedResponse>("/master/sembako", { params });
        return res.data;
    },

    createSembako: async (data: { nama_barang: string }): Promise<{ message: string; data: MasterSembako }> => {
        const res = await api.post("/master/sembako", data);
        return res.data;
    },

    updateSembako: async (barangId: number, data: { nama_barang: string }): Promise<{ message: string; data: MasterSembako }> => {
        const res = await api.patch(`/master/sembako/${barangId}`, data);
        return res.data;
    },

    deleteSembako: async (barangId: number): Promise<{ message: string }> => {
        const res = await api.delete(`/master/sembako/${barangId}`);
        return res.data;
    },

    getStatistikSembako: async (): Promise<StatistikSembakoResponse> => {
        const res = await api.get<StatistikSembakoResponse>("/master/sembako/statistik");
        return res.data;
    },

    getFavoritSembako: async (
        limit = 10,
        bulanMulai?: number,
        tahunMulai?: number,
        bulanSelesai?: number,
        tahunSelesai?: number,
    ): Promise<SembakoFavoritResponse> => {
        const params: Record<string, number> = { limit };
        if (bulanMulai !== undefined && tahunMulai !== undefined) {
            params.bulan_mulai   = bulanMulai;
            params.tahun_mulai   = tahunMulai;
            params.bulan_selesai = bulanSelesai ?? bulanMulai;
            params.tahun_selesai = tahunSelesai ?? tahunMulai;
        }
        const res = await api.get<SembakoFavoritResponse>("/master/sembako/favorit", { params });
        return res.data;
    },
};
