import { useAuth } from "../../contexts/AuthContext";
import SetoranSampahDashboard from "../../components/SetoranSampahDashboard";
import KontribusiNasabahSection from "../../components/KontribusiNasabahSection";
import MasukSampahSection from "../../components/MasukSampahSection";
import "../../styles/setoran-dashboard.css";

export default function DashboardBsuPage() {
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
                    <MasukSampahSection bankId={user.bank_id} />
                    <KontribusiNasabahSection bankId={user.bank_id} />
                </>
            )}
        </div>
    );
}
