import { useState, useEffect, useRef, useMemo, type KeyboardEvent } from "react";
import { FaBell, FaChevronDown, FaRightFromBracket, FaUser } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import "../styles/navbar.css";
import ava from "../assets/profile.png";
import SearchBar from "../components/search";
import { useAuth } from "../contexts/AuthContext";
import { NotifikasiService } from "../services/notifikasi.service";
import {
    SUPERADMIN_MENU, ADMIN_BSI_MENU, ADMIN_BSU_MENU, ADMIN_BSM_MENU,
    type MenuItemData,
} from "./sidebar";

const ADMIN_ROLES = ["admin_bsi", "admin_bsu", "admin_bsm"];

export default function NavbarLayout() {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const searchRef = useRef<HTMLDivElement>(null);

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const role = user?.role?.toLowerCase() ?? "";
    const isAdmin = ADMIN_ROLES.includes(role);

    const menuItems: MenuItemData[] = useMemo(() => {
        if (role === "superadmin") return SUPERADMIN_MENU;
        if (role === "admin_bsi") return ADMIN_BSI_MENU;
        if (role === "admin_bsu") return ADMIN_BSU_MENU;
        if (role === "admin_bsm") return ADMIN_BSM_MENU;
        return [];
    }, [role]);

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        return menuItems.filter(item =>
            item.menu.toLowerCase().includes(q) ||
            item.id.toLowerCase().includes(q)
        );
    }, [searchQuery, menuItems]);

    const showResults = searchOpen && searchQuery.trim().length > 0;

    useEffect(() => { setFocusedIndex(-1); }, [searchResults]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (!isAdmin || !user?.user_id) return;
        NotifikasiService.getUnreadCount(user.user_id)
            .then(setUnreadCount)
            .catch(() => {});
    }, [isAdmin, user?.user_id]);

    const handleSelectResult = (item: MenuItemData) => {
        navigate(`/${item.id}`);
        setSearchQuery("");
        setSearchOpen(false);
        setFocusedIndex(-1);
    };

    const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (!showResults) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setFocusedIndex(i => Math.min(i + 1, searchResults.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setFocusedIndex(i => Math.max(i - 1, -1));
        } else if (e.key === "Enter" && focusedIndex >= 0) {
            e.preventDefault();
            handleSelectResult(searchResults[focusedIndex]);
        } else if (e.key === "Escape") {
            setSearchOpen(false);
            setSearchQuery("");
        }
    };

    return (
        <header className="nav">
            {/* Left: search */}
            <div className="nav-left">
                <div className="nav-search-wrapper" ref={searchRef}>
                    <SearchBar
                        placeholder="Cari menu..."
                        value={searchQuery}
                        onChange={(v) => { setSearchQuery(v); setSearchOpen(true); }}
                        onFocus={() => setSearchOpen(true)}
                        onKeyDown={handleSearchKeyDown}
                    />
                    {showResults && (
                        <div className="nav-search-results" role="listbox">
                            {searchResults.length === 0 ? (
                                <div className="nav-search-empty">
                                    Tidak ada hasil untuk &ldquo;{searchQuery}&rdquo;
                                </div>
                            ) : (
                                searchResults.map((item, i) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.id}
                                            className={`nav-search-item${i === focusedIndex ? " focused" : ""}`}
                                            role="option"
                                            aria-selected={i === focusedIndex}
                                            onMouseDown={() => handleSelectResult(item)}
                                        >
                                            <span className="nav-search-item-icon">
                                                <Icon />
                                            </span>
                                            <span className="nav-search-item-text">
                                                <span className="nav-search-item-name">{item.menu}</span>
                                                <span className="nav-search-item-path">/{item.id}</span>
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Right: notif + profile */}
            <div className="nav-right">
                {isAdmin && (
                    <button
                        className="nav-icon-btn"
                        aria-label="Notifikasi"
                        onClick={() => navigate("/notifikasi")}
                    >
                        <FaBell />
                        {unreadCount > 0 && (
                            <span className="nav-badge">{unreadCount}</span>
                        )}
                    </button>
                )}

                <div
                    className={`nav-profile${dropdownOpen ? " open" : ""}`}
                    onClick={() => setDropdownOpen(v => !v)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setDropdownOpen(v => !v)}
                    aria-expanded={dropdownOpen}
                    aria-haspopup="menu"
                >
                    <div className="nav-avatar">
                        <img src={ava} alt="Profile" />
                    </div>
                    <div className="nav-profile-info">
                        <span className="nav-profile-name">{user?.nama || "User"}</span>
                        <span className="nav-profile-role" style={{ textTransform: "uppercase" }}>
                            {user?.role ? user.role.replace("_", " ") : "Role"}
                        </span>
                    </div>
                    <FaChevronDown className="nav-chevron" />

                    {dropdownOpen && (
                        <div className="nav-dropdown" role="menu">
                            <button
                                className="nav-dropdown-item"
                                role="menuitem"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDropdownOpen(false);
                                    navigate("/profil");
                                }}
                            >
                                <FaUser />
                                <span>Profil</span>
                            </button>
                            <button
                                className="nav-dropdown-item danger"
                                role="menuitem"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    logout();
                                }}
                            >
                                <FaRightFromBracket />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
