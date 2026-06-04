import { useAuth } from "../../contexts/AuthContext";
import SetoranSampahDashboard from "../../components/SetoranSampahDashboard";
import KontribusiNasabahSection from "../../components/KontribusiNasabahSection";
import PenjualanSampahSection from "../../components/PenjualanSampahSection";
import "../../styles/setoran-dashboard.css";

export default function DashboardBsiPage() {
    const { user } = useAuth();

    return (
        <div className="dash-admin">
            <div className="dash-admin-header">
                <h1>Dashboard</h1>
                <p>Ringkasan setoran sampah bank Anda</p>
            </div>
            {user?.bank_id && (
                <>
                    <SetoranSampahDashboard bankId={user.bank_id} />
                    <PenjualanSampahSection bankId={user.bank_id} />
                    <KontribusiNasabahSection bankId={user.bank_id} />
                </>
            )}
        </div>
    );
}
