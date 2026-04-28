import { api } from "./api";
import type { NewUser, GetNonAdminUsersResponse, GetNonNasabahUsersResponse } from "../types/users.type";

export const UsersService = {
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
    }
}