import { api } from "./api";

export interface SuperadminItem {
    admin_id: string;
    user_id: string;
    nama: string;
    email: string;
    no_whatsapp: string;
    photo_url: string;
    status_admin: string;
    joined_at: string;
}

export interface AddSuperadminRequest {
    user_id: string;
    nama: string;
    email: string;
    no_whatsapp: string;
}

export const SuperadminService = {
    async getList(): Promise<SuperadminItem[]> {
        const res = await api.get<{ message: string; data: SuperadminItem[] }>("/superadmin/list");
        return res.data.data ?? [];
    },

    async add(data: AddSuperadminRequest): Promise<{ admin_id: string; nama: string }> {
        const res = await api.post<{ message: string; data: { admin_id: string; nama: string } }>("/superadmin/add", data);
        return res.data.data;
    },

    async nonaktifkan(adminId: string): Promise<void> {
        await api.patch(`/superadmin/nonaktif/${adminId}`);
    },

    async exportLaporan(): Promise<Blob> {
        const response = await api.get("/laporan/bank-sampah", { responseType: "blob" });
        return response.data;
    },
};
