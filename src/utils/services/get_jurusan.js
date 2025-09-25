import axios from "../axiosInstance";

export const getJurusan = async () => {
  const res = await axios.get("/api/jurusan", {
    params: { page: 1, limit: 100 } 
  });

  const jurusanList = res.data.data.data;
  jurusanList.sort((a, b) => a.nama.localeCompare(b.nama));   //sort A-Z

  return jurusanList;
};
