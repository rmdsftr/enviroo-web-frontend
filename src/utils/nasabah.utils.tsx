import type { StatusNasabah, NasabahRow } from "../constants/nasabah.constants";
import type { BsiNasabahItem } from "../types/bsi.type";

// ── Map BSI nasabah API response → NasabahRow[] ─────────
export function mapBsiNasabah(data: BsiNasabahItem[]): NasabahRow[] {
    return (data || []).map((item) => ({
        id: item.nasabah_id,
        foto: item.foto || undefined,
        nama: item.nama || "-",
        email: item.email || "-",
        status: (item.status as StatusNasabah) || "pending",
    }));
}

// ── Map Superadmin nasabah API response → NasabahRow[] ───
export function mapSuperadminNasabah(data: any[]): NasabahRow[] {
    return (data || []).map((item) => ({
        id: item.nasabah_id,
        foto: item.foto || undefined,
        nama: item.nama_nasabah || "-",
        pusat: item.bank_sampah_pusat || "-",
        unit: item.bank_sampah_unit || "-",
        status: (item.status_nasabah as StatusNasabah) || "aktif",
    }));
}

// ── Compute nasabah stats ────────────────────────────────
export function computeNasabahStats(list: NasabahRow[]) {
    return {
        total: list.length,
        aktif: list.filter((n) => n.status === "aktif").length,
        nonaktif: list.filter((n) => n.status === "nonaktif").length,
        pending: list.filter((n) => n.status === "pending").length,
    };
}
