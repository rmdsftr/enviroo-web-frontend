export interface MasterBarang {
    BarangID: number;
    NamaBarang: string;
}

export interface MasterBarangResponse {
    data: MasterBarang[];
}

export interface KatalogBarangItem {
    produk_id: string;
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

export interface GetBarangResponse {
    data: KatalogBarangItem[];
    message: string;
}

export interface BarangMeta {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
}

export interface GetBarangPaginatedResponse {
    data: KatalogBarangItem[];
    message: string;
    pagination: BarangMeta;
}

export interface RiwayatDistribusi {
    disba_id: string;
    tanggal_kirim: string;
    item: number;
    stok_sebelum: number;
    stok_sesudah: number;
}

export interface GetDetailBarangBSUResponse {
    data: {
        riwayat_distribusi: RiwayatDistribusi[];
    };
    message: string;
}

export interface DistribusiBarangItem {
    disba_id: string;
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

export interface ListDistribusiBarangResponse {
    data: DistribusiBarangItem[];
    message: string;
}

export interface DistribusiBarangHeader {
    disba_id: string;
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

export interface DistribusiBarangDetailItem {
    produk_id: string;
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

export interface DistribusiBarangDetailData {
    header: DistribusiBarangHeader;
    items: DistribusiBarangDetailItem[];
}

export interface GetDetailDistribusiBarangResponse {
    data: DistribusiBarangDetailData;
    message: string;
}
