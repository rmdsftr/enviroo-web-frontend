import { useState, useEffect } from "react";
import { UsersService } from "../services/users.service";
import { AdminService } from "../services/admin.service";
import type { NonAdminUser } from "../types/users.type";
import { FaUserShield, FaUserPlus } from "react-icons/fa6";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import Input from "../components/input";
import Dropdown from "../components/dropdown";
import SearchBar from "../components/search";
import { getRoleOptions } from "../constants/profil-my-bank.constants";

interface Props {
    bankId: string;
    adminId: string;
    userRole: string;
    onStaffAdded: () => Promise<void>;
    onClose: () => void;
    onSuccess: (msg: string) => void;
    onError: (msg: string) => void;
}

export function TambahAdminModal({ bankId, adminId, userRole, onStaffAdded, onClose, onSuccess, onError }: Props) {
    const [isAddingNewUser, setIsAddingNewUser] = useState(false);
    const [nonAdminUsers, setNonAdminUsers] = useState<NonAdminUser[]>([]);
    const [searchUser, setSearchUser] = useState("");
    const [selectedUserId, setSelectedUserId] = useState("");
    const [selectedRole, setSelectedRole] = useState("");
    const [newUserForm, setNewUserForm] = useState({ nik: "", nama: "", email: "", noWa: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        UsersService.getNonAdminUsers()
            .then((res) => setNonAdminUsers(res.data || []))
            .catch((err) => console.error("Gagal memuat daftar user:", err));
    }, []);

    const roleOptions = getRoleOptions(userRole);
    const filteredUsers = nonAdminUsers.filter((u) =>
        u.Nama.toLowerCase().includes(searchUser.toLowerCase()) ||
        u.Email.toLowerCase().includes(searchUser.toLowerCase())
    );

    const handleTambahAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId) { onError("Pilih satu akun terlebih dahulu."); return; }
        if (!selectedRole)   { onError("Pilih role terlebih dahulu."); return; }
        setIsSubmitting(true);
        try {
            await AdminService.addAdmin(bankId, selectedUserId, selectedRole, adminId);
            await onStaffAdded();
            onSuccess("Admin berhasil ditambahkan!");
            onClose();
        } catch (err: any) {
            onError(err?.response?.data?.error ?? "Gagal menambahkan admin. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveNewUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await UsersService.createUsers({
                user_id: newUserForm.nik,
                nama: newUserForm.nama,
                email: newUserForm.email,
                no_whatsapp: newUserForm.noWa,
            });
            const res = await UsersService.getNonAdminUsers();
            setNonAdminUsers(res.data || []);
            setIsAddingNewUser(false);
            setNewUserForm({ nik: "", nama: "", email: "", noWa: "" });
            onSuccess("Berhasil menambahkan akun baru!");
        } catch (err: any) {
            onError(err?.response?.data?.error ?? "Gagal menambahkan akun baru. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="regis-modal-overlay" onClick={onClose}>
            <div
                className="regis-modal"
                style={{ maxWidth: isAddingNewUser ? 540 : 860, maxHeight: "90vh", display: "flex", flexDirection: "column" }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="regis-modal-header" style={{ flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="regis-section-icon icon-admin" style={{ width: 36, height: 36, fontSize: 16 }}>
                            <FaUserShield />
                        </div>
                        <div>
                            <h3 className="regis-modal-title">
                                {isAddingNewUser ? "Tambahkan Akun Baru" : "Tambah Staff"}
                            </h3>
                            <p className="regis-modal-subtitle">
                                {isAddingNewUser
                                    ? "Tambahkan akun pengguna baru ke sistem"
                                    : "Pilih akun dan tentukan role untuk bank sampah ini"}
                            </p>
                        </div>
                    </div>
                    <CloseButton onClick={() => {
                        if (isAddingNewUser) setIsAddingNewUser(false);
                        else onClose();
                    }} />
                </div>

                {!isAddingNewUser ? (
                    <form onSubmit={handleTambahAdmin} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <div
                            className="regis-modal-body"
                            style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24, padding: "24px", overflowY: "auto", flex: 1 }}
                        >
                            {/* Kiri: Daftar Akun */}
                            <div className="regis-form-group" style={{ marginBottom: 0 }}>
                                <label className="regis-label">Pilih Akun <span className="required">*</span></label>
                                <p style={{ fontSize: 12, color: "#888", marginBottom: 12, marginTop: 0 }}>
                                    Pilih satu akun untuk dijadikan admin atau petugas
                                </p>
                                <div style={{ marginBottom: 10 }}>
                                    <SearchBar placeholder="Cari nama atau email..." value={searchUser} onChange={setSearchUser} width="100%" />
                                </div>
                                <div className="regis-admin-table-wrapper" style={{ maxHeight: 340, overflowY: "auto" }}>
                                    <table className="regis-admin-table">
                                        <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                                            <tr>
                                                <th style={{ width: 44, textAlign: "center" }}></th>
                                                <th style={{ width: 48, textAlign: "center" }}>Foto</th>
                                                <th>Nama & Email</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} style={{ textAlign: "center", padding: "24px", color: "#aaa", fontSize: 13 }}>
                                                        Tidak ada akun yang tersedia
                                                    </td>
                                                </tr>
                                            ) : filteredUsers.map((u) => {
                                                const isSelected = selectedUserId === u.UserID;
                                                return (
                                                    <tr
                                                        key={u.UserID}
                                                        className={isSelected ? "selected" : ""}
                                                        onClick={() => setSelectedUserId(u.UserID)}
                                                        style={{ cursor: "pointer" }}
                                                    >
                                                        <td style={{ textAlign: "center" }}>
                                                            <label className="regis-checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
                                                                <input
                                                                    type="radio"
                                                                    name="tambah-admin-user"
                                                                    checked={isSelected}
                                                                    onChange={() => setSelectedUserId(u.UserID)}
                                                                    style={{ accentColor: "#013236" }}
                                                                />
                                                            </label>
                                                        </td>
                                                        <td style={{ textAlign: "center" }}>
                                                            <div className="regis-admin-avatar">
                                                                {u.PhotoURL
                                                                    ? <img src={u.PhotoURL} alt={u.Nama} />
                                                                    : <span>{u.Nama.charAt(0).toUpperCase()}</span>
                                                                }
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: "flex", flexDirection: "column" }}>
                                                                <span className="regis-admin-name">{u.Nama}</span>
                                                                <span className="regis-admin-email" style={{ fontSize: 11, color: "#888" }}>{u.Email}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Kanan: Role */}
                            <div className="regis-form-group" style={{ marginBottom: 0 }}>
                                <label className="regis-label" htmlFor="tambah-admin-role">
                                    Role <span className="required">*</span>
                                </label>
                                <p style={{ fontSize: 12, color: "#888", marginBottom: 12, marginTop: 0 }}>
                                    Tentukan posisi jabatan untuk pengguna terpilih
                                </p>
                                <Dropdown
                                    options={roleOptions}
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    placeholder="Pilih Role Jabatan"
                                    dropdownSize="large"
                                    fullWidth
                                />
                                {selectedUserId && selectedRole && (
                                    <div style={{ marginTop: 24, padding: "16px", background: "#f0f5f2", borderRadius: "12px", border: "1px solid #c1d9c9" }}>
                                        <div style={{ fontSize: 12, color: "#5a7a68", marginBottom: 4 }}>Ringkasan Pilihan:</div>
                                        <div style={{ fontSize: 12, color: "#013236", fontWeight: 600 }}>
                                            {nonAdminUsers.find((u) => u.UserID === selectedUserId)?.Nama ?? "Seseorang"}
                                        </div>
                                        <div style={{ fontSize: 12, color: "#3d5a48" }}>
                                            akan ditunjuk sebagai <strong>{roleOptions.find((r) => r.value === selectedRole)?.label ?? "Role"}</strong>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="regis-modal-footer" style={{ flexShrink: 0, justifyContent: "space-between" }}>
                            <Button
                                type="button" color="primary" variant="ghost" size="default" isRounded icon={<FaUserPlus />}
                                onClick={() => setIsAddingNewUser(true)}
                            >
                                Tambahkan Akun Baru
                            </Button>
                            <div style={{ display: "flex", gap: "12px" }}>
                                <Button type="button" color="primary" variant="outline" size="default" onClick={onClose} disabled={isSubmitting}>
                                    Batal
                                </Button>
                                <Button type="submit" color="primary" variant="solid" size="default" disabled={isSubmitting}>
                                    {isSubmitting ? "Menyimpan..." : "Simpan Staff"}
                                </Button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleSaveNewUser} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <div className="regis-modal-body" style={{ overflowY: "auto", flex: 1 }}>
                            <div className="regis-form-group">
                                <label className="regis-label" htmlFor="new-admin-nik">NIK <span className="required">*</span></label>
                                <Input
                                    id="new-admin-nik" className="regis-input-neutral"
                                    variant="solid" inputSize="large" fullWidth
                                    placeholder="Masukkan 16 digit NIK"
                                    value={newUserForm.nik}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, nik: e.target.value })}
                                    required maxLength={16}
                                />
                            </div>
                            <div className="regis-form-group">
                                <label className="regis-label" htmlFor="new-admin-nama">Nama Lengkap <span className="required">*</span></label>
                                <Input
                                    id="new-admin-nama" className="regis-input-neutral"
                                    variant="solid" inputSize="large" fullWidth
                                    placeholder="Masukkan nama lengkap"
                                    value={newUserForm.nama}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, nama: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="regis-form-group">
                                <label className="regis-label" htmlFor="new-admin-email">Email <span className="required">*</span></label>
                                <Input
                                    id="new-admin-email" type="email" className="regis-input-neutral"
                                    variant="solid" inputSize="large" fullWidth
                                    placeholder="contoh@email.com"
                                    value={newUserForm.email}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="regis-form-group">
                                <label className="regis-label" htmlFor="new-admin-nowa">No. WhatsApp <span className="required">*</span></label>
                                <Input
                                    id="new-admin-nowa" type="tel" className="regis-input-neutral"
                                    variant="solid" inputSize="large" fullWidth
                                    placeholder="081234567890"
                                    value={newUserForm.noWa}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, noWa: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="regis-modal-footer" style={{ flexShrink: 0 }}>
                            <Button type="button" color="primary" variant="outline" size="default" onClick={() => setIsAddingNewUser(false)}>
                                Kembali
                            </Button>
                            <Button type="submit" color="primary" variant="solid" size="default" disabled={isSubmitting}>
                                {isSubmitting ? "Menyimpan..." : "Simpan Akun"}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
