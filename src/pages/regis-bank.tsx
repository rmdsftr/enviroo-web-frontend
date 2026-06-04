/// <reference types="vite/client" />
import { useState, useRef, useCallback, useEffect } from "react";
import BreadcrumbLayout from "../layouts/breadcrumb";
import { getApiError } from "../utils/error.utils";
import Input from "../components/input";
import Dropdown from "../components/dropdown";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import {
    FaBuilding,
    FaCamera,
    FaLocationDot,
    FaMap,
    FaCloudArrowUp,
    FaCircleInfo,
    FaTrash,
    FaFloppyDisk,
    FaArrowLeft,
    FaUserShield,
    FaUserPlus,
    FaCheck,
    FaArrowRight,
} from "react-icons/fa6";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "../styles/layout.css";
import "../styles/regis-bsi.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { UsersService } from "../services/users.service";
import { BsiService } from "../services/bsi.service";
import { BsmService } from "../services/bsm.service";
import { BsuService } from "../services/bsu.service";
import { LokasiService } from "../services/lokasi.service";
import type { NonAdminUser } from "../types/users.type";
import type { Kecamatan, Kelurahan } from "../types/lokasi.type";
import PopupNotifikasi from "../layouts/popup-notifikasi";

// Fix Leaflet default marker icons in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    useMapEvents({ click(e) { onLocationSelect(e.latlng.lat, e.latlng.lng); } });
    return null;
}

function MapFlyTo({ position }: { position: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (position) map.flyTo(position, 16, { duration: 1.2 });
    }, [position, map]);
    return null;
}

function InvalidateSizeOnMount() {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => map.invalidateSize(), 500);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
}

function MapComponent({
    latitude,
    longitude,
    onLocationSelect,
    geocodedPos,
}: {
    latitude: number | null;
    longitude: number | null;
    onLocationSelect: (lat: number, lng: number) => void;
    geocodedPos: [number, number] | null;
}) {
    return (
        <MapContainer center={[-0.9493, 100.4235]} zoom={12} style={{ width: "100%", height: "100%" }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapClickHandler onLocationSelect={onLocationSelect} />
            <MapFlyTo position={geocodedPos} />
            <InvalidateSizeOnMount />
            {latitude !== null && longitude !== null && (
                <Marker position={[latitude, longitude]} />
            )}
        </MapContainer>
    );
}

// ── Format file size ──
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ── Page component ──
export default function RegistrasiBSIPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    
    const isAdminBsi = user?.role === "admin_bsi";

    // Determine type from URL or Role
    const isBsm = location.pathname.includes("/bsm");
    const isBsu = location.pathname.includes("/bsu") || isAdminBsi;
    const bankTypeLabel = isBsu ? "Bank Sampah Unit" : isBsm ? "Bank Sampah Mandiri" : "Bank Sampah Induk";
    const bankTypeShort = isBsu ? "BSU" : isBsm ? "BSM" : "BSI";
    
    let backPath = isBsu ? "/superadmin/bank-sampah/bsu" : isBsm ? "/superadmin/bank-sampah/bsm" : "/superadmin/bank-sampah/bsi";
    if (isAdminBsi) {
        backPath = "/bsi/bsu";
    }

    // Step management
    const [step, setStep] = useState<1 | 2>(1);
    const [availableAdmins, setAvailableAdmins] = useState<NonAdminUser[]>([]);
    const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [newAdminForm, setNewAdminForm] = useState({ nik: "", nama: "", email: "", noWa: "" });

    // Form state
    const [nama, setNama] = useState("");
    const [deskripsi, setDeskripsi] = useState("");
    const [provinsi, setProvinsi] = useState("");
    const [kota, setKota] = useState("");
    const [kecamatan, setKecamatan] = useState("");
    const [kelurahan, setKelurahan] = useState("");
    const [alamat, setAlamat] = useState("");
    const [foto, setFoto] = useState<File | null>(null);
    const [fotoPreview, setFotoPreview] = useState<string | null>(null);
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [dragging, setDragging] = useState(false);
    const [afiliasiBsi, setAfiliasiBsi] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [geocodedPos, setGeocodedPos] = useState<[number, number] | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [notif, setNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [notifNavigateTo, setNotifNavigateTo] = useState<string | null>(null);

    const [listBsi, setListBsi] = useState<{ label: string; value: string }[]>([]);

    const listProvinsi = [{ label: "Sumatera Barat", value: "Sumatera Barat" }];
    const listKota = [{ label: "Padang", value: "Padang" }];

    const [kecamatanData, setKecamatanData] = useState<Kecamatan[]>([]);
    const [kelurahanData, setKelurahanData] = useState<Kelurahan[]>([]);

    const listKecamatanOptions = kecamatanData.map(k => ({
        label: k.kecamatan,
        value: String(k.id_kecamatan),
    }));
    const listKelurahanOptions = kelurahanData.map(k => ({
        label: k.kelurahan,
        value: String(k.id_kelurahan),
    }));

    const handleProvinsiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setProvinsi(e.target.value);
        setKota("");
        setKecamatan("");
        setKelurahan("");
        setKelurahanData([]);
    };

    const handleKotaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setKota(e.target.value);
        setKecamatan("");
        setKelurahan("");
        setKelurahanData([]);
    };

    const handleKecamatanChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setKecamatan(id);
        setKelurahan("");
        setKelurahanData([]);
        if (!id) return;
        try {
            const res = await LokasiService.getKelurahanByKecamatan(parseInt(id));
            setKelurahanData(Array.isArray(res.data) ? res.data : []);
        } catch {
            setKelurahanData([]);
        }
    };

    // Handle file select
    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) return;
        setFoto(file);
        const reader = new FileReader();
        reader.onloadend = () => setFotoPreview(reader.result as string);
        reader.readAsDataURL(file);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const removeFoto = () => {
        setFoto(null);
        setFotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Map location — also reverse-geocodes the clicked point to fill alamat
    const handleLocationSelect = async (lat: number, lng: number) => {
        setLatitude(lat);
        setLongitude(lng);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                { headers: { "Accept-Language": "id", "User-Agent": "enviroo-web/1.0" } }
            );
            const data = await res.json();
            if (data?.address) {
                const { road, house_number } = data.address;
                const streetAddress = road
                    ? (house_number ? `${road} No. ${house_number}` : road)
                    : (data.display_name?.split(",")[0]?.trim() ?? "");
                if (streetAddress) {
                    setAlamat(streetAddress);
                }
            }
        } catch {}
    };

    // Animate sections on mount
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch non-admin users when step 2 is active
    useEffect(() => {
        if (step === 2 && availableAdmins.length === 0) {
            UsersService.getNonAdminUsers()
                .then((res) => setAvailableAdmins(res.data || []))
                .catch((err) => console.error("Failed to fetch available admins:", err));
        }
    }, [step, availableAdmins.length]);

    // Fetch kecamatan list on mount
    useEffect(() => {
        LokasiService.getAllKecamatan()
            .then(res => setKecamatanData(Array.isArray(res.data) ? res.data : []))
            .catch(() => {});
    }, []);

    // Geocode lokasi berdasarkan kecamatan/kelurahan yang dipilih
    useEffect(() => {
        if (!kecamatan) return;
        const kecamatanLabel = kecamatanData.find(k => String(k.id_kecamatan) === kecamatan)?.kecamatan ?? "";
        if (!kecamatanLabel) return;
        const kelurahanLabel = kelurahanData.find(k => String(k.id_kelurahan) === kelurahan)?.kelurahan ?? "";
        const query = [kelurahanLabel, kecamatanLabel, "Padang", "Sumatera Barat", "Indonesia"]
            .filter(Boolean).join(", ");
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=id`,
                    { headers: { "Accept-Language": "id", "User-Agent": "enviroo-web/1.0" } }
                );
                const data = await res.json();
                if (data?.[0]) {
                    const lat = parseFloat(data[0].lat);
                    const lng = parseFloat(data[0].lon);
                    setLatitude(lat);
                    setLongitude(lng);
                    setGeocodedPos([lat, lng]);
                }
            } catch {}
        }, 300);
        return () => clearTimeout(timer);
    }, [kecamatan, kelurahan, kecamatanData, kelurahanData]);

    // Fetch BSI list if registering BSU (only for superadmin)
    useEffect(() => {
        if (isBsu && !isAdminBsi) {
            BsiService.getBsi()
                .then(res => {
                    const mapped = (res.data || []).map(b => ({
                        label: b.NamaBank,
                        value: b.BankID
                    }));
                    setListBsi(mapped);
                })
                .catch(err => console.error("Gagal mendapatkan list BSI:", err));
        }
    }, [isBsu, isAdminBsi]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Move to step 2: admin selection
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleAdmin = (id: string) => {
        setSelectedAdmins((prev) =>
            prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
        );
    };

    const toggleAllAdmins = () => {
        if (selectedAdmins.length === availableAdmins.length && availableAdmins.length > 0) {
            setSelectedAdmins([]);
        } else {
            setSelectedAdmins(availableAdmins.map((a) => a.UserID));
        }
    };

    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (!foto) {
                setNotif({ message: "Mohon unggah foto bank sampah!", type: "error" });
                return;
            }
            if (latitude === null || longitude === null) {
                setNotif({ message: "Mohon pilih titik lokasi pada peta!", type: "error" });
                return;
            }

            // Dapatkan userId untuk dikirim ke backend
            const userIds = selectedAdmins;

            const namaLengkap = `${bankTypeShort} ${nama.trim()}`;

            if (isBsm) {
                const payload = {
                    nama_bsm: namaLengkap,
                    deskripsi: deskripsi,
                    foto: foto,
                    provinsi: provinsi,
                    kabupaten_kota: kota,
                    id_kecamatan: kecamatan,
                    id_kelurahan: kelurahan,
                    alamat_lengkap: alamat,
                    latitude: latitude,
                    longitude: longitude,
                    user_id: userIds,
                    admin_id: user?.identity_id || ""
                };
                await BsmService.createBsm(payload);
                console.log("Berhasil registrasi BSM:", payload);
            } else if (isBsu) {
                const parentId = isAdminBsi ? user?.bank_id : afiliasiBsi;
                if (!parentId) {
                    setNotif({ message: "Pilih referensi afiliasi Bank Sampah Induk (BSI) terlebih dahulu!", type: "error" });
                    return;
                }

                if (isAdminBsi) {
                    const payload = {
                        nama_unit: namaLengkap,
                        deskripsi: deskripsi,
                        foto: foto,
                        provinsi: provinsi,
                        kabupaten_kota: kota,
                        id_kecamatan: kecamatan,
                        id_kelurahan: kelurahan,
                        alamat_lengkap: alamat,
                        latitude: latitude,
                        longitude: longitude,
                        user_id: userIds,
                        admin_id: user?.identity_id || ""
                    };
                    await BsiService.addUnit(parentId, payload);
                    console.log("Berhasil registrasi BSU (via Admin BSI):", payload);
                } else {
                    const payload = {
                        nama_bsu: namaLengkap,
                        parent_bank_id: parentId,
                        deskripsi: deskripsi,
                        foto: foto,
                        provinsi: provinsi,
                        kabupaten_kota: kota,
                        id_kecamatan: kecamatan,
                        id_kelurahan: kelurahan,
                        alamat_lengkap: alamat,
                        latitude: latitude,
                        longitude: longitude,
                        user_id: userIds,
                        admin_id: user?.identity_id || ""
                    };
                    await BsuService.createBsu(payload);
                    console.log("Berhasil registrasi BSU (via Superadmin):", payload);
                }
            } else {
                const payload = {
                    nama_bsi: namaLengkap,
                    deskripsi: deskripsi,
                    foto: foto,
                    provinsi: provinsi,
                    kabupaten_kota: kota,
                    id_kecamatan: kecamatan,
                    id_kelurahan: kelurahan,
                    alamat_lengkap: alamat,
                    latitude: latitude,
                    longitude: longitude,
                    user_id: userIds,
                    admin_id: user?.identity_id || ""
                };
                await BsiService.createBsi(payload);
                console.log("Berhasil registrasi BSI:", payload);
            }

            setNotif({ message: "Registrasi Bank Sampah berhasil!", type: "success" });
            setNotifNavigateTo(backPath);
        } catch (error) {
            console.error("Gagal melakukan registrasi bank sampah:", error);
            setNotif({ message: getApiError(error, "Gagal melakukan registrasi bank sampah. Silakan coba lagi."), type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveNewAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                user_id: newAdminForm.nik,
                nama: newAdminForm.nama,
                email: newAdminForm.email,
                no_whatsapp: newAdminForm.noWa,
            };
            
            await UsersService.createUsers(payload);
            console.log("Successfully saved new admin:", payload);
            
            // Refresh admin list
            try {
                const res = await UsersService.getNonAdminUsers();
                setAvailableAdmins(res.data || []);
            } catch (err) {
                console.error("Gagal me-refresh tabel admin:", err);
            }
            
            setIsAdminModalOpen(false);
            setNewAdminForm({ nik: "", nama: "", email: "", noWa: "" });
            setNotif({ message: "Berhasil mendaftarkan admin baru!", type: "success" });
        } catch (error) {
            console.error("Gagal mendaftarkan admin:", error);
            setNotif({ message: getApiError(error, "Gagal mendaftarkan admin baru. Silakan coba lagi."), type: "error" });
        }
    };

    return (
        <>
            {/* Breadcrumb */}
            <BreadcrumbLayout
                items={[
                    ...(isAdminBsi
                        ? []
                        : [{ label: "Bank Sampah", path: "/superadmin/bank-sampah" }]
                    ),
                    { label: bankTypeLabel, path: backPath },
                    { label: `Registrasi ${bankTypeShort}` },
                    ...(step === 2 ? [{ label: "Pilih Admin" }] : []),
                ]}
            />

            <br />

            {/* ── Step indicator ──
            <div className="regis-steps">
                <div className={`regis-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                    <div className="regis-step-number">
                        {step > 1 ? <FaCheck /> : '1'}
                    </div>
                    <span className="regis-step-label">Data {bankTypeShort}</span>
                </div>
                <div className="regis-step-line" />
                <div className={`regis-step ${step >= 2 ? 'active' : ''}`}>
                    <div className="regis-step-number">2</div>
                    <span className="regis-step-label">Pilih Admin</span>
                </div>
            </div> */}

            {/* ══════════════ STEP 1: Bank Info Form ══════════════ */}
            {step === 1 && (
                <form className="regis-bsi" onSubmit={handleSubmit}>
                    <div className="regis-form-card">
                        <div className="regis-form-row">
                            {/* ── Section 1: Informasi Dasar ── */}
                            <div
                                className="regis-section"
                                style={{
                                    opacity: mounted ? 1 : 0,
                                    transform: mounted ? "translateY(0)" : "translateY(12px)",
                                    transition: "all 0.4s ease 0.1s",
                                }}
                            >
                                <div className="regis-section-header">
                                    <div className="regis-section-icon icon-info">
                                        <FaBuilding />
                                    </div>
                                    <div>
                                        <div className="regis-section-title">Informasi Dasar</div>
                                        <div className="regis-section-subtitle">
                                            Nama dan deskripsi bank sampah
                                        </div>
                                    </div>
                                </div>

                                <div className="regis-form-group">
                                    <label className="regis-label" htmlFor="regis-nama">
                                        Nama {bankTypeLabel} <span className="required">*</span>
                                    </label>
                                    <Input
                                        id="regis-nama"
                                        className="regis-input-neutral"
                                        variant="solid"
                                        inputSize="large"
                                        fullWidth
                                        iconLeft={<span style={{ fontWeight: 700, lineHeight: 1, color: "var(--c-primary)", whiteSpace: "nowrap" }}>{bankTypeShort}</span>}
                                        placeholder="Enviroo Andalas"
                                        value={nama}
                                        onChange={(e) => setNama(e.target.value)}
                                        required
                                    />
                                </div>

                                {isBsu && !isAdminBsi && (
                                    <div className="regis-form-group">
                                        <label className="regis-label">
                                            Afiliasi Bank Sampah Induk <span className="required">*</span>
                                        </label>
                                        <Dropdown
                                            options={listBsi}
                                            value={afiliasiBsi}
                                            onChange={(e) => setAfiliasiBsi(e.target.value)}
                                            placeholder="Pilih BSI Afiliasi"
                                            dropdownSize="large"
                                            fullWidth
                                        />
                                    </div>
                                )}

                                <div className="regis-form-group">
                                    <label className="regis-label" htmlFor="regis-deskripsi">
                                        Deskripsi <span className="required">*</span>
                                    </label>
                                    <textarea
                                        id="regis-deskripsi"
                                        className="regis-textarea"
                                        placeholder="Jelaskan secara singkat tentang bank sampah ini, misalnya visi misi, jangkauan layanan, dll."
                                        value={deskripsi}
                                        onChange={(e) => setDeskripsi(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* ── Section 2: Foto ── */}
                            <div
                                className="regis-section"
                                style={{
                                    opacity: mounted ? 1 : 0,
                                    transform: mounted ? "translateY(0)" : "translateY(12px)",
                                    transition: "all 0.4s ease 0.2s",
                                }}
                            >
                                <div className="regis-section-header">
                                    <div className="regis-section-icon icon-photo">
                                        <FaCamera />
                                    </div>
                                    <div>
                                        <div className="regis-section-title">Foto</div>
                                        <div className="regis-section-subtitle">
                                            Unggah foto bank sampah
                                        </div>
                                    </div>
                                </div>

                                <div className="regis-form-group">
                                    <label className="regis-label">
                                        Foto Bank Sampah <span className="required">*</span>
                                    </label>
                                    {!fotoPreview ? (
                                        <div
                                            className={`regis-upload-area${dragging ? " dragging" : ""}`}
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                setDragging(true);
                                            }}
                                            onDragLeave={() => setDragging(false)}
                                            onDrop={handleDrop}
                                        >
                                            <div className="regis-upload-icon-wrapper">
                                                <FaCloudArrowUp />
                                            </div>
                                            <div className="regis-upload-text">
                                                <p>
                                                    Drag & drop foto di sini, atau{" "}
                                                    <span className="upload-browse">pilih file</span>
                                                </p>
                                                <span>
                                                    PNG, JPG, JPEG (maks. 5 MB)
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="regis-upload-area has-file">
                                            <div className="regis-upload-preview">
                                                <img
                                                    src={fotoPreview}
                                                    alt="Preview"
                                                    className="regis-preview-img"
                                                />
                                                <div className="regis-preview-info">
                                                    <div className="regis-preview-name">
                                                        {foto?.name}
                                                    </div>
                                                    <div className="regis-preview-size">
                                                        {foto && formatFileSize(foto.size)}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="regis-preview-remove"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeFoto();
                                                        }}
                                                    >
                                                        <FaTrash style={{ marginRight: 6, fontSize: 11 }} />
                                                        Hapus Foto
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg"
                                        className="regis-upload-input"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── Section 3: Alamat ── */}
                        <div
                            className="regis-section"
                            style={{
                                opacity: mounted ? 1 : 0,
                                transform: mounted ? "translateY(0)" : "translateY(12px)",
                                transition: "all 0.4s ease 0.3s",
                            }}
                        >
                            <div className="regis-section-header">
                                <div className="regis-section-icon icon-location">
                                    <FaLocationDot />
                                </div>
                                <div>
                                    <div className="regis-section-title">Alamat</div>
                                    <div className="regis-section-subtitle">
                                        Alamat lengkap lokasi bank sampah
                                    </div>
                                </div>
                            </div>

                            <div className="regis-form-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                <div>
                                    <label className="regis-label">
                                        Provinsi <span className="required">*</span>
                                    </label>
                                    <Dropdown
                                        options={listProvinsi}
                                        value={provinsi}
                                        onChange={handleProvinsiChange}
                                        placeholder="Pilih Provinsi"
                                        dropdownSize="large"
                                        fullWidth
                                    />
                                </div>
                                <div>
                                    <label className="regis-label">
                                        Kabupaten/Kota <span className="required">*</span>
                                    </label>
                                    <Dropdown
                                        options={provinsi ? listKota : []}
                                        value={kota}
                                        onChange={handleKotaChange}
                                        placeholder="Pilih Kab/Kota"
                                        dropdownSize="large"
                                        fullWidth
                                        disabled={!provinsi}
                                    />
                                </div>
                                <div>
                                    <label className="regis-label">
                                        Kecamatan <span className="required">*</span>
                                    </label>
                                    <Dropdown
                                        options={kota ? listKecamatanOptions : []}
                                        value={kecamatan}
                                        onChange={handleKecamatanChange}
                                        placeholder="Pilih Kecamatan"
                                        dropdownSize="large"
                                        fullWidth
                                        disabled={!kota}
                                    />
                                </div>
                                <div>
                                    <label className="regis-label">
                                        Kelurahan <span className="required">*</span>
                                    </label>
                                    <Dropdown
                                        options={listKelurahanOptions}
                                        value={kelurahan}
                                        onChange={(e) => setKelurahan(e.target.value)}
                                        placeholder="Pilih Kelurahan"
                                        dropdownSize="large"
                                        fullWidth
                                        disabled={!kecamatan}
                                    />
                                </div>
                            </div>

                            <div className="regis-form-group">
                                <label className="regis-label" htmlFor="regis-alamat">
                                    Alamat Lengkap <span className="required">*</span>
                                </label>
                                <textarea
                                    id="regis-alamat"
                                    className="regis-textarea"
                                    placeholder="Masukkan alamat lengkap RT/RW, dan kode pos."
                                    value={alamat}
                                    onChange={(e) => setAlamat(e.target.value)}
                                    style={{ minHeight: 80 }}
                                    required
                                />
                            </div>
                        </div>

                        {/* ── Section 4: Peta ── */}
                        <div
                            className="regis-section"
                            style={{
                                opacity: mounted ? 1 : 0,
                                transform: mounted ? "translateY(0)" : "translateY(12px)",
                                transition: "all 0.4s ease 0.4s",
                            }}
                        >
                            <div className="regis-section-header">
                                <div className="regis-section-icon icon-map">
                                    <FaMap />
                                </div>
                                <div>
                                    <div className="regis-section-title">Titik Lokasi</div>
                                    <div className="regis-section-subtitle">
                                        Klik pada peta untuk menentukan koordinat
                                    </div>
                                </div>
                            </div>

                            <div className="regis-form-group">
                                <label className="regis-label">
                                    Peta Lokasi <span className="required">*</span>
                                </label>
                                <div className="regis-map-container">
                                    <MapComponent
                                        latitude={latitude}
                                        longitude={longitude}
                                        onLocationSelect={handleLocationSelect}
                                        geocodedPos={geocodedPos}
                                    />
                                </div>

                                <div className="regis-map-hint">
                                    <FaCircleInfo />
                                    <span>
                                        Klik pada peta untuk menempatkan pin lokasi bank sampah.
                                        Anda bisa zoom in/out dan geser peta untuk menemukan
                                        lokasi yang tepat.
                                    </span>
                                </div>

                                {latitude !== null && longitude !== null && (
                                    <div className="regis-coords">
                                        <div className="regis-coord-chip">
                                            <div>
                                                <div className="coord-label">Latitude</div>
                                                <div className="coord-value">{latitude.toFixed(6)}</div>
                                            </div>
                                        </div>
                                        <div className="regis-coord-chip">
                                            <div>
                                                <div className="coord-label">Longitude</div>
                                                <div className="coord-value">{longitude.toFixed(6)}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Footer actions ── */}
                        <div className="regis-footer">
                            <Button
                                type="button"
                                color="primary"
                                variant="outline"
                                size="default"
                                icon={<FaArrowLeft />}
                                onClick={() => navigate(backPath)}
                            >
                                Kembali
                            </Button>
                            <Button
                                type="submit"
                                color="primary"
                                variant="solid"
                                size="default"
                                icon={<FaArrowRight />}
                            >
                                Lanjutkan
                            </Button>
                        </div>
                    </div>
                </form>
            )}

            {/* ══════════════ STEP 2: Admin Selection ══════════════ */}
            {step === 2 && (
                <div className="regis-bsi">
                    <div className="regis-form-card">
                        {/* ── Section header ── */}
                        <div className="regis-section">
                            <div className="regis-section-header">
                                <div className="regis-section-icon icon-admin">
                                    <FaUserShield />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className="regis-section-title">Pilih Admin {bankTypeShort}</div>
                                    <div className="regis-section-subtitle">
                                        Pilih satu atau lebih pengguna sebagai admin untuk {bankTypeLabel} ini
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    color="primary"
                                    variant="solid"
                                    size="default"
                                    icon={<FaUserPlus />}
                                    onClick={() => setIsAdminModalOpen(true)}
                                >
                                    Daftarkan Admin Baru
                                </Button>
                            </div>

                            {/* ── Selection info ── */}
                            {selectedAdmins.length > 0 && (
                                <div className="regis-admin-selection-info">
                                    <FaCheck />
                                    <span>{selectedAdmins.length} admin dipilih</span>
                                </div>
                            )}

                            {/* ── Admin table ── */}
                            <div className="regis-admin-table-wrapper">
                                <table className="regis-admin-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 48, textAlign: 'center' }}>
                                                <label className="regis-checkbox-wrapper">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedAdmins.length > 0 && selectedAdmins.length === availableAdmins.length}
                                                        onChange={toggleAllAdmins}
                                                    />
                                                    <span className="regis-checkbox-custom" />
                                                </label>
                                            </th>
                                            <th style={{ width: 56, textAlign: 'center' }}>Foto</th>
                                            <th style={{ width: 200 }}>User ID</th>
                                            <th>Nama</th>
                                            <th>Email</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {availableAdmins.map((admin) => {
                                            const isSelected = selectedAdmins.includes(admin.UserID);
                                            return (
                                                <tr
                                                    key={admin.UserID}
                                                    className={isSelected ? 'selected' : ''}
                                                    onClick={() => toggleAdmin(admin.UserID)}
                                                >
                                                    <td style={{ textAlign: 'center' }}>
                                                        <label className="regis-checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleAdmin(admin.UserID)}
                                                            />
                                                            <span className="regis-checkbox-custom" />
                                                        </label>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <div className="regis-admin-avatar">
                                                            {admin.PhotoURL ? (
                                                                <img src={admin.PhotoURL} alt={admin.Nama} />
                                                            ) : (
                                                                <span>{admin.Nama.charAt(0).toUpperCase()}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="regis-admin-userid">{admin.UserID}</span>
                                                    </td>
                                                    <td>
                                                        <span className="regis-admin-name">{admin.Nama}</span>
                                                    </td>
                                                    <td>
                                                        <span className="regis-admin-email">{admin.Email}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ── Footer actions ── */}
                        <div className="regis-footer">
                            <Button
                                type="button"
                                color="primary"
                                variant="outline"
                                size="default"
                                icon={<FaArrowLeft />}
                                onClick={() => setStep(1)}
                            >
                                Kembali
                            </Button>
                            <Button
                                type="button"
                                color="primary"
                                variant="solid"
                                size="default"
                                icon={<FaFloppyDisk />}
                                onClick={handleFinalSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Memproses registrasi..." : "Simpan & Selesai"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════ POPUP NOTIFIKASI ══════════════ */}
            {notif && (
                <PopupNotifikasi
                    message={notif.message}
                    type={notif.type}
                    onClose={() => {
                        const dest = notifNavigateTo;
                        setNotif(null);
                        setNotifNavigateTo(null);
                        if (dest) navigate(dest);
                    }}
                />
            )}

            {/* ══════════════ MODAL: Daftarkan Admin Baru ══════════════ */}
            {isAdminModalOpen && (
                <div className="regis-modal-overlay">
                    <div className="regis-modal">
                        <div className="regis-modal-header">
                            <div>
                                <h3 className="regis-modal-title">Daftarkan Admin Baru</h3>
                                <p className="regis-modal-subtitle">Tambahkan user baru untuk dijadikan admin</p>
                            </div>
                            <CloseButton onClick={() => setIsAdminModalOpen(false)} />
                        </div>
                        <form onSubmit={handleSaveNewAdmin}>
                            <div className="regis-modal-body">
                                <div className="regis-form-group">
                                    <label className="regis-label" htmlFor="new-admin-nik">
                                        NIK <span className="required">*</span>
                                    </label>
                                    <Input
                                        id="new-admin-nik"
                                        className="regis-input-neutral"
                                        variant="solid"
                                        inputSize="large"
                                        fullWidth
                                        placeholder="Masukkan 16 digit NIK"
                                        value={newAdminForm.nik}
                                        onChange={(e) => setNewAdminForm({ ...newAdminForm, nik: e.target.value })}
                                        required
                                        maxLength={16}
                                    />
                                </div>
                                <div className="regis-form-group">
                                    <label className="regis-label" htmlFor="new-admin-nama">
                                        Nama Lengkap <span className="required">*</span>
                                    </label>
                                    <Input
                                        id="new-admin-nama"
                                        className="regis-input-neutral"
                                        variant="solid"
                                        inputSize="large"
                                        fullWidth
                                        placeholder="Masukkan nama lengkap"
                                        value={newAdminForm.nama}
                                        onChange={(e) => setNewAdminForm({ ...newAdminForm, nama: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="regis-form-group">
                                    <label className="regis-label" htmlFor="new-admin-email">
                                        Email <span className="required">*</span>
                                    </label>
                                    <Input
                                        id="new-admin-email"
                                        type="email"
                                        className="regis-input-neutral"
                                        variant="solid"
                                        inputSize="large"
                                        fullWidth
                                        placeholder="contoh@email.com"
                                        value={newAdminForm.email}
                                        onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="regis-form-group">
                                    <label className="regis-label" htmlFor="new-admin-nowa">
                                        No. WhatsApp <span className="required">*</span>
                                    </label>
                                    <Input
                                        id="new-admin-nowa"
                                        type="tel"
                                        className="regis-input-neutral"
                                        variant="solid"
                                        inputSize="large"
                                        fullWidth
                                        placeholder="081234567890"
                                        value={newAdminForm.noWa}
                                        onChange={(e) => setNewAdminForm({ ...newAdminForm, noWa: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="regis-modal-footer">
                                <Button
                                    type="button"
                                    color="primary"
                                    variant="outline"
                                    size="default"
                                    onClick={() => setIsAdminModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    color="primary"
                                    variant="solid"
                                    size="default"
                                >
                                    Simpan & Tambahkan
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}