import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

// import components
import MouseRippleButton from "./components/MouseRippleButton";

//import request
import axios from "../utils/axiosInstance";
import { refreshAccessToken, removeTokens, setTokens, getAccessToken } from "../utils/authHelper";
import { getSekolah } from "../utils/services/admin/sekolah";


// Import asset
import chatMerah from "../assets/chatmerah.png";
import chatBiru from "../assets/chatbiru.png";
import ellipse9 from "../assets/Ellipse9.png";
import ellipseMerah from "../assets/elipsmerah.png";
import ellipseMerahPutih from "../assets/elipsmerahputih.png";
import ellipseOren from "../assets/elipsoren.png";
import ellipseUngu from "../assets/elipsungu.png";
import vector from "../assets/Vector.png";
import kelompok from "../assets/kelompok.png";
import titik3 from "../assets/titik_3.png";
import kelolaText from "../assets/teks.png";
import norr from "../assets/norr.png";
import inorasiellipse9 from "../assets/inorasiellipse9.png";

export default function PKLManagementSystem() {
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [showPassword, setShowPassword] = useState(false);
  const [activeRole, setActiveRole] = useState("Admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const isSiswa = activeRole === "Siswa";
  const [sekolah, setSekolah] = useState(null);
  const [loadingSekolah, setLoadingSekolah] = useState(true);



  // Auto cek access token / refresh
  useEffect(() => {
    const checkToken = async () => {
      const token = getAccessToken();
      if (!token) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          const role = localStorage.getItem("role");
          switch (role) {
            case "Admin": navigate("/admin"); break;
            case "Guru": navigate("/role"); break;
            case "Siswa": navigate("/siswa"); break;
            default: break;
          }
        }
      } else {
        // token masih valid, redirect
        const role = localStorage.getItem("role");
        switch (role) {
          case "Admin": navigate("/admin"); break;
          case "Guru": navigate("/role"); break;
          case "Siswa": navigate("/siswa"); break;
          default: break;
        }
      }
    };
    checkToken();
  }, []);

  // logo dan nama sekolah
  useEffect(() => {
    const fetchSekolah = async () => {
      try {
        const res = await getSekolah();
        // asumsi API kamu return { success, data }
        setSekolah(res.data);
      } catch (err) {
        console.error("Gagal ambil data sekolah", err);
      } finally {
        setLoadingSekolah(false);
      }
    };

    fetchSekolah();
  }, []);


  // notifikasi toast saat timeout
  const showToast = (msg, type = "success", dur = 4000) => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), dur);
  };

  // ambil input
  const roles = ["Admin","Guru","Siswa"];
  const getInputConfig = () => {
    switch (activeRole) {
      case "Admin": return { firstField: { label: "Username", placeholder: "Masukkan username admin", type: "text" }, secondField: { label: "Kata Sandi", placeholder: "Masukkan kata sandi", type: "password" } };
      case "Guru": return { firstField: { label: "Kode Guru", placeholder: "Masukkan kode guru", type: "text" }, secondField: { label: "Kata Sandi", placeholder: "Masukkan kata sandi", type: "password" } };
      case "Siswa": return { firstField: { label: "Nama Lengkap", placeholder: "Masukkan nama lengkap", type: "text" }, secondField: { label: "NISN", placeholder: "Masukkan NISN", type: "text" } };
      default: return { firstField: { label: "Username", placeholder: "Masukkan username", type: "text" }, secondField: { label: "Password", placeholder: "Masukkan password", type: "password" } };
    }
  };
  const inputConfig = getInputConfig();
  const isPasswordField = inputConfig.secondField.type === "password";

  // handler role
  const handleRoleChange = (role) => {
    setActiveRole(role);
    setUsername("");
    setPassword("");
    setShowPassword(false);
    setError("");
  };

  // handler login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoints = {
      Admin: "/auth/login",
      Guru: "/auth/guru/login",
      Siswa: "/auth/siswa/login",
    };

    // Bentuk payload sesuai role
    let payload = {};
    switch (activeRole) {
      case "Admin":
        payload = {
          username: username.trim(),
          password: password.trim(),
        };
        break;

      case "Guru":
        payload = {
          kode_guru: username.trim(),
          password: password.trim(),
        };
        break;

      case "Siswa":
        payload = {
          nama_lengkap: username.trim(),
          nisn: password.trim(),
        };
        break;
    }


    try {
      const res = await axios.post(endpoints[activeRole], payload);
      const { access_token, refresh_token, user } = res.data;

      //  Validasi role yang dikembalikan dari backend
      if (activeRole === "Admin" && user.role !== "adm") {
        setError("Akun ini bukan Admin!");
        setLoading(false);
        return;
      }
      if (activeRole === "Guru" && user.role !== "gru") {
        setError("Akun ini bukan Guru!");
        setLoading(false);
        return;
      }
      if (activeRole === "Siswa" && user.role !== "ssw") {
        setError("Akun ini bukan Siswa!");
        setLoading(false);
        return;
      }

      // Simpan token
      setTokens({ access_token, refresh_token });

      // Simpan role & user info
      localStorage.setItem("role", activeRole);

      if (user && activeRole === "Guru") {
        localStorage.setItem("kode_guru", user.kode_guru || "");
        localStorage.setItem("nama_guru", user.nama || "");
        localStorage.setItem("is_koordinator", user.is_koordinator ? "true" : "false");
        localStorage.setItem("is_pembimbing", user.is_pembimbing ? "true" : "false");
        localStorage.setItem("is_wali_kelas", user.is_wali_kelas ? "true" : "false");
        localStorage.setItem("is_kaprog", user.is_kaprog ? "true" : "false");
      }

      if (user && activeRole === "Siswa") {
        localStorage.setItem("user", JSON.stringify({
          name: user.nama_lengkap,
          role: "Siswa",
          id: user.id,
          kelas_id: user.kelas_id,
          is_active: user.is_active
        }));
      }


      redirectUser(activeRole);
    } catch (err) {
      console.error(err);
      if (err.code === "ECONNABORTED") {
        showToast("Server timeout", "error");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Login gagal, periksa data Anda.");
      }
    } finally {
      setLoading(false);
    }
  };


const redirectUser = (role) => {
  switch (role) {
    case "Admin":
      navigate("/admin");
      break;
    case "Guru":
      navigate("/role");
      break;
    case "Siswa":
      navigate("/siswa");
      break;
    default:
      break;
  }
};


// auto hapus pesan error setelah ... durasi
useEffect(() => {
  if (error) {
    const timer = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(timer);
  }
}, [error]);

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Sebelah kiri */}
      <div className="flex-1 flex justify-center items-center bg-[#E1D6C4]">
        <div className="relative w-[600px] h-[600px]">

          {/* Lingkaran background logo */}
          <div
            className="absolute w-[280px] h-[280px] rounded-full 
                      top-70 left-1/2 
                      -translate-x-1/2 -translate-y-1/2 
                      z-10"
            style={{ backgroundColor: "#CBC1AF" }}
          />

          {/* Logo Inorasi */}
          <img
            src={inorasiellipse9}
            alt="Inorasi"
            className="absolute w-[420px] 
                      top-1/2 left-1/2 
                      -translate-x-1/2 -translate-y-1/2 
                      z-20"
          />

          {/* Teks */}
          <img
            src={kelolaText}
            alt="Kelola Seluruh Proses"
            className="absolute w-[355px] 
                      top-[460px] left-1/2 
                      -translate-x-1/2 
                      z-30"
          />

          {/* Ornamen */}
          <img
            src={ellipseMerah}
            alt="Ellipse Merah"
            className="absolute w-[130px] left-[-68px] bottom-[-80px] z-10"
          />

          <img
            src={vector}
            alt="Vector"
            className="absolute w-[45px] top-[55px] left-[90px] z-10"
          />

            {/* Border ellipse oren */}
            <div
              className="absolute w-[64px] h-[64px] rounded-full 
                        border-2 border-white
                        top-[95px] left-[395px] 
                        z-11"
            />

            <img
              src={ellipseOren}
              alt="Ellipse Oren"
              className="absolute w-[54px] top-[90px] left-[400px] z-10"
            />


          <img
            src={ellipseMerahPutih}
            alt="Ellipse Merah Putih"
            className="absolute w-[45px] top-[355px] left-[540px] z-20"
          />

          <img
            src={ellipseUngu}
            alt="Ellipse Ungu"
            className="absolute w-[45px] top-[65px] left-[99px] z-10"
          />
        </div>
      </div>

      {/*Sebelah kanan */}
      <div className="flex-1 bg-[#641E20] p-8 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <img
                src={sekolah?.logo_url || norr}
                alt="Logo Sekolah"
                className="w-17 h-17 object-contain"
              />
            </div>
            <h4 className="text-white text-3xl font-bold mb-2 text-left">Sistem Pengelolaan PKL</h4>
            <p className="text-red-200 text-left">
              {sekolah?.nama_sekolah || "Nama Sekolah"}
            </p>
          </div>

          {/* Pilih role*/}
          <div className="mb-6">
            <div className="bg-[#E1D6C4] rounded-full p-1 flex">
              {["Admin","Guru","Siswa"].map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  onMouseEnter={(e) => {
                    if (activeRole !== role) {
                      e.target.style.borderColor = "white";
                      e.target.style.color = "black";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeRole !== role) {
                      e.target.style.borderColor = "transparent";
                      e.target.style.color = "";
                    }
                  }}
                  className={`tab-button ${activeRole === role ? "tab-active" : "tab-inactive"}`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Form login */}
          <form className="space-y-4" onSubmit={handleLogin}>
            {/* Input Username, kode, nisn  */}
            <div>
              <label className="text-white text-lg font-medium mb-2 block">
                {inputConfig.firstField.label}
              </label>
              <input
                type={inputConfig.firstField.type}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={inputConfig.firstField.placeholder}
                title={`Mohon isi kolom ${inputConfig.firstField.label} terlebih dahulu.`}
                className="w-full px-4 py-3 bg-[#E1D6C4] border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-500 pr-12"
                onInvalid={(e) => e.target.setCustomValidity(`Mohon isi kolom ${inputConfig.firstField.label} terlebih dahulu.`)}
                onInput={(e) => e.target.setCustomValidity("")}
                required
              />
            </div>

            {/* Input pw */}
            <div>
              <label className="text-white text-lg font-medium mb-2 block">
                {inputConfig.secondField.label}
              </label>
              <div className="relative">
                <input
                  type={
                    isSiswa
                      ? "text" 
                      : isPasswordField && showPassword
                      ? "text"
                      : inputConfig.secondField.type
                  }
                  value={password}
                  onChange={(e) => {
                    if (isSiswa) {
                      // hanya angka & max 10 digit
                      const onlyNumber = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setPassword(onlyNumber);
                    } else {
                      setPassword(e.target.value);
                    }
                  }}
                  placeholder={inputConfig.secondField.placeholder}
                  inputMode={isSiswa ? "numeric" : undefined}
                  pattern={isSiswa ? "[0-9]{10}" : undefined}
                  maxLength={isSiswa ? 10 : undefined}
                  title={
                    isSiswa
                      ? "NISN harus berupa angka dan maksimal 10 digit"
                      : `Mohon isi kolom ${inputConfig.secondField.label} terlebih dahulu.`
                  }
                  className="w-full px-4 py-3 bg-[#E1D6C4] border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-500 pr-12"
                  onInvalid={(e) =>
                    e.target.setCustomValidity(
                      isSiswa
                        ? "NISN harus berupa angka dan maksimal 10 digit"
                        : `Mohon isi kolom ${inputConfig.secondField.label} terlebih dahulu.`
                    )
                  }
                  onInput={(e) => e.target.setCustomValidity("")}
                  required
                />

                {isPasswordField && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle-btn absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <Eye size={22} /> : <EyeOff size={22} />}
                  </button>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-100 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/*Button masuk */}
            <MouseRippleButton
              type="submit"
              disabled={loading}
              className="w-full text-white font-semibold py-3 px-4 rounded-lg mt-6 disabled:opacity-60"
              style={{ backgroundColor: "#EC933A", border: "none", outline: "none" }} 
            >
              {loading ? "Memproses..." : `Masuk`}
            </MouseRippleButton>


          </form>
        </div>
      </div>
    
      {/* Toast notifikasi */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg transition-transform transform flex items-center gap-2
            ${toast.type === "error" ? "bg-red-500" : "bg-green-500"} 
            text-white animate-slide-in`}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 text-white flex-shrink-0"
          >
            <path
              fill="currentColor"
              d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"
            />
          </svg>
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
  
}
