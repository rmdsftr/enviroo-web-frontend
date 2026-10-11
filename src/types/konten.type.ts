export interface KontenItem {
    KontenID: string;
    Judul: string;
    Deskripsi: string;
    Body: string;
    Thumbnail: string;
    IsUploaded: boolean;
    BankID?: string;
    AdminID: string;
    nama_admin: string;
    CreatedAt: string;
    UpdatedAt: string;
    nama_instansi?: string;
}

export interface KontenListItem {
    konten_id: string;
    judul: string;
    deskripsi: string;
    thumbnail: string;
    nama_instansi: string;
}

export interface KontenPagination {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
}

export interface GetAllKontenResponse {
    message: string;
    data: KontenListItem[];
    pagination: KontenPagination;
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
