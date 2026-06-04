import ManajemenRewardSection from "../components/ManajemenRewardSection";
import KonfigurasiBagiHasilSection from "../layouts/konfigurasi_bagi_hasil";
import { useAuth } from "../contexts/AuthContext";
import "../styles/layout.css";
import "../styles/penjualan.css";

export default function PenjualanPage() {
    const { user } = useAuth();
    const isAdminBSI = (user?.role || "").toLowerCase() === "admin_bsi";

    return (
        <>
            <ManajemenRewardSection />
            {isAdminBSI && (
                <>
                    <div className="penjualan-section-divider" />
                    <KonfigurasiBagiHasilSection />
                </>
            )}
        </>
    );
}
