import axios from "../../axiosInstance";

/*  LIST ACTIVE KEGIATAN  */
export const getActiveKegiatanPKL = async () => {
  try {
    const res = await axios.get("/api/kegiatan-pkl/active");
    return res.data;
  } catch (error) {
    console.error("Error fetching active kegiatan PKL:", error);
    throw error;
  }
};
