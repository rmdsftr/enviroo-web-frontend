import { useState } from "react";
import { createPortal } from "react-dom";
import type { KatalogSampah, KatalogDetail } from "../types/katalog.type";
import { FaCoins, FaBoxOpen, FaTrash, FaPen, FaChartLine, FaUsers } from "react-icons/fa6";
import Button from "../components/button";
import CloseButton from "../components/close-button";
import ViewPhoto from "../components/view-photo";
import { RiwayatHargaModal } from "./RiwayatHargaModal";
import { AntrianPencairanModal } from "./AntrianPencairanModal";
import { formatNominal } from "../utils/number.utils";

interface Props {
    item: KatalogSampah;
    detail: KatalogDetail | null;
    canEdit: boolean;
    onClose: () => void;
    onDelete: () => void;
    onEdit: () => void;
}

export function KatalogSampahDetailModal({ item, detail, canEdit, onClose, onDelete, onEdit }: Props) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [antrianOpen, setAntrianOpen] = useState(false);

    return createPortal(
        <>
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

                        <div>
                            <div
                                style={{ background: "linear-gradient(135deg, rgba(78, 167, 113, 0.15) 0%, rgba(1, 50, 54, 0.05) 100%)", borderRadius: '12px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '16px', cursor: item.photo_url ? 'pointer' : 'default' }}
                                onClick={() => item.photo_url && setLightboxOpen(true)}
                                title={item.photo_url ? "Klik untuk memperbesar" : undefined}
                            >
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
                                <div style={{ fontSize: '12px', color: 'var(--k-muted)', padding: '8px 10px', background: '#f8faf9', borderRadius: '8px', border: '1px solid var(--k-border)' }}>
                                    <strong>Syarat:</strong> {item.syarat_pemilahan}
                                </div>
                            )}
                        </div>

                        <div>
                            <h4 style={{ fontSize: '14.5px', color: 'var(--k-dark)', marginBottom: '12px' }}>Harga Sampah Saat Ini</h4>
                            <div className="kd-stat-card" style={{ padding: '14px', gap: '8px', marginBottom: '14px' }}>
                                {detail === null ? (
                                    <div style={{ fontSize: '12px', color: 'var(--k-muted)', textAlign: 'center', padding: '8px 0' }}>Memuat harga...</div>
                                ) : (detail.harga_per_level?.length ?? 0) === 0 ? (
                                    <div style={{ fontSize: '12px', color: 'var(--k-muted)', textAlign: 'center', padding: '8px 0' }}>Belum ada harga.</div>
                                ) : (
                                    detail.harga_per_level?.map(h => (
                                        <div className="kd-stat-row" style={{ fontSize: '12.5px' }} key={h.level_user}>
                                            <span className="kd-stat-label" style={{ textTransform: 'capitalize' }}>{h.level_user === 'eksternal' ? 'Pengepul' : h.level_user}</span>
                                            <div className="katalog-price-tag price-poin" style={{ margin: 0, padding: '4px 10px', fontSize: '12px' }}>
                                                <FaCoins />{formatNominal(h.harga, h.satuan_reward)}/{item.satuan}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="kd-stat-card" style={{ padding: '14px', gap: '8px', marginBottom: '14px' }}>
                                <div className="kd-stat-row" style={{ fontSize: '12.5px' }}>
                                    <span className="kd-stat-label">Stok</span>
                                    <span style={{ fontWeight: 600 }}>{detail?.stok ?? item.stok ?? 0} {item.satuan}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <Button
                                    type="button"
                                    variant="outline"
                                    color="primary"
                                    size="small"
                                    isRounded
                                    fullWidth
                                    icon={<FaChartLine />}
                                    onClick={() => setHistoryOpen(true)}
                                    disabled={detail === null}
                                >
                                    Lihat riwayat perubahan harga
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    color="primary"
                                    size="small"
                                    isRounded
                                    fullWidth
                                    icon={<FaUsers />}
                                    onClick={() => setAntrianOpen(true)}
                                >
                                    Lihat antrian pencairan tabungan
                                </Button>
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
            {lightboxOpen && item.photo_url && (
                <ViewPhoto src={item.photo_url} alt={item.nama_sampah} onClose={() => setLightboxOpen(false)} />
            )}
        </div>
        {historyOpen && detail && (
            <RiwayatHargaModal item={item} detail={detail} onClose={() => setHistoryOpen(false)} />
        )}
        {antrianOpen && (
            <AntrianPencairanModal item={item} onClose={() => setAntrianOpen(false)} />
        )}
        </>,
        document.body
    );
}
