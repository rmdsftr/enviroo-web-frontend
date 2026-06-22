export interface MasterSembako {
    BarangID: number;
    NamaBarang: string;
}

export interface MasterSembakoResponse {
    data: MasterSembako[];
}

export interface KatalogSembakoItem {
    sembako_id: string;
    bank_id: string | null;
    barang_id: number;
    nama_barang: string;
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

export interface SembakoMeta {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
}

export interface GetSembakoPaginatedResponse {
    data: KatalogSembakoItem[];
    message: string;
    pagination: SembakoMeta;
}

export interface RiwayatDistribusi {
    disbako_id: string;
    tanggal_kirim: string;
    item: number;
    stok_sebelum: number;
    stok_sesudah: number;
}

export interface GetDetailSembakoBSUResponse {
    data: {
        riwayat_distribusi: RiwayatDistribusi[];
    };
    message: string;
}

export interface DistribusiSembakoItem {
    disbako_id: string;
    bsi_id: string;
    nama_bsi: string;
    bsu_id: string;
    nama_bsu: string;
    nama_admin_bsi: string;
    nama_admin_bsu: string;
    created_at: string;
    total_item: number;
    total_poin: number;
    status_distribusi: "pending" | "selesai" | "gagal";
}

export interface ListDistribusiSembakoResponse {
    data: DistribusiSembakoItem[];
    message: string;
}

export interface DistribusiSembakoHeader {
    disbako_id: string;
    bsi_id: string;
    nama_bsi: string;
    bsu_id: string;
    nama_bsu: string;
    nama_admin_bsi: string;
    nama_admin_bsu: string;
    created_at: string;
    total_item: number;
    total_poin: number;
    status_distribusi: "pending" | "selesai" | "gagal";
}

export interface DistribusiSembakoDetailItem {
    sembako_id: string;
    nama_barang: string;
    photo_url: string | null;
    nilai_poin: number;
    item: number;
    subtotal_poin: number;
    stok_bsi_sebelum: number;
    stok_bsi_sesudah: number;
    stok_bsu_sebelum: number;
    stok_bsu_sesudah: number;
}

export interface DistribusiSembakoDetailData {
    header: DistribusiSembakoHeader;
    items: DistribusiSembakoDetailItem[];
}

export interface GetDetailDistribusiSembakoResponse {
    data: DistribusiSembakoDetailData;
    message: string;
}
