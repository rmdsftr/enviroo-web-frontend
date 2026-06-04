import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaFileCirclePlus } from "react-icons/fa6";
import Button from "../components/button";
import FilterPill from "../components/filter-pill";
import Pagination from "../components/pagination";
import CardInformasi from "../layouts/card_informasi";
import { useAuth } from "../contexts/AuthContext";
import { KontenService } from "../services/konten.service";
import type { KontenListItem, KontenPagination } from "../types/konten.type";
import "../styles/layout.css";
import "../styles/informasi.css";

type FilterStatus = "semua" | "published" | "draft";

const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
    { value: "semua", label: "Semua" },
    { value: "published", label: "Dipublikasikan" },
    { value: "draft", label: "Draft" },
];

export default function InformasiPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [kontenList, setKontenList] = useState<KontenListItem[]>([]);
    const [pagination, setPagination] = useState<KontenPagination | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("semua");

    const fetchKonten = useCallback(async () => {
        if (!user?.identity_id) return;

        setIsLoading(true);

        try {
            const publishedParam =
                filterStatus === "published"
                    ? true
                    : filterStatus === "draft"
                    ? false
                    : undefined;

            const res =
                user.role === "superadmin"
                    ? await KontenService.getAllKontenSuperadmin(publishedParam, page)
                    : await KontenService.getAllKonten(user.bank_id, publishedParam, page);

            setKontenList(res.data ?? []);
            setPagination(res.pagination ?? null);
        } catch (err) {
            console.error("Failed to fetch konten", err);
        } finally {
            setIsLoading(false);
        }
    }, [user?.identity_id, user?.bank_id, user?.role, filterStatus, page]);

    useEffect(() => {
        fetchKonten();
    }, [fetchKonten]);

    const handleFilterStatus = (val: unknown) => {
        setFilterStatus(val as FilterStatus);
        setPage(1);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <>
            {/* Header toolbar */}
            <div className="info-header">
                <div className="info-header__left">
                    <div className="info-header__title-row">
                        <p className="judul">Kelola Konten Informasi</p>
                        {pagination && (
                            <span className="info-total">{pagination.total} konten</span>
                        )}
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
            <div className="n-filter-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px 20px', gap: '16px', flexWrap: 'wrap' }}>
                <FilterPill
                    options={STATUS_OPTIONS}
                    activeValue={filterStatus}
                    onChange={handleFilterStatus}
                />
            </div>

            <div className="info-divider"></div>

            {/* Card grid */}
            {isLoading ? (
                <div style={{ padding: '60px 24px', textAlign: 'center', color: '#6b9080', fontSize: '13px', fontFamily: 'Poppins, sans-serif' }}>
                    Memuat konten...
                </div>
            ) : kontenList.length === 0 ? (
                <div style={{ padding: '60px 24px', textAlign: 'center', color: '#aac4b5', fontSize: '13px', fontFamily: 'Poppins, sans-serif' }}>
                    {filterStatus === "draft" ? "Tidak ada draft tersimpan." :
                     filterStatus === "published" ? "Belum ada konten yang dipublikasikan." :
                     "Belum ada konten. Klik \"Unggah Konten\" untuk memulai."}
                </div>
            ) : (
                <div className="konten">
                    {kontenList.map((item) => (
                        <CardInformasi key={item.konten_id} data={item} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
                <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.total_pages}
                    onPageChange={handlePageChange}
                />
            )}
        </>
    );
}
