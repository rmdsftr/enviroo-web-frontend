import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaFileCirclePlus } from "react-icons/fa6";
import Button from "../components/button";
import FilterPill from "../components/filter-pill";
import Pagination from "../components/pagination";
import CardInformasi from "../layouts/card_informasi";
import { useAuth } from "../contexts/AuthContext";
import { KontenService } from "../services/konten.service";
import type { KontenItem } from "../types/konten.type";
import "../styles/layout.css";
import "../styles/informasi.css";

const ITEMS_PER_PAGE = 9;

type FilterStatus = "semua" | "published" | "draft";

const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
    { value: "semua", label: "Semua" },
    { value: "published", label: "Dipublikasikan" },
    { value: "draft", label: "Draft" },
];

const SORT_OPTIONS: { value: "terbaru" | "terlama"; label: string }[] = [
    { value: "terbaru", label: "Terbaru" },
    { value: "terlama", label: "Terlama" },
];

export default function InformasiPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [kontenList, setKontenList] = useState<KontenItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("semua");
    const [sortOrder, setSortOrder] = useState<"terbaru" | "terlama">("terbaru");

    const fetchKonten = useCallback(async () => {
        if (!user?.bank_id) return;
        setIsLoading(true);
        try {
            const publishedParam =
                filterStatus === "published" ? true :
                filterStatus === "draft" ? false :
                undefined;
            const res = await KontenService.getAllKonten(user.bank_id, publishedParam);
            setKontenList(res.data || []);
        } catch (err) {
            console.error("Failed to fetch konten", err);
        } finally {
            setIsLoading(false);
        }
    }, [user?.bank_id, filterStatus]);

    useEffect(() => {
        fetchKonten();
    }, [fetchKonten]);

    // Reset page when filter changes
    const handleFilterStatus = (val: unknown) => {
        setFilterStatus(val as FilterStatus);
        setPage(1);
    };
    const handleSortChange = (val: unknown) => {
        setSortOrder(val as "terbaru" | "terlama");
        setPage(1);
    };

    // Filter drafts: only show current user's drafts
    const filtered = useMemo(() => {
        return kontenList.filter(item => {
            if (item.IsUploaded) return true; // Published can be seen by all admins
            return item.AdminID === user?.identity_id; // Draft only visible to creator
        });
    }, [kontenList, user?.identity_id]);

    // Client-side sort
    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            const diff = new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime();
            return sortOrder === "terbaru" ? diff : -diff;
        });
    }, [filtered, sortOrder]);

    const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
    const start = (page - 1) * ITEMS_PER_PAGE;
    const currentData = sorted.slice(start, start + ITEMS_PER_PAGE);

    return (
        <main className="main-content">
            {/* Header toolbar */}
            <div className="info-header">
                <div className="info-header__left">
                    <div className="info-header__title-row">
                        <p className="judul">Kelola Konten Informasi</p>
                        <span className="info-total">{filtered.length} konten</span>
                    </div>
                    <p className="deskripsi">
                        Pada menu ini, BSI dapat memposting konten edukasi dan informasi terkait bank sampah dan pemilahan sampah
                    </p>
                </div>
                <div className="info-header__right">
                    <Button
                        variant="solid"
                        size="default"
                        color="neon"
                        isRounded
                        icon={<FaFileCirclePlus />}
                        onClick={() => navigate("new")}
                    >
                        Unggah Konten
                    </Button>
                </div>
            </div>

            {/* Filter row */}
            <div className="n-filter-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 32px 20px', gap: '16px', flexWrap: 'wrap' }}>
                <FilterPill
                    options={STATUS_OPTIONS}
                    activeValue={filterStatus}
                    onChange={handleFilterStatus}
                />
                <FilterPill
                    options={SORT_OPTIONS}
                    activeValue={sortOrder}
                    onChange={handleSortChange}
                />
            </div>

            <div className="info-divider"></div>

            {/* Card grid */}
            {isLoading ? (
                <div style={{ padding: '60px 32px', textAlign: 'center', color: '#6b9080', fontSize: '13px', fontFamily: 'Poppins, sans-serif' }}>
                    Memuat konten...
                </div>
            ) : currentData.length === 0 ? (
                <div style={{ padding: '60px 32px', textAlign: 'center', color: '#aac4b5', fontSize: '13px', fontFamily: 'Poppins, sans-serif' }}>
                    {filterStatus === "draft" ? "Tidak ada draft tersimpan." :
                     filterStatus === "published" ? "Belum ada konten yang dipublikasikan." :
                     "Belum ada konten. Klik \"Unggah Konten\" untuk memulai."}
                </div>
            ) : (
                <div className="konten">
                    {currentData.map((item: KontenItem) => (
                        <CardInformasi key={item.KontenID} data={item} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            )}
        </main>
    );
}
