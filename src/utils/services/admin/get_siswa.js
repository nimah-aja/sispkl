import axios from "../../axiosInstance";

export const getSiswa = async () => {
  const res = await axios.get("/api/siswa", {
    params: { page: 1, limit: 100 } 
  });

  const siswaList = res.data.data.data;
  siswaList.sort((a, b) => a.nama_lengkap.localeCompare(b.nama_lengkap));   //sort A-Z

  return siswaList;
};

export const getSiswaById = async (id) => {
  const res = await axios.get(`/api/siswa/${id}`);
  return res.data.data;
};


