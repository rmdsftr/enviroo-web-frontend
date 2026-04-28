export interface NewBSU {
    nama_bsu: string;
    parent_bank_id: string; // Wajib: Mengaitkan BSU ini dengan BSI mana
    deskripsi: string;
    provinsi: string;
    kabupaten_kota: string;
    kecamatan: string;
    alamat_lengkap: string;
    latitude: number;
    longitude: number;
    user_id: string[]; // Bisa lebih dari 1 ID user (sebagai admin BSU)
    foto: File | null; // File gambar untuk profil BSU
}

export interface BSUData {
    BankID: string;            
    NamaBank: string;          // Nama BSU
    ParentBankID: string;      
    nama_bsi: string;          // (BARU) Nama BSI yang menaungi BSU ini
    PhotoURL: string;          
    IsActive: boolean;        
    jumlah_nasabah: number;    
}

export interface GetBSUResponse {
    message: string;
    data: BSUData[];
}

export interface BSUByBankId {
    bank_id: string;
    nama_bsu: string;
    jumlah_nasabah: number;
    is_active: boolean;
}

export interface BSUByBankIdResponse {
    message: string;
    data: BSUByBankId[];
}
