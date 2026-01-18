import axios from "../../axiosInstance";

/* ================= LIST REALISASI SAYA ================= */
export const getMyRealisasiKegiatan = async () => {
  try {
    const res = await axios.get("/api/realisasi-kegiatan/me");
    return res.data;
  } catch (error) {
    console.error("Error fetching my realisasi kegiatan:", error);
    throw error;
  }
};

/* ================= SUBMIT REALISASI ================= */
export const submitRealisasiKegiatan = async (payload) => {
  try {
    const res = await axios.post("/api/realisasi-kegiatan/submit", payload);
    return res.data;
  } catch (error) {
    console.error("Error submitting realisasi kegiatan:", error);
    throw error;
  }
};

/* ================= GET REALISASI BY ID ================= */
export const getRealisasiById = async (id) => {
  try {
    const res = await axios.get(`/api/realisasi-kegiatan/${id}`);
    return res.data;
  } catch (error) {
    console.error(`Error fetching realisasi with id ${id}:`, error);
    throw error;
  }
};
