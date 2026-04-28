import { useNavigate } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import BreadcrumbLayout from "../../layouts/breadcrumb";
import BankSampahStatistikLayout from "../../layouts/bank_sampah_statistik";
import { Wrapper } from "@googlemaps/react-wrapper";
import { StatistikService } from "../../services/statistik.service";
import "../../styles/layout.css";
import "../../styles/bank_sampah_overview.css";
import {
    FaBuilding,
    FaLayerGroup,
    FaStore,
    FaUsers,
    FaArrowRight,
    FaMapLocationDot,
} from "react-icons/fa6";

import { LokasiService } from "../../services/lokasi.service";

// ── Marker data type ──
type BankSampahMarker = {
    id: string;
    nama: string;
    jenis: "BSI" | "BSU" | "BSM";
    lat: number;
    lng: number;
};

// ── Marker colors by type ──
const MARKER_COLORS: Record<string, string> = {
    BSI: "#013236",
    BSU: "#06C0C9",
    BSM: "#E8971E",
};

// ── Google Maps Component for distribution ──
function DistributionMap({ locations }: { locations: BankSampahMarker[] }) {
    const ref = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map>();

    useEffect(() => {
        if (ref.current && !map) {
            const newMap = new google.maps.Map(ref.current, {
                center: { lat: -6.9175, lng: 107.6191 },
                zoom: 13,
                mapTypeControl: false,
                streetViewControl: false,
                styles: [
                    { featureType: "poi", stylers: [{ visibility: "off" }] },
                    { featureType: "transit", stylers: [{ visibility: "off" }] },
                ],
            });
            setMap(newMap);
        }
    }, [ref, map]);

    useEffect(() => {
        if (!map) return;

        locations.forEach((loc) => {
            const marker = new google.maps.Marker({
                position: { lat: loc.lat, lng: loc.lng },
                map,
                title: loc.nama,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: MARKER_COLORS[loc.jenis],
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                    scale: 8,
                },
            });

            const color = MARKER_COLORS[loc.jenis];
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="font-family:'Poppins',sans-serif; padding:6px 4px 4px; min-width:120px;">
                        <div style="font-size:13px; font-weight:700; color:#013236; margin-bottom:4px; line-height:1.3;">${loc.nama}</div>
                        <span style="
                            display:inline-block;
                            font-size:10px;
                            font-weight:700;
                            color:#fff;
                            background:${color};
                            padding:2px 8px;
                            border-radius:6px;
                            letter-spacing:0.5px;
                        ">${loc.jenis}</span>
                    </div>
                `,
            });

            infoWindow.addListener("domready", () => {
                const iwOuter = document.querySelector(".gm-style-iw-c") as HTMLElement;
                if (iwOuter) {
                    iwOuter.style.borderRadius = "12px";
                    iwOuter.style.boxShadow = "0 4px 16px rgba(1,50,54,0.12)";
                    iwOuter.style.padding = "6px";
                }
                const closeBtn = document.querySelector(".gm-ui-hover-effect") as HTMLElement;
                if (closeBtn) {
                    closeBtn.style.width = "24px";
                    closeBtn.style.height = "24px";
                    closeBtn.style.top = "4px";
                    closeBtn.style.right = "4px";
                    const closeImg = closeBtn.querySelector("span") as HTMLElement;
                    if (closeImg) {
                        closeImg.style.width = "14px";
                        closeImg.style.height = "14px";
                        closeImg.style.margin = "5px";
                    }
                }
            });

            marker.addListener("click", () => {
                infoWindow.open(map, marker);
            });
        });
    }, [map, locations]);

    return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
}

export default function BankSuperadminPage() {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalBSI: 0,
        totalBSU: 0,
        totalBSM: 0,
    });
    const [mapLocations, setMapLocations] = useState<BankSampahMarker[]>([]);

    useEffect(() => {
        StatistikService.getBankSampahStatistik()
            .then(res => {
                if (res.data) {
                    setStats({
                        totalBSI: res.data.bsi || 0,
                        totalBSU: res.data.bsu || 0,
                        totalBSM: res.data.bsm || 0
                    });
                }
            })
            .catch(err => console.error("Gagal mengambil statistik bank sampah:", err));

        LokasiService.getLokasiBankSampah()
            .then(res => {
                if (res.data) {
                    const mappedLocations: BankSampahMarker[] = res.data.map(d => ({
                        id: d.bank_id,
                        nama: d.nama_bank,
                        jenis: d.jenis_bank.toUpperCase() as "BSI" | "BSU" | "BSM",
                        lat: d.latitude,
                        lng: d.longitude
                    }));
                    setMapLocations(mappedLocations);
                }
            })
            .catch(err => console.error("Gagal mengambil lokasi map bank sampah:", err));
    }, []);

    return (
        <>
            {/* ── Breadcrumb ── */}
                    <BreadcrumbLayout
                        items={[
                            { label: "Bank Sampah" },
                        ]}
                    />
                    <br />

                    {/* ── Peta Persebaran ── */}
                    <div className="bs-map-section">
                        <div className="bs-map-header">
                            <div className="bs-map-header-left">
                                <div className="bs-map-icon">
                                    <FaMapLocationDot />
                                </div>
                                <div>
                                    <h2 className="bs-section-title" style={{ marginBottom: 2 }}>Peta Persebaran Bank Sampah</h2>
                                    <p className="bs-map-subtitle">Lokasi seluruh bank sampah yang terdaftar</p>
                                </div>
                            </div>
                            <div className="bs-map-legend">
                                <div className="bs-map-legend-item">
                                    <span className="bs-map-legend-dot" style={{ background: MARKER_COLORS.BSI }} />
                                    <span>BSI</span>
                                </div>
                                <div className="bs-map-legend-item">
                                    <span className="bs-map-legend-dot" style={{ background: MARKER_COLORS.BSU }} />
                                    <span>BSU</span>
                                </div>
                                <div className="bs-map-legend-item">
                                    <span className="bs-map-legend-dot" style={{ background: MARKER_COLORS.BSM }} />
                                    <span>BSM</span>
                                </div>
                            </div>
                        </div>
                        <div className="bs-map-container">
                            <Wrapper apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}>
                                <DistributionMap locations={mapLocations} />
                            </Wrapper>
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

                        {/* Single card with 2 columns */}
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
                                            <div className="bs-flow-node-icon bs-flow-node-icon--bsi">
                                                <FaBuilding />
                                            </div>
                                            <span className="bs-flow-node-label">BSI</span>
                                        </div>
                                        <div className="bs-flow-arrow"><FaArrowRight /></div>
                                        <div className="bs-flow-node">
                                            <div className="bs-flow-node-icon bs-flow-node-icon--bsu">
                                                <FaLayerGroup />
                                            </div>
                                            <span className="bs-flow-node-label">BSU</span>
                                        </div>
                                        <div className="bs-flow-arrow"><FaArrowRight /></div>
                                        <div className="bs-flow-node">
                                            <div className="bs-flow-node-icon bs-flow-node-icon--nasabah">
                                                <FaUsers />
                                            </div>
                                            <span className="bs-flow-node-label">Nasabah</span>
                                        </div>
                                    </div>

                                    <p className="bs-hierarchy-desc">
                                        Nasabah menyetor sampah melalui <strong>Bank Sampah Unit (BSU)</strong>,
                                        yang kemudian bertanggung jawab kepada <strong>Bank Sampah Induk (BSI)</strong>.
                                        BSI juga dapat melayani nasabah secara langsung tanpa melalui BSU.
                                    </p>
                                </div>

                                {/* Pemisah vertikal */}
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
                                            <div className="bs-flow-node-icon bs-flow-node-icon--bsm">
                                                <FaStore />
                                            </div>
                                            <span className="bs-flow-node-label">BSM</span>
                                        </div>
                                        <div className="bs-flow-arrow"><FaArrowRight /></div>
                                        <div className="bs-flow-node">
                                            <div className="bs-flow-node-icon bs-flow-node-icon--nasabah">
                                                <FaUsers />
                                            </div>
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
        </>
    );
}