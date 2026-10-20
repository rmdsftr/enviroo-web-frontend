import { api } from "./api";
import type {
    GetKategoriResponse,
    GetKatalogDetailResponse,
    GetHistoryHargaResponse,
    GetKatalogPaginatedResponse,
    AddKatalogRequest,
    EditKatalogRequest,
    MasterSampahResponse,
    GetSatuanResponse,
    SatuanSampah,
} from "../types/katalog.type";
export const KatalogService = {
    getMasterSampah: async (q?: string): Promise<MasterSampahResponse> => {
        const res = await api.get<MasterSampahResponse>("/katalog/master-sampah", {
            params: { q }
        });
        return res.data;
    },

    getKategori: async (): Promise<GetKategoriResponse> => {
        const res = await api.get<GetKategoriResponse>("/katalog/get-kategori");
        return res.data;
    },

    addKategori: async (kategori: string): Promise<{ message: string; data: { KategoriID: number; Kategori: string } }> => {
        const res = await api.post("/katalog/add-kategori", { kategori });
        return res.data;
    },

    updateKategori: async (kategoriId: number, kategori: string): Promise<{ message: string; data: { KategoriID: number; Kategori: string } }> => {
        const res = await api.patch(`/katalog/update-kategori/${kategoriId}`, { kategori });
        return res.data;
    },

    deleteKategori: async (kategoriId: number): Promise<{ message: string }> => {
        const res = await api.delete(`/katalog/delete-kategori/${kategoriId}`);
        return res.data;
    },

    getSatuan: async (): Promise<GetSatuanResponse> => {
        const res = await api.get<GetSatuanResponse>("/katalog/get-satuan");
        const data = Array.isArray(res.data.data) ? [...res.data.data] : [];
        return { ...res.data, data: data.sort((a, b) => a.SatuanID - b.SatuanID) };
    },

    addSatuan: async (satuan: string): Promise<{ message: string; data: SatuanSampah }> => {
        const res = await api.post("/katalog/add-satuan", { satuan });
        return res.data;
    },

    updateSatuan: async (satuanId: number, satuan: string): Promise<{ message: string; data: SatuanSampah }> => {
        const res = await api.patch(`/katalog/update-satuan/${satuanId}`, { satuan });
        return res.data;
    },

    deleteSatuan: async (satuanId: number): Promise<{ message: string }> => {
        const res = await api.delete(`/katalog/delete-satuan/${satuanId}`);
        return res.data;
    },

    getKatalogSampahBank: async (bankId: string, page?: number): Promise<GetKatalogPaginatedResponse> => {
        const res = await api.get<GetKatalogPaginatedResponse>(`/katalog/get-sampah/${bankId}`, {
            params: { page },
        });
        return res.data;
    },

    getDetailSampah: async (sampahId: string): Promise<GetKatalogDetailResponse> => {
        const res = await api.get<GetKatalogDetailResponse>(`/katalog/get-detail/${sampahId}`);
        return res.data;
    },

    getHistoryHarga: async (sampahId: string, startDate?: string, endDate?: string): Promise<GetHistoryHargaResponse> => {
        const res = await api.get<GetHistoryHargaResponse>(`/katalog/history-harga/${sampahId}`, {
            params: { start_date: startDate, end_date: endDate },
        });
        return res.data;
    },

    addKatalog: async (bankId: string, data: AddKatalogRequest) => {
        const fd = new FormData();
        fd.append("nama_sampah", data.nama_sampah);
        if (data.sarok_id != null) fd.append("sarok_id", data.sarok_id.toString());
        fd.append("satuan_id", data.satuan_id.toString());
        fd.append("kategori_id", data.kategori_id.toString());
        fd.append("reward_id", data.reward_id.toString());
        if (data.syarat_pemilahan) fd.append("syarat_pemilahan", data.syarat_pemilahan);
        if (data.foto) fd.append("foto", data.foto);
        const res = await api.post(`/katalog/add-sampah/${bankId}`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    },

    editKatalog: async (sampahId: string, data: EditKatalogRequest) => {
        const fd = new FormData();
        if (data.syarat_pemilahan) fd.append("syarat_pemilahan", data.syarat_pemilahan);
        if (typeof data.kategori_id === "number") fd.append("kategori_id", String(data.kategori_id));
        if (data.foto) fd.append("foto", data.foto);
        const res = await api.patch(`/katalog/edit-sampah/${sampahId}`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    },

    deleteKatalogSampah: async (sampahId: string) => {
        const res = await api.delete(`/katalog/delete-sampah/${sampahId}`);
        return res.data;
    },

    exportKatalogSampah: async (bankId: string): Promise<Blob> => {
        const res = await api.get(`/laporan/katalog-sampah/${bankId}`, { responseType: "blob" });
        return res.data;
    },

    exportKatalogBarang: async (bankId: string): Promise<Blob> => {
        const res = await api.get(`/laporan/katalog-barang/${bankId}`, { responseType: "blob" });
        return res.data;
    },
};
