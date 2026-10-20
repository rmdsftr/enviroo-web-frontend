import type { SatuanSampah } from "../types/katalog.type";

export const SATUAN_PALETTE = [
    "#013236",
    "#94DF0C",
    "#4EA771",
    "#0ea5e9",
    "#f59e0b",
    "#1B6E5A",
    "#7DC468",
    "#025C5B",
];

export const SATUAN_FALLBACK_COLOR = "#a0b5a8";

export function isSameSatuan(a: string, b: string): boolean {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function findSatuanByNama(satuanList: SatuanSampah[], nama: string): SatuanSampah | undefined {
    return satuanList.find(s => isSameSatuan(s.Satuan, nama));
}

export function getSatuanColor(satuanList: SatuanSampah[], nama: string): string {
    const target = findSatuanByNama(satuanList, nama);
    if (!target) return SATUAN_FALLBACK_COLOR;
    const urutan = satuanList.filter(s => s.SatuanID < target.SatuanID).length;
    return SATUAN_PALETTE[urutan % SATUAN_PALETTE.length];
}
