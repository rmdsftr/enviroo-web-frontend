import React, { useState, useEffect } from 'react';
import "../styles/popup-confirmation.css";
import "../styles/popup-input-keterangan.css";

interface PopupInputKeteranganProps {
    isOpen: boolean;
    type?: 'success' | 'warning' | 'danger';
    title: string;
    onConfirm: (keterangan: string) => void;
    onCancel: () => void;
}

const PopupInputKeterangan: React.FC<PopupInputKeteranganProps> = ({
    isOpen,
    type = 'warning',
    title,
    onConfirm,
    onCancel
}) => {
    const [keterangan, setKeterangan] = useState('');

    useEffect(() => {
        if (isOpen) setKeterangan('');
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (keterangan.trim()) onConfirm(keterangan);
    };

    const isDisabled = !keterangan.trim();

    return (
        <div className="popup-overlay popup-overlay--top" onClick={onCancel}>
            <div
                className={`popup-container popup-container--keterangan ${type}`}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="popup-title">{title}</h2>
                <p className="popup-message popup-message--tight">
                    Keterangan ini akan dicatat ke dalam riwayat sistem.
                </p>

                <form onSubmit={handleSubmit} className="popup-keterangan-form">
                    <textarea
                        autoFocus
                        value={keterangan}
                        onChange={(e) => setKeterangan(e.target.value)}
                        placeholder="Tulis keterangan di sini..."
                        required
                        rows={4}
                        className="popup-keterangan-textarea"
                    />

                    <div className="popup-actions">
                        <button
                            type="button"
                            className="popup-btn popup-btn-cancel"
                            onClick={onCancel}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className={`popup-btn popup-btn-confirm ${type}`}
                            disabled={isDisabled}
                        >
                            Simpan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PopupInputKeterangan;
