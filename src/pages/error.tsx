import { useNavigate } from 'react-router-dom';
import { FaExclamation, FaArrowLeft } from 'react-icons/fa6';
import '../styles/error.css';

interface ErrorPageProps {
    code?: string | number;
    title?: string;
    description?: string;
}

export default function ErrorPage({ 
    code = 404, 
    title = "Halaman Tidak Ditemukan", 
    description = "Koordinat yang Anda masukkan tidak ada di arsip kami. Tautan mungkin rusak atau sektor telah dihapus."
}: ErrorPageProps) {
    const navigate = useNavigate();

    return (
        <div className="error-container">
            <div className="error-content">
                <div className="error-icon-outer">
                    <div className="error-icon-inner">
                        <FaExclamation className="error-icon" />
                    </div>
                </div>
                <h1 className="error-title">{code} - {title}</h1>
                <p className="error-description">{description}</p>
                <button className="error-back-btn" onClick={() => navigate(-1)}>
                    <FaArrowLeft /> Kembali ke Halaman Sebelumnya
                </button>
            </div>
        </div>
    );
}