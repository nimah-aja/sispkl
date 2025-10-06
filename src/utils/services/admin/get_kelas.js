import axios from "../../axiosInstance";

export const getKelas = async () => {
  const res = await axios.get("/api/kelas", {
    params: { page: 1, limit: 100 } 
  });

  const jurusanList = res.data.data.data;
  jurusanList.sort((a, b) => a.nama.localeCompare(b.nama));   //sort A-Z

  return jurusanList;
};
