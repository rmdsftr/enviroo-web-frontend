import { api } from "./api";
import type { NewBSU, GetBSUResponse, BSUByBankIdResponse } from "../types/bsu.type";

export const BsuService = {
    async createBsu(data: NewBSU) {
        const formData = new FormData();
        
        formData.append("nama_bsu", data.nama_bsu);
        formData.append("parent_bank_id", data.parent_bank_id);
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

        const response = await api.post("/bsu/add-bsu", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        
        return response.data;
    },

    async getBsu(): Promise<GetBSUResponse> {
        const response = await api.get<GetBSUResponse>("/bsu/get-bsu");
        return response.data;
    },

    async getBsuByBankId(bank_id: string): Promise<BSUByBankIdResponse> {
        const response = await api.get<BSUByBankIdResponse>(`/bsu/get-bsu/${bank_id}`);
        return response.data;
    }
};
