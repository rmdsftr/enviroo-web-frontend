export interface NewBSM {
    nama_bsm: string;
    deskripsi: string;
    provinsi: string;
    kabupaten_kota: string;
    kecamatan: string;
    alamat_lengkap: string;
    latitude: number;
    longitude: number;
    user_id: string[];
    foto: File | null;
}

export interface BSMData {
    BankID: string;
    NamaBank: string;
    PhotoURL: string;
    IsActive: boolean;
    jumlah_nasabah: number;
}

export interface GetBSMResponse {
    message: string;
    data: BSMData[];
}
