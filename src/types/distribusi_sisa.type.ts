export interface PerhitunganSisaItem {
    tabungan_id: string;
    nama_sampah: string;
    qty_dipakai: number;
    satuan: string;
}

export interface DistribusiSisaBsuDetail {
    penerima_sisa_id: string;
    distribusi_id: string;
    bagi_hasil_id: string;
    bank_id: string;
    nama_bank: string;
    nominal_diterima: number;
    porsi: number;
    transportasi: number;
    satuan_nominal: string;
    diantar_oleh: string;
    tanggal_distribusi: string;
    perhitungan_sisa: PerhitunganSisaItem[];
}

export interface BagiHasilBsuItem {
    penerima_sisa_id: string;
    distribusi_id: string;
    bagi_hasil_id: string;
    nominal_diterima: number;
    porsi: number;
    transportasi: number;
    satuan_nominal: string;
    diantar_oleh: string;
    tanggal_distribusi: string;
}

export interface PenerimaSisa {
    penerima_sisa_id: string;
    bank_id: string;
    nama_bank: string;
    nominal_diterima: number;
    porsi: number;
    transportasi: number;
    satuan_nominal: string;
}

export interface DistribusiSisaDetail {
    distribusi_id: string;
    bagi_hasil_id: string;
    created_at: string;
    created_by: string;
    satuan: string;
    total_sisa: number;
    penerima_bsi: PenerimaSisa;
    penerima_bsu: PenerimaSisa[];
}

export interface KonfigurasiSisa {
    setting_id: string;
    bank_id: string;
    nama_bank: string;
    porsi_bsu: number;
    porsi_bsi: number;
    porsi_transport: number;
    total_porsi: number;
}

export interface AddKonfigurasiSisaRequest {
    porsi_bsu: number;
    porsi_bsi: number;
    porsi_transport: number;
}

export interface UpdateKonfigurasiSisaRequest {
    porsi_bsu?: number;
    porsi_bsi?: number;
    porsi_transport?: number;
}
