import type { ReactNode } from "react";
import { FaInbox } from "react-icons/fa6";
import "../styles/empty-state.css";

interface EmptyStateProps {
    icon?: ReactNode;
    title?: string;
    description?: string;
    action?: ReactNode;
}

export default function EmptyState({
    icon,
    title = "Tidak ada data",
    description = "Belum ada data yang tersedia untuk ditampilkan.",
    action,
}: EmptyStateProps) {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">
                {icon || <FaInbox />}
            </div>
            <h3 className="empty-state-title">{title}</h3>
            <p className="empty-state-desc">{description}</p>
            {action && <div className="empty-state-action">{action}</div>}
        </div>
    );
}
