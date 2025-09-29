import axios from "../axiosInstance";

// delete jurusan berdasarkan ID
export const deleteSiswa = async (id) => {
  const res = await axios.delete(`/api/siswa/${id}`);
  return res.data;
};
