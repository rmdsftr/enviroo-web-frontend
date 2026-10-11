import { useState } from "react";
import { createPortal } from "react-dom";
import { FaPlus, FaCalendarCheck, FaCalendarPlus } from "react-icons/fa6";
import Button from "../components/button";
import Dropdown from "../components/dropdown";
import Input from "../components/input";
import CloseButton from "../components/close-button";
import JadwalBatchFields from "../components/JadwalBatchFields";
import { HARI_OPTIONS, MINGGU_OPTIONS } from "../constants/jadwal.constants";
import type { JadwalEditSeed, JadwalFormValue } from "../types/jadwal.type";
import { formatTime } from "../utils/date.utils";
import "../styles/jadwal-bsu.css";

interface Props {
    initialSeed?: JadwalEditSeed | null;
    isSubmitting: boolean;
    onSubmit: (value: JadwalFormValue) => void;
    onClose: () => void;
}

export function JadwalPenimbanganFormModal({ initialSeed, isSubmitting, onSubmit, onClose }: Props) {
    const isEdit = !!initialSeed;

    const [formType,        setFormType]        = useState<"rutin" | "spesial">(initialSeed && !initialSeed.is_rutin ? "spesial" : "rutin");
    const [formHari,        setFormHari]        = useState(initialSeed?.hari ?? "");
    const [formMingguKe,    setFormMingguKe]    = useState(initialSeed ? String(initialSeed.minggu_ke) : "");
    const [formTanggal,     setFormTanggal]     = useState(initialSeed?.tanggal ? initialSeed.tanggal.split("T")[0] : "");
    const [formNamaSpesial, setFormNamaSpesial] = useState(initialSeed?.nama_jadwal_spesial ?? "");
    const [formJamMulai,    setFormJamMulai]    = useState(initialSeed ? formatTime(initialSeed.jam_mulai) : "");
    const [formJamSelesai,  setFormJamSelesai]  = useState(initialSeed ? formatTime(initialSeed.jam_selesai) : "");
    const [formIsActive,    setFormIsActive]    = useState(initialSeed?.is_active ?? true);
    const [formError,       setFormError]       = useState("");

    const [formHariList,   setFormHariList]   = useState<string[]>([]);
    const [formMingguList, setFormMingguList] = useState<string[]>([]);

    const handleSubmit = () => {
        if (!formJamMulai || !formJamSelesai) { setFormError("Jam mulai dan jam selesai wajib diisi"); return; }

        if (isEdit || formType === "spesial") {
            if (formType === "rutin") {
                if (!formHari)     { setFormError("Hari wajib dipilih"); return; }
                if (!formMingguKe) { setFormError("Minggu ke wajib dipilih"); return; }
            } else {
                if (!formTanggal)            { setFormError("Tanggal wajib diisi"); return; }
                if (!formNamaSpesial.trim()) { setFormError("Nama jadwal spesial wajib diisi"); return; }
            }
        }

        setFormError("");
        onSubmit({
            type: formType,
            hari: formHari, mingguKe: formMingguKe,
            tanggal: formTanggal, namaSpesial: formNamaSpesial.trim(),
            jamMulai: formJamMulai, jamSelesai: formJamSelesai,
            isActive: formIsActive,
            hariList: formHariList, mingguList: formMingguList,
        });
    };

    return createPortal(
        <div className="jmodal-overlay" onClick={onClose}>
            <div className="jmodal-box" onClick={e => e.stopPropagation()}>
                <div className="jmodal-header">
                    <div>
                        <h2 className="jmodal-title">{isEdit ? "Edit" : "Tambah"} Jadwal Penimbangan</h2>
                        <p className="jmodal-sub">{isEdit ? "Perbarui informasi jadwal" : "Tambahkan jadwal rutin atau spesial"}</p>
                    </div>
                    <CloseButton onClick={onClose} />
                </div>
                <div className="jmodal-type-toggle" style={{ opacity: isEdit ? 0.6 : 1 }}>
                    <button className={`jmodal-type-btn ${formType === "rutin" ? "active" : ""}`}
                        onClick={() => { if (!isEdit) { setFormType("rutin"); setFormError(""); } }}
                        disabled={isEdit} style={{ cursor: isEdit ? "not-allowed" : "pointer" }}>
                        <FaCalendarCheck style={{ marginRight: 6 }} /> Jadwal Rutin
                    </button>
                    <button className={`jmodal-type-btn ${formType === "spesial" ? "active" : ""}`}
                        onClick={() => { if (!isEdit) { setFormType("spesial"); setFormError(""); } }}
                        disabled={isEdit} style={{ cursor: isEdit ? "not-allowed" : "pointer" }}>
                        <FaCalendarPlus style={{ marginRight: 6 }} /> Jadwal Spesial
                    </button>
                </div>
                <div className="jmodal-form">
                    {formType === "rutin" ? (
                        isEdit ? (
                            <>
                                <div className="jmodal-field">
                                    <label className="jmodal-label">Hari Penimbangan</label>
                                    <Dropdown options={HARI_OPTIONS} placeholder="Pilih hari..." value={formHari} onChange={e => setFormHari(e.target.value)} fullWidth />
                                </div>
                                <div className="jmodal-field">
                                    <label className="jmodal-label">Minggu ke</label>
                                    <Dropdown options={MINGGU_OPTIONS} placeholder="Pilih minggu..." value={formMingguKe} onChange={e => setFormMingguKe(e.target.value)} fullWidth />
                                </div>
                            </>
                        ) : (
                            <JadwalBatchFields
                                hariLabel="Hari Penimbangan"
                                hariList={formHariList} setHariList={setFormHariList}
                                mingguList={formMingguList} setMingguList={setFormMingguList}
                            />
                        )
                    ) : (
                        <>
                            <div className="jmodal-field">
                                <label className="jmodal-label">Tanggal</label>
                                <Input type="date" value={formTanggal} onChange={e => setFormTanggal(e.target.value)} fullWidth />
                            </div>
                            <div className="jmodal-field">
                                <label className="jmodal-label">Nama Jadwal Spesial</label>
                                <Input type="text" placeholder="Contoh: Penimbangan Hari Bumi" value={formNamaSpesial} onChange={e => setFormNamaSpesial(e.target.value)} fullWidth />
                            </div>
                        </>
                    )}
                    <div className="jmodal-row">
                        <div className="jmodal-field">
                            <label className="jmodal-label">Jam Mulai</label>
                            <Input type="time" value={formJamMulai} onChange={e => setFormJamMulai(e.target.value)} fullWidth />
                        </div>
                        <div className="jmodal-field">
                            <label className="jmodal-label">Jam Selesai</label>
                            <Input type="time" value={formJamSelesai} onChange={e => setFormJamSelesai(e.target.value)} fullWidth />
                        </div>
                    </div>
                    {isEdit && (
                        <div className="jmodal-field">
                            <label className="jmodal-label">Status Jadwal</label>
                            <label className="jm-toggle">
                                <input
                                    type="checkbox"
                                    checked={formIsActive}
                                    onChange={e => setFormIsActive(e.target.checked)}
                                />
                                <span className="jm-toggle-track"><span className="jm-toggle-thumb" /></span>
                                <span className="jm-toggle-text">{formIsActive ? "Aktif" : "Nonaktif"}</span>
                            </label>
                        </div>
                    )}
                    {formError && <p className="jmodal-error">{formError}</p>}
                    <div className="jmodal-actions">
                        <Button variant="ghost" color="primary" isRounded onClick={onClose} disabled={isSubmitting}>Batal</Button>
                        <Button variant="solid" color="primary" isRounded icon={<FaPlus />} onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? "Menyimpan..." : "Simpan Jadwal"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
