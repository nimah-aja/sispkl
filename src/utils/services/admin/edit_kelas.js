import axios from "../../axiosInstance";

// update jurusan berdasarkan ID
export const updateKelas= async (id, data) => {
  const res = await axios.put(`/api/kelas/${id}`, data);
  return res.data;
};
