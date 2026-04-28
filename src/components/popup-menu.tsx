import { useState, useLayoutEffect, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "../styles/popup-menu.css";

// ── Types ──
export type PopupMenuItem = {
    label: string;
    icon?: ReactNode;
    variant?: "default" | "danger";
    onClick: () => void;
};

type PopupMenuProps = {
    items: PopupMenuItem[];
    trigger: ReactNode;
};

// ── Component ──
export default function PopupMenu({ items, trigger }: PopupMenuProps) {
    const [open, setOpen] = useState(false);
    const [positioned, setPositioned] = useState(false);
    const [pos, setPos] = useState({ top: 0, right: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Setelah popup di-render (invisible), ukur dan tentukan posisi final
    useLayoutEffect(() => {
        if (!open || !triggerRef.current || !menuRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const menuHeight = menuRef.current.offsetHeight;
        const GAP = 6;
        const MARGIN = 8;

        const rightOffset = Math.max(MARGIN, window.innerWidth - triggerRect.right);

        const spaceBelow = window.innerHeight - triggerRect.bottom - GAP;
        const spaceAbove = triggerRect.top - GAP;

        let top: number;
        if (spaceBelow >= menuHeight + MARGIN) {
            top = triggerRect.bottom + GAP;
        } else if (spaceAbove >= menuHeight + MARGIN) {
            top = triggerRect.top - menuHeight - GAP;
        } else {
            top = Math.max(MARGIN, window.innerHeight - menuHeight - MARGIN);
        }

        setPos({ top, right: rightOffset });
        setPositioned(true);
    }, [open]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                triggerRef.current && !triggerRef.current.contains(target) &&
                menuRef.current && !menuRef.current.contains(target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open]);

    const handleTriggerClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!open) {
            // Reset positioned agar popup di-render invisible dulu untuk diukur
            setPositioned(false);
        }
        setOpen((v) => !v);
    };

    return (
        <>
            <div className="popup-menu-wrapper" ref={triggerRef}>
                <div className="popup-menu-trigger" onClick={handleTriggerClick}>
                    {trigger}
                </div>
            </div>

            {open &&
                createPortal(
                    <div
                        ref={menuRef}
                        className="popup-menu"
                        style={{
                            position: "fixed",
                            top: pos.top,
                            right: pos.right,
                            // Invisible saat belum diukur agar tidak flicker
                            visibility: positioned ? "visible" : "hidden",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="popup-menu-list">
                            {items.map((item, i) => (
                                <button
                                    key={i}
                                    className={`popup-menu-item ${item.variant === "danger" ? "popup-menu-item--danger" : ""}`}
                                    onClick={() => {
                                        item.onClick();
                                        setOpen(false);
                                    }}
                                    type="button"
                                >
                                    {item.icon && <span className="popup-menu-item-icon">{item.icon}</span>}
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}
