import { api } from "./api";
import type { NewBSI, GetBSIResponse, GetBSIPagedResponse, GetUnitBSIResponse, GetUnitBSIPagedResponse, AddUnitRequest } from "../types/bsi.type";
import { mockGetUnitPaged } from "../mocks/list-bank";
import { mockGetBsiPaged, mockGetBsiAll } from "../mocks/bsi-list";

const USE_MOCK = false;

export const BsiService = {
    // ... existing methods ...
    async createBsi(data: NewBSI) {
        const formData = new FormData();

        formData.append("nama_bsi", data.nama_bsi);
        formData.append("deskripsi", data.deskripsi);
        if (data.foto) {
            formData.append("foto", data.foto);
        }
        formData.append("provinsi", data.provinsi);
        formData.append("kabupaten_kota", data.kabupaten_kota);
        formData.append("id_kecamatan", data.id_kecamatan);
        formData.append("id_kelurahan", data.id_kelurahan);
        formData.append("alamat_lengkap", data.alamat_lengkap);
        formData.append("latitude", data.latitude.toString());
        formData.append("longitude", data.longitude.toString());

        data.user_id.forEach((id) => {
            formData.append("user_id[]", id);
        });

        formData.append("admin_id", data.admin_id);

        const response = await api.post("/bsi/add-bsi", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        return response.data;
    },

    async getBsi(): Promise<GetBSIResponse> {
        if (USE_MOCK) return mockGetBsiAll();
        const response = await api.get<GetBSIResponse>("/bsi/get-bsi");
        return response.data;
    },

    async getBsiPaged(page: number): Promise<GetBSIPagedResponse> {
        if (USE_MOCK) return mockGetBsiPaged(page);
        const response = await api.get<GetBSIPagedResponse>("/bsi/get-bsi", { params: { page } });
        return response.data;
    },

    async getUnit(bankId: string): Promise<GetUnitBSIResponse> {
        const response = await api.get<GetUnitBSIResponse>(`/bsi/get-unit/${bankId}`);
        return response.data;
    },

    async getUnitPaged(bankId: string, page: number): Promise<GetUnitBSIPagedResponse> {
        if (USE_MOCK) return mockGetUnitPaged(bankId, page);
        const response = await api.get<GetUnitBSIPagedResponse>(`/bsi/get-unit/${bankId}`, {
            params: { page },
        });
        return response.data;
    },

    async addUnit(bankId: string, data: AddUnitRequest) {
        const formData = new FormData();

        formData.append("nama_unit", data.nama_unit);
        formData.append("deskripsi", data.deskripsi);
        if (data.foto) {
            formData.append("foto", data.foto);
        }
        formData.append("provinsi", data.provinsi);
        formData.append("kabupaten_kota", data.kabupaten_kota);
        formData.append("id_kecamatan", data.id_kecamatan);
        formData.append("id_kelurahan", data.id_kelurahan);
        formData.append("alamat_lengkap", data.alamat_lengkap);
        formData.append("latitude", data.latitude.toString());
        formData.append("longitude", data.longitude.toString());

        data.user_id.forEach((id: string) => {
            formData.append("user_id[]", id);
        });

        formData.append("admin_id", data.admin_id);

        const response = await api.post(`/bsi/add-unit/${bankId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        return response.data;
    },

};
