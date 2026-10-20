import { useState, useEffect, useCallback, useMemo } from "react";
import { ProfilService } from "../services/profil.service";
import { SetoranService, type RiwayatSetoranNasabahItem } from "../services/setoran.service";
import { BagiHasilService, type RiwayatBagiHasilNasabahItem } from "../services/bagi_hasil_penjualan.service";
import { PenarikanService, type PenarikanNasabahItem } from "../services/penarikan.service";
import { defaultMonthRange } from "../components/filter-range";
import type { ProfilNasabah, SaldoNasabah } from "../types/profil.type";

const RIWAYAT_PER_PAGE = 10;

function paginate<T>(list: T[], page: number) {
    const totalPages = Math.max(1, Math.ceil(list.length / RIWAYAT_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    return {
        items: list.slice((currentPage - 1) * RIWAYAT_PER_PAGE, currentPage * RIWAYAT_PER_PAGE),
        currentPage,
        totalPages,
    };
}

export function useProfilNasabahData(id: string | undefined) {
    const [nasabah, setNasabah] = useState<ProfilNasabah | null>(null);
    const [saldo, setSaldo] = useState<SaldoNasabah | null>(null);
    const [loading, setLoading] = useState(true);

    const [setoranList, setSetoranList] = useState<RiwayatSetoranNasabahItem[]>([]);
    const [setoranLoading, setSetoranLoading] = useState(false);
    const [setoranSearch, setSetoranSearch] = useState("");
    const [setoranFrom, setSetoranFrom] = useState(() => defaultMonthRange().from);
    const [setoranTo, setSetoranTo] = useState(() => defaultMonthRange().to);
    const [setoranPage, setSetoranPage] = useState(1);

    const [bagiHasilList, setBagiHasilList] = useState<RiwayatBagiHasilNasabahItem[]>([]);
    const [bagiHasilLoading, setBagiHasilLoading] = useState(false);
    const [bagiHasilSearch, setBagiHasilSearch] = useState("");
    const [bagiHasilFrom, setBagiHasilFrom] = useState(() => defaultMonthRange().from);
    const [bagiHasilTo, setBagiHasilTo] = useState(() => defaultMonthRange().to);
    const [bagiHasilPage, setBagiHasilPage] = useState(1);

    const [penarikanList, setPenarikanList] = useState<PenarikanNasabahItem[]>([]);
    const [penarikanLoading, setPenarikanLoading] = useState(false);
    const [penarikanSearch, setPenarikanSearch] = useState("");
    const [penarikanFrom, setPenarikanFrom] = useState(() => defaultMonthRange().from);
    const [penarikanTo, setPenarikanTo] = useState(() => defaultMonthRange().to);
    const [penarikanPage, setPenarikanPage] = useState(1);

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
            if (!item.created_at) return false;
            const month = item.created_at.substring(0, 7);
            if (month < penarikanFrom || month > penarikanTo) return false;
            if (q) return item.penarikan_id.toLowerCase().includes(q) || item.nama_reward.toLowerCase().includes(q);
            return true;
        });
    }, [penarikanList, penarikanFrom, penarikanTo, penarikanSearch]);

    const pagedSetoran = useMemo(() => paginate(filteredSetoran, setoranPage), [filteredSetoran, setoranPage]);
    const pagedBagiHasil = useMemo(() => paginate(filteredBagiHasil, bagiHasilPage), [filteredBagiHasil, bagiHasilPage]);
    const pagedPenarikan = useMemo(() => paginate(filteredPenarikan, penarikanPage), [filteredPenarikan, penarikanPage]);

    return {
        nasabah, setNasabah, saldo, loading,
        setoranLoading, setoranSearch,
        setSetoranSearch: (v: string) => { setSetoranSearch(v); setSetoranPage(1); },
        setoranFrom, setoranTo,
        setSetoranRange: (f: string, t: string) => { setSetoranFrom(f); setSetoranTo(t); setSetoranPage(1); },
        pagedSetoran, setSetoranPage,
        bagiHasilLoading, bagiHasilSearch,
        setBagiHasilSearch: (v: string) => { setBagiHasilSearch(v); setBagiHasilPage(1); },
        bagiHasilFrom, bagiHasilTo,
        setBagiHasilRange: (f: string, t: string) => { setBagiHasilFrom(f); setBagiHasilTo(t); setBagiHasilPage(1); },
        pagedBagiHasil, setBagiHasilPage,
        penarikanLoading, penarikanSearch,
        setPenarikanSearch: (v: string) => { setPenarikanSearch(v); setPenarikanPage(1); },
        penarikanFrom, penarikanTo,
        setPenarikanRange: (f: string, t: string) => { setPenarikanFrom(f); setPenarikanTo(t); setPenarikanPage(1); },
        pagedPenarikan, setPenarikanPage,
    };
}
