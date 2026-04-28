import { useNavigate } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa6";
import "../styles/breadcrumb.css";

export interface BreadcrumbItem {
    label: string;
    path?: string; // kalau undefined = item aktif (tidak bisa diklik)
}

interface Props {
    items: BreadcrumbItem[];
}

export default function BreadcrumbLayout({ items }: Props) {
    const navigate = useNavigate();

    return (
        <nav className="breadcrumb" aria-label="Breadcrumb">
            {items.map((item, i) => {
                const isLast = i === items.length - 1;

                return (
                    <span key={i} className="breadcrumb-segment">
                        {item.path && !isLast ? (
                            <span
                                className="breadcrumb-link"
                                role="link"
                                tabIndex={0}
                                onClick={() => navigate(item.path!)}
                                onKeyDown={(e) => e.key === "Enter" && navigate(item.path!)}
                            >
                                {item.label}
                            </span>
                        ) : (
                            <span className="breadcrumb-current">{item.label}</span>
                        )}
                        {!isLast && (
                            <FaChevronRight className="breadcrumb-separator" />
                        )}
                    </span>
                );
            })}
        </nav>
    );
}
