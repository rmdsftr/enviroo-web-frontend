import { createPortal } from "react-dom";
import type { KatalogSembakoItem, RiwayatDistribusi } from "../types/sembako.type";
import { FaCoins, FaBasketShopping, FaTrash, FaPen } from "react-icons/fa6";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import { formatTanggal, formatTanggalJam } from "../utils/date.utils";

interface Props {
    item: KatalogSembakoItem;
    bsuRiwayat: RiwayatDistribusi[] | null;
    canEditSembako: boolean;
    isAdminBsi: boolean;
    isAdminBsm: boolean;
    filterBankName?: string;
    isViewingBSU: boolean;
    onClose: () => void;
    onDelete: () => void;
    onEdit: () => void;
}

export function KatalogSembakoDetailModal({ item, bsuRiwayat, canEditSembako, isAdminBsi, isAdminBsm, filterBankName, isViewingBSU, onClose, onDelete, onEdit }: Props) {
    return createPortal(
        <div className="katalog-modal-overlay" onClick={onClose}>
            <div
                className="katalog-modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: isAdminBsm ? '520px' : '720px', overflow: 'hidden' }}
            >
                <div className="km-header">
                    <div>
                        <h3 className="km-title" style={{ fontSize: '16px' }}>Detail Katalog Sembako</h3>
                        <p className="km-subtitle" style={{ fontSize: '11px' }}>
                            {isViewingBSU
                                ? `Katalog distribusi milik ${filterBankName ?? ""}`
                                : "Informasi lengkap item sembako."}
                        </p>
                    </div>
                    <CloseButton onClick={onClose} style={{ width: '28px', height: '28px', fontSize: '16px' }} />
                </div>

                <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="km-body" style={{ display: 'grid', gridTemplateColumns: isAdminBsm ? '1fr' : 'minmax(0,1fr) minmax(0,1.2fr)', gap: '24px', alignItems: 'start', paddingBottom: '24px' }}>

                        {/* Kolom 1: Foto + Nama + Stats */}
                        <div>
                            <div style={{ background: "linear-gradient(135deg, rgba(148, 223, 12, 0.15) 0%, rgba(1, 50, 54, 0.05) 100%)", borderRadius: '12px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '16px' }}>
                                {item.photo_url ? (
                                    <img src={item.photo_url} alt={item.nama_barang} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    <FaBasketShopping size={64} color="#94DF0C" style={{ opacity: 0.7 }} />
                                )}
                            </div>
                            <h2 style={{ fontSize: '18px', color: 'var(--k-dark)', marginBottom: '12px', lineHeight: 1.2 }}>{item.nama_barang}</h2>

                            <div className="kd-stat-card" style={{ padding: '14px', gap: '10px' }}>
                                <div className="kd-stat-row" style={{ fontSize: '12.5px' }}>
                                    <span className="kd-stat-label">Harga (Poin)</span>
                                    <div className="katalog-price-tag price-poin" style={{ margin: 0, padding: '4px 10px', fontSize: '12px' }}>
                                        <FaCoins />{item.nilai_poin} poin
                                    </div>
                                </div>
                                <div className="kd-stat-row" style={{ fontSize: '12.5px' }}>
                                    <span className="kd-stat-label">Stok</span>
                                    <span style={{ fontWeight: 600 }}>{item.stok ?? 0}</span>
                                </div>
                                {item.updated_at && (
                                    <div className="kd-stat-row" style={{ fontSize: '12.5px' }}>
                                        <span className="kd-stat-label">Diperbarui</span>
                                        <span style={{ color: 'var(--k-muted)' }}>{formatTanggal(item.updated_at)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Kolom 2: Riwayat Distribusi */}
                        {!isAdminBsm && (
                            <div>
                                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--k-dark)', marginBottom: '14px' }}>Riwayat Distribusi</h4>
                                <div className="kd-timeline-wrap">
                                    {bsuRiwayat === null ? (
                                        <div className="kd-timeline-empty">Memuat riwayat...</div>
                                    ) : bsuRiwayat.length === 0 ? (
                                        <div className="kd-timeline-empty">Belum ada riwayat distribusi.</div>
                                    ) : (
                                        <div className="kd-timeline" style={{ gap: '12px' }}>
                                            {bsuRiwayat.map((rw) => {
                                                const isBsiOwnView = isAdminBsi && !isViewingBSU;
                                                const aksiColor = isBsiOwnView ? '#F43F5E' : '#22C55E';
                                                const aksiLabel = isBsiOwnView ? 'dikirim' : 'diterima';
                                                return (
                                                    <div className="kd-timeline-item" key={rw.disbako_id}>
                                                        <div className="kd-timeline-dot" style={{ top: 8, width: '8px', height: '8px', left: '-23px' }} />
                                                        <span className="kd-timeline-date" style={{ fontSize: '10.5px' }}>
                                                            {formatTanggalJam(rw.tanggal_kirim)}
                                                        </span>
                                                        <div style={{ background: '#f8faf9', borderRadius: '10px', border: '1px solid #e8f0eb', padding: '9px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--k-dark)' }}>{rw.item} item</span>
                                                                <span style={{ fontSize: '10px', fontWeight: 700, color: aksiColor, background: `${aksiColor}18`, border: `1px solid ${aksiColor}30`, borderRadius: '99px', padding: '1px 7px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                                                    {aksiLabel}
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--k-muted)', flexShrink: 0 }}>
                                                                <span>stok</span>
                                                                <span style={{ fontWeight: 600, color: 'var(--k-dark)' }}>{rw.stok_sebelum}</span>
                                                                <span style={{ opacity: 0.4 }}>→</span>
                                                                <span style={{ fontWeight: 700, color: aksiColor }}>{rw.stok_sesudah}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {canEditSembako && (
                        <div className="km-footer">
                            <Button type="button" color="danger" variant="outline" isRounded size="small" icon={<FaTrash />} onClick={onDelete}>
                                Hapus
                            </Button>
                            <Button type="button" color="primary" variant="outline" isRounded size="small" icon={<FaPen />} onClick={onEdit}>
                                Edit Item
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
