import { FaIdCard, FaCopy } from "react-icons/fa6";
import CloseButton from "../components/close-button";
import "../styles/popup-aktivasi.css";

interface PopupAktivasiResultProps {
    isOpen: boolean;
    onClose: () => void;
    data: { aktivasi_id: string; otp: string; expired_at?: string } | null;
    description: string;
}

export default function PopupAktivasiResult({ isOpen, onClose, data, description }: PopupAktivasiResultProps) {
    if (!isOpen || !data) return null;

    return (
        <div className="aktivasi-modal-overlay">
            <div className="aktivasi-modal-content">
                <CloseButton onClick={onClose} />
                
                <div className="aktivasi-modal-header">
                    <div className="aktivasi-modal-icon-wrap">
                        <FaIdCard />
                    </div>
                    <h3>Aktivasi Berhasil</h3>
                    <p>{description}</p>
                </div>

                <div className="aktivasi-copy-grid">
                    <div className="aktivasi-copy-item">
                        <span className="aktivasi-copy-label">ID Aktivasi</span>
                        <div className="aktivasi-copy-box">
                            <span className="aktivasi-copy-code">{data.aktivasi_id}</span>
                            <button 
                                className="aktivasi-copy-btn" 
                                title="Salin ID"
                                onClick={() => {
                                    navigator.clipboard.writeText(data.aktivasi_id);
                                    window.alert("ID Aktivasi berhasil disalin");
                                }}
                            >
                                <FaCopy />
                            </button>
                        </div>
                    </div>

                    <div className="aktivasi-copy-item">
                        <span className="aktivasi-copy-label">Kode OTP</span>
                        <div className="aktivasi-copy-box">
                            <span className="aktivasi-copy-code pin-code">{data.otp}</span>
                            <button 
                                className="aktivasi-copy-btn" 
                                title="Salin OTP"
                                onClick={() => {
                                    navigator.clipboard.writeText(data.otp);
                                    window.alert("Kode OTP berhasil disalin");
                                }}
                            >
                                <FaCopy />
                            </button>
                        </div>
                    </div>
                </div>

                {data.expired_at && (
                    <div className="aktivasi-modal-footer">
                        <p>
                            Berlaku hingga{" "}
                            <strong>
                                {new Date(data.expired_at).toLocaleString("id-ID", {
                                    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                                })} WIB
                            </strong>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
