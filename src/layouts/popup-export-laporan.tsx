import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaFileExport } from 'react-icons/fa6';
import Input from '../components/input';
import "../styles/popup-confirmation.css";
import "../styles/popup-export-laporan.css";

interface PopupExportLaporanProps {
    isOpen: boolean;
    title?: string;
    defaultStart: string;
    defaultEnd: string;
    onDownload: (start: string, end: string) => Promise<void>;
    onCancel: () => void;
}

const PopupExportLaporan: React.FC<PopupExportLaporanProps> = ({
    isOpen,
    title = "Ekspor Laporan",
    defaultStart,
    defaultEnd,
    onDownload,
    onCancel,
}) => {
    const [start, setStart] = useState(defaultStart);
    const [end, setEnd] = useState(defaultEnd);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStart(defaultStart);
            setEnd(defaultEnd);
        }
    }, [isOpen, defaultStart, defaultEnd]);

    if (!isOpen) return null;

    const isInvalid = !start || !end || start > end;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isInvalid) return;
        setIsDownloading(true);
        try {
            await onDownload(start, end);
        } finally {
            setIsDownloading(false);
        }
    };

    return createPortal(
        <div className="popup-overlay" onClick={onCancel}>
            <div
                className="popup-container popup-container--export"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="popup-title">{title}</h2>
                <p className="popup-message popup-message--tight">
                    Pilih periode laporan yang ingin diunduh.
                </p>

                <form onSubmit={handleSubmit} className="popup-export-form">
                    <div className="popup-export-range">
                        <div className="popup-export-field">
                            <label className="popup-export-label">Dari</label>
                            <Input
                                type="date"
                                value={start}
                                max={end || undefined}
                                onChange={(e) => setStart(e.target.value)}
                                required
                            />
                        </div>
                        <span className="popup-export-sep">—</span>
                        <div className="popup-export-field">
                            <label className="popup-export-label">Sampai</label>
                            <Input
                                type="date"
                                value={end}
                                min={start || undefined}
                                onChange={(e) => setEnd(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="popup-actions">
                        <button
                            type="button"
                            className="popup-btn popup-btn-cancel"
                            onClick={onCancel}
                            disabled={isDownloading}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="popup-btn popup-btn-confirm success"
                            disabled={isInvalid || isDownloading}
                        >
                            <FaFileExport style={{ marginRight: 6 }} />
                            {isDownloading ? "Mengunduh..." : "Download"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default PopupExportLaporan;
