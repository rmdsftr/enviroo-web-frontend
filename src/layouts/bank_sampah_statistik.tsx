import StatistikLayout from "./statistik";
import {
    FaBuilding,
    FaLayerGroup,
    FaStore,
} from "react-icons/fa6";
import "../styles/bank_sampah_statistik.css";

export interface BankSampahStats {
    totalBSI: number;
    totalBSU: number;
    totalBSM: number;
    onClickBSI?: () => void;
    onClickBSU?: () => void;
    onClickBSM?: () => void;
}

export default function BankSampahStatistikLayout({
    totalBSI,
    totalBSU,
    totalBSM,
    onClickBSI,
    onClickBSU,
    onClickBSM,
}: BankSampahStats) {
    return (
        <div className="bs-statistik-grid">
            {/* Hierarki 3 Tingkat */}
            <div className="bs-stat-group">
                <p className="bs-stat-group-label">
                    <span className="bs-stat-group-badge bs-stat-group-badge--tiga">3 Tingkat</span>
                    BSI · BSU · Nasabah
                </p>
                <div className="bs-stat-group-cards">
                    <StatistikLayout
                        icon={FaBuilding}
                        angka={totalBSI}
                        status="Bank Sampah Induk"
                        deskripsi="Koordinator wilayah (BSI)"
                        variant="default"
                        onClick={onClickBSI}
                    />
                    <StatistikLayout
                        icon={FaLayerGroup}
                        angka={totalBSU}
                        status="Bank Sampah Unit"
                        deskripsi="Unit di bawah BSI"
                        variant="teal"
                        onClick={onClickBSU}
                    />
                </div>
            </div>

            {/* Hierarki 2 Tingkat */}
            <div className="bs-stat-group">
                <p className="bs-stat-group-label">
                    <span className="bs-stat-group-badge bs-stat-group-badge--dua">2 Tingkat</span>
                    BSM · Nasabah
                </p>
                <div className="bs-stat-group-cards">
                    <StatistikLayout
                        icon={FaStore}
                        angka={totalBSM}
                        status="Bank Sampah Mandiri"
                        deskripsi="Jual langsung ke pihak ketiga"
                        variant="success"
                        onClick={onClickBSM}
                    />
                </div>
            </div>
        </div>
    );
}
