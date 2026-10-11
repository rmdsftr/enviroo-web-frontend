import type { StatusNasabah, NasabahRow } from "../constants/nasabah.constants";
import type { BsiNasabahItem } from "../types/bsi.type";

export function mapBsiNasabah(data: BsiNasabahItem[]): NasabahRow[] {
    return (data || []).map((item) => ({
        id: item.nasabah_id,
        foto: item.foto || undefined,
        nama: item.nama || "-",
        email: item.email || "-",
        status: (item.status as StatusNasabah) || "pending",
    }));
}

export function computeNasabahStats(list: NasabahRow[]) {
    return {
        total: list.length,
        aktif: list.filter((n) => n.status === "aktif").length,
        nonaktif: list.filter((n) => n.status === "nonaktif").length,
        pending: list.filter((n) => n.status === "pending").length,
    };
}
