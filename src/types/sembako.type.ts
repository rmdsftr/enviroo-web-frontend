export interface KatalogSembakoItem {
    sembako_id: string;
    bank_id: string | null;
    nama_sembako: string;
    photo_url: string | null;
    nilai_poin: number;
    stok: number;
    created_at: string;
    created_by: string | null;
    updated_at: string;
    updated_by: string | null;
}

export interface GetSembakoResponse {
    data: KatalogSembakoItem[];
    message: string;
}

export interface RiwayatDistribusi {
    distribusi_id: string;
    tanggal_kirim: string;
    stok_terdistribusi: number;
    nama_admin_bsi: string;
    nama_admin_bsu: string;
}

export interface GetDetailSembakoBSUResponse {
    data: {
        sembako: KatalogSembakoItem;
        riwayat_distribusi: RiwayatDistribusi[];
    };
    message: string;
}
