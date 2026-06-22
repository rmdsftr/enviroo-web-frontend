import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import StatistikLayout from "../layouts/statistik";
import BreadcrumbLayout from "../layouts/breadcrumb";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import Table, {
    TableAvatar,
    TableBadge,
    type ColumnDef,
} from "../components/table";
import Button from "../components/button";
import { useAuth } from "../contexts/AuthContext";
import { BsiService } from "../services/bsi.service";
import { BsuService } from "../services/bsu.service";
import { BsmService } from "../services/bsm.service";
import "../styles/layout.css";
import "../styles/bsu.css";
import "../styles/nasabah.css";
import FilterPill from "../components/filter-pill";
import SearchBar from "../components/search";
import Pagination from "../components/pagination";
import {
    FaLayerGroup,
    FaCircleCheck,
    FaCircleXmark,
    FaPlus,
} from "react-icons/fa6";

// ── Unified row type ──────────────────────────────────────
type BankRow = {
    BankID: string;
    NamaBank: string;
    PhotoURL: string;
    IsActive: boolean;
    jumlah_nasabah?: number;
    jumlah_bsu?: number;    // BSI only
    nama_bsi?: string;      // BSU (superadmin) only
    jumlah_staff?: number;  // BSM only
};

// ── Page type ─────────────────────────────────────────────
export type BankListType = "bsi" | "bsu" | "bsm";

interface PageConfig {
    heroTitle: string;
    heroDesc: string;
    statistikLabel: string;
    statistikDeskripsi: string;
    registerLabel: string;
    registerPath: string;
    detailPath: string;
    breadcrumbLabel: string;
}

const SUPERADMIN_CONFIGS: Record<BankListType, PageConfig> = {
    bsi: {
        heroTitle: "Manajemen BSI",
        heroDesc: "Kelola data Bank Sampah Induk (BSI) secara keseluruhan — tambah, cari, dan tinjau status operasional BSI di seluruh wilayah.",
        statistikLabel: "Bank Sampah Induk",
        statistikDeskripsi: "Total BSI secara keseluruhan",
        registerLabel: "Daftarkan BSI Baru",
        registerPath: "/superadmin/bank-sampah/bsi/new",
        detailPath: "/superadmin/bank-sampah/bsi",
        breadcrumbLabel: "Bank Sampah Induk",
    },
    bsu: {
        heroTitle: "Manajemen BSU",
        heroDesc: "Kelola data Bank Sampah Unit (BSU) — pantau BSU yang terafiliasi dengan BSI dan tinjau status operasionalnya.",
        statistikLabel: "Bank Sampah Unit",
        statistikDeskripsi: "Total BSU secara keseluruhan",
        registerLabel: "Daftarkan BSU Baru",
        registerPath: "/superadmin/bank-sampah/bsu/new",
        detailPath: "/superadmin/bank-sampah/bsu",
        breadcrumbLabel: "Bank Sampah Unit",
    },
    bsm: {
        heroTitle: "Manajemen BSM",
        heroDesc: "Kelola data Bank Sampah Mandiri (BSM) — tambah, cari, dan tinjau status operasional BSM di seluruh wilayah.",
        statistikLabel: "Bank Sampah Mandiri",
        statistikDeskripsi: "Total BSM secara keseluruhan",
        registerLabel: "Daftarkan BSM Baru",
        registerPath: "/superadmin/bank-sampah/bsm/new",
        detailPath: "/superadmin/bank-sampah/bsm",
        breadcrumbLabel: "Bank Sampah Mandiri",
    },
};

const ADMIN_BSI_CONFIG: PageConfig = {
    heroTitle: "Manajemen BSU",
    heroDesc: "Kelola data Bank Sampah Unit (BSU) cabang Anda — tambah, cari, dan pantau status BSU untuk mendukung operasional bank sampah.",
    statistikLabel: "Total BSU",
    statistikDeskripsi: "yang terdaftar di bawah BSI anda",
    registerLabel: "Daftarkan BSU Baru",
    registerPath: "/bsi/bsu/new",
    detailPath: "/bsi/bsu",
    breadcrumbLabel: "Bank Sampah Unit",
};

// ── Column builders ───────────────────────────────────────
function buildColumns(type: BankListType, isAdminBsi: boolean, navigate: (path: string) => void): ColumnDef<BankRow>[] {
    const getDetailPath = (bankId: string) => {
        if (isAdminBsi) return `/bsi/bsu/${bankId}`;
        return `${SUPERADMIN_CONFIGS[type].detailPath}/${bankId}`;
    };

    const cols: ColumnDef<BankRow>[] = [
        {
            key: "foto",
            header: "Foto",
            width: "56px",
            align: "center",
            render: (row) => <TableAvatar src={row.PhotoURL} alt={row.NamaBank} />,
        },
        {
            key: "bank_id",
            header: "Bank ID",
            width: "120px",
            render: (row) => (
                <span
                    className="table-name table-name--link"
                    onClick={() => navigate(getDetailPath(row.BankID))}
                    style={{ cursor: "pointer", fontFamily: "monospace", fontSize: "12px" }}
                >
                    {row.BankID}
                </span>
            ),
        },
        {
            key: "nama",
            header: isAdminBsi ? "Nama BSU" : type === "bsi" ? "Nama BSI" : type === "bsu" ? "Nama BSU" : "Nama BSM",
            render: (row) => (
                <span
                    className="table-name table-name--link"
                    onClick={() => navigate(getDetailPath(row.BankID))}
                    style={{ cursor: "pointer" }}
                >
                    {row.NamaBank}
                </span>
            ),
        },
    ];

    // BSI only: show jumlah BSU
    if (type === "bsi" && !isAdminBsi) {
        cols.push({
            key: "jumlah_bsu",
            header: "Jumlah BSU",
            align: "center",
            width: "140px",
            render: (row) => <span style={{ fontWeight: 600 }}>{row.jumlah_bsu ?? 0}</span>,
        });
    }

    // BSU (superadmin): show parent BSI name
    if (type === "bsu" && !isAdminBsi) {
        cols.push({
            key: "nama_bsi",
            header: "Bank Sampah Induk",
            render: (row) => <span className="table-name">{row.nama_bsi ?? "-"}</span>,
        });
    }

    // All: jumlah nasabah
    cols.push({
        key: "jumlah_nasabah",
        header: "Jumlah Nasabah",
        align: "center",
        width: "140px",
        render: (row) => <span style={{ fontWeight: 600 }}>{row.jumlah_nasabah ?? 0}</span>,
    });

    // BSU & BSM: jumlah staff
    if (type === "bsu" || type === "bsm") {
        cols.push({
            key: "jumlah_staff",
            header: "Jumlah Staff",
            align: "center",
            width: "120px",
            render: (row) => <span style={{ fontWeight: 600 }}>{row.jumlah_staff ?? 0}</span>,
        });
    }

    // All: status
    cols.push({
        key: "status",
        header: "Status",
        width: "120px",
        render: (row) => (
            <TableBadge label={row.IsActive ? "Aktif" : "Nonaktif"} active={row.IsActive} />
        ),
    });

    return cols;
}

// ── Props ─────────────────────────────────────────────────
interface BankListPageProps {
    type: BankListType;
}

const PAGE_SIZE = 20;

// ── Page ──────────────────────────────────────────────────
export default function BankListPage({ type }: BankListPageProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdminBsi = user?.role === "admin_bsi";

    const config = isAdminBsi ? ADMIN_BSI_CONFIG : SUPERADMIN_CONFIGS[type];
    const columns = buildColumns(type, isAdminBsi, navigate);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<any>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // admin_bsi: server-paged current page + all-data cache
    const [bankList, setBankList] = useState<BankRow[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [allBsuList, setAllBsuList] = useState<BankRow[]>([]);

    // superadmin: server-paged current page
    const [pageData, setPageData] = useState<BankRow[]>([]);
    const [serverTotalPages, setServerTotalPages] = useState(1);
    const [serverTotalItems, setServerTotalItems] = useState(0);
    // superadmin: all-data cache for search/filter
    const [allBankList, setAllBankList] = useState<BankRow[]>([]);
    const [allBankListLoaded, setAllBankListLoaded] = useState(false);

    const isSuperadminLocalMode = !isAdminBsi && (searchQuery.trim() !== "" || statusFilter !== "all");

    // Reset superadmin cache when bank type changes
    useEffect(() => {
        if (isAdminBsi) return;
        setPageData([]);
        setAllBankList([]);
        setAllBankListLoaded(false);
        setCurrentPage(1);
        setServerTotalPages(1);
        setServerTotalItems(0);
    }, [type, isAdminBsi]);

    // admin_bsi: fetch all BSU once for search/filter
    useEffect(() => {
        if (!isAdminBsi || !user?.bank_id) return;
        BsiService.getUnit(user.bank_id).then((res) => {
            setAllBsuList((res.data || []).map((b) => ({
                BankID: b.BankID,
                NamaBank: b.NamaBank,
                PhotoURL: b.PhotoURL,
                IsActive: b.IsActive,
                jumlah_nasabah: b.jumlah_nasabah,
                jumlah_staff: b.jumlah_staff,
            })));
        }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.bank_id, isAdminBsi]);

    // admin_bsi: server-paged BSU
    useEffect(() => {
        if (!isAdminBsi || !user?.bank_id) return;
        setLoading(true);
        setError(null);
        BsiService.getUnitPaged(user.bank_id, currentPage)
            .then((res) => {
                setBankList((res.data || []).map((b) => ({
                    BankID: b.BankID,
                    NamaBank: b.NamaBank,
                    PhotoURL: b.PhotoURL,
                    IsActive: b.IsActive,
                    jumlah_nasabah: b.jumlah_nasabah,
                    jumlah_staff: b.jumlah_staff,
                })));
                setTotalPages(res.pagination.total_pages);
            })
            .catch(() => setError("Gagal memuat data. Silakan coba lagi."))
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.bank_id, isAdminBsi, currentPage]);

    // superadmin server mode: fetch current page
    useEffect(() => {
        if (isAdminBsi || isSuperadminLocalMode) return;
        setLoading(true);
        setError(null);
        const fetchPage = async () => {
            try {
                if (type === "bsi") {
                    const res = await BsiService.getBsiPaged(currentPage);
                    setPageData((res.data || []).map((b) => ({
                        BankID: b.BankID, NamaBank: b.NamaBank, PhotoURL: b.PhotoURL,
                        IsActive: b.IsActive, jumlah_bsu: b.jumlah_bsu, jumlah_nasabah: b.jumlah_nasabah,
                    })));
                    setServerTotalPages(res.pagination.total_pages);
                    setServerTotalItems(res.pagination.total);
                } else if (type === "bsu") {
                    const res = await BsuService.getBsuPaged(currentPage);
                    setPageData((res.data || []).map((b) => ({
                        BankID: b.bank_id, NamaBank: b.nama_bsu, PhotoURL: b.photo_url,
                        IsActive: b.is_active, jumlah_nasabah: b.jumlah_nasabah,
                        jumlah_staff: b.jumlah_staff, nama_bsi: b.nama_bank_induk,
                    })));
                    setServerTotalPages(res.pagination.total_pages);
                    setServerTotalItems(res.pagination.total);
                } else {
                    const res = await BsmService.getBsmPaged(currentPage);
                    setPageData((res.data || []).map((b) => ({
                        BankID: b.bank_id, NamaBank: b.nama_bsm, PhotoURL: b.photo_url,
                        IsActive: b.is_active, jumlah_nasabah: b.jumlah_nasabah,
                        jumlah_staff: b.jumlah_staff,
                    })));
                    setServerTotalPages(res.pagination.total_pages);
                    setServerTotalItems(res.pagination.total);
                }
            } catch {
                setError("Gagal memuat data. Silakan coba lagi.");
            } finally {
                setLoading(false);
            }
        };
        fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type, currentPage, isAdminBsi, isSuperadminLocalMode]);

    // superadmin local mode: fetch all (cached)
    useEffect(() => {
        if (isAdminBsi || !isSuperadminLocalMode || allBankListLoaded) return;
        setLoading(true);
        setError(null);
        const fetchAll = async () => {
            try {
                if (type === "bsi") {
                    const res = await BsiService.getBsi();
                    setAllBankList((res.data || []).map((b) => ({
                        BankID: b.BankID, NamaBank: b.NamaBank, PhotoURL: b.PhotoURL,
                        IsActive: b.IsActive, jumlah_bsu: b.jumlah_bsu, jumlah_nasabah: b.jumlah_nasabah,
                    })));
                } else if (type === "bsu") {
                    const res = await BsuService.getBsu();
                    setAllBankList((res.data || []).map((b) => ({
                        BankID: b.bank_id, NamaBank: b.nama_bsu, PhotoURL: b.photo_url,
                        IsActive: b.is_active, jumlah_nasabah: b.jumlah_nasabah,
                        jumlah_staff: b.jumlah_staff, nama_bsi: b.nama_bank_induk,
                    })));
                } else {
                    const res = await BsmService.getBsm();
                    setAllBankList((res.data || []).map((b) => ({
                        BankID: b.bank_id, NamaBank: b.nama_bsm, PhotoURL: b.photo_url,
                        IsActive: b.is_active, jumlah_nasabah: b.jumlah_nasabah,
                        jumlah_staff: b.jumlah_staff,
                    })));
                }
                setAllBankListLoaded(true);
            } catch {
                setError("Gagal memuat data. Silakan coba lagi.");
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type, isAdminBsi, isSuperadminLocalMode, allBankListLoaded]);

    // ── admin_bsi filtering ───────────────────────────────
    const isSearching = isAdminBsi && !!searchQuery;
    const isStatusFiltering = isAdminBsi && statusFilter !== "all";

    const adminBsiFilteredList = useMemo(() => {
        if (!isAdminBsi) return [];
        if (isSearching) {
            let list = statusFilter !== "all" ? allBsuList.filter(b => b.IsActive === statusFilter) : allBsuList;
            const q = searchQuery.toLowerCase();
            return list.filter(b => b.NamaBank.toLowerCase().includes(q) || b.BankID.toLowerCase().includes(q));
        }
        if (isStatusFiltering) {
            const filtered = allBsuList.filter(b => b.IsActive === statusFilter);
            return filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
        }
        return bankList;
    }, [bankList, allBsuList, isAdminBsi, isSearching, isStatusFiltering, statusFilter, searchQuery, currentPage]);

    // ── superadmin filtering ──────────────────────────────
    const superadminFiltered = useMemo(() => {
        if (isAdminBsi || !isSuperadminLocalMode) return [];
        let list = allBankList;
        if (statusFilter !== "all") list = list.filter(b => b.IsActive === statusFilter);
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            list = list.filter(b => b.NamaBank.toLowerCase().includes(q) || b.BankID.toLowerCase().includes(q));
        }
        return list;
    }, [allBankList, isAdminBsi, isSuperadminLocalMode, statusFilter, searchQuery]);

    const superadminPageSlice = useMemo(() => {
        if (isSuperadminLocalMode) {
            return superadminFiltered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
        }
        return pageData;
    }, [isSuperadminLocalMode, superadminFiltered, pageData, currentPage]);

    const displayData = isAdminBsi ? adminBsiFilteredList : superadminPageSlice;

    const superadminTotalPages = isSuperadminLocalMode
        ? Math.max(1, Math.ceil(superadminFiltered.length / PAGE_SIZE))
        : serverTotalPages;

    const adminBsiTotalPages = isStatusFiltering && !isSearching
        ? Math.max(1, Math.ceil(allBsuList.filter(b => b.IsActive === statusFilter).length / PAGE_SIZE))
        : totalPages;

    // ── Stats ─────────────────────────────────────────────
    const total = isAdminBsi
        ? allBsuList.length
        : (allBankListLoaded ? allBankList.length : serverTotalItems);
    const aktif = isAdminBsi
        ? (allBsuList.length > 0 ? allBsuList.filter(b => b.IsActive).length : bankList.filter(b => b.IsActive).length)
        : (allBankListLoaded ? allBankList.filter(b => b.IsActive).length : pageData.filter(b => b.IsActive).length);
    const nonaktif = total - aktif;

    const handleRowClick = (row: BankRow) => {
        if (isAdminBsi) {
            navigate(`/bsi/bsu/${row.BankID}`);
        } else {
            navigate(`${SUPERADMIN_CONFIGS[type].detailPath}/${row.BankID}`);
        }
    };

    return (
        <>
            {/* Breadcrumb (superadmin only) */}
            {!isAdminBsi && (
                <BreadcrumbLayout
                    items={[
                        { label: "Bank Sampah", path: "/superadmin/bank-sampah" },
                        { label: config.breadcrumbLabel },
                    ]}
                />
            )}

            {/* ── Page Header ── */}
            <div className="nasabah-hero">
                <div className="nasabah-hero-left">
                    <h1 className="nasabah-hero-title">{config.heroTitle}</h1>
                    <p className="nasabah-hero-desc">{config.heroDesc}</p>
                </div>
                <div className="nasabah-hero-right">
                    <Button
                        icon={<FaPlus />}
                        color="secondary"
                        variant="solid"
                        size="default"
                        isRounded
                        onClick={() => navigate(config.registerPath)}
                    >
                        {config.registerLabel}
                    </Button>
                </div>
            </div>

            {/* Statistik */}
            <div className="statistik">
                <StatistikLayout
                    icon={FaLayerGroup}
                    angka={loading ? "..." : total}
                    status={config.statistikLabel}
                    deskripsi={config.statistikDeskripsi}
                    variant="default"
                />
                <StatistikLayout
                    icon={FaCircleCheck}
                    angka={loading ? "..." : aktif}
                    status="Aktif"
                    deskripsi={`${config.statistikLabel.split(" ").pop()} yang aktif beroperasi`}
                    variant="success"
                />
                <StatistikLayout
                    icon={FaCircleXmark}
                    angka={loading ? "..." : nonaktif}
                    status="Nonaktif"
                    deskripsi={`${config.statistikLabel.split(" ").pop()} yang tidak aktif atau suspended`}
                    variant="danger"
                />
            </div>

            {/* ── Filter Bar ── */}
            <div className="nasabah-filter-bar">
                <FilterPill
                    options={[
                        { label: "Semua", value: "all" },
                        { label: "Aktif", value: true },
                        { label: "Nonaktif", value: false },
                    ]}
                    activeValue={statusFilter}
                    onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                />
                <SearchBar
                    placeholder="Cari nama atau ID bank..."
                    value={searchQuery}
                    onChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
                    width="320px"
                />
            </div>

            {/* Tabel */}
            <div className="bsu-table-section">
                {error && (
                    <div style={{ padding: "16px 24px", color: "#c13a3a", fontSize: "14px" }}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--n-muted)", fontWeight: 500 }}>
                        Memuat data...
                    </div>
                ) : (
                    <Table
                        columns={columns}
                        data={displayData}
                        rowKey={(row) => row.BankID}
                        onRowClick={handleRowClick}
                    />
                )}
            </div>

            {/* Superadmin pagination */}
            {!isAdminBsi && superadminTotalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 24px" }}>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={superadminTotalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* admin_bsi pagination */}
            {isAdminBsi && !isSearching && (
                <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 24px" }}>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={adminBsiTotalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

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
