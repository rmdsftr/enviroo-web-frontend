import { createPortal } from "react-dom";
import type { KatalogSampah, KatalogDetail } from "../types/katalog.type";
import { FaCoins, FaBoxOpen, FaBuilding, FaTrash, FaPen } from "react-icons/fa6";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import { formatTanggalJam } from "../utils/date.utils";

interface Props {
    item: KatalogSampah;
    detail: KatalogDetail | null;
    canEdit: boolean;
    onClose: () => void;
    onDelete: () => void;
    onEdit: () => void;
}

export function KatalogSampahDetailModal({ item, detail, canEdit, onClose, onDelete, onEdit }: Props) {
    return createPortal(
        <div className="katalog-modal-overlay" onClick={onClose}>
            <div className="katalog-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px', overflow: 'hidden' }}>
                <div className="km-header">
                    <div>
                        <h3 className="km-title" style={{ fontSize: '16px' }}>Detail Katalog Sampah</h3>
                        <p className="km-subtitle" style={{ fontSize: '11px' }}>Informasi lengkap dan riwayat perubahan harga item katalog.</p>
                    </div>
                    <CloseButton onClick={onClose} style={{ width: '28px', height: '28px', fontSize: '16px' }} />
                </div>

                <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="km-body" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px', alignItems: 'start', paddingBottom: '24px' }}>

                        {/* Kolom 1: Info + Stok */}
                        <div>
                            <div style={{ background: "linear-gradient(135deg, rgba(78, 167, 113, 0.15) 0%, rgba(1, 50, 54, 0.05) 100%)", borderRadius: '12px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '16px' }}>
                                {item.photo_url ? (
                                    <img src={item.photo_url} alt={item.nama_sampah} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    <FaBoxOpen size={64} color="#4EA771" style={{ opacity: 0.7 }} />
                                )}
                            </div>
                            <h2 style={{ fontSize: '20px', color: 'var(--k-dark)', marginBottom: '8px', lineHeight: 1.2 }}>{item.nama_sampah}</h2>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                <div style={{ background: 'rgba(78,167,113,0.1)', color: '#1a7a4a', padding: '4px 8px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 600 }}>
                                    {item.kategori?.Kategori || "-"}
                                </div>
                                <div style={{ background: 'rgba(78,167,113,0.08)', color: 'var(--k-dark)', padding: '4px 8px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 600 }}>
                                    {item.reward?.NamaReward || "-"}
                                </div>
                            </div>

                            {item.syarat_pemilahan && (
                                <div style={{ fontSize: '12px', color: 'var(--k-muted)', marginBottom: '12px', padding: '8px 10px', background: '#f8faf9', borderRadius: '8px', border: '1px solid var(--k-border)' }}>
                                    <strong>Syarat:</strong> {item.syarat_pemilahan}
                                </div>
                            )}

                            <div className="kd-stat-card" style={{ padding: '14px', gap: '8px' }}>
                                <div className="kd-stat-row" style={{ fontSize: '12.5px' }}>
                                    <span className="kd-stat-label">Stok</span>
                                    <span style={{ fontWeight: 600 }}>{detail?.stok ?? item.stok ?? 0} {item.satuan}</span>
                                </div>
                            </div>
                        </div>

                        {/* Kolom 2: Harga + Riwayat */}
                        <div>
                            <h4 style={{ fontSize: '14.5px', color: 'var(--k-dark)', marginBottom: '12px' }}>Harga Sampah Saat Ini</h4>
                            <div className="kd-stat-card" style={{ padding: '14px', gap: '8px', marginBottom: '20px' }}>
                                {detail === null ? (
                                    <div style={{ fontSize: '12px', color: 'var(--k-muted)', textAlign: 'center', padding: '8px 0' }}>Memuat harga...</div>
                                ) : (detail.harga_per_level?.length ?? 0) === 0 ? (
                                    <div style={{ fontSize: '12px', color: 'var(--k-muted)', textAlign: 'center', padding: '8px 0' }}>Belum ada harga.</div>
                                ) : (
                                    detail.harga_per_level?.map(h => (
                                        <div className="kd-stat-row" style={{ fontSize: '12.5px' }} key={h.level_user}>
                                            <span className="kd-stat-label" style={{ textTransform: 'capitalize' }}>{h.level_user}</span>
                                            <div className="katalog-price-tag price-poin" style={{ margin: 0, padding: '4px 10px', fontSize: '12px' }}>
                                                <FaCoins />{h.harga} {h.satuan_reward}/{item.satuan}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <h4 style={{ fontSize: '14.5px', color: 'var(--k-dark)', marginBottom: '16px' }}>Riwayat Perubahan Harga</h4>
                            <div className="kd-timeline-wrap">
                                {detail === null ? (
                                    <div className="kd-timeline-empty" style={{ fontSize: '12.5px', padding: '24px 0', color: 'var(--k-muted)', textAlign: 'center', background: '#fcfdfc', borderRadius: '12px', border: '1px dashed var(--k-border)' }}>
                                        Memuat riwayat...
                                    </div>
                                ) : (() => {
                                    const historyList = detail.history_harga ?? [];
                                    if (historyList.length === 0) {
                                        return (
                                            <div className="kd-timeline-empty" style={{ fontSize: '12.5px', padding: '24px 0', color: 'var(--k-muted)', textAlign: 'center', background: '#fcfdfc', borderRadius: '12px', border: '1px dashed var(--k-border)' }}>
                                                Belum ada riwayat perubahan harga.
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="kd-timeline" style={{ gap: '14px' }}>
                                            {historyList.map((rw, idx) => {
                                                const satuanReward = detail.harga_per_level?.find(h => h.schema_id === rw.schema_id)?.satuan_reward ?? "";
                                                return (
                                                    <div className="kd-timeline-item" key={idx}>
                                                        <div className="kd-timeline-dot" style={{ top: 4, width: '8px', height: '8px', left: '-23px' }} />
                                                        <span className="kd-timeline-date" style={{ fontSize: '10.5px' }}>{formatTanggalJam(rw.changed_at)}</span>
                                                        <div className="kd-timeline-content" style={{ padding: '10px 12px' }}>
                                                            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--k-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{rw.level_user}</div>
                                                            <div className="kd-timeline-price" style={{ fontSize: '12.5px' }}>
                                                                <s>{rw.harga_lama} {satuanReward}</s>
                                                                {rw.harga_baru} {satuanReward}
                                                            </div>
                                                            <div className="kd-timeline-admin" style={{ fontSize: '10.5px' }}>
                                                                <FaBuilding size={9} /> Oleh {rw.changed_by_nama}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {canEdit && (
                        <div className="km-footer">
                            <Button type="button" color="danger" variant="outline" isRounded size="small" icon={<FaTrash />} onClick={onDelete}>
                                Hapus Item
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
