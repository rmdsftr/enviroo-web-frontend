import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNasabahData } from "../hooks/useNasabahData";
import { buildColumns, STATUS_FILTER_OPTIONS } from "../constants/nasabah.constants";
import DaftarNasabahModal from "../modals/DaftarNasabahModal";
import StatistikLayout from "../layouts/statistik";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import Table from "../components/table";
import Button from "../components/button";
import FilterPill from "../components/filter-pill";
import SearchBar from "../components/search";
import Pagination from "../components/pagination";
import SkeletonTable from "../components/skeleton-table";
import EmptyState from "../components/empty-state";
import {
    FaUsers,
    FaCircleCheck,
    FaCircleXmark,
    FaClock,
    FaUserPlus,
    FaFileExport,
    FaUserSlash,
} from "react-icons/fa6";
import "../styles/layout.css";
import "../styles/nasabah.css";

export default function NasabahPage() {
    const navigate = useNavigate();
    const {
        user,
        isAdminBsi,
        isAdminBsu,
        paginatedNasabah,
        filteredNasabah,
        loading,
        error,
        stats,
        statusFilter,
        setStatusFilter,
        searchQuery,
        setSearchQuery,
        currentPage,
        setCurrentPage,
        totalPages,
        afiliasiOptions,
        fetchNasabahs,
    } = useNasabahData();

    const columns = buildColumns(isAdminBsi, isAdminBsu, navigate);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // ── Popup notifikasi state ────────────────────────────
    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // ── Modal success callback with popup ────────────────
    const handleModalSuccess = () => {
        fetchNasabahs();
        setPopupNotif({ message: "Berhasil mendaftarkan nasabah baru!", type: "success" });
    };

    return (
        <>
            {/* ── Page Header: Title LEFT, Actions RIGHT ── */}
            <div className="nasabah-hero">
                <div className="nasabah-hero-left">
                    <h1 className="nasabah-hero-title">Manajemen Nasabah</h1>
                    <p className="nasabah-hero-desc">
                        Kelola data nasabah bank sampah Anda — tambah, cari, dan pantau status nasabah
                        untuk ekosistem yang lebih hijau.
                    </p>
                </div>
                <div className="nasabah-hero-right">
                    <Button
                        icon={<FaFileExport />}
                        color="neon"
                        variant="solid"
                        size="default"
                        isRounded
                        onClick={() => {
                            setPopupNotif({ message: "Fitur export CSV akan segera tersedia.", type: "success" });
                        }}
                    >
                        Ekspor Laporan
                    </Button>
                    <Button
                        icon={<FaUserPlus />}
                        color="secondary"
                        variant="solid"
                        size="default"
                        isRounded
                        onClick={() => setIsModalOpen(true)}
                    >
                        Daftarkan Nasabah
                    </Button>
                </div>
            </div>

            {/* ── Statistik Cards ── */}
            <div className="statistik">
                <StatistikLayout icon={FaUsers} angka={stats.total} status="Total Nasabah" variant="default" />
                <StatistikLayout icon={FaCircleCheck} angka={stats.aktif} status="Aktif" variant="success" />
                <StatistikLayout icon={FaCircleXmark} angka={stats.nonaktif} status="Nonaktif" variant="danger" />
                <StatistikLayout icon={FaClock} angka={stats.pending} status="Pending" variant="warning" />
            </div>

            {/* ── Filter Bar: Pills LEFT, Search RIGHT ── */}
            <div className="nasabah-filter-bar">
                <FilterPill
                    options={STATUS_FILTER_OPTIONS}
                    activeValue={statusFilter}
                    onChange={(val) => setStatusFilter(val)}
                />
                <SearchBar
                    placeholder="Cari nama, ID, atau email..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    width="320px"
                />
            </div>

            {/* ── Table Section ── */}
            <div className="bsu-table-section">
                {/* Error */}
                {error && (
                    <div className="nasabah-error-banner">{error}</div>
                )}

                {/* Table Content */}
                {loading ? (
                    <SkeletonTable rows={6} columns={columns.length} />
                ) : paginatedNasabah.length === 0 ? (
                    <EmptyState
                        icon={<FaUserSlash />}
                        title={
                            searchQuery
                                ? "Nasabah tidak ditemukan"
                                : statusFilter
                                    ? `Tidak ada nasabah dengan status "${statusFilter}"`
                                    : "Belum ada nasabah"
                        }
                        description={
                            searchQuery
                                ? `Tidak ada hasil untuk "${searchQuery}". Coba kata kunci lain.`
                                : statusFilter
                                    ? "Coba ubah filter status untuk melihat nasabah lainnya."
                                    : "Mulai dengan mendaftarkan nasabah baru menggunakan tombol di atas."
                        }
                    />
                ) : (
                    <Table columns={columns} data={paginatedNasabah} rowKey={(row) => row.id} />
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="nasabah-pagination-row">
                        <span className="nasabah-pagination-info">
                            Menampilkan {((currentPage - 1) * 10) + 1}–{Math.min(currentPage * 10, filteredNasabah.length)} dari {filteredNasabah.length} nasabah
                        </span>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* Modal: Daftarkan Nasabah */}
            <DaftarNasabahModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleModalSuccess}
                isAdminBsi={isAdminBsi}
                isAdminBsu={isAdminBsu}
                bankId={user?.bank_id || ""}
                identityId={user?.identity_id || ""}
                afiliasiOptions={afiliasiOptions}
            />

            {/* Popup Notifikasi */}
            {popupNotif && (
                <PopupNotifikasi
                    message={popupNotif.message}
                    type={popupNotif.type}
                    onClose={() => setPopupNotif(null)}
                />
            )}
        </>
    );
}
