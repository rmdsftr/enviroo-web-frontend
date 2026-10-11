import { useState } from "react";
import { FaPlus } from "react-icons/fa6";
import Button from "../../components/button";
import PopupNotifikasi from "../../layouts/popup-notifikasi";
import PopupConfirmation from "../../layouts/popup-confirmation";
import JadwalPenimbanganCalendarBsm from "../../layouts/jadwal-penimbangan-calendar-bsm";
import PengaturanJadwalPenimbangan from "../../layouts/pengaturan-jadwal-penimbangan";
import { JadwalPenimbanganFormModal } from "../../modals/JadwalPenimbanganFormModal";
import { useJadwalBsmData } from "../../hooks/useJadwalBsmData";
import type { JadwalEditSeed, JadwalFormValue } from "../../types/jadwal.type";
import "../../styles/jadwal-bsu.css";


export default function JadwalBsmPage() {
    const {
        penimbanganList, loading,
        masterJadwal, masterLoading,
        setCalMonth,
        isSubmitting, submitJadwal, deleteJadwal,
    } = useJadwalBsmData();

    const [isModalOpen, setIsModalOpen]       = useState(false);
    const [editSeed, setEditSeed]             = useState<JadwalEditSeed | null>(null);
    const [deleteJadwalId, setDeleteJadwalId] = useState<string | null>(null);
    const [notif, setNotif] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });

    const openModal = (seed?: JadwalEditSeed) => { setEditSeed(seed ?? null); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setEditSeed(null); };

    const handleSubmit = async (value: JadwalFormValue) => {
        const res = await submitJadwal(value, editSeed);
        if (!res) return;
        setNotif({ show: true, message: res.message, type: res.success ? "success" : "error" });
        if (res.success) closeModal();
    };

    const confirmDelete = async () => {
        if (!deleteJadwalId) return;
        const res = await deleteJadwal(deleteJadwalId);
        setNotif({ show: true, message: res.message, type: res.success ? "success" : "error" });
        setDeleteJadwalId(null);
    };

    
    return (
        <div className="jbsu">

            <div className="jbsu-header">
                <div className="jbsu-header-left">
                    <h1>Manajemen Jadwal</h1>
                    <p>Kelola jadwal penimbangan BSM Anda</p>
                </div>
                <Button variant="solid" color="secondary" isRounded icon={<FaPlus />} onClick={() => openModal()}>
                    Tambah Jadwal Penimbangan
                </Button>
            </div>

            <JadwalPenimbanganCalendarBsm
                jadwalList={penimbanganList}
                loading={loading}
                onMonthChange={(m, y) => setCalMonth({ month: m, year: y })}
            />

            <PengaturanJadwalPenimbangan
                data={masterJadwal}
                loading={masterLoading}
                onEdit={openModal}
                onDelete={setDeleteJadwalId}
            />

            {isModalOpen && (
                <JadwalPenimbanganFormModal
                    initialSeed={editSeed}
                    isSubmitting={isSubmitting}
                    onSubmit={handleSubmit}
                    onClose={closeModal}
                />
            )}

            {notif.show && (
                <PopupNotifikasi message={notif.message} type={notif.type} onClose={() => setNotif(p => ({ ...p, show: false }))} />
            )}
            <PopupConfirmation
                isOpen={!!deleteJadwalId} type="danger" title="Hapus Jadwal"
                message="Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan."
                confirmText="Hapus Jadwal" cancelText="Batal"
                onConfirm={confirmDelete} onCancel={() => setDeleteJadwalId(null)}
            />
        </div>
    );
}
