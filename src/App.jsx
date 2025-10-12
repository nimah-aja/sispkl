import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import PKLManagementSystem from "./login/Login"; 
import DashboardAdmin from "./admin/dashboard_admin"; 
import DashboardAdminJurusan from "./admin/dashboard_admin_jurusan"; 
import DashboardAdminKelas from "./admin/dashboard_admin_kelas"; 
import DashboardAdminSiswa from "./admin/dashboard_admin_siswa"; 
import DashboardAdminGuru from "./admin/dashboard_admin_guru"; 
import DashboardAdminIndustri from "./admin/dashboard_admin_industri"; 
import { Toaster } from "react-hot-toast";

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
        <Route path="/admin" element={<DashboardAdmin />} />
        <Route path="/admin/jurusan" element={<DashboardAdminJurusan />} />
        <Route path="/admin/kelas" element={<DashboardAdminKelas />} />
        <Route path="/admin/siswa" element={<DashboardAdminSiswa />} />
        <Route path="/admin/guru" element={<DashboardAdminGuru />} />
        <Route path="/admin/industri" element={<DashboardAdminIndustri />} />
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
