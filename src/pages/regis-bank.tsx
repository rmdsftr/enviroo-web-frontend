import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getApiError } from "../utils/error.utils";
import { BsiService } from "../services/bsi.service";
import { BsmService } from "../services/bsm.service";
import { BsuService } from "../services/bsu.service";
import BreadcrumbLayout from "../layouts/breadcrumb";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import Button from "../components/button";
import Dropdown from "../components/dropdown";
import Input from "../components/input";
import { MapComponent, formatFileSize } from "../components/RegisMapComponent";
import { DaftarkanAdminBaruModal } from "../modals/DaftarkanAdminBaruModal";
import { useRegisBankData } from "../hooks/useRegisBankData";
import {
    FaBuilding, FaCamera, FaLocationDot, FaMap, FaCloudArrowUp, FaCircleInfo,
    FaTrash, FaFloppyDisk, FaArrowLeft, FaUserShield, FaUserPlus, FaCheck, FaArrowRight,
} from "react-icons/fa6";
import "../styles/layout.css";
import "../styles/regis-bsi.css";

export default function RegistrasiBSIPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const isAdminBsi = user?.role === "admin_bsi";
    const isBsm = location.pathname.includes("/bsm");
    const isBsu = location.pathname.includes("/bsu") || isAdminBsi;
    const bankTypeLabel = isBsu ? "Bank Sampah Unit" : isBsm ? "Bank Sampah Mandiri" : "Bank Sampah Induk";
    const bankTypeShort = isBsu ? "BSU" : isBsm ? "BSM" : "BSI";
    const backPath = isAdminBsi
        ? "/bsi/bsu"
        : isBsu ? "/superadmin/bank-sampah/bsu"
        : isBsm ? "/superadmin/bank-sampah/bsm"
        : "/superadmin/bank-sampah/bsi";

    const [step, setStep] = useState<1 | 2>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [notif, setNotif] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [notifNavigateTo, setNotifNavigateTo] = useState<string | null>(null);

    const {
        nama, setNama, deskripsi, setDeskripsi,
        provinsi, kota, kecamatan, kelurahan, setKelurahan,
        alamat, setAlamat, foto, fotoPreview,
        latitude, longitude, dragging, setDragging, afiliasiBsi, setAfiliasiBsi,
        geocodedPos, mounted,
        listProvinsi, listKota, listBsi, listKecamatanOptions, listKelurahanOptions,
        availableAdmins, selectedAdmins,
        fileInputRef,
        handleProvinsiChange, handleKotaChange, handleKecamatanChange,
        handleFileChange, handleDrop, removeFoto,
        handleLocationSelect, toggleAdmin, toggleAllAdmins, refreshAvailableAdmins,
    } = useRegisBankData({ step, isBsu, isAdminBsi });

    const handleStep1Submit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
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

            const namaLengkap = `${bankTypeShort} ${nama.trim()}`;
            const basePayload = {
                deskripsi, foto,
                provinsi, kabupaten_kota: kota,
                id_kecamatan: kecamatan, id_kelurahan: kelurahan,
                alamat_lengkap: alamat, latitude, longitude,
                user_id: selectedAdmins,
                admin_id: user?.identity_id || "",
            };

            if (isBsm) {
                await BsmService.createBsm({ nama_bsm: namaLengkap, ...basePayload });
            } else if (isBsu) {
                const parentId = isAdminBsi ? user?.bank_id : afiliasiBsi;
                if (!parentId) {
                    setNotif({ message: "Pilih referensi afiliasi Bank Sampah Induk (BSI) terlebih dahulu!", type: "error" });
                    return;
                }
                if (isAdminBsi) {
                    await BsiService.addUnit(parentId, { nama_unit: namaLengkap, ...basePayload });
                } else {
                    await BsuService.createBsu({ nama_bsu: namaLengkap, parent_bank_id: parentId, ...basePayload });
                }
            } else {
                await BsiService.createBsi({ nama_bsi: namaLengkap, ...basePayload });
            }

            setNotif({ message: "Registrasi Bank Sampah berhasil!", type: "success" });
            setNotifNavigateTo(backPath);
        } catch (error) {
            setNotif({ message: getApiError(error, "Gagal melakukan registrasi bank sampah. Silakan coba lagi."), type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const mountedStyle = (delay: string) => ({
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(12px)",
        transition: `all 0.4s ease ${delay}`,
    });

    return (
        <>
            <BreadcrumbLayout
                items={[
                    ...(isAdminBsi ? [] : [{ label: "Bank Sampah", path: "/superadmin/bank-sampah" }]),
                    { label: bankTypeLabel, path: backPath },
                    { label: `Registrasi ${bankTypeShort}` },
                    ...(step === 2 ? [{ label: "Pilih Admin" }] : []),
                ]}
            />

            <br />

            {/* ══════════════ STEP 1: Bank Info Form ══════════════ */}
            {step === 1 && (
                <form className="regis-bsi" onSubmit={handleStep1Submit}>
                    <div className="regis-form-card">
                        <div className="regis-form-row">
                            {/* ── Informasi Dasar ── */}
                            <div className="regis-section" style={mountedStyle("0.1s")}>
                                <div className="regis-section-header">
                                    <div className="regis-section-icon icon-info"><FaBuilding /></div>
                                    <div>
                                        <div className="regis-section-title">Informasi Dasar</div>
                                        <div className="regis-section-subtitle">Nama dan deskripsi bank sampah</div>
                                    </div>
                                </div>

                                <div className="regis-form-group">
                                    <label className="regis-label" htmlFor="regis-nama">
                                        Nama {bankTypeLabel} <span className="required">*</span>
                                    </label>
                                    <Input
                                        id="regis-nama" className="regis-input-neutral"
                                        variant="solid" inputSize="large" fullWidth
                                        iconLeft={<span style={{ fontWeight: 700, lineHeight: 1, color: "var(--c-primary)", whiteSpace: "nowrap" }}>{bankTypeShort}</span>}
                                        placeholder="Enviroo Andalas"
                                        value={nama} onChange={(e) => setNama(e.target.value)} required
                                    />
                                </div>

                                {isBsu && !isAdminBsi && (
                                    <div className="regis-form-group">
                                        <label className="regis-label">Afiliasi Bank Sampah Induk <span className="required">*</span></label>
                                        <Dropdown
                                            options={listBsi} value={afiliasiBsi}
                                            onChange={(e) => setAfiliasiBsi(e.target.value)}
                                            placeholder="Pilih BSI Afiliasi" dropdownSize="large" fullWidth
                                        />
                                    </div>
                                )}

                                <div className="regis-form-group">
                                    <label className="regis-label" htmlFor="regis-deskripsi">
                                        Deskripsi <span className="required">*</span>
                                    </label>
                                    <textarea
                                        id="regis-deskripsi" className="regis-textarea"
                                        placeholder="Jelaskan secara singkat tentang bank sampah ini, misalnya visi misi, jangkauan layanan, dll."
                                        value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} required
                                    />
                                </div>
                            </div>

                            {/* ── Foto ── */}
                            <div className="regis-section" style={mountedStyle("0.2s")}>
                                <div className="regis-section-header">
                                    <div className="regis-section-icon icon-photo"><FaCamera /></div>
                                    <div>
                                        <div className="regis-section-title">Foto</div>
                                        <div className="regis-section-subtitle">Unggah foto bank sampah</div>
                                    </div>
                                </div>

                                <div className="regis-form-group">
                                    <label className="regis-label">Foto Bank Sampah <span className="required">*</span></label>
                                    {!fotoPreview ? (
                                        <div
                                            className={`regis-upload-area${dragging ? " dragging" : ""}`}
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                            onDragLeave={() => setDragging(false)}
                                            onDrop={handleDrop}
                                        >
                                            <div className="regis-upload-icon-wrapper"><FaCloudArrowUp /></div>
                                            <div className="regis-upload-text">
                                                <p>Drag & drop foto di sini, atau <span className="upload-browse">pilih file</span></p>
                                                <span>PNG, JPG, JPEG (maks. 5 MB)</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="regis-upload-area has-file">
                                            <div className="regis-upload-preview">
                                                <img src={fotoPreview} alt="Preview" className="regis-preview-img" />
                                                <div className="regis-preview-info">
                                                    <div className="regis-preview-name">{foto?.name}</div>
                                                    <div className="regis-preview-size">{foto && formatFileSize(foto.size)}</div>
                                                    <button
                                                        type="button" className="regis-preview-remove"
                                                        onClick={(e) => { e.stopPropagation(); removeFoto(); }}
                                                    >
                                                        <FaTrash style={{ marginRight: 6, fontSize: 11 }} />Hapus Foto
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg"
                                        className="regis-upload-input" onChange={handleFileChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── Alamat ── */}
                        <div className="regis-section" style={mountedStyle("0.3s")}>
                            <div className="regis-section-header">
                                <div className="regis-section-icon icon-location"><FaLocationDot /></div>
                                <div>
                                    <div className="regis-section-title">Alamat</div>
                                    <div className="regis-section-subtitle">Alamat lengkap lokasi bank sampah</div>
                                </div>
                            </div>

                            <div className="regis-form-group" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                                <div>
                                    <label className="regis-label">Provinsi <span className="required">*</span></label>
                                    <Dropdown options={listProvinsi} value={provinsi} onChange={handleProvinsiChange} placeholder="Pilih Provinsi" dropdownSize="large" fullWidth />
                                </div>
                                <div>
                                    <label className="regis-label">Kabupaten/Kota <span className="required">*</span></label>
                                    <Dropdown options={provinsi ? listKota : []} value={kota} onChange={handleKotaChange} placeholder="Pilih Kab/Kota" dropdownSize="large" fullWidth disabled={!provinsi} />
                                </div>
                                <div>
                                    <label className="regis-label">Kecamatan <span className="required">*</span></label>
                                    <Dropdown options={kota ? listKecamatanOptions : []} value={kecamatan} onChange={handleKecamatanChange} placeholder="Pilih Kecamatan" dropdownSize="large" fullWidth disabled={!kota} />
                                </div>
                                <div>
                                    <label className="regis-label">Kelurahan <span className="required">*</span></label>
                                    <Dropdown options={listKelurahanOptions} value={kelurahan} onChange={(e) => setKelurahan(e.target.value)} placeholder="Pilih Kelurahan" dropdownSize="large" fullWidth disabled={!kecamatan} />
                                </div>
                            </div>

                            <div className="regis-form-group">
                                <label className="regis-label" htmlFor="regis-alamat">Alamat Lengkap <span className="required">*</span></label>
                                <textarea
                                    id="regis-alamat" className="regis-textarea"
                                    placeholder="Masukkan alamat lengkap RT/RW, dan kode pos."
                                    value={alamat} onChange={(e) => setAlamat(e.target.value)}
                                    style={{ minHeight: 80 }} required
                                />
                            </div>
                        </div>

                        {/* ── Peta ── */}
                        <div className="regis-section" style={mountedStyle("0.4s")}>
                            <div className="regis-section-header">
                                <div className="regis-section-icon icon-map"><FaMap /></div>
                                <div>
                                    <div className="regis-section-title">Titik Lokasi</div>
                                    <div className="regis-section-subtitle">Klik pada peta untuk menentukan koordinat</div>
                                </div>
                            </div>

                            <div className="regis-form-group">
                                <label className="regis-label">Peta Lokasi <span className="required">*</span></label>
                                <div className="regis-map-container">
                                    <MapComponent
                                        latitude={latitude} longitude={longitude}
                                        onLocationSelect={handleLocationSelect} geocodedPos={geocodedPos}
                                    />
                                </div>
                                <div className="regis-map-hint">
                                    <FaCircleInfo />
                                    <span>Klik pada peta untuk menempatkan pin lokasi bank sampah. Anda bisa zoom in/out dan geser peta untuk menemukan lokasi yang tepat.</span>
                                </div>
                                {latitude !== null && longitude !== null && (
                                    <div className="regis-coords">
                                        <div className="regis-coord-chip">
                                            <div><div className="coord-label">Latitude</div><div className="coord-value">{latitude.toFixed(6)}</div></div>
                                        </div>
                                        <div className="regis-coord-chip">
                                            <div><div className="coord-label">Longitude</div><div className="coord-value">{longitude.toFixed(6)}</div></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="regis-footer">
                            <Button type="button" color="primary" variant="outline" size="default" icon={<FaArrowLeft />} onClick={() => navigate(backPath)}>
                                Kembali
                            </Button>
                            <Button type="submit" color="primary" variant="solid" size="default" icon={<FaArrowRight />}>
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
                        <div className="regis-section">
                            <div className="regis-section-header">
                                <div className="regis-section-icon icon-admin"><FaUserShield /></div>
                                <div style={{ flex: 1 }}>
                                    <div className="regis-section-title">Pilih Admin {bankTypeShort}</div>
                                    <div className="regis-section-subtitle">Pilih satu atau lebih pengguna sebagai admin untuk {bankTypeLabel} ini</div>
                                </div>
                                <Button type="button" color="primary" variant="solid" size="default" icon={<FaUserPlus />} onClick={() => setIsAdminModalOpen(true)}>
                                    Daftarkan Admin Baru
                                </Button>
                            </div>

                            {selectedAdmins.length > 0 && (
                                <div className="regis-admin-selection-info">
                                    <FaCheck />
                                    <span>{selectedAdmins.length} admin dipilih</span>
                                </div>
                            )}

                            <div className="regis-admin-table-wrapper">
                                <table className="regis-admin-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 48, textAlign: "center" }}>
                                                <label className="regis-checkbox-wrapper">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedAdmins.length > 0 && selectedAdmins.length === availableAdmins.length}
                                                        onChange={toggleAllAdmins}
                                                    />
                                                    <span className="regis-checkbox-custom" />
                                                </label>
                                            </th>
                                            <th style={{ width: 56, textAlign: "center" }}>Foto</th>
                                            <th style={{ width: 200 }}>User ID</th>
                                            <th>Nama</th>
                                            <th>Email</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {availableAdmins.map((admin) => {
                                            const isSelected = selectedAdmins.includes(admin.UserID);
                                            return (
                                                <tr key={admin.UserID} className={isSelected ? "selected" : ""} onClick={() => toggleAdmin(admin.UserID)}>
                                                    <td style={{ textAlign: "center" }}>
                                                        <label className="regis-checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
                                                            <input type="checkbox" checked={isSelected} onChange={() => toggleAdmin(admin.UserID)} />
                                                            <span className="regis-checkbox-custom" />
                                                        </label>
                                                    </td>
                                                    <td style={{ textAlign: "center" }}>
                                                        <div className="regis-admin-avatar">
                                                            {admin.PhotoURL ? <img src={admin.PhotoURL} alt={admin.Nama} /> : <span>{admin.Nama.charAt(0).toUpperCase()}</span>}
                                                        </div>
                                                    </td>
                                                    <td><span className="regis-admin-userid">{admin.UserID}</span></td>
                                                    <td><span className="regis-admin-name">{admin.Nama}</span></td>
                                                    <td><span className="regis-admin-email">{admin.Email}</span></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="regis-footer">
                            <Button type="button" color="secondary" variant="outline" size="default" icon={<FaArrowLeft />} onClick={() => setStep(1)}>
                                Kembali
                            </Button>
                            <Button type="button" color="secondary" variant="solid" size="default" icon={<FaFloppyDisk />} onClick={handleFinalSubmit} disabled={isSubmitting}>
                                {isSubmitting ? "Memproses registrasi..." : "Simpan & Selesai"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Notifikasi ── */}
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

            {/* ── Modal: Daftarkan Admin Baru ── */}
            {isAdminModalOpen && (
                <DaftarkanAdminBaruModal
                    onUserCreated={refreshAvailableAdmins}
                    onClose={() => setIsAdminModalOpen(false)}
                    onSuccess={(msg) => setNotif({ message: msg, type: "success" })}
                    onError={(msg) => setNotif({ message: msg, type: "error" })}
                />
            )}
        </>
    );
}
