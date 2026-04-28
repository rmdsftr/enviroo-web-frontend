export interface BankSampahLokasi {
    bank_id: string;
    nama_bank: string;
    jenis_bank: string;
    latitude: number;
    longitude: number;
}

export interface BankSampahLokasiResponse {
    message: string;
    data: BankSampahLokasi[];
}
