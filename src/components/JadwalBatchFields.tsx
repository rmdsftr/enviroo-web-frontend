import { HARI_OPTIONS, MINGGU_OPTIONS, WEEKDAYS, ALL_WEEKS } from "../constants/jadwal.constants";
import type { JadwalBatchItem } from "../types/jadwal.type";
import "../styles/jadwal-batch.css";

export { WEEKDAYS, ALL_WEEKS };
export type { JadwalBatchItem };

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
