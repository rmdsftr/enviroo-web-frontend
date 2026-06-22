import { FaCoins, FaBoxOpen, FaBasketShopping } from "react-icons/fa6";
import type { KatalogSembakoItem } from "../types/sembako.type";

export function SembakoCard({ item, onClick }: { item: KatalogSembakoItem; onClick?: () => void }) {
    return (
        <div className="katalog-card" onClick={onClick}>
            <div className="katalog-card-img" style={{ background: "linear-gradient(135deg, rgba(148, 223, 12, 0.15) 0%, rgba(1, 50, 54, 0.05) 100%)", overflow: "hidden" }}>
                {item.photo_url ? (
                    <img src={item.photo_url} alt={item.nama_barang} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <span className="katalog-card-emoji"><FaBasketShopping color="#94DF0C" style={{ opacity: 0.7 }} /></span>
                )}
            </div>
            <div className="katalog-card-body">
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
                    <h3 className="katalog-card-name">{item.nama_barang}</h3>
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <div className="katalog-price-tag price-poin">
                        <FaCoins size={10} />{item.nilai_poin} poin
                    </div>
                    <div className="katalog-price-tag" style={{ background: "rgba(1,50,54,0.06)", color: "var(--k-dark)" }}>
                        <FaBoxOpen size={10} />{item.stok ?? 0}
                    </div>
                </div>
            </div>
        </div>
    );
}
