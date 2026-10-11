const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const BULAN_PANJANG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const HARI_PANJANG = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function parse(iso: string): Date {
    let s = iso.replace(" ", "T");
    if (!s.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(s)) {
        s += "Z";
    }
    return new Date(s);
}

export function formatTanggal(iso: string): string {
    const d = parse(iso);
    return `${d.getDate()} ${BULAN_PENDEK[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTanggalPanjang(iso: string): string {
    const d = parse(iso);
    return `${d.getDate()} ${BULAN_PANJANG[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTanggalDenganHari(iso: string): string {
    const d = parse(iso);
    return `${HARI_PANJANG[d.getDay()]}, ${d.getDate()} ${BULAN_PANJANG[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTanggalPendek(iso: string): string {
    const d = parse(iso);
    return `${d.getDate()} ${BULAN_PENDEK[d.getMonth()]}`;
}

export function formatJam(iso: string): string {
    const d = parse(iso);
    return `${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatTime(timeStr: string): string {
    if (!timeStr) return "";
    const m = timeStr.match(/^(\d{2}:\d{2})(:\d{2})?(?:[+-]\d{2}:\d{2}|Z)?$/);
    if (m) return m[1];
    try {
        const d = new Date(timeStr);
        if (isNaN(d.getTime())) return timeStr;
        return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch { return timeStr; }
}

export function formatTanggalJam(iso: string): string {
    const d = parse(iso);
    return `${d.getDate()} ${BULAN_PENDEK[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatTanggalJamBullet(iso: string): string {
    const d = parse(iso);
    return `${d.getDate()} ${BULAN_PENDEK[d.getMonth()]} ${d.getFullYear()} • ${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatBulanTahun(iso: string): string {
    const d = parse(iso);
    return `${BULAN_PANJANG[d.getMonth()]} ${d.getFullYear()}`;
}
