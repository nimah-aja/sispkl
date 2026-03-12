import axios from "../../axiosInstance";

// update jurusan berdasarkan ID
export const updateJurusan = async (id, data) => {
  const res = await axios.put(`/api/jurusan/${id}`, data);
  return res.data;
};
