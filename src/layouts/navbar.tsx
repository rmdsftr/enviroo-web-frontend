import { useState, useEffect } from "react";
import { FaBell, FaChevronDown, FaRightFromBracket, FaUser } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import "../styles/navbar.css";
import ava from "../assets/profile.png";
import SearchBar from "../components/search";
import { useAuth } from "../contexts/AuthContext";
import { NotifikasiService } from "../services/notifikasi.service";

const ADMIN_ROLES = ["admin_bsi", "admin_bsu", "admin_bsm"];

export default function NavbarLayout() {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const isAdmin = ADMIN_ROLES.includes(user?.role?.toLowerCase() ?? "");

    useEffect(() => {
        if (!isAdmin || !user?.user_id) return;
        NotifikasiService.getUnreadCount(user.user_id)
            .then(setUnreadCount)
            .catch(() => {});
    }, [isAdmin, user?.user_id]);

    return (
        <header className="nav">
            {/* Left: logo + search */}
            <div className="nav-left">
                <SearchBar placeholder="Cari data..." />
            </div>

            {/* Right: notif + profile */}
            <div className="nav-right">
                {/* Notification bell — only for admin roles */}
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

                {/* Profile dropdown */}
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
                        <span className="nav-profile-role" style={{ textTransform: 'uppercase' }}>
                            {user?.role ? user.role.replace("_", " ") : "Role"}
                        </span>
                    </div>
                    <FaChevronDown className="nav-chevron" />

                    {/* Dropdown menu */}
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