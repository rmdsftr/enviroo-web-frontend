import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import "../styles/pagination.css";

type PaginationProps = {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    siblingCount?: number;
    variant?: "default" | "compact";
};

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    siblingCount = 1,
    variant = "default",
}: PaginationProps) {
    const pageCount = Math.max(1, totalPages);

    const buildPages = (): (number | "...")[] => {
        const pages: (number | "...")[] = [];
        const left = Math.max(2, currentPage - siblingCount);
        const right = Math.min(pageCount - 1, currentPage + siblingCount);

        pages.push(1);
        if (left > 2) pages.push("...");
        for (let i = left; i <= right; i++) pages.push(i);
        if (right < pageCount - 1) pages.push("...");
        if (pageCount > 1) pages.push(pageCount);

        return pages;
    };

    const rootCls = variant === "compact" ? "pagination pagination--compact" : "pagination";

    return (
        <div className={rootCls}>
            <button
                className="pagination__btn pagination__arrow"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Halaman sebelumnya"
            >
                <FaChevronLeft />
            </button>

            {buildPages().map((p, idx) =>
                p === "..." ? (
                    <span key={`ellipsis-${idx}`} className="pagination__ellipsis">
                        …
                    </span>
                ) : (
                    <button
                        key={p}
                        className={`pagination__btn${p === currentPage ? " pagination__btn--active" : ""}`}
                        onClick={() => onPageChange(p as number)}
                        aria-current={p === currentPage ? "page" : undefined}
                    >
                        {p}
                    </button>
                )
            )}

            <button
                className="pagination__btn pagination__arrow"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= pageCount}
                aria-label="Halaman berikutnya"
            >
                <FaChevronRight />
            </button>
        </div>
    );
}
