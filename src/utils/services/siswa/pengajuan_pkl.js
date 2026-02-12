import axios from "../../axiosInstance";

export const submitPengajuanPKL = async (payload) => {
  const response = await axios.post("/api/pkl/applications", payload);
  return response.data;
};

export const getPengajuanMe = async () => {
  const res = await axios.get("/api/pkl/applications/me");
  return res.data;
};

export const getActivePklMe = async () => {
  try {
    const res = await axios.get("/api/pkl/active/me");
    return res.data;
  } catch (error) {
    console.error("❌ getActivePklMe error:", error);
    throw error?.response?.data || error;
  }
};
