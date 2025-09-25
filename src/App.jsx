import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SplashScreen from "./SplashScreen";
import PKLManagementSystem from "./login/Login"; 
import DashboardAdmin from "./admin/dashboard_admin"; 
import DashboardAdminJurusan from "./admin/dashboard_admin_jurusan"; 
import { Toaster } from "react-hot-toast";


function App() {
  // const [showSplash, setShowSplash] = useState(true);

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setShowSplash(false);
  //   }, 2000); // tampil 2 detik
  //   return () => clearTimeout(timer);
  // }, []);

  // if (showSplash) {
  //   return <SplashScreen />;
  // }

  return (
    <Router>
      <Toaster position="bottom-right" reverseOrder={false} />

      <Routes>
        {/* Login page */}
        <Route path="/" element={<PKLManagementSystem />} />

        {/* Dashboard admin */}
        <Route path="/dashboard/admin" element={<DashboardAdmin />} />

        {/* Dashboard admin jurusan */}
        <Route path="/dashboard/admin/jurusan" element={<DashboardAdminJurusan />} />
      </Routes>
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        toastOptions={{
          className: 'my-slide-toast', 
          style: {
            background: '#f9f9f9ff',
            color: '#35a71bff',
            border: `2px solid #35a71bff`,
            borderRadius: '8px',
            padding: '8px 16px'
          },
        }}
      />
    </Router>
  );
}

export default App;
