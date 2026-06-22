import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCalendar, FaCircleNotch, FaPen, FaTrash, FaPenToSquare, FaLocationDot } from "react-icons/fa6";
import { KontenService } from "../services/konten.service";
import { formatTanggalPanjang } from "../utils/date.utils";
import { useAuth } from "../contexts/AuthContext";
import type { KontenItem, KontenListItem, BodyBlock } from "../types/konten.type";
import { PopupNotifikasi } from "../layouts/popup-notifikasi";
import PopupConfirmation from "../layouts/popup-confirmation";
import ViewPhoto from "../components/view-photo";
import { getApiError } from "../utils/error.utils";
import "../styles/open_konten.css";

export default function OpenKontenPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [konten, setKonten] = useState<KontenItem | null>(null);
    const [blocks, setBlocks] = useState<BodyBlock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notif, setNotif] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [viewPhotoSrc, setViewPhotoSrc] = useState<string | null>(null);

    // Sidebar: other content from the same bank
    const [otherKonten, setOtherKonten] = useState<KontenListItem[]>([]);

    useEffect(() => {
        if (!id) return;

        const fetchDetail = async () => {
            setIsLoading(true);
            try {
                const res = await KontenService.getKontenById(id);
                setKonten(res.data);
                if (res.data.Body) {
                    try {
                        setBlocks(JSON.parse(res.data.Body));
                    } catch (e) {
                        console.error("Failed to parse konten body", e);
                    }
                }
                // Fetch other articles from same bank for sidebar
                if (res.data.BankID) {
                    try {
                        const allRes = await KontenService.getAllKonten(res.data.BankID, true);
                        // Exclude current article, take up to 5
                        setOtherKonten((allRes.data || []).filter(k => k.konten_id !== id).slice(0, 5));
                    } catch { /* ignore */ }
                }
            } catch (err) {
                console.error("Error fetching detail konten", err);
                setError("Gagal memuat konten. Konten mungkin telah dihapus atau tidak ditemukan.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetail();
    }, [id]);

    /* ── Loading ── */
    if (isLoading) {
        return (
            <div className="ok-page">
                <div className="ok-loading">
                    <FaCircleNotch className="ok-spinner" />
                    <span>Memuat artikel...</span>
                </div>
            </div>
        );
    }

    /* ── Error ── */
    if (error || !konten) {
        return (
            <div className="ok-page">
                <div className="ok-card" style={{ textAlign: "center", padding: "60px 32px" }}>
                    <h2 style={{ color: "#013236", fontSize: "18px" }}>Oops!</h2>
                    <p style={{ color: "#6b9080", marginTop: "10px", fontSize: "13px" }}>
                        {error || "Konten tidak ditemukan."}
                    </p>
                    <button className="ok-back-btn" onClick={() => navigate(-1)} style={{ marginTop: "20px" }}>
                        <FaArrowLeft /> Kembali ke daftar
                    </button>
                </div>
            </div>
        );
    }

    const tanggal = formatTanggalPanjang(konten.CreatedAt);

    // Cek apakah user yang login adalah penulis konten ini
    const isOwner = user?.identity_id === konten.AdminID;

    const handleDelete = () => {
        setShowDeleteConfirm(true);
    };

    const doDelete = async () => {
        if (!konten) return;
        setShowDeleteConfirm(false);
        try {
            await KontenService.deleteKonten(konten.KontenID);
            navigate(-1);
        } catch (err) {
            console.error("Gagal menghapus konten", err);
            setNotif({ message: getApiError(err, "Gagal menghapus konten. Silakan coba lagi."), type: "error" });
        }
    };

    return (
        <div className="ok-page">
            {viewPhotoSrc && (
                <ViewPhoto src={viewPhotoSrc} onClose={() => setViewPhotoSrc(null)} />
            )}
            {notif && (
                <PopupNotifikasi
                    message={notif.message}
                    type={notif.type}
                    onClose={() => setNotif(null)}
                />
            )}
            <PopupConfirmation
                isOpen={showDeleteConfirm}
                type="danger"
                title={konten.IsUploaded ? "Hapus Konten" : "Hapus Draft"}
                message={`Apakah Anda yakin ingin menghapus ${konten.IsUploaded ? "konten" : "draft"} ini? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Ya, Hapus"
                onConfirm={doDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />
            {/* ── Header Row ── */}
            <div className="ok-header-row">
                <button className="ok-back-btn" onClick={() => navigate(-1)}>
                    <FaArrowLeft /> Kembali
                </button>
            </div>

            {/* ── Two-column Layout ── */}
            <div className="ok-layout">
                {/* Left: Article Card */}
                <div className="ok-main">
                    <div className="ok-card">
                        {/* Banner — clean image only */}
                        <div className="ok-banner">
                            {konten.Thumbnail ? (
                                <img
                                    src={konten.Thumbnail}
                                    alt={konten.Judul}
                                    onClick={() => setViewPhotoSrc(konten.Thumbnail!)}
                                    style={{ cursor: "zoom-in" }}
                                />
                            ) : (
                                <div className="ok-banner-placeholder">
                                    <span>{konten.Judul.charAt(0)}</span>
                                </div>
                            )}
                            <span className={`ok-status ${konten.IsUploaded ? "published" : "draft"}`}>
                                {konten.IsUploaded ? "Dipublikasikan" : "Draft"}
                            </span>
                        </div>

                        {/* Content */}
                        <div className="ok-content">
                            <h1 className="ok-title">{konten.Judul}</h1>
                            {konten.Deskripsi && (
                                <p className="ok-lead">{konten.Deskripsi}</p>
                            )}
                            <div className="ok-divider" />
                            <div className="ok-body">
                                {blocks.map((b, idx) => {
                                    if (b.type === "text" && b.content) {
                                        return <p key={idx} className="ok-paragraph">{b.content}</p>;
                                    }
                                    if (b.type === "image" && b.media_url) {
                                        return (
                                            <figure
                                                key={idx}
                                                className="ok-figure"
                                                onClick={() => setViewPhotoSrc(b.media_url!)}
                                                style={{ cursor: "zoom-in" }}
                                            >
                                                <img src={b.media_url} alt={`Ilustrasi ${idx + 1}`} />
                                            </figure>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        </div>

                        {/* Footer: author + date + status + actions */}
                        <div className="ok-footer">
                            <div className="ok-footer-meta">
                                <div className="ok-footer-meta-info">
                                    <span className="ok-footer-author"><FaPen /> {konten.nama_admin}</span>
                                    <span className="ok-footer-author"><FaLocationDot /> {konten.nama_instansi}</span>
                                    <span className="ok-footer-date"><FaCalendar /> {tanggal}</span>
                                </div>
                            </div>

                            {isOwner && (
                                <div className="ok-footer-actions">
                                    <button className="ok-action-btn ok-edit-btn" onClick={() => {
                                        let path = "";
                                        if (user?.role === "superadmin") {
                                            path = `/superadmin/informasi/edit/${konten.KontenID}`;
                                        } else if (user?.role === "admin_bsi") {
                                            path = `/bsi/konten/edit/${konten.KontenID}`;
                                        } else if (user?.role === "admin_bsu") {
                                            path = `/bsu/konten/edit/${konten.KontenID}`;
                                        } else if (user?.role === "admin_bsm") {
                                            path = `/bsm/konten/edit/${konten.KontenID}`;
                                        }

                                        if (path) {
                                            navigate(path);
                                        }
                                    }}>
                                        <FaPenToSquare /> {konten.IsUploaded ? "Edit Konten" : "Edit Draft"}
                                    </button>
                                    <button className="ok-action-btn ok-delete-btn" onClick={handleDelete}>
                                        <FaTrash /> {konten.IsUploaded ? "Hapus Konten" : "Hapus Draft"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Sidebar */}
                <aside className="ok-sidebar">
                    <div className="ok-sidebar-card">
                        <h3 className="ok-sidebar-title">Konten Lainnya</h3>
                        {otherKonten.length === 0 ? (
                            <p className="ok-sidebar-empty">Belum ada konten lain.</p>
                        ) : (
                            <div className="ok-sidebar-list">
                                {otherKonten.map(item => (
                                    <div
                                        key={item.konten_id}
                                        className="ok-sidebar-item"
                                        onClick={() => navigate(`../${item.konten_id}`, { relative: 'path' })}
                                    >
                                        <div className="ok-sidebar-item-thumb">
                                            {item.thumbnail ? (
                                                <img src={item.thumbnail} alt={item.judul} />
                                            ) : (
                                                <span>{item.judul.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div className="ok-sidebar-item-info">
                                            <span className="ok-sidebar-item-title">{item.judul}</span>
                                            <span className="ok-sidebar-item-date">
                                                <FaLocationDot /> {item.nama_instansi}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
