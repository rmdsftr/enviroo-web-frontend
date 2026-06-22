import { useState } from "react";
import { UsersService } from "../services/users.service";
import { getApiError } from "../utils/error.utils";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import Input from "../components/input";

interface Props {
    onUserCreated: () => Promise<void>;
    onClose: () => void;
    onSuccess: (msg: string) => void;
    onError: (msg: string) => void;
}

export function DaftarkanAdminBaruModal({ onUserCreated, onClose, onSuccess, onError }: Props) {
    const [form, setForm] = useState({ nik: "", nama: "", email: "", noWa: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await UsersService.createUsers({
                user_id: form.nik,
                nama: form.nama,
                email: form.email,
                no_whatsapp: form.noWa,
            });
            await onUserCreated();
            onSuccess("Berhasil mendaftarkan admin baru!");
            onClose();
        } catch (error) {
            onError(getApiError(error, "Gagal mendaftarkan admin baru. Silakan coba lagi."));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="regis-modal-overlay">
            <div className="regis-modal">
                <div className="regis-modal-header">
                    <div>
                        <h3 className="regis-modal-title">Daftarkan Admin Baru</h3>
                        <p className="regis-modal-subtitle">Tambahkan user baru untuk dijadikan admin</p>
                    </div>
                    <CloseButton onClick={onClose} />
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="regis-modal-body">
                        <div className="regis-form-group">
                            <label className="regis-label" htmlFor="new-admin-nik">NIK <span className="required">*</span></label>
                            <Input
                                id="new-admin-nik" className="regis-input-neutral"
                                variant="solid" inputSize="large" fullWidth
                                placeholder="Masukkan 16 digit NIK"
                                value={form.nik}
                                onChange={(e) => setForm({ ...form, nik: e.target.value })}
                                required maxLength={16}
                            />
                        </div>
                        <div className="regis-form-group">
                            <label className="regis-label" htmlFor="new-admin-nama">Nama Lengkap <span className="required">*</span></label>
                            <Input
                                id="new-admin-nama" className="regis-input-neutral"
                                variant="solid" inputSize="large" fullWidth
                                placeholder="Masukkan nama lengkap"
                                value={form.nama}
                                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                                required
                            />
                        </div>
                        <div className="regis-form-group">
                            <label className="regis-label" htmlFor="new-admin-email">Email <span className="required">*</span></label>
                            <Input
                                id="new-admin-email" type="email" className="regis-input-neutral"
                                variant="solid" inputSize="large" fullWidth
                                placeholder="contoh@email.com"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="regis-form-group">
                            <label className="regis-label" htmlFor="new-admin-nowa">No. WhatsApp <span className="required">*</span></label>
                            <Input
                                id="new-admin-nowa" type="tel" className="regis-input-neutral"
                                variant="solid" inputSize="large" fullWidth
                                placeholder="081234567890"
                                value={form.noWa}
                                onChange={(e) => setForm({ ...form, noWa: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="regis-modal-footer">
                        <Button type="button" color="primary" variant="outline" size="default" onClick={onClose} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button type="submit" color="primary" variant="solid" size="default" disabled={isSubmitting}>
                            {isSubmitting ? "Menyimpan..." : "Simpan & Tambahkan"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
