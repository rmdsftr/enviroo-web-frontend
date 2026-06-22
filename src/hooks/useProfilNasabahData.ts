import { useState, useEffect, useCallback, useMemo } from "react";
import { ProfilService } from "../services/profil.service";
import { SetoranService, type RiwayatSetoranNasabahItem } from "../services/setoran.service";
import { BagiHasilService, type RiwayatBagiHasilNasabahItem } from "../services/bagi_hasil_penjualan.service";
import { PenarikanService, type PenarikanItem } from "../services/penarikan.service";
import { defaultMonthRange } from "../components/filter-range";
import type { ProfilNasabah, SaldoNasabah } from "../types/profil.type";

export function useProfilNasabahData(id: string | undefined) {
    // ── Core ──
    const [nasabah, setNasabah] = useState<ProfilNasabah | null>(null);
    const [saldo, setSaldo] = useState<SaldoNasabah | null>(null);
    const [loading, setLoading] = useState(true);

    // ── Setoran ──
    const [setoranList, setSetoranList] = useState<RiwayatSetoranNasabahItem[]>([]);
    const [setoranLoading, setSetoranLoading] = useState(false);
    const [setoranSearch, setSetoranSearch] = useState("");
    const [setoranFrom, setSetoranFrom] = useState(() => defaultMonthRange().from);
    const [setoranTo, setSetoranTo] = useState(() => defaultMonthRange().to);

    // ── Bagi Hasil ──
    const [bagiHasilList, setBagiHasilList] = useState<RiwayatBagiHasilNasabahItem[]>([]);
    const [bagiHasilLoading, setBagiHasilLoading] = useState(false);
    const [bagiHasilSearch, setBagiHasilSearch] = useState("");
    const [bagiHasilFrom, setBagiHasilFrom] = useState(() => defaultMonthRange().from);
    const [bagiHasilTo, setBagiHasilTo] = useState(() => defaultMonthRange().to);

    // ── Penarikan ──
    const [penarikanList, setPenarikanList] = useState<PenarikanItem[]>([]);
    const [penarikanLoading, setPenarikanLoading] = useState(false);
    const [penarikanSearch, setPenarikanSearch] = useState("");
    const [penarikanFrom, setPenarikanFrom] = useState(() => defaultMonthRange().from);
    const [penarikanTo, setPenarikanTo] = useState(() => defaultMonthRange().to);

    // ── Effects ──
    useEffect(() => {
        if (!id) return;
        Promise.all([
            ProfilService.getProfilNasabah(id),
            ProfilService.getSaldoNasabah(id),
        ])
            .then(([profilRes, saldoRes]) => {
                setNasabah(profilRes.data);
                setSaldo(saldoRes.data);
            })
            .catch((err) => console.error("Gagal menarik data nasabah", err))
            .finally(() => setLoading(false));
    }, [id]);

    const fetchSetoran = useCallback(async () => {
        if (!id) return;
        setSetoranLoading(true);
        try {
            const data = await SetoranService.getListSetoranNasabah(id);
            setSetoranList(data);
        } catch {
            console.error("Gagal memuat riwayat setoran");
        } finally {
            setSetoranLoading(false);
        }
    }, [id]);

    const fetchBagiHasil = useCallback(async () => {
        if (!id) return;
        setBagiHasilLoading(true);
        try {
            const data = await BagiHasilService.getListBhNasabah(id);
            setBagiHasilList(data);
        } catch {
            console.error("Gagal memuat riwayat bagi hasil");
        } finally {
            setBagiHasilLoading(false);
        }
    }, [id]);

    const fetchPenarikan = useCallback(async () => {
        if (!id) return;
        setPenarikanLoading(true);
        try {
            const data = await PenarikanService.getListByNasabah(id);
            setPenarikanList(data);
        } catch {
            console.error("Gagal memuat riwayat penarikan");
        } finally {
            setPenarikanLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchSetoran(); }, [fetchSetoran]);
    useEffect(() => { fetchBagiHasil(); }, [fetchBagiHasil]);
    useEffect(() => { fetchPenarikan(); }, [fetchPenarikan]);

    // ── Computed ──
    const filteredSetoran = useMemo(() => {
        const q = setoranSearch.toLowerCase();
        return setoranList.filter((item) => {
            const month = item.transaksi_timestamp.substring(0, 7);
            if (month < setoranFrom || month > setoranTo) return false;
            if (q) return item.setoran_id.toLowerCase().includes(q) || item.nama_petugas.toLowerCase().includes(q);
            return true;
        });
    }, [setoranList, setoranFrom, setoranTo, setoranSearch]);

    const filteredBagiHasil = useMemo(() => {
        const q = bagiHasilSearch.toLowerCase();
        return bagiHasilList.filter((item) => {
            const month = item.tanggal.substring(0, 7);
            if (month < bagiHasilFrom || month > bagiHasilTo) return false;
            if (q) return item.penerima_id.toLowerCase().includes(q) || item.bagi_hasil_id.toLowerCase().includes(q) || item.reward.toLowerCase().includes(q);
            return true;
        });
    }, [bagiHasilList, bagiHasilFrom, bagiHasilTo, bagiHasilSearch]);

    const filteredPenarikan = useMemo(() => {
        const q = penarikanSearch.toLowerCase();
        return penarikanList.filter((item) => {
            const month = item.created_at.substring(0, 7);
            if (month < penarikanFrom || month > penarikanTo) return false;
            if (q) return item.penarikan_id.toLowerCase().includes(q) || item.nama_reward.toLowerCase().includes(q);
            return true;
        });
    }, [penarikanList, penarikanFrom, penarikanTo, penarikanSearch]);

    return {
        nasabah, setNasabah, saldo, loading,
        // setoran
        setoranLoading, setoranSearch, setSetoranSearch,
        setoranFrom, setSetoranFrom, setoranTo, setSetoranTo,
        filteredSetoran,
        // bagi hasil
        bagiHasilLoading, bagiHasilSearch, setBagiHasilSearch,
        bagiHasilFrom, setBagiHasilFrom, bagiHasilTo, setBagiHasilTo,
        filteredBagiHasil,
        // penarikan
        penarikanLoading, penarikanSearch, setPenarikanSearch,
        penarikanFrom, setPenarikanFrom, penarikanTo, setPenarikanTo,
        filteredPenarikan,
    };
}
