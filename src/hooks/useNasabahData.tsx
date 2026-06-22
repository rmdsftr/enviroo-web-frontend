import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { NasabahService } from "../services/nasabah.service";
import { BankService } from "../services/bank.service";
import { BsiService } from "../services/bsi.service";
import type { NasabahRow } from "../constants/nasabah.constants";
import { mapBsiNasabah, mapSuperadminNasabah, computeNasabahStats } from "../utils/nasabah.utils";

export type SortKey = "nama" | "status" | "";
export type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE = 10;

export function useNasabahData() {
    const { user } = useAuth();

    const isSuperadmin = user?.role === "superadmin";
    const isAdminBsi = user?.role === "admin_bsi";
    const isAdminBsu = user?.role === "admin_bsu";
    const isAdminBsm = user?.role === "admin_bsm";
    const isAdmin = isAdminBsi || isAdminBsu || isAdminBsm;

    const [nasabahList, setNasabahList] = useState<NasabahRow[]>([]);
    const [allNasabahList, setAllNasabahList] = useState<NasabahRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [serverTotalPages, setServerTotalPages] = useState(1);
    const [afiliasiOptions, setAfiliasiOptions] = useState<{ label: string; value: string }[]>([]);

    // ── Fetch ALL data once for admin (untuk keperluan search & filter) ──
    useEffect(() => {
        if (!isAdmin || !user?.bank_id) return;
        BankService.getNasabah(user.bank_id)
            .then((res) => setAllNasabahList(mapBsiNasabah(res.data)))
            .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.bank_id, isAdmin]);

    // ── Fetch data utama (paged untuk admin, semua untuk superadmin) ──
    const fetchNasabahs = async () => {
        setLoading(true);
        setError(null);
        try {
            if (isAdmin && user?.bank_id) {
                const res = await BankService.getNasabahPaged(user.bank_id, currentPage);
                setNasabahList(mapBsiNasabah(res.data));
                setServerTotalPages(res.pagination.total_pages);
            } else {
                const res = await NasabahService.getNasabahs();
                setNasabahList(mapSuperadminNasabah(res.data));
            }
        } catch (err) {
            console.error("Gagal mendapatkan daftar nasabah", err);
            setError("Gagal memuat nasabah.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNasabahs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.bank_id, isAdmin, isSuperadmin, currentPage]);

    // ── Afiliasi options (for modal dropdown) ────────────
    useEffect(() => {
        if (isAdminBsu || isAdminBsm) return;

        if (isAdminBsi && user?.bank_id) {
            BsiService.getUnit(user.bank_id)
                .then((res) => {
                    setAfiliasiOptions((res.data || []).map((b) => ({
                        label: b.NamaBank,
                        value: b.BankID,
                    })));
                })
                .catch((err) => console.error("Gagal mendapatkan unit BSI:", err));
        } else {
            NasabahService.getAfiliasi()
                .then((res) => {
                    setAfiliasiOptions((res.data || []).map((item) => ({
                        label: item.NamaBank,
                        value: item.BankID,
                    })));
                })
                .catch((err) => console.error("Gagal mendapatkan opsi afiliasi nasabah", err));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdminBsi, isAdminBsu, isAdminBsm, user?.bank_id]);

    // ── Reset page saat filter/search berubah ────────────
    const handleStatusFilter = (val: string) => {
        setStatusFilter(val);
        setCurrentPage(1);
    };

    const handleSearch = (val: string) => {
        setSearchQuery(val);
        setCurrentPage(1);
    };

    const handleSort = (key: SortKey, direction?: SortDirection) => {
        setSortKey(key);
        setSortDirection(direction || "asc");
        setCurrentPage(1);
    };

    // ── Admin: aktif search/filter → pakai allNasabahList ──
    const isFiltering = isAdmin && (!!searchQuery || !!statusFilter);

    // ── filter → search → sort ───────────────────────────
    const filteredAndSorted = useMemo(() => {
        const source = isFiltering ? allNasabahList : nasabahList;
        let result = [...source];

        if (statusFilter) {
            result = result.filter((n) => n.status === statusFilter);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter(
                (n) =>
                    n.nama.toLowerCase().includes(q) ||
                    n.id.toLowerCase().includes(q) ||
                    (n.email && n.email.toLowerCase().includes(q))
            );
        }

        if (sortKey) {
            result.sort((a, b) => {
                const valA = (a[sortKey] || "").toLowerCase();
                const valB = (b[sortKey] || "").toLowerCase();
                const cmp = valA.localeCompare(valB);
                return sortDirection === "asc" ? cmp : -cmp;
            });
        }

        return result;
    }, [nasabahList, allNasabahList, isFiltering, statusFilter, searchQuery, sortKey, sortDirection]);

    // ── Pagination ────────────────────────────────────────
    // Admin + tidak filtering → server pagination (nasabahList sudah 1 page)
    // Admin + filtering → tampilkan semua hasil, sembunyikan pagination
    // Superadmin → client-side pagination
    const totalPages = isAdmin
        ? isFiltering ? 1 : serverTotalPages
        : Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);

    const paginatedNasabah = useMemo(() => {
        if (isAdmin) return filteredAndSorted;
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSorted.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredAndSorted, isAdmin, currentPage]);

    // Stats dari allNasabahList kalau sudah ada, fallback ke nasabahList
    const stats = useMemo(
        () => computeNasabahStats(allNasabahList.length > 0 ? allNasabahList : nasabahList),
        [allNasabahList, nasabahList]
    );

    // Total keseluruhan untuk teks info pagination
    const totalNasabahCount = isAdmin
        ? isFiltering ? filteredAndSorted.length : allNasabahList.length
        : filteredAndSorted.length;

    return {
        user,
        isSuperadmin,
        isAdminBsi,
        isAdminBsu,
        isAdminBsm,
        nasabahList,
        filteredNasabah: filteredAndSorted,
        paginatedNasabah,
        loading,
        error,
        stats,
        statusFilter,
        setStatusFilter: handleStatusFilter,
        searchQuery,
        setSearchQuery: handleSearch,
        sortKey,
        sortDirection,
        handleSort,
        currentPage,
        setCurrentPage,
        totalPages,
        totalNasabahCount,
        itemsPerPage: ITEMS_PER_PAGE,
        afiliasiOptions,
        fetchNasabahs,
    };
}
