import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { KatalogService } from "../services/katalog.service";
import { RewardService } from "../services/reward.service";
import { BarangService } from "../services/barang.service";
import { BsiService } from "../services/bsi.service";
import { defaultMonthRange } from "../components/filter-range";
import type {
    KategoriSampah as KategoriSampahT,
    KatalogSampah,
} from "../types/katalog.type";
import type { Reward } from "../types/reward.type";
import type {
    KatalogBarangItem,
    RiwayatDistribusi,
    DistribusiBarangItem,
} from "../types/barang.type";
import type { UnitBSI } from "../types/bsi.type";

const ITEMS_PER_PAGE = 12;

export function useKatalogData() {
    const { user } = useAuth();
    const isAdminBsi = user?.role === "admin_bsi";
    const isAdminBsu = user?.role === "admin_bsu";
    const isAdminBsm = user?.role === "admin_bsm";
    const canEdit = isAdminBsi || isAdminBsm;

    const [categories, setCategories] = useState<KategoriSampahT[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [katalogList, setKatalogList] = useState<KatalogSampah[]>([]);
    const [barangList, setBarangList] = useState<KatalogBarangItem[]>([]);
    const [sampahPage, setSampahPage] = useState(1);
    const [barangPage, setBarangPage] = useState(1);
    const [barangFilterBank, setBarangFilterBank] = useState<string>(user?.bank_id ?? "");
    const [bsuList, setBsuList] = useState<UnitBSI[]>([]);
    const [bsuRiwayat, setBsuRiwayat] = useState<RiwayatDistribusi[] | null>(null);
    const [distribusiList, setDistribusiList] = useState<DistribusiBarangItem[]>([]);
    const [distribusiLoading, setDistribusiLoading] = useState(false);
    const [distribusiFrom, setDistribusiFrom] = useState(() => defaultMonthRange().from);
    const [distribusiTo, setDistribusiTo] = useState(() => defaultMonthRange().to);
    const [distribusiSearch, setDistribusiSearch] = useState("");
    const [filterKategori, setFilterKategori] = useState<number | "all">("all");
    const [filterSatuan, setFilterSatuan] = useState<"all" | "kg" | "pcs" | "liter">("all");
    const [filterReward, setFilterReward] = useState<number | "all">("all");
    const [sampahSearch, setSampahSearch] = useState("");
    const [barangSearch, setBarangSearch] = useState("");

    const isViewingBSU = isAdminBsi && !!barangFilterBank && barangFilterBank !== user?.bank_id;
    const canEditBarang = canEdit && !isViewingBSU;

    const fetchKatalog = useCallback(() => {
        if (!user?.bank_id) return;
        KatalogService.getKatalogSampahBank(user.bank_id)
            .then(res => setKatalogList(Array.isArray(res.data) ? res.data : []))
            .catch(err => console.error("Failed to fetch katalog bank", err));
    }, [user?.bank_id]);

    const fetchBarang = useCallback((bankId: string) => {
        if (!bankId) return;
        BarangService.getBarangBank(bankId)
            .then(res => setBarangList(res.data || []))
            .catch(err => console.error("Failed to fetch barang bank", err));
    }, []);

    const fetchBsuList = useCallback(() => {
        if (!isAdminBsi || !user?.bank_id) return;
        BsiService.getUnit(user.bank_id)
            .then(res => setBsuList(res.data || []))
            .catch(err => console.error("Failed to fetch BSU list", err));
    }, [isAdminBsi, user?.bank_id]);

    const fetchDistribusi = useCallback(async (startMonth: string, endMonth: string) => {
        if (!user?.bank_id || (!isAdminBsi && !isAdminBsu)) return;
        try {
            setDistribusiLoading(true);
            const startDate = startMonth + "-01";
            const [y, m] = endMonth.split("-").map(Number);
            const endDate = `${endMonth}-${new Date(y, m, 0).getDate()}`;
            const res = await BarangService.listDistribusiBarang(user.bank_id, startDate, endDate);
            setDistribusiList(res.data || []);
        } catch {
            console.error("Gagal memuat distribusi barang");
        } finally {
            setDistribusiLoading(false);
        }
    }, [user?.bank_id, isAdminBsi, isAdminBsu]);

    useEffect(() => {
        fetchDistribusi(distribusiFrom, distribusiTo);
    }, [distribusiFrom, distribusiTo, fetchDistribusi]);

    useEffect(() => {
        KatalogService.getKategori()
            .then(res => setCategories(res.data || []))
            .catch(err => console.error("Failed to fetch kategori", err));

        RewardService.getRewards()
            .then(res => setRewards(res.data || []))
            .catch(err => console.error("Failed to fetch rewards", err));

        fetchKatalog();
        if (user?.bank_id) fetchBarang(user.bank_id);
        fetchBsuList();
    }, [fetchKatalog, fetchBarang, fetchBsuList, user?.bank_id]);

    useEffect(() => { setSampahPage(1); }, [filterKategori, filterSatuan, filterReward, sampahSearch]);
    useEffect(() => { setBarangPage(1); }, [barangSearch, barangFilterBank]);

    const filteredSampah = useMemo(() => {
        const q = sampahSearch.trim().toLowerCase();
        return katalogList.filter(i =>
            (filterKategori === "all" || i.kategori_id === filterKategori) &&
            (filterSatuan === "all" || i.satuan.toLowerCase() === filterSatuan) &&
            (filterReward === "all" || i.reward_id === filterReward) &&
            (!q || i.sampah_id.toLowerCase().includes(q) || i.nama_sampah.toLowerCase().includes(q))
        );
    }, [katalogList, filterKategori, filterSatuan, filterReward, sampahSearch]);

    const filteredBarang = useMemo(() => {
        const q = barangSearch.trim().toLowerCase();
        if (!q) return barangList;
        return barangList.filter(i =>
            i.produk_id.toLowerCase().includes(q) || i.nama_barang.toLowerCase().includes(q)
        );
    }, [barangList, barangSearch]);

    const sampahTotalPages = Math.max(1, Math.ceil(filteredSampah.length / ITEMS_PER_PAGE));
    const barangTotalPages = Math.max(1, Math.ceil(filteredBarang.length / ITEMS_PER_PAGE));

    const pagedSampah = useMemo(
        () => filteredSampah.slice((sampahPage - 1) * ITEMS_PER_PAGE, sampahPage * ITEMS_PER_PAGE),
        [filteredSampah, sampahPage],
    );
    const pagedBarang = useMemo(
        () => filteredBarang.slice((barangPage - 1) * ITEMS_PER_PAGE, barangPage * ITEMS_PER_PAGE),
        [filteredBarang, barangPage],
    );

    useEffect(() => {
        if (sampahPage > sampahTotalPages) setSampahPage(sampahTotalPages);
    }, [sampahPage, sampahTotalPages]);
    useEffect(() => {
        if (barangPage > barangTotalPages) setBarangPage(barangTotalPages);
    }, [barangPage, barangTotalPages]);

    const filteredDistribusi = useMemo(() => {
        const q = distribusiSearch.toLowerCase();
        if (!q) return distribusiList;
        return distribusiList.filter(item =>
            item.disba_id.toLowerCase().includes(q) ||
            item.nama_bsu.toLowerCase().includes(q) ||
            item.nama_admin_bsi.toLowerCase().includes(q)
        );
    }, [distribusiList, distribusiSearch]);

    return {
        user,
        isAdminBsi, isAdminBsu, isAdminBsm, canEdit, isViewingBSU, canEditBarang,
        categories, rewards,
        katalogList, barangList,
        sampahPage, setSampahPage, sampahTotalPages, pagedSampah,
        barangPage, setBarangPage, barangTotalPages, pagedBarang,
        barangFilterBank, setBarangFilterBank,
        bsuList, bsuRiwayat, setBsuRiwayat,
        distribusiLoading,
        distribusiFrom, setDistribusiFrom,
        distribusiTo, setDistribusiTo,
        distribusiSearch, setDistribusiSearch,
        filterKategori, setFilterKategori,
        filterSatuan, setFilterSatuan,
        filterReward, setFilterReward,
        sampahSearch, setSampahSearch,
        barangSearch, setBarangSearch,
        filteredSampah, filteredBarang, filteredDistribusi,
        fetchKatalog, fetchBarang,
    };
}
