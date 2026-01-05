import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Login
import PKLManagementSystem from "./login/login"; 
import RoleOption from "./login/role_option";

// Admin
import DashboardAdmin from "./admin/dashboard_admin"; 
import DashboardAdminJurusan from "./admin/data_jurusan"; 
import DashboardAdminKelas from "./admin/data_kelas"; 
import DashboardAdminSiswa from "./admin/data_siswa"; 
import DashboardAdminGuru from "./admin/data_guru"; 
import DashboardAdminIndustri from "./admin/data_industri"; 

  // WALI KELAS
  import DashboardWaliKelas from  "./wali_kelas/dashboard_walikelas";
  import WalkelSiswa from "./wali_kelas/siswa";
  import WalkelPermasalahan from "./wali_kelas/data_permasalahan_siswa";
  import WalkelPerizinan from "./wali_kelas/data_perizinan_siswa";

// Koordinator
import KoordinatorDashboard from "./koordinator/dashboard_koordinator";
import DataPengajuan from "./koordinator/data_pengajuan";
import DataPeserta from "./koordinator/data_peserta";
import PembimbingKoordinator from "./koordinator/pembimbing";
import DataPengantaran from "./koordinator/data_pengantaran";
import Monitoring from "./koordinator/monitoring";

// Kapro
import KaprodiDashboard from "./kapro/dashboard_kaprog";
import DataIndustriKaprog from "./kapro/data_industri";
import DataPembimbing from "./kapro/data_pembimbing";
import DataPengajuanPindahPKL from "./kapro/pengajuan_pindah_pkl";
import DataPengajuanPKL from "./kapro/pengajuan_pkl";
import DataPerizinan from "./kapro/data_perizinan";
 
 // PEMBIMBING
  import DashboardPembimbing from "./pembimbing/dashboard_pembimbing";
  import PembimbingSiswa from "./pembimbing/siswa";
  import PembimbingPermasalahan from "./pembimbing/permasalahan";
  import PembimbingPerizinan from "./pembimbing/perizinan";
  import Pembimbingperpindahan from "./pembimbing/perpindahan";
  
// Siswa
import DashboardSiswa from "./siswa/Dashboard_siswa";
import FormPengajuan from "./siswa/pengajuan_pkl";
import FormPengajuanPindah from "./siswa/pengajuan_perpindahan_pkl";
import FormPerizinan from "./siswa/perizinan_pkl";
import FormDiterima from "./siswa/bukti_terima";
import RiwayatPengajuan from "./siswa/data_pengajuan";


function AppContent() {
  const navigate = useNavigate();

  useEffect(() => {
    window.reactNavigate = navigate;
  }, [navigate]);

  return (
    <>
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#f9f9f9ff',
            color: '#35a71bff',
            border: `2px solid #35a71bff`,
            borderRadius: '8px',
            padding: '8px 16px',
          },
        }}
      />

      <Routes>
        <Route path="/" element={<PKLManagementSystem />} />

        {/* Admin */}
        <Route path="/admin" element={<DashboardAdmin />} />
        <Route path="/admin/jurusan" element={<DashboardAdminJurusan />} />
        <Route path="/admin/kelas" element={<DashboardAdminKelas />} />
        <Route path="/admin/siswa" element={<DashboardAdminSiswa />} />
        <Route path="/admin/guru" element={<DashboardAdminGuru />} />
        <Route path="/admin/industri" element={<DashboardAdminIndustri />} />
        <Route path="/role" element={<RoleOption />} />

        {/* WALI KELAS */}
        <Route path="/guru/wali_kelas/walikelas" element={<DashboardWaliKelas />} />
        <Route path="/guru/wali_kelas/siswa" element={<WalkelSiswa />} />
        <Route path="/guru/wali_kelas/datapermasalahansiswa" element={<WalkelPermasalahan />} />
        <Route path="/guru/wali_kelas/dataperizinansiswa" element={<WalkelPerizinan />} />

         {/* PEMBIMBING */}
          <Route path="/guru/pembimbing/dashboard_pembimbing" element={<DashboardPembimbing />} />
          <Route path="/guru/pembimbing/siswa" element={<PembimbingSiswa />} />
          <Route path="/guru/pembimbing/permasalahan" element={<PembimbingPermasalahan />} />
          <Route path="/guru/pembimbing/perizinan" element={<PembimbingPerizinan />} />
          <Route path="/guru/pembimbing/perpindahan" element={<Pembimbingperpindahan />} />

        {/* Koordinator */}
        <Route path="/guru/koordinator" element={<KoordinatorDashboard/>}/>
        <Route path="/guru/koordinator/pengajuanPKL" element={<DataPengajuan/>}/>
        <Route path="/guru/koordinator/pesertaPKL" element={<DataPeserta/>}/>
        <Route path="/guru/koordinator/pembimbing" element={<PembimbingKoordinator/>}/>
        <Route path="/guru/koordinator/suratPengantaran" element={<DataPengantaran/>}/>
        <Route path="/guru/koordinator/monitoring" element={<Monitoring/>}/>

        {/* Kapro */}
        <Route path="/guru/kaprodi" element={<KaprodiDashboard/>}/>
        <Route path="/guru/kaprodi/industri" element={<DataIndustriKaprog />}/>
        <Route path="/guru/kaprodi/pembimbing" element={<DataPembimbing />} />
        <Route path="/guru/kaprodi/pengajuan_pindah_pkl" element={<DataPengajuanPindahPKL />} />
        <Route path="/guru/kaprodi/pengajuanPKL" element={<DataPengajuanPKL />} />
        <Route path="/guru/kaprodi/perizinan" element={<DataPerizinan />} />


        {/* Siswa */}
        <Route path="/siswa" element={<DashboardSiswa />} />
        <Route path="/siswa/pengajuan_pkl" element={<FormPengajuan />} />
        <Route path="/siswa/pengajuan_pindah_pkl" element={<FormPengajuanPindah />} />
        <Route path="/siswa/perizinan_pkl" element={<FormPerizinan />} />
        <Route path="/siswa/bukti_terima" element={<FormDiterima />} />
        <Route path="/siswa/riwayat_pengajuan" element={<RiwayatPengajuan />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
