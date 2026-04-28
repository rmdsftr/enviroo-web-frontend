import { FaCalendar, FaEllipsisVertical, FaPen } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import type { KontenItem } from "../types/konten.type";
// import { useAuth } from "../contexts/AuthContext";
import "../styles/card_informasi.css";

type CardInformasiProps = {
    data: KontenItem;
};

export default function CardInformasi({ data }: CardInformasiProps) {
    const navigate = useNavigate();
    // const { user } = useAuth();

    const tanggal = new Date(data.CreatedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });


    return (
        <div 
            className="info-card" 
            onClick={() => navigate(data.KontenID)}
            style={{ cursor: "pointer" }}
        >
            {/* Thumbnail */}
            <div className="info-card__thumb">
                {data.Thumbnail ? (
                    <img src={data.Thumbnail} alt={data.Judul} />
                ) : (
                    <div className="info-card__thumb-placeholder">
                        <span>{data.Judul.charAt(0)}</span>
                    </div>
                )}
                <div className="info-card__badge">
                    <FaCalendar />
                    {tanggal}
                </div>
            </div>

            {/* Body */}
            <div className="info-card__body">
                {/* Published / Draft pill */}
                <span className={`info-card__status ${data.IsUploaded ? "published" : "draft"}`}>
                    {data.IsUploaded ? "Dipublikasikan" : "Draft"}
                </span>

                <h3 className="info-card__judul">{data.Judul}</h3>
                {data.Deskripsi && (
                    <p className="info-card__desc">{data.Deskripsi}</p>
                )}
            </div>

            {/* Footer */}
            <div className="info-card__footer">
                <span className="info-card__penulis">
                    <FaPen style={{ fontSize: '9px', color: '#4EA771' }} />
                    <span className="info-card__admin-id">{data.nama_admin || data.AdminID}</span>
                </span>
                <div className="info-card__actions">

                    <button
                        className="info-card__action-btn"
                        title="Opsi"
                        onClick={(e) => {
                            e.stopPropagation(); // Biar kardus g lari
                        }}
                    >
                        <FaEllipsisVertical />
                    </button>
                </div>
            </div>
        </div>
    );
}