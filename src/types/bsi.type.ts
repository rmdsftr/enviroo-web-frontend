export interface NewBSI {
    nama_bsi: string;
    deskripsi: string;
    foto: File;
    provinsi: string;
    kabupaten_kota: string;
    id_kecamatan: string;
    id_kelurahan: string;
    alamat_lengkap: string;
    latitude: number;
    longitude: number;
    user_id: string[];
    admin_id: string;
}

export interface BSIData {
    BankID: string;
    NamaBank: string;
    PhotoURL: string;
    IsActive: boolean;
    jumlah_bsu: number;
    jumlah_nasabah: number;
}

export interface GetBSIResponse {
    data: BSIData[];
    message: string;
}

export interface UnitBSI {
    BankID: string;
    NamaBank: string;
    PhotoURL: string;
    jumlah_nasabah: number;
    IsActive: boolean;
}

export interface GetUnitBSIResponse {
    data: UnitBSI[];
    message: string;
}

export interface AddUnitRequest {
    nama_unit: string;
    deskripsi: string;
    foto: File;
    provinsi: string;
    kabupaten_kota: string;
    id_kecamatan: string;
    id_kelurahan: string;
    alamat_lengkap: string;
    latitude: number;
    longitude: number;
    user_id: string[];
    admin_id: string;
}

export interface BsiNasabahUser {
    UserID: string;
    Nama: string;
    Email: string;
    NoWhatsapp: string;
    PhotoURL: string;
}

export interface BsiNasabahItem {
    nasabah_id: string;
    nama: string;
    email: string;
    foto: string;
    status: string;
}

export interface GetNasabahBSIResponse {
    message: string;
    data: BsiNasabahItem[];
}
