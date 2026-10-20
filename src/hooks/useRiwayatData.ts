import { useState, useEffect, useCallback, useMemo } from "react";
import { defaultMonthRange } from "../components/filter-range";
import { PenimbanganService, type PenimbanganItem } from "../services/penimbangan.service";
import { PengangkutanService, type PengangkutanItem } from "../services/pengangkutan.service";
import { PenjualanService, type PenjualanExternalItem } from "../services/penjualan.service";
import { BagiHasilService, type RiwayatBagiHasilItem } from "../services/bagi_hasil_penjualan.service";
import { DistribusiSisaService } from "../services/distribusi_sisa.service";
import type { BagiHasilBsuItem } from "../types/distribusi_sisa.type";
import { PenarikanService, type PenarikanItem } from "../services/penarikan.service";
import { buildAngkutColumns } from "../constants/riwayat.constants";
import type { ColumnDef } from "../components/table";

interface Props {
    bankId: string | undefined;
    isBsu: boolean;
    isBsi: boolean;
}

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

const toStartDate = (ym: string) => `${ym}-01`;
const toEndDate = (ym: string) => {
    const [y, m] = ym.split("-").map(Number);
    return `${ym}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;
};

export function useRiwayatData({ bankId, isBsu, isBsi }: Props) {
    const hasAngkut = isBsi || isBsu;
    const hasPenjualan = isBsi || (!isBsi && !isBsu);

    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);

    const [penimbanganList, setPenimbanganList] = useState<PenimbanganItem[]>([]);
    const [penimbanganLoading, setPenimbanganLoading] = useState(false);
    const [penimbanganFrom, setPenimbanganFrom] = useState(() => defaultMonthRange().from);
    const [penimbanganTo, setPenimbanganTo] = useState(() => defaultMonthRange().to);

    const [angkutList, setAngkutList] = useState<PengangkutanItem[]>([]);
    const [angkutLoading, setAngkutLoading] = useState(false);
    const [angkutFrom, setAngkutFrom] = useState(() => defaultMonthRange().from);
    const [angkutTo, setAngkutTo] = useState(() => defaultMonthRange().to);

    const [penjualanList, setPenjualanList] = useState<PenjualanExternalItem[]>([]);
    const [penjualanLoading, setPenjualanLoading] = useState(false);
    const [penjualanFrom, setPenjualanFrom] = useState(() => defaultMonthRange().from);
    const [penjualanTo, setPenjualanTo] = useState(() => defaultMonthRange().to);

    const [bagiHasilList, setBagiHasilList] = useState<RiwayatBagiHasilItem[]>([]);
    const [bagiHasilLoading, setBagiHasilLoading] = useState(false);
    const [bagiHasilFrom, setBagiHasilFrom] = useState(() => defaultMonthRange().from);
    const [bagiHasilTo, setBagiHasilTo] = useState(() => defaultMonthRange().to);

    const [bagiHasilBsuList, setBagiHasilBsuList] = useState<BagiHasilBsuItem[]>([]);
    const [bagiHasilBsuLoading, setBagiHasilBsuLoading] = useState(false);
    const [bagiHasilBsuFrom, setBagiHasilBsuFrom] = useState(() => defaultMonthRange().from);
    const [bagiHasilBsuTo, setBagiHasilBsuTo] = useState(() => defaultMonthRange().to);

    const [penarikanList, setPenarikanList] = useState<PenarikanItem[]>([]);
    const [penarikanLoading, setPenarikanLoading] = useState(false);
    const [penarikanFrom, setPenarikanFrom] = useState(() => defaultMonthRange().from);
    const [penarikanTo, setPenarikanTo] = useState(() => defaultMonthRange().to);

    const fetchPenimbangan = useCallback(async (startDate: string, endDate: string) => {
        if (!bankId) return;
        setPenimbanganLoading(true);
        try {
            const data = await PenimbanganService.getPenimbanganByBank(bankId, startDate, endDate);
            setPenimbanganList(data);
        } catch {
            console.error("Gagal memuat riwayat penimbangan");
        } finally {
            setPenimbanganLoading(false);
        }
    }, [bankId]);

    const fetchAngkut = useCallback(async (startDate: string, endDate: string) => {
        if (!bankId || !hasAngkut) return;
        setAngkutLoading(true);
        try {
            const data = await PengangkutanService.getPengangkutanByBank(bankId, startDate, endDate);
            setAngkutList(data);
        } catch {
            console.error("Gagal memuat riwayat pengangkutan");
        } finally {
            setAngkutLoading(false);
        }
    }, [bankId, hasAngkut]);

    const fetchPenjualan = useCallback(async (startDate: string, endDate: string) => {
        if (!bankId || !hasPenjualan) return;
        setPenjualanLoading(true);
        try {
            const data = await PenjualanService.getRiwayatEksternal(bankId, startDate, endDate);
            setPenjualanList(data);
        } catch {
            console.error("Gagal memuat riwayat penjualan");
        } finally {
            setPenjualanLoading(false);
        }
    }, [bankId, hasPenjualan]);

    const fetchBagiHasil = useCallback(async (startDate: string, endDate: string) => {
        if (!bankId || isBsu) return;
        setBagiHasilLoading(true);
        try {
            const data = await BagiHasilService.getRiwayatByBank(bankId, startDate, endDate);
            setBagiHasilList(data);
        } catch {
            console.error("Gagal memuat riwayat bagi hasil");
        } finally {
            setBagiHasilLoading(false);
        }
    }, [bankId, isBsu]);

    const fetchBagiHasilBsu = useCallback(async (startDate: string, endDate: string) => {
        if (!bankId || !isBsu) return;
        setBagiHasilBsuLoading(true);
        try {
            const data = await DistribusiSisaService.getRiwayatBagiHasilBsu(bankId, startDate, endDate);
            setBagiHasilBsuList(data);
        } catch {
            console.error("Gagal memuat riwayat bagi hasil BSU");
        } finally {
            setBagiHasilBsuLoading(false);
        }
    }, [bankId, isBsu]);

    const fetchPenarikan = useCallback(async (startDate: string, endDate: string) => {
        if (!bankId) return;
        setPenarikanLoading(true);
        try {
            const res = await PenarikanService.getListByBank(bankId, { start_date: startDate, end_date: endDate });
            setPenarikanList(res.data);
        } catch {
            console.error("Gagal memuat riwayat penarikan");
        } finally {
            setPenarikanLoading(false);
        }
    }, [bankId]);

    useEffect(() => { fetchPenimbangan(toStartDate(penimbanganFrom), toEndDate(penimbanganTo)); }, [penimbanganFrom, penimbanganTo, fetchPenimbangan]);
    useEffect(() => { fetchAngkut(toStartDate(angkutFrom), toEndDate(angkutTo)); }, [angkutFrom, angkutTo, fetchAngkut]);
    useEffect(() => { fetchPenjualan(toStartDate(penjualanFrom), toEndDate(penjualanTo)); }, [penjualanFrom, penjualanTo, fetchPenjualan]);
    useEffect(() => { fetchBagiHasil(toStartDate(bagiHasilFrom), toEndDate(bagiHasilTo)); }, [bagiHasilFrom, bagiHasilTo, fetchBagiHasil]);
    useEffect(() => { fetchBagiHasilBsu(toStartDate(bagiHasilBsuFrom), toEndDate(bagiHasilBsuTo)); }, [bagiHasilBsuFrom, bagiHasilBsuTo, fetchBagiHasilBsu]);
    useEffect(() => { fetchPenarikan(toStartDate(penarikanFrom), toEndDate(penarikanTo)); }, [penarikanFrom, penarikanTo, fetchPenarikan]);

    const filteredPenimbangan = useMemo(() => {
        const q = searchQuery.toLowerCase();
        if (!q) return penimbanganList;
        return penimbanganList.filter(item =>
            item.penimbangan_id.toLowerCase().includes(q)
        );
    }, [penimbanganList, searchQuery]);

    const filteredAngkut = useMemo(() => {
        const q = searchQuery.toLowerCase();
        if (!q) return angkutList;
        return angkutList.filter(item => item.pengangkutan_id.toLowerCase().includes(q));
    }, [angkutList, searchQuery]);

    const angkutColumns = useMemo<ColumnDef<PengangkutanItem>[]>(() => buildAngkutColumns(isBsu), [isBsu]);

    const filteredPenjualan = useMemo(() => {
        const q = searchQuery.toLowerCase();
        if (!q) return penjualanList;
        return penjualanList.filter(item =>
            item.penjualan_id.toLowerCase().includes(q) ||
            item.nama_mitra.toLowerCase().includes(q) ||
            item.nama_reward.toLowerCase().includes(q)
        );
    }, [penjualanList, searchQuery]);

    const filteredBagiHasil = useMemo(() => {
        const q = searchQuery.toLowerCase();
        if (!q) return bagiHasilList;
        return bagiHasilList.filter(item =>
            item.bagi_hasil_id.toLowerCase().includes(q) ||
            item.nama_reward.toLowerCase().includes(q)
        );
    }, [bagiHasilList, searchQuery]);

    const filteredBagiHasilBsu = useMemo(() => {
        const q = searchQuery.toLowerCase();
        if (!q) return bagiHasilBsuList;
        return bagiHasilBsuList.filter(item =>
            item.penerima_sisa_id.toLowerCase().includes(q) ||
            item.distribusi_id.toLowerCase().includes(q) ||
            item.bagi_hasil_id.toLowerCase().includes(q)
        );
    }, [bagiHasilBsuList, searchQuery]);

    const filteredPenarikan = useMemo(() => {
        const q = searchQuery.toLowerCase();
        if (!q) return penarikanList;
        return penarikanList.filter(item =>
            item.penarikan_id.toLowerCase().includes(q) ||
            item.nama_nasabah.toLowerCase().includes(q) ||
            item.nama_reward.toLowerCase().includes(q)
        );
    }, [penarikanList, searchQuery]);

    const pagedPenimbangan = useMemo(() => paginate(filteredPenimbangan, page), [filteredPenimbangan, page]);
    const pagedAngkut = useMemo(() => paginate(filteredAngkut, page), [filteredAngkut, page]);
    const pagedPenjualan = useMemo(() => paginate(filteredPenjualan, page), [filteredPenjualan, page]);
    const pagedBagiHasil = useMemo(() => paginate(filteredBagiHasil, page), [filteredBagiHasil, page]);
    const pagedBagiHasilBsu = useMemo(() => paginate(filteredBagiHasilBsu, page), [filteredBagiHasilBsu, page]);
    const pagedPenarikan = useMemo(() => paginate(filteredPenarikan, page), [filteredPenarikan, page]);

    return {
        hasAngkut, hasPenjualan,
        searchQuery, setSearchQuery,
        setPage,
        penimbanganLoading,
        penimbanganFrom, setPenimbanganFrom, penimbanganTo, setPenimbanganTo,
        pagedPenimbangan,
        angkutLoading, angkutColumns,
        angkutFrom, setAngkutFrom, angkutTo, setAngkutTo,
        pagedAngkut,
        penjualanLoading,
        penjualanFrom, setPenjualanFrom, penjualanTo, setPenjualanTo,
        pagedPenjualan,
        bagiHasilLoading,
        bagiHasilFrom, setBagiHasilFrom, bagiHasilTo, setBagiHasilTo,
        pagedBagiHasil,
        bagiHasilBsuLoading,
        bagiHasilBsuFrom, setBagiHasilBsuFrom, bagiHasilBsuTo, setBagiHasilBsuTo,
        pagedBagiHasilBsu,
        penarikanLoading,
        penarikanFrom, setPenarikanFrom, penarikanTo, setPenarikanTo,
        pagedPenarikan,
    };
}
