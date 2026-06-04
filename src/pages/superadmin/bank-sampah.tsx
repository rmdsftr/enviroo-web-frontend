import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import BreadcrumbLayout from "../../layouts/breadcrumb";
import BankSampahStatistikLayout from "../../layouts/bank_sampah_statistik";
import { StatistikService } from "../../services/statistik.service";
import { LokasiService } from "../../services/lokasi.service";
import { SuperadminService } from "../../services/superadmin.service";
import type { BankSampahLokasi, StatistikKecamatan } from "../../types/lokasi.type";
import "../../styles/layout.css";
import "../../styles/bank_sampah_overview.css";
import "../../styles/nasabah.css";
import {
    FaBuilding,
    FaLayerGroup,
    FaStore,
    FaUsers,
    FaArrowRight,
    FaMapLocationDot,
    FaChartBar,
    FaChevronDown,
    FaFileExport,
} from "react-icons/fa6";
import Button from "../../components/button";
import { PopupNotifikasi } from "../../layouts/popup-notifikasi";

const MARKER_COLORS: Record<string, string> = {
    BSI: "#013236",
    BSU: "#06C0C9",
    BSM: "#E8971E",
};

const PADANG_CENTER: [number, number] = [-0.9492, 100.3543];

const KEK_PALETTE = [
    "#94DF0C", "#06C0C9", "#E8971E", "#7B61FF",
    "#EF4444", "#3B82F6", "#EC4899", "#10B981",
    "#F59E0B", "#8B5CF6", "#14B8A6", "#F97316",
];

function createPinIcon(color: string) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
        <path d="M15 0C6.716 0 0 6.716 0 15c0 11.25 15 25 15 25S30 26.25 30 15C30 6.716 23.284 0 15 0z"
              fill="${color}" stroke="white" stroke-width="2.5"
              style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35))"/>
        <circle cx="15" cy="15" r="6.5" fill="white"/>
    </svg>`;
    return L.divIcon({
        html: svg,
        className: "",
        iconSize: [30, 40],
        iconAnchor: [15, 40],
        tooltipAnchor: [0, -42],
    });
}

function getBankType(bankId: string): string {
    if (bankId.startsWith("BSI")) return "BSI";
    if (bankId.startsWith("BSU")) return "BSU";
    if (bankId.startsWith("BSM")) return "BSM";
    return "";
}

export default function BankSuperadminPage() {
    const navigate = useNavigate();

    const [stats, setStats] = useState({ totalBSI: 0, totalBSU: 0, totalBSM: 0 });
    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const handleExportLaporan = async () => {
        setIsExporting(true);
        try {
            const blob = await SuperadminService.exportLaporan();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "laporan-bank-sampah.xlsx";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            setPopupNotif({ message: "Gagal mengekspor laporan. Silakan coba lagi.", type: "error" });
        } finally {
            setIsExporting(false);
        }
    };
    const [locations, setLocations] = useState<BankSampahLokasi[]>([]);
    const [kecamatanStats, setKecamatanStats] = useState<StatistikKecamatan[]>([]);
    const [sort, setSort] = useState<"asc" | "desc">("desc");
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        StatistikService.getBankSampahStatistik()
            .then(res => {
                if (res.data) {
                    setStats({
                        totalBSI: res.data.bsi || 0,
                        totalBSU: res.data.bsu || 0,
                        totalBSM: res.data.bsm || 0,
                    });
                }
            })
            .catch(err => console.error("Gagal mengambil statistik bank sampah:", err));

        LokasiService.getLokasiBankSampah()
            .then(res => { if (res.data) setLocations(res.data); })
            .catch(err => console.error("Gagal mengambil lokasi bank sampah:", err));
    }, []);

    useEffect(() => {
        LokasiService.getStatistikKecamatan(sort)
            .then(res => { if (res.data) setKecamatanStats(res.data); })
            .catch(err => console.error("Gagal mengambil statistik kecamatan:", err));
    }, [sort]);

    const maxBank = Math.max(...kecamatanStats.map(k => k.jumlah_bank), 1);

    return (
        <>
            {popupNotif && (
                <PopupNotifikasi
                    message={popupNotif.message}
                    type={popupNotif.type}
                    onClose={() => setPopupNotif(null)}
                />
            )}

            {/* ── Breadcrumb ── */}
            <BreadcrumbLayout items={[{ label: "Bank Sampah" }]} />

            {/* ── Page Header ── */}
            <div className="nasabah-hero" style={{marginTop:"-15px"}}>
                <div className="nasabah-hero-left">
                    <h1 className="nasabah-hero-title">Manajemen Bank Sampah</h1>
                    <p className="nasabah-hero-desc">
                        Pantau dan kelola seluruh bank sampah yang terdaftar mulai dari BSI, BSU, hingga BSM, beserta sebarannya di seluruh wilayah di Kota Padang.
                    </p>
                </div>
                <div className="nasabah-hero-right">
                    <Button
                        icon={<FaFileExport />}
                        color="neon"
                        variant="solid"
                        isRounded
                        disabled={isExporting}
                        onClick={handleExportLaporan}
                    >
                        {isExporting ? "Mengekspor..." : "Ekspor Laporan"}
                    </Button>
                </div>
            </div>

            {/* ── Statistik cards (clickable) ── */}
            <BankSampahStatistikLayout
                {...stats}
                onClickBSI={() => navigate("/superadmin/bank-sampah/bsi")}
                onClickBSU={() => navigate("/superadmin/bank-sampah/bsu")}
                onClickBSM={() => navigate("/superadmin/bank-sampah/bsm")}
            />

            <div className="bs-divider" />

            {/* ── Hierarchy explanation ── */}
            <div className="bs-hierarchy-section">
                <h2 className="bs-section-title">Tentang Hierarki Bank Sampah</h2>

                <div className="bs-hierarchy-card">
                    <div className="bs-hierarchy-columns">

                        {/* Kolom kiri: Hierarki 3 Tingkat */}
                        <div className="bs-hierarchy-col bs-hierarchy-col--tiga">
                            <div className="bs-hierarchy-head">
                                <div className="bs-hierarchy-badge bs-hierarchy-badge--tiga">⛓</div>
                                <div className="bs-hierarchy-head-text">
                                    <span className="bs-hierarchy-name">Hierarki 3 Tingkat</span>
                                    <span className="bs-hierarchy-label">BSI · BSU · Nasabah</span>
                                </div>
                            </div>

                            <div className="bs-flow">
                                <div className="bs-flow-node">
                                    <div className="bs-flow-node-icon bs-flow-node-icon--bsi"><FaBuilding /></div>
                                    <span className="bs-flow-node-label">BSI</span>
                                </div>
                                <div className="bs-flow-arrow"><FaArrowRight /></div>
                                <div className="bs-flow-node">
                                    <div className="bs-flow-node-icon bs-flow-node-icon--bsu"><FaLayerGroup /></div>
                                    <span className="bs-flow-node-label">BSU</span>
                                </div>
                                <div className="bs-flow-arrow"><FaArrowRight /></div>
                                <div className="bs-flow-node">
                                    <div className="bs-flow-node-icon bs-flow-node-icon--nasabah"><FaUsers /></div>
                                    <span className="bs-flow-node-label">Nasabah</span>
                                </div>
                            </div>

                            <p className="bs-hierarchy-desc">
                                Nasabah menyetor sampah melalui <strong>Bank Sampah Unit (BSU)</strong>,
                                yang kemudian bertanggung jawab kepada <strong>Bank Sampah Induk (BSI)</strong>.
                                BSI juga dapat melayani nasabah secara langsung tanpa melalui BSU.
                            </p>
                        </div>

                        <div className="bs-hierarchy-divider" />

                        {/* Kolom kanan: Hierarki 2 Tingkat */}
                        <div className="bs-hierarchy-col bs-hierarchy-col--dua">
                            <div className="bs-hierarchy-head">
                                <div className="bs-hierarchy-badge bs-hierarchy-badge--dua">⛓</div>
                                <div className="bs-hierarchy-head-text">
                                    <span className="bs-hierarchy-name">Hierarki 2 Tingkat</span>
                                    <span className="bs-hierarchy-label">BSM · Nasabah</span>
                                </div>
                            </div>

                            <div className="bs-flow">
                                <div className="bs-flow-node">
                                    <div className="bs-flow-node-icon bs-flow-node-icon--bsm"><FaStore /></div>
                                    <span className="bs-flow-node-label">BSM</span>
                                </div>
                                <div className="bs-flow-arrow"><FaArrowRight /></div>
                                <div className="bs-flow-node">
                                    <div className="bs-flow-node-icon bs-flow-node-icon--nasabah"><FaUsers /></div>
                                    <span className="bs-flow-node-label">Nasabah</span>
                                </div>
                            </div>

                            <p className="bs-hierarchy-desc">
                                Nasabah menyetor sampah langsung ke <strong>Bank Sampah Mandiri (BSM)</strong>.
                                BSM menjual sampah langsung ke pihak ketiga tanpa koordinasi
                                dengan Bank Sampah Induk.
                            </p>
                        </div>

                    </div>
                </div>
            </div>

            <div className="bs-divider" />

            {/* ── Peta Persebaran (Leaflet) ── */}
            <div className="bs-map-section">
                <div className="bs-map-header">
                    <div className="bs-map-header-left">
                        <div className="bs-map-icon"><FaMapLocationDot /></div>
                        <div>
                            <h2 className="bs-section-title" style={{ marginBottom: 2 }}>Peta Persebaran Bank Sampah</h2>
                            <p className="bs-map-subtitle">Lokasi seluruh bank sampah yang terdaftar di Padang</p>
                        </div>
                    </div>
                    <div className="bs-map-legend">
                        {Object.entries(MARKER_COLORS).map(([jenis, color]) => (
                            <div key={jenis} className="bs-map-legend-item">
                                <span className="bs-map-legend-dot" style={{ background: color }} />
                                <span>{jenis}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bs-map-container">
                    <MapContainer
                        center={PADANG_CENTER}
                        zoom={13}
                        style={{ width: "100%", height: "100%" }}
                        scrollWheelZoom={false}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        {locations.map((loc) => {
                            const jenis = loc.jenis_bank.toUpperCase();
                            const color = MARKER_COLORS[jenis] ?? "#4EA771";
                            return (
                                <Marker
                                    key={loc.bank_id}
                                    position={[loc.latitude, loc.longitude]}
                                    icon={createPinIcon(color)}
                                >
                                    <Tooltip direction="top" opacity={1}>
                                        <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 12, lineHeight: 1.4 }}>
                                            <div style={{ fontWeight: 700, color: "#013236" }}>{loc.nama_bank}</div>
                                            <div style={{ color: color, fontWeight: 600, fontSize: 11 }}>{jenis}</div>
                                        </div>
                                    </Tooltip>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </div>
            </div>

            <div className="bs-divider" />

            {/* ── Statistik per Kecamatan ── */}
            <div className="bs-kec-section">
                <div className="bs-kec-header">
                    <div className="bs-kec-header-left">
                        <div className="bs-map-icon"><FaChartBar /></div>
                        <div>
                            <h2 className="bs-section-title" style={{ marginBottom: 2 }}>Statistik per Kecamatan</h2>
                            <p className="bs-kec-subtitle">Sebaran bank sampah berdasarkan wilayah kecamatan di Padang</p>
                        </div>
                    </div>
                    <div className="bs-kec-sort-pills">
                        <button
                            className={`bs-kec-sort-pill${sort === "desc" ? " bs-kec-sort-pill--active" : ""}`}
                            onClick={() => setSort("desc")}
                        >
                            Terbanyak ↓
                        </button>
                        <button
                            className={`bs-kec-sort-pill${sort === "asc" ? " bs-kec-sort-pill--active" : ""}`}
                            onClick={() => setSort("asc")}
                        >
                            Tersedikit ↑
                        </button>
                    </div>
                </div>

                <div className="bs-kec-list">
                    {kecamatanStats.map((kec, idx) => {
                        const isExpanded = expandedId === kec.id_kecamatan;
                        const barWidth = `${(kec.jumlah_bank / maxBank) * 100}%`;
                        const barColor = KEK_PALETTE[idx % KEK_PALETTE.length];
                        return (
                            <div key={kec.id_kecamatan} className="bs-kec-row">
                                <div
                                    className="bs-kec-row-main"
                                    onClick={() => setExpandedId(isExpanded ? null : kec.id_kecamatan)}
                                >
                                    <span className="bs-kec-rank">{idx + 1}</span>
                                    <span className="bs-kec-name">{kec.kecamatan}</span>
                                    <div className="bs-kec-bar-wrap">
                                        <div className="bs-kec-bar" style={{ width: barWidth, background: barColor }} />
                                    </div>
                                    <span className="bs-kec-count">{kec.jumlah_bank} bank</span>
                                    <FaChevronDown
                                        className={`bs-kec-chevron${isExpanded ? " bs-kec-chevron--open" : ""}`}
                                    />
                                </div>

                                {isExpanded && (
                                    <div className="bs-kec-banks">
                                        {kec.banks.map((bank) => {
                                            const type = getBankType(bank.bank_id);
                                            const color = MARKER_COLORS[type] ?? "#4EA771";
                                            return (
                                                <div key={bank.bank_id} className="bs-kec-bank-item">
                                                    <span className="bs-kec-bank-dot" style={{ background: color }} />
                                                    <span className="bs-kec-bank-id">{bank.bank_id}</span>
                                                    <span className="bs-kec-bank-name">{bank.nama_bank}</span>
                                                    {type && (
                                                        <span
                                                            className="bs-kec-bank-badge"
                                                            style={{ background: color }}
                                                        >
                                                            {type}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
