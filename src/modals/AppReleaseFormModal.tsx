import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { FaCloudArrowUp, FaAndroid, FaTrash } from "react-icons/fa6";
import Input from "../components/input";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import type { AppRelease } from "../types/app_release.type";
import { getApiError } from "../utils/error.utils";
import { formatUkuranFile } from "../utils/number.utils";
import "../styles/manajemen-reward.css";
import "../styles/katalog.css";
import "../styles/reward.css";

const MAX_UKURAN_APK = 200 * 1024 * 1024;
const POLA_VERSION_NAME = /^[0-9A-Za-z._-]{1,20}$/;

export interface AppReleaseFormData {
    apk: File | null;
    version_name: string;
    version_code: number;
    changelog: string;
    wajib: boolean;
}

interface AppReleaseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AppReleaseFormData, onProgress: (persen: number) => void) => Promise<void>;
    initialData?: AppRelease | null;
    versionCodeTerakhir: number;
}

function pesanError(err: unknown): string {
    if (axios.isAxiosError(err) && err.response?.status === 413) {
        return "Ukuran file melebihi batas yang diizinkan server.";
    }
    return getApiError(err, "Terjadi kesalahan. Coba lagi.");
}

export default function AppReleaseFormModal({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    versionCodeTerakhir,
}: AppReleaseFormModalProps) {
    const isEdit = !!initialData;
    const fileRef = useRef<HTMLInputElement>(null);

    const [apk, setApk] = useState<File | null>(null);
    const [versionName, setVersionName] = useState("");
    const [versionCode, setVersionCode] = useState("");
    const [changelog, setChangelog] = useState("");
    const [wajib, setWajib] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setError(null);
        setProgress(0);
        setApk(null);
        if (initialData) {
            setVersionName(initialData.version_name);
            setVersionCode(String(initialData.version_code));
            setChangelog(initialData.changelog);
            setWajib(initialData.is_mandatory);
        } else {
            setVersionName("");
            setVersionCode(String(versionCodeTerakhir + 1));
            setChangelog("");
            setWajib(false);
        }
    }, [isOpen, initialData, versionCodeTerakhir]);

    if (!isOpen) return null;

    const tutup = () => {
        if (!isSubmitting) onClose();
    };

    const pilihFile = (file: File) => {
        setError(null);
        if (!file.name.toLowerCase().endsWith(".apk")) {
            setError("File harus berekstensi .apk");
            return;
        }
        if (file.size > MAX_UKURAN_APK) {
            setError(`Ukuran APK maksimal ${formatUkuranFile(MAX_UKURAN_APK)}.`);
            return;
        }
        setApk(file);
    };

    const validasi = (): string | null => {
        if (isEdit) return null;
        if (!apk) return "Pilih file APK terlebih dahulu.";
        if (!POLA_VERSION_NAME.test(versionName.trim())) {
            return "Nama versi wajib diisi (maks 20 karakter, hanya angka, huruf, titik, - dan _).";
        }
        const kode = Number(versionCode);
        if (!Number.isInteger(kode) || kode <= 0) return "Kode versi harus berupa angka lebih dari 0.";
        if (kode <= versionCodeTerakhir) {
            return `Kode versi harus lebih besar dari versi terakhir (${versionCodeTerakhir}).`;
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const pesanValidasi = validasi();
        if (pesanValidasi) {
            setError(pesanValidasi);
            return;
        }
        setError(null);
        setProgress(0);
        setIsSubmitting(true);
        try {
            await onSubmit(
                {
                    apk,
                    version_name: versionName.trim(),
                    version_code: Number(versionCode),
                    changelog: changelog.trim(),
                    wajib,
                },
                setProgress,
            );
        } catch (err) {
            setError(pesanError(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    const labelSubmit = isSubmitting
        ? isEdit ? "Menyimpan..." : `Mengunggah... ${progress}%`
        : isEdit ? "Simpan Perubahan" : "Upload";

    return createPortal(
        <div className="mr-modal-overlay" onClick={tutup}>
            <div className="mr-modal-box mr-modal-box--form" onClick={e => e.stopPropagation()}>
                <div className="mr-modal-header">
                    <div>
                        <h3 className="mr-modal-title">{isEdit ? "Edit Rilis" : "Upload Versi Baru"}</h3>
                        <p className="mr-modal-sub">
                            {isEdit ? "Perbarui changelog dan status wajib update" : "Unggah APK yang akan ditawarkan ke pengguna"}
                        </p>
                    </div>
                    <CloseButton onClick={tutup} disabled={isSubmitting} />
                </div>
                <form className="mr-modal-form" onSubmit={handleSubmit} style={{ overflowY: "auto" }}>
                    {error && <div className="mr-form-error">{error}</div>}

                    {!isEdit && (
                        <div className="mr-form-field">
                            <label className="mr-form-label">
                                File APK <span style={{ color: "var(--c-danger)" }}>*</span>
                            </label>
                            <div
                                className={`km-file-area ${apk ? "has-file" : ""}`}
                                onClick={() => !apk && !isSubmitting && fileRef.current?.click()}
                                style={{ minHeight: apk ? "auto" : "120px" }}
                            >
                                {apk ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "14px 16px", border: "1px solid var(--c-border-soft)", borderRadius: "16px" }}>
                                        <div className="mr-card-icon mr-card-icon--uang"><FaAndroid /></div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {apk.name}
                                            </div>
                                            <div className="mr-form-hint">{formatUkuranFile(apk.size)}</div>
                                        </div>
                                        {!isSubmitting && (
                                            <button
                                                type="button"
                                                className="km-btn-remove"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setApk(null);
                                                    if (fileRef.current) fileRef.current.value = "";
                                                }}
                                            >
                                                <FaTrash /> Hapus
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="km-upload-prompt">
                                        <div className="km-upload-icon"><FaCloudArrowUp /></div>
                                        <div className="km-upload-text">Klik untuk pilih file APK</div>
                                        <div className="km-upload-hint">APK · Maks 200MB</div>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept=".apk,application/vnd.android.package-archive"
                                    ref={fileRef}
                                    onChange={(e) => { if (e.target.files?.[0]) pilihFile(e.target.files[0]); }}
                                    style={{ display: "none" }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="mr-form-row">
                        <div className="mr-form-field">
                            <label className="mr-form-label">
                                Nama Versi {!isEdit && <span style={{ color: "var(--c-danger)" }}>*</span>}
                            </label>
                            <Input
                                type="text"
                                placeholder="Contoh: 1.0.2"
                                value={versionName}
                                onChange={e => setVersionName(e.target.value)}
                                disabled={isEdit || isSubmitting}
                                required={!isEdit}
                                fullWidth
                                className="mr-input-override"
                            />
                        </div>
                        <div className="mr-form-field">
                            <label className="mr-form-label">
                                Kode Versi {!isEdit && <span style={{ color: "var(--c-danger)" }}>*</span>}
                            </label>
                            <Input
                                type="number"
                                min={1}
                                placeholder="Contoh: 3"
                                value={versionCode}
                                onChange={e => setVersionCode(e.target.value)}
                                disabled={isEdit || isSubmitting}
                                required={!isEdit}
                                fullWidth
                                className="mr-input-override"
                            />
                        </div>
                    </div>
                    {!isEdit && (
                        <span className="mr-form-hint" style={{ marginTop: "-8px" }}>
                            Kode versi harus sama dengan angka setelah tanda + di pubspec.yaml (mis. 1.0.2+<b>3</b>).
                        </span>
                    )}

                    <div className="mr-form-field">
                        <label className="mr-form-label">Changelog</label>
                        <textarea
                            className="rw-modal-textarea"
                            placeholder="Apa saja yang baru di versi ini..."
                            value={changelog}
                            onChange={e => setChangelog(e.target.value)}
                            rows={4}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="mr-form-field">
                        <label className="mr-form-label">Wajib Update</label>
                        <label className="mr-toggle">
                            <input
                                type="checkbox"
                                checked={wajib}
                                onChange={e => setWajib(e.target.checked)}
                                disabled={isSubmitting}
                            />
                            <span className="mr-toggle-track"><span className="mr-toggle-thumb" /></span>
                            <span className="mr-toggle-text">{wajib ? "Wajib" : "Opsional"}</span>
                        </label>
                        <span className="mr-form-hint">
                            Jika wajib, pengguna tidak bisa memakai aplikasi sebelum memasang versi ini.
                        </span>
                    </div>

                    <div className="mr-modal-actions">
                        <Button type="button" variant="outline" color="primary" onClick={tutup} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button type="submit" color="primary" disabled={isSubmitting}>
                            {labelSubmit}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
