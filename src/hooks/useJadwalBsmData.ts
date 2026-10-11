import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { JadwalService } from "../services/jadwal.service";
import { buildJadwalBatchItems } from "../components/JadwalBatchFields";
import type {
    JadwalPenimbanganOccurrence,
    JadwalMasterPenimbangan,
    JadwalEditSeed,
    JadwalFormValue,
} from "../types/jadwal.type";
import { formatTime } from "../utils/date.utils";
import { getApiError } from "../utils/error.utils";

export interface MutationResult {
    success: boolean;
    message: string;
}

function buildUpdatePayload(
    value: JadwalFormValue,
    orig: JadwalEditSeed | null,
    adminId: string,
): Record<string, string | number | boolean> {
    const payload: Record<string, string | number | boolean> = {
        is_active: value.isActive,
        admin_id: adminId,
    };
    if (value.type === "spesial") {
        payload.nama_jadwal_spesial = value.namaSpesial;
    }
    if (value.type === "rutin") {
        if (!orig || orig.hari !== value.hari) payload.hari = value.hari;
        if (!orig || orig.minggu_ke !== parseInt(value.mingguKe)) payload.minggu_ke = parseInt(value.mingguKe);
        if (!orig || formatTime(orig.jam_mulai) !== value.jamMulai) payload.jam_mulai = value.jamMulai;
        if (!orig || formatTime(orig.jam_selesai) !== value.jamSelesai) payload.jam_selesai = value.jamSelesai;
    } else {
        if (!orig || orig.tanggal !== value.tanggal) payload.tanggal = value.tanggal;
        if (!orig || formatTime(orig.jam_mulai) !== value.jamMulai) payload.jam_mulai = value.jamMulai;
        if (!orig || formatTime(orig.jam_selesai) !== value.jamSelesai) payload.jam_selesai = value.jamSelesai;
    }
    return payload;
}

export function useJadwalBsmData() {
    const { user } = useAuth();

    const [penimbanganList, setPenimbanganList] = useState<JadwalPenimbanganOccurrence[]>([]);
    const [loading, setLoading] = useState(true);

    const [masterJadwal, setMasterJadwal] = useState<JadwalMasterPenimbangan>({ rutin: [], khusus: [] });
    const [masterLoading, setMasterLoading] = useState(true);

    const [calMonth, setCalMonth] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchJadwal = useCallback(async (month: number, year: number) => {
        if (!user?.bank_id) return;
        try {
            setLoading(true);
            const data = await JadwalService.getJadwalPenimbanganBank(user.bank_id, month, year);
            setPenimbanganList(data || []);
        } catch { console.error("Gagal memuat jadwal"); }
        finally { setLoading(false); }
    }, [user?.bank_id]);

    const fetchMasterJadwal = useCallback(async (month: number, year: number) => {
        if (!user?.bank_id) return;
        try {
            setMasterLoading(true);
            const data = await JadwalService.getJadwalMasterPenimbangan(user.bank_id, month, year);
            setMasterJadwal(data || { rutin: [], khusus: [] });
        } catch { console.error("Gagal memuat pengaturan jadwal"); }
        finally { setMasterLoading(false); }
    }, [user?.bank_id]);

    const refetchAll = useCallback((month: number, year: number) => {
        fetchJadwal(month, year);
        fetchMasterJadwal(month, year);
    }, [fetchJadwal, fetchMasterJadwal]);

    useEffect(() => { refetchAll(calMonth.month, calMonth.year); }, [calMonth, refetchAll]);

    const submitJadwal = useCallback(async (value: JadwalFormValue, seed: JadwalEditSeed | null): Promise<MutationResult | null> => {
        if (!user?.bank_id) return null;

        if (!seed && value.type === "rutin") {
            if (value.hariList.length === 0)   return { success: false, message: "Pilih minimal satu hari" };
            if (value.mingguList.length === 0) return { success: false, message: "Pilih minggu, atau centang 'Setiap minggu'" };
        }

        setIsSubmitting(true);
        try {
            let message: string;

            if (seed || value.type === "spesial") {
                if (seed) {
                    await JadwalService.updateJadwal(seed.jadwal_id, buildUpdatePayload(value, seed, user.identity_id));
                    message = "Jadwal berhasil diperbarui!";
                } else {
                    await JadwalService.addJadwal(user.bank_id, {
                        hari: value.type === "rutin" ? value.hari : "",
                        minggu_ke: value.type === "rutin" ? parseInt(value.mingguKe) : 0,
                        jam_mulai: value.jamMulai, jam_selesai: value.jamSelesai,
                        jenis_jadwal: "penimbangan",
                        is_active: true, is_rutin: value.type === "rutin",
                        tanggal: value.type === "spesial" ? value.tanggal : "",
                        nama_jadwal_spesial: value.type === "spesial" ? value.namaSpesial : "",
                        admin_id: user.identity_id,
                    });
                    message = "Jadwal berhasil ditambahkan!";
                }
            } else {
                const items = buildJadwalBatchItems(value.hariList, value.mingguList, value.jamMulai, value.jamSelesai);
                const res = await JadwalService.addJadwalBatch(user.bank_id, {
                    admin_id: user.identity_id,
                    jenis_jadwal: "penimbangan",
                    is_rutin: true,
                    items,
                });
                message = res.message || "Jadwal berhasil ditambahkan!";
            }

            refetchAll(calMonth.month, calMonth.year);
            return { success: true, message };
        } catch (err) {
            return { success: false, message: getApiError(err, "Gagal menyimpan jadwal") };
        } finally {
            setIsSubmitting(false);
        }
    }, [user?.bank_id, user?.identity_id, refetchAll, calMonth]);

    const deleteJadwal = useCallback(async (jadwalId: string): Promise<MutationResult> => {
        try {
            await JadwalService.deleteJadwal(jadwalId);
            refetchAll(calMonth.month, calMonth.year);
            return { success: true, message: "Jadwal berhasil dihapus!" };
        } catch (err) {
            return { success: false, message: getApiError(err, "Gagal menghapus jadwal") };
        }
    }, [refetchAll, calMonth]);

    return {
        penimbanganList,
        loading,
        masterJadwal,
        masterLoading,
        calMonth,
        setCalMonth,
        isSubmitting,
        submitJadwal,
        deleteJadwal,
    };
}
