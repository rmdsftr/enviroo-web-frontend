import { useState } from "react";
import { NasabahService } from "../services/nasabah.service";
import { formatThousands } from "../utils/number.utils";
import { UsersService } from "../services/users.service";
import type { NonAdminUser } from "../types/users.type";
import Input from "../components/input";
import Button from "../components/button";
import Dropdown from "../components/dropdown";
import CloseButton from "../components/close-button";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import { FaCircleInfo } from "react-icons/fa6";
import "../styles/nasabah.css";

interface DaftarNasabahModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    isAdminBsi: boolean;
    isAdminBsu: boolean;
    isAdminBsm: boolean;
    bankId: string;
    identityId: string;
    afiliasiOptions: { label: string; value: string }[];
}

export default function DaftarNasabahModal({
    isOpen,
    onClose,
    onSuccess,
    isAdminBsi,
    isAdminBsu,
    isAdminBsm,
    bankId,
    identityId,
    afiliasiOptions,
}: DaftarNasabahModalProps) {
    const [isFromExisting, setIsFromExisting] = useState(false);
    const [existingUsers, setExistingUsers] = useState<NonAdminUser[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<NonAdminUser | null>(null);
    const [isBsuNasabah, setIsBsuNasabah] = useState(false);
    const [selectedAfiliasi, setSelectedAfiliasi] = useState("");
    const [formData, setFormData] = useState({ nik: "", nama: "", email: "", noWa: "", afiliasi: "", noRekening: "", saldoRupiah: "", saldoPoin: "" });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [popupNotif, setPopupNotif] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);

    if (!isOpen) return null;

    const resetState = () => {
        setIsFromExisting(false);
        setSelectedUser(null);
        setSelectedAfiliasi("");
        setIsBsuNasabah(false);
        setSearchQuery("");
        setFormData({ nik: "", nama: "", email: "", noWa: "", afiliasi: "", noRekening: "", saldoRupiah: "", saldoPoin: "" });
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleOpenExisting = () => {
        setIsFromExisting(true);
        setSelectedUser(null);
        setSelectedAfiliasi("");
        setSearchQuery("");

        const fetchPromise = UsersService.getNonNasabahUsers();

        fetchPromise
            .then((res) => setExistingUsers(res.data || []))
            .catch((err) => console.error("Gagal mendapatkan daftar akun", err));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isSubmitting) return; // Prevent double-clicks
        setIsSubmitting(true);
        
        try {
            const effectiveBankId = (isAdminBsu || isAdminBsm)
                ? bankId // BSU/BSM: selalu ke bank mereka sendiri
                : isAdminBsi
                    ? (isBsuNasabah ? (isFromExisting ? selectedAfiliasi : formData.afiliasi) : bankId)
                    : (isFromExisting ? selectedAfiliasi : formData.afiliasi);

            if (isFromExisting) {
                if (!selectedUser || !effectiveBankId) {
                    setPopupNotif({ message: "Mohon pilih akun dan afiliasi bank sampah terlebih dahulu!", type: "warning" });
                    setIsSubmitting(false);
                    return;
                }
                await NasabahService.createNasabahFromOldUser({
                    user_id: selectedUser.UserID,
                    bank_id: effectiveBankId,
                    admin_id: identityId,
                    ...(formData.noRekening && { no_rekening: formData.noRekening }),
                    saldo_rupiah: formData.saldoRupiah ? parseFloat(formData.saldoRupiah) : 0,
                    saldo_poin: formData.saldoPoin ? parseFloat(formData.saldoPoin) : 0,
                });
            } else {
                await NasabahService.createNasabah({
                    user_id: formData.nik,
                    nama: formData.nama,
                    email: formData.email,
                    no_whatsapp: formData.noWa,
                    bank_id: effectiveBankId,
                    admin_id: identityId,
                    ...(formData.noRekening && { no_rekening: formData.noRekening }),
                    saldo_rupiah: formData.saldoRupiah ? parseFloat(formData.saldoRupiah) : 0,
                    saldo_poin: formData.saldoPoin ? parseFloat(formData.saldoPoin) : 0,
                });
            }
            onSuccess();
            setPopupNotif({ message: "Berhasil mendaftarkan nasabah baru!", type: "success" });
            // Close after a brief delay so user sees the popup, or wait for popup to close
            setTimeout(() => {
                setIsSubmitting(false);
                handleClose();
            }, 2000);
        } catch (error) {
            console.error("Gagal menyimpan nasabah:", error);
            setPopupNotif({ message: "Gagal mendaftarkan nasabah. Silakan coba lagi.", type: "error" });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="nasabah-modal-overlay">
            <div className="nasabah-modal">
                <div className="nasabah-modal-header">
                    <div>
                        <h3 className="nasabah-modal-title">Daftarkan Nasabah Baru</h3>
                        <p className="nasabah-modal-subtitle">Isi data di bawah ini untuk mendaftarkan nasabah</p>
                    </div>
                    <CloseButton onClick={handleClose} />
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="nasabah-modal-body">
                        <div
                            className="nasabah-form-grid"
                            style={{ display: "grid", gridTemplateColumns: isFromExisting ? "1fr" : "repeat(2, 1fr)", gap: "20px" }}
                        >
                            {/* Info block */}
                            <div className="nasabah-info-text" style={{ gridColumn: "1 / -1" }}>
                                <FaCircleInfo />
                                <span>
                                    <strong>Informasi Aktivasi:</strong> Setelah didaftarkan, sistem akan otomatis
                                    mengirimkan kode aktivasi ke email nasabah terdaftar.
                                </span>
                            </div>

                            {/* Checkbox: Jadikan Nasabah BSU? (Admin BSI only) */}
                            {isAdminBsi && (
                                <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "rgba(78,167,113,0.06)", borderRadius: "10px", border: "1.5px solid rgba(78,167,113,0.2)" }}>
                                    <input
                                        id="bsu-nasabah-check"
                                        type="checkbox"
                                        checked={isBsuNasabah}
                                        onChange={(e) => {
                                            setIsBsuNasabah(e.target.checked);
                                            setSelectedAfiliasi("");
                                            setFormData((prev) => ({ ...prev, afiliasi: "" }));
                                        }}
                                        style={{ width: "16px", height: "16px", accentColor: "#4EA771", cursor: "pointer" }}
                                    />
                                    <label htmlFor="bsu-nasabah-check" style={{ cursor: "pointer", fontWeight: 600, fontSize: "13.5px", color: "#1a3d2b", userSelect: "none" }}>
                                        Jadikan nasabah BSU?
                                        <span style={{ fontWeight: 400, color: "#5a7a68", marginLeft: "6px" }}>
                                            {isBsuNasabah ? "(Pilih unit BSU di bawah)" : "(Nasabah akan berada langsung di bawah BSI Anda)"}
                                        </span>
                                    </label>
                                </div>
                            )}

                            {isFromExisting ? (
                                 /* ── Mode: Pilih dari Akun yang Ada ── */
                                <>
                                <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: (isAdminBsu || isAdminBsm) ? "1fr" : "1fr 1fr", gap: "20px", alignItems: "start" }}>
                                    {/* Kiri: daftar akun */}
                                    <div className="nasabah-form-group" style={{ margin: 0 }}>
                                        <label className="nasabah-label" style={{ marginBottom: 0 }}>Pilih Akun <span className="required">*</span></label>
                                        <Input
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Cari nama, email, atau ID..."
                                            variant="solid"
                                            inputSize="default"
                                            fullWidth
                                            style={{ marginBottom: "8px" }}
                                            className="nasabah-input-override"
                                        />
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "250px", overflowY: "auto", border: "1.5px solid #d1dfd5", borderRadius: "10px", padding: "8px" }}>
                                            {existingUsers.length === 0 && (
                                                <p style={{ color: "#8a9da5", fontSize: "13px", padding: "12px", textAlign: "center" }}>Tidak ada akun yang tersedia</p>
                                            )}
                                            {existingUsers
                                                .filter((u) =>
                                                    u.Nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    u.Email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    u.UserID.toLowerCase().includes(searchQuery.toLowerCase())
                                                )
                                                .map((u) => (
                                                    <label
                                                        key={u.UserID}
                                                        style={{
                                                            display: "flex", alignItems: "center", gap: "12px",
                                                            padding: "10px 12px", borderRadius: "8px", cursor: "pointer",
                                                            background: selectedUser?.UserID === u.UserID ? "rgba(78,167,113,0.1)" : "transparent",
                                                            border: selectedUser?.UserID === u.UserID ? "1.5px solid #4EA771" : "1.5px solid transparent",
                                                            transition: "all 0.15s",
                                                        }}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="selected-user"
                                                            value={u.UserID}
                                                            checked={selectedUser?.UserID === u.UserID}
                                                            onChange={() => setSelectedUser(u)}
                                                            style={{ accentColor: "#4EA771", width: "16px", height: "16px", flexShrink: 0 }}
                                                        />
                                                        <img
                                                            src={u.PhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.Nama)}&background=4EA771&color=fff`}
                                                            alt={u.Nama}
                                                            style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                                                        />
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontWeight: 600, fontSize: "13px", color: "#1a3d2b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.Nama}</div>
                                                            <div style={{ fontSize: "12px", color: "#5a7a68", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.Email}</div>
                                                            <div style={{ fontSize: "11px", color: "#aebac1" }}>ID: {u.UserID}</div>
                                                        </div>
                                                    </label>
                                                ))}
                                        </div>

                                        {/* BSU/BSM: preview akun dipilih di bawah list (karena kolom kanan tidak ada) */}
                                        {(isAdminBsu || isAdminBsm) && selectedUser && (
                                            <div style={{ marginTop: "16px", padding: "12px", background: "rgba(78,167,113,0.08)", borderRadius: "10px", border: "1.5px solid rgba(78,167,113,0.25)" }}>
                                                <div style={{ fontSize: "11px", color: "#5a7a68", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Akun Dipilih</div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <img
                                                        src={selectedUser.PhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.Nama)}&background=4EA771&color=fff`}
                                                        alt={selectedUser.Nama}
                                                        style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                                                    />
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: "13px", color: "#1a3d2b" }}>{selectedUser.Nama}</div>
                                                        <div style={{ fontSize: "12px", color: "#5a7a68" }}>{selectedUser.Email}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Kanan: dropdown afiliasi — hanya untuk non-BSU dan non-BSM */}
                                    {!isAdminBsu && !isAdminBsm && (
                                        <div className="nasabah-form-group" style={{ margin: 0 }}>
                                            <label className="nasabah-label">Afiliasi Bank Sampah <span className="required">*</span></label>
                                            <Dropdown
                                                className="nasabah-dropdown-override"
                                                options={afiliasiOptions}
                                                value={selectedAfiliasi}
                                                onChange={(e) => setSelectedAfiliasi(e.target.value)}
                                                fullWidth
                                                placeholder={isAdminBsi && !isBsuNasabah ? "Nasabah akan berada di bawah BSI Anda" : "Pilih lokasi bank sampah..."}
                                                required={!isAdminBsi || isBsuNasabah}
                                                disabled={isAdminBsi && !isBsuNasabah}
                                            />
                                            {selectedUser && (
                                                <div style={{ marginTop: "16px", padding: "12px", background: "rgba(78,167,113,0.08)", borderRadius: "10px", border: "1.5px solid rgba(78,167,113,0.25)" }}>
                                                    <div style={{ fontSize: "11px", color: "#5a7a68", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Akun Dipilih</div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                        <img
                                                            src={selectedUser.PhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.Nama)}&background=4EA771&color=fff`}
                                                            alt={selectedUser.Nama}
                                                            style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                                                        />
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: "13px", color: "#1a3d2b" }}>{selectedUser.Nama}</div>
                                                            <div style={{ fontSize: "12px", color: "#5a7a68" }}>{selectedUser.Email}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="nasabah-form-group" style={{ gridColumn: "1 / -1" }}>
                                    <label className="nasabah-label" htmlFor="noRekeningExisting">No. Rekening</label>
                                    <Input id="noRekeningExisting" variant="solid" className="nasabah-input-override" inputSize="large" fullWidth placeholder="Kosongkan untuk menggunakan ID nasabah secara otomatis" value={formData.noRekening} onChange={(e) => setFormData({ ...formData, noRekening: e.target.value })} />
                                </div>
                                <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                    <div className="nasabah-form-group" style={{ margin: 0 }}>
                                        <label className="nasabah-label" htmlFor="saldoRupiahExisting">Saldo Rupiah Awal</label>
                                        <Input id="saldoRupiahExisting" type="text" inputMode="numeric" variant="solid" className="nasabah-input-override" inputSize="large" fullWidth placeholder="0" iconLeft={<span style={{ lineHeight: 1, fontWeight: 600 }}>Rp</span>} value={formatThousands(formData.saldoRupiah)} onChange={(e) => setFormData({ ...formData, saldoRupiah: e.target.value.replace(/[^\d]/g, '') })} />
                                    </div>
                                    <div className="nasabah-form-group" style={{ margin: 0 }}>
                                        <label className="nasabah-label" htmlFor="saldoPoinExisting">Saldo Poin Awal</label>
                                        <Input id="saldoPoinExisting" type="text" inputMode="numeric" variant="solid" className="nasabah-input-override" inputSize="large" fullWidth placeholder="0" iconRight={<span style={{ lineHeight: 1, fontWeight: 500 }}>poin</span>} value={formatThousands(formData.saldoPoin)} onChange={(e) => setFormData({ ...formData, saldoPoin: e.target.value.replace(/[^\d]/g, '') })} />
                                    </div>
                                </div>
                                </>

                            ) : (
                                /* ── Mode: Input Manual ── */
                                <>
                                    <div className="nasabah-form-group">
                                        <label className="nasabah-label" htmlFor="nik">NIK <span className="required">*</span></label>
                                        <Input id="nik" variant="solid" className="nasabah-input-override" inputSize="large" fullWidth placeholder="Masukkan 16 digit NIK" value={formData.nik} onChange={(e) => setFormData({ ...formData, nik: e.target.value })} required maxLength={16} />
                                    </div>
                                    <div className="nasabah-form-group">
                                        <label className="nasabah-label" htmlFor="nama">Nama Lengkap <span className="required">*</span></label>
                                        <Input id="nama" variant="solid" className="nasabah-input-override" inputSize="large" fullWidth placeholder="Masukkan nama lengkap" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} required />
                                    </div>
                                    {/* Afiliasi hanya untuk non-BSU dan non-BSM */}
                                    {!isAdminBsu && !isAdminBsm && (
                                        <div className="nasabah-form-group">
                                            <label className="nasabah-label">Afiliasi Bank Sampah <span className="required">*</span></label>
                                            <Dropdown
                                                className="nasabah-dropdown-override"
                                                options={afiliasiOptions}
                                                value={formData.afiliasi}
                                                onChange={(e) => setFormData({ ...formData, afiliasi: e.target.value })}
                                                fullWidth
                                                placeholder={isAdminBsi && !isBsuNasabah ? "Nasabah akan berada di bawah BSI Anda" : "Pilih lokasi bank sampah..."}
                                                required={!isAdminBsi || isBsuNasabah}
                                                disabled={isAdminBsi && !isBsuNasabah}
                                            />
                                        </div>
                                    )}
                                    <div className="nasabah-form-group">
                                        <label className="nasabah-label" htmlFor="email">Email <span className="required">*</span></label>
                                        <Input id="email" type="email" variant="solid" className="nasabah-input-override" inputSize="large" fullWidth placeholder="contoh@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                                    </div>
                                    <div className="nasabah-form-group">
                                        <label className="nasabah-label" htmlFor="nowa">No. WhatsApp <span className="required">*</span></label>
                                        <Input id="nowa" type="tel" variant="solid" className="nasabah-input-override" inputSize="large" fullWidth placeholder="081234567890" value={formData.noWa} onChange={(e) => setFormData({ ...formData, noWa: e.target.value })} required />
                                    </div>
                                    <div className="nasabah-form-group" style={{ gridColumn: "1 / -1" }}>
                                        <label className="nasabah-label" htmlFor="noRekening">No. Rekening</label>
                                        <Input id="noRekening" variant="solid" className="nasabah-input-override" inputSize="large" fullWidth placeholder="Kosongkan untuk menggunakan ID nasabah secara otomatis" value={formData.noRekening} onChange={(e) => setFormData({ ...formData, noRekening: e.target.value })} />
                                    </div>
                                    <div className="nasabah-form-group">
                                        <label className="nasabah-label" htmlFor="saldoRupiah">Saldo Rupiah Awal</label>
                                        <Input id="saldoRupiah" type="text" inputMode="numeric" variant="solid" className="nasabah-input-override" inputSize="large" fullWidth placeholder="0" iconLeft={<span style={{ lineHeight: 1, fontWeight: 600 }}>Rp</span>} value={formatThousands(formData.saldoRupiah)} onChange={(e) => setFormData({ ...formData, saldoRupiah: e.target.value.replace(/[^\d]/g, '') })} />
                                    </div>
                                    <div className="nasabah-form-group">
                                        <label className="nasabah-label" htmlFor="saldoPoin">Saldo Poin Awal</label>
                                        <Input id="saldoPoin" type="text" inputMode="numeric" variant="solid" className="nasabah-input-override" inputSize="large" fullWidth placeholder="0" iconRight={<span style={{ lineHeight: 1, fontWeight: 500 }}>poin</span>} value={formatThousands(formData.saldoPoin)} onChange={(e) => setFormData({ ...formData, saldoPoin: e.target.value.replace(/[^\d]/g, '') })} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="nasabah-modal-footer">
                        {!isFromExisting ? (
                            <Button type="button" color="primary" variant="ghost" size="default" isRounded style={{ marginRight: "auto" }} onClick={handleOpenExisting}>
                                Tambah dari Akun yang Ada
                            </Button>
                        ) : (
                            <Button type="button" color="primary" variant="ghost" size="default" isRounded style={{ marginRight: "auto" }} onClick={() => setIsFromExisting(false)}>
                                ← Kembali ke Input Manual
                            </Button>
                        )}
                        <Button type="button" color="primary" variant="outline" size="default" onClick={handleClose} disabled={isSubmitting}>Batal</Button>
                        <Button type="submit" color="primary" variant="solid" size="default" disabled={isSubmitting}>
                            {isSubmitting ? "Menyimpan..." : "Simpan & Daftarkan"}
                        </Button>
                    </div>
                </form>
            </div>
            {popupNotif && (
                <PopupNotifikasi
                    message={popupNotif.message}
                    type={popupNotif.type}
                    onClose={() => setPopupNotif(null)}
                />
            )}
        </div>
    );
}
