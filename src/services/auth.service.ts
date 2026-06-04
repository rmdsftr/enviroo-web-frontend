import { api } from "./api";
import type { LoginRequest, LoginResponse, ReactivateNasabahResponse } from "../types/auth.type";

export const AuthService = {
    async login(data: LoginRequest): Promise<LoginResponse> {
        const response = await api.post<LoginResponse>("/auth/login", data);
        return response.data;
    },
    
    async logout(): Promise<any> {
        const response = await api.post("/auth/logout");
        return response.data;
    },
    
    async refreshToken(): Promise<any> {
        const response = await api.post("/auth/refresh");
        return response.data;
    },

    async aktivasiAkun(payload: any): Promise<any> {
        const response = await api.post("/auth/aktivasi-akun", payload);
        return response.data;
    },

    async generateReactivateAkun(user_id: string, admin_id: string, role: string): Promise<ReactivateNasabahResponse> {
        const response = await api.post<ReactivateNasabahResponse>("/auth/generate-reactivate-akun", { user_id, admin_id, role });
        return response.data;
    },

    async deactivateAkun(user_id: string, role: string): Promise<any> {
        const response = await api.post("/auth/deactivate-akun", { user_id, role });
        return response.data;
    },

    async reactivateAkun(user_id: string, otp: string): Promise<any> {
        const response = await api.post("/auth/reactivate-akun", { user_id, otp });
        return response.data;
    },

    async sendEmailForgetPassword(email: string): Promise<any> {
        const response = await api.post("/auth/forget-password/send-email", { email });
        return response.data;
    },

    async verifikasiOTPForgetPassword(email: string, otp: string): Promise<any> {
        const response = await api.post("/auth/forget-password/verifikasi-otp", { email, otp });
        return response.data;
    },

    async resetPassword(email: string, otp: string, password_baru: string, konfirmasi_password_baru: string): Promise<any> {
        const response = await api.post("/auth/forget-password/reset-password", { email, otp, password_baru, konfirmasi_password_baru });
        return response.data;
    },

    async changePassword(data: { password_lama: string; password_baru: string; konfirmasi_password_baru: string }): Promise<any> {
        const response = await api.post("/auth/change-password", data);
        return response.data;
    },
};