import { useRef, useState } from "react";
import { formatNominal } from "../utils/number.utils";
import { formatTanggalJam } from "../utils/date.utils";
import "../styles/riwayat-harga.css";

export interface RiwayatHargaPoint {
    time: number;
    harga: number;
}

export interface RiwayatHargaEvent {
    time: number;
    changedAt: string;
    hargaLama: number;
    hargaBaru: number;
    oleh: string;
}

interface Props {
    points: RiwayatHargaPoint[];
    events: RiwayatHargaEvent[];
    start: number;
    end: number;
    satuan: string;
}

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const W = 760;
const H = 280;
const PAD = { left: 76, right: 24, top: 20, bottom: 36 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;
const LINE_COLOR = "#94DF0C";

function niceStep(range: number, count: number): number {
    const raw = range / count;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const norm = raw / mag;
    const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
    return step * mag;
}

function buildYScale(values: number[]) {
    let lo = Math.min(...values);
    let hi = Math.max(...values);
    if (lo === hi) {
        const d = Math.max(Math.abs(hi) * 0.2, 1);
        lo -= d;
        hi += d;
    }
    const step = niceStep(hi - lo, 4);
    const min = Math.max(0, Math.floor(lo / step) * step);
    const max = Math.ceil(hi / step) * step;
    const ticks: number[] = [];
    for (let i = 0; min + i * step <= max + step / 2; i++) {
        ticks.push(Number((min + i * step).toFixed(6)));
    }
    return { min, max, ticks };
}

function buildMonthLabels(start: number, end: number) {
    const labels: { time: number; text: string }[] = [];
    const s = new Date(start);
    let cursor = new Date(s.getFullYear(), s.getMonth(), 1);
    while (cursor.getTime() <= end) {
        const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
        const from = Math.max(cursor.getTime(), start);
        const to = Math.min(next.getTime(), end);
        labels.push({
            time: (from + to) / 2,
            text: `${BULAN[cursor.getMonth()]} ${String(cursor.getFullYear()).slice(2)}`,
        });
        cursor = next;
    }
    return labels;
}

export default function RiwayatHargaChart({ points, events, start, end, satuan }: Props) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);

    const yScale = buildYScale(points.map(p => p.harga));
    const x = (t: number) => PAD.left + ((t - start) / (end - start)) * CHART_W;
    const y = (v: number) => PAD.top + CHART_H * (1 - (v - yScale.min) / (yScale.max - yScale.min));
    const bottom = PAD.top + CHART_H;

    let line = `M ${x(points[0].time)},${y(points[0].harga)}`;
    for (let i = 1; i < points.length; i++) {
        line += ` H ${x(points[i].time)} V ${y(points[i].harga)}`;
    }
    const area = `${line} V ${bottom} H ${x(points[0].time)} Z`;

    const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
        if (!svgRef.current || events.length === 0) return;
        const rect = svgRef.current.getBoundingClientRect();
        const vx = ((e.clientX - rect.left) / rect.width) * W;
        let nearest = 0;
        for (let i = 1; i < events.length; i++) {
            if (Math.abs(x(events[i].time) - vx) < Math.abs(x(events[nearest].time) - vx)) nearest = i;
        }
        setHoverIdx(nearest);
    };

    const hovered = hoverIdx !== null ? events[hoverIdx] : null;
    const hoverX = hovered ? x(hovered.time) : 0;
    const tooltipAlign = hoverX < W * 0.25 ? "start" : hoverX > W * 0.75 ? "end" : "center";

    return (
        <div className="rh-chart">
            <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                className="rh-chart-svg"
                onPointerMove={handlePointerMove}
                onPointerLeave={() => setHoverIdx(null)}
            >
                <defs>
                    <linearGradient id="rhAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={LINE_COLOR} stopOpacity={0.18} />
                        <stop offset="100%" stopColor={LINE_COLOR} stopOpacity={0.01} />
                    </linearGradient>
                </defs>

                {yScale.ticks.map(t => (
                    <g key={t}>
                        <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#e8f0eb" strokeWidth={1} />
                        <text x={PAD.left - 10} y={y(t) + 4} textAnchor="end" className="rh-axis-label">
                            {formatNominal(t, satuan)}
                        </text>
                    </g>
                ))}

                {buildMonthLabels(start, end).map(m => (
                    <text key={m.text} x={x(m.time)} y={H - 10} textAnchor="middle" className="rh-axis-label">
                        {m.text}
                    </text>
                ))}

                <path d={area} fill="url(#rhAreaGradient)" />
                <path d={line} fill="none" stroke={LINE_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

                {hovered && (
                    <line x1={hoverX} x2={hoverX} y1={PAD.top} y2={bottom} stroke="rgba(1, 50, 54, 0.25)" strokeWidth={1} />
                )}

                {events.map((ev, i) => (
                    <circle
                        key={`${ev.time}-${i}`}
                        cx={x(ev.time)}
                        cy={y(ev.hargaBaru)}
                        r={i === hoverIdx ? 6 : 4}
                        fill={LINE_COLOR}
                        stroke="#ffffff"
                        strokeWidth={2}
                    />
                ))}
            </svg>

            {hovered && (
                <div
                    className={`rh-tooltip rh-tooltip--${tooltipAlign}`}
                    style={{ left: `${(hoverX / W) * 100}%`, top: `${(y(hovered.hargaBaru) / H) * 100}%` }}
                >
                    <div className="rh-tooltip-date">{formatTanggalJam(hovered.changedAt)}</div>
                    <div className="rh-tooltip-price">
                        <s>{formatNominal(hovered.hargaLama, satuan)}</s>
                        <span>→</span>
                        <strong>{formatNominal(hovered.hargaBaru, satuan)}</strong>
                    </div>
                    <div className="rh-tooltip-by">Oleh {hovered.oleh}</div>
                </div>
            )}
        </div>
    );
}
