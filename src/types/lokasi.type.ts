export interface KecamatanBankItem {
    bank_id: string;
    nama_bank: string;
}

export interface StatistikKecamatan {
    id_kecamatan: number;
    kecamatan: string;
    jumlah_bank: number;
    banks: KecamatanBankItem[];
}

export interface StatistikKecamatanResponse {
    message: string;
    data: StatistikKecamatan[];
}

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

export interface Kecamatan {
    id_kecamatan: number;
    kecamatan: string;
}

export interface KecamatanResponse {
    message: string;
    data: Kecamatan[];
}

export interface Kelurahan {
    id_kelurahan: number;
    id_kecamatan: number;
    kelurahan: string;
    Kecamatan?: Kecamatan;
}

export interface KelurahanResponse {
    message: string;
    data: Kelurahan[];
}

export interface KelurahanPaginatedResponse {
    message: string;
    data: Kelurahan[];
    pagination: {
        page: number;
        limit: number;
        total_items: number;
        total_pages: number;
    };
}
