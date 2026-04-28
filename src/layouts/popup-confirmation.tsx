import React from 'react';
import { createPortal } from 'react-dom';
import { FaCheck, FaTriangleExclamation, FaTrash, FaCircleExclamation } from "react-icons/fa6";
import "../styles/popup-confirmation.css";

export type PopupType = 'success' | 'warning' | 'danger';

interface PopupConfirmationProps {
    isOpen: boolean;
    type: PopupType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const PopupConfirmation: React.FC<PopupConfirmationProps> = ({
    isOpen,
    type,
    title,
    message,
    confirmText = "Ya, Lanjutkan",
    cancelText = "Batal",
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <FaCheck />;
            case 'warning':
                return <FaTriangleExclamation />;
            case 'danger':
                return <FaTrash />;
            default:
                return <FaCircleExclamation />;
        }
    };

    return createPortal(
        <div className="popup-overlay" onClick={onCancel}>
            <div 
                className={`popup-container ${type}`} 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="popup-icon-wrapper">
                    {getIcon()}
                </div>

                <h2 className="popup-title">{title}</h2>
                <p className="popup-message">{message}</p>

                <div className="popup-actions">
                    <button 
                        className="popup-btn popup-btn-cancel" 
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button 
                        className={`popup-btn popup-btn-confirm ${type}`} 
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PopupConfirmation;
