import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { KatalogService } from "../services/katalog.service";
import { RewardService } from "../services/reward.service";
import { SembakoService } from "../services/sembako.service";
import { BsiService } from "../services/bsi.service";
import { defaultMonthRange } from "../components/filter-range";
import type {
    KategoriSampah as KategoriSampahT,
    KatalogSampah,
    KatalogSampahMeta,
} from "../types/katalog.type";
import type { Reward } from "../types/reward.type";
import type {
    KatalogSembakoItem,
    RiwayatDistribusi,
    DistribusiSembakoItem,
    SembakoMeta,
} from "../types/sembako.type";
import type { UnitBSI } from "../types/bsi.type";

export function useKatalogData() {
    const { user } = useAuth();
    const isAdminBsi = user?.role === "admin_bsi";
    const isAdminBsu = user?.role === "admin_bsu";
    const isAdminBsm = user?.role === "admin_bsm";
    const canEdit = isAdminBsi || isAdminBsm;

    const [categories, setCategories] = useState<KategoriSampahT[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [katalogList, setKatalogList] = useState<KatalogSampah[]>([]);
    const [sembakoList, setSembakoList] = useState<KatalogSembakoItem[]>([]);
    const [sampahPage, setSampahPage] = useState(1);
    const [sampahMeta, setSampahMeta] = useState<KatalogSampahMeta | null>(null);
    const [sembakoPage, setSembakoPage] = useState(1);
    const [sembakoMeta, setSembakoMeta] = useState<SembakoMeta | null>(null);
    const [sembakoFilterBank, setSembakoFilterBank] = useState<string>(user?.bank_id ?? "");
    const [bsuList, setBsuList] = useState<UnitBSI[]>([]);
    const [bsuRiwayat, setBsuRiwayat] = useState<RiwayatDistribusi[] | null>(null);
    const [distribusiList, setDistribusiList] = useState<DistribusiSembakoItem[]>([]);
    const [distribusiLoading, setDistribusiLoading] = useState(false);
    const [distribusiFrom, setDistribusiFrom] = useState(() => defaultMonthRange().from);
    const [distribusiTo, setDistribusiTo] = useState(() => defaultMonthRange().to);
    const [distribusiSearch, setDistribusiSearch] = useState("");
    const [filterKategori, setFilterKategori] = useState<number | "all">("all");
    const [filterSatuan, setFilterSatuan] = useState<"all" | "kg" | "pcs" | "liter">("all");
    const [filterReward, setFilterReward] = useState<number | "all">("all");

    const isViewingBSU = isAdminBsi && !!sembakoFilterBank && sembakoFilterBank !== user?.bank_id;
    const canEditSembako = canEdit && !isViewingBSU;

    const fetchKatalog = useCallback((page = 1) => {
        if (!user?.bank_id) return;
        KatalogService.getKatalogSampahBank(user.bank_id, page)
            .then(res => {
                setKatalogList(Array.isArray(res.data) ? res.data : []);
                setSampahMeta(res.pagination ?? null);
            })
            .catch(err => console.error("Failed to fetch katalog bank", err));
    }, [user?.bank_id]);

    const fetchSembako = useCallback((bankId: string, page = 1) => {
        if (!bankId) return;
        SembakoService.getSembakoBank(bankId, page)
            .then(res => {
                setSembakoList(res.data || []);
                setSembakoMeta(res.pagination ?? null);
            })
            .catch(err => console.error("Failed to fetch sembako bank", err));
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
            const res = await SembakoService.listDistribusiSembako(user.bank_id, startDate, endDate);
            setDistribusiList(res.data || []);
        } catch {
            console.error("Gagal memuat distribusi sembako");
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
        if (user?.bank_id) fetchSembako(user.bank_id);
        fetchBsuList();
    }, [fetchKatalog, fetchSembako, fetchBsuList, user?.bank_id]);

    useEffect(() => { setSampahPage(1); }, [filterKategori, filterSatuan, filterReward]);

    const filteredSampah = useMemo(() =>
        katalogList.filter(i =>
            (filterKategori === "all" || i.kategori_id === filterKategori) &&
            (filterSatuan === "all" || i.satuan.toLowerCase() === filterSatuan) &&
            (filterReward === "all" || i.reward_id === filterReward)
        ), [katalogList, filterKategori, filterSatuan, filterReward]);

    const filteredDistribusi = useMemo(() => {
        const q = distribusiSearch.toLowerCase();
        if (!q) return distribusiList;
        return distribusiList.filter(item =>
            item.disbako_id.toLowerCase().includes(q) ||
            item.nama_bsu.toLowerCase().includes(q) ||
            item.nama_admin_bsi.toLowerCase().includes(q)
        );
    }, [distribusiList, distribusiSearch]);

    return {
        user,
        isAdminBsi, isAdminBsu, isAdminBsm, canEdit, isViewingBSU, canEditSembako,
        categories, rewards,
        katalogList, sembakoList,
        sampahPage, setSampahPage, sampahMeta,
        sembakoPage, setSembakoPage, sembakoMeta,
        sembakoFilterBank, setSembakoFilterBank,
        bsuList, bsuRiwayat, setBsuRiwayat,
        distribusiLoading,
        distribusiFrom, setDistribusiFrom,
        distribusiTo, setDistribusiTo,
        distribusiSearch, setDistribusiSearch,
        filterKategori, setFilterKategori,
        filterSatuan, setFilterSatuan,
        filterReward, setFilterReward,
        filteredSampah, filteredDistribusi,
        fetchKatalog, fetchSembako,
    };
}
