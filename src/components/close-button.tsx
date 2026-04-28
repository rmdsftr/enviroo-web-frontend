import React from "react";
import { FaXmark } from "react-icons/fa6";
import "../styles/close-button.css";

interface CloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const CloseButton: React.FC<CloseButtonProps> = ({ onClick, ...props }) => {
    return (
        <button 
            type="button" 
            className="popup-close-btn" 
            onClick={onClick} 
            title="Tutup"
            {...props}
        >
            <FaXmark />
        </button>
    );
};

export default CloseButton;
