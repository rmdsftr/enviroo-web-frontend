import './App.css'
import { Route, Routes } from 'react-router-dom';
import BankListPage from './pages/bank-list';
import BankSuperadminDashboardPage from './pages/superadmin/bank-sampah';
import NasabahPage from './pages/nasabah';
import InformasiPage from './pages/informasi';
import LoginPage from './pages/login';
import DashboardSuperadminPage from './pages/superadmin/dashboard';
import RegistrasiBSIPage from './pages/regis-bank';
import ProfilBankPage from './pages/profil-bank';
import ProfilNasabahPage from './pages/profil-nasabah';
import JadwalPage from './pages/jadwal';
import RootLayout from './layouts/root';
import DashboardBsiPage from './pages/admin_bsi/dashboard';
import DashboardBsuPage from './pages/admin_bsu/dashboard';
import JadwalBsuPage from './pages/admin_bsu/jadwal';
import JadwalBsiPage from './pages/admin_bsi/jadwal';
import DashboardBsmPage from './pages/admin_bsm/dashboard';
import ProfilPage from './pages/profil';
import ErrorPage from './pages/error';
import ProtectedRoute from './components/ProtectedRoute';
import KatalogPage from './pages/katalog';
import NotifikasiPage from './pages/notifikasi';
import UnggahKontenPage from './pages/unggah_konten';
import OpenKontenPage from './pages/open_konten';
import RewardPage from './pages/superadmin/reward';
import PenjualanPage from './pages/penjualan';

function App() {
  return(
    <Routes>
      <Route path='/bank-sampah' element={<BankListPage type="bsu" />} />
      <Route path='/nasabah' element={<NasabahPage />} />
      <Route path='/informasi' element={<InformasiPage />} />
      <Route path='/' element={<LoginPage />} />
      <Route path='/notifikasi' element={<RootLayout />}>
          <Route index element={<NotifikasiPage />} />
      </Route>
      
      {/* Protected Routes for Superadmin */}
      <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
        <Route path='/superadmin' element={<RootLayout />}>
          <Route index element={<DashboardSuperadminPage />} />
          <Route path='bank-sampah' element={<BankSuperadminDashboardPage />} />
          <Route path='bank-sampah/bsi' element={<BankListPage type="bsi" />} />
          <Route path='bank-sampah/bsu' element={<BankListPage type="bsu" />} />
          <Route path='bank-sampah/bsm' element={<BankListPage type="bsm" />} />
          <Route path='nasabah' element={<NasabahPage />} />
          <Route path='bank-sampah/bsi/new' element={<RegistrasiBSIPage />} />
          <Route path='bank-sampah/bsm/new' element={<RegistrasiBSIPage />} />
          <Route path='bank-sampah/bsu/new' element={<RegistrasiBSIPage />} />
          <Route path='bank-sampah/bsi/:id' element={<ProfilBankPage />} />
          <Route path='bank-sampah/bsu/:id' element={<ProfilBankPage />} />
          <Route path='bank-sampah/bsm/:id' element={<ProfilBankPage />} />
          <Route path='nasabah/:id' element={<ProfilNasabahPage />} />
          <Route path='jadwal' element={<JadwalPage />} />
          <Route path='katalog' element={<KatalogPage />} />
          <Route path='reward' element={<RewardPage />} />
          <Route path='informasi' element={<InformasiPage />} />
          <Route path='informasi/new' element={<UnggahKontenPage />} />
          <Route path='informasi/edit/:id' element={<UnggahKontenPage />} />
          <Route path='informasi/:id' element={<OpenKontenPage />} />
        </Route>
      </Route>

      {/* Protected Routes for Admin BSI */}
      <Route element={<ProtectedRoute allowedRoles={['admin_bsi']} />}>
        <Route path='/bsi' element={<RootLayout />}>
          <Route index element={<DashboardBsiPage />} />
          <Route path='bsu' element={<BankListPage type="bsu" />} />
          <Route path='bsu/new' element={<RegistrasiBSIPage />} />
          <Route path='nasabah' element={<NasabahPage />} />
          <Route path='nasabah/:id' element={<ProfilNasabahPage />} />
          <Route path='katalog' element={<KatalogPage />} />
          <Route path='bsu/:id' element={<ProfilBankPage />} />
          <Route path='konten' element={<InformasiPage />} />
          <Route path='jadwal' element={<JadwalBsiPage />} />
          <Route path='konten/new' element={<UnggahKontenPage />} />
          <Route path='konten/edit/:id' element={<UnggahKontenPage />} />
          <Route path='konten/:id' element={<OpenKontenPage />} />
          <Route path='penjualan' element={<PenjualanPage />} />
        </Route>
      </Route>

      {/* Protected Routes for Admin BSU */}
      <Route element={<ProtectedRoute allowedRoles={['admin_bsu']} />}>
        <Route path='/bsu' element={<RootLayout />}>
          <Route index element={<DashboardBsuPage />} />
          <Route path='nasabah' element={<NasabahPage />} />
          <Route path='katalog' element={<KatalogPage />} />
          <Route path='jadwal' element={<JadwalBsuPage />} />
          <Route path='nasabah/:id' element={<ProfilNasabahPage />} />
          <Route path='penjualan' element={<PenjualanPage />} />
        </Route>
      </Route>

      {/* Protected Routes for Admin BSM */}
      <Route element={<ProtectedRoute allowedRoles={['admin_bsm']} />}>
        <Route path='/bsm' element={<RootLayout />}>
          <Route index element={<DashboardBsmPage />} />
          <Route path='katalog' element={<KatalogPage />} />
          <Route path='penjualan' element={<PenjualanPage />} />
        </Route>
      </Route>

      {/* Global Authenticated Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path='/profil' element={<RootLayout />}>
          <Route index element={<ProfilPage />} />
        </Route>
      </Route>
      <Route path='/unauthorized' element={
        <ErrorPage 
          code={403} 
          title="Akses Ditolak" 
          description="Anda tidak memiliki hak akses untuk masuk ke dashboard web ini. Silakan hubungi pihak terkait apabila ini adalah sebuah kesalahan." 
        />
      } />
      <Route path='*' element={<ErrorPage />} />
    </Routes>
  );
}

export default App
