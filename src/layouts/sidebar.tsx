import { useState, useEffect, useMemo, type ElementType } from "react";
import {
    FaChartLine,
    FaRecycle,
    FaUsers,
    FaBoxOpen,
    FaArrowDown,
    FaArrowUp,
    FaCalendar,
    FaCircleInfo,
    FaUserShield,
    FaBars,
    FaXmark,
    FaClockRotateLeft,
    FaGear,
} from "react-icons/fa6";
import "../styles/sidebar.css";
import photo from "../assets/logo-enviroo-new.png";
import dlhPhoto from "../assets/dlh-padang.png";
import logo from "../assets/logo-enviroo.png";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

type MenuItemData = {
    icon: ElementType;
    menu: string;
    id: string;
};

/* ── Menu Definitions ── */
const SUPERADMIN_MENU: MenuItemData[] = [
    { icon: FaChartLine, menu: "Dashboard", id: "superadmin" },
    { icon: FaRecycle, menu: "Bank Sampah", id: "superadmin/bank-sampah" },
    { icon: FaUsers, menu: "Pengguna", id: "superadmin/nasabah" },
    { icon: FaBoxOpen, menu: "Katalog", id: "superadmin/katalog" },
    { icon: FaCalendar, menu: "Jadwal", id: "superadmin/jadwal" },
    { icon: FaGear, menu: "Konfigurasi", id: "superadmin/reward" },
    { icon: FaCircleInfo, menu: "Informasi", id: "superadmin/informasi" },
];

const ADMIN_BSI_MENU: MenuItemData[] = [
    { icon: FaChartLine, menu: "Dashboard", id: "bsi" },
    { icon: FaRecycle, menu: "BSU", id: "bsi/bsu" },
    { icon: FaUsers, menu: "Nasabah", id: "bsi/nasabah" },
    { icon: FaBoxOpen, menu: "Katalog", id: "bsi/katalog" },
    { icon: FaCalendar, menu: "Jadwal", id: "bsi/jadwal" },
    { icon: FaClockRotateLeft, menu: "Riwayat", id: "bsi/riwayat" },
    { icon: FaGear, menu: "Konfigurasi", id: "bsi/penjualan" },
    { icon: FaCircleInfo, menu: "Konten", id: "bsi/konten" },
];

const ADMIN_BSU_MENU: MenuItemData[] = [
    { icon: FaChartLine, menu: "Dashboard", id: "bsu" },
    { icon: FaUsers, menu: "Nasabah", id: "bsu/nasabah" },
    { icon: FaBoxOpen, menu: "Katalog", id: "bsu/katalog" },
    { icon: FaCalendar, menu: "Jadwal", id: "bsu/jadwal" },
    { icon: FaClockRotateLeft, menu: "Riwayat", id: "bsu/riwayat" },
    { icon: FaGear, menu: "Konfigurasi", id: "bsu/penjualan" },
    { icon: FaCircleInfo, menu: "Konten", id: "bsu/konten" },
];

const ADMIN_BSM_MENU: MenuItemData[] = [
    { icon: FaChartLine, menu: "Dashboard", id: "bsm" },
    { icon: FaUsers, menu: "Nasabah", id: "bsm/nasabah" },
    { icon: FaBoxOpen, menu: "Katalog", id: "bsm/katalog" },
    { icon: FaCalendar, menu: "Jadwal", id: "bsm/jadwal" },
    { icon: FaClockRotateLeft, menu: "Riwayat", id: "bsm/riwayat" },
    { icon: FaGear, menu: "Konfigurasi", id: "bsm/penjualan" },
    { icon: FaCircleInfo, menu: "Konten", id: "bsm/konten" },
];

const DEFAULT_MENU: MenuItemData[] = [
    { icon: FaChartLine, menu: "Dashboard", id: "" },
];

export default function SidebarLayout() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [bankName, setBankName] = useState<string | null>(null);
    const [bankTypeName, setBankTypeName] = useState<string | null>(null);
    const [bankPhoto, setBankPhoto] = useState<string | null>(null);

    /* ── Select menu based on role ── */
    const currentMenuItems = useMemo(() => {
        const role = user?.role?.toLowerCase();
        if (role === "superadmin") return SUPERADMIN_MENU;
        if (role === "admin_bsi") return ADMIN_BSI_MENU;
        if (role === "admin_bsu") return ADMIN_BSU_MENU;
        if (role === "admin_bsm") return ADMIN_BSM_MENU;
        return DEFAULT_MENU;
    }, [user?.role]);

    /* ── Sync active state with URL ── */
    const activeId = useMemo(() => {
        const path = location.pathname.substring(1).replace(/\/$/, "") || "";

        // Find all items that match the current path
        const matches = currentMenuItems.filter(item =>
            path === item.id || path.startsWith(item.id + "/")
        );

        // Return the id of the most specific match (the longest one)
        if (matches.length === 0) return "";
        return matches.reduce((prev, curr) =>
            curr.id.length > prev.id.length ? curr : prev
        ).id;
    }, [location.pathname, currentMenuItems]);

    useEffect(() => {
        const check = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (!mobile) setMobileOpen(false);
        };
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    /* ── Fetch Bank Name for active admin ── */
    useEffect(() => {
        if (user && user.role !== "superadmin" && user.identity_id) {
            api.get(`/users/active-admin/${user.identity_id}`)
                .then(res => {
                    const data = res.data?.data;
                    if (data?.nama_bank) {
                        setBankName(data.nama_bank);
                        setBankPhoto(data.photo_url || null);
                        
                        let typeName = "";
                        switch (data.jenis_bank) {
                            case "bsi": typeName = "Bank Sampah Induk"; break;
                            case "bsm": typeName = "Bank Sampah Mandiri"; break;
                            case "bsu": typeName = "Bank Sampah Unit"; break;
                        }
                        setBankTypeName(typeName);
                    }
                })
                .catch(err => console.error("Failed to fetch bank info:", err));
        } else {
            setBankName(null);
            setBankTypeName(null);
            setBankPhoto(null);
        }
    }, [user]);

    return (
        <>
            {/* Hamburger — mobile only */}
            {isMobile && (
                <button
                    className="mobile-toggle"
                    onClick={() => setMobileOpen(v => !v)}
                    aria-label="Toggle sidebar"
                >
                    {mobileOpen ? <FaXmark /> : <FaBars />}
                </button>
            )}

            {/* Backdrop */}
            {isMobile && mobileOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <nav
                className={`sidebar${isMobile && !mobileOpen ? " hidden" : ""}`}
                aria-label="Main navigation"
            >
                {/* Logo aplikasi */}
                <div className="sidebar-logo">
                    <img src={logo} alt="Enviroo" />
                </div>

                {/* Section label */}
                <div className="menu-section-label">Menu</div>

                {/* Menu */}
                <div className="menu">
                    {currentMenuItems.map((item) => (
                        <MenuLayout
                            key={item.id}
                            icon={item.icon}
                            menu={item.menu}
                            isActive={activeId === item.id}
                            onClick={() => {
                                if (isMobile) setMobileOpen(false);
                                navigate(`/${item.id}`);
                            }}
                        />
                    ))}
                </div>

                {/* Bank brand — footer */}
                <div
                    className="sidebar-brand"
                    onClick={() => {
                        if (isMobile) setMobileOpen(false);
                        if (user?.role === "superadmin") {
                            navigate("/superadmin/profil-dlh");
                        } else {
                            navigate("/profil-bank");
                        }
                    }}
                    style={{ cursor: "pointer" }}
                    title={user?.role === "superadmin" ? "Lihat profil instansi" : "Lihat profil bank"}
                >
                    <div className="foto">
                        <img
                            src={user?.role === "superadmin" ? dlhPhoto : (bankPhoto ?? photo)}
                            alt="Bank Logo"
                        />
                    </div>
                    <div className="bank-info">
                        <div className="bank-name">{user?.role === "superadmin" ? "DLH Padang" : (bankName ?? "Enviroo")}</div>
                        <div className="bank-type">{bankTypeName ?? "Superadmin"}</div>
                    </div>
                </div>
            </nav>
        </>
    );
}

type MenuLayoutProps = {
    icon: ElementType;
    menu: string;
    isActive: boolean;
    onClick: () => void;
};

function MenuLayout({ icon: Icon, menu, isActive, onClick }: MenuLayoutProps) {
    return (
        <div
            className={`item${isActive ? " active" : ""}`}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onClick()}
            aria-current={isActive ? "page" : undefined}
        >
            <span className="item-icon"><Icon /></span>
            <span className="item-label">{menu}</span>
        </div>
    );
}