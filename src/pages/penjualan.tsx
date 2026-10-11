import ManajemenRewardSection from "../components/ManajemenRewardSection";
import ManajemenMitraSection from "../components/ManajemenMitraSection";
import KonfigurasiBagiHasilSection from "../layouts/konfigurasi_bagi_hasil";
import { useAuth } from "../contexts/AuthContext";
import "../styles/layout.css";
import "../styles/penjualan.css";

export default function PenjualanPage() {
    const { user } = useAuth();
    const role = (user?.role || "").toLowerCase();
    const isAdminBSI = role === "admin_bsi";
    const canManageMitra = role === "admin_bsi" || role === "admin_bsm";

    return (
        <>
            <ManajemenRewardSection />
            {canManageMitra && (
                <>
                    <div className="penjualan-section-divider" />
                    <ManajemenMitraSection />
                </>
            )}
            {isAdminBSI && (
                <>
                    <div className="penjualan-section-divider" />
                    <KonfigurasiBagiHasilSection />
                </>
            )}
        </>
    );
}
