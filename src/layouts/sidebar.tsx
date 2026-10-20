import { useState, useEffect, useMemo, type ElementType } from "react";
import {
    FaChartLine,
    FaRecycle,
    FaUsers,
    FaBoxOpen,
    FaBasketShopping,
    FaLocationDot,
    FaCalendar,
    FaCircleInfo,
    FaBars,
    FaXmark,
    FaClockRotateLeft,
    FaGear,
    FaWallet,
} from "react-icons/fa6";
import "../styles/sidebar.css";
import photo from "../assets/enviroo-pfp.png";
import dlhPhoto from "../assets/dlh-padang.png";
import logo from "../assets/logo-enviroo.png";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export type MenuItemData = {
    icon: ElementType;
    menu: string;
    id: string;
};

export type MenuGroupData = {
    groupLabel: string;
    items: MenuItemData[];
};

export type SidebarEntry = MenuItemData | MenuGroupData;

export function isGroup(entry: SidebarEntry): entry is MenuGroupData {
    return "groupLabel" in entry;
}

export const SUPERADMIN_MENU: SidebarEntry[] = [
    { groupLabel: "Insight", items: [
        { icon: FaChartLine, menu: "Dashboard", id: "superadmin" },
    ]},
    { groupLabel: "Data", items: [
        { icon: FaRecycle,         menu: "Bank Sampah", id: "superadmin/bank-sampah" },
        { icon: FaUsers,           menu: "Pengguna",    id: "superadmin/nasabah"     },
        { icon: FaBoxOpen,         menu: "Sampah",      id: "superadmin/katalog"     },
        { icon: FaBasketShopping,  menu: "Barang",      id: "superadmin/barang"      },
    ]},
    { groupLabel: "Konfigurasi", items: [
        { icon: FaGear,        menu: "Operasional", id: "superadmin/reward"  },
        { icon: FaLocationDot, menu: "Lokasi",      id: "superadmin/lokasi"  },
    ]},
    { groupLabel: "Media", items: [
        { icon: FaCircleInfo, menu: "Informasi", id: "superadmin/informasi" },
    ]},
];

export const ADMIN_BSI_MENU: SidebarEntry[] = [
    { groupLabel: "Insight", items: [
        { icon: FaChartLine, menu: "Dashboard", id: "bsi" },
    ]},
    { groupLabel: "Data", items: [
        { icon: FaRecycle, menu: "BSU",     id: "bsi/bsu"     },
        { icon: FaUsers,   menu: "Nasabah", id: "bsi/nasabah" },
        { icon: FaWallet,  menu: "Saldo",   id: "bsi/saldo"   },
    ]},
    { groupLabel: "Konfigurasi", items: [
        { icon: FaBoxOpen,  menu: "Katalog", id: "bsi/katalog"   },
        { icon: FaCalendar, menu: "Jadwal",  id: "bsi/jadwal"    },
        { icon: FaGear,     menu: "Reward",  id: "bsi/penjualan" },
    ]},
    { groupLabel: "Pencatatan", items: [
        { icon: FaClockRotateLeft, menu: "Riwayat", id: "bsi/riwayat" },
        { icon: FaCircleInfo,      menu: "Konten",  id: "bsi/konten"  },
    ]},
];

export const ADMIN_BSU_MENU: SidebarEntry[] = [
    { groupLabel: "Insight", items: [
        { icon: FaChartLine, menu: "Dashboard", id: "bsu" },
    ]},
    { groupLabel: "Data", items: [
        { icon: FaUsers,  menu: "Nasabah", id: "bsu/nasabah" },
        { icon: FaWallet, menu: "Saldo",   id: "bsu/saldo"   },
    ]},
    { groupLabel: "Konfigurasi", items: [
        { icon: FaBoxOpen,  menu: "Katalog", id: "bsu/katalog"   },
        { icon: FaCalendar, menu: "Jadwal",  id: "bsu/jadwal"    },
        { icon: FaGear,     menu: "Reward",  id: "bsu/penjualan" },
    ]},
    { groupLabel: "Pencatatan", items: [
        { icon: FaClockRotateLeft, menu: "Riwayat", id: "bsu/riwayat" },
        { icon: FaCircleInfo,      menu: "Konten",  id: "bsu/konten"  },
    ]},
];

export const ADMIN_BSM_MENU: SidebarEntry[] = [
    { groupLabel: "Insight", items: [
        { icon: FaChartLine, menu: "Dashboard", id: "bsm" },
    ]},
    { groupLabel: "Data", items: [
        { icon: FaUsers,  menu: "Nasabah", id: "bsm/nasabah" },
        { icon: FaWallet, menu: "Saldo",   id: "bsm/saldo"   },
    ]},
    { groupLabel: "Konfigurasi", items: [
        { icon: FaBoxOpen,  menu: "Katalog", id: "bsm/katalog"    },
        { icon: FaCalendar, menu: "Jadwal",  id: "bsm/jadwal"     },
        { icon: FaGear,     menu: "Transaksi", id: "bsm/penjualan"  },
    ]},
    { groupLabel: "Pencatatan", items: [
        { icon: FaClockRotateLeft, menu: "Riwayat", id: "bsm/riwayat" },
    ]},
];

const DEFAULT_MENU: SidebarEntry[] = [
    { icon: FaChartLine, menu: "Dashboard", id: "" },
];

export default function SidebarLayout() {
    const { user, activeAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const bankName = activeAdmin?.nama_bank ?? null;
    const bankPhoto = activeAdmin?.photo_url ?? null;
    const bankTypeName = useMemo(() => {
        if (!activeAdmin) return null;
        switch (activeAdmin.jenis_bank) {
            case "bsi": return "Bank Sampah Induk";
            case "bsm": return "Bank Sampah Mandiri";
            case "bsu": return "Bank Sampah Unit";
            default: return "";
        }
    }, [activeAdmin]);

    const currentMenuItems = useMemo(() => {
        const role = user?.role?.toLowerCase();
        if (role === "superadmin") return SUPERADMIN_MENU;
        if (role === "admin_bsi") return ADMIN_BSI_MENU;
        if (role === "admin_bsu") return ADMIN_BSU_MENU;
        if (role === "admin_bsm") return ADMIN_BSM_MENU;
        return DEFAULT_MENU;
    }, [user?.role]);

    const allItems = useMemo(() =>
        currentMenuItems.flatMap(entry => isGroup(entry) ? entry.items : [entry]),
        [currentMenuItems]
    );

    const activeId = useMemo(() => {
        const path = location.pathname.substring(1).replace(/\/$/, "") || "";
        const matches = allItems.filter(item =>
            path === item.id || path.startsWith(item.id + "/")
        );
        if (matches.length === 0) return "";
        return matches.reduce((prev, curr) =>
            curr.id.length > prev.id.length ? curr : prev
        ).id;
    }, [location.pathname, allItems]);

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

    return (
        <>
            {isMobile && (
                <button
                    className="mobile-toggle"
                    onClick={() => setMobileOpen(v => !v)}
                    aria-label="Toggle sidebar"
                >
                    {mobileOpen ? <FaXmark /> : <FaBars />}
                </button>
            )}

            {isMobile && mobileOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <nav
                className={`sidebar${isMobile && !mobileOpen ? " hidden" : ""}`}
                aria-label="Main navigation"
            >
                <div className="sidebar-logo">
                    <img src={logo} alt="Enviroo" />
                </div>

                <div className="menu">
                    {currentMenuItems.map((entry) =>
                        isGroup(entry) ? (
                            <div key={entry.groupLabel} className="menu-group">
                                <span className="menu-group-label">{entry.groupLabel}</span>
                                {entry.items.map((item) => (
                                    <MenuLayout
                                        key={item.id}
                                        icon={item.icon}
                                        menu={item.menu}
                                        isActive={activeId === item.id}
                                        isSub
                                        onClick={() => {
                                            if (isMobile) setMobileOpen(false);
                                            navigate(`/${item.id}`);
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <MenuLayout
                                key={entry.id}
                                icon={entry.icon}
                                menu={entry.menu}
                                isActive={activeId === entry.id}
                                onClick={() => {
                                    if (isMobile) setMobileOpen(false);
                                    navigate(`/${entry.id}`);
                                }}
                            />
                        )
                    )}
                </div>

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
    isSub?: boolean;
    onClick: () => void;
};

function MenuLayout({ icon: Icon, menu, isActive, isSub, onClick }: MenuLayoutProps) {
    return (
        <div
            className={`item${isActive ? " active" : ""}${isSub ? " sub" : ""}`}
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