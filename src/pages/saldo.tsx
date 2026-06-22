import { useState, useEffect } from "react";
import { FaMoneyBillWave, FaStar, FaEye, FaEyeSlash, FaWallet } from "react-icons/fa6";
import Table, { TableBadge, TableActionBtn, type ColumnDef } from "../components/table";
import SearchBar from "../components/search";
import Dropdown from "../components/dropdown";
import SkeletonTable from "../components/skeleton-table";
import EmptyState from "../components/empty-state";
import Pagination from "../components/pagination";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { BsiService } from "../services/bsi.service";
import "../styles/nasabah.css";
import "../styles/profil-nasabah.css";
import "../styles/layout.css";
import "../styles/saldo.css";

type NasabahSaldo = {
    nasabah_id: string;
    nama_nasabah: string;
    status_nasabah: "aktif" | "pending" | "nonaktif";
    saldo_uang: number;
    saldo_poin: number;
};

type SaldoOverview = {
    total_uang: number;
    total_poin: number;
};

type SaldoMeta = {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
};

function formatRupiah(angka: number) {
    return angka.toLocaleString("id-ID");
}

export default function SaldoPage() {
    const { user } = useAuth();
    const bankId = user?.bank_id ?? "";
    const isAdminBsi = user?.role?.toLowerCase() === "admin_bsi";

    const [selectedBankId, setSelectedBankId] = useState(bankId);
    const [bsuOptions, setBsuOptions] = useState<{ label: string; value: string }[]>([]);

    const [data, setData] = useState<NasabahSaldo[]>([]);
    const [overview, setOverview] = useState<SaldoOverview | null>(null);
    const [meta, setMeta] = useState<SaldoMeta | null>(null);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [visibleRows, setVisibleRows] = useState<Set<string>>(new Set());

    const [allData, setAllData] = useState<NasabahSaldo[]>([]);
    const [allDataLoading, setAllDataLoading] = useState(false);

    // ── Load daftar BSU untuk dropdown (admin_bsi only) ──
    useEffect(() => {
        if (!isAdminBsi || !bankId) return;
        BsiService.getUnit(bankId)
            .then((res) => {
                const units = res.data.map((u) => ({ label: u.NamaBank, value: u.BankID }));
                setBsuOptions([{ label: "Bank Sampah Saya", value: bankId }, ...units]);
            })
            .catch((err) => console.error("Gagal memuat daftar BSU:", err));
    }, [isAdminBsi, bankId]);

    // ── Sync selectedBankId ketika bankId pertama kali tersedia ──
    useEffect(() => {
        if (bankId) setSelectedBankId(bankId);
    }, [bankId]);

    // ── Reset halaman dan cache all-data saat bank dipilih ──
    useEffect(() => {
        setCurrentPage(1);
        setSearchQuery("");
        setAllData([]);
    }, [selectedBankId]);

    // ── Fetch total saldo ──
    useEffect(() => {
        if (!selectedBankId) return;
        api.get(`/dashboard/total-saldo-all-nasabah/${selectedBankId}`)
            .then((res) => setOverview(res.data.data))
            .catch((err) => console.error("Gagal memuat total saldo:", err));
    }, [selectedBankId]);

    // ── Fetch daftar saldo (server-side pagination) ──
    useEffect(() => {
        if (!selectedBankId) return;
        setLoading(true);
        setVisibleRows(new Set());
        api.get(`/dashboard/daftar-saldo-all-nasabah/${selectedBankId}`, { params: { page: currentPage } })
            .then((res) => {
                setData(res.data.data ?? []);
                setMeta(res.data.meta ?? null);
            })
            .catch((err) => console.error("Gagal memuat daftar saldo:", err))
            .finally(() => setLoading(false));
    }, [selectedBankId, currentPage]);

    // ── Fetch semua data tanpa pagination saat search aktif ──
    useEffect(() => {
        if (!searchQuery || !selectedBankId || allData.length > 0) return;
        setAllDataLoading(true);
        api.get(`/dashboard/daftar-saldo-all-nasabah/${selectedBankId}`)
            .then((res) => setAllData(res.data.data ?? []))
            .catch((err) => console.error("Gagal memuat semua data saldo:", err))
            .finally(() => setAllDataLoading(false));
    }, [searchQuery, selectedBankId, allData.length]);

    const toggleRow = (id: string) => {
        setVisibleRows((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const isSearching = searchQuery.length > 0;
    const filtered = isSearching
        ? allData.filter((row) =>
            row.nasabah_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.nama_nasabah.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : data;
    const effectiveLoading = isSearching ? allDataLoading : loading;

    const columns: ColumnDef<NasabahSaldo>[] = [
        {
            key: "nasabah_id",
            header: "ID Nasabah",
            width: "160px",
            render: (row) => <span className="table-name">{row.nasabah_id}</span>,
        },
        {
            key: "nama_nasabah",
            header: "Nama Nasabah",
            render: (row) => <span style={{ fontWeight: 500 }}>{row.nama_nasabah}</span>,
        },
        {
            key: "status_nasabah",
            header: "Status",
            width: "120px",
            render: (row) => {
                if (row.status_nasabah === "pending") {
                    return (
                        <span className="table-badge table-badge--pending">
                            <span className="table-badge-dot" />
                            Pending
                        </span>
                    );
                }
                return (
                    <TableBadge
                        label={row.status_nasabah === "aktif" ? "Aktif" : "Nonaktif"}
                        active={row.status_nasabah === "aktif"}
                    />
                );
            },
        },
        {
            key: "saldo_uang",
            header: "Saldo Uang",
            width: "170px",
            render: (row) => {
                const visible = visibleRows.has(row.nasabah_id);
                return (
                    <span className={`saldo-value ${visible ? "saldo-value--visible" : "saldo-value--hidden"}`}>
                        {visible ? `Rp ${formatRupiah(row.saldo_uang)}` : "•••••••"}
                    </span>
                );
            },
        },
        {
            key: "saldo_poin",
            header: "Saldo Poin",
            width: "150px",
            render: (row) => {
                const visible = visibleRows.has(row.nasabah_id);
                return (
                    <span className={`saldo-value ${visible ? "saldo-value--visible" : "saldo-value--hidden"}`}>
                        {visible ? `${formatRupiah(row.saldo_poin)} poin` : "•••••••"}
                    </span>
                );
            },
        },
        {
            key: "aksi",
            header: "Aksi",
            width: "70px",
            align: "center",
            render: (row) => {
                const visible = visibleRows.has(row.nasabah_id);
                return (
                    <TableActionBtn
                        icon={visible ? FaEye : FaEyeSlash}
                        title={visible ? "Sembunyikan saldo" : "Tampilkan saldo"}
                        onClick={() => toggleRow(row.nasabah_id)}
                    />
                );
            },
        },
    ];

    return (
        <>
            {/* ── Page Header ── */}
            <div className="nasabah-hero">
                <div className="nasabah-hero-left">
                    <h1 className="nasabah-hero-title">Saldo Nasabah</h1>
                    <p className="nasabah-hero-desc">
                        Pantau saldo uang dan poin seluruh nasabah bank sampah Anda dalam satu tampilan.
                    </p>
                </div>
                {isAdminBsi && bsuOptions.length > 0 && (
                    <div className="nasabah-hero-right" style={{ alignSelf: "flex-end" }}>
                        <div style={{ width: 240 }}>
                            <Dropdown
                                options={bsuOptions}
                                value={selectedBankId}
                                onChange={(e) => setSelectedBankId(e.target.value)}
                                dropdownSize="default"
                                isRounded
                                fullWidth
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ── Overview Cards ── */}
            <div className="saldo-overview">
                <div className="pn-saldo-card pn-saldo-card--green">
                    <div className="pn-saldo-icon"><FaMoneyBillWave /></div>
                    <div className="pn-saldo-body">
                        <span className="pn-saldo-number">
                            Rp {formatRupiah(overview?.total_uang ?? 0)}
                        </span>
                        <span className="pn-saldo-status">Total Saldo Uang</span>
                    </div>
                </div>
                <div className="pn-saldo-card pn-saldo-card--teal">
                    <div className="pn-saldo-icon"><FaStar /></div>
                    <div className="pn-saldo-body">
                        <span className="pn-saldo-number">
                            {formatRupiah(overview?.total_poin ?? 0)} poin
                        </span>
                        <span className="pn-saldo-status">Total Saldo Poin</span>
                    </div>
                </div>
            </div>

            {/* ── Toolbar: Search LEFT, Export RIGHT ── */}
            <div className="nasabah-filter-bar">
                <SearchBar
                    placeholder="Cari nama atau ID nasabah..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    width="320px"
                />
            </div>

            {/* ── Table ── */}
            <div className="bsu-table-section">
                {effectiveLoading ? (
                    <SkeletonTable rows={6} columns={columns.length} />
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={<FaWallet />}
                        title={searchQuery ? "Nasabah tidak ditemukan" : "Belum ada data saldo"}
                        description={
                            searchQuery
                                ? `Tidak ada hasil untuk "${searchQuery}". Coba kata kunci lain.`
                                : "Belum ada nasabah yang terdaftar di bank sampah ini."
                        }
                    />
                ) : (
                    <Table
                        columns={columns}
                        data={filtered}
                        rowKey={(row) => row.nasabah_id}
                    />
                )}

                {!isSearching && meta && meta.total_pages > 1 && (
                    <div className="nasabah-pagination-row">
                        <span className="nasabah-pagination-info">
                            Halaman {currentPage} dari {meta.total_pages} · {meta.total} nasabah
                        </span>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={meta.total_pages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </div>
        </>
    );
}
