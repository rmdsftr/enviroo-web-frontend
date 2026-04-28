import { useState } from "react";
import { FaFileCirclePlus } from "react-icons/fa6";
import Button from "../../components/button";
import Pagination from "../../components/pagination";
import NavbarLayout from "../../layouts/navbar";
import SidebarLayout from "../../layouts/sidebar";
import CardInformasi from "../../layouts/card_informasi";
import "../../styles/layout.css";
import "../../styles/informasi.css";

// ── Dummy data ────────────────────────────────────────────
const dummyData: InformasiData[] = [
    {
        id: 1,
        judul: "Cara Memilah Sampah Organik dan Anorganik dengan Benar",
        deskripsi: "Panduan lengkap memilah sampah rumah tangga agar proses daur ulang berjalan lebih efektif dan efisien.",
        tanggal: "1 Mar 2026",
        thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDVlWJTjkrhqEzk9F2h9VnXfRPNwEjNONKZw&s",
        dibaca: 1243,
        penulis: "Admin BSI",
    },
    {
        id: 2,
        judul: "Pengumuman: Jadwal Pengambilan Sampah Bulan Maret 2026",
        deskripsi: "Jadwal pengambilan sampah oleh petugas BSU untuk wilayah kota selama bulan Maret 2026.",
        tanggal: "28 Feb 2026",
        thumbnail: "https://wahananews.co/photo/berita/dir062022/pln-peduli-suluttenggo-bangun-bank-sampah-guna-perangi-sampah-plastik_xp3LO5HMdf.jpg",
        dibaca: 874,
        penulis: "Admin BSI",
    },
    {
        id: 3,
        judul: "5 Tips Mengurangi Sampah Plastik di Rumah",
        deskripsi: "Langkah-langkah praktis yang bisa dilakukan sehari-hari untuk meminimalkan penggunaan plastik sekali pakai.",
        tanggal: "25 Feb 2026",
        dibaca: 2108,
        penulis: "Tim Konten",
    },
    {
        id: 4,
        judul: "Regulasi Terbaru Pengelolaan Sampah di Indonesia 2026",
        deskripsi: "Ringkasan peraturan pemerintah terbaru mengenai pengelolaan sampah yang wajib diketahui warga.",
        tanggal: "20 Feb 2026",
        dibaca: 650,
        penulis: "Admin BSI",
    },
    {
        id: 5,
        judul: "Event Bersih-Bersih Kota: Sabtu 15 Maret 2026",
        deskripsi: "Ajakan partisipasi masyarakat dalam kegiatan bersih-bersih kota serentak yang diselenggarakan oleh BSI.",
        tanggal: "18 Feb 2026",
        thumbnail: "https://citarumharum.jabarprov.go.id/eusina/uploads/2021/09/162264_620.jpg",
        dibaca: 3450,
        penulis: "Koordinator Event",
    },
    {
        id: 6,
        judul: "Manfaat Kompos dari Sampah Dapur untuk Tanaman",
        deskripsi: "Sampah dapur seperti kulit buah dan sisa sayuran bisa diolah menjadi pupuk kompos yang kaya nutrisi.",
        tanggal: "15 Feb 2026",
        dibaca: 1879,
        penulis: "Tim Konten",
    },
    {
        id: 7,
        judul: "Mengenal Jenis-Jenis Plastik dan Cara Mendaur Ulangnya",
        deskripsi: "Tidak semua plastik bisa didaur ulang. Kenali kode segitiga pada plastik dan cara penanganannya yang tepat.",
        tanggal: "12 Feb 2026",
        dibaca: 1567,
        penulis: "Admin BSI",
    },
    {
        id: 8,
        judul: "Laporan Kinerja Bank Sampah Induk Kuartal 1 2026",
        deskripsi: "Ringkasan pencapaian dan statistik operasional Bank Sampah Induk selama kuartal pertama tahun 2026.",
        tanggal: "10 Feb 2026",
        dibaca: 412,
        penulis: "Admin BSI",
    },
    {
        id: 9,
        judul: "Sampah Elektronik: Bahaya dan Cara Pembuangan yang Aman",
        deskripsi: "Barang elektronik bekas mengandung bahan berbahaya. Pelajari cara membuangnya dengan benar agar tidak merusak lingkungan.",
        tanggal: "5 Feb 2026",
        dibaca: 988,
        penulis: "Tim Konten",
    },
    {
        id: 10,
        judul: "Festival Daur Ulang Kreatif 2026: Call for Participants",
        deskripsi: "Ikuti festival kreatif tahunan kami dan tampilkan karya inovasi dari bahan daur ulang. Pendaftaran dibuka!",
        tanggal: "1 Feb 2026",
        dibaca: 5120,
        penulis: "Koordinator Event",
    },
    {
        id: 11,
        judul: "Cara Membuat Ecobrick dari Sampah Plastik",
        deskripsi: "Ecobrick adalah bata ramah lingkungan yang dibuat dari botol plastik berisi sampah plastik padat.",
        tanggal: "28 Jan 2026",
        dibaca: 2340,
        penulis: "Tim Konten",
    },
    {
        id: 12,
        judul: "Peraturan Baru Penanganan Limbah Medis Rumah Tangga",
        deskripsi: "Limbah medis seperti masker dan jarum suntik bekas harus ditangani secara khusus. Berikut regulasi terbarunya.",
        tanggal: "25 Jan 2026",
        dibaca: 723,
        penulis: "Admin BSI",
    },
];

const ITEMS_PER_PAGE = 9;

// ── Page ──────────────────────────────────────────────────
export default function InformasiBsiPage() {
    const [page, setPage] = useState(1);

    const totalPages = Math.ceil(dummyData.length / ITEMS_PER_PAGE);
    const start = (page - 1) * ITEMS_PER_PAGE;
    const currentData = dummyData.slice(start, start + ITEMS_PER_PAGE);

    return (
        <div className="app-layout">
            <SidebarLayout />
            <div className="app-right">
                <NavbarLayout />
                <main className="main-content">
                    {/* Header toolbar */}
                    <div className="info-header">
                        <div className="info-header__left">
                            <div className="info-header__title-row">
                                <p className="judul">Kelola Konten Informasi</p>
                                <span className="info-total">{dummyData.length} konten</span>
                            </div>
                            <p className="deskripsi">
                                Pada menu ini, BSI dapat memposting konten edukasi dan informasi terkait bank sampah dan pemilahan sampah
                            </p>
                        </div>
                        <div className="info-header__right">
                            <Button
                                variant="solid"
                                size="default"
                                color="secondary"
                                isRounded
                                icon={<FaFileCirclePlus />}
                            >
                                Unggah Konten
                            </Button>
                        </div>
                    </div>

                    <div className="info-divider"></div>

                    {/* Card grid */}
                    <div className="konten">
                        {currentData.map((item) => (
                            <CardInformasi key={item.id} data={item} />
                        ))}
                    </div>

                    {/* Pagination */}
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                </main>
            </div>
        </div>
    );
}