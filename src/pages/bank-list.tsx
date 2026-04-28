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
import {
    FaLayerGroup,
    FaCircleCheck,
    FaCircleXmark,
    FaPlus,
    FaFileExport,
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

// ── Page ──────────────────────────────────────────────────
export default function BankListPage({ type }: BankListPageProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdminBsi = user?.role === "admin_bsi";

    const config = isAdminBsi ? ADMIN_BSI_CONFIG : SUPERADMIN_CONFIGS[type];
    const columns = buildColumns(type, isAdminBsi, navigate);

    const [bankList, setBankList] = useState<BankRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<any>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                if (isAdminBsi && user?.bank_id) {
                    // Admin BSI: only show units under their bank
                    const res = await BsiService.getUnit(user.bank_id);
                    const mapped: BankRow[] = (res.data || []).map((b) => ({
                        BankID: b.BankID,
                        NamaBank: b.NamaBank,
                        PhotoURL: b.PhotoURL,
                        IsActive: b.IsActive,
                        jumlah_nasabah: b.jumlah_nasabah,
                    }));
                    setBankList(mapped);
                } else if (type === "bsi") {
                    const res = await BsiService.getBsi();
                    const mapped: BankRow[] = (res.data || []).map((b) => ({
                        BankID: b.BankID,
                        NamaBank: b.NamaBank,
                        PhotoURL: b.PhotoURL,
                        IsActive: b.IsActive,
                        jumlah_bsu: b.jumlah_bsu,
                        jumlah_nasabah: b.jumlah_nasabah,
                    }));
                    setBankList(mapped);
                } else if (type === "bsu") {
                    const res = await BsuService.getBsu();
                    const mapped: BankRow[] = (res.data || []).map((b) => ({
                        BankID: b.BankID,
                        NamaBank: b.NamaBank,
                        PhotoURL: b.PhotoURL,
                        IsActive: b.IsActive,
                        jumlah_nasabah: b.jumlah_nasabah,
                        nama_bsi: b.nama_bsi,
                    }));
                    setBankList(mapped);
                } else if (type === "bsm") {
                    const res = await BsmService.getBsm();
                    const mapped: BankRow[] = (res.data || []).map((b) => ({
                        BankID: b.BankID,
                        NamaBank: b.NamaBank,
                        PhotoURL: b.PhotoURL,
                        IsActive: b.IsActive,
                        jumlah_nasabah: b.jumlah_nasabah,
                    }));
                    setBankList(mapped);
                }
            } catch (err) {
                console.error("Gagal mengambil data bank sampah:", err);
                setError("Gagal memuat data. Silakan coba lagi.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type, user?.bank_id, isAdminBsi]);

    // Filtering logic
    const filteredList = useMemo(() => {
        let list = bankList;
        if (statusFilter !== "all") {
            list = list.filter((b) => b.IsActive === statusFilter);
        }
        if (searchQuery) {
            const lowerSearch = searchQuery.toLowerCase();
            list = list.filter((b) => 
                b.NamaBank.toLowerCase().includes(lowerSearch) || 
                b.BankID.toLowerCase().includes(lowerSearch)
            );
        }
        return list;
    }, [bankList, statusFilter, searchQuery]);

    const total = bankList.length;
    const aktif = bankList.filter((b) => b.IsActive).length;
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

            {/* ── Page Header: Title LEFT, Actions RIGHT ── */}
            <div className="nasabah-hero">
                <div className="nasabah-hero-left">
                    <h1 className="nasabah-hero-title">{config.heroTitle}</h1>
                    <p className="nasabah-hero-desc">{config.heroDesc}</p>
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

            {/* ── Filter Bar: Pills LEFT, Search RIGHT ── */}
            <div className="nasabah-filter-bar">
                <FilterPill 
                    options={[
                        { label: "Semua", value: "all" },
                        { label: "Aktif", value: true },
                        { label: "Nonaktif", value: false },
                    ]}
                    activeValue={statusFilter}
                    onChange={(val) => setStatusFilter(val)}
                />
                <SearchBar
                    placeholder="Cari nama atau ID bank..."
                    value={searchQuery}
                    onChange={setSearchQuery}
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
                        data={filteredList}
                        rowKey={(row) => row.BankID}
                        onRowClick={handleRowClick}
                    />
                )}
            </div>

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
