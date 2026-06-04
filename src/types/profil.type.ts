export interface BankSampahProfile {
    bank_id: string;
    nama_bank: string;
    jenis_bank: string;
    foto?: string;
    deskripsi?: string;
    provinsi?: string;
    kabupaten_kota?: string;
    kecamatan?: string;
    kelurahan?: string;
    alamat_lengkap?: string;
    parent_id?: string;
    bank_induk?: string;
    is_active: boolean;
}

export interface GetBankSampahProfileResponse {
    message: string;
    data: BankSampahProfile;
}

export interface ProfilNasabah {
    nasabah_id: string;
    bank_id: string;
    user_id: string;
    joined_at: string;
    status_nasabah: string;
    nama: string;
    email: string;
    no_whatsapp: string;
    photo_url: string;
    nomor_rekening: string;
    nama_bank: string;
    is_admin: boolean;
    admin_id?: string;
    role_admin?: string;
    nama_bank_admin?: string;
}

export interface GetProfilNasabahResponse {
    message: string;
    data: ProfilNasabah;
}

export interface SaldoNasabah {
    uang: { total_uang: number; satuan_uang: string };
    poin: { total_poin: number; satuan_poin: string };
}

export interface GetSaldoNasabahResponse {
    message: string;
    data: SaldoNasabah;
}

export interface DetailBankAdmin {
    admin_id: string;
    nama_admin: string;
    photo_url: string;
    role_admin: string;
}

export interface DetailBank {
    bank_id: string;
    nama_bank: string;
    photo_url: string;
    is_bsu: boolean;
    bank_induk_nama: string;
    jenis_bank: string;
    alamat: string;
    provinsi: string;
    kabupaten_kota: string;
    kecamatan: string;
    kelurahan: string;
    deskripsi: string;
    is_active: boolean;
    joined_at: string;
    latitude: number;
    longitude: number;
    admins: DetailBankAdmin[];
}

export interface GetDetailBankResponse {
    message: string;
    data: DetailBank;
}

export interface SaldoBank {
    uang: { total_uang: number; satuan_uang: string };
    poin: { total_poin: number; satuan_poin: string };
}

export interface GetSaldoBankResponse {
    message: string;
    data: SaldoBank;
}

export interface HistoryAkunBank {
    history_bank_id: string;
    bank_id: string;
    action: string;
    old_value: any;
    new_value: any;
    informasi: string;
    keterangan: string;
    created_at: string;
    created_by_name: string;
}

export interface GetHistoryAkunBankResponse {
    message: string;
    data: HistoryAkunBank[];
}
