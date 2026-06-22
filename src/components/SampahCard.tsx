import { FaCoins, FaBoxOpen } from "react-icons/fa6";
import type { KatalogSampah } from "../types/katalog.type";

export function SampahCard({ item, onClick }: { item: KatalogSampah; onClick?: () => void }) {
    return (
        <div className="katalog-card" onClick={onClick}>
            <div className="katalog-card-img" style={{ background: "linear-gradient(135deg, rgba(78, 167, 113, 0.15) 0%, rgba(1, 50, 54, 0.05) 100%)", overflow: "hidden" }}>
                {item.photo_url ? (
                    <img src={item.photo_url} alt={item.nama_sampah} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <span className="katalog-card-emoji"><FaBoxOpen color="#4EA771" style={{ opacity: 0.7 }} /></span>
                )}
            </div>
            <div className="katalog-card-body">
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
                    <h3 className="katalog-card-name">{item.nama_sampah}</h3>
                    <div style={{ fontSize: "11.5px", color: "var(--k-muted)" }}>{item.kategori?.Kategori || "-"}</div>
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <div className="katalog-price-tag price-poin">
                        <FaCoins size={10} />
                        {item.reward?.NamaReward || "-"}
                    </div>
                    <div className="katalog-price-tag" style={{ background: "rgba(1,50,54,0.06)", color: "var(--k-dark)" }}>
                        <FaBoxOpen size={10} />
                        {item.stok ?? 0} {item.satuan}
                    </div>
                </div>
            </div>
        </div>
    );
}
