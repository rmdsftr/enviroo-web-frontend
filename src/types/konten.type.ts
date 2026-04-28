export interface KontenItem {
    KontenID: string;
    Judul: string;
    Deskripsi: string;
    Body: string;        // JSON string of BodyBlock[]
    Thumbnail: string;
    IsUploaded: boolean; // true = published, false = draft
    BankID: string;
    AdminID: string;
    nama_admin: string;  // Added author name field
    CreatedAt: string;
    UpdatedAt: string;
}

export interface GetAllKontenResponse {
    data: KontenItem[];
    message: string;
}

export interface BodyBlock {
    type: "text" | "image";
    content?: string;
    media_url?: string;
    index?: number;
}

export interface AddKontenResponse {
    message: string;
    data: KontenItem;
}

export interface GetKontenByIdResponse {
    message: string;
    data: KontenItem;
}
