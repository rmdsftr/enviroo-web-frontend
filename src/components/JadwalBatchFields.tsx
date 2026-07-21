import "../styles/jadwal-batch.css";

const HARI_OPTIONS = [
    { label: "Senin",  value: "senin"  }, { label: "Selasa", value: "selasa" },
    { label: "Rabu",   value: "rabu"   }, { label: "Kamis",  value: "kamis"  },
    { label: "Jumat",  value: "jumat"  }, { label: "Sabtu",  value: "sabtu"  },
    { label: "Minggu", value: "minggu" },
];
const MINGGU_OPTIONS = [
    { label: "Minggu ke-1", value: "1" }, { label: "Minggu ke-2", value: "2" },
    { label: "Minggu ke-3", value: "3" }, { label: "Minggu ke-4", value: "4" },
    { label: "Minggu ke-5", value: "5" },
];
export const WEEKDAYS = ["senin", "selasa", "rabu", "kamis", "jumat"];
export const ALL_WEEKS = ["1", "2", "3", "4", "5"];

export interface JadwalBatchItem {
    hari: string;
    minggu_ke: number;
    jam_mulai: string;
    jam_selesai: string;
}

/**
 * Bangun daftar item jadwal dari pilihan hari & minggu.
 * Tiap kombinasi hari × minggu jadi satu item. "Setiap minggu" = minggu 1–5
 * (DB hanya mengizinkan minggu_ke 1–5, tidak ada 0).
 */
export function buildJadwalBatchItems(
    hariList: string[],
    mingguList: string[],
    jamMulai: string,
    jamSelesai: string,
): JadwalBatchItem[] {
    const weeks = mingguList.map(Number);
    const items: JadwalBatchItem[] = [];
    for (const hari of hariList) {
        for (const mk of weeks) {
            items.push({ hari, minggu_ke: mk, jam_mulai: jamMulai, jam_selesai: jamSelesai });
        }
    }
    return items;
}

interface Props {
    hariLabel?: string;
    hariList: string[];
    setHariList: (v: string[]) => void;
    mingguList: string[];
    setMingguList: (v: string[]) => void;
}

export default function JadwalBatchFields({
    hariLabel = "Hari Penimbangan",
    hariList, setHariList,
    mingguList, setMingguList,
}: Props) {
    const isSetiapMinggu = mingguList.length === ALL_WEEKS.length;

    const toggleHari   = (v: string) => setHariList(hariList.includes(v) ? hariList.filter(x => x !== v) : [...hariList, v]);
    const toggleMinggu = (v: string) => setMingguList(mingguList.includes(v) ? mingguList.filter(x => x !== v) : [...mingguList, v]);

    return (
        <>
            <div className="jmodal-field">
                <label className="jmodal-label">{hariLabel}</label>
                <div className="jbatch-quickrow">
                    <button type="button" className="jbatch-quickbtn" onClick={() => setHariList(WEEKDAYS)}>Senin–Jumat</button>
                    <button type="button" className="jbatch-quickbtn" onClick={() => setHariList(HARI_OPTIONS.map(o => o.value))}>Pilih tiap hari</button>
                    {hariList.length > 0 && (
                        <button type="button" className="jbatch-clearbtn" onClick={() => setHariList([])}>Kosongkan</button>
                    )}
                </div>
                <div className="jbatch-chips">
                    {HARI_OPTIONS.map(o => (
                        <button type="button" key={o.value}
                            className={`jbatch-chip ${hariList.includes(o.value) ? "active" : ""}`}
                            onClick={() => toggleHari(o.value)}>{o.label}</button>
                    ))}
                </div>
            </div>
            <div className="jmodal-field">
                <label className="jmodal-label">Minggu ke</label>
                <label className="jbatch-toggle">
                    <input type="checkbox" checked={isSetiapMinggu}
                        onChange={e => setMingguList(e.target.checked ? [...ALL_WEEKS] : [])} />
                    Setiap minggu
                </label>
                <div className="jbatch-chips">
                    {MINGGU_OPTIONS.map(o => (
                        <button type="button" key={o.value}
                            className={`jbatch-chip ${mingguList.includes(o.value) ? "active" : ""}`}
                            onClick={() => toggleMinggu(o.value)}>{o.label}</button>
                    ))}
                </div>
            </div>
        </>
    );
}
