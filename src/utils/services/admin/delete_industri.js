import axios from "../../axiosInstance";

// delete jurusan berdasarkan ID
export const deleteIndustri = async (id) => {
  const res = await axios.delete(`/api/industri/${id}`);
  return res.data;
};
