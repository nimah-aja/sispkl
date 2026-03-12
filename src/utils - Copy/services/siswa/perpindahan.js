import axios from "../../axiosInstance";

/**
 * CREATE PERPINDAHAN PKL (SISWA)
 * POST /api/pindah-pkl
 * multipart/form-data
 */
export const createPerpindahanPKL = async ({
  industri_baru_id,
  alasan,
  files,
}) => {
  const formData = new FormData();

  formData.append("industri_baru_id", industri_baru_id);
  formData.append("alasan", alasan);

  files.forEach((file) => {
    formData.append("files", file);
  });

  try {
    const res = await axios.post("/api/pindah-pkl", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  } catch (error) {
    throw error;
  }
};


export const getPindahPKLMe = async () => {
  try {
    const res = await axios.get("/api/pindah-pkl/me");
    return res.data;
  } catch (error) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};