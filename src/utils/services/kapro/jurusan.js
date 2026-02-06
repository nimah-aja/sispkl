import axios from "../../axiosInstance";

export const getJurusanKaprodi = async () => {
  const res = await axios.get("/api/jurusan/kaprog/me");
  return res.data;
};
