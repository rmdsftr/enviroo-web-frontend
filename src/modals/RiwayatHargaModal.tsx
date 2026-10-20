import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FaChartLine } from "react-icons/fa6";
import type { KatalogSampah, KatalogDetail, KatalogHistoryItem, LevelUser } from "../types/katalog.type";
import { KatalogService } from "../services/katalog.service";
import CloseButton from "../components/close-button";
import FilterPill from "../components/filter-pill";
import FilterRange, { defaultMonthRange } from "../components/filter-range";
import RiwayatHargaChart, { type RiwayatHargaEvent, type RiwayatHargaPoint } from "../components/RiwayatHargaChart";
import { toTimestamp } from "../utils/date.utils";
import { formatDecimal, formatNominal } from "../utils/number.utils";
import "../styles/riwayat-harga.css";

const LEVEL_ORDER: LevelUser[] = ["nasabah", "eksternal"];
const LEVEL_LABEL: Record<LevelUser, string> = { nasabah: "Nasabah", eksternal: "Pengepul" };

interface Props {
    item: KatalogSampah;
    detail: KatalogDetail;
    onClose: () => void;
}

export function RiwayatHargaModal({ item, detail, onClose }: Props) {
    const [historyHarga, setHistoryHarga] = useState<KatalogHistoryItem[] | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        KatalogService.getHistoryHarga(item.sampah_id)
            .then(res => setHistoryHarga(res.data ?? []))
            .catch(() => setError(true));
    }, [item.sampah_id]);

    const levels = useMemo(() => {
        const ada = new Set<LevelUser>([
            ...(detail.harga_per_level ?? []).map(h => h.level_user),
            ...(historyHarga ?? []).map(h => h.level_user),
        ]);
        return LEVEL_ORDER.filter(l => ada.has(l));
    }, [detail, historyHarga]);

    const [pilihanLevel, setLevel] = useState<LevelUser | null>(null);
    const level = pilihanLevel ?? levels[0] ?? "nasabah";
    const [from, setFrom] = useState(() => defaultMonthRange().from);
    const [to, setTo] = useState(() => defaultMonthRange().to);
    const [now] = useState(() => Date.now());

    const satuan = detail.harga_per_level?.find(h => h.level_user === level)?.satuan_reward ?? "";

    const chart = useMemo(() => {
        if (historyHarga === null) return null;

        const [fy, fm] = from.split("-").map(Number);
        const [ty, tm] = to.split("-").map(Number);
        const start = new Date(fy, fm - 1, 1).getTime();
        const end = Math.min(new Date(ty, tm, 0, 23, 59, 59, 999).getTime(), now);
        if (end <= start) return null;

        const history = historyHarga
            .filter(h => h.level_user === level)
            .map(h => ({ ...h, time: toTimestamp(h.changed_at) }))
            .sort((a, b) => a.time - b.time);

        const sebelum = history.filter(h => h.time < start);
        const hargaAwal = sebelum.length > 0
            ? sebelum[sebelum.length - 1].harga_baru
            : history.length > 0
                ? history[0].harga_lama
                : detail.harga_per_level?.find(h => h.level_user === level)?.harga;
        if (hargaAwal === undefined) return null;

        const events: RiwayatHargaEvent[] = history
            .filter(h => h.time >= start && h.time <= end)
            .map(h => ({
                time: h.time,
                changedAt: h.changed_at,
                hargaLama: h.harga_lama,
                hargaBaru: h.harga_baru,
                oleh: h.changed_by_nama,
            }));
        const hargaAkhir = events.length > 0 ? events[events.length - 1].hargaBaru : hargaAwal;

        const points: RiwayatHargaPoint[] = [
            { time: start, harga: hargaAwal },
            ...events.map(e => ({ time: e.time, harga: e.hargaBaru })),
            { time: end, harga: hargaAkhir },
        ];

        return { start, end, points, events, hargaAwal, hargaAkhir };
    }, [detail, historyHarga, level, from, to, now]);

    return createPortal(
        <div className="katalog-modal-overlay" onClick={onClose}>
            <div className="katalog-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '860px' }}>
                <div className="km-header">
                    <div>
                        <h3 className="km-title" style={{ fontSize: '16px' }}>Riwayat Perubahan Harga</h3>
                        <p className="km-subtitle" style={{ fontSize: '11px' }}>{item.nama_sampah} · per {item.satuan}</p>
                    </div>
                    <CloseButton onClick={onClose} style={{ width: '28px', height: '28px', fontSize: '16px' }} />
                </div>

                <div className="rh-body">
                    <div className="rh-filter-row">
                        <FilterPill
                            options={levels.map(l => ({ label: LEVEL_LABEL[l], value: l }))}
                            activeValue={level}
                            onChange={(v) => setLevel(v)}
                        />
                        <FilterRange
                            from={from}
                            to={to}
                            onChange={(f, t) => { setFrom(f); setTo(t); }}
                        />
                    </div>

                    {error ? (
                        <div className="rh-empty">
                            <FaChartLine />
                            <span>Gagal memuat riwayat harga.</span>
                        </div>
                    ) : historyHarga === null ? (
                        <div className="rh-empty">
                            <FaChartLine />
                            <span>Memuat riwayat harga...</span>
                        </div>
                    ) : chart === null ? (
                        <div className="rh-empty">
                            <FaChartLine />
                            <span>Belum ada data harga pada periode ini.</span>
                        </div>
                    ) : (
                        <>
                            <div className="rh-summary">
                                <div className="rh-summary-item">
                                    <span className="rh-summary-label">Harga Awal</span>
                                    <span className="rh-summary-value">{formatNominal(chart.hargaAwal, satuan)}</span>
                                </div>
                                <div className="rh-summary-item">
                                    <span className="rh-summary-label">Harga Akhir</span>
                                    <span className="rh-summary-value">{formatNominal(chart.hargaAkhir, satuan)}</span>
                                </div>
                                <div className="rh-summary-item">
                                    <span className="rh-summary-label">Perubahan</span>
                                    <span className="rh-summary-value">{formatDecimal(chart.events.length)} kali</span>
                                </div>
                            </div>

                            <RiwayatHargaChart
                                points={chart.points}
                                events={chart.events}
                                start={chart.start}
                                end={chart.end}
                                satuan={satuan}
                            />

                            {chart.events.length === 0 && (
                                <p className="rh-note">Tidak ada perubahan harga pada periode ini.</p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
