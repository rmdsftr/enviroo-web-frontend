import { createPortal } from "react-dom";
import CloseButton from "../components/close-button";
import "../styles/manajemen-reward.css";
import "../styles/syarat-penarikan.css";

const ATURAN_WAKTU = [
    "Waktu minimal penarikan terhitung sejak nasabah menyetor sampah pertama kali. Jika tidak memenuhi syarat, nasabah belum bisa mengajukan penarikan saldo.",
    "Jika pada saat pendaftaran akun nasabah sudah memiliki saldo awal, waktu minimal penarikan terhitung sejak akun nasabah dibuat.",
];

const ATURAN_NOMINAL = [
    "Nasabah baru bisa mengajukan penarikan jika saldonya sudah mencapai nominal minimal: saldo rupiah untuk penarikan uang, saldo poin untuk penarikan barang.",
    "Nominal minimal 0 berarti tidak ada batas saldo minimal.",
    "Jika penarikan uang atau barang tidak dilayani, nasabah tidak dapat mengajukan penarikan jenis tersebut.",
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function SyaratPenarikanDetailModal({ isOpen, onClose }: Props) {
    if (!isOpen) return null;

    return createPortal(
        <div className="mr-modal-overlay" onClick={onClose}>
            <div className="mr-modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: "560px" }}>
                <div className="mr-modal-header">
                    <div>
                        <h3 className="mr-modal-title">Detail Syarat Penarikan</h3>
                        <p className="mr-modal-sub">Aturan yang berlaku saat nasabah mengajukan penarikan saldo.</p>
                    </div>
                    <CloseButton onClick={onClose} />
                </div>
                <div className="spn-detail-body">
                    <div className="spn-detail-group">
                        <h4 className="spn-detail-title">Syarat waktu penarikan</h4>
                        <ul className="spn-detail-list">
                            {ATURAN_WAKTU.map(teks => <li key={teks}>{teks}</li>)}
                        </ul>
                    </div>
                    <div className="spn-detail-group">
                        <h4 className="spn-detail-title">Syarat nominal penarikan</h4>
                        <ul className="spn-detail-list">
                            {ATURAN_NOMINAL.map(teks => <li key={teks}>{teks}</li>)}
                        </ul>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
