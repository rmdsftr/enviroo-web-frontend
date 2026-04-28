import { api } from "./api";
import type { NewBSI, GetBSIResponse, GetUnitBSIResponse, AddUnitRequest, GetNasabahBSIResponse } from "../types/bsi.type";

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
        formData.append("kecamatan", data.kecamatan);
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
        const response = await api.get<GetBSIResponse>("/bsi/get-bsi");
        return response.data;
    },

    async getUnit(bankId: string): Promise<GetUnitBSIResponse> {
        const response = await api.get<GetUnitBSIResponse>(`/bsi/get-unit/${bankId}`);
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
        formData.append("kecamatan", data.kecamatan);
        formData.append("alamat_lengkap", data.alamat_lengkap);
        formData.append("latitude", data.latitude.toString());
        formData.append("longitude", data.longitude.toString());

        data.user_id.forEach((id: string) => {
            formData.append("user_id[]", id);
        });

        const response = await api.post(`/bsi/add-unit/${bankId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        return response.data;
    },

    async getNasabahBSI(bankId: string): Promise<GetNasabahBSIResponse> {
        const response = await api.get<GetNasabahBSIResponse>(`/bsi/get-nasabah/${bankId}`);
        return response.data;
    }
};
