import { api } from "./api";
import type {
    GetKategoriResponse,
    GetKatalogResponse,
    GetKatalogHistoryResponse,
    AddKatalogBSIRequest,
    AddKatalogBSMRequest,
    EditKatalogRequest,
    UpdateHargaSchemaRequest,
} from "../types/katalog.type";

export const KatalogService = {
    // ── Read ───────────────────────────────────────────────────────────────

    getKategori: async (): Promise<GetKategoriResponse> => {
        const res = await api.get<GetKategoriResponse>("/katalog/get-kategori");
        return res.data;
    },

    getKatalogSampahBank: async (bankId: string): Promise<GetKatalogResponse> => {
        const res = await api.get<GetKatalogResponse>(`/katalog/get-sampah/${bankId}`);
        return res.data;
    },

    getHistoryKatalogSampah: async (sampahId: string): Promise<GetKatalogHistoryResponse> => {
        const res = await api.get<GetKatalogHistoryResponse>(`/katalog/get-history/${sampahId}`);
        return res.data;
    },

    // ── BSI CRUD ───────────────────────────────────────────────────────────

    /** POST /katalog/bsi/add-sampah/:bank_id — multipart/form-data */
    addKatalogBSI: async (bankId: string, data: AddKatalogBSIRequest) => {
        const fd = new FormData();
        fd.append("nama_sampah", data.nama_sampah);
        fd.append("satuan", data.satuan);
        fd.append("kategori_id", data.kategori_id.toString());
        fd.append("harga_nasabah", data.harga_nasabah.toString());
        fd.append("harga_bsu", data.harga_bsu.toString());
        fd.append("harga_eksternal", data.harga_eksternal.toString());
        if (data.foto) fd.append("foto", data.foto);

        const res = await api.post(`/katalog/bsi/add-sampah/${bankId}`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    },

    /** PATCH /katalog/bsi/edit-sampah/:sampah_id — multipart/form-data */
    editKatalogBSI: async (sampahId: string, data: EditKatalogRequest) => {
        const fd = new FormData();
        fd.append("nama_sampah", data.nama_sampah);
        fd.append("satuan", data.satuan);
        fd.append("kategori_id", data.kategori_id.toString());
        if (data.foto) fd.append("foto", data.foto);

        const res = await api.patch(`/katalog/bsi/edit-sampah/${sampahId}`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    },

    // ── BSM CRUD ───────────────────────────────────────────────────────────

    /** POST /katalog/bsm/add-sampah/:bank_id — multipart/form-data */
    addKatalogBSM: async (bankId: string, data: AddKatalogBSMRequest) => {
        const fd = new FormData();
        fd.append("nama_sampah", data.nama_sampah);
        fd.append("satuan", data.satuan);
        fd.append("kategori_id", data.kategori_id.toString());
        fd.append("harga_nasabah", data.harga_nasabah.toString());
        fd.append("harga_eksternal", data.harga_eksternal.toString());
        if (data.foto) fd.append("foto", data.foto);

        const res = await api.post(`/katalog/bsm/add-sampah/${bankId}`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    },

    /** PATCH /katalog/bsm/edit-sampah/:sampah_id — multipart/form-data */
    editKatalogBSM: async (sampahId: string, data: EditKatalogRequest) => {
        const fd = new FormData();
        fd.append("nama_sampah", data.nama_sampah);
        fd.append("satuan", data.satuan);
        fd.append("kategori_id", data.kategori_id.toString());
        if (data.foto) fd.append("foto", data.foto);

        const res = await api.patch(`/katalog/bsm/edit-sampah/${sampahId}`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    },

    // ── Shared write ops ───────────────────────────────────────────────────

    /** DELETE /katalog/delete-sampah/:sampah_id */
    deleteKatalogSampah: async (sampahId: string) => {
        const res = await api.delete(`/katalog/delete-sampah/${sampahId}`);
        return res.data;
    },

    /** PATCH /katalog/update-harga/:sampah_id — JSON body */
    updateHargaSchema: async (sampahId: string, data: UpdateHargaSchemaRequest) => {
        const res = await api.patch(`/katalog/update-harga/${sampahId}`, data);
        return res.data;
    },
};
