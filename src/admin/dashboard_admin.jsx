import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// import components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardCard from "./components/DashboardCard";

// import request
import axios from "../utils/axiosInstance";

// import assets
import gradIcon from "../assets/grad.svg";
import bookIcon from "../assets/book.svg";
import usersIcon from "../assets/users.svg";
import chalkIcon from "../assets/chalk.svg";
import corporateIcon from "../assets/corporate.svg";

export default function PKLDashboard() {
  const [active, setActive] = useState("sidebarDashboard");
  const [query, setQuery] = useState("");
  const [dataDisplay, setDataDisplay] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const endpoints = [
    { title: "Jumlah Jurusan", icon: gradIcon, url: "/api/jurusan" },
    { title: "Jumlah Kelas", icon: bookIcon, url: "/api/kelas" },
    { title: "Peserta Didik", icon: usersIcon, url: "/api/siswa" },
    { title: "Jumlah Guru", icon: chalkIcon, url: "/api/guru" },
    { title: "Jumlah Industri", icon: corporateIcon, url: "/api/industri" },
  ];

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const results = await Promise.all(
          endpoints.map(async (ep) => {
            const res = await axios.get(ep.url);
            let total = 0;
            if (res.data?.data?.total_all !== undefined)
              total = Number(res.data.data.total_all) || 0;
            else if (Array.isArray(res.data?.data?.data))
              total = res.data.data.data.length;
            else if (Array.isArray(res.data?.data))
              total = res.data.data.length;
            return { title: ep.title, icon: ep.icon, value: total };
          })
        );
        setDataDisplay(results);
      } catch (err) {
        console.error(err);
        setError("Gagal mengambil data dari server");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // filter
  const filteredDisplay = dataDisplay.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="bg-white min-h-screen w-full">
      <Header query={query} setQuery={setQuery} />
      <div className="flex flex-col md:flex-row">
        {/* Sidebar tampil di md ke atas */}
        <div className="hidden md:block">
          <Sidebar active={active} setActive={setActive} />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-10 rounded-none md:rounded-l-3xl bg-[#E1D6C4] shadow-inner">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center">
              <p className="text-black font-semibold">Loading data...</p>
            </div>
          ) : error ? (
            <div className="col-span-full flex flex-col items-center justify-center bg-red-100 rounded-xl p-6 shadow-md">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
              {filteredDisplay.length > 0 ? (
                filteredDisplay.map((item, idx) => (
                  <DashboardCard
                    key={idx}
                    item={item}
                    onClick={() => {
                      if (item.title === "Jumlah Jurusan")
                        navigate("/dashboard/admin/jurusan");
                      else if (item.title === "Jumlah Kelas")
                        navigate("/dashboard/admin/kelas");
                      else if (item.title === "Peserta Didik")
                        navigate("/dashboard/siswa");
                      else if (item.title === "Jumlah Guru")
                        navigate("/dashboard/guru");
                      else if (item.title === "Jumlah Industri")
                        navigate("/dashboard/industri");
                    }}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center bg-white rounded-xl p-10 shadow-md">
                  <p className="text-gray-600 font-medium">Data tidak ditemukan</p>
                </div>
              )}
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
