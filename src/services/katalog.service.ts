import { api } from "./api";
import type {
    GetKategoriResponse,
    GetKatalogDetailResponse,
    GetKatalogPaginatedResponse,
    AddKatalogRequest,
    EditKatalogRequest,
    MasterSampahResponse,
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

    // ── Read ───────────────────────────────────────────────────────────────

    getKatalogSampahBank: async (bankId: string, page = 1): Promise<GetKatalogPaginatedResponse> => {
        const res = await api.get<GetKatalogPaginatedResponse>(`/katalog/get-sampah/${bankId}`, {
            params: { page },
        });
        return res.data;
    },

    /** GET /katalog/get-detail/:sampah_id — returns detail + harga_per_level + history */
    getDetailSampah: async (sampahId: string): Promise<GetKatalogDetailResponse> => {
        const res = await api.get<GetKatalogDetailResponse>(`/katalog/get-detail/${sampahId}`);
        return res.data;
    },

    // ── Write ──────────────────────────────────────────────────────────────

    /** POST /katalog/add-sampah/:bank_id — multipart/form-data */
    addKatalog: async (bankId: string, data: AddKatalogRequest) => {
        const fd = new FormData();
        fd.append("nama_sampah", data.nama_sampah);
        if (data.sarok_id != null) fd.append("sarok_id", data.sarok_id.toString());
        fd.append("satuan", data.satuan);
        fd.append("kategori_id", data.kategori_id.toString());
        fd.append("reward_id", data.reward_id.toString());
        if (data.syarat_pemilahan) fd.append("syarat_pemilahan", data.syarat_pemilahan);
        if (data.foto) fd.append("foto", data.foto);
        const res = await api.post(`/katalog/add-sampah/${bankId}`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    },

    /** PATCH /katalog/edit-sampah/:sampah_id — multipart/form-data */
    editKatalog: async (sampahId: string, data: EditKatalogRequest) => {
        const fd = new FormData();
        if (data.syarat_pemilahan) fd.append("syarat_pemilahan", data.syarat_pemilahan);
        if (data.foto) fd.append("foto", data.foto);
        const res = await api.patch(`/katalog/edit-sampah/${sampahId}`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    },

    /** DELETE /katalog/delete-sampah/:sampah_id */
    deleteKatalogSampah: async (sampahId: string) => {
        const res = await api.delete(`/katalog/delete-sampah/${sampahId}`);
        return res.data;
    },

    /** GET /laporan/katalog-sampah/:bank_id — returns Excel blob */
    exportKatalogSampah: async (bankId: string): Promise<Blob> => {
        const res = await api.get(`/laporan/katalog-sampah/${bankId}`, { responseType: "blob" });
        return res.data;
    },

    /** GET /laporan/katalog-sembako/:bank_id — returns Excel blob */
    exportKatalogSembako: async (bankId: string): Promise<Blob> => {
        const res = await api.get(`/laporan/katalog-sembako/${bankId}`, { responseType: "blob" });
        return res.data;
    },
};
