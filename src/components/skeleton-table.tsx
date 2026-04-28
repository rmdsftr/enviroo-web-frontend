import "../styles/skeleton-table.css";

interface SkeletonTableProps {
    rows?: number;
    columns?: number;
}

export default function SkeletonTable({ rows = 6, columns = 5 }: SkeletonTableProps) {
    return (
        <div className="skeleton-table-wrapper">
            <div className="skeleton-table">
                {/* Header */}
                <div className="skeleton-row skeleton-header">
                    {Array.from({ length: columns }).map((_, i) => (
                        <div key={`h-${i}`} className="skeleton-cell">
                            <div className="skeleton-bar skeleton-bar--header" />
                        </div>
                    ))}
                </div>

                {/* Body rows */}
                {Array.from({ length: rows }).map((_, ri) => (
                    <div key={`r-${ri}`} className="skeleton-row">
                        {Array.from({ length: columns }).map((_, ci) => (
                            <div key={`c-${ci}`} className="skeleton-cell">
                                {ci === 0 ? (
                                    <div className="skeleton-avatar" />
                                ) : (
                                    <div
                                        className="skeleton-bar"
                                        style={{ width: `${55 + Math.random() * 35}%` }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
