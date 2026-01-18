import axios from "../../axiosInstance";

/* ================= LIST ACTIVE KEGIATAN ================= */
export const getActiveKegiatanPKL = async () => {
  try {
    const res = await axios.get("/api/kegiatan-pkl/active");
    return res.data;
  } catch (error) {
    console.error("Error fetching active kegiatan PKL:", error);
    throw error;
  }
};

/* ================= GET KEGIATAN BY ID ================= */
export const getKegiatanPKLById = async (id) => {
  try {
    const res = await axios.get(`/api/kegiatan-pkl/${id}`);
    return res.data;
  } catch (error) {
    console.error(`Error fetching kegiatan PKL with id ${id}:`, error);
    throw error;
  }
};
