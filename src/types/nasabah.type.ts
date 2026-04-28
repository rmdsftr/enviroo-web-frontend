export interface NasabahAfiliasi {
    BankID: string;
    NamaBank: string;
}

export interface GetNasabahAfiliasiResponse {
    message: string;
    data: NasabahAfiliasi[];
}

export interface NewNasabah {
    user_id: string;
    nama: string;
    email: string;
    no_whatsapp: string;
    bank_id: string;
    admin_id: string;
}

export interface AddNasabahOldUserPayload {
    user_id: string;
    bank_id: string;
    admin_id: string;
}

export interface NasabahListData {
    nasabah_id: string;
    nama_nasabah: string;
    foto: string;
    bank_sampah_pusat: string;
    bank_sampah_unit: string;
    status_nasabah: string;
}

export interface GetNasabahResponse {
    message: string;
    data: NasabahListData[];
}

export interface NasabahBankSampah {
    nasabah_id: string;
    nama_nasabah: string;
    foto: string;
    bank_sampah_pusat: string;
    bank_sampah_unit: string;
    status_nasabah: string;
}

export interface NasabahBankSampahResponse {
    message: string;
    data: NasabahBankSampah[];
}
