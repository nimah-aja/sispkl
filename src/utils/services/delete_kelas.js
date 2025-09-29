import axios from "../axiosInstance";

// delete jurusan berdasarkan ID
export const deleteKelas = async (id) => {
  const res = await axios.delete(`/api/kelas/${id}`);
  return res.data;
};
