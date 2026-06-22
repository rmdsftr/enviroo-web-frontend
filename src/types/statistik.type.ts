export interface BankSampahStatistik {
    bsi: number;
    bsm: number;
    bsu: number;
}

export interface GetBankSampahStatistikResponse {
    message: string;
    data: BankSampahStatistik;
}

export interface BankTypeStats {
    aktif: number;
    nonaktif: number;
    total: number;
}

export interface SuperadminRingkasan {
    bank: {
        bsi: BankTypeStats;
        bsm: BankTypeStats;
        bsu: BankTypeStats;
    };
    nasabah: {
        aktif: number;
        pending: number;
        nonaktif: number;
        total: number;
    };
}

export interface GetSuperadminRingkasanResponse {
    message?: string;
    bank: SuperadminRingkasan["bank"];
    nasabah: SuperadminRingkasan["nasabah"];
}

export interface TrenPenjualanBulan {
    bulan: number;
    uang: number;
    sembako: number;
}

export interface TrenPenjualanSuperadminResponse {
    tahun: number;
    data: TrenPenjualanBulan[];
}

export interface MasukSampahItem {
    sampah_id: string;
    nama_sampah: string;
    satuan: string;
    kategori: string;
    total_masuk: number;
    stok_tersisa: number;
}

export interface MasukSampahResponse {
    bank: { bank_id: string; nama_bank: string };
    data: MasukSampahItem[];
}

export interface PenjualanSampahItem {
    sampah_id: string;
    nama_sampah: string;
    satuan: string;
    kategori: string;
    jenis_reward: string;
    total_qty: number;
    total_nilai: number;
    satuan_nilai: string;
}

export interface PenjualanSampahResponse {
    bank: { bank_id: string; nama_bank: string; jenis_bank: string };
    data: PenjualanSampahItem[];
}

export interface RankingBankItem {
    BankID: string;
    NamaBank: string;
    JenisBank: string;
    TotalUang: number;
    TotalSembako: number;
    JumlahPenjualan: number;
}

export interface RankingBankResponse {
    periode: string;
    data: RankingBankItem[];
}

export interface VolumeSampahItem {
    bulan: number;
    tahun: number;
    satuan: string;
    total_qty: number;
}

export interface VolumeSampahResponse {
    data: VolumeSampahItem[];
}
