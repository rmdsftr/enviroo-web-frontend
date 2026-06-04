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

export interface GetKatalogDetailResponse {
    data: KatalogDetail;
    message: string;
}

// ── Request payloads ──────────────────────────────────────────

export interface AddKatalogRequest {
    nama_sampah: string;
    satuan: SatuanEnum;
    kategori_id: number;
    reward_id: number;
    syarat_pemilahan?: string;
    foto?: File;
}

export interface EditKatalogRequest {
    nama_sampah: string;
    satuan: SatuanEnum;
    kategori_id: number;
    reward_id: number;
    syarat_pemilahan?: string;
    foto?: File;
}
