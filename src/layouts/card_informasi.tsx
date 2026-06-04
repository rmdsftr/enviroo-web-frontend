import { FaPen } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import type { KontenListItem } from "../types/konten.type";
import "../styles/card_informasi.css";

type CardInformasiProps = {
    data: KontenListItem;
};

export default function CardInformasi({ data }: CardInformasiProps) {
    const navigate = useNavigate();

    return (
        <div
            className="info-card"
            onClick={() => navigate(data.konten_id)}
            style={{ cursor: "pointer" }}
        >
            {/* Thumbnail */}
            <div className="info-card__thumb">
                {data.thumbnail ? (
                    <img src={data.thumbnail} alt={data.judul} />
                ) : (
                    <div className="info-card__thumb-placeholder">
                        <span>{data.judul.charAt(0)}</span>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="info-card__body">
                <h3 className="info-card__judul">{data.judul}</h3>
                {data.deskripsi && (
                    <p className="info-card__desc">{data.deskripsi}</p>
                )}
            </div>

            {/* Footer */}
            <div className="info-card__footer">
                <span className="info-card__penulis">
                    <FaPen style={{ fontSize: '9px', color: '#4EA771' }} />
                    <span className="info-card__admin-id">{data.nama_instansi}</span>
                </span>
            </div>
        </div>
    );
}
