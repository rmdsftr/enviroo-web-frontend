export interface BankSampahProfile {
    bank_id: string;
    nama_bank: string;
    jenis_bank: string;
    foto?: string;
    deskripsi?: string;
    provinsi?: string;
    kabupaten_kota?: string;
    kecamatan?: string;
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
    foto: string;
    created_at: string;
    updated_at: string;
    bsi_id: string | null;
    nama_bsi: string | null;
    bsu_id: string | null;
    nama_bsu: string | null;
    saldo_poin: number;
}

export interface GetProfilNasabahResponse {
    message: string;
    data: ProfilNasabah;
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
