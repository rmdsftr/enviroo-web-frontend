import type { LevelUser } from "./katalog.type";

export interface SembakoHargaSchema {
    level_user: LevelUser;
    poin_harga: number;
}

export interface KatalogSembakoItem {
    sembako_id: string;
    nama_sembako: string;
    photo_url: string;
    stok: number;
    schema_harga: SembakoHargaSchema[];
}

export interface GetSembakoResponse {
    data: KatalogSembakoItem[];
    message: string;
}

// History response — PascalCase because backend model lacks JSON tags
export interface SembakoHistoryItem {
    HistorySembakoID: number;
    SembakoID: string;
    LevelUser: LevelUser;
    PoinLama: number;
    PoinBaru: number;
    ChangedBy: string;
    ChangedAt: string;
}

export interface GetSembakoHistoryResponse {
    data: SembakoHistoryItem[];
    message: string;
}
