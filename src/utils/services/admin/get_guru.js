import axios from "../../axiosInstance";

export const getGuru = async () => {
  const res = await axios.get("/api/guru", {
    params: { page: 1, limit: 100 } 
  });

  const guruList = res.data.data.data;
  guruList.sort((a, b) => a.nama.localeCompare(b.nama));
  return guruList;
};

/**
 * Ambil guru berdasarkan processed_by (guru.id)
 */
export const fetchGuruById = async (id) => {
  try {
    const res = await axios.get(`/api/guru/${id}`);
    return res.data.data; // Perhatikan ini: res.data.data bukan res.data
  } catch (err) {
    console.error("Fetch guru error:", err);
    return null;
  }
};

/**
 * Mapping guru → user shape (buat surat / profile)
 */
export const mapGuruToUser = (guru) => {
  if (!guru) return null;

  return {
    id: guru.id,
    name: guru.nama ?? "-",
    nip: guru.nip ?? "-",
    guruCode: guru.kode_guru ?? "-",
    phone: guru.no_telp ?? "-",
    role: "Kepala Program Keahlian",
  };
};