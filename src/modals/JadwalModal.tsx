import { useState, useEffect } from "react";
import { FaXmark } from "react-icons/fa6";
import Input from "../components/input";
import Button from "../components/button";
import Dropdown from "../components/dropdown";
import "../styles/jadwal-bsu.css";

const HARI_OPTIONS = [
    { label: "Senin",  value: "Senin" },
    { label: "Selasa", value: "Selasa" },
    { label: "Rabu",   value: "Rabu" },
    { label: "Kamis",  value: "Kamis" },
    { label: "Jumat",  value: "Jumat" },
    { label: "Sabtu",  value: "Sabtu" },
    { label: "Minggu", value: "Minggu" },
];

const MINGGU_OPTIONS = [
    { label: "Setiap minggu", value: "0" },
    { label: "Minggu ke-1",   value: "1" },
    { label: "Minggu ke-2",   value: "2" },
    { label: "Minggu ke-3",   value: "3" },
    { label: "Minggu ke-4",   value: "4" },
];

export interface JadwalFormData {
    id?: string;
    hari: string;
    jamMulai: string;
    jamSelesai: string;
    mingguKe: number;
    keterangan: string;
    isInsidental: boolean;
    tanggal?: string;
    bankId: string;
}

interface JadwalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: JadwalFormData) => void;
    initialData?: Partial<JadwalFormData> | null;
    bankId: string;
}

export default function JadwalModal({ isOpen, onClose, onSuccess, initialData, bankId }: JadwalModalProps) {
    const isEdit = !!initialData?.id;

    const [isInsidental, setIsInsidental] = useState(false);
    const [form, setForm] = useState<Omit<JadwalFormData, "bankId">>({
        hari: "Senin",
        jamMulai: "08:00",
        jamSelesai: "10:00",
        mingguKe: 0,
        keterangan: "",
        isInsidental: false,
        tanggal: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setIsInsidental(initialData.isInsidental ?? false);
            setForm({
                id: initialData.id,
                hari: initialData.hari || "Senin",
                jamMulai: initialData.jamMulai || "08:00",
                jamSelesai: initialData.jamSelesai || "10:00",
                mingguKe: initialData.mingguKe ?? 0,
                keterangan: initialData.keterangan || "",
                isInsidental: initialData.isInsidental ?? false,
                tanggal: initialData.tanggal || "",
            });
        } else {
            setIsInsidental(false);
            setForm({ hari: "Senin", jamMulai: "08:00", jamSelesai: "10:00", mingguKe: 0, keterangan: "", isInsidental: false, tanggal: "" });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (field: string, value: string | number | boolean) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload: JadwalFormData = { ...form, isInsidental, bankId };
            await new Promise(r => setTimeout(r, 400)); // mock API call
            onSuccess(payload);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="jmodal-overlay" onClick={onClose}>
            <div className="jmodal-box" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="jmodal-header">
                    <div>
                        <h2 className="jmodal-title">{isEdit ? "Ubah Jadwal" : "Tambah Jadwal Penimbangan"}</h2>
                        <p className="jmodal-sub">{isEdit ? "Edit detail jadwal yang sudah ada" : "Buat jadwal penimbangan rutin atau insidental"}</p>
                    </div>
                    <button className="jmodal-close" onClick={onClose}><FaXmark /></button>
                </div>

                {/* Toggle Rutin / Insidental */}
                <div className="jmodal-type-toggle">
                    <button
                        type="button"
                        className={`jmodal-type-btn ${!isInsidental ? "active" : ""}`}
                        onClick={() => setIsInsidental(false)}
                    >Rutin</button>
                    <button
                        type="button"
                        className={`jmodal-type-btn ${isInsidental ? "active" : ""}`}
                        onClick={() => setIsInsidental(true)}
                    >Insidental</button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="jmodal-form">
                    {isInsidental ? (
                        <div className="jmodal-field">
                            <label className="jmodal-label">Tanggal</label>
                            <Input
                                type="date"
                                value={form.tanggal || ""}
                                onChange={e => handleChange("tanggal", e.target.value)}
                                required
                            />
                        </div>
                    ) : (
                        <div className="jmodal-row">
                            <div className="jmodal-field">
                                <label className="jmodal-label">Hari</label>
                                <Dropdown
                                    options={HARI_OPTIONS}
                                    value={form.hari}
                                    onChange={e => handleChange("hari", e.target.value)}
                                    fullWidth
                                />
                            </div>
                            <div className="jmodal-field">
                                <label className="jmodal-label">Frekuensi</label>
                                <Dropdown
                                    options={MINGGU_OPTIONS}
                                    value={String(form.mingguKe)}
                                    onChange={e => handleChange("mingguKe", Number(e.target.value))}
                                    fullWidth
                                />
                            </div>
                        </div>
                    )}

                    <div className="jmodal-row">
                        <div className="jmodal-field">
                            <label className="jmodal-label">Jam Mulai</label>
                            <Input
                                type="time"
                                value={form.jamMulai}
                                onChange={e => handleChange("jamMulai", e.target.value)}
                                required
                            />
                        </div>
                        <div className="jmodal-field">
                            <label className="jmodal-label">Jam Selesai</label>
                            <Input
                                type="time"
                                value={form.jamSelesai}
                                onChange={e => handleChange("jamSelesai", e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="jmodal-field">
                        <label className="jmodal-label">Keterangan <span style={{ color: "#94a3b8" }}>(opsional)</span></label>
                        <Input
                            type="text"
                            placeholder="Contoh: khusus plastik, dll."
                            value={form.keterangan}
                            onChange={e => handleChange("keterangan", e.target.value)}
                        />
                    </div>

                    <div className="jmodal-actions">
                        <Button type="button" variant="outline" color="secondary" onClick={onClose}>Batal</Button>
                        <Button type="submit" color="primary" disabled={isSubmitting}>
                            {isSubmitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Jadwal"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
