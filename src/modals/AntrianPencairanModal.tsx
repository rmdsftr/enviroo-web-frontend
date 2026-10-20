import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaUsers } from "react-icons/fa6";
import type { KatalogSampah } from "../types/katalog.type";
import type { AntrianPencairanItem, AntrianPencairanResponse } from "../types/tabungan.type";
import { TabunganService } from "../services/tabungan.service";
import CloseButton from "../components/close-button";
import Pagination from "../components/pagination";
import { TableAvatar } from "../components/table";
import { formatTanggal } from "../utils/date.utils";
import { formatDecimal, formatQty } from "../utils/number.utils";
import { getApiError } from "../utils/error.utils";
import "../styles/setoran-dashboard.css";

const LIMIT = 10;

function NomorLabel({ from, to }: { from: number; to: number }) {
    return (
        <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "rgba(78,167,113,0.07)", border: "1px solid rgba(78,167,113,0.2)",
            borderRadius: "8px", padding: "5px 12px", width: "fit-content",
        }}>
            <span style={{ fontSize: "10px", fontWeight: 600, color: "#013236",
                textTransform: "uppercase", letterSpacing: "0.4px" }}>
                Antrian
            </span>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#7cba0a" }}>
                #{from} – #{to}
            </span>
        </div>
    );
}

function AntrianRow({ item, satuan }: { item: AntrianPencairanItem; satuan: string }) {
    return (
        <div className="kns-row">
            <span className="kns-rank kns-rank--other">{item.nomor}</span>
            <div className="kns-nasabah-info">
                <TableAvatar src={item.foto_nasabah || undefined} alt={item.nama_nasabah} />
                <div className="kns-nasabah-text">
                    <span className="kns-name">{item.nama_nasabah}</span>
                    <span className="kns-bank">Setor {formatTanggal(item.tanggal_setor)}</span>
                </div>
            </div>
            <div className="kns-stats">
                <span className="kns-unit-pill">Sisa {formatQty(item.sisa_qty, satuan)}</span>
            </div>
        </div>
    );
}

interface Props {
    item: KatalogSampah;
    onClose: () => void;
}

export function AntrianPencairanModal({ item, onClose }: Props) {
    const [data, setData] = useState<AntrianPencairanResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        TabunganService.getAntrianPencairan(item.bank_id, item.sampah_id)
            .then(res => setData(res))
            .catch(err => setError(getApiError(err, "Gagal memuat antrian pencairan.")));
    }, [item.bank_id, item.sampah_id]);

    const antrian = data?.antrian ?? [];
    const satuan = data?.satuan_sampah || item.satuan;
    const totalPages = Math.max(1, Math.ceil(antrian.length / LIMIT));
    const offset = (page - 1) * LIMIT;
    const paged = antrian.slice(offset, offset + LIMIT);
    const col1 = paged.slice(0, 5);
    const col2 = paged.slice(5, 10);

    return createPortal(
        <div className="katalog-modal-overlay" onClick={onClose}>
            <div className="katalog-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '760px' }}>
                <div className="km-header">
                    <div>
                        <h3 className="km-title" style={{ fontSize: '16px' }}>Antrian Pencairan Tabungan</h3>
                        <p className="km-subtitle" style={{ fontSize: '11px' }}>
                            {item.nama_sampah}
                            {data && ` · ${formatDecimal(antrian.length)} setoran menunggu pencairan`}
                        </p>
                    </div>
                    <CloseButton onClick={onClose} style={{ width: '28px', height: '28px', fontSize: '16px' }} />
                </div>

                <div style={{ padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                    {error ? (
                        <div className="ssd-state ssd-state--error">{error}</div>
                    ) : data === null ? (
                        <div className="ssd-state">Memuat antrian...</div>
                    ) : antrian.length === 0 ? (
                        <div className="ssd-state">
                            <FaUsers className="ssd-state-icon" />
                            <span>Belum ada nasabah yang mengantri pencairan untuk sampah ini.</span>
                        </div>
                    ) : (
                        <>
                            <NomorLabel from={offset + 1} to={offset + paged.length} />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                <div className="kns-list">
                                    {col1.map(a => <AntrianRow key={a.nomor} item={a} satuan={satuan} />)}
                                </div>
                                <div className="kns-list">
                                    {col2.map(a => <AntrianRow key={a.nomor} item={a} satuan={satuan} />)}
                                </div>
                            </div>
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                onPageChange={setPage}
                                variant="compact"
                            />
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
