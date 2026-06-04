import { useState, useEffect, useCallback } from "react";
import { FaLocationDot, FaUserPlus, FaToggleOff } from "react-icons/fa6";
import { useAuth } from "../../contexts/AuthContext";
import { SuperadminService, type SuperadminItem, type AddSuperadminRequest } from "../../services/superadmin.service";
import Table, { TableAvatar, TableBadge, type ColumnDef } from "../../components/table";
import PopupMenu from "../../components/popup-menu";
import PopupConfirmation from "../../layouts/popup-confirmation";
import PopupNotifikasi from "../../layouts/popup-notifikasi";
import Button from "../../components/button";
import Input from "../../components/input";
import CloseButton from "../../components/close-button";
import { formatTanggalPanjang } from "../../utils/date.utils";
import "../../styles/layout.css";
import "../../styles/profil-my-bank.css";
import "../../styles/nasabah.css";
import "../../styles/regis-bsi.css";
import dlhLogo from "../../assets/dlh-padang.png";

const DLH = {
    nama:      "Dinas Lingkungan Hidup Kota Padang",
    provinsi:  "Sumatera Barat",
    kota:      "Kota Padang",
    alamat:    "3CV3+3J2, Jalan Simpang Rambutan, Gunungsari, Kuranji, Gn. Sarik, Kec. Kuranji, Kota Padang, Sumatera Barat 25171",
    deskripsi: "Dinas Lingkungan Hidup Kota Padang bertanggung jawab dalam pengelolaan lingkungan hidup dan persampahan serta mendukung pengembangan program bank sampah untuk mewujudkan Kota Padang yang bersih, sehat, dan berkelanjutan.",
};

export default function ProfilDlhPage() {
    const { user } = useAuth();

    const [list,    setList]    = useState<SuperadminItem[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Modal tambah ──
    const [showAdd, setShowAdd]         = useState(false);
    const [form,    setForm]            = useState<AddSuperadminRequest>({ user_id: "", nama: "", email: "", no_whatsapp: "" });
    const [submitting, setSubmitting]   = useState(false);

    // ── Nonaktifkan ──
    const [confirmTarget, setConfirmTarget] = useState<SuperadminItem | null>(null);

    // ── Notif ──
    const [notif, setNotif] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            setList(await SuperadminService.getList());
        } catch {
            setNotif({ message: "Gagal memuat daftar superadmin.", type: "error" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchList(); }, [fetchList]);

    const handleAdd = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await SuperadminService.add(form);
            setShowAdd(false);
            setForm({ user_id: "", nama: "", email: "", no_whatsapp: "" });
            setNotif({ message: `Superadmin ${res.nama} berhasil ditambahkan. OTP aktivasi telah dikirim ke email.`, type: "success" });
            fetchList();
        } catch (err: any) {
            setNotif({ message: err?.response?.data?.error ?? "Gagal menambahkan superadmin.", type: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleNonaktifkan = async () => {
        if (!confirmTarget) return;
        try {
            await SuperadminService.nonaktifkan(confirmTarget.admin_id);
            setNotif({ message: `Superadmin ${confirmTarget.nama} berhasil dinonaktifkan.`, type: "success" });
            fetchList();
        } catch (err: any) {
            setNotif({ message: err?.response?.data?.error ?? "Gagal menonaktifkan superadmin.", type: "error" });
        } finally {
            setConfirmTarget(null);
        }
    };

    const columns: ColumnDef<SuperadminItem>[] = [
        {
            key: "foto",
            header: "Foto",
            width: "56px",
            align: "center",
            render: (row) => <TableAvatar src={row.photo_url} alt={row.nama} />,
        },
        {
            key: "admin_id",
            header: "Admin ID",
            width: "90px",
            render: (row) => <span className="table-name">{row.admin_id}</span>,
        },
        {
            key: "nama",
            header: "Nama",
            render: (row) => <span style={{ fontWeight: 500 }}>{row.nama}</span>,
        },
        {
            key: "email",
            header: "Email",
            render: (row) => <span style={{ color: "#013236a0" }}>{row.email}</span>,
        },
        {
            key: "no_whatsapp",
            header: "No. WhatsApp",
            width: "140px",
            render: (row) => <span style={{ color: "#013236a0" }}>{row.no_whatsapp || "-"}</span>,
        },
        {
            key: "joined_at",
            header: "Bergabung",
            width: "150px",
            render: (row) => <span style={{ color: "#013236a0", fontSize: "12px" }}>{formatTanggalPanjang(row.joined_at)}</span>,
        },
        {
            key: "status",
            header: "Status",
            width: "120px",
            render: (row) => {
                if (row.status_admin === "pending") {
                    return (
                        <span className="table-badge table-badge--pending">
                            <span className="table-badge-dot" />
                            Pending
                        </span>
                    );
                }
                return <TableBadge label={row.status_admin === "aktif" ? "Aktif" : "Nonaktif"} active={row.status_admin === "aktif"} />;
            },
        },
        {
            key: "aksi",
            header: "Aksi",
            width: "64px",
            align: "center",
            render: (row) => {
                if (row.user_id === user?.user_id) return null;
                if (row.status_admin === "nonaktif") return null;
                return (
                    <PopupMenu
                        trigger={
                            <button className="table-action-btn" type="button" title="Aksi">
                                <FaToggleOff />
                            </button>
                        }
                        items={[{
                            label: "Nonaktifkan Superadmin",
                            icon: <FaToggleOff />,
                            variant: "danger",
                            onClick: () => setConfirmTarget(row),
                        }]}
                    />
                );
            },
        },
    ];

    return (
        <>
            {/* Popups */}
            {notif && (
                <PopupNotifikasi message={notif.message} type={notif.type} onClose={() => setNotif(null)} />
            )}
            <PopupConfirmation
                isOpen={!!confirmTarget}
                type="danger"
                title="Nonaktifkan Superadmin?"
                message={`Apakah Anda yakin ingin menonaktifkan ${confirmTarget?.nama ?? ""}? Akun ini tidak akan bisa login.`}
                confirmText="Ya, Nonaktifkan"
                cancelText="Batal"
                onConfirm={handleNonaktifkan}
                onCancel={() => setConfirmTarget(null)}
            />

            {/* ── Profil Card ── */}
            <div className="pmb-card">
                <div className="pmb-card-left">
                    <div className="pmb-photo-wrapper" style={{ marginBottom: "8px" }}>
                        <div className="pmb-photo" style={{ borderRadius: "50%", overflow: "hidden", border: "none", boxShadow: "none" }}>
                            <img src={dlhLogo} alt="Logo DLH Padang" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                    </div>
                    <span className="pmb-bank-name" style={{ textAlign: "center" }}>{DLH.nama}</span>
                </div>

                <div className="pmb-card-right">
                    <div className="pmb-chips-row">
                        <span className="pmb-chip pmb-chip--jenis">{DLH.provinsi}</span>
                        <span className="pmb-chip pmb-chip--induk">
                            <FaLocationDot />
                            {DLH.kota}
                        </span>
                    </div>
                    <p className="pmb-desc">{DLH.deskripsi}</p>
                    <hr style={{ border: "none", borderTop: "1px solid rgba(78,167,113,0.2)", margin: "0 0 12px" }} />
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "7px", color: "#4EA771", fontSize: "12px" }}>
                        <FaLocationDot style={{ marginTop: "2px", flexShrink: 0 }} />
                        <span>{DLH.alamat}</span>
                    </div>
                </div>
            </div>

            {/* ── Tabel Superadmin ── */}
            <div className="nasabah-tab-content">
                <div className="bsu-table-section">
                    <div className="nasabah-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", marginTop:"15px" }}>
                        <div style={{marginLeft:"10px"}}>
                            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#0f1f15" }}>Daftar Superadmin</p>
                            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#7a9e8a" }}>{list.length} superadmin terdaftar</p>
                        </div>
                        <Button icon={<FaUserPlus />} color="secondary" variant="solid" isRounded onClick={() => setShowAdd(true)}>
                            Tambah Superadmin
                        </Button>
                    </div>

                    <Table
                        columns={columns}
                        data={list}
                        rowKey={(row) => row.admin_id}
                        emptyMessage={loading ? "Memuat data..." : "Belum ada superadmin terdaftar."}
                    />
                </div>
            </div>

            {/* ── Modal Tambah Superadmin ── */}
            {showAdd && (
                <div className="regis-modal-overlay" onClick={() => setShowAdd(false)}>
                    <div className="regis-modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
                        <div className="regis-modal-header">
                            <div>
                                <h3 className="regis-modal-title">Tambah Superadmin</h3>
                                <p className="regis-modal-subtitle">OTP aktivasi akan dikirim otomatis ke email superadmin baru.</p>
                            </div>
                            <CloseButton onClick={() => setShowAdd(false)} />
                        </div>

                        <form onSubmit={handleAdd}>
                            <div className="regis-modal-body">
                                <div className="regis-form-group">
                                    <label className="regis-label">NIK <span className="required">*</span></label>
                                    <Input
                                        className="regis-input-neutral"
                                        variant="solid"
                                        inputSize="large"
                                        fullWidth
                                        placeholder="16 digit NIK"
                                        maxLength={16}
                                        value={form.user_id}
                                        onChange={(e) => setForm(f => ({ ...f, user_id: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="regis-form-group">
                                    <label className="regis-label">Nama Lengkap <span className="required">*</span></label>
                                    <Input
                                        className="regis-input-neutral"
                                        variant="solid"
                                        inputSize="large"
                                        fullWidth
                                        placeholder="Nama lengkap"
                                        value={form.nama}
                                        onChange={(e) => setForm(f => ({ ...f, nama: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="regis-form-group">
                                    <label className="regis-label">Email <span className="required">*</span></label>
                                    <Input
                                        type="email"
                                        className="regis-input-neutral"
                                        variant="solid"
                                        inputSize="large"
                                        fullWidth
                                        placeholder="contoh@email.com"
                                        value={form.email}
                                        onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="regis-form-group" style={{ marginBottom: 0 }}>
                                    <label className="regis-label">No. WhatsApp <span className="required">*</span></label>
                                    <Input
                                        type="tel"
                                        className="regis-input-neutral"
                                        variant="solid"
                                        inputSize="large"
                                        fullWidth
                                        placeholder="08xxxxxxxxxx"
                                        value={form.no_whatsapp}
                                        onChange={(e) => setForm(f => ({ ...f, no_whatsapp: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="regis-modal-footer">
                                <Button type="button" color="primary" variant="outline" onClick={() => setShowAdd(false)} disabled={submitting}>
                                    Batal
                                </Button>
                                <Button type="submit" color="primary" variant="solid" disabled={submitting}>
                                    {submitting ? "Menyimpan..." : "Tambah Superadmin"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
