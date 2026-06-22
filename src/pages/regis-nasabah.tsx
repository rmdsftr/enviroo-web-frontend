import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import BreadcrumbLayout from "../layouts/breadcrumb";
import PopupNotifikasi from "../layouts/popup-notifikasi";
import Input from "../components/input";
import Button from "../components/button";
import Dropdown from "../components/dropdown";
import SearchableInput, { type SearchableOption } from "../components/searchable-input";
import { NasabahService } from "../services/nasabah.service";
import { BsiService } from "../services/bsi.service";
import { UsersService } from "../services/users.service";
import { getApiError } from "../utils/error.utils";
import { formatThousands } from "../utils/number.utils";
import type { NonAdminUser } from "../types/users.type";
import { FaCircleInfo, FaUserPlus, FaUsers } from "react-icons/fa6";
import "../styles/regis-bsi.css";
import "../styles/nasabah.css";
import "../styles/layout.css";

type Mode = "manual" | "existing";

export default function RegisNasabahPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const isAdminBsi = user?.role === "admin_bsi";
    const isAdminBsu = user?.role === "admin_bsu";
    const isAdminBsm = user?.role === "admin_bsm";

    const backPath = isAdminBsi ? "/bsi/nasabah"
        : isAdminBsu ? "/bsu/nasabah"
        : isAdminBsm ? "/bsm/nasabah"
        : "/nasabah";

    const [mode, setMode] = useState<Mode>("manual");
    const [afiliasiOptions, setAfiliasiOptions] = useState<{ label: string; value: string }[]>([]);
    const [existingUsers, setExistingUsers] = useState<NonAdminUser[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [selectedUser, setSelectedUser] = useState<NonAdminUser | null>(null);
    const [userQuery, setUserQuery] = useState("");
    const [isBsuNasabah, setIsBsuNasabah] = useState(false);
    const [selectedAfiliasi, setSelectedAfiliasi] = useState("");
    const [formData, setFormData] = useState({
        nik: "", nama: "", email: "", noWa: "",
        afiliasi: "", noRekening: "", saldoRupiah: "", saldoPoin: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notif, setNotif] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);

    // Fetch afiliasi options
    useEffect(() => {
        if (isAdminBsu || isAdminBsm) return;
        if (isAdminBsi && user?.bank_id) {
            BsiService.getUnit(user.bank_id)
                .then((res) => setAfiliasiOptions((res.data || []).map((b) => ({ label: b.NamaBank, value: b.BankID }))))
                .catch(() => {});
        } else {
            NasabahService.getAfiliasi()
                .then((res) => setAfiliasiOptions((res.data || []).map((item) => ({ label: item.NamaBank, value: item.BankID }))))
                .catch(() => {});
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdminBsi, isAdminBsu, isAdminBsm, user?.bank_id]);

    // Load existing users when switching to "existing" mode
    useEffect(() => {
        if (mode !== "existing" || existingUsers.length > 0) return;
        setIsLoadingUsers(true);
        UsersService.getNonNasabahUsers()
            .then((res) => setExistingUsers(res.data || []))
            .catch(() => {})
            .finally(() => setIsLoadingUsers(false));
    }, [mode, existingUsers.length]);

    const handleUserSearch = async (query: string): Promise<SearchableOption<string>[]> => {
        const q = query.toLowerCase();
        return existingUsers
            .filter((u) =>
                u.Nama.toLowerCase().includes(q) ||
                u.Email.toLowerCase().includes(q) ||
                u.UserID.toLowerCase().includes(q)
            )
            .slice(0, 10)
            .map((u) => ({ value: u.UserID, label: u.Nama, raw: u }));
    };

    const handleModeSwitch = (next: Mode) => {
        setMode(next);
        setSelectedUser(null);
        setUserQuery("");
        setSelectedAfiliasi("");
        setFormData({ nik: "", nama: "", email: "", noWa: "", afiliasi: "", noRekening: "", saldoRupiah: "", saldoPoin: "" });
    };

    const setField = (key: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setFormData((prev) => ({ ...prev, [key]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const effectiveBankId = (isAdminBsu || isAdminBsm)
                ? user?.bank_id || ""
                : isAdminBsi
                    ? (isBsuNasabah ? (mode === "existing" ? selectedAfiliasi : formData.afiliasi) : user?.bank_id || "")
                    : (mode === "existing" ? selectedAfiliasi : formData.afiliasi);

            if (mode === "existing") {
                if (!selectedUser || !effectiveBankId) {
                    setNotif({ message: "Mohon pilih akun dan afiliasi bank sampah terlebih dahulu!", type: "warning" });
                    setIsSubmitting(false);
                    return;
                }
                await NasabahService.createNasabahFromOldUser({
                    user_id: selectedUser.UserID,
                    bank_id: effectiveBankId,
                    admin_id: user?.identity_id || "",
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
                    admin_id: user?.identity_id || "",
                    ...(formData.noRekening && { no_rekening: formData.noRekening }),
                    saldo_rupiah: formData.saldoRupiah ? parseFloat(formData.saldoRupiah) : 0,
                    saldo_poin: formData.saldoPoin ? parseFloat(formData.saldoPoin) : 0,
                });
            }

            setNotif({ message: "Berhasil mendaftarkan nasabah baru!", type: "success" });
            setTimeout(() => navigate(backPath), 1800);
        } catch (error) {
            setNotif({ message: getApiError(error, "Gagal mendaftarkan nasabah. Silakan coba lagi."), type: "error" });
            setIsSubmitting(false);
        }
    };

    const showAfiliasi = !isAdminBsu && !isAdminBsm && (!isAdminBsi || isBsuNasabah);
    const afiliasiDisabled = isAdminBsi && !isBsuNasabah;
    const afiliasiPlaceholder = afiliasiDisabled
        ? "Nasabah berada langsung di bawah BSI Anda"
        : "Pilih lokasi bank sampah...";

    return (
        <>
            <BreadcrumbLayout
                items={[
                    { label: "Nasabah", path: backPath },
                    { label: "Daftar Nasabah Baru" },
                ]}
            />

            <div className="regis-bsi">
                {/* ── Form Card ── */}
                <form onSubmit={handleSubmit}>
                    <div className="regis-form-card">

                        {/* ── Mode Tabs ── */}
                        <div style={{ display: "flex", borderBottom: "1px solid #eef6f0" }}>
                            {(["manual", "existing"] as Mode[]).map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => handleModeSwitch(m)}
                                    style={{
                                        flex: 1,
                                        padding: "16px",
                                        border: "none",
                                        background: mode === m ? "#f4fbf6" : "transparent",
                                        borderBottom: mode === m ? "2px solid #4EA771" : "2px solid transparent",
                                        fontFamily: "var(--ff-sans)",
                                        fontSize: "13px",
                                        fontWeight: mode === m ? 700 : 500,
                                        color: mode === m ? "#013236" : "#6b8a78",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    {m === "manual" ? <FaUserPlus /> : <FaUsers />}
                                    {m === "manual" ? "Data Nasabah Baru" : "Dari Akun yang Ada"}
                                </button>
                            ))}
                        </div>

                        {/* ── Info Banner ── */}
                        <div className="regis-section" style={{ paddingBottom: "16px" }}>
                            <div className="nasabah-info-text">
                                <FaCircleInfo />
                                <span>
                                    <strong>Informasi Aktivasi:</strong> Sistem akan otomatis mengirimkan kode aktivasi ke email nasabah setelah didaftarkan.
                                </span>
                            </div>
                        </div>

                        {/* ── BSU Checkbox (Admin BSI only) ── */}
                        {isAdminBsi && (
                            <div className="regis-section" style={{ paddingTop: "0", paddingBottom: "16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: "rgba(78,167,113,0.06)", borderRadius: "10px", border: "1.5px solid rgba(78,167,113,0.2)" }}>
                                    <input
                                        id="bsu-check"
                                        type="checkbox"
                                        checked={isBsuNasabah}
                                        onChange={(e) => {
                                            setIsBsuNasabah(e.target.checked);
                                            setSelectedAfiliasi("");
                                            setFormData((prev) => ({ ...prev, afiliasi: "" }));
                                        }}
                                        style={{ width: "16px", height: "16px", accentColor: "#4EA771", cursor: "pointer", flexShrink: 0 }}
                                    />
                                    <label htmlFor="bsu-check" style={{ cursor: "pointer", fontWeight: 600, fontSize: "13.5px", color: "#1a3d2b", userSelect: "none" }}>
                                        Jadikan nasabah BSU?
                                        <span style={{ fontWeight: 400, color: "#5a7a68", marginLeft: "6px" }}>
                                            {isBsuNasabah ? "(Pilih unit BSU di bawah)" : "(Nasabah berada langsung di bawah BSI Anda)"}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* ════════ MODE: DATA BARU ════════ */}
                        {mode === "manual" && (
                            <div className="regis-section">
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                    <div className="nasabah-form-group">
                                        <label className="nasabah-label" htmlFor="nik">NIK <span className="required">*</span></label>
                                        <Input id="nik" variant="solid" className="nasabah-input-override" inputSize="large" fullWidth placeholder="Masukkan 16 digit NIK" value={formData.nik} onChange={setField("nik")} required maxLength={16} />
                                    </div>
                                    <div className="nasabah-form-group">
                                        <label className="nasabah-label" htmlFor="nama">Nama Lengkap <span className="required">*</span></label>
                                        <Input id="nama" variant="solid" className="nasabah-input-override" inputSize="large" fullWidth placeholder="Masukkan nama lengkap" value={formData.nama} onChange={setField("nama")} required />
                                    </div>
                                    <div className="nasabah-form-group">
                                        <label className="nasabah-label" htmlFor="email">Email <span className="required">*</span></label>
                                        <Input id="email" type="email" variant="solid" className="nasabah-input-override" inputSize="large" fullWidth placeholder="contoh@email.com" value={formData.email} onChange={setField("email")} required />
                                    </div>
                                    <div className="nasabah-form-group">
                                        <label className="nasabah-label" htmlFor="nowa">No. WhatsApp <span className="required">*</span></label>
                                        <Input id="nowa" type="tel" variant="solid" className="nasabah-input-override" inputSize="large" fullWidth placeholder="081234567890" value={formData.noWa} onChange={setField("noWa")} required />
                                    </div>
                                    {!isAdminBsu && !isAdminBsm && (
                                        <div className="nasabah-form-group" style={{ gridColumn: "1 / -1" }}>
                                            <label className="nasabah-label">Afiliasi Bank Sampah {(!isAdminBsi || isBsuNasabah) && <span className="required">*</span>}</label>
                                            <Dropdown
                                                className="nasabah-dropdown-override"
                                                options={afiliasiOptions}
                                                value={formData.afiliasi}
                                                onChange={setField("afiliasi")}
                                                fullWidth
                                                placeholder={afiliasiPlaceholder}
                                                required={!afiliasiDisabled}
                                                disabled={afiliasiDisabled}
                                            />
                                        </div>
                                    )}
                                    <div className="nasabah-form-group" style={{ gridColumn: "1 / -1" }}>
                                        <label className="nasabah-label" htmlFor="noRekening">No. Rekening</label>
                                        <Input id="noRekening" variant="solid" className="nasabah-input-override" inputSize="large" fullWidth placeholder="Kosongkan untuk menggunakan ID nasabah secara otomatis" value={formData.noRekening} onChange={setField("noRekening")} />
                                    </div>
                                    <div className="nasabah-form-group">
                                        <label className="nasabah-label" htmlFor="saldoRupiah">Saldo Rupiah Awal</label>
                                        <Input id="saldoRupiah" type="text" inputMode="numeric" variant="solid" className="nasabah-input-override" inputSize="large" fullWidth placeholder="0" iconLeft={<span style={{ fontWeight: 600 }}>Rp</span>} value={formatThousands(formData.saldoRupiah)} onChange={(e) => setFormData((p) => ({ ...p, saldoRupiah: e.target.value.replace(/[^\d]/g, "") }))} />
                                    </div>
                                    <div className="nasabah-form-group">
                                        <label className="nasabah-label" htmlFor="saldoPoin">Saldo Poin Awal</label>
                                        <Input id="saldoPoin" type="text" inputMode="numeric" variant="solid" className="nasabah-input-override" inputSize="large" fullWidth placeholder="0" iconRight={<span style={{ fontWeight: 500 }}>poin</span>} value={formatThousands(formData.saldoPoin)} onChange={(e) => setFormData((p) => ({ ...p, saldoPoin: e.target.value.replace(/[^\d]/g, "") }))} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ════════ MODE: AKUN EXISTING ════════ */}
                        {mode === "existing" && (
                            <div className="regis-section">
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px", alignItems: "start" }}>

                                    {/* ── Kiri: Cari Akun ── */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                        <div className="nasabah-form-group" style={{ margin: 0 }}>
                                            <label className="nasabah-label">Cari Akun <span className="required">*</span></label>
                                            {isLoadingUsers ? (
                                                <p style={{ fontSize: "13px", color: "var(--n-muted)" }}>Memuat daftar akun...</p>
                                            ) : (
                                                <SearchableInput<string>
                                                    value={userQuery}
                                                    onChange={setUserQuery}
                                                    onSelect={(opt) => {
                                                        if (!opt) { setSelectedUser(null); return; }
                                                        const found = existingUsers.find((u) => u.UserID === opt.value) || null;
                                                        setSelectedUser(found);
                                                    }}
                                                    onSearch={handleUserSearch}
                                                    placeholder="Cari nama, email, atau ID akun..."
                                                    inputSize="large"
                                                    fullWidth
                                                />
                                            )}
                                        </div>

                                        {/* Preview akun terpilih */}
                                        {selectedUser && (
                                            <div style={{ padding: "14px", background: "rgba(78,167,113,0.07)", borderRadius: "12px", border: "1.5px solid rgba(78,167,113,0.25)" }}>
                                                <div style={{ fontSize: "11px", color: "#5a7a68", marginBottom: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Akun Dipilih</div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    <img
                                                        src={selectedUser.PhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.Nama)}&background=4EA771&color=fff`}
                                                        alt={selectedUser.Nama}
                                                        style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                                                    />
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: "14px", color: "#1a3d2b" }}>{selectedUser.Nama}</div>
                                                        <div style={{ fontSize: "12px", color: "#5a7a68" }}>{selectedUser.Email}</div>
                                                        <div style={{ fontSize: "11px", color: "#aebac1", marginTop: "2px" }}>ID: {selectedUser.UserID}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Kanan: Afiliasi + Rekening + Saldo ── */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                        {showAfiliasi && (
                                            <div className="nasabah-form-group" style={{ margin: 0 }}>
                                                <label className="nasabah-label">Afiliasi Bank Sampah <span className="required">*</span></label>
                                                <Dropdown
                                                    options={afiliasiOptions}
                                                    value={selectedAfiliasi}
                                                    onChange={(e) => setSelectedAfiliasi(e.target.value)}
                                                    fullWidth
                                                    placeholder={afiliasiPlaceholder}
                                                    required
                                                />
                                            </div>
                                        )}
                                        <div className="nasabah-form-group" style={{ margin: 0 }}>
                                            <label className="nasabah-label" htmlFor="noRekeningEx">No. Rekening</label>
                                            <Input id="noRekeningEx" variant="solid" className="nasabah-input-override" inputSize="large" fullWidth placeholder="Kosongkan untuk menggunakan ID nasabah secara otomatis" value={formData.noRekening} onChange={setField("noRekening")} />
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                            <div className="nasabah-form-group" style={{ margin: 0 }}>
                                                <label className="nasabah-label" htmlFor="saldoRupiahEx">Saldo Rupiah Awal</label>
                                                <Input id="saldoRupiahEx" type="text" inputMode="numeric" variant="solid" className="nasabah-input-override" inputSize="large" fullWidth placeholder="0" iconLeft={<span style={{ fontWeight: 600 }}>Rp</span>} value={formatThousands(formData.saldoRupiah)} onChange={(e) => setFormData((p) => ({ ...p, saldoRupiah: e.target.value.replace(/[^\d]/g, "") }))} />
                                            </div>
                                            <div className="nasabah-form-group" style={{ margin: 0 }}>
                                                <label className="nasabah-label" htmlFor="saldoPoinEx">Saldo Poin Awal</label>
                                                <Input id="saldoPoinEx" type="text" inputMode="numeric" variant="solid" className="nasabah-input-override" inputSize="large" fullWidth placeholder="0" iconRight={<span style={{ fontWeight: 500 }}>poin</span>} value={formatThousands(formData.saldoPoin)} onChange={(e) => setFormData((p) => ({ ...p, saldoPoin: e.target.value.replace(/[^\d]/g, "") }))} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Footer Actions ── */}
                        <div className="regis-section" style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "20px", paddingBottom: "20px" }}>
                            <Button type="button" color="primary" variant="outline" size="default" onClick={() => navigate(backPath)} disabled={isSubmitting}>
                                Batal
                            </Button>
                            <Button type="submit" color="primary" variant="solid" size="default" disabled={isSubmitting}>
                                {isSubmitting ? "Menyimpan..." : "Simpan & Daftarkan"}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>

            {notif && (
                <PopupNotifikasi
                    message={notif.message}
                    type={notif.type}
                    onClose={() => setNotif(null)}
                />
            )}
        </>
    );
}
