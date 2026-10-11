export const DECIMAL_PRECISION = 4;

const decimalFormatter = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: DECIMAL_PRECISION,
});

const compactFormatter = new Intl.NumberFormat("id-ID", {
    notation: "compact",
    compactDisplay: "short",
});

function toFiniteNumber(value: number | null | undefined): number {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function roundToPrecision(n: number, decimals = DECIMAL_PRECISION): number {
    if (!Number.isFinite(n)) return 0;
    const shifted = Number(`${n}e${decimals}`);
    if (!Number.isFinite(shifted)) {
        const factor = 10 ** decimals;
        return Math.round(n * factor) / factor;
    }
    const restored = Number(`${Math.round(shifted)}e${-decimals}`);
    return Number.isFinite(restored) ? restored : n;
}

export function formatDecimal(value: number | null | undefined, decimals = DECIMAL_PRECISION): string {
    const n = toFiniteNumber(value);
    if (decimals === DECIMAL_PRECISION) return decimalFormatter.format(n);
    return new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    }).format(n);
}

function withSatuan(num: string, satuan?: string): string {
    if (!satuan) return num;
    return satuan.toLowerCase() === "rp" ? `Rp${num}` : `${num} ${satuan}`;
}

export function formatNominal(amount: number | null | undefined, satuan?: string): string {
    return withSatuan(formatDecimal(amount), satuan);
}

export function formatQty(value: number | null | undefined, satuan?: string): string {
    return withSatuan(formatDecimal(value), satuan);
}

export function formatPercent(value: number | null | undefined): string {
    return `${formatDecimal(value)}%`;
}

export function formatCompact(value: number | null | undefined, satuan?: string): string {
    const n = toFiniteNumber(value);
    const num = Math.abs(n) < 1000
        ? formatDecimal(n)
        : compactFormatter.format(n).replace(/\s/g, "");

    return withSatuan(num, satuan);
}

export function formatDecimalInput(raw: string): string {
    if (!raw) return "";

    const cleaned = raw.replace(/\./g, "").replace(/[^\d,]/g, "");
    const [intRaw, ...rest] = cleaned.split(",");
    const hasComma = rest.length > 0;

    const decimals = rest.join("").slice(0, DECIMAL_PRECISION);
    const int = intRaw.replace(/^0+(?=\d)/, "");
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    return hasComma ? `${grouped},${decimals}` : grouped;
}

export function toDecimalInput(value: number | null | undefined): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return "";

    const plain = roundToPrecision(value).toFixed(DECIMAL_PRECISION).replace(/\.?0+$/, "");
    return formatDecimalInput(plain.replace(".", ","));
}

export function parseDecimalInput(raw: string): number | null {
    if (!raw) return null;

    const normalized = raw.replace(/\./g, "").replace(",", ".");
    if (normalized === "" || normalized === "." || !/^\d*\.?\d*$/.test(normalized)) return null;

    const n = Number(normalized);
    return Number.isFinite(n) ? roundToPrecision(n) : null;
}
