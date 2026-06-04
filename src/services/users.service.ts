import { api } from "./api";
import type { NewUser, GetNonAdminUsersResponse, GetNonNasabahUsersResponse } from "../types/users.type";

export interface AllUserItem {
    user_id: string;
    nama_user: string;
    email: string;
    foto: string;
    roles: string[];
}

export const UsersService = {
    async getDetailUser(userId: string): Promise<{
        message: string;
        data: {
            user_id: string;
            nama: string;
            email: string;
            no_whatsapp: string;
            photo_url: string;
            created_at: string;
            akun_nasabah: Array<{
                nasabah_id: string;
                nomor_rekening: string;
                status: string;
                afiliasi: string;
                joined_at: string;
            }>;
            akun_admin: Array<{
                admin_id: string;
                role: string;
                status: string;
                afiliasi: string;
                joined_at: string;
            }>;
        };
    }> {
        const response = await api.get(`/users/detail-user/${userId}`);
        return response.data;
    },
    async getAllUsers(params?: { page?: number; limit?: number }): Promise<{
        data: AllUserItem[];
        pagination: { page: number; limit: number; total_items: number; total_pages: number };
    }> {
        const response = await api.get("/users/get-all", { params });
        return response.data;
    },
    async createUsers(data: NewUser) {
        const response = await api.post("/users/add-user", data);
        return response.data;
    },
    async getNonAdminUsers(): Promise<GetNonAdminUsersResponse> {
        const response = await api.get<GetNonAdminUsersResponse>("/users/get-nonadmin-user");
        return response.data;
    },
    async getNonNasabahUsers(): Promise<GetNonNasabahUsersResponse> {
        const response = await api.get<GetNonNasabahUsersResponse>("/users/get-nonnasabah-user");
        return response.data;
    },
    async getNonAdminNonNasabahUsers(bank_id: string): Promise<GetNonAdminUsersResponse> {
        const response = await api.get<GetNonAdminUsersResponse>(`/users/get-nonadmin-nonnasabah/${bank_id}`);
        return response.data;
    },
    async getNonNasabahNonAdminBSI(bank_id: string): Promise<GetNonAdminUsersResponse> {
        const response = await api.get<GetNonAdminUsersResponse>(`/users/get-nonnasabah-nonadmin-bsi/${bank_id}`);
        return response.data;
    },
    async deleteUser(user_id: string): Promise<{ message: string }> {
        const response = await api.delete(`/users/delete-user/${user_id}`);
        return response.data;
    },
}