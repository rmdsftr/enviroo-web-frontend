export interface KategoriSampah {
    KategoriID: number;
    Kategori: string;
}

export interface GetKategoriResponse {
    data: KategoriSampah[];
    message: string;
}

export type SatuanEnum = "kg" | "pcs" | "liter";

export type LevelUser = "nasabah" | "bsu" | "eksternal";

export interface SchemaHarga {
    level_user: LevelUser;
    poin_harga: number;
}

export interface KatalogSampah {
    sampah_id: string;
    nama_sampah: string;
    photo_url: string;
    satuan: SatuanEnum;
    bank_id: string;
    kategori_id: number;
    stok: number;
    kategori: KategoriSampah;
    harga: SchemaHarga[];
}

export interface GetKatalogResponse {
    data: KatalogSampah[];
    message: string;
}

// History response item — PascalCase because backend model lacks JSON tags
export interface KatalogHistoryResponseItem {
    HistorySampahID: number;
    SampahID: string;
    LevelUser: LevelUser;
    OldPoin: number;
    NewPoin: number;
    ChangedAt: string;
    ChangedBy: string;
    admin_nama: string; // explicitly tagged in DTO
}

export interface GetKatalogHistoryResponse {
    data: KatalogHistoryResponseItem[];
    message: string;
}

// ── Request payloads ──────────────────────────────────────────

/** BSI add: 3 price levels (nasabah, bsu, eksternal) */
export interface AddKatalogBSIRequest {
    nama_sampah: string;
    satuan: SatuanEnum;
    kategori_id: number;
    harga_nasabah: number;
    harga_bsu: number;
    harga_eksternal: number;
    foto?: File;
}

/** BSM add: 2 price levels (nasabah, eksternal) — no BSU */
export interface AddKatalogBSMRequest {
    nama_sampah: string;
    satuan: SatuanEnum;
    kategori_id: number;
    harga_nasabah: number;
    harga_eksternal: number;
    foto?: File;
}

/** Edit item (non-harga fields) — same for BSI and BSM */
export interface EditKatalogRequest {
    nama_sampah: string;
    satuan: SatuanEnum;
    kategori_id: number;
    foto?: File;
}

/** Update one schema harga */
export interface UpdateHargaSchemaRequest {
    level_user: LevelUser;
    poin_harga_baru: number;
    changed_by: string; // admin_id
}
