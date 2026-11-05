import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { QRCodeCanvas } from "qrcode.react";
import { FaCopy, FaDownload, FaMobileScreenButton, FaCheck } from "react-icons/fa6";
import Input from "../components/input";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import { AppReleaseService, LINK_INSTALL_APK } from "../services/app_release.service";
import type { VersiTerbaru } from "../types/app_release.type";
import { formatTanggalPanjang } from "../utils/date.utils";
import { formatUkuranFile } from "../utils/number.utils";
import "../styles/manajemen-reward.css";

interface AplikasiMobileModalProps {
    onClose: () => void;
}

const WARNA_QR = "#013236";

/** Di-mount hanya saat dibuka, jadi state selalu mulai bersih tiap modal dibuka. */
export default function AplikasiMobileModal({ onClose }: AplikasiMobileModalProps) {
    const [versi, setVersi] = useState<VersiTerbaru | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tersalin, setTersalin] = useState(false);
    const qrCetakRef = useRef<HTMLCanvasElement>(null);
    const timerTersalin = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        let batal = false;
        AppReleaseService.getVersiTerbaru()
            .then(res => { if (!batal) setVersi(res.data ?? null); })
            .catch(() => { if (!batal) setError("Gagal memuat versi aplikasi. Coba lagi nanti."); })
            .finally(() => { if (!batal) setIsLoading(false); });
        return () => { batal = true; };
    }, []);

    useEffect(() => () => {
        if (timerTersalin.current) clearTimeout(timerTersalin.current);
    }, []);

    const salinLink = async () => {
        try {
            await navigator.clipboard.writeText(LINK_INSTALL_APK);
            setTersalin(true);
            if (timerTersalin.current) clearTimeout(timerTersalin.current);
            timerTersalin.current = setTimeout(() => setTersalin(false), 2000);
        } catch {
            setError("Gagal menyalin link. Salin manual dari kolom di atas.");
        }
    };

    const unduhQR = () => {
        const canvas = qrCetakRef.current;
        if (!canvas) return;
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.download = "qr-install-enviroo.png";
        a.click();
    };

    return createPortal(
        <div className="mr-modal-overlay" onClick={onClose}>
            <div className="mr-modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: "440px" }}>
                <div className="mr-modal-header">
                    <div>
                        <h3 className="mr-modal-title">Aplikasi Mobile Enviroo</h3>
                        <p className="mr-modal-sub">Bagikan ke nasabah dan petugas untuk memasang aplikasi</p>
                    </div>
                    <CloseButton onClick={onClose} />
                </div>

                <div className="mr-modal-form" style={{ overflowY: "auto" }}>
                    {error && <div className="mr-form-error">{error}</div>}

                    {isLoading ? (
                        <p className="mr-modal-sub" style={{ textAlign: "center", padding: "24px 0" }}>
                            Memuat versi terbaru...
                        </p>
                    ) : !versi ? (
                        !error && (
                            <div className="mr-empty">
                                <div className="mr-empty-icon"><FaMobileScreenButton /></div>
                                <h3>Aplikasi Belum Tersedia</h3>
                                <p>Belum ada versi aplikasi yang diunggah. Hubungi superadmin DLH untuk merilis aplikasi.</p>
                            </div>
                        )
                    ) : (
                        <>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                                <div style={{ padding: "12px", background: "#fff", border: "1px solid var(--c-border-soft)", borderRadius: "16px" }}>
                                    <QRCodeCanvas value={LINK_INSTALL_APK} size={200} marginSize={1} fgColor={WARNA_QR} />
                                </div>
                                <span className="mr-form-hint" style={{ textAlign: "center" }}>
                                    Scan dengan kamera HP Android untuk mengunduh aplikasi
                                </span>
                            </div>

                            {/* Versi resolusi tinggi untuk diunduh & dicetak. */}
                            <QRCodeCanvas
                                ref={qrCetakRef}
                                value={LINK_INSTALL_APK}
                                size={1024}
                                marginSize={4}
                                fgColor={WARNA_QR}
                                style={{ display: "none" }}
                            />

                            <div className="mr-reward-summary">
                                <span className="mr-reward-summary-name">Versi {versi.version_name}</span>
                                <span className="mr-reward-summary-satuan">
                                    Kode {versi.version_code} · {formatUkuranFile(versi.file_size)}
                                </span>
                                <span className="mr-reward-summary-desc">
                                    Dirilis {formatTanggalPanjang(versi.created_at)}
                                </span>
                            </div>

                            <div className="mr-form-field">
                                <label className="mr-form-label">Link Install</label>
                                <Input
                                    type="text"
                                    value={LINK_INSTALL_APK}
                                    readOnly
                                    fullWidth
                                    className="mr-input-override"
                                    onFocus={e => e.target.select()}
                                />
                                <span className="mr-form-hint">
                                    Link ini selalu mengarah ke versi terbaru, jadi QR yang sudah dicetak tetap berlaku.
                                </span>
                            </div>

                            <div className="mr-modal-actions">
                                <Button type="button" variant="outline" color="primary" icon={<FaDownload />} onClick={unduhQR}>
                                    Unduh QR
                                </Button>
                                <Button type="button" color="primary" icon={tersalin ? <FaCheck /> : <FaCopy />} onClick={salinLink}>
                                    {tersalin ? "Tersalin" : "Salin Link"}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
