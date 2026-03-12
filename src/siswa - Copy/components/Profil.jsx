import React, { useState } from "react";
import { X, Pencil, Save } from "lucide-react";
import headerBg from "../../assets/maskot.svg";

//  API utils
import { updateGuruProfile } from "../../utils/services/guru/profile";

export default function ProfilePage({ user, onClose, roles = [] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    nip: user?.nip || "",
    guruCode: user?.guruCode || "",
    phone: user?.phone || "",
    role: user?.role || "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const getInitials = (name = "") => {
    if (!name) return "?";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const shortRoleName = (name = "") => {
    const map = {
      "Kepala Program Studi": "Kaprog",
      "Wali Kelas": "Wakel",
      "Pembimbing": "Pembimbing",
      "Koordinator": "Koordinator",
    };
    return map[name] || name;
  };

  //  HANDLE INPUT 
  const handleChange = (e) => {
    const { name, value } = e.target;

    if ((name === "nip" || name === "phone") && !/^\d*$/.test(value)) return;

    let error = "";

    if (name === "nip" && value.length !== 18) {
      error = "NIP harus tepat 18 digit";
    }

    if (name === "phone" && (value.length < 10 || value.length > 13)) {
      error = "Nomor HP harus 10–13 digit";
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  //  SAVE KE API 
  const handleSave = async () => {
    if (errors.nip || errors.phone) return;

    setLoading(true);
    try {
      await updateGuruProfile({
        nama: formData.name,
        nip: formData.nip,
        kode_guru: formData.guruCode,
        no_telp: formData.phone,
      });

      setIsEditing(false);
      alert("Profil berhasil diperbarui");
    } catch (err) {
      console.error(err);
      alert("Gagal memperbarui profil");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full bg-transparent border-none outline-none text-gray-600 p-0";

  return (
    <div
      className="fixed inset-0 z-[10000] flex justify-center items-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white w-[500px] max-w-full rounded-2xl shadow-lg overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="h-42 bg-[#641E21] relative px-6">
          <div
            className="absolute inset-0 bg-[center_25%] bg-cover opacity-0"
            style={{ backgroundImage: `url(${headerBg})` }}
          />

          <div
            className="absolute -bottom-12 left-4 w-24 h-24 rounded-full bg-[#641E21]
            flex items-center justify-center text-white font-bold text-2xl border-4 border-white"
          >
            {getInitials(formData.name)}
          </div>
        </div>

        {/* ROLES */}
        <div className="flex flex-wrap gap-2 mt-2 -mb-10 ml-30">
          {roles.map((role) => (
            <span
              key={role.key}
              className={`text-xs font-semibold px-3 py-1 rounded-full shadow
                ${isEditing ? "text-white" : "bg-white/90 text-gray-800"}`}
              style={isEditing ? { backgroundColor: "#EC933A" } : {}}
            >
              {shortRoleName(role.name)}
            </span>
          ))}
        </div>

        {/* BODY */}
        <div className="pt-16 px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LEFT */}
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {isEditing ? (
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                ) : (
                  formData.name
                )}
              </h1>

              <p className="text-gray-500 mt-1">{formData.role}</p>

              <div className="mt-4">
                <p className="font-medium">NIP</p>
                {isEditing ? (
                  <>
                    <input
                      name="nip"
                      value={formData.nip}
                      onChange={handleChange}
                      maxLength={18}
                      className={inputStyle}
                    />
                    {errors.nip && (
                      <p className="text-red-500 text-xs">{errors.nip}</p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-600">{formData.nip}</p>
                )}
              </div>

              <div className="mt-4">
                <p className="font-medium">Kode Guru</p>
                {isEditing ? (
                  <input
                    name="guruCode"
                    value={formData.guruCode}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                ) : (
                  <p className="text-gray-600">{formData.guruCode}</p>
                )}
              </div>
            </div>

            {/* RIGHT */}
            <div className="mt-25">
              <p className="font-medium">Nomor Telepon</p>
              {isEditing ? (
                <>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={13}
                    className={inputStyle}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs">{errors.phone}</p>
                  )}
                </>
              ) : (
                <p className="text-gray-600">{formData.phone}</p>
              )}

              <div className="mt-6 flex justify-end">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg text-white"
                    style={{ backgroundColor: "#EC933A" }}
                  >
                    <Pencil className="w-4 h-4" /> Edit Profil
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg text-white"
                    style={{ backgroundColor: "#EC933A" }}
                  >
                    <Save className="w-4 h-4" />
                    {loading ? "Menyimpan..." : "Simpan"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
