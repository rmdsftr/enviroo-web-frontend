export interface NewBSU {
    nama_bsu: string;
    parent_bank_id: string; // Wajib: Mengaitkan BSU ini dengan BSI mana
    deskripsi: string;
    provinsi: string;
    kabupaten_kota: string;
    id_kecamatan: string;
    id_kelurahan: string;
    alamat_lengkap: string;
    latitude: number;
    longitude: number;
    user_id: string[]; // Bisa lebih dari 1 ID user (sebagai admin BSU)
    foto: File | null; // File gambar untuk profil BSU
    admin_id: string;
}

export interface BSUData {
    bank_id: string;
    nama_bsu: string;
    photo_url: string;
    is_active: boolean;
    nama_bank_induk: string;
    jumlah_nasabah: number;
    jumlah_staff: number;
}

export interface GetBSUResponse {
    message: string;
    data: BSUData[];
}

export interface GetBSUPagedResponse {
    message: string;
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
    data: BSUData[];
}

export interface BSUByBankId {
    bank_id: string;
    nama_bsu: string;
    jumlah_nasabah: number;
    jumlah_staff: number;
    is_active: boolean;
}

export interface BSUByBankIdResponse {
    message: string;
    data: BSUByBankId[];
}
