import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { NasabahService } from "../services/nasabah.service";
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

    const [nasabahList, setNasabahList] = useState<NasabahRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState("");

    // ── Search ───────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState("");

    // ── Sort ─────────────────────────────────────────────
    const [sortKey, setSortKey] = useState<SortKey>("");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    // ── Pagination ───────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);

    // ── Afiliasi options (for modal dropdown) ────────────
    const [afiliasiOptions, setAfiliasiOptions] = useState<{ label: string; value: string }[]>([]);

    const fetchNasabahs = async () => {
        setLoading(true);
        try {
            if ((isAdminBsi || isAdminBsu) && user?.bank_id) {
                const res = await BsiService.getNasabahBSI(user.bank_id);
                setNasabahList(mapBsiNasabah(res.data));
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
    }, [user?.bank_id, isAdminBsi, isAdminBsu]);

    useEffect(() => {
        // BSU: bank_id sudah fixed dari sesi, tidak perlu fetch afiliasi options
        if (isAdminBsu) return;

        if (isAdminBsi && user?.bank_id) {
            BsiService.getUnit(user.bank_id)
                .then((res) => {
                    const mapped = (res.data || []).map((b) => ({
                        label: b.NamaBank,
                        value: b.BankID,
                    }));
                    setAfiliasiOptions(mapped);
                })
                .catch((err) => console.error("Gagal mendapatkan unit BSI:", err));
        } else {
            NasabahService.getAfiliasi()
                .then((res) => {
                    const mapped = (res.data || []).map((item) => ({
                        label: item.NamaBank,
                        value: item.BankID,
                    }));
                    setAfiliasiOptions(mapped);
                })
                .catch((err) => console.error("Gagal mendapatkan opsi afiliasi nasabah", err));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdminBsi, isAdminBsu, user?.bank_id]);

    // ── Reset page when filters change ───────────────────
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

    // ── Computed: filter → search → sort → paginate ─────
    const filteredAndSorted = useMemo(() => {
        let result = [...nasabahList];

        // Status filter
        if (statusFilter) {
            result = result.filter((n) => n.status === statusFilter);
        }

        // Search filter (by name or ID)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter(
                (n) =>
                    n.nama.toLowerCase().includes(q) ||
                    n.id.toLowerCase().includes(q) ||
                    (n.email && n.email.toLowerCase().includes(q))
            );
        }

        // Sort
        if (sortKey) {
            result.sort((a, b) => {
                const valA = (a[sortKey] || "").toLowerCase();
                const valB = (b[sortKey] || "").toLowerCase();
                const cmp = valA.localeCompare(valB);
                return sortDirection === "asc" ? cmp : -cmp;
            });
        }

        return result;
    }, [nasabahList, statusFilter, searchQuery, sortKey, sortDirection]);

    const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);

    const paginatedNasabah = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSorted.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredAndSorted, currentPage]);

    const stats = useMemo(() => computeNasabahStats(nasabahList), [nasabahList]);

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
        // Filters
        statusFilter,
        setStatusFilter: handleStatusFilter,
        searchQuery,
        setSearchQuery: handleSearch,
        // Sort
        sortKey,
        sortDirection,
        handleSort,
        // Pagination
        currentPage,
        setCurrentPage,
        totalPages,
        itemsPerPage: ITEMS_PER_PAGE,
        // Other
        afiliasiOptions,
        fetchNasabahs,
    };
}
