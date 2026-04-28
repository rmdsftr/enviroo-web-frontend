export interface NewUser {
    user_id: string;
    nama: string;
    email: string;
    no_whatsapp: string;
}

export interface NonAdminUser {
    UserID: string;
    Nama: string;
    Email: string;
    PhotoURL: string;
}

export interface GetNonAdminUsersResponse {
    data: NonAdminUser[];
    message: string;
}

export interface GetNonNasabahUsersResponse {
    data: NonAdminUser[];
    message: string;
}