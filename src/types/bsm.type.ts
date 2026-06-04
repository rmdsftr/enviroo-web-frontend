export interface NewBSM {
    nama_bsm: string;
    deskripsi: string;
    provinsi: string;
    kabupaten_kota: string;
    id_kecamatan: string;
    id_kelurahan: string;
    alamat_lengkap: string;
    latitude: number;
    longitude: number;
    user_id: string[];
    foto: File | null;
    admin_id: string;
}

export interface BSMData {
    bank_id: string;
    nama_bsm: string;
    photo_url: string;
    is_active: boolean;
    jumlah_nasabah: number;
    jumlah_staff: number;
}

export interface GetBSMResponse {
    message: string;
    data: BSMData[];
}
