import axios from "../../axiosInstance";

export const submitPengajuanPKL = async (payload) => {
  const response = await axios.post("/api/pkl/applications", payload);
  return response.data;
};

export const getPengajuanMe = async () => {
  const res = await axios.get("/api/pkl/applications/me");
  return res.data;
};
