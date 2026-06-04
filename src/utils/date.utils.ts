const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const BULAN_PANJANG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function parse(iso: string): Date {
    return new Date(iso.replace(/Z$/, "").replace(" ", "T"));
}

/** "31 Mei 2026" */
export function formatTanggal(iso: string): string {
    const d = parse(iso);
    return `${d.getDate()} ${BULAN_PENDEK[d.getMonth()]} ${d.getFullYear()}`;
}

/** "31 Januari 2026" */
export function formatTanggalPanjang(iso: string): string {
    const d = parse(iso);
    return `${d.getDate()} ${BULAN_PANJANG[d.getMonth()]} ${d.getFullYear()}`;
}

/** "31 Mei" (no year) */
export function formatTanggalPendek(iso: string): string {
    const d = parse(iso);
    return `${d.getDate()} ${BULAN_PENDEK[d.getMonth()]}`;
}

/** "22.39" */
export function formatJam(iso: string): string {
    const d = parse(iso);
    return `${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;
}

/** "31 Mei 2026, 22.39" */
export function formatTanggalJam(iso: string): string {
    const d = parse(iso);
    return `${d.getDate()} ${BULAN_PENDEK[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;
}

/** "31 Mei 2026 • 22.39" */
export function formatTanggalJamBullet(iso: string): string {
    const d = parse(iso);
    return `${d.getDate()} ${BULAN_PENDEK[d.getMonth()]} ${d.getFullYear()} • ${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;
}

/** "Mei 2026" */
export function formatBulanTahun(iso: string): string {
    const d = parse(iso);
    return `${BULAN_PANJANG[d.getMonth()]} ${d.getFullYear()}`;
}
