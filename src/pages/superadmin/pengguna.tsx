import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaUsers,
    FaUserGroup,
    FaUserShield,
    FaUserXmark,
    FaEye,
} from "react-icons/fa6";
import StatistikLayout from "../../layouts/statistik";
import FilterPill from "../../components/filter-pill";
import SearchBar from "../../components/search";
import Pagination from "../../components/pagination";
import { UsersService, type AllUserItem } from "../../services/users.service";
import "../../styles/nasabah.css";
import "../../styles/table.css";

/* ── Role badge styling ──────────────────────────────────── */
function roleBadgeStyle(role: string): React.CSSProperties {
    if (role === "Belum Terdaftar")
        return { background: "rgba(245,166,35,0.12)", color: "#b07c10", border: "1px solid rgba(245,166,35,0.25)" };
    if (role === "Super Admin")
        return { background: "rgba(139,92,246,0.10)", color: "#6d28d9", border: "1px solid rgba(139,92,246,0.2)" };
    if (role === "Nasabah")
        return { background: "rgba(34,197,94,0.10)", color: "#15803d", border: "1px solid rgba(34,197,94,0.2)" };
    if (role.startsWith("Admin"))
        return { background: "rgba(59,130,246,0.10)", color: "#1d4ed8", border: "1px solid rgba(59,130,246,0.2)" };
    if (role.startsWith("Petugas"))
        return { background: "rgba(20,184,166,0.10)", color: "#0f766e", border: "1px solid rgba(20,184,166,0.2)" };
    return { background: "rgba(100,116,139,0.10)", color: "#475569", border: "1px solid rgba(100,116,139,0.2)" };
}

const BADGE_BASE: React.CSSProperties = {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 600,
    fontFamily: "var(--ff-sans)",
    marginRight: "4px",
    marginBottom: "2px",
    whiteSpace: "nowrap",
};

const FILTER_OPTIONS = [
    { label: "Semua", value: "" },
    { label: "Nasabah", value: "nasabah" },
    { label: "Staff", value: "staff" },
    { label: "Akun Kosong", value: "kosong" },
];

const ITEMS_PER_PAGE = 25;

const isNasabah = (u: AllUserItem) => u.roles.includes("Nasabah");
const isKosong  = (u: AllUserItem) => u.roles.includes("Belum Terdaftar");
const isStaff   = (u: AllUserItem) => u.roles.some(r => r !== "Nasabah" && r !== "Belum Terdaftar");

export default function SuperadminPenggunaPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [roleFilter, setRoleFilter] = useState("");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // Server-mode state
    const [pageUsers, setPageUsers] = useState<AllUserItem[]>([]);
    const [serverTotalPages, setServerTotalPages] = useState(1);
    const [serverTotalItems, setServerTotalItems] = useState(0);

    // Local-mode state: semua data, di-cache setelah pertama kali dimuat
    const [allUsers, setAllUsers] = useState<AllUserItem[]>([]);
    const [allUsersLoaded, setAllUsersLoaded] = useState(false);

    const isLocalMode = search.trim() !== "" || roleFilter !== "";

    // Server mode: fetch halaman saat ini
    useEffect(() => {
        if (isLocalMode) return;
        setLoading(true);
        setError(null);
        UsersService.getAllUsers({ page: currentPage, limit: ITEMS_PER_PAGE })
            .then(res => {
                setPageUsers(Array.isArray(res.data) ? res.data : []);
                setServerTotalPages(res.pagination?.total_pages ?? 1);
                setServerTotalItems(res.pagination?.total_items ?? 0);
            })
            .catch(() => setError("Gagal mengambil data pengguna. Pastikan server backend aktif."))
            .finally(() => setLoading(false));
    }, [currentPage, isLocalMode]);

    // Fetch semua user untuk stats + local mode filter (di-cache, background)
    useEffect(() => {
        if (allUsersLoaded) return;
        UsersService.getAllUsers()
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : [];
                setAllUsers(data);
                setAllUsersLoaded(true);
            })
            .catch(() => {});
    }, [allUsersLoaded]);

    /* ── Stats ───────────────────────────────────────────── */
    const stats = useMemo(() => {
        const src = allUsersLoaded ? allUsers : [];
        return {
            total:   allUsersLoaded ? allUsers.length : serverTotalItems,
            nasabah: src.filter(isNasabah).length,
            staff:   src.filter(isStaff).length,
            kosong:  src.filter(isKosong).length,
        };
    }, [allUsers, allUsersLoaded, serverTotalItems]);

    /* ── Filtered list (local mode) ──────────────────────── */
    const filtered = useMemo(() => {
        if (!isLocalMode) return allUsers;
        let list = allUsers;
        if (roleFilter === "nasabah") list = list.filter(isNasabah);
        else if (roleFilter === "staff") list = list.filter(isStaff);
        else if (roleFilter === "kosong") list = list.filter(isKosong);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(u =>
                u.nama_user.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.user_id.toLowerCase().includes(q)
            );
        }
        return list;
    }, [allUsers, roleFilter, search, isLocalMode]);

    const totalPages = isLocalMode
        ? Math.ceil(filtered.length / ITEMS_PER_PAGE)
        : serverTotalPages;

    const paginated = isLocalMode
        ? filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
        : pageUsers;

    

    const handleFilterChange = (val: string) => { setRoleFilter(val); setCurrentPage(1); };
    const handleSearch       = (val: string) => { setSearch(val);     setCurrentPage(1); };

    const startRow = (currentPage - 1) * ITEMS_PER_PAGE + 1;

    return (
        <>
            {/* ── Hero ─────────────────────────────────────── */}
            <div className="nasabah-hero">
                <div className="nasabah-hero-left">
                    <h1 className="nasabah-hero-title">Manajemen Pengguna</h1>
                    <p className="nasabah-hero-desc">
                        Pantau seluruh akun yang terdaftar di sistem — nasabah, staff bank sampah, dan akun tanpa peran aktif.
                    </p>
                </div>
            </div>

            {/* ── Stats ────────────────────────────────────── */}
            <div className="statistik">
                <StatistikLayout icon={FaUsers}      angka={stats.total}   status="Total Pengguna" variant="default" />
                <StatistikLayout icon={FaUserGroup}  angka={stats.nasabah} status="Nasabah"         variant="success" />
                <StatistikLayout icon={FaUserShield} angka={stats.staff}   status="Staff"           variant="teal"    />
                <StatistikLayout icon={FaUserXmark}  angka={stats.kosong}  status="Akun Kosong"     variant="warning" />
            </div>

            {/* ── Filter + Search ───────────────────────────── */}
            <div className="nasabah-filter-bar">
                <FilterPill
                    options={FILTER_OPTIONS}
                    activeValue={roleFilter}
                    onChange={handleFilterChange}
                />
                <SearchBar
                    placeholder="Cari nama, ID, atau email..."
                    value={search}
                    onChange={handleSearch}
                    width="300px"
                />
            </div>

            {/* ── Table ────────────────────────────────────── */}
            <div className="bsu-table-section">
                {error && <div className="nasabah-error-banner">{error}</div>}

                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: "48px" }}>No</th>
                                <th style={{ width: "40px" }}></th>
                                <th>Nama</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th style={{ width: "72px", textAlign: "center" }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="table-empty">Memuat data...</td></tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="table-empty">
                                        {search
                                            ? `Tidak ada hasil untuk "${search}".`
                                            : roleFilter
                                                ? "Tidak ada pengguna dalam kategori ini."
                                                : "Belum ada data pengguna."}
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((user, idx) => (
                                    <tr key={user.user_id}>
                                        <td style={{ color: "var(--c-text-muted)", fontSize: "12px" }}>
                                            {startRow + idx}
                                        </td>
                                        <td>
                                            <div className="table-avatar">
                                                {user.foto ? (
                                                    <img src={user.foto} alt={user.nama_user} />
                                                ) : (
                                                    <span className="table-avatar-fallback">
                                                        {user.nama_user.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{user.nama_user}</td>
                                        <td style={{ color: "var(--c-text-muted)" }}>{user.email}</td>
                                        <td>
                                            {user.roles.map(role => (
                                                <span key={role} style={{ ...BADGE_BASE, ...roleBadgeStyle(role) }}>
                                                    {role}
                                                </span>
                                            ))}
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            <button
                                                className="table-action-btn"
                                                title="Lihat detail pengguna"
                                                onClick={() => navigate(`/superadmin/nasabah/${user.user_id}`, { state: { roles: user.roles } })}
                                            >
                                                <FaEye />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ───────────────────────────── */}
                {totalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 24px" }}>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>
            <br /><br />
        </>
    );
}
