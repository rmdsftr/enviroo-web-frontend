import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FaXmark } from "react-icons/fa6";
import "../styles/view-photo.css";

interface ViewPhotoProps {
    src: string;
    alt?: string;
    onClose: () => void;
}

export default function ViewPhoto({ src, alt = "Foto", onClose }: ViewPhotoProps) {
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [onClose]);

    return createPortal(
        <div className="vp-overlay" onClick={onClose}>
            <button className="vp-close" onClick={onClose} aria-label="Tutup">
                <FaXmark />
            </button>
            <img
                className="vp-image"
                src={src}
                alt={alt}
                onClick={(e) => e.stopPropagation()}
            />
        </div>,
        document.body
    );
}
