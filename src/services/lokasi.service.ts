import { api } from "./api";
import type {
    BankSampahLokasiResponse,
    StatistikKecamatanResponse,
    KecamatanResponse,
    Kecamatan,
    KelurahanResponse,
    KelurahanPaginatedResponse,
    Kelurahan,
} from "../types/lokasi.type";

export const LokasiService = {
    async getLokasiBankSampah(): Promise<BankSampahLokasiResponse> {
        const response = await api.get<BankSampahLokasiResponse>("/lokasi/bank-sampah");
        return response.data;
    },

    async getStatistikKecamatan(sort?: "asc" | "desc"): Promise<StatistikKecamatanResponse> {
        const params = sort ? { sort } : {};
        const response = await api.get<StatistikKecamatanResponse>("/lokasi/statistik-kecamatan", { params });
        return response.data;
    },

    /* ── Kecamatan ──────────────────────────────────────────── */
    async getAllKecamatan(): Promise<KecamatanResponse> {
        const response = await api.get<KecamatanResponse>("/lokasi/kecamatan");
        return response.data;
    },

    async createKecamatan(nama: string): Promise<{ message: string; data: Kecamatan }> {
        const response = await api.post("/lokasi/kecamatan", { kecamatan: nama });
        return response.data;
    },

    async updateKecamatan(id: number, nama: string): Promise<{ message: string; data: Kecamatan }> {
        const response = await api.patch(`/lokasi/kecamatan/${id}`, { kecamatan: nama });
        return response.data;
    },

    async deleteKecamatan(id: number): Promise<{ message: string }> {
        const response = await api.delete(`/lokasi/kecamatan/${id}`);
        return response.data;
    },

    /* ── Kelurahan ──────────────────────────────────────────── */
    async getAllKelurahan(params?: { page?: number; limit?: number }): Promise<KelurahanPaginatedResponse> {
        const response = await api.get<KelurahanPaginatedResponse>("/lokasi/kelurahan", { params });
        return response.data;
    },

    async getKelurahanByKecamatan(kecamatanId: number): Promise<KelurahanResponse> {
        const response = await api.get<KelurahanResponse>(`/lokasi/kecamatan/${kecamatanId}/kelurahan`);
        return response.data;
    },

    async createKelurahan(data: { id_kecamatan: number; kelurahan: string }): Promise<{ message: string; data: Kelurahan }> {
        const response = await api.post("/lokasi/kelurahan", data);
        return response.data;
    },

    async updateKelurahan(id: number, data: { id_kecamatan?: number; kelurahan: string }): Promise<{ message: string; data: Kelurahan }> {
        const response = await api.patch(`/lokasi/kelurahan/${id}`, data);
        return response.data;
    },

    async deleteKelurahan(id: number): Promise<{ message: string }> {
        const response = await api.delete(`/lokasi/kelurahan/${id}`);
        return response.data;
    },
};
