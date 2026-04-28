export interface AdminBankSampah {
    admin_id: string;
    user_id: string;
    nama: string;
    foto: string;
    email: string;
    role: string;
    status_admin: "aktif"| "nonaktif" | "pending";
}

export interface AdminBankSampahResponse {
    message: string;
    data: AdminBankSampah[];
}
