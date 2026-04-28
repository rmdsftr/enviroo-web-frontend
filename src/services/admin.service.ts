import { api } from "./api";
import type { AdminBankSampahResponse } from "../types/admin.type";

export const AdminService = {
    async getAdminByBankId(bank_id: string): Promise<AdminBankSampahResponse> {
        const response = await api.get<AdminBankSampahResponse>(`/admin/get-admin/${bank_id}`);
        return response.data;
    },

    async addAdmin(bank_id: string, user_id: string, role: string, admin_id: string): Promise<any> {
        const response = await api.post(`/admin/add-admin-bank-sampah`, { bank_id, user_id, role, admin_id });
        return response.data;
    },

    async deleteAdmin(admin_id: string, deleted_by: string): Promise<any> {
        const response = await api.delete(`/admin/delete-staff/${admin_id}`, {
            data: { deleted_by }
        });
        return response.data;
    }
};
