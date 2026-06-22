import type { Reward } from "./reward.type";

export type { Reward };

export interface KategoriSampah {
    KategoriID: number;
    Kategori: string;
}

export interface GetKategoriResponse {
    data: KategoriSampah[];
    message: string;
}

export interface MasterSampah{
    SarokID : number;
    NamaSampah : string;
    Satuan : SatuanEnum;
}

export interface MasterSampahResponse{
    data : MasterSampah[];
    message : string;
}

export interface MasterSampahPaginatedResponse {
    data: MasterSampah[];
    total: number;
    page: number;
    limit: number;
}

export interface SampahPerKategoriItem {
    sarok_id: number;
    nama_sampah: string;
    satuan: string;
}

export interface KategoriSampahGroup {
    kategori_id: number;
    kategori: string;
    sampah: SampahPerKategoriItem[];
}

export interface SampahPerKategoriResponse {
    data: KategoriSampahGroup[];
}

export interface SampahFavoritItem {
    sarok_id: number;
    nama_sampah: string;
    satuan: string;
    total_qty: number;
    jumlah_nasabah: number;
    jumlah_setoran: number;
}

export interface SampahFavoritResponse {
    message: string;
    data: SampahFavoritItem[];
}

export interface StatistikSampahItem {
    sarok_id: number;
    nama_sampah: string;
    satuan: string;
    jenis_reward: "Uang" | "Sembako";
    satuan_reward: "Rp" | "poin";
    rata_rata_harga: number;
    jumlah_katalog: number;
}

export interface StatistikSampahResponse {
    message: string;
    data: StatistikSampahItem[];
}

export interface SembakoFavoritItem {
    barang_id: number;
    nama_barang: string;
    total_qty: number;
    total_poin: number;
    jumlah_nasabah: number;
    jumlah_tukar: number;
}

export interface SembakoFavoritResponse {
    message: string;
    data: SembakoFavoritItem[];
}

export interface StatistikSembakoItem {
    barang_id: number;
    nama_barang: string;
    rata_rata_poin: number;
    jumlah_katalog: number;
}

export interface StatistikSembakoResponse {
    message: string;
    data: StatistikSembakoItem[];
}

export interface MasterSembako {
    BarangID: number;
    NamaBarang: string;
}

export interface MasterSembakoPaginatedResponse {
    data: MasterSembako[];
    total: number;
    page: number;
    limit: number;
}

export type SatuanEnum = "kg" | "pcs" | "liter";
export type LevelUser = "nasabah" | "eksternal";
export type SatuanReward = "Rp" | "poin";

export interface HargaPerLevel {
    schema_id: number;
    level_user: LevelUser;
    harga: number;
    satuan_reward: SatuanReward;
}

export interface KatalogHistoryItem {
    history_id: number;
    schema_id: number;
    level_user: LevelUser;
    harga_lama: number;
    harga_baru: number;
    changed_at: string;
    changed_by_id: string;
    changed_by_nama: string;
}

export interface KatalogSampah {
    sampah_id: string;
    nama_sampah: string;
    photo_url: string;
    satuan: SatuanEnum;
    bank_id: string;
    kategori_id: number;
    reward_id: number;
    syarat_pemilahan: string;
    stok: number;
    kategori: KategoriSampah;
    reward: Reward;
}

export interface KatalogDetail {
    sampah_id: string;
    nama_sampah: string;
    photo_url: string;
    satuan: SatuanEnum;
    bank_id: string;
    syarat_pemilahan: string;
    kategori: KategoriSampah;
    reward: Reward;
    stok: number;
    harga_per_level: HargaPerLevel[];
    history_harga: KatalogHistoryItem[];
}

export interface GetKatalogResponse {
    data: KatalogSampah[];
    message: string;
}

export interface KatalogSampahMeta {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
}

export interface GetKatalogPaginatedResponse {
    data: KatalogSampah[];
    message: string;
    pagination: KatalogSampahMeta;
}

export interface GetKatalogDetailResponse {
    data: KatalogDetail;
    message: string;
}

// ── Request payloads ──────────────────────────────────────────

export interface AddKatalogRequest {
    nama_sampah: string;
    sarok_id? : number;
    satuan: SatuanEnum;
    kategori_id: number;
    reward_id: number;
    syarat_pemilahan?: string;
    foto?: File;
}

export interface EditKatalogRequest {
    syarat_pemilahan?: string;
    foto?: File;
}
