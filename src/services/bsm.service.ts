import { api } from "./api";
import type { NewBSM, GetBSMResponse } from "../types/bsm.type";

export const BsmService = {
    async createBsm(data: NewBSM) {
        const formData = new FormData();
        
        formData.append("nama_bsm", data.nama_bsm);
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

        const response = await api.post("/bsm/add-bsm", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        
        return response.data;
    },

    async getBsm(): Promise<GetBSMResponse> {
        const response = await api.get<GetBSMResponse>("/bsm/get-bsm");
        return response.data;
    }
};
